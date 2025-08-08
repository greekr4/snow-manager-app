import axios from "axios";
import { create } from "zustand";

interface PushRecipient {
  adminKey: string;
  name?: string;
  pushToken: string;
}

interface BroadcastPayload {
  title: string;
  body: string;
  data?: Record<string, any>;
}

interface PushState {
  recipients: PushRecipient[];
  isLoading: boolean;
  isSending: boolean;
  error: string | null;
  loadRecipients: () => Promise<void>;
  sendBroadcast: (
    payload: BroadcastPayload,
    options?: { reloadRecipients?: boolean }
  ) => Promise<void>;
  sendNotification: (
    title: string,
    body: string,
    taskKey?: string
  ) => Promise<void>;
}

export const usePushStore = create<PushState>((set, get) => ({
  recipients: [],
  isLoading: false,
  isSending: false,
  error: null,

  // DB에서 pushEnabled=1 사용자 조회
  loadRecipients: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await axios.get("http://210.114.18.110:3333/users", {
        params: { pushEnabled: 1 },
      });
      const raw = Array.isArray(res.data) ? res.data : res.data?.data || [];
      const recipients: PushRecipient[] = raw
        .map((u: any) => ({
          adminKey: u.ADMIN_KEY ?? u.adminKey ?? "",
          name: u.ADMIN_NAME ?? u.name ?? undefined,
          pushToken: u.PUSH_TOKEN ?? u.pushToken ?? null,
        }))
        .filter((u: PushRecipient) => !!u.pushToken);
      set({ recipients, isLoading: false });
    } catch (e: any) {
      set({ error: e?.message || "수신자 불러오기 실패", isLoading: false });
    }
  },

  // 브로드캐스트 전송 (Expo Push API 사용)
  sendBroadcast: async (payload, options) => {
    const { reloadRecipients } = options || {};
    if (get().isSending) return; // 중복 전송 방지

    try {
      set({ isSending: true, error: null });
      if (reloadRecipients || get().recipients.length === 0) {
        await get().loadRecipients();
      }
      const tokens = get()
        .recipients.map((r) => r.pushToken)
        .filter(Boolean);
      if (tokens.length === 0) {
        set({ isSending: false });
        return;
      }

      const chunkSize = 100;
      for (let i = 0; i < tokens.length; i += chunkSize) {
        const chunk = tokens.slice(i, i + chunkSize);
        const messages = chunk.map((to) => ({
          to,
          sound: "default",
          title: payload.title,
          body: payload.body,
          data: payload.data || {},
        }));
        await axios.post("https://exp.host/--/api/v2/push/send", messages, {
          headers: { "Content-Type": "application/json" },
          timeout: 15000,
        });
      }
    } catch (e: any) {
      set({ error: e?.message || "푸시 전송 실패" });
    } finally {
      set({ isSending: false });
    }
  },

  // 단순 알림 (title, body, key)
  sendNotification: async (title, body, taskKey) => {
    await get().sendBroadcast({
      title,
      body,
      data: { taskKey, route: "/(tabs)/taskDetail" },
    });
  },
}));
