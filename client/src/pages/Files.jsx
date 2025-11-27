import React, { useState } from "react";
import { useFilesQuery } from "@/hooks/useFilesQuery";
import { useFoldersQuery } from "@/hooks/useFoldersQuery";
import { useCreateFolderMutation } from "@/hooks/useCreateFolderMutation";
import { useAuthStore } from "@/store/useAuthStore";
import { useSearchStore } from "@/store/useSearchStore";
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
  Maximize2,
  Minimize2,
  LayoutGrid,
  List,
  FileText,
  FileImage,
  FileVideo,
  FileAudio,
  FileCode,
  FileArchive,
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
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTransferStore } from "@/store/useTransferStore";
import UploadZone from "@/components/dashboard/UploadZone";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSearchParams } from "react-router-dom";
import { useFolderQuery } from "@/hooks/useFolderQuery";
import FileDetailsPanel from "@/components/dashboard/FileDetailsPanel";
import { Info } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;

const Files = () => {
  // --- State Management ---
  const [searchParams, setSearchParams] = useSearchParams();
  const currentFolderId = searchParams.get("folderId") || null;
  const searchTerm = useSearchStore((state) => state.searchTerm);
  const setSearchTerm = useSearchStore((state) => state.setSearchTerm);

  const { data: currentFolder } = useFolderQuery(currentFolderId);

  const [folderHistory, setFolderHistory] = useState([
    { id: null, name: "Home" },
  ]);

  // Sync History with URL/Current Folder
  React.useEffect(() => {
    if (!currentFolderId) {
      setFolderHistory([{ id: null, name: "Home" }]);
      return;
    }

    if (currentFolder) {
      setFolderHistory((prev) => {
        const index = prev.findIndex((f) => f.id === currentFolderId);
        if (index !== -1) {
          return prev.slice(0, index + 1);
        }
        if (prev.length === 1 && prev[0].id === null) {
          return [...prev, { id: currentFolder._id, name: currentFolder.name }];
        }
        return [...prev, { id: currentFolder._id, name: currentFolder.name }];
      });
    }
  }, [currentFolderId, currentFolder]);

  // Data Fetching
  const { data: files, isLoading: isFilesLoading } =
    useFilesQuery(currentFolderId);
  const { data: folders, isLoading: isFoldersLoading } =
    useFoldersQuery(currentFolderId);

  // Global Search Query
  const { data: searchResults, isLoading: isSearchLoading } = useQuery({
    queryKey: ["search", searchTerm],
    queryFn: async () => {
      if (!searchTerm) return null;
      const token = useAuthStore.getState().token;
      const res = await axios.get(`${API_URL}/files/search`, {
        params: { q: searchTerm },
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data.data;
    },
    enabled: !!searchTerm,
  });

  // Mutations
  const { mutate: createFolder, isPending: isCreatingFolder } =
    useCreateFolderMutation();

  // UI State
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [filterType, setFilterType] = useState("all");
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  // Initialize from localStorage or default to 'grid'
  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem("filesViewMode") || "grid";
  });

  // Persist viewMode changes
  React.useEffect(() => {
    localStorage.setItem("filesViewMode", viewMode);
  }, [viewMode]);

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

  // Details Panel State
  const [isDetailsPanelOpen, setIsDetailsPanelOpen] = useState(false);
  const [selectedItemForDetails, setSelectedItemForDetails] = useState(null);

  // Update details item when selection changes (if single selection)
  React.useEffect(() => {
    const totalSelected = selectedFiles.size + selectedFolders.size;
    if (totalSelected === 1) {
      if (selectedFiles.size === 1) {
        const fileId = Array.from(selectedFiles)[0];
        const file =
          files?.find((f) => f._id === fileId) ||
          searchResults?.files?.find((f) => f._id === fileId);
        if (file) setSelectedItemForDetails(file);
      } else {
        const folderId = Array.from(selectedFolders)[0];
        const folder =
          folders?.find((f) => f._id === folderId) ||
          searchResults?.folders?.find((f) => f._id === folderId);
        if (folder) setSelectedItemForDetails(folder);
      }
    } else {
      setSelectedItemForDetails(null);
      // Optional: Close panel if selection is cleared or multi-select?
      // setIsDetailsPanelOpen(false);
    }
  }, [selectedFiles, selectedFolders, files, folders, searchResults]);

  // --- Handlers ---

  const handleShowDetails = (item) => {
    setSelectedItemForDetails(item);
    setIsDetailsPanelOpen(true);
  };

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
    if (isFilesLoading || isFoldersLoading) return;
    setSearchParams({ folderId: folder._id });
    setSearchTerm("");
    setSelectedFiles(new Set());
    setSelectedFolders(new Set());
  };

  const navigateUp = () => {
    if (isFilesLoading || isFoldersLoading) return;
    if (folderHistory.length <= 1) return;
    const parent = folderHistory[folderHistory.length - 2];
    if (parent.id) {
      setSearchParams({ folderId: parent.id });
    } else {
      setSearchParams({});
    }
    setSelectedFiles(new Set());
    setSelectedFolders(new Set());
  };

  const navigateToBreadcrumb = (index) => {
    if (isFilesLoading || isFoldersLoading) return;
    const target = folderHistory[index];
    if (target.id) {
      setSearchParams({ folderId: target.id });
    } else {
      setSearchParams({});
    }
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

  // --- Filtering Logic ---

  const filteredFiles = searchTerm
    ? searchResults?.files || []
    : files?.filter((file) => {
        if (filterType === "all") return true;
        if (filterType === "documents")
          return (
            file.mimeType.includes("pdf") ||
            file.mimeType.includes("text") ||
            file.mimeType.includes("document")
          );
        if (filterType === "images") return file.mimeType.includes("image");
        if (filterType === "media")
          return (
            file.mimeType.includes("video") || file.mimeType.includes("audio")
          );
        return true;
      });

  const filteredFolders = searchTerm
    ? searchResults?.folders || []
    : folders || [];

  // --- Action Handlers ---

  // Action Loading State
  const [isActionLoading, setIsActionLoading] = useState(false);

  // --- Action Handlers ---

  const handleDownload = (fileId, fileName, fileSize) => {
    // Debounce/Guard
    if (isActionLoading) return;

    useTransferStore.getState().addDownload(fileId, fileName, fileSize);
    toast({
      title: "Download Started",
      description: "Added to transfer queue.",
    });
  };

  const handlePreview = async (file) => {
    if (isActionLoading) return;

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
      setIsActionLoading(true);
      setPreviewFile(file);
      setPreviewUrl(null); // Ensure loading state in dialog
      setIsPreviewOpen(true); // Open dialog immediately to show loader

      const token = useAuthStore.getState().token;
      // Removed persistent toast as dialog shows loading state

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
    } catch (error) {
      console.error("Preview failed:", error);
      setIsPreviewOpen(false); // Close dialog on error
      toast({
        variant: "destructive",
        title: "Preview Failed",
        description: "Could not retrieve file.",
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDeleteFile = async (fileId) => {
    if (isActionLoading) return;
    if (!window.confirm("Are you sure you want to delete this file?")) return;

    try {
      setIsActionLoading(true);
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
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDeleteFolder = async (folderId) => {
    if (isActionLoading) return;
    if (
      !window.confirm(
        "Are you sure? This will delete the folder and ALL contents."
      )
    )
      return;
    try {
      setIsActionLoading(true);
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
    } finally {
      setIsActionLoading(false);
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

  // --- Icon Helper ---
  const getFileIcon = (mimeType, className = "h-4 w-4") => {
    if (mimeType.includes("image")) return <FileImage className={className} />;
    if (mimeType.includes("pdf")) return <FileText className={className} />;
    if (mimeType.includes("text")) return <FileText className={className} />;
    if (mimeType.includes("video")) return <FileVideo className={className} />;
    if (mimeType.includes("audio")) return <FileAudio className={className} />;
    if (
      mimeType.includes("zip") ||
      mimeType.includes("compressed") ||
      mimeType.includes("tar")
    )
      return <FileArchive className={className} />;
    if (
      mimeType.includes("json") ||
      mimeType.includes("javascript") ||
      mimeType.includes("html") ||
      mimeType.includes("css")
    )
      return <FileCode className={className} />;
    return <FileIcon className={className} />;
  };

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500 relative min-h-screen">
      {/* ... (Bulk Actions and Header omitted for brevity, keeping existing structure) ... */}

      {/* Bulk Actions Bar */}
      {totalSelected > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 glass-panel bg-slate-900/90 dark:bg-black/80 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-4 animate-in slide-in-from-bottom-10 fade-in duration-300 border border-cyan-500/30 backdrop-blur-xl">
          <span className="font-medium text-cyan-400">
            {totalSelected} selected
          </span>
          <div className="h-4 w-px bg-white/20" />
          {selectedFiles.size > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="hover:bg-white/10 text-white hover:text-cyan-400 transition-colors"
              onClick={handleBulkDownload}
            >
              <Download className="mr-2 h-4 w-4" /> Download
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="hover:bg-white/10 text-white hover:text-violet-400 transition-colors"
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
            className="hover:bg-red-500/20 text-white hover:text-red-400 transition-colors"
            onClick={handleBulkDelete}
          >
            <Trash2 className="mr-2 h-4 w-4" /> Delete
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="ml-2 h-6 w-6 hover:bg-white/10 rounded-full"
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="font-heading text-4xl font-bold tracking-tight text-slate-900 dark:text-white drop-shadow-sm">
            My Files
          </h1>
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 mt-2 text-sm text-slate-500 dark:text-slate-400 overflow-x-auto scrollbar-hide">
            {folderHistory.map((folder, index) => (
              <React.Fragment key={index}>
                {index > 0 && (
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                )}
                <button
                  onClick={() => navigateToBreadcrumb(index)}
                  className={`hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors flex items-center gap-1 px-2 py-1 rounded-md hover:bg-slate-100 dark:hover:bg-white/5 ${
                    index === folderHistory.length - 1
                      ? "font-semibold text-slate-900 dark:text-white bg-slate-100 dark:bg-white/5"
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

        <div className="flex items-center gap-3">
          {currentFolderId && (
            <Button
              variant="outline"
              onClick={navigateUp}
              className="rounded-full border-slate-200 dark:border-white/10 bg-white/50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200"
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
          )}

          <Dialog
            open={isCreateFolderOpen}
            onOpenChange={setIsCreateFolderOpen}
          >
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="rounded-full border-slate-200 dark:border-white/10 bg-white/50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200"
              >
                <FolderPlus className="mr-2 h-4 w-4 text-cyan-500" /> New Folder
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-panel border-slate-200 dark:border-white/10">
              <DialogHeader>
                <DialogTitle className="text-slate-900 dark:text-white">
                  Create New Folder
                </DialogTitle>
                <DialogDescription className="text-slate-500 dark:text-slate-400">
                  Enter a name for the new folder.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateFolder}>
                <Input
                  placeholder="Folder Name"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  autoFocus
                  className="bg-white/50 dark:bg-black/20 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400"
                />
                <DialogFooter className="mt-4">
                  <Button
                    type="submit"
                    disabled={isCreatingFolder}
                    className="bg-cyan-600 hover:bg-cyan-700 text-white rounded-full"
                  >
                    {isCreatingFolder ? "Creating..." : "Create Folder"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-full bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-white shadow-lg shadow-cyan-500/20">
                <UploadCloud className="mr-2 h-4 w-4" /> Upload Here
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl glass-panel border-slate-200 dark:border-white/10">
              <DialogHeader>
                <DialogTitle className="text-slate-900 dark:text-white">
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
      <div className="flex flex-col sm:flex-row items-center gap-4 w-full">
        <div className="relative w-full sm:w-72 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-cyan-500 transition-colors" />
          <Input
            placeholder="Search files..."
            className="pl-10 rounded-full bg-white/50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-500 focus:ring-cyan-500/50 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Tabs
          defaultValue="all"
          value={filterType}
          onValueChange={setFilterType}
          className="w-full sm:w-auto"
        >
          <TabsList className="bg-slate-100/50 dark:bg-white/5 rounded-full p-1 border border-slate-200 dark:border-white/5">
            <TabsTrigger
              value="all"
              className="rounded-full data-[state=active]:bg-white dark:data-[state=active]:bg-white/10 data-[state=active]:text-cyan-600 dark:data-[state=active]:text-cyan-400"
            >
              All
            </TabsTrigger>
            <TabsTrigger
              value="documents"
              className="rounded-full data-[state=active]:bg-white dark:data-[state=active]:bg-white/10 data-[state=active]:text-cyan-600 dark:data-[state=active]:text-cyan-400"
            >
              Docs
            </TabsTrigger>
            <TabsTrigger
              value="images"
              className="rounded-full data-[state=active]:bg-white dark:data-[state=active]:bg-white/10 data-[state=active]:text-cyan-600 dark:data-[state=active]:text-cyan-400"
            >
              Images
            </TabsTrigger>
            <TabsTrigger
              value="media"
              className="rounded-full data-[state=active]:bg-white dark:data-[state=active]:bg-white/10 data-[state=active]:text-cyan-600 dark:data-[state=active]:text-cyan-400"
            >
              Media
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2 bg-slate-100/50 dark:bg-white/5 p-1 rounded-full border border-slate-200 dark:border-white/5 ml-auto">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setViewMode("grid")}
            className={`h-8 w-8 rounded-full transition-all ${
              viewMode === "grid"
                ? "bg-white dark:bg-white/10 text-cyan-600 dark:text-cyan-400 shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setViewMode("list")}
            className={`h-8 w-8 rounded-full transition-all ${
              viewMode === "list"
                ? "bg-white dark:bg-white/10 text-cyan-600 dark:text-cyan-400 shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content Area */}
      <div className="min-h-[500px]">
        {viewMode === "list" ? (
          <div className="glass-panel rounded-3xl overflow-hidden border border-slate-200 dark:border-white/5 shadow-sm">
            <Table>
              <TableHeader className="bg-slate-50/50 dark:bg-white/5">
                <TableRow className="hover:bg-transparent border-b border-slate-200 dark:border-white/5">
                  <TableHead className="w-[40px]">
                    <Checkbox
                      checked={isAllSelected}
                      onChange={toggleSelectAll}
                      className="border-slate-300 dark:border-white/30 data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500"
                    />
                  </TableHead>
                  <TableHead className="w-[40%] text-slate-900 dark:text-white font-semibold">
                    Name
                  </TableHead>
                  <TableHead className="text-slate-500 dark:text-slate-400">
                    Size
                  </TableHead>
                  <TableHead className="text-slate-500 dark:text-slate-400">
                    Type
                  </TableHead>
                  <TableHead className="text-slate-500 dark:text-slate-400">
                    Date
                  </TableHead>
                  <TableHead className="text-right text-slate-500 dark:text-slate-400">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Folders List View */}
                {filteredFolders?.map((folder) => (
                  <TableRow
                    key={folder._id}
                    className="cursor-pointer hover:bg-cyan-50/50 dark:hover:bg-white/5 border-b border-slate-100 dark:border-white/5 transition-colors group"
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
                    <TableCell className="text-right flex justify-end items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-400 hover:text-cyan-500"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleShowDetails(folder);
                        }}
                      >
                        <Info className="h-4 w-4" />
                      </Button>
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

                {/* Files List View */}
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
                    <TableCell
                      className="font-medium text-slate-900 dark:text-white flex items-center gap-2 cursor-pointer hover:text-cyan-500 transition-colors"
                      onClick={() => handlePreview(file)}
                    >
                      <div className="p-2 rounded-lg bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 group-hover:text-cyan-500 transition-colors">
                        {getFileIcon(file.mimeType, "h-4 w-4")}
                      </div>
                      {file.name}
                    </TableCell>
                    <TableCell>
                      {(file.size / (1024 * 1024)).toFixed(2)} MB
                    </TableCell>
                    <TableCell>{file.mimeType || "Unknown"}</TableCell>
                    <TableCell>
                      {new Date(file.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right flex justify-end items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-400 hover:text-cyan-500"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleShowDetails(file);
                        }}
                      >
                        <Info className="h-4 w-4" />
                      </Button>
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
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {/* Folders Grid View */}
            {filteredFolders?.map((folder) => (
              <div
                key={folder._id}
                className={`group relative p-4 rounded-2xl border transition-all duration-200 cursor-pointer ${
                  selectedFolders.has(folder._id)
                    ? "bg-cyan-50/50 dark:bg-cyan-500/10 border-cyan-200 dark:border-cyan-500/30"
                    : "bg-white/50 dark:bg-white/5 border-slate-200 dark:border-white/5 hover:border-cyan-200 dark:hover:border-cyan-500/30 hover:shadow-lg hover:shadow-cyan-500/5"
                }`}
                onDoubleClick={() => navigateToFolder(folder)}
                onClick={(e) => {
                  if (e.metaKey || e.ctrlKey) {
                    toggleSelectFolder(folder._id);
                  }
                }}
              >
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity z-10 flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 rounded-full bg-white/50 dark:bg-black/50 hover:bg-white dark:hover:bg-black text-slate-500 dark:text-slate-400"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleShowDetails(folder);
                    }}
                  >
                    <Info className="h-3 w-3" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 rounded-full bg-white/50 dark:bg-black/50 hover:bg-white dark:hover:bg-black"
                      >
                        <MoreVertical className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
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
                        className="text-destructive"
                        onClick={() => handleDeleteFolder(folder._id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="absolute top-3 left-3 z-10">
                  <Checkbox
                    checked={selectedFolders.has(folder._id)}
                    onChange={() => toggleSelectFolder(folder._id)}
                    className={`transition-opacity ${
                      selectedFolders.has(folder._id)
                        ? "opacity-100"
                        : "opacity-0 group-hover:opacity-100"
                    }`}
                  />
                </div>

                <div className="flex flex-col items-center gap-3 pt-4">
                  <FolderIcon className="h-16 w-16 text-yellow-500 fill-yellow-500/20 drop-shadow-sm transition-transform group-hover:scale-105" />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate w-full text-center px-2">
                    {folder.name}
                  </span>
                </div>
              </div>
            ))}

            {/* Files Grid View */}
            {filteredFiles?.map((file) => (
              <div
                key={file._id}
                className={`group relative p-4 rounded-2xl border transition-all duration-200 cursor-pointer ${
                  selectedFiles.has(file._id)
                    ? "bg-cyan-50/50 dark:bg-cyan-500/10 border-cyan-200 dark:border-cyan-500/30"
                    : "bg-white/50 dark:bg-white/5 border-slate-200 dark:border-white/5 hover:border-cyan-200 dark:hover:border-cyan-500/30 hover:shadow-lg hover:shadow-cyan-500/5"
                }`}
                onClick={() => handlePreview(file)}
              >
                <div
                  className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity z-10 flex items-center gap-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 rounded-full bg-white/50 dark:bg-black/50 hover:bg-white dark:hover:bg-black text-slate-500 dark:text-slate-400"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleShowDetails(file);
                    }}
                  >
                    <Info className="h-3 w-3" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 rounded-full bg-white/50 dark:bg-black/50 hover:bg-white dark:hover:bg-black"
                      >
                        <MoreVertical className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
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
                        className="text-destructive"
                        onClick={() => handleDeleteFile(file._id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div
                  className="absolute top-3 left-3 z-10"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Checkbox
                    checked={selectedFiles.has(file._id)}
                    onChange={() => toggleSelectFile(file._id)}
                    className={`transition-opacity ${
                      selectedFiles.has(file._id)
                        ? "opacity-100"
                        : "opacity-0 group-hover:opacity-100"
                    }`}
                  />
                </div>

                <div className="flex flex-col items-center gap-3 pt-4">
                  <div className="h-16 w-16 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-slate-500 group-hover:text-cyan-500 group-hover:bg-cyan-50 dark:group-hover:bg-cyan-500/10 transition-colors">
                    {getFileIcon(file.mimeType, "h-8 w-8")}
                  </div>
                  <div className="text-center w-full">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate w-full px-2">
                      {file.name}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!filteredFiles?.length && !filteredFolders?.length && (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <FolderIcon className="h-16 w-16 mb-4 opacity-20" />
            <p className="text-lg font-medium">This folder is empty</p>
            <p className="text-sm opacity-70">
              Upload files or create a folder to get started.
            </p>
          </div>
        )}
      </div>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={closePreview}>
        <DialogContent
          className={`bg-background/95 backdrop-blur-xl flex flex-col transition-all duration-300 ${
            isFullScreen
              ? "w-screen h-screen max-w-none rounded-none border-0"
              : "sm:max-w-4xl h-[80vh] rounded-xl border border-slate-200 dark:border-white/10"
          }`}
        >
          <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-slate-100 dark:border-white/5">
            <DialogTitle className="text-lg font-semibold text-slate-900 dark:text-white truncate pr-12 flex-1 text-left">
              {previewFile?.name}
            </DialogTitle>
            <div className="flex items-center gap-2 absolute right-12 top-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsFullScreen(!isFullScreen)}
                className="h-8 w-8 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-white/10"
              >
                {isFullScreen ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
              </Button>
            </div>
          </DialogHeader>
          <div className="flex-1 flex items-center justify-center p-4 overflow-hidden bg-slate-50/50 dark:bg-black/20">
            {previewUrl ? (
              previewFile?.mimeType === "application/pdf" ? (
                <iframe
                  src={previewUrl}
                  title="PDF Preview"
                  className="w-full h-full rounded-md shadow-sm border-none"
                />
              ) : previewFile?.mimeType?.startsWith("video/") ? (
                <video
                  src={previewUrl}
                  controls
                  className="max-h-full max-w-full rounded-md shadow-sm"
                />
              ) : previewFile?.mimeType?.startsWith("audio/") ? (
                <audio src={previewUrl} controls className="w-full mt-10" />
              ) : (
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="max-h-full max-w-full object-contain rounded-md shadow-sm"
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
      {/* File Details Panel */}
      <FileDetailsPanel
        item={selectedItemForDetails}
        isOpen={isDetailsPanelOpen}
        onClose={() => setIsDetailsPanelOpen(false)}
        onDownload={handleDownload}
        onRename={(item) =>
          openRenameDialog(item, item.mimeType ? "file" : "folder")
        }
        onDelete={(id) => {
          if (selectedItemForDetails.mimeType) handleDeleteFile(id);
          else handleDeleteFolder(id);
          setIsDetailsPanelOpen(false);
        }}
      />
    </div>
  );
};

export default Files;
