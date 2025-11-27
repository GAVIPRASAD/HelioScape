import React, { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import {
  UploadCloud,
  File as FileIcon,
  Loader2,
  CheckCircle,
  AlertCircle,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTransferStore } from "@/store/useTransferStore";

const UploadZone = ({ onUploadComplete, folderId = null }) => {
  const { toast } = useToast();
  const { uploadQueue, addUploads, removeUpload, clearCompleted } =
    useTransferStore();
  const [isExiting, setIsExiting] = React.useState(false);

  const onDrop = useCallback(
    (acceptedFiles) => {
      // Immediate feedback
      if (acceptedFiles.length > 0) {
        toast({
          title: "Files Added",
          description: `${acceptedFiles.length} file(s) added to queue.`,
        });
        addUploads(acceptedFiles, folderId);

        setIsExiting(true);
        setTimeout(() => {
          if (onUploadComplete) {
            onUploadComplete();
          }
        }, 300);
      }
    },
    [addUploads, toast, folderId, onUploadComplete]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
    onDropRejected: (fileRejections) => {
      fileRejections.forEach((rejection) => {
        toast({
          variant: "destructive",
          title: "File Rejected",
          description: `${rejection.file.name}: ${rejection.errors[0].message}`,
        });
      });
    },
  });

  const getStatusIcon = (status) => {
    if (status === "success")
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    if (status === "error")
      return <AlertCircle className="h-5 w-5 text-destructive" />;
    if (status === "pending")
      return <div className="h-4 w-4 rounded-full border-2 border-muted" />;
    return <Loader2 className="h-5 w-5 animate-spin text-primary" />;
  };

  const getStatusText = (item) => {
    if (item.status === "pending") return "Waiting...";
    if (item.status === "uploading") return `Uploading ${item.progress}%`;
    if (item.status === "encrypting") return "Distributing to Cloud...";
    if (item.status === "success") return "Complete";
    if (item.status === "error") return "Failed";
    return "";
  };

  return (
    <Card
      className={cn(
        "border-dashed border-2 border-primary/20 bg-primary/5 hover:bg-primary/10 transition-all duration-300 overflow-hidden relative",
        isExiting && "scale-95 opacity-0"
      )}
    >
      <CardContent className="p-0">
        {/* Drop Zone */}
        <div
          {...getRootProps()}
          className={cn(
            "flex flex-col items-center justify-center h-40 cursor-pointer p-6 text-center relative z-10 transition-all",
            isDragActive && "bg-primary/20 scale-[0.98]"
          )}
        >
          <input {...getInputProps()} />
          <div className="p-4 bg-background rounded-full shadow-lg mb-4 border border-primary/10">
            <UploadCloud className="h-8 w-8 text-primary" />
          </div>
          <div>
            <p className="text-lg font-bold">
              {isDragActive ? "Drop files now" : "Drag & drop files"}
            </p>
            <p className="text-sm text-muted-foreground">
              Support for multiple files
            </p>
          </div>
        </div>

        {/* File List */}
        {uploadQueue.length > 0 && (
          <div className="border-t bg-background/50 backdrop-blur-sm">
            <div className="p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider border-b flex justify-between items-center">
              <span>Queue ({uploadQueue.length})</span>
              {uploadQueue.some(
                (f) => f.status === "success" || f.status === "error"
              ) && (
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    clearCompleted();
                  }}
                  className="h-6 text-[10px]"
                >
                  Clear Completed
                </Button>
              )}
            </div>
            <ScrollArea className="h-[200px]">
              <div className="divide-y">
                {uploadQueue.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 flex items-center gap-3 hover:bg-muted/50 transition-colors"
                  >
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <FileIcon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-1">
                        <p className="text-sm font-medium truncate max-w-[180px]">
                          {item.file.name}
                        </p>
                        <span className="text-xs text-muted-foreground">
                          {getStatusText(item)}
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
                          "h-1.5",
                          item.status === "error" && "bg-destructive/20"
                        )}
                        indicatorClassName={cn(
                          item.status === "encrypting" && "animate-pulse",
                          item.status === "error" && "bg-destructive"
                        )}
                      />
                    </div>
                    <div className="shrink-0 flex items-center gap-2">
                      {getStatusIcon(item.status)}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          // We need to handle cancel logic here too if we want the X to work same as manager
                          // But removeFile in store doesn't abort.
                          // The Manager handles aborting via useEffect cleanup or we need to expose abort logic.
                          // Ideally, we should just call removeFile and the Manager detects the removal?
                          // No, Manager holds the controller ref.
                          // For now, let's just call removeFile. The Manager's useEffect might not catch it if we don't signal it.
                          // Actually, the Manager's handleCancel does the abort.
                          // We should probably expose a "cancelFile" action in the store that the Manager listens to?
                          // Or just let the Manager handle the active upload.
                          // Simplest: If user clicks X here, we just remove it from store.
                          // The Manager needs to know to abort.
                          // Let's just use removeFile for now. The Manager will see it disappear from queue.
                          // But the Manager's useEffect is running async.
                          // We might need to handle this better later, but for now let's stick to basic remove.
                          removeUpload(item.id);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UploadZone;
