import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import CryptoJS from "crypto-js";

const SECRET_KEY =
  import.meta.env.VITE_STORAGE_KEY || "local-storage-secret-key";

const encrypt = (data) => {
  return CryptoJS.AES.encrypt(JSON.stringify(data), SECRET_KEY).toString();
};

const decrypt = (data) => {
  try {
    const bytes = CryptoJS.AES.decrypt(data, SECRET_KEY);
    return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
  } catch (e) {
    console.error("Failed to decrypt storage", e);
    return null;
  }
};

const secureStorage = {
  getItem: (name) => {
    const stored = localStorage.getItem(name);
    if (!stored) return null;
    return decrypt(stored);
  },
  setItem: (name, value) => {
    const encrypted = encrypt(value);
    localStorage.setItem(name, encrypted);
  },
  removeItem: (name) => {
    localStorage.removeItem(name);
  },
};

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      login: (user, token) => set({ user, token, isAuthenticated: true }),
      updateUser: (user) => set({ user }),
      logout: () => {
        set({ user: null, token: null, isAuthenticated: false });
        // Optional: Call backend logout if needed
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => secureStorage),
    }
  )
);
