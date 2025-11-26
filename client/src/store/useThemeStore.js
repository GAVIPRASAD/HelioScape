import { create } from "zustand";
import { persist } from "zustand/middleware";
import { THEME } from "../constants";

export const useThemeStore = create(
  persist(
    (set) => ({
      theme: THEME.DARK,
      toggleTheme: () =>
        set((state) => {
          const newTheme =
            state.theme === THEME.LIGHT ? THEME.DARK : THEME.LIGHT;
          if (newTheme === THEME.DARK) {
            document.documentElement.classList.add("dark");
          } else {
            document.documentElement.classList.remove("dark");
          }
          return { theme: newTheme };
        }),
      setTheme: (theme) => {
        if (theme === THEME.DARK) {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
        set({ theme });
      },
    }),
    {
      name: "theme-storage-v2",
    }
  )
);
