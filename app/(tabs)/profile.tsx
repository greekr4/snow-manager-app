import { TabBarMargin } from "@/components/global/TabBarMargin";
import { useAuth } from "@/stores/authStore";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function ProfileScreen() {
  const { user, logout, isLoading } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(false);

  const handleLogout = async () => {
    Alert.alert("로그아웃", "정말 로그아웃하시겠습니까?", [
      {
        text: "취소",
        style: "cancel",
      },
      {
        text: "로그아웃",
        style: "destructive",
        onPress: async () => {
          try {
            console.log("로그아웃 시작...");
            await logout();
            console.log("로그아웃 완료");
          } catch (error) {
            console.error("로그아웃 실패:", error);
            Alert.alert("오류", "로그아웃에 실패했습니다.");
          }
        },
      },
    ]);
  };

  const handleChangeProfilePhoto = () => {
    Alert.alert("프로필 사진 변경", "프로필 사진을 변경하시겠습니까?", [
      {
        text: "취소",
        style: "cancel",
      },
      {
        text: "갤러리에서 선택",
        onPress: () => {
          // 갤러리에서 사진 선택 로직
          console.log("갤러리에서 사진 선택");
        },
      },
      {
        text: "카메라로 촬영",
        onPress: () => {
          // 카메라로 촬영 로직
          console.log("카메라로 촬영");
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* 프로필 정보 */}
      <View style={styles.Card}>
        <Text style={styles.CardTitle}>프로필 정보</Text>

        <View style={styles.profileSection}>
          <TouchableOpacity
            onPress={handleChangeProfilePhoto}
            style={styles.avatarContainer}
          >
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
            <Text style={styles.name}>김태균</Text>
            <Text style={styles.position}>대리</Text>
            <Text style={styles.email}>{user?.email}</Text>
          </View>
        </View>
      </View>

      {/* 계정 정보 */}
      <View style={styles.Card}>
        <Text style={styles.CardTitle}>계정 정보</Text>

        <View style={styles.infoContainer}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>사용자 ID</Text>
            <Text style={styles.infoValue}>{user?.id || "user123"}</Text>
          </View>

          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>계정 상태</Text>
            <View style={styles.statusContainer}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>활성</Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>가입일</Text>
            <Text style={styles.infoValue}>2024.01.15</Text>
          </View>
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
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: "#767577", true: "#007AFF" }}
              thumbColor={notificationsEnabled ? "#fff" : "#f4f3f4"}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons
                name="volume-high"
                size={20}
                color="#666"
                style={styles.settingIcon}
              />
              <Text style={styles.settingLabel}>알림음</Text>
            </View>
            <Switch
              value={soundEnabled}
              onValueChange={setSoundEnabled}
              trackColor={{ false: "#767577", true: "#007AFF" }}
              thumbColor={soundEnabled ? "#fff" : "#f4f3f4"}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons
                name="phone-portrait"
                size={20}
                color="#666"
                style={styles.settingIcon}
              />
              <Text style={styles.settingLabel}>진동</Text>
            </View>
            <Switch
              value={vibrationEnabled}
              onValueChange={setVibrationEnabled}
              trackColor={{ false: "#767577", true: "#007AFF" }}
              thumbColor={vibrationEnabled ? "#fff" : "#f4f3f4"}
            />
          </View>
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
  container: {
    flex: 1,
    backgroundColor: "#F0F2F5",
  },
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
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarContainer: {
    position: "relative",
    marginRight: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "white",
  },
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
  profileInfo: {
    flex: 1,
  },
  name: {
    fontSize: 24,
    fontWeight: "600",
    color: "#333",
    marginBottom: 5,
  },
  position: {
    fontSize: 16,
    color: "#007AFF",
    fontWeight: "500",
    marginBottom: 5,
  },
  email: {
    fontSize: 14,
    color: "#666",
  },
  infoContainer: {
    gap: 15,
  },
  infoItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#4CAF50",
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    color: "#4CAF50",
    fontWeight: "500",
  },
  settingContainer: {
    gap: 15,
  },
  settingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  settingInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  settingIcon: {
    marginRight: 12,
  },
  settingLabel: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
  logoutButton: {
    backgroundColor: "#FF3B30",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  logoutIcon: {
    marginRight: 8,
  },
  logoutButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  disabledButton: {
    opacity: 0.6,
  },
});
