import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useAuthStore } from "@/store/useAuthStore";

const API_URL = import.meta.env.VITE_API_URL;

const fetchFiles = async () => {
  const token = useAuthStore.getState().token;
  if (!token) throw new Error("No token found");

  const { data } = await axios.get(`${API_URL}/files`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data.data.files;
};

export const useFilesQuery = () => {
  return useQuery({
    queryKey: ["files"],
    queryFn: fetchFiles,
    retry: false,
    staleTime: 1000 * 60, // 1 minute
  });
};
