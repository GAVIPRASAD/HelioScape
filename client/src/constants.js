export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

export const APP_NAME = "HelioScape";

export const THEME = {
  LIGHT: "light",
  DARK: "dark",
};

export const ROUTES = {
  HOME: "/",
  DASHBOARD: "/dashboard",
  SETTINGS: "/settings",
  LOGIN: "/login",
  REGISTER: "/register",
};
