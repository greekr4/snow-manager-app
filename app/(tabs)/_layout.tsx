import { AntDesign, FontAwesome5, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Tabs } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColorScheme } from "@/hooks/useColorScheme";

// 앱바 컴포넌트
function AppBar() {
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={["#667eea", "#764ba2"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.appBar, { paddingTop: insets.top }]}
    >
      <View style={styles.appBarLeft}>
        <View style={styles.profileImageContainer}>
          <LinearGradient
            colors={["#ff9a9e", "#fecfef"]}
            style={styles.profileGradient}
          >
            <Ionicons name="person" size={24} color="#fff" />
          </LinearGradient>
        </View>
        <View>
          <Text style={styles.profileName}>김태균</Text>
          <Text style={styles.profileRole}>대리</Text>
        </View>
      </View>
      <View style={styles.appBarRight}>
        <View style={styles.notificationBadge}>
          <Ionicons name="notifications" size={20} color="#fff" />
          <View style={styles.badge} />
        </View>
      </View>
    </LinearGradient>
  );
}

// 커스텀 탭 버튼 컴포넌트
function CustomTabButton({ children, onPress, isActive }: any) {
  return (
    <View style={styles.tabButtonContainer}>
      <TouchableOpacity
        style={[styles.tabButton, isActive && styles.tabButtonActive]}
        onPress={onPress}
        activeOpacity={0.8}
      >
        {children}
      </TouchableOpacity>
    </View>
  );
}

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <View style={styles.container}>
      <AppBar />
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: "#667eea",
          tabBarInactiveTintColor: "#8e8e93",
          headerShown: false,
          tabBarStyle: styles.tabBar,
          tabBarBackground: () => <View style={styles.tabBarBackground} />,
          tabBarButton: (props) => <CustomTabButton {...props} />,
          tabBarLabelStyle: styles.tabBarLabel,
          tabBarHideOnKeyboard: true,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "홈",
            tabBarIcon: ({ color, focused }) => (
              <View style={styles.iconContainer}>
                <Ionicons
                  name={focused ? "home" : "home-outline"}
                  size={24}
                  color={color}
                />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="taskDetail"
          options={{
            title: "작업상세",
            tabBarIcon: ({ color, focused }) => (
              <View style={styles.iconContainer}>
                <FontAwesome5 name="tasks" size={24} color={color} />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="taskCreate"
          options={{
            title: "작업등록",
            tabBarIcon: ({ color, focused }) => (
              <View style={styles.iconContainer}>
                <AntDesign name="form" size={24} color={color} />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "프로필",
            tabBarIcon: ({ color, focused }) => (
              <View style={styles.iconContainer}>
                <Ionicons
                  name={focused ? "person" : "person-outline"}
                  size={24}
                  color={color}
                />
              </View>
            ),
          }}
        />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  appBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  appBarLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  profileImageContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileGradient: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  profileName: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 2,
  },
  profileRole: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 13,
    fontWeight: "500",
  },
  appBarRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  notificationBadge: {
    position: "relative",
    padding: 8,
  },
  badge: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FF3B30",
  },
  tabBar: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    height: 80,
    borderRadius: 50,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    borderTopWidth: 0,
    paddingHorizontal: 5,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: "transparent",
    marginHorizontal: 30,
    marginBottom: 10,
  },
  tabBarBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 1)",
    borderRadius: 40,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    boxShadow: "0 0 10px 0 rgba(0, 0, 0, 0.1)",
  },
  tabButtonContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  tabButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  tabButtonActive: {
    backgroundColor: "rgba(102, 126, 234, 0.1)",
    borderRadius: 20,
  },
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    width: 40,
    height: 40,
  },
  activeIndicator: {
    position: "absolute",
    bottom: -3,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#667eea",
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
  },
});
