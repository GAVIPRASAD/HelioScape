import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useAuthStore } from "@/store/useAuthStore";

const API_URL = import.meta.env.VITE_API_URL;

const fetchFolders = async (parentId = null) => {
  const token = useAuthStore.getState().token;
  if (!token) throw new Error("No token found");

  const params = parentId ? { parentId } : {};

  const { data } = await axios.get(`${API_URL}/folders`, {
    headers: { Authorization: `Bearer ${token}` },
    params,
  });
  return data.data.folders;
};

export const useFoldersQuery = (parentId = null) => {
  return useQuery({
    queryKey: ["folders", parentId],
    queryFn: () => fetchFolders(parentId),
    retry: false,
    staleTime: 1000 * 60, // 1 minute
  });
};
