import React, { useState, useEffect } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";
import axios from "axios";
import { useAuthStore } from "@/store/useAuthStore";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Image as ImageIcon,
  Video,
  Music,
  Play,
  Maximize2,
  Loader2,
  Film,
  Cloud,
} from "lucide-react";
import Loading from "@/components/ui/Loading";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const API_URL = import.meta.env.VITE_API_URL;

// --- Image Cache (Module Level) ---
const imageCache = new Map();

const Media = () => {
  const { token } = useAuthStore();
  const [activeTab, setActiveTab] = useState("photos");
  const { ref, inView } = useInView();

  // --- Data Fetching ---
  const fetchMedia = async ({ pageParam = 1, queryKey }) => {
    const [_key, type] = queryKey;
    const res = await axios.get(`${API_URL}/files/media`, {
      params: { type, page: pageParam, limit: 20 },
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  };

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteQuery({
    queryKey: ["media", activeTab],
    queryFn: fetchMedia,
    getNextPageParam: (lastPage) => {
      return lastPage.page < lastPage.pages ? lastPage.page + 1 : undefined;
    },
    staleTime: 1000 * 60 * 5, // Cache list for 5 minutes
  });

  // Infinite Scroll Trigger
  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, fetchNextPage]);

  // --- Preview State ---
  const [previewItem, setPreviewItem] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const handlePreview = async (item) => {
    setPreviewItem(item);

    // Check cache first for images
    if (imageCache.has(item._id)) {
      setPreviewUrl(imageCache.get(item._id));
      setIsPreviewOpen(true);
      return;
    }

    setPreviewUrl(null);
    setIsPreviewOpen(true);

    try {
      const res = await axios.get(`${API_URL}/files/${item._id}/download`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(
        new Blob([res.data], { type: item.mimeType })
      );
      // Cache it if it's an image (or maybe video/audio too if small enough, but sticking to images for now)
      if (item.mimeType.startsWith("image/")) {
        imageCache.set(item._id, url);
      }
      setPreviewUrl(url);
    } catch (err) {
      console.error("Failed to load media", err);
    }
  };

  const closePreview = () => {
    setIsPreviewOpen(false);
    // Don't revoke if it's in the cache!
    if (previewUrl && !imageCache.has(previewItem?._id)) {
      window.URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setPreviewItem(null);
  };

  // --- Media Item Component (Lazy Load) ---
  const MediaItem = ({ item, onClick }) => {
    const { ref, inView } = useInView({
      triggerOnce: true,
      threshold: 0.1,
    });
    // Initialize from cache if available
    const [imageUrl, setImageUrl] = useState(imageCache.get(item._id) || null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
      // If we already have the image (from cache or state), do nothing
      if (imageUrl) return;

      if (inView && item.mimeType.startsWith("image/")) {
        // Double check cache in case it was added since render (unlikely but safe)
        if (imageCache.has(item._id)) {
          setImageUrl(imageCache.get(item._id));
          return;
        }

        const fetchImage = async () => {
          setIsLoading(true);
          try {
            const res = await axios.get(
              `${API_URL}/files/${item._id}/download`,
              {
                headers: { Authorization: `Bearer ${token}` },
                responseType: "blob",
              }
            );
            const url = window.URL.createObjectURL(res.data);
            imageCache.set(item._id, url); // Cache the URL
            setImageUrl(url);
          } catch (err) {
            console.error("Failed to load thumbnail", err);
          } finally {
            setIsLoading(false);
          }
        };
        fetchImage();
      }
    }, [inView, item, imageUrl]);

    // Note: We don't revoke URLs on unmount anymore to keep the cache valid for the session.
    // In a real app, we might want an LRU cache to avoid memory leaks over long sessions.

    return (
      <div
        ref={ref}
        className="group relative aspect-square rounded-xl overflow-hidden bg-slate-100 dark:bg-white/5 cursor-pointer border border-slate-200 dark:border-white/5 hover:border-cyan-500/50 transition-all"
        onClick={() => onClick(item)}
      >
        {/* Thumbnail / Icon */}
        <div className="absolute inset-0 flex items-center justify-center text-slate-300 dark:text-slate-600 bg-slate-50 dark:bg-black/20">
          {item.mimeType.startsWith("image/") ? (
            imageUrl ? (
              <img
                src={imageUrl}
                alt={item.name}
                className="w-full h-full object-cover animate-in fade-in duration-500"
              />
            ) : (
              <div className="flex flex-col items-center gap-2">
                {isLoading ? (
                  <Cloud className="h-8 w-8 text-cyan-500 animate-pulse" />
                ) : (
                  <ImageIcon className="h-8 w-8" />
                )}
              </div>
            )
          ) : item.mimeType.startsWith("video/") ? (
            <Video className="h-8 w-8" />
          ) : (
            <Music className="h-8 w-8" />
          )}
        </div>

        {/* Overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
          <Maximize2 className="text-white h-6 w-6 drop-shadow-md" />
        </div>

        {/* Label */}
        <div className="absolute bottom-0 inset-x-0 p-2 bg-gradient-to-t from-black/60 to-transparent">
          <p className="text-xs text-white truncate">{item.name}</p>
        </div>
      </div>
    );
  };

  const renderMediaGrid = (items) => {
    if (!items || items.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Film className="h-16 w-16 mb-4 opacity-20" />
          <p>No media found.</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {items.map((item) => (
          <MediaItem key={item._id} item={item} onClick={handlePreview} />
        ))}
      </div>
    );
  };

  const allItems = data?.pages.flatMap((page) => page.data.files) || [];

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500 min-h-screen">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
          Media Center
        </h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3 bg-slate-100 dark:bg-white/5">
          <TabsTrigger value="photos">Photos</TabsTrigger>
          <TabsTrigger value="videos">Videos</TabsTrigger>
          <TabsTrigger value="audio">Audio</TabsTrigger>
        </TabsList>

        <div className="mt-6">
          {isLoading ? (
            <Loading text="Loading media..." />
          ) : isError ? (
            <div className="text-red-500">Failed to load media.</div>
          ) : (
            <>
              {renderMediaGrid(allItems)}

              {/* Infinite Scroll Loader */}
              <div ref={ref} className="py-8 flex justify-center">
                {isFetchingNextPage && (
                  <Loader2 className="h-6 w-6 animate-spin text-cyan-500" />
                )}
              </div>
            </>
          )}
        </div>
      </Tabs>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={closePreview}>
        <DialogContent className="max-w-4xl w-full bg-black/95 border-white/10 p-0 overflow-hidden">
          <div className="relative flex items-center justify-center min-h-[50vh] max-h-[80vh]">
            {!previewUrl ? (
              <Loading text="Loading media..." />
            ) : previewItem?.mimeType.startsWith("video/") ? (
              <video
                src={previewUrl}
                controls
                autoPlay
                className="max-w-full max-h-[80vh]"
              />
            ) : previewItem?.mimeType.startsWith("audio/") ? (
              <div className="p-10 text-center">
                <Music className="h-20 w-20 text-cyan-500 mx-auto mb-4 animate-pulse" />
                <h3 className="text-white text-xl font-medium mb-4">
                  {previewItem.name}
                </h3>
                <audio
                  src={previewUrl}
                  controls
                  className="w-full min-w-[300px]"
                />
              </div>
            ) : (
              <img
                src={previewUrl}
                alt="Preview"
                className="max-w-full max-h-[80vh] object-contain"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Media;
