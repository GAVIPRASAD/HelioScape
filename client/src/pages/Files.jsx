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
  MoreVertical,
  Pencil,
  Move,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu.jsx";
import { useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTransferStore } from "@/store/useTransferStore";
import UploadZone from "@/components/dashboard/UploadZone";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";

const API_URL = import.meta.env.VITE_API_URL;

/**
 * Files Component
 * Displays a file explorer interface with folders and files.
 * Supports navigation, creation, upload, download, deletion, rename, and move.
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

  // For Move Dialog - fetch all folders to display tree
  // Ideally this should be a separate query or lazy loaded, but for MVP we might just fetch root
  // or use a special "all folders" endpoint. For now, let's just use the current folder's subfolders
  // which is NOT enough for moving TO another folder.
  // Let's implement a simple "Move Up" or "Move to Root" for now, or fetch root folders.
  // A better approach is a "FolderPicker" component.

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

  // Rename State
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [itemToRename, setItemToRename] = useState(null); // { id, type: 'file'|'folder', name }
  const [newName, setNewName] = useState("");

  // Move State
  const [isMoveOpen, setIsMoveOpen] = useState(false);
  const [itemToMove, setItemToMove] = useState(null); // { id, type: 'file'|'folder', name }
  const [moveTargetFolderId, setMoveTargetFolderId] = useState(null);
  // We need a way to browse folders in the move dialog.
  // We can reuse the useFoldersQuery but we need it for the *browsed* folder in the dialog, not the main view.
  // Let's create a mini-browser state for the move dialog.
  const [moveDialogCurrentFolderId, setMoveDialogCurrentFolderId] =
    useState(null);
  const [moveDialogHistory, setMoveDialogHistory] = useState([
    { id: null, name: "Home" },
  ]);

  // Fetch folders for the move dialog
  // We can't use the same hook instance because it's bound to currentFolderId.
  // We'll fetch manually or use a separate component.
  // For simplicity, let's just use a separate component for the Move Dialog content?
  // Or just fetch inside the effect?
  // Let's use a separate query key for the move dialog folders.
  // Actually, we can just use the existing hook if we extract the component.
  // But refactoring to sub-components is big.
  // Let's just use a simple fetch in useEffect for the move dialog for now.
  const [moveDialogFolders, setMoveDialogFolders] = useState([]);

  React.useEffect(() => {
    if (isMoveOpen) {
      const fetchFolders = async () => {
        try {
          const token = useAuthStore.getState().token;
          const res = await axios.get(`${API_URL}/folders`, {
            params: { parentId: moveDialogCurrentFolderId },
            headers: { Authorization: `Bearer ${token}` },
          });
          setMoveDialogFolders(res.data.data.folders);
        } catch (err) {
          console.error("Failed to fetch folders for move dialog", err);
        }
      };
      fetchFolders();
    }
  }, [isMoveOpen, moveDialogCurrentFolderId]);

  // Selection State
  const [selectedFiles, setSelectedFiles] = useState(new Set());
  const [selectedFolders, setSelectedFolders] = useState(new Set());

  // --- Handlers ---

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

  const navigateToFolder = (folder) => {
    setFolderHistory((prev) => [
      ...prev,
      { id: folder._id, name: folder.name },
    ]);
    setCurrentFolderId(folder._id);
    setSearchTerm("");
    setSelectedFiles(new Set());
    setSelectedFolders(new Set());
  };

  const navigateUp = () => {
    if (folderHistory.length <= 1) return;
    const newHistory = [...folderHistory];
    newHistory.pop();
    setFolderHistory(newHistory);
    setCurrentFolderId(newHistory[newHistory.length - 1].id);
    setSelectedFiles(new Set());
    setSelectedFolders(new Set());
  };

  const navigateToBreadcrumb = (index) => {
    const newHistory = folderHistory.slice(0, index + 1);
    setFolderHistory(newHistory);
    setCurrentFolderId(newHistory[newHistory.length - 1].id);
    setSelectedFiles(new Set());
    setSelectedFolders(new Set());
  };

  // --- Move Dialog Navigation ---
  const navigateMoveDialog = (folder) => {
    setMoveDialogHistory((prev) => [
      ...prev,
      { id: folder._id, name: folder.name },
    ]);
    setMoveDialogCurrentFolderId(folder._id);
  };

  const navigateMoveDialogUp = () => {
    if (moveDialogHistory.length <= 1) return;
    const newHistory = [...moveDialogHistory];
    newHistory.pop();
    setMoveDialogHistory(newHistory);
    setMoveDialogCurrentFolderId(newHistory[newHistory.length - 1].id);
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

  // --- Rename Logic ---
  const openRenameDialog = (item, type) => {
    setItemToRename({ ...item, type });
    setNewName(item.name);
    setIsRenameOpen(true);
  };

  const handleRename = async (e) => {
    e.preventDefault();
    if (!newName.trim() || !itemToRename) return;

    try {
      const token = useAuthStore.getState().token;
      const endpoint = itemToRename.type === "folder" ? "folders" : "files"; // Note: files endpoint is actually handled by uploadController but route is /files/:id/rename? No, route is /upload/:id/rename?
      // Wait, I need to check routes.
      // uploadRoutes is mounted at /files (usually) or /upload?
      // Let's assume standard REST: /api/files/:id/rename and /api/folders/:id/rename
      // I added routes to uploadRoutes.js and folderRoutes.js
      // uploadRoutes is likely mounted at /files based on listFiles being there.

      await axios.patch(
        `${API_URL}/${endpoint}/${itemToRename._id}/rename`,
        {
          name: newName,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast({
        title: "Renamed Successfully",
        description: `Renamed to ${newName}`,
      });
      setIsRenameOpen(false);
      queryClient.invalidateQueries(["files"]);
      queryClient.invalidateQueries(["folders"]);
    } catch (error) {
      console.error("Rename failed:", error);
      toast({
        variant: "destructive",
        title: "Rename Failed",
        description: error.response?.data?.message || "Could not rename item.",
      });
    }
  };

  // --- Move Logic ---
  const openMoveDialog = (item, type) => {
    setItemToMove({ ...item, type });
    setMoveDialogCurrentFolderId(null); // Start at root
    setMoveDialogHistory([{ id: null, name: "Home" }]);
    setIsMoveOpen(true);
  };

  const handleMove = async () => {
    try {
      const token = useAuthStore.getState().token;
      const promises = [];

      // Case 1: Single Item Move
      if (itemToMove) {
        const endpoint = itemToMove.type === "folder" ? "folders" : "files";
        promises.push(
          axios.patch(
            `${API_URL}/${endpoint}/${itemToMove._id}/move`,
            {
              [itemToMove.type === "folder" ? "parentId" : "folderId"]:
                moveDialogCurrentFolderId,
            },
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          )
        );
      }
      // Case 2: Bulk Move
      else {
        selectedFiles.forEach((id) => {
          promises.push(
            axios.patch(
              `${API_URL}/files/${id}/move`,
              { folderId: moveDialogCurrentFolderId },
              { headers: { Authorization: `Bearer ${token}` } }
            )
          );
        });
        selectedFolders.forEach((id) => {
          // Prevent moving a folder into itself or its children (backend handles this, but good to know)
          if (id === moveDialogCurrentFolderId) return;
          promises.push(
            axios.patch(
              `${API_URL}/folders/${id}/move`,
              { parentId: moveDialogCurrentFolderId },
              { headers: { Authorization: `Bearer ${token}` } }
            )
          );
        });
      }

      await Promise.all(promises);

      const destName = moveDialogHistory[moveDialogHistory.length - 1].name;
      toast({
        title: "Moved Successfully",
        description: `Moved items to ${destName}`,
      });

      setIsMoveOpen(false);
      setItemToMove(null);
      setSelectedFiles(new Set());
      setSelectedFolders(new Set());
      queryClient.invalidateQueries(["files"]);
      queryClient.invalidateQueries(["folders"]);
    } catch (error) {
      console.error("Move failed:", error);
      toast({
        variant: "destructive",
        title: "Move Failed",
        description: error.response?.data?.message || "Could not move items.",
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

  const toggleSelectAll = () => {
    const allFilesSelected =
      selectedFiles.size === filteredFiles?.length && filteredFiles?.length > 0;
    const allFoldersSelected =
      selectedFolders.size === filteredFolders?.length &&
      filteredFolders?.length > 0;

    if (allFilesSelected && allFoldersSelected) {
      setSelectedFiles(new Set());
      setSelectedFolders(new Set());
    } else {
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
    setSelectedFiles(new Set());
  };

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

      selectedFiles.forEach((id) => {
        promises.push(
          axios.delete(`${API_URL}/files/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
        );
      });

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
            className="hover:bg-primary-foreground/10 text-primary-foreground"
            onClick={() => {
              setItemToMove(null); // Clear single item
              setMoveDialogCurrentFolderId(null);
              setMoveDialogHistory([{ id: null, name: "Home" }]);
              setIsMoveOpen(true);
            }}
          >
            <Move className="mr-2 h-4 w-4" /> Move
          </Button>
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
                    onClick={(e) => e.stopPropagation()}
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
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem
                        onClick={() => openRenameDialog(folder, "folder")}
                      >
                        <Pencil className="mr-2 h-4 w-4" /> Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => openMoveDialog(folder, "folder")}
                      >
                        <Move className="mr-2 h-4 w-4" /> Move
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => handleDeleteFolder(folder._id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
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
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => handlePreview(file)}>
                        <Eye className="mr-2 h-4 w-4" /> Preview
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() =>
                          handleDownload(file._id, file.name, file.size)
                        }
                      >
                        <Download className="mr-2 h-4 w-4" /> Download
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => openRenameDialog(file, "file")}
                      >
                        <Pencil className="mr-2 h-4 w-4" /> Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => openMoveDialog(file, "file")}
                      >
                        <Move className="mr-2 h-4 w-4" /> Move
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => handleDeleteFile(file._id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
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

      {/* Rename Dialog */}
      <Dialog open={isRenameOpen} onOpenChange={setIsRenameOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename {itemToRename?.type}</DialogTitle>
            <DialogDescription>
              Enter a new name for this item.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRename}>
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="New Name"
              autoFocus
            />
            <DialogFooter className="mt-4">
              <Button type="submit">Rename</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Move Dialog */}
      <Dialog open={isMoveOpen} onOpenChange={setIsMoveOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Move to...</DialogTitle>
            <DialogDescription>Select a destination folder.</DialogDescription>
          </DialogHeader>

          <div className="border rounded-md h-[300px] flex flex-col">
            {/* Dialog Header / Breadcrumbs */}
            <div className="p-2 border-b bg-muted/50 flex items-center gap-2 text-sm">
              {moveDialogHistory.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={navigateMoveDialogUp}
                >
                  <ArrowLeft className="h-3 w-3" />
                </Button>
              )}
              <span className="font-medium truncate">
                {moveDialogHistory[moveDialogHistory.length - 1].name}
              </span>
            </div>

            {/* Folder List */}
            <ScrollArea className="flex-1 p-2">
              <div className="space-y-1">
                {moveDialogFolders.map((folder) => (
                  <div
                    key={folder._id}
                    className={`flex items-center gap-2 p-2 rounded-md cursor-pointer hover:bg-accent ${
                      folder._id === itemToMove?._id
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                    }`}
                    onClick={() => {
                      if (folder._id !== itemToMove?._id) {
                        navigateMoveDialog(folder);
                      }
                    }}
                  >
                    <FolderIcon className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm">{folder.name}</span>
                  </div>
                ))}
                {moveDialogFolders.length === 0 && (
                  <div className="text-center text-muted-foreground text-sm py-8">
                    No subfolders
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMoveOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleMove}
              disabled={
                moveDialogCurrentFolderId === itemToMove?.folder ||
                (itemToMove?.type === "folder" &&
                  moveDialogCurrentFolderId === itemToMove?._id)
              }
            >
              Move Here
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Files;
