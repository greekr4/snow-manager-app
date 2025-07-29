import { useAuth } from "@/stores/authStore";
import React from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function ProfileScreen() {
  const { user, logout, isLoading } = useAuth();

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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>프로필</Text>
      </View>

      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.name?.charAt(0) || user?.email?.charAt(0) || "U"}
          </Text>
        </View>

        <Text style={styles.name}>{user?.name || "사용자"}</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      <View style={styles.infoSection}>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>사용자 ID</Text>
          <Text style={styles.infoValue}>{user?.id}</Text>
        </View>

        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>계정 상태</Text>
          <Text style={styles.infoValue}>활성</Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.logoutButton, isLoading && styles.disabledButton]}
        onPress={handleLogout}
        disabled={isLoading}
      >
        <Text style={styles.logoutButtonText}>
          {isLoading ? "로그아웃 중..." : "로그아웃"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: 20,
  },
  header: {
    marginTop: 60,
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
  },
  profileCard: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: 20,
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "white",
  },
  name: {
    fontSize: 24,
    fontWeight: "600",
    color: "#333",
    marginBottom: 5,
  },
  email: {
    fontSize: 16,
    color: "#666",
  },
  infoSection: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  infoItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  infoLabel: {
    fontSize: 16,
    color: "#666",
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  logoutButton: {
    backgroundColor: "#FF3B30",
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
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
