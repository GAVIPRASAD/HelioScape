import React, { useEffect, useRef } from "react";
import { useUploadStore } from "@/store/useUploadStore";
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
} from "lucide-react";
import { cn } from "@/lib/utils";

const UploadManager = () => {
  const {
    uploadQueue,
    isProcessing,
    updateFile,
    setProcessing,
    removeFile,
    isMinimized,
    toggleMinimized,
  } = useUploadStore();
  const { mutate: uploadFile } = useUploadMutation();
  const { toast } = useToast();

  const abortControllerRef = useRef(null);
  const currentUploadIdRef = useRef(null);

  // Process the queue
  useEffect(() => {
    if (isProcessing) return;

    const nextFile = uploadQueue.find((f) => f.status === "pending");
    if (!nextFile) return;

    setProcessing(true);
    const currentFileId = nextFile.id;
    currentUploadIdRef.current = currentFileId;

    const controller = new AbortController();
    abortControllerRef.current = controller;

    updateFile(currentFileId, { status: "uploading" });

    uploadFile(
      {
        file: nextFile.file,
        signal: controller.signal,
        onProgress: (percent) => {
          updateFile(currentFileId, {
            progress: percent,
            status: percent === 100 ? "encrypting" : "uploading",
          });
        },
      },
      {
        onSuccess: () => {
          updateFile(currentFileId, { status: "success", progress: 100 });
          setProcessing(false);
          currentUploadIdRef.current = null;
          abortControllerRef.current = null;
        },
        onError: (err) => {
          const isCanceled = err.code === "ERR_CANCELED";
          updateFile(currentFileId, {
            status: "error",
            error: isCanceled
              ? "Canceled"
              : err.response?.data?.message || err.message,
          });
          setProcessing(false);
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
  }, [uploadQueue, isProcessing, uploadFile, updateFile, setProcessing, toast]);

  // Handle cancellation
  const handleCancel = (id) => {
    if (id === currentUploadIdRef.current && abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    removeFile(id);
  };

  if (uploadQueue.length === 0) return null;

  const activeCount = uploadQueue.filter(
    (f) =>
      f.status === "pending" ||
      f.status === "uploading" ||
      f.status === "encrypting"
  ).length;

  return (
    <div className="fixed bottom-4 right-4 z-[100] w-[350px] shadow-2xl transition-all duration-300">
      <Card className="border-primary/20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <CardHeader className="p-3 border-b flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            {activeCount > 0 ? (
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            ) : (
              <CheckCircle className="h-4 w-4 text-green-500" />
            )}
            {activeCount > 0
              ? `Uploading ${activeCount} file${
                  activeCount !== 1 ? "s" : ""
                }...`
              : "Uploads Complete"}
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
                onClick={() => useUploadStore.getState().clearCompleted()}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </CardHeader>

        {!isMinimized && (
          <CardContent className="p-0">
            <ScrollArea className="h-[250px]">
              <div className="divide-y">
                {uploadQueue.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 flex items-center gap-3 hover:bg-muted/50 transition-colors"
                  >
                    <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center shrink-0">
                      <FileIcon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-1">
                        <p className="text-xs font-medium truncate max-w-[150px]">
                          {item.file.name}
                        </p>
                        <span className="text-[10px] text-muted-foreground">
                          {item.status === "encrypting"
                            ? "Distributing..."
                            : item.status === "uploading"
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
                      onClick={() => handleCancel(item.id)}
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

export default UploadManager;
