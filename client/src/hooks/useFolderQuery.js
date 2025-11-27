import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useAuthStore } from "@/store/useAuthStore";

const API_URL = import.meta.env.VITE_API_URL;

const fetchFolder = async (folderId) => {
  if (!folderId) return null;
  const token = useAuthStore.getState().token;
  if (!token) throw new Error("No token found");

  const { data } = await axios.get(`${API_URL}/folders/${folderId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data.data.folder;
};

export const useFolderQuery = (folderId) => {
  return useQuery({
    queryKey: ["folder", folderId],
    queryFn: () => fetchFolder(folderId),
    enabled: !!folderId, // Only fetch if folderId is present
    retry: false,
  });
};
