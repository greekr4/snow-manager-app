import { useAuth } from "@/stores/authStore";
import axios from "axios";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

const { height: screenHeight } = Dimensions.get("window");

// 안전한 projectId 해석 함수 (EAS 빌드/개발 클라이언트/환경변수 등 모두 대응)
function resolveExpoProjectId(): string | null {
  const fromEas = (Constants as any)?.easConfig?.projectId;
  if (typeof fromEas === "string" && fromEas.length > 0) return fromEas;
  const fromEnv = (process as any)?.env?.EXPO_PUBLIC_EAS_PROJECT_ID;
  if (typeof fromEnv === "string" && fromEnv.length > 0) return fromEnv;
  const fromExpoConfig = (Constants as any)?.expoConfig?.extra?.eas?.projectId;
  if (typeof fromExpoConfig === "string" && fromExpoConfig.length > 0)
    return fromExpoConfig;
  return null;
}

// 안전한 Expo 푸시 토큰 발급 (projectId 지정 → 실패 시 무옵션 폴백)
async function getExpoPushTokenSafe(): Promise<string | null> {
  try {
    const projectId = resolveExpoProjectId();
    if (projectId) {
      try {
        const res = await Notifications.getExpoPushTokenAsync({ projectId });
        return res.data ?? null;
      } catch (err) {
        // projectId 지정 실패 시 무옵션 재시도
      }
    }
    const res = await Notifications.getExpoPushTokenAsync();
    return res.data ?? null;
  } catch {
    return null;
  }
}

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, isLoading, user, token, loginWithToken, updateUser } =
    useAuth();
  const slideAnim = useRef(new Animated.Value(screenHeight)).current;
  const [isVisible, setIsVisible] = useState(false);
  const passwordInputRef = useRef<TextInput | null>(null);

  useEffect(() => {
    // 컴포넌트 마운트 시 drawer를 아래에서 올림
    handleOpen();
  }, []);

  const handleOpen = () => {
    setIsVisible(true);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const handleClose = () => {
    Animated.timing(slideAnim, {
      toValue: screenHeight,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setIsVisible(false);
    });
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("오류", "이메일과 비밀번호를 입력해주세요.");
      return;
    }

    try {
      await login(email, password);
      Alert.alert("성공", "로그인되었습니다!");

      // 1) 입력 아이디로 관리자 조회 (ADMIN_KEY 수신)
      let adminKey: string | undefined;
      try {
        const res = await axios.get(
          `http://210.114.18.110:3333/users/id/${email}`
        );
        const raw = res.data;
        const admin = Array.isArray(raw) ? raw[0] : raw;
        adminKey = admin?.ADMIN_KEY;

        if (adminKey) {
          // 현재 토큰 유지하며 사용자 정보를 ADMIN_KEY로 갱신
          const updatedUser = {
            ...user,
            id: adminKey, // 호환성을 위해 id에도 반영
            adminKey,
            name: admin?.ADMIN_NAME || user?.name || "사용자",
            email: admin?.ADMIN_ID || email,
          } as any;
          loginWithToken(token || "", updatedUser);
          updateUser({ pushToken: null, pushEnabled: false });
        }
      } catch (e) {
        console.log("관리자 조회 실패 (users/:id):", e);
      }

      // 2) 로그인 직후 서버에 푸시 설정 동기화 (ADMIN_KEY 사용)
      try {
        let pushToken: string | null = null;
        if (Device.isDevice) {
          // 권한 확인 및 요청 (실패해도 앱이 종료되지 않도록 안전 처리)
          let status: Notifications.PermissionStatus | undefined;
          try {
            const perms = await Notifications.getPermissionsAsync();
            status = perms.status;
          } catch (err) {
            console.log("푸시 권한 조회 실패", err);
          }
          if (status !== "granted") {
            try {
              const req = await Notifications.requestPermissionsAsync();
              status = req.status;
            } catch (err) {
              console.log("푸시 권한 요청 실패", err);
            }
          }

          if (status === "granted") {
            try {
              pushToken = await getExpoPushTokenSafe();
            } catch (tokenErr) {
              console.log("푸시 토큰 발급 실패", tokenErr);
              Alert.alert(
                "알림",
                "푸시 토큰 발급 실패. 알림 비활성화 상태로 계속 진행합니다."
              );
            }
          }
        }

        const keyForPatch = adminKey || user?.adminKey || user?.id;
        if (keyForPatch) {
          try {
            await axios.patch(
              `http://210.114.18.110:3333/users/${keyForPatch}`,
              {
                pushToken: pushToken ?? null,
                pushEnabled: true,
              }
            );
          } catch (patchErr) {
            console.log("푸시 설정 동기화 실패", patchErr);
            // 서버 동기화 실패해도 로그인은 계속 진행
          }
        }
      } catch (e) {
        console.log("로그인 후 푸시 동기화 실패(최상위)", e);
        // 어떤 에러도 여기서 앱 종료 없이 흡수
      }
    } catch (error) {
      Alert.alert("오류", `로그인에 실패했습니다. ${(error as any).message}`);
    }
  };

  const handleDemoLogin = async () => {
    try {
      await login("demo@example.com", "password");
      Alert.alert("성공", "데모 로그인되었습니다!");
    } catch (error) {
      Alert.alert("오류", "데모 로그인에 실패했습니다.");
    }
  };

  return (
    <View style={styles.container}>
      {/* 배경 화면 */}
      <View style={styles.background}>
        <View style={styles.logoContainer}>
          <Text style={styles.logo}>❄️</Text>
          <Text style={styles.appName}>스노우 매니저</Text>
          <Text style={styles.welcomeText}>
            스노우 관리자 앱에 오신 것을 환영합니다
          </Text>
        </View>
        <View style={styles.loginButtonContainer}>
          <TouchableOpacity
            style={styles.mainLoginButton}
            onPress={handleOpen}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.loginButtonText}>로그인</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* 로그인 Drawer */}
      <Modal
        visible={isVisible}
        transparent={true}
        animationType="none"
        onRequestClose={handleClose}
      >
        <TouchableWithoutFeedback onPress={handleClose}>
          <View style={styles.overlay}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <Animated.View
                style={[
                  styles.drawer,
                  {
                    transform: [{ translateY: slideAnim }],
                  },
                ]}
              >
                <View style={styles.handle} />

                <KeyboardAwareScrollView
                  contentContainerStyle={styles.content}
                  enableOnAndroid={true}
                  extraScrollHeight={50}
                  enableAutomaticScroll={true}
                  enableResetScrollToCoords={false}
                  keyboardOpeningTime={0}
                  keyboardShouldPersistTaps="handled"
                  keyboardDismissMode="on-drag"
                  showsVerticalScrollIndicator={false}
                >
                  <Text style={styles.title}>로그인</Text>
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={styles.input}
                      placeholder="아이디"
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="default"
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={!isLoading}
                      returnKeyType="next"
                      blurOnSubmit={false}
                      onSubmitEditing={() => passwordInputRef.current?.focus()}
                    />
                    <TextInput
                      ref={passwordInputRef}
                      style={styles.input}
                      placeholder="비밀번호"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={!isLoading}
                      returnKeyType="done"
                      onSubmitEditing={handleLogin}
                    />
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.loginButton,
                      isLoading && styles.disabledButton,
                    ]}
                    onPress={handleLogin}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <Text style={styles.loginButtonText}>로그인</Text>
                    )}
                  </TouchableOpacity>
                  {/* <TouchableOpacity
                    style={[
                      styles.demoButton,
                      isLoading && styles.disabledButton,
                    ]}
                    onPress={handleDemoLogin}
                    disabled={isLoading}
                  >
                    <Text style={styles.demoButtonText}>
                      데모 로그인 (테스트용)
                    </Text>
                  </TouchableOpacity> */}
                </KeyboardAwareScrollView>
              </Animated.View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    justifyContent: "center",
    alignItems: "center",
  },
  logoContainer: {
    alignItems: "center",
    paddingHorizontal: 40,
  },
  logo: {
    fontSize: 80,
    marginBottom: 20,
  },
  appName: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  welcomeText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  drawer: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    minHeight: screenHeight * 0.6,
    maxHeight: screenHeight * 0.8,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: "#ddd",
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 12,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    color: "#333",
    marginVertical: 15,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 30,
    color: "#666",
  },
  inputContainer: {
    marginBottom: 25,
  },
  input: {
    backgroundColor: "#f8f9fa",
    paddingHorizontal: 15,
    paddingVertical: 15,
    borderRadius: 12,
    marginBottom: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  loginButtonContainer: {
    alignSelf: "stretch",
    marginVertical: 12,
    paddingHorizontal: 20,
  },
  mainLoginButton: {
    width: "100%",
    backgroundColor: "#007AFF",
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#007AFF",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  loginButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#007AFF",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  loginButtonText: {
    color: "white",
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
  },
  demoButton: {
    backgroundColor: "#34C759",
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: "#34C759",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  demoButtonText: {
    color: "white",
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
  },
  disabledButton: {
    opacity: 0.6,
  },
});
