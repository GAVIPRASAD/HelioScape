import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useAuthStore } from "@/store/useAuthStore";

const API_URL = import.meta.env.VITE_API_URL;

export const useCreateFolderMutation = () => {
  const { token } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, parentId }) => {
      const response = await axios.post(
        `${API_URL}/folders`,
        { name, parentId },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      // Invalidate folders query for the specific parent
      queryClient.invalidateQueries({
        queryKey: ["folders", variables.parentId || null],
      });
    },
  });
};
