import { useQuery } from "@tanstack/react-query";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

import { useAuthStore } from "@/store/useAuthStore";

const fetchUser = async () => {
  const token = useAuthStore.getState().token;
  if (!token) throw new Error("No token found");

  const { data } = await axios.get(`${API_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data.data.user;
};

export const useUserQuery = () => {
  return useQuery({
    queryKey: ["user"],
    queryFn: fetchUser,
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};
