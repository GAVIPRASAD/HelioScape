import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import {
  UploadCloud,
  File,
  Loader2,
  CheckCircle,
  AlertCircle,
  Shield,
  Server,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Progress } from "@/components/ui/progress";
import useUploadMutation from "@/hooks/useUploadMutation";
import { cn } from "@/lib/utils";

const UploadZone = ({ onUploadComplete }) => {
  const { toast } = useToast();
  const [progress, setProgress] = useState(0);
  const [statusStep, setStatusStep] = useState("idle"); // idle, uploading, encrypting, distributing, done

  const {
    mutate: uploadFile,
    isPending,
    isSuccess,
    isError,
    error,
  } = useUploadMutation();

  const onDrop = useCallback(
    (acceptedFiles) => {
      if (acceptedFiles?.length > 0) {
        const file = acceptedFiles[0];
        setProgress(0);
        setStatusStep("uploading");

        uploadFile(
          {
            file,
            onProgress: (percent) => {
              setProgress(percent);
              if (percent === 100) {
                setStatusStep("encrypting");
              }
            },
          },
          {
            onSuccess: () => {
              setStatusStep("done");
              setProgress(100);
              toast({
                title: "Transmission Complete",
                description: `${file.name} secured and distributed.`,
              });
              if (onUploadComplete) {
                setTimeout(onUploadComplete, 2000);
              }
            },
            onError: (err) => {
              setStatusStep("error");
              toast({
                variant: "destructive",
                title: "Upload Failed",
                description: err.response?.data?.message || err.message,
              });
            },
          }
        );
      }
    },
    [uploadFile, toast, onUploadComplete]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
  });

  const getStatusText = () => {
    if (statusStep === "uploading") return `Uploading... ${progress}%`;
    if (statusStep === "encrypting") return "Encrypting (AES-256-GCM)...";
    if (statusStep === "distributing") return "Distributing Shards..."; // Could simulate this
    return "Processing...";
  };

  return (
    <Card className="border-dashed border-2 border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors overflow-hidden relative">
      <CardContent className="p-0">
        <div
          {...getRootProps()}
          className={cn(
            "flex flex-col items-center justify-center h-64 cursor-pointer p-6 text-center relative z-10",
            isDragActive && "bg-primary/20"
          )}
        >
          <input {...getInputProps()} />

          {isPending ? (
            <div className="w-full max-w-xs flex flex-col items-center space-y-6 animate-in fade-in zoom-in duration-300">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
                <Loader2 className="h-16 w-16 animate-spin text-primary relative z-10" />
                {statusStep === "encrypting" && (
                  <Shield className="h-6 w-6 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                )}
              </div>

              <div className="w-full space-y-2">
                <div className="flex justify-between text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                  <span>{getStatusText()}</span>
                  <span>
                    {statusStep === "encrypting" ? "100%" : `${progress}%`}
                  </span>
                </div>
                <Progress
                  value={statusStep === "encrypting" ? 100 : progress}
                  className="h-2"
                />
              </div>

              <div className="flex gap-4 text-xs text-muted-foreground">
                <span
                  className={cn(
                    "flex items-center gap-1",
                    progress > 30 && "text-primary"
                  )}
                >
                  <UploadCloud className="h-3 w-3" /> Upload
                </span>
                <span
                  className={cn(
                    "flex items-center gap-1",
                    progress === 100 && "text-primary"
                  )}
                >
                  <Shield className="h-3 w-3" /> Encrypt
                </span>
                <span
                  className={cn(
                    "flex items-center gap-1",
                    isSuccess && "text-primary"
                  )}
                >
                  <Server className="h-3 w-3" /> Distribute
                </span>
              </div>
            </div>
          ) : isSuccess ? (
            <div className="flex flex-col items-center space-y-4 animate-in fade-in zoom-in duration-300">
              <div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
              <div>
                <p className="text-lg font-bold text-green-500">
                  Secure Transfer Complete
                </p>
                <p className="text-sm text-muted-foreground">
                  File is now distributed across the grid.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setStatusStep("idle");
                }}
              >
                Upload Another
              </Button>
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center space-y-4">
              <AlertCircle className="h-12 w-12 text-destructive" />
              <p className="text-lg font-medium text-destructive">
                Transmission Failed
              </p>
              <p className="text-sm text-muted-foreground">{error?.message}</p>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-4 group">
              <div className="p-6 bg-background rounded-full shadow-lg group-hover:scale-110 transition-transform duration-300 border border-primary/10">
                <UploadCloud className="h-10 w-10 text-primary" />
              </div>
              <div>
                <p className="text-xl font-bold">
                  {isDragActive ? "Drop to Secure" : "Drag & drop to Secure"}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  AES-256 Encryption • Multi-Cloud Sharding
                </p>
              </div>
              <Button variant="secondary" size="sm" className="mt-2">
                Select File
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default UploadZone;
