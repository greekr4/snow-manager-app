import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import Constants from "expo-constants";
import { useFonts } from "expo-font";
import { Stack, usePathname, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef } from "react";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/useColorScheme";
import { useAuth } from "@/stores/authStore";
import { useTaskStore } from "@/stores/taskStore";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import axios from "axios";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// 전역 알림 핸들러: 포그라운드에서도 배너/알림을 표시
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    // SDK 53 호환 필드
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function useSafeReplace(targetPath: "/(tabs)" | "/login" | null) {
  const router = useRouter();
  const pathname = usePathname();
  const didNavigateRef = useRef(false);
  const isMountedRef = useRef(true);
  const lastTargetRef = useRef<typeof targetPath>(null);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    // target이 바뀌면 다시 네비게이션 허용
    if (lastTargetRef.current !== targetPath) {
      didNavigateRef.current = false;
      lastTargetRef.current = targetPath;
    }

    if (!targetPath) return;
    if (didNavigateRef.current) return;
    if (pathname === targetPath) return;

    didNavigateRef.current = true;
    requestAnimationFrame(() => {
      if (!isMountedRef.current) return;
      router.replace(targetPath);
    });
  }, [targetPath, pathname, router]);
}

// 위 훅을 사용해 초기 라우팅을 안전하게 처리

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
  const currentPathname = usePathname();
  const { setSelectedTask } = useTaskStore();
  const isExpoGo = (Constants as any)?.appOwnership === "expo";

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  // 전역 axios 설정(타임아웃/디버깅)
  useEffect(() => {
    axios.defaults.timeout = 15000;
    const req = axios.interceptors.request.use((config) => {
      return config;
    });
    const res = axios.interceptors.response.use(
      (r) => r,
      (error) => {
        const isCanceled =
          axios.isCancel?.(error) || error?.message === "canceled";
        const status = error?.response?.status;
        const url = error?.config?.url;
        if (isCanceled) {
          console.warn(`[HTTP] 요청 취소됨: ${url}`);
        } else {
          console.warn(
            `[HTTP] 오류 ${status || ""}: ${url}`,
            error?.response?.data || error?.message
          );
        }
        return Promise.reject(error);
      }
    );
    return () => {
      axios.interceptors.request.eject(req);
      axios.interceptors.response.eject(res);
    };
  }, []);

  // Android 알림 채널을 최대 중요도로 설정 (사운드/배너 보장)
  useEffect(() => {
    if (Platform.OS === "android") {
      Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        sound: "default",
        vibrationPattern: [0, 250, 250, 250],
        lockscreenVisibility:
          Notifications.AndroidNotificationVisibility.PUBLIC,
      }).catch(() => {});
    }
  }, []);

  // 안전한 초기 라우팅 (폰트 로딩 이전에는 네비게이션하지 않음)
  const targetPath = loaded ? (isLoggedIn ? "/(tabs)" : "/login") : null;
  useSafeReplace(targetPath);

  // 알림 클릭 리스너: 라우팅 및 선택 작업 설정 (Expo Go에서는 건너뜀)
  useEffect(() => {
    if (isExpoGo) {
      // Expo Go에서는 원격 알림 관련 기능이 제한되어 안전하게 스킵
      return;
    }

    const navigateFromNotification = (
      data?: any,
      options?: { coldStart?: boolean }
    ) => {
      try {
        const rawRoute = data?.route;
        const taskKey = data?.taskKey;
        if (!rawRoute || typeof rawRoute !== "string") return;
        const route = rawRoute.startsWith("/") ? rawRoute : `/${rawRoute}`;

        if (taskKey) {
          setSelectedTask({ TASK_KEY: String(taskKey) } as any);
        }

        const doNavigate = () => {
          if (currentPathname === route) return;
          console.log("[RootLayout] notification navigate ->", route, taskKey);
          router.replace(route as any);
        };

        if (options?.coldStart) {
          setTimeout(doNavigate, 500);
        } else {
          doNavigate();
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
          navigateFromNotification(data, { coldStart: false });
        }
      );

      // cold start에서 마지막 응답 처리
      (async () => {
        try {
          const last = await Notifications.getLastNotificationResponseAsync();
          const data = last?.notification?.request?.content?.data;
          if (data) navigateFromNotification(data, { coldStart: true });
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
  }, [router, setSelectedTask, isExpoGo, currentPathname]);

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
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="login" />
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
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="+not-found" />
          </Stack>
          <StatusBar style="auto" />
        </ThemeProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
