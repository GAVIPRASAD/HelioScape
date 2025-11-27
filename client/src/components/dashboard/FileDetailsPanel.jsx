import React from "react";
import {
  X,
  Download,
  Pencil,
  Trash2,
  File as FileIcon,
  Folder as FolderIcon,
  Calendar,
  HardDrive,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatBytes } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

const FileDetailsPanel = ({
  item,
  isOpen,
  onClose,
  onDownload,
  onRename,
  onDelete,
}) => {
  if (!isOpen || !item) return null;

  const isFolder = !item.mimeType;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-transparent" onClick={onClose} />

      {/* Panel */}
      <div
        className="fixed inset-y-0 right-0 z-50 w-80 bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-xl border-l border-slate-200 dark:border-white/10 shadow-2xl transform transition-transform duration-300 ease-in-out animate-in slide-in-from-right"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-white/10">
            <h2 className="font-semibold text-lg text-slate-900 dark:text-white">
              Details
            </h2>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <ScrollArea className="flex-1 p-4">
            {/* Icon/Preview */}
            <div className="flex flex-col items-center justify-center py-8">
              <div className="h-24 w-24 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-violet-500/20 flex items-center justify-center mb-4 shadow-inner">
                {isFolder ? (
                  <FolderIcon className="h-12 w-12 text-cyan-500" />
                ) : (
                  <FileIcon className="h-12 w-12 text-violet-500" />
                )}
              </div>
              <h3 className="text-center font-medium text-lg break-all text-slate-900 dark:text-white px-2">
                {item.name}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                {isFolder ? "Folder" : item.mimeType}
              </p>
            </div>

            <Separator className="my-4 bg-slate-200 dark:bg-white/10" />

            {/* Metadata */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  <HardDrive className="h-4 w-4" /> Size
                </span>
                <span className="text-sm font-medium text-slate-900 dark:text-white">
                  {isFolder ? "--" : formatBytes(item.size)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  <Calendar className="h-4 w-4" /> Created
                </span>
                <span className="text-sm font-medium text-slate-900 dark:text-white">
                  {new Date(item.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  <Calendar className="h-4 w-4" /> Modified
                </span>
                <span className="text-sm font-medium text-slate-900 dark:text-white">
                  {new Date(
                    item.updatedAt || item.createdAt
                  ).toLocaleDateString()}
                </span>
              </div>
            </div>

            <Separator className="my-4 bg-slate-200 dark:bg-white/10" />

            {/* Actions */}
            <div className="grid grid-cols-3 gap-2">
              {!isFolder && (
                <Button
                  variant="outline"
                  className="flex flex-col items-center gap-1 h-auto py-3 border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5"
                  onClick={() => onDownload(item._id, item.name, item.size)}
                >
                  <Download className="h-4 w-4" />
                  <span className="text-xs">Download</span>
                </Button>
              )}
              <Button
                variant="outline"
                className="flex flex-col items-center gap-1 h-auto py-3 border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5"
                onClick={() => onRename(item, isFolder ? "folder" : "file")}
              >
                <Pencil className="h-4 w-4" />
                <span className="text-xs">Rename</span>
              </Button>
              <Button
                variant="outline"
                className="flex flex-col items-center gap-1 h-auto py-3 border-red-200 dark:border-red-900/30 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                onClick={() => onDelete(item._id)}
              >
                <Trash2 className="h-4 w-4" />
                <span className="text-xs">Delete</span>
              </Button>
            </div>
          </ScrollArea>
        </div>
      </div>
    </>
  );
};

export default FileDetailsPanel;
