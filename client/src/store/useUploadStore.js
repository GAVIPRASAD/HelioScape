import { create } from "zustand";

export const useUploadStore = create((set, get) => ({
  uploadQueue: [],
  isProcessing: false,
  isMinimized: false, // For the floating UI

  addFiles: (files) => {
    const newFiles = files.map((file) => ({
      file,
      id: Math.random().toString(36).substring(7),
      progress: 0,
      status: "pending",
      error: null,
    }));
    set((state) => ({ uploadQueue: [...state.uploadQueue, ...newFiles] }));
  },

  removeFile: (id) =>
    set((state) => ({
      uploadQueue: state.uploadQueue.filter((f) => f.id !== id),
    })),

  updateFile: (id, updates) =>
    set((state) => ({
      uploadQueue: state.uploadQueue.map((f) =>
        f.id === id ? { ...f, ...updates } : f
      ),
    })),

  setProcessing: (isProcessing) => set({ isProcessing }),

  clearCompleted: () =>
    set((state) => ({
      uploadQueue: state.uploadQueue.filter(
        (f) => f.status !== "success" && f.status !== "error"
      ),
    })),

  toggleMinimized: () => set((state) => ({ isMinimized: !state.isMinimized })),
}));
