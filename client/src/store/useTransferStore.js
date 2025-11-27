import { create } from "zustand";

export const useTransferStore = create((set, get) => ({
  // Uploads
  uploadQueue: [],
  isUploading: false,

  // Downloads
  downloadQueue: [],
  isDownloading: false,

  // UI State
  isMinimized: false,
  toggleMinimized: () => set((state) => ({ isMinimized: !state.isMinimized })),

  // Upload Actions
  addUploads: (files, folderId = null) => {
    const newFiles = files.map((file) => ({
      file,
      id: Math.random().toString(36).substring(7),
      progress: 0,
      status: "pending",
      error: null,
      type: "upload",
      folderId, // Store folderId
    }));
    set((state) => ({ uploadQueue: [...state.uploadQueue, ...newFiles] }));
  },

  updateUpload: (id, updates) =>
    set((state) => ({
      uploadQueue: state.uploadQueue.map((f) =>
        f.id === id ? { ...f, ...updates } : f
      ),
    })),

  removeUpload: (id) =>
    set((state) => ({
      uploadQueue: state.uploadQueue.filter((f) => f.id !== id),
    })),

  setUploading: (isUploading) => set({ isUploading }),

  // Download Actions
  addDownload: (fileId, fileName, fileSize) => {
    const newDownload = {
      id: fileId, // Use fileId as ID for downloads
      name: fileName,
      size: fileSize,
      progress: 0,
      status: "pending",
      error: null,
      type: "download",
    };
    // Avoid duplicates
    if (get().downloadQueue.find((d) => d.id === fileId)) return;

    set((state) => ({ downloadQueue: [...state.downloadQueue, newDownload] }));
  },

  updateDownload: (id, updates) =>
    set((state) => ({
      downloadQueue: state.downloadQueue.map((f) =>
        f.id === id ? { ...f, ...updates } : f
      ),
    })),

  removeDownload: (id) =>
    set((state) => ({
      downloadQueue: state.downloadQueue.filter((f) => f.id !== id),
    })),

  setDownloading: (isDownloading) => set({ isDownloading }),

  // Shared
  clearCompleted: () =>
    set((state) => ({
      uploadQueue: state.uploadQueue.filter(
        (f) => f.status !== "success" && f.status !== "error"
      ),
      downloadQueue: state.downloadQueue.filter(
        (f) => f.status !== "success" && f.status !== "error"
      ),
    })),
}));
