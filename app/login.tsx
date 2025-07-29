import { useAuth } from "@/stores/authStore";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

const { height: screenHeight } = Dimensions.get("window");

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, isLoading } = useAuth();
  const slideAnim = useRef(new Animated.Value(screenHeight)).current;
  const [isVisible, setIsVisible] = useState(false);

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
    } catch (error) {
      Alert.alert("오류", "로그인에 실패했습니다.");
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

                <KeyboardAvoidingView
                  behavior={Platform.OS === "ios" ? "padding" : "height"}
                  style={styles.content}
                >
                  <Text style={styles.title}>로그인</Text>
                  <Text style={styles.subtitle}>계정에 로그인하세요</Text>

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
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="비밀번호"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={!isLoading}
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

                  <TouchableOpacity
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
                  </TouchableOpacity>
                </KeyboardAvoidingView>
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
    marginBottom: 8,
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
    marginBottom: 8,
    color: "#333",
    marginTop: 20,
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
