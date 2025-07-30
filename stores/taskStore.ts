import { create } from "zustand";

interface TaskDetail {
  id: number;
  title: string;
  client: string;
  status: string;
  priority: string;
  details: string[];
  time: string;
  time2: string;
}

interface TaskState {
  selectedTask: TaskDetail | null;
  setSelectedTask: (task: TaskDetail) => void;
  clearSelectedTask: () => void;
}

export const useTaskStore = create<TaskState>((set) => ({
  selectedTask: null,
  setSelectedTask: (task) => set({ selectedTask: task }),
  clearSelectedTask: () => set({ selectedTask: null }),
}));
