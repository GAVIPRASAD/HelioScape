import React, { useState } from "react";
import { useFilesQuery } from "@/hooks/useFilesQuery";
import { useFoldersQuery } from "@/hooks/useFoldersQuery";
import { useCreateFolderMutation } from "@/hooks/useCreateFolderMutation";
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
import {
  Download,
  File as FileIcon,
  Trash2,
  Eye,
  Search,
  Folder as FolderIcon,
  FolderPlus,
  UploadCloud,
  ChevronRight,
  Home,
  ArrowLeft,
  X,
} from "lucide-react";
import Loading from "@/components/ui/Loading";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTransferStore } from "@/store/useTransferStore";
import UploadZone from "@/components/dashboard/UploadZone";
import { Checkbox } from "@/components/ui/checkbox";

const API_URL = import.meta.env.VITE_API_URL;

/**
 * Files Component
 * Displays a file explorer interface with folders and files.
 * Supports navigation, creation, upload, download, and deletion.
 */
const Files = () => {
  // --- State Management ---
  const [currentFolderId, setCurrentFolderId] = useState(null);
  const [folderHistory, setFolderHistory] = useState([
    { id: null, name: "Home" },
  ]);

  // Data Fetching
  const { data: files, isLoading: isFilesLoading } =
    useFilesQuery(currentFolderId);
  const { data: folders, isLoading: isFoldersLoading } =
    useFoldersQuery(currentFolderId);

  // Mutations
  const { mutate: createFolder, isPending: isCreatingFolder } =
    useCreateFolderMutation();

  // UI State
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  // Selection State
  const [selectedFiles, setSelectedFiles] = useState(new Set());
  const [selectedFolders, setSelectedFolders] = useState(new Set());

  // --- Handlers ---

  /**
   * Creates a new folder in the current directory.
   */
  const handleCreateFolder = (e) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    createFolder(
      { name: newFolderName, parentId: currentFolderId },
      {
        onSuccess: () => {
          setIsCreateFolderOpen(false);
          setNewFolderName("");
          toast({
            title: "Folder Created",
            description: `Created "${newFolderName}"`,
          });
        },
        onError: (err) => {
          toast({
            variant: "destructive",
            title: "Error",
            description:
              err.response?.data?.message || "Failed to create folder",
          });
        },
      }
    );
  };

  /**
   * Navigates into a specific folder.
   */
  const navigateToFolder = (folder) => {
    setFolderHistory((prev) => [
      ...prev,
      { id: folder._id, name: folder.name },
    ]);
    setCurrentFolderId(folder._id);
    setSearchTerm(""); // Clear search on navigation
    setSelectedFiles(new Set()); // Clear selection
    setSelectedFolders(new Set());
  };

  /**
   * Navigates up one level in the folder hierarchy.
   */
  const navigateUp = () => {
    if (folderHistory.length <= 1) return;
    const newHistory = [...folderHistory];
    newHistory.pop();
    setFolderHistory(newHistory);
    setCurrentFolderId(newHistory[newHistory.length - 1].id);
    setSelectedFiles(new Set()); // Clear selection
    setSelectedFolders(new Set());
  };

  /**
   * Navigates to a specific breadcrumb in the history.
   */
  const navigateToBreadcrumb = (index) => {
    const newHistory = folderHistory.slice(0, index + 1);
    setFolderHistory(newHistory);
    setCurrentFolderId(newHistory[newHistory.length - 1].id);
    setSelectedFiles(new Set()); // Clear selection
    setSelectedFolders(new Set());
  };

  // --- Filtering Logic ---

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

  const filteredFolders = folders?.filter((folder) =>
    folder.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- Action Handlers ---

  const handleDownload = (fileId, fileName, fileSize) => {
    useTransferStore.getState().addDownload(fileId, fileName, fileSize);
    toast({
      title: "Download Started",
      description: "Added to transfer queue.",
    });
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
      toast({ title: "Loading Preview", description: "Decrypting file..." });

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

  const handleDeleteFile = async (fileId) => {
    if (!window.confirm("Are you sure you want to delete this file?")) return;
    try {
      const token = useAuthStore.getState().token;
      await axios.delete(`${API_URL}/files/${fileId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast({
        title: "File Deleted",
        description: "File removed successfully.",
      });
      queryClient.invalidateQueries(["files"]);
      // Remove from selection if present
      if (selectedFiles.has(fileId)) {
        const newSelected = new Set(selectedFiles);
        newSelected.delete(fileId);
        setSelectedFiles(newSelected);
      }
    } catch (error) {
      console.error("Delete failed:", error);
      toast({
        variant: "destructive",
        title: "Delete Failed",
        description: "Could not delete file.",
      });
    }
  };

  const handleDeleteFolder = async (folderId) => {
    if (
      !window.confirm(
        "Are you sure? This will delete the folder and ALL contents."
      )
    )
      return;
    try {
      const token = useAuthStore.getState().token;
      await axios.delete(`${API_URL}/folders/${folderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast({
        title: "Folder Deleted",
        description: "Folder removed successfully.",
      });
      queryClient.invalidateQueries(["folders"]);
      // Remove from selection if present
      if (selectedFolders.has(folderId)) {
        const newSelected = new Set(selectedFolders);
        newSelected.delete(folderId);
        setSelectedFolders(newSelected);
      }
    } catch (error) {
      console.error("Delete failed:", error);
      toast({
        variant: "destructive",
        title: "Delete Failed",
        description:
          error.response?.data?.message || "Could not delete folder.",
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

  // --- Bulk Actions Logic ---

  /**
   * Toggles selection of all files and folders in the current view.
   */
  const toggleSelectAll = () => {
    const allFilesSelected =
      selectedFiles.size === filteredFiles?.length && filteredFiles?.length > 0;
    const allFoldersSelected =
      selectedFolders.size === filteredFolders?.length &&
      filteredFolders?.length > 0;

    if (allFilesSelected && allFoldersSelected) {
      // Deselect all
      setSelectedFiles(new Set());
      setSelectedFolders(new Set());
    } else {
      // Select all
      setSelectedFiles(new Set(filteredFiles?.map((f) => f._id)));
      setSelectedFolders(new Set(filteredFolders?.map((f) => f._id)));
    }
  };

  const toggleSelectFile = (fileId) => {
    const newSelected = new Set(selectedFiles);
    if (newSelected.has(fileId)) {
      newSelected.delete(fileId);
    } else {
      newSelected.add(fileId);
    }
    setSelectedFiles(newSelected);
  };

  const toggleSelectFolder = (folderId) => {
    const newSelected = new Set(selectedFolders);
    if (newSelected.has(folderId)) {
      newSelected.delete(folderId);
    } else {
      newSelected.add(folderId);
    }
    setSelectedFolders(newSelected);
  };

  const handleBulkDownload = () => {
    const filesToDownload = files.filter((f) => selectedFiles.has(f._id));
    filesToDownload.forEach((file) => {
      useTransferStore.getState().addDownload(file._id, file.name, file.size);
    });
    toast({
      title: "Bulk Download Started",
      description: `Added ${filesToDownload.length} files to queue.`,
    });
    // Note: We don't clear selection here so user can see what they downloaded
    // or perform other actions.
    setSelectedFiles(new Set());
  };

  /**
   * Deletes all selected files and folders.
   */
  const handleBulkDelete = async () => {
    const totalCount = selectedFiles.size + selectedFolders.size;
    if (
      !window.confirm(
        `Are you sure you want to delete ${totalCount} items? Folders will be deleted recursively.`
      )
    )
      return;

    try {
      const token = useAuthStore.getState().token;
      const promises = [];

      // Delete Files
      selectedFiles.forEach((id) => {
        promises.push(
          axios.delete(`${API_URL}/files/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
        );
      });

      // Delete Folders
      selectedFolders.forEach((id) => {
        promises.push(
          axios.delete(`${API_URL}/folders/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
        );
      });

      await Promise.all(promises);

      toast({
        title: "Bulk Delete Complete",
        description: `Deleted ${totalCount} items.`,
      });
      setSelectedFiles(new Set());
      setSelectedFolders(new Set());
      queryClient.invalidateQueries(["files"]);
      queryClient.invalidateQueries(["folders"]);
    } catch (error) {
      console.error("Bulk delete failed:", error);
      toast({
        variant: "destructive",
        title: "Bulk Delete Failed",
        description: "Some items could not be deleted.",
      });
    }
  };

  if (isFilesLoading || isFoldersLoading)
    return <Loading text="Loading contents..." />;

  const totalItems =
    (filteredFiles?.length || 0) + (filteredFolders?.length || 0);
  const totalSelected = selectedFiles.size + selectedFolders.size;
  const isAllSelected = totalItems > 0 && totalSelected === totalItems;

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500 relative">
      {/* Bulk Actions Bar */}
      {totalSelected > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-primary text-primary-foreground px-6 py-3 rounded-full shadow-xl flex items-center gap-4 animate-in slide-in-from-bottom-10 fade-in duration-300">
          <span className="font-medium">{totalSelected} selected</span>
          <div className="h-4 w-px bg-primary-foreground/20" />
          {selectedFiles.size > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="hover:bg-primary-foreground/10 text-primary-foreground"
              onClick={handleBulkDownload}
            >
              <Download className="mr-2 h-4 w-4" /> Download Files
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="hover:bg-destructive hover:text-destructive-foreground text-primary-foreground"
            onClick={handleBulkDelete}
          >
            <Trash2 className="mr-2 h-4 w-4" /> Delete
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="ml-2 h-6 w-6 hover:bg-primary-foreground/10 rounded-full"
            onClick={() => {
              setSelectedFiles(new Set());
              setSelectedFolders(new Set());
            }}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Files</h1>
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground overflow-x-auto">
            {folderHistory.map((folder, index) => (
              <React.Fragment key={index}>
                {index > 0 && <ChevronRight className="h-4 w-4" />}
                <button
                  onClick={() => navigateToBreadcrumb(index)}
                  className={`hover:text-primary transition-colors flex items-center gap-1 ${
                    index === folderHistory.length - 1
                      ? "font-semibold text-foreground"
                      : ""
                  }`}
                >
                  {index === 0 && <Home className="h-3 w-3" />}
                  {folder.name}
                </button>
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {currentFolderId && (
            <Button variant="outline" onClick={navigateUp}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
          )}

          <Dialog
            open={isCreateFolderOpen}
            onOpenChange={setIsCreateFolderOpen}
          >
            <DialogTrigger asChild>
              <Button variant="outline">
                <FolderPlus className="mr-2 h-4 w-4" /> New Folder
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Folder</DialogTitle>
                <DialogDescription>
                  Enter a name for the new folder.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateFolder}>
                <Input
                  placeholder="Folder Name"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  autoFocus
                />
                <DialogFooter className="mt-4">
                  <Button type="submit" disabled={isCreatingFolder}>
                    {isCreatingFolder ? "Creating..." : "Create Folder"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
            <DialogTrigger asChild>
              <Button>
                <UploadCloud className="mr-2 h-4 w-4" /> Upload Here
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl">
              <DialogHeader>
                <DialogTitle>
                  Upload to {folderHistory[folderHistory.length - 1].name}
                </DialogTitle>
              </DialogHeader>
              <div className="mt-4">
                <UploadZone
                  onUploadComplete={() => setIsUploadOpen(false)}
                  folderId={currentFolderId}
                />
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 w-full md:w-auto">
        <div className="relative w-full md:w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search..."
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

      {/* Content Table */}
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]">
                <Checkbox checked={isAllSelected} onChange={toggleSelectAll} />
              </TableHead>
              <TableHead className="w-[50%]">Name</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* Folders */}
            {filteredFolders?.map((folder) => (
              <TableRow
                key={folder._id}
                className="cursor-pointer hover:bg-muted/50"
                onDoubleClick={() => navigateToFolder(folder)}
                data-state={selectedFolders.has(folder._id) && "selected"}
              >
                <TableCell>
                  <Checkbox
                    checked={selectedFolders.has(folder._id)}
                    onChange={() => toggleSelectFolder(folder._id)}
                    onClick={(e) => e.stopPropagation()} // Prevent navigation when clicking checkbox
                  />
                </TableCell>
                <TableCell className="font-medium flex items-center gap-2">
                  <FolderIcon className="h-5 w-5 text-yellow-500 fill-yellow-500/20" />
                  {folder.name}
                </TableCell>
                <TableCell>-</TableCell>
                <TableCell>Folder</TableCell>
                <TableCell>
                  {new Date(folder.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteFolder(folder._id);
                    }}
                    title="Delete Folder"
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}

            {/* Files */}
            {filteredFiles?.map((file) => (
              <TableRow
                key={file._id}
                data-state={selectedFiles.has(file._id) && "selected"}
              >
                <TableCell>
                  <Checkbox
                    checked={selectedFiles.has(file._id)}
                    onChange={() => toggleSelectFile(file._id)}
                  />
                </TableCell>
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
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        handleDownload(file._id, file.name, file.size)
                      }
                      title="Download"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteFile(file._id)}
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}

            {!filteredFiles?.length && !filteredFolders?.length && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-24 text-center text-muted-foreground"
                >
                  {searchTerm ? "No results found." : "This folder is empty."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={closePreview}>
        <DialogContent className="sm:max-w-4xl bg-background/95 backdrop-blur-xl h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{previewFile?.name}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
            {previewUrl ? (
              previewFile?.mimeType === "application/pdf" ? (
                <iframe
                  src={previewUrl}
                  title="PDF Preview"
                  className="w-full h-full rounded-md shadow-lg border-none"
                />
              ) : previewFile?.mimeType?.startsWith("video/") ? (
                <video
                  src={previewUrl}
                  controls
                  className="max-h-full max-w-full rounded-md shadow-lg"
                />
              ) : previewFile?.mimeType?.startsWith("audio/") ? (
                <audio src={previewUrl} controls className="w-full mt-10" />
              ) : (
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="max-h-full max-w-full object-contain rounded-md shadow-lg"
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
