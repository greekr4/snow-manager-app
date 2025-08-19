import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface User {
  id: string; // 호환용
  email: string;
  name?: string;
  adminKey?: string; // 서버 ADMIN_KEY
  pushToken?: string | null;
  pushEnabled?: boolean;
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
  updateUser: (partial: Partial<User>) => void;
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
          // 사용자 조회 (아이디로 조회)
          const res = await axios.get(
            `https://snowplanet.co.kr/nest/users/${encodeURIComponent(email)}`
          );
          const raw = res.data;
          const data = Array.isArray(raw) ? raw[0] : raw;

          if (!data || !data.ADMIN_ID) {
            throw new Error("NOT_FOUND");
          }

          const isPasswordMatch =
            String(data.ADMIN_PW ?? "") === String(password);
          if (!isPasswordMatch) {
            throw new Error("INVALID_CREDENTIALS");
          }

          const user: User = {
            id: data.ADMIN_KEY ?? String(email),
            email: data.ADMIN_ID ?? String(email),
            name: data.ADMIN_NAME ?? "사용자",
            adminKey: data.ADMIN_KEY ?? undefined,
            pushToken: data.PUSH_TOKEN ?? null,
            pushEnabled: Boolean(data.PUSH_ENABLED),
          };

          const token = "dummy-jwt-token-" + Date.now();
          set({ isLoggedIn: true, user, token, isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          // 상위(UI)에서 Alert로 실패를 안내할 수 있도록 에러 전파
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

      // 사용자 일부 필드 업데이트
      updateUser: (partial: Partial<User>) => {
        const current = get().user;
        if (!current) return;
        set({ user: { ...current, ...partial } });
      },

      // 로그아웃 액션
      logout: async () => {
        set({ isLoading: true });

        try {
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
    updateUser: store.updateUser,
    setLoading: store.setLoading,
    clearAuth: store.clearAuth,
  };
};
