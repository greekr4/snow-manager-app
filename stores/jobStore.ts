import { create } from "zustand";

interface JobDetail {
  id: number;
  title: string;
  client: string;
  status: string;
  priority: string;
  details: string[];
  time: string;
  time2: string;
}

interface JobState {
  selectedJob: JobDetail | null;
  setSelectedJob: (job: JobDetail) => void;
  clearSelectedJob: () => void;
}

export const useJobStore = create<JobState>((set) => ({
  selectedJob: null,
  setSelectedJob: (job) => set({ selectedJob: job }),
  clearSelectedJob: () => set({ selectedJob: null }),
}));
