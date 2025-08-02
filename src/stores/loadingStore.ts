import { create } from "zustand";

interface LoadingState {
  isFirstResponseLoading: boolean;
  setFirstResponseLoading: (loading: boolean) => void;
}

export const useLoadingStore = create<LoadingState>((set) => ({
  isFirstResponseLoading: false,
  setFirstResponseLoading: (loading) =>
    set({ isFirstResponseLoading: loading }),
}));
