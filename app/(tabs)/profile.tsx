import { TabBarMargin } from "@/components/global/TabBarMargin";
import { useAuth } from "@/stores/authStore";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const STORAGE_KEYS = {
  notificationsEnabled: "settings.notificationsEnabled",
  expoPushToken: "settings.expoPushToken",
};

// 알림 처리 기본 동작 설정 (포그라운드에서 알림 표시)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    // SDK 53 타입 호환 필드
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function registerForPushNotificationsAsync(): Promise<{
  token: string | null;
  debug: string;
}> {
  try {
    const logs: string[] = [];
    if (!Device.isDevice) {
      const msg =
        "시뮬레이터/에뮬레이터에서는 푸시 토큰 발급이 제한될 수 있습니다.";
      logs.push("Device check: not a real device");
      Alert.alert("알림", msg);
      return { token: null, debug: logs.join("\n") };
    }

    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    logs.push(`Permissions existing: ${existingStatus}`);
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
      logs.push(`Permissions requested -> ${status}`);
    }
    if (finalStatus !== "granted") {
      const msg = "푸시 알림 권한이 거부되었습니다.";
      logs.push("Permission not granted");
      Alert.alert("권한 필요", msg);
      return { token: null, debug: logs.join("\n") };
    }

    const PROJECT_ID =
      (Constants as any)?.expoConfig?.extra?.eas?.projectId ||
      (Constants as any)?.easConfig?.projectId ||
      (process as any)?.env?.EXPO_PUBLIC_EAS_PROJECT_ID;
    logs.push(`ProjectId: ${PROJECT_ID || "<none>"}`);

    try {
      const tokenResponse = await Notifications.getExpoPushTokenAsync(
        PROJECT_ID ? { projectId: PROJECT_ID } : undefined
      );
      const token = tokenResponse.data;
      logs.push(`getExpoPushTokenAsync success: ${!!token}`);
      await AsyncStorage.setItem(STORAGE_KEYS.expoPushToken, token);
      return { token, debug: logs.join("\n") };
    } catch (err: any) {
      const errMsg = err?.message || JSON.stringify(err);
      logs.push(`getExpoPushTokenAsync error: ${errMsg}`);
      Alert.alert("푸시 토큰 발급 오류", String(errMsg));
      return { token: null, debug: logs.join("\n") };
    }
  } catch (error: any) {
    const msg = error?.message || String(error);
    Alert.alert("푸시 권한/토큰 설정 오류", msg);
    return { token: null, debug: msg };
  }
}

