import React, { useState, useCallback, useEffect } from "react";
import { useTransferStore } from "@/store/useTransferStore";
import { useSearchParams } from "react-router-dom";
import { UploadCloud } from "lucide-react";
import { cn } from "@/lib/utils";

const GlobalDragDrop = ({ children }) => {
  const [isDragging, setIsDragging] = useState(false);
  const { addUploads } = useTransferStore();
  const [searchParams] = useSearchParams();
  const currentFolderId = searchParams.get("folderId") || null;

  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set false if leaving the window (relatedTarget is null)
    if (e.relatedTarget === null) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const files = Array.from(e.dataTransfer.files);
        addUploads(files, currentFolderId);
      }
    },
    [addUploads, currentFolderId]
  );

  useEffect(() => {
    window.addEventListener("dragenter", handleDragEnter);
    window.addEventListener("dragleave", handleDragLeave);
    window.addEventListener("dragover", handleDragOver);
    window.addEventListener("drop", handleDrop);

    return () => {
      window.removeEventListener("dragenter", handleDragEnter);
      window.removeEventListener("dragleave", handleDragLeave);
      window.removeEventListener("dragover", handleDragOver);
      window.removeEventListener("drop", handleDrop);
    };
  }, [handleDragEnter, handleDragLeave, handleDragOver, handleDrop]);

  return (
    <div className="relative min-h-screen">
      {children}

      {/* Drag Overlay */}
      <div
        className={cn(
          "fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center transition-all duration-300 pointer-events-none opacity-0",
          isDragging && "opacity-100 pointer-events-auto"
        )}
      >
        <div className="bg-slate-900 border-2 border-cyan-500 border-dashed rounded-3xl p-12 flex flex-col items-center animate-bounce-slow shadow-[0_0_50px_rgba(6,182,212,0.3)]">
          <div className="h-24 w-24 rounded-full bg-cyan-500/20 flex items-center justify-center mb-6">
            <UploadCloud className="h-12 w-12 text-cyan-400" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">
            Drop files to upload
          </h2>
          <p className="text-slate-400 text-lg">
            Add to {currentFolderId ? "current folder" : "root folder"}
          </p>
        </div>
      </div>
    </div>
  );
};

export default GlobalDragDrop;
