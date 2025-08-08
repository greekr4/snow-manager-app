import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import Constants from "expo-constants";
import { useFonts } from "expo-font";
import { Stack, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/useColorScheme";
import { useAuth } from "@/stores/authStore";
import { useTaskStore } from "@/stores/taskStore";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as Notifications from "expo-notifications";
import { GestureHandlerRootView } from "react-native-gesture-handler";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// React Query 클라이언트 생성
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5분
      gcTime: 1000 * 60 * 10, // 10분 (이전 cacheTime)
      retry: 2,
      refetchOnWindowFocus: true, // 포그라운드에서 자동 리페치
      refetchOnMount: true,
    },
  },
});

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });
  const { isLoggedIn } = useAuth();
  const router = useRouter();
  const { setSelectedTask } = useTaskStore();
  const isExpoGo = (Constants as any)?.appOwnership === "expo";

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  useEffect(() => {
    if (!loaded) return;
    // 로그인 상태 변화에 따라 명시적으로 라우트 전환
    if (isLoggedIn) {
      router.replace("/(tabs)");
    } else {
      router.replace("/login");
    }
  }, [isLoggedIn, loaded]);

  // 알림 클릭 리스너: 라우팅 및 선택 작업 설정 (Expo Go에서는 건너뜀)
  useEffect(() => {
    if (isExpoGo) {
      // Expo Go에서는 원격 알림 관련 기능이 제한되어 안전하게 스킵
      return;
    }

    const navigateFromNotification = (data?: any) => {
      try {
        const route = data?.route;
        const taskKey = data?.taskKey;
        if (route && taskKey) {
          // 최소 정보로 선택 작업 설정 → 디테일에서 자체 fetch
          setSelectedTask({ TASK_KEY: String(taskKey) } as any);
          router.push(route);
        }
      } catch (e) {
        // noop
      }
    };

    let sub: any;
    try {
      // 앱 실행 중 클릭 이벤트
      sub = Notifications.addNotificationResponseReceivedListener(
        (response) => {
          const data = response?.notification?.request?.content?.data;
          navigateFromNotification(data);
        }
      );

      // cold start에서 마지막 응답 처리
      (async () => {
        try {
          const last = await Notifications.getLastNotificationResponseAsync();
          const data = last?.notification?.request?.content?.data;
          if (data) navigateFromNotification(data);
        } catch (e) {
          // noop
        }
      })();
    } catch (e) {
      // Expo 환경 제약 등으로 실패해도 앱이 종료되지 않도록 방지
      // console.log("알림 리스너 초기화 스킵", e);
    }

    return () => {
      try {
        sub?.remove?.();
      } catch {}
    };
  }, [router, setSelectedTask, isExpoGo]);

  if (!loaded) {
    return null;
  }

  if (!isLoggedIn) {
    return (
      <QueryClientProvider client={queryClient}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <ThemeProvider
            value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
          >
            <Stack>
              <Stack.Screen name="login" options={{ headerShown: false }} />
            </Stack>
          </ThemeProvider>
        </GestureHandlerRootView>
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ThemeProvider
          value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
        >
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="+not-found" />
          </Stack>
          <StatusBar style="auto" />
        </ThemeProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
