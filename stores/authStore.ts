import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface User {
  id: string;
  email: string;
  name?: string;
}

interface AuthState {
  // 상태
  isLoggedIn: boolean;
  user: User | null;
  token: string | null;
  isLoading: boolean;

  // 액션
  login: (email: string, password: string) => Promise<void>;
  loginWithToken: (token: string, user: User) => void;
  logout: () => Promise<void>;
  setLoading: (loading: boolean) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // 초기 상태
      isLoggedIn: false,
      user: null,
      token: null,
      isLoading: false,

      // 로그인 액션
      login: async (email: string, password: string) => {
        set({ isLoading: true });

        try {
          // 실제 앱에서는 여기서 API 호출
          // const response = await authAPI.login(email, password);

          // 더미 데이터로 시뮬레이션
          await new Promise((resolve) => setTimeout(resolve, 1000)); // 로딩 시뮬레이션

          const dummyToken = "dummy-jwt-token-" + Date.now();
          const dummyUser: User = {
            id: "1",
            email: email,
            name: "사용자",
          };

          set({
            isLoggedIn: true,
            user: dummyUser,
            token: dummyToken,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      // 토큰으로 로그인 (앱 시작 시 자동 로그인)
      loginWithToken: (token: string, user: User) => {
        set({
          isLoggedIn: true,
          user,
          token,
        });
      },

      // 로그아웃 액션
      logout: async () => {
        set({ isLoading: true });

        try {
          // 실제 앱에서는 여기서 서버에 로그아웃 요청
          // await authAPI.logout();

          // AsyncStorage에서 인증 데이터 완전 삭제
          await AsyncStorage.removeItem("auth-storage");

          set({
            isLoggedIn: false,
            user: null,
            token: null,
            isLoading: false,
          });
        } catch (error) {
          console.error("로그아웃 중 오류:", error);
          set({ isLoading: false });
          throw error;
        }
      },

      // 로딩 상태 설정
      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      // 인증 정보 초기화
      clearAuth: async () => {
        try {
          await AsyncStorage.removeItem("auth-storage");
          set({
            isLoggedIn: false,
            user: null,
            token: null,
          });
        } catch (error) {
          console.error("인증 정보 초기화 중 오류:", error);
        }
      },
    }),
    {
      name: "auth-storage", // AsyncStorage에 저장될 키 이름
      storage: createJSONStorage(() => AsyncStorage),
      // 민감한 정보는 제외하고 저장
      partialize: (state) => ({
        isLoggedIn: state.isLoggedIn,
        user: state.user,
        token: state.token,
      }),
    }
  )
);

// 편의를 위한 훅들
export const useAuth = () => {
  const store = useAuthStore();

  return {
    // 상태
    isLoggedIn: store.isLoggedIn,
    user: store.user,
    token: store.token,
    isLoading: store.isLoading,

    // 액션
    login: store.login,
    logout: store.logout,
    loginWithToken: store.loginWithToken,
    setLoading: store.setLoading,
    clearAuth: store.clearAuth,
  };
};
