import React, { useState } from "react";
import { useFilesQuery } from "@/hooks/useFilesQuery";
import { useAuthStore } from "@/store/useAuthStore";
import axios from "axios";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download, FileIcon, Trash2, Eye, Search } from "lucide-react";
import Loading from "@/components/ui/Loading";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const API_URL = import.meta.env.VITE_API_URL;

const Files = () => {
  const { data: files, isLoading, error } = useFilesQuery();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");

  const filteredFiles = files?.filter((file) => {
    const matchesSearch = file.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    if (filterType === "all") return matchesSearch;
    if (filterType === "documents")
      return (
        matchesSearch &&
        (file.mimeType.includes("pdf") ||
          file.mimeType.includes("text") ||
          file.mimeType.includes("document"))
      );
    if (filterType === "images")
      return matchesSearch && file.mimeType.includes("image");
    if (filterType === "media")
      return (
        matchesSearch &&
        (file.mimeType.includes("video") || file.mimeType.includes("audio"))
      );

    return matchesSearch;
  });

  const handleDownload = async (fileId, fileName) => {
    try {
      const token = useAuthStore.getState().token;
      toast({
        title: "Initiating Download",
        description: "Decrypting and reassembling file...",
      });

      const response = await axios.get(`${API_URL}/files/${fileId}/download`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast({
        title: "Download Complete",
        description: "File decrypted successfully.",
      });
    } catch (error) {
      console.error("Download failed:", error);
      toast({
        variant: "destructive",
        title: "Download Failed",
        description: "Could not retrieve file.",
      });
    }
  };

  const handlePreview = async (file) => {
    const isImage = file.mimeType?.startsWith("image/");
    const isPdf = file.mimeType === "application/pdf";
    const isVideo = file.mimeType?.startsWith("video/");
    const isAudio = file.mimeType?.startsWith("audio/");

    if (!isImage && !isPdf && !isVideo && !isAudio) {
      toast({
        variant: "destructive",
        title: "Preview Unavailable",
        description: "Preview not supported for this file type.",
      });
      return;
    }

    try {
      const token = useAuthStore.getState().token;
      toast({
        title: "Loading Preview",
        description: "Decrypting file...",
      });

      const response = await axios.get(
        `${API_URL}/files/${file._id}/download`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: "blob",
        }
      );

      const url = window.URL.createObjectURL(
        new Blob([response.data], { type: file.mimeType })
      );
      setPreviewUrl(url);
      setPreviewFile(file);
      setIsPreviewOpen(true);
    } catch (error) {
      console.error("Preview failed:", error);
      toast({
        variant: "destructive",
        title: "Preview Failed",
        description: "Could not retrieve file.",
      });
    }
  };

  const handleDelete = async (fileId) => {
    if (!window.confirm("Are you sure you want to delete this file?")) return;

    try {
      const token = useAuthStore.getState().token;
      await axios.delete(`${API_URL}/files/${fileId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast({
        title: "File Deleted",
        description: "File and its chunks have been removed.",
      });

      queryClient.invalidateQueries(["files"]);
    } catch (error) {
      console.error("Delete failed:", error);
      toast({
        variant: "destructive",
        title: "Delete Failed",
        description: "Could not delete file.",
      });
    }
  };

  const closePreview = (open) => {
    if (!open) {
      setIsPreviewOpen(false);
      if (previewUrl) window.URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
      setPreviewFile(null);
    }
  };

  if (isLoading) return <Loading text="Loading files..." />;
  if (error)
    return <div className="p-6 text-red-500">Error loading files.</div>;

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Files</h1>
          <p className="text-muted-foreground">
            {filteredFiles?.length || 0} items found
          </p>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search files..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Tabs
            defaultValue="all"
            value={filterType}
            onValueChange={setFilterType}
          >
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="documents">Docs</TabsTrigger>
              <TabsTrigger value="images">Images</TabsTrigger>
              <TabsTrigger value="media">Media</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Uploaded</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredFiles?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No files found.
                </TableCell>
              </TableRow>
            ) : (
              filteredFiles?.map((file) => (
                <TableRow key={file._id}>
                  <TableCell className="font-medium flex items-center gap-2">
                    <FileIcon className="h-4 w-4 text-primary" />
                    {file.name}
                  </TableCell>
                  <TableCell>
                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </TableCell>
                  <TableCell>{file.mimeType || "Unknown"}</TableCell>
                  <TableCell>
                    {new Date(file.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handlePreview(file)}
                        title="Preview"
                      >
                        <Eye className="h-4 w-4" />
                        <span className="sr-only">Preview</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDownload(file._id, file.name)}
                        title="Download"
                      >
                        <Download className="h-4 w-4" />
                        <span className="sr-only">Download</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(file._id)}
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isPreviewOpen} onOpenChange={closePreview}>
        <DialogContent className="sm:max-w-3xl bg-background/95 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle>{previewFile?.name}</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center p-4 min-h-[200px]">
            {previewUrl ? (
              previewFile?.mimeType === "application/pdf" ? (
                <iframe
                  src={previewUrl}
                  title="PDF Preview"
                  className="w-full h-[70vh] rounded-md shadow-lg border-none"
                />
              ) : previewFile?.mimeType?.startsWith("video/") ? (
                <video
                  src={previewUrl}
                  controls
                  className="max-h-[70vh] w-full rounded-md shadow-lg"
                />
              ) : previewFile?.mimeType?.startsWith("audio/") ? (
                <audio src={previewUrl} controls className="w-full mt-10" />
              ) : (
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="max-h-[70vh] w-auto object-contain rounded-md shadow-lg"
                />
              )
            ) : (
              <Loading text="Loading preview..." />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Files;
