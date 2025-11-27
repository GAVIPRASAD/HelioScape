import React, { useEffect, useRef } from "react";
import { useTransferStore } from "@/store/useTransferStore";
import useUploadMutation from "@/hooks/useUploadMutation";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  X,
  Minimize2,
  Maximize2,
  Loader2,
  CheckCircle,
  AlertCircle,
  File as FileIcon,
  Upload,
  Download,
} from "lucide-react";
import { cn } from "@/lib/utils";
import axios from "axios";
import { useAuthStore } from "@/store/useAuthStore";
import { useQueryClient } from "@tanstack/react-query";

const API_URL = import.meta.env.VITE_API_URL;

const TransferManager = () => {
  const {
    uploadQueue,
    downloadQueue,
    isUploading,
    isDownloading,
    updateUpload,
    updateDownload,
    setUploading,
    setDownloading,
    removeUpload,
    removeDownload,
    isMinimized,
    toggleMinimized,
    clearCompleted,
  } = useTransferStore();

  const { mutate: uploadFile } = useUploadMutation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const abortControllerRef = useRef(null);
  const currentUploadIdRef = useRef(null);
  const currentDownloadIdRef = useRef(null);

  // --- Upload Logic ---
  useEffect(() => {
    if (isUploading) return;

    const nextFile = uploadQueue.find((f) => f.status === "pending");
    if (!nextFile) return;

    setUploading(true);
    const currentFileId = nextFile.id;
    currentUploadIdRef.current = currentFileId;

    const controller = new AbortController();
    abortControllerRef.current = controller;

    updateUpload(currentFileId, { status: "uploading" });

    uploadFile(
      {
        file: nextFile.file,
        folderId: nextFile.folderId, // Pass folderId
        signal: controller.signal,
        onProgress: (percent) => {
          updateUpload(currentFileId, {
            progress: percent,
            status: percent === 100 ? "encrypting" : "uploading",
          });
        },
      },
      {
        onSuccess: () => {
          updateUpload(currentFileId, { status: "success", progress: 100 });
          setUploading(false);
          currentUploadIdRef.current = null;
          abortControllerRef.current = null;

          toast({
            title: "Upload Complete",
            description: `${nextFile.file.name} uploaded successfully.`,
          });

          // Refresh data
          queryClient.invalidateQueries({ queryKey: ["quota"] });
          queryClient.invalidateQueries({ queryKey: ["files"] });
        },
        onError: (err) => {
          const isCanceled = err.code === "ERR_CANCELED";
          updateUpload(currentFileId, {
            status: "error",
            error: isCanceled
              ? "Canceled"
              : err.response?.data?.message || err.message,
          });
          setUploading(false);
          currentUploadIdRef.current = null;
          abortControllerRef.current = null;

          if (!isCanceled) {
            toast({
              variant: "destructive",
              title: "Upload Failed",
              description: `Failed to upload ${nextFile.file.name}`,
            });
          }
        },
      }
    );
  }, [uploadQueue, isUploading, uploadFile, updateUpload, setUploading, toast]);

  // --- Download Logic ---
  useEffect(() => {
    if (isDownloading) return;

    const nextFile = downloadQueue.find((f) => f.status === "pending");
    if (!nextFile) return;

    setDownloading(true);
    const currentFileId = nextFile.id;
    currentDownloadIdRef.current = currentFileId;

    const download = async () => {
      try {
        updateDownload(currentFileId, { status: "downloading" });
        const token = useAuthStore.getState().token;

        const response = await axios.get(
          `${API_URL}/files/${currentFileId}/download`,
          {
            headers: { Authorization: `Bearer ${token}` },
            responseType: "blob",
            onDownloadProgress: (progressEvent) => {
              let percentCompleted = 0;
              if (progressEvent.total) {
                percentCompleted = Math.round(
                  (progressEvent.loaded * 100) / progressEvent.total
                );
              }
              updateDownload(currentFileId, { progress: percentCompleted });
            },
          }
        );

        // Trigger browser download
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", nextFile.name);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);

        updateDownload(currentFileId, { status: "success", progress: 100 });
        toast({
          title: "Download Complete",
          description: `${nextFile.name} downloaded successfully.`,
        });
      } catch (error) {
        console.error("Download failed:", error);
        updateDownload(currentFileId, {
          status: "error",
          error: error.message,
        });
        toast({
          variant: "destructive",
          title: "Download Failed",
          description: `Failed to download ${nextFile.name}`,
        });
      } finally {
        setDownloading(false);
        currentDownloadIdRef.current = null;
      }
    };

    download();
  }, [downloadQueue, isDownloading, updateDownload, setDownloading, toast]);

  // --- Auto-Close Logic ---
  useEffect(() => {
    const allItems = [...uploadQueue, ...downloadQueue];
    if (allItems.length === 0) return;

    const activeCount = allItems.filter(
      (f) =>
        f.status === "pending" ||
        f.status === "uploading" ||
        f.status === "downloading" ||
        f.status === "encrypting"
    ).length;

    if (activeCount === 0) {
      const timer = setTimeout(() => {
        clearCompleted();
      }, 5000); // Close after 5 seconds

      return () => clearTimeout(timer);
    }
  }, [uploadQueue, downloadQueue, clearCompleted]);

  // --- UI Helpers ---
  const handleCancelUpload = (id) => {
    if (id === currentUploadIdRef.current && abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    removeUpload(id);
  };

  const handleCancelDownload = (id) => {
    // Axios cancellation for download not implemented yet, just remove from UI
    removeDownload(id);
  };

  const allItems = [...uploadQueue, ...downloadQueue];
  if (allItems.length === 0) return null;

  const activeCount = allItems.filter(
    (f) =>
      f.status === "pending" ||
      f.status === "uploading" ||
      f.status === "downloading" ||
      f.status === "encrypting"
  ).length;

  return (
    <div className="fixed bottom-4 right-4 z-[100] w-[380px] shadow-2xl transition-all duration-300">
      <Card className="border-primary/20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <CardHeader className="p-3 border-b flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            {activeCount > 0 ? (
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            ) : (
              <CheckCircle className="h-4 w-4 text-green-500" />
            )}
            {activeCount > 0
              ? `Processing ${activeCount} file${
                  activeCount !== 1 ? "s" : ""
                }...`
              : "Transfers Complete"}
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={toggleMinimized}
            >
              {isMinimized ? (
                <Maximize2 className="h-3 w-3" />
              ) : (
                <Minimize2 className="h-3 w-3" />
              )}
            </Button>
            {activeCount === 0 && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 hover:text-destructive"
                onClick={clearCompleted}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </CardHeader>

        {!isMinimized && (
          <CardContent className="p-0">
            <ScrollArea className="h-[300px]">
              <div className="divide-y">
                {allItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 flex items-center gap-3 hover:bg-muted/50 transition-colors"
                  >
                    <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center shrink-0">
                      {item.type === "upload" ? (
                        <Upload className="h-4 w-4 text-primary" />
                      ) : (
                        <Download className="h-4 w-4 text-blue-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-1">
                        <p className="text-xs font-medium truncate max-w-[180px]">
                          {item.type === "upload" ? item.file.name : item.name}
                        </p>
                        <span className="text-[10px] text-muted-foreground">
                          {item.status === "encrypting"
                            ? "Distributing..."
                            : item.status === "uploading" ||
                              item.status === "downloading"
                            ? `${item.progress}%`
                            : item.status}
                        </span>
                      </div>
                      <Progress
                        value={
                          item.status === "success"
                            ? 100
                            : item.status === "pending"
                            ? 0
                            : item.progress
                        }
                        className={cn(
                          "h-1",
                          item.status === "error" && "bg-destructive/20"
                        )}
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 hover:text-destructive shrink-0"
                      onClick={() =>
                        item.type === "upload"
                          ? handleCancelUpload(item.id)
                          : handleCancelDownload(item.id)
                      }
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        )}
      </Card>
    </div>
  );
};

export default TransferManager;