export default function ProfileScreen() {
  const { user, logout, isLoading, updateUser } = useAuth();
  const router = useRouter();
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(
    user?.pushEnabled ?? true
  );
  const [pushDebug, setPushDebug] = useState<string | null>(null);
  const [pushToken, setPushToken] = useState<string | null>(null);

  // 초기 상태 동기화: DB의 pushEnabled 우선 반영, 없으면 로컬 스토리지 참고
  useEffect(() => {
    (async () => {
      if (typeof user?.pushEnabled === "boolean") {
        setNotificationsEnabled(!!user.pushEnabled);
      }
      const savedToken = await AsyncStorage.getItem(STORAGE_KEYS.expoPushToken);
      if (savedToken) setPushToken(savedToken);
      const n = await AsyncStorage.getItem(STORAGE_KEYS.notificationsEnabled);
      if (n !== null) setNotificationsEnabled(n === "true");
    })();
  }, [user?.pushEnabled]);

  const handleLogout = async () => {
    Alert.alert("로그아웃", "정말 로그아웃하시겠습니까?", [
      { text: "취소", style: "cancel" },
      {
        text: "로그아웃",
        style: "destructive",
        onPress: async () => {
          try {
            await logout();
            // 루트 레이아웃에서 로그인 상태에 따라 라우팅 처리
          } catch (error) {
            console.error("로그아웃 실패:", error);
            Alert.alert("오류", "로그아웃에 실패했습니다.");
          }
        },
      },
    ]);
  };

  const onToggleNotifications = async (value: boolean) => {
    setNotificationsEnabled(value);
    await AsyncStorage.setItem(
      STORAGE_KEYS.notificationsEnabled,
      String(value)
    );

    try {
      let tokenToUse: string | null = null;
      if (value) {
        const { token, debug } = await registerForPushNotificationsAsync();
        tokenToUse = token;
        setPushDebug(debug || null);
        setPushToken(token || null);
        if (!token) {
          Alert.alert(
            "알림",
            `푸시 토큰 발급에 실패했습니다.\n\n원인:\n${debug}`
          );
        }
      }

      // 서버에 현재 사용자 푸시 설정 업데이트
      const adminKey = user?.adminKey || user?.id;
      if (adminKey) {
        await axios.patch(`https://snowplanet.co.kr/nest/users/${adminKey}`, {
          pushToken: value ? tokenToUse : null,
          pushEnabled: value,
        });
        updateUser({
          pushToken: value ? tokenToUse ?? null : null,
          pushEnabled: value,
        });
      }
    } catch (err) {
      console.error("사용자 푸시 설정 업데이트 실패:", err);
    }
  };

  const handleTestNotification = async () => {
    try {
      if (!notificationsEnabled) {
        Alert.alert("알림 비활성화", "알림 스위치를 먼저 켜주세요.");
        return;
      }

      // 권한 확인/요청
      const perms = await Notifications.getPermissionsAsync();
      if (perms.status !== "granted") {
        const req = await Notifications.requestPermissionsAsync();
        if (req.status !== "granted") {
          Alert.alert("권한 필요", "알림 권한이 필요합니다.");
          return;
        }
      }

      // 단순 로컬 알림 (사운드/진동 제어 제거)
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "푸시 알림 테스트",
          body: "프로필 화면에서 발송된 테스트 알림입니다.",
        },
        trigger: null,
      });
    } catch (e) {
      console.error("알림 테스트 오류:", e);
      Alert.alert("오류", "알림을 표시하는 중 오류가 발생했습니다.");
    }
  };

  const handleExpoRemoteTest = async () => {
    try {
      if (!pushToken) {
        Alert.alert("토큰 없음", "유효한 푸시 토큰이 없습니다.");
        return;
      }
      const message = {
        to: pushToken,
        sound: "default",
        title: "원격 푸시 테스트",
        body: "Expo Push API를 통해 전송된 테스트 메시지입니다.",
        data: { route: "/(tabs)" },
      };
      const resp = await axios.post(
        "https://exp.host/--/api/v2/push/send",
        message,
        {
          headers: { "Content-Type": "application/json" },
          timeout: 15000,
        }
      );
      const info =
        typeof resp?.data === "string"
          ? resp.data
          : JSON.stringify(resp?.data, null, 2);
      Alert.alert("전송됨", `Expo Push API 응답:\n\n${info}`);
    } catch (e: any) {
      Alert.alert("전송 실패", e?.message || "네트워크 오류");
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* 프로필 정보 */}
      <View style={styles.Card}>
        <Text style={styles.CardTitle}>프로필 정보</Text>

        <View style={styles.profileSection}>
          <TouchableOpacity onPress={() => {}} style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.name?.charAt(0) || user?.email?.charAt(0) || "김"}
              </Text>
            </View>
            <View style={styles.cameraIcon}>
              <Ionicons name="camera" size={16} color="#fff" />
            </View>
          </TouchableOpacity>

          <View style={styles.profileInfo}>
            <Text style={styles.name}>{user?.name}</Text>
            <Text style={styles.position}>관리자</Text>
            <Text style={styles.email}>{user?.email}</Text>
          </View>
        </View>
      </View>

      {/* 계정 정보 */}
      <View style={styles.Card}>
        <Text style={styles.CardTitle}>계정 정보</Text>

        <View style={styles.infoContainer}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>사용자 KEY</Text>
            <Text style={styles.infoValue}>{user?.id || "user123"}</Text>
          </View>

          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>계정 상태</Text>
            <View style={styles.statusContainer}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>활성</Text>
            </View>
          </View>

          {/* <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>가입일</Text>
            <Text style={styles.infoValue}>2024.01.15</Text>
          </View> */}
        </View>
      </View>

      {/* 알림 설정 */}
      <View style={styles.Card}>
        <Text style={styles.CardTitle}>알림 설정</Text>

        <View style={styles.settingContainer}>
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons
                name="notifications"
                size={20}
                color="#666"
                style={styles.settingIcon}
              />
              <Text style={styles.settingLabel}>푸시 알림</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={onToggleNotifications}
              trackColor={{ false: "#767577", true: "#007AFF" }}
              thumbColor={notificationsEnabled ? "#fff" : "#f4f3f4"}
            />
          </View>
          {/* {pushDebug ? (
            <View style={{ marginTop: 8 }}>
              <Text style={{ color: "#666", fontSize: 12 }}>{pushDebug}</Text>
            </View>
          ) : null} */}

          {/* {pushToken ? (
            <View style={{ marginTop: 8 }}>
              <Text style={{ color: "#333", fontSize: 12 }} numberOfLines={2}>
                Token: {pushToken}
              </Text>
              <View style={{ flexDirection: "row", gap: 10, marginTop: 8 }}>
                <TouchableOpacity
                  onPress={handleExpoRemoteTest}
                  style={{
                    backgroundColor: "#28a745",
                    paddingVertical: 8,
                    paddingHorizontal: 12,
                    borderRadius: 6,
                  }}
                >
                  <Text style={{ color: "#fff", fontWeight: "600" }}>
                    원격 테스트 전송
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : null} */}

          {/* <View style={[styles.settingItem, { justifyContent: "flex-end" }]}>
            <TouchableOpacity
              onPress={handleTestNotification}
              style={{
                backgroundColor: "#007AFF",
                paddingVertical: 10,
                paddingHorizontal: 16,
                borderRadius: 8,
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "600" }}>
                푸시 알림 테스트
              </Text>
            </TouchableOpacity>
          </View> */}
        </View>
      </View>

      {/* 로그아웃 버튼 */}
      <View style={styles.Card}>
        <TouchableOpacity
          style={[styles.logoutButton, isLoading && styles.disabledButton]}
          onPress={handleLogout}
          disabled={isLoading}
        >
          <Ionicons
            name="log-out-outline"
            size={20}
            color="#fff"
            style={styles.logoutIcon}
          />
          <Text style={styles.logoutButtonText}>
            {isLoading ? "로그아웃 중..." : "로그아웃"}
          </Text>
        </TouchableOpacity>
      </View>
      <TabBarMargin />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F0F2F5" },
  Card: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 15,
    marginHorizontal: 20,
    marginVertical: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  CardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 15,
  },
  profileSection: { flexDirection: "row", alignItems: "center" },
  avatarContainer: { position: "relative", marginRight: 20 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: { fontSize: 32, fontWeight: "bold", color: "white" },
  cameraIcon: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#007AFF",
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  profileInfo: { flex: 1 },
  name: { fontSize: 24, fontWeight: "600", color: "#333", marginBottom: 5 },
  position: {
    fontSize: 16,
    color: "#007AFF",
    fontWeight: "500",
    marginBottom: 5,
  },
  email: { fontSize: 14, color: "#666" },
  infoContainer: { gap: 15 },
  infoItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  infoLabel: { fontSize: 14, color: "#666", fontWeight: "500" },
  infoValue: { fontSize: 14, color: "#333", fontWeight: "500" },
  statusContainer: { flexDirection: "row", alignItems: "center" },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#4CAF50",
    marginRight: 8,
  },
  statusText: { fontSize: 14, color: "#4CAF50", fontWeight: "500" },
  settingContainer: { gap: 15 },
  settingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  settingInfo: { flexDirection: "row", alignItems: "center" },
  settingIcon: { marginRight: 12 },
  settingLabel: { fontSize: 14, color: "#333", fontWeight: "500" },
  logoutButton: {
    backgroundColor: "#FF3B30",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  logoutIcon: { marginRight: 8 },
  logoutButtonText: { color: "white", fontSize: 16, fontWeight: "600" },
  disabledButton: { opacity: 0.6 },
});
