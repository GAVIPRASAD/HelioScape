import React, { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import {
  UploadCloud,
  File,
  Loader2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import useUploadMutation from "@/hooks/useUploadMutation";
import { cn } from "@/lib/utils";

const UploadZone = ({ onUploadComplete }) => {
  const { toast } = useToast();
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
        uploadFile(file, {
          onSuccess: () => {
            toast({
              title: "Upload Successful",
              description: `${file.name} has been encrypted and distributed.`,
            });
            if (onUploadComplete) {
              setTimeout(onUploadComplete, 1500); // Close after delay
            }
          },
          onError: (err) => {
            toast({
              variant: "destructive",
              title: "Upload Failed",
              description: err.response?.data?.message || err.message,
            });
          },
        });
      }
    },
    [uploadFile, toast]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false, // Single file for now
  });

  return (
    <Card className="border-dashed border-2 border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors">
      <CardContent className="p-0">
        <div
          {...getRootProps()}
          className={cn(
            "flex flex-col items-center justify-center h-64 cursor-pointer p-6 text-center",
            isDragActive && "bg-primary/20"
          )}
        >
          <input {...getInputProps()} />

          {isPending ? (
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-lg font-medium">
                Encrypting & Distributing...
              </p>
              <p className="text-sm text-muted-foreground">
                Please wait while we shard your file.
              </p>
            </div>
          ) : isSuccess ? (
            <div className="flex flex-col items-center space-y-4">
              <CheckCircle className="h-12 w-12 text-green-500" />
              <p className="text-lg font-medium">Upload Complete!</p>
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => e.stopPropagation()}
              >
                Upload Another
              </Button>
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center space-y-4">
              <AlertCircle className="h-12 w-12 text-destructive" />
              <p className="text-lg font-medium text-destructive">
                Error Uploading
              </p>
              <p className="text-sm text-muted-foreground">{error?.message}</p>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-4">
              <div className="p-4 bg-background rounded-full shadow-sm">
                <UploadCloud className="h-8 w-8 text-primary" />
              </div>
              <div>
                <p className="text-lg font-medium">
                  {isDragActive
                    ? "Drop file here"
                    : "Drag & drop your file here"}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  or click to browse
                </p>
              </div>
              <Button variant="secondary" size="sm">
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
