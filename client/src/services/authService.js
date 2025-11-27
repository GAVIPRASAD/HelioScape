import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

import { useAuthStore } from "@/store/useAuthStore";

// Helper to get auth header
const getAuthHeader = () => {
  const token = useAuthStore.getState().token;
  if (!token) return {};
  return { headers: { Authorization: `Bearer ${token}` } };
};

export const loginUser = async (email, password) => {
  const response = await axios.post(`${API_URL}/auth/login`, {
    email,
    password,
  });
  return response.data;
};

export const registerUser = async (email, password) => {
  const response = await axios.post(`${API_URL}/auth/register`, {
    email,
    password,
  });
  return response.data;
};

export const initiateOAuth = async (provider) => {
  const response = await axios.get(`${API_URL}/oauth/${provider}`, {
    ...getAuthHeader(),
    withCredentials: true,
  });
  return response.data.data.url;
};

export const linkAccount = async (provider, code) => {
  const response = await axios.post(
    `${API_URL}/oauth/${provider}/link`,
    { code },
    getAuthHeader()
  );
  return response.data;
};

export const unlinkAccount = async (provider, providerId) => {
  const response = await axios.delete(
    `${API_URL}/oauth/${provider}/${providerId}`,
    getAuthHeader()
  );
  return response.data;
};
export const megaLogin = async (email, password) => {
  const response = await axios.post(
    `${API_URL}/oauth/mega/login`,
    { email, password },
    getAuthHeader()
  );
  return response.data;
};
