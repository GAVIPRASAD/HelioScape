import { useInfiniteQuery } from "@tanstack/react-query";
import axios from "axios";
import { useAuthStore } from "@/store/useAuthStore";

const API_URL = import.meta.env.VITE_API_URL;

const fetchFiles = async ({ folderId, pageParam = 1 }) => {
  const token = useAuthStore.getState().token;
  if (!token) throw new Error("No token found");

  const params = {
    page: pageParam,
    limit: 50,
    ...(folderId ? { folderId } : {}),
  };

  const { data } = await axios.get(`${API_URL}/files`, {
    headers: { Authorization: `Bearer ${token}` },
    params,
  });
  return data; // Expecting { status, data: { files: [], total: N, pages: M } }
};

export const useFilesQuery = (folderId = null) => {
  return useInfiniteQuery({
    queryKey: ["files", folderId],
    queryFn: ({ pageParam }) => fetchFiles({ folderId, pageParam }),
    getNextPageParam: (lastPage) => {
      if (lastPage.data.page < lastPage.data.pages)
        return lastPage.data.page + 1;
      return undefined;
    },
    retry: false,
    staleTime: 1000 * 60, // 1 minute
  });
};
