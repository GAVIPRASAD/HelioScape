import React, { useState } from "react";
import { useUserQuery } from "@/hooks/useUserQuery";
import { useFilesQuery } from "@/hooks/useFilesQuery";
import UploadZone from "@/components/dashboard/UploadZone";
import ProviderCard from "@/components/dashboard/ProviderCard";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Upload,
  HardDrive,
  Activity,
  ShieldCheck,
  Download,
  Server,
  Database,
} from "lucide-react";
import Loading from "@/components/ui/Loading";
import { useToast } from "@/components/ui/use-toast";
import axios from "axios";
import { useAuthStore } from "@/store/useAuthStore";
import NetworkTopology from "@/components/dashboard/NetworkTopology";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import ProviderCardSkeleton from "@/components/dashboard/ProviderCardSkeleton";
import { startTour } from "@/components/TourGuide";

import { API_BASE_URL as API_URL } from "@/constants";

const Dashboard = () => {
  const { data: user, isLoading: isUserLoading } = useUserQuery();
  const { data: filesData, isLoading: isFilesLoading } = useFilesQuery();

  // Start Tour Effect
  React.useEffect(() => {
    if (user && !user.preferences?.tourCompleted) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        startTour(user, () => {
          // Optional: Force re-fetch user to update local state if needed
          // queryClient.invalidateQueries(["user"]);
        });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [user]);

  const files = React.useMemo(() => {
    return filesData?.pages.flatMap((page) => page.data.files) || [];
  }, [filesData]);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: quotaData, isLoading: isQuotaLoading } = useQuery({
    queryKey: ["quota"],
    queryFn: async () => {
      const token = useAuthStore.getState().token;
      const res = await axios.get(`${API_URL}/providers/quota`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data.data.quotas;
    },
    staleTime: Infinity, // Only refetch on explicit invalidation (Smart Caching)
    gcTime: 1000 * 60 * 60 * 24, // Keep in memory for 24 hours
  });

  const totalUsed = quotaData?.reduce((acc, q) => acc + (q.used || 0), 0) || 0;
  const totalLimit =
    quotaData?.reduce((acc, q) => acc + (q.total || 0), 0) || 0;

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

  // Removed blocking loader to show skeletons
  // if (isUserLoading || isFilesLoading)
  //   return <Loading text="Initializing Command Center..." />;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1
            id="tour-welcome"
            className="font-heading text-4xl md:text-5xl font-bold tracking-tight text-slate-900 dark:text-white drop-shadow-sm dark:drop-shadow-lg"
          >
            Storage Overview
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg font-light">
            {isUserLoading ? (
              <Skeleton className="h-6 w-64" />
            ) : (
              <>
                Welcome back,{" "}
                <span className="text-cyan-600 dark:text-cyan-400 font-medium">
                  {user?.email?.split("@")[0]}
                </span>
                . Systems operational.
              </>
            )}
          </p>
        </div>

        {user?.linkedAccounts?.length > 0 ? (
          <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
            <DialogTrigger asChild>
              <Button
                size="lg"
                className="h-12 px-8 rounded-full bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-white font-bold shadow-lg transition-all hover:scale-105"
              >
                <Upload className="mr-2 h-5 w-5" />
                Upload Data
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl glass-panel border-slate-200 dark:border-white/10 text-slate-900 dark:text-white">
              <DialogHeader>
                <DialogTitle className="text-2xl font-heading">
                  Secure Transmission
                </DialogTitle>
                <DialogDescription className="text-slate-500 dark:text-slate-400">
                  Encrypt, shard, and distribute your files across the network.
                </DialogDescription>
              </DialogHeader>
              <div className="mt-6" id="tour-upload-area">
                <UploadZone
                  onUploadComplete={() => {
                    setIsUploadOpen(false);
                    queryClient.invalidateQueries({ queryKey: ["quota"] });
                    queryClient.invalidateQueries({ queryKey: ["files"] });
                    toast({
                      title: "Upload Complete",
                      description: "Storage stats updated.",
                    });
                  }}
                />
              </div>
            </DialogContent>
          </Dialog>
        ) : (
          <Dialog>
            <DialogTrigger asChild>
              <Button
                size="lg"
                className="h-12 px-8 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-500 cursor-not-allowed"
                onClick={(e) => {
                  e.preventDefault();
                  toast({
                    variant: "destructive",
                    title: "No Storage Connected",
                    description:
                      "Please connect a cloud account in Settings first.",
                  });
                }}
              >
                <Upload className="mr-2 h-5 w-5" />
                Upload Data
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Connect Storage</DialogTitle>
                <DialogDescription>
                  You need to connect at least one cloud storage provider
                  (Google Drive, Dropbox, or MEGA) to start uploading files.
                </DialogDescription>
              </DialogHeader>
              <div className="flex justify-end mt-4">
                <Button asChild>
                  <a href="/settings">Go to Settings</a>
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Core Status Section */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Storage Card */}
        <div
          id="tour-storage-overview"
          className="col-span-2 glass-panel rounded-3xl p-6 relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Database className="h-32 w-32 text-cyan-500 dark:text-cyan-400" />
          </div>

          <div className="relative z-10">
            <h3 className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-medium mb-4">
              <HardDrive className="h-5 w-5 text-cyan-500 dark:text-cyan-400" />
              Core Storage Status
            </h3>

            <div className="flex items-baseline gap-2 mb-6">
              {isQuotaLoading ? (
                <Skeleton className="h-16 w-32" />
              ) : (
                <span className="text-6xl font-heading font-bold text-slate-900 dark:text-white tracking-tighter">
                  {(totalUsed / (1024 * 1024 * 1024)).toFixed(2)}
                </span>
              )}
              <span className="text-xl text-slate-500 dark:text-slate-400">
                GB / {(totalLimit / (1024 * 1024 * 1024)).toFixed(2)} GB Used
              </span>
            </div>

            <div className="h-3 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden backdrop-blur-sm border border-slate-200 dark:border-white/5">
              {isQuotaLoading ? (
                <Skeleton className="h-full w-full" />
              ) : (
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 via-violet-500 to-emerald-500 transition-all duration-1000 relative"
                  style={{
                    width: `${
                      totalLimit > 0 ? (totalUsed / totalLimit) * 100 : 0
                    }%`,
                  }}
                >
                  <div className="absolute inset-0 bg-white/20 animate-pulse" />
                </div>
              )}
            </div>

            <div className="flex justify-between items-center mt-3 text-sm">
              <span className="text-cyan-600 dark:text-cyan-400 font-medium">
                {isQuotaLoading ? (
                  <Skeleton className="h-4 w-12" />
                ) : (
                  <>
                    {totalLimit > 0
                      ? ((totalUsed / totalLimit) * 100).toFixed(1)
                      : 0}
                    % Capacity
                  </>
                )}
              </span>
              <span className="text-slate-500">Aggregated Cloud Storage</span>
            </div>
          </div>
        </div>

        {/* Provider Status Cards */}
        {isQuotaLoading ? (
          <>
            <ProviderCardSkeleton />
            <ProviderCardSkeleton />
            <ProviderCardSkeleton />
          </>
        ) : (
          <>
            {quotaData?.map((quota) => (
              <ProviderCard
                key={`${quota.provider}-${quota.providerId}`}
                provider={
                  quota.provider === "google" ? `Google Drive` : quota.provider
                }
                subtext={quota.email}
                isConnected={true}
                quota={quota}
              />
            ))}

            {/* Placeholder for unconnected providers */}
            {!quotaData?.some((q) => q.provider === "google") && (
              <ProviderCard
                provider="Google Drive"
                isConnected={false}
                quota={null}
              />
            )}
            {!quotaData?.some((q) => q.provider === "dropbox") && (
              <ProviderCard
                provider="Dropbox"
                isConnected={false}
                quota={null}
              />
            )}
            {!quotaData?.some((q) => q.provider === "mega") && (
              <ProviderCard provider="MEGA" isConnected={false} quota={null} />
            )}
          </>
        )}
      </div>

      {/* Recent Transmissions & Network Visualizer */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="col-span-2 glass-panel rounded-3xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="flex items-center gap-2 text-slate-900 dark:text-white font-heading font-semibold text-xl">
              <Activity className="h-5 w-5 text-violet-500 dark:text-violet-400" />
              Recent Transmissions
            </h3>
            <Button
              variant="ghost"
              size="sm"
              className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-full"
            >
              View All
            </Button>
          </div>

          <div className="space-y-3">
            {isFilesLoading ? (
              <>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-xl" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-xl" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-xl" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                </div>
              </>
            ) : files?.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="h-20 w-20 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-4 animate-pulse">
                  <Server className="h-10 w-10 text-slate-400 dark:text-slate-500" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
                  No Transmissions Yet
                </h3>
                <p className="text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                  Your secure file network is idle. Upload data to see activity
                  here.
                </p>
              </div>
            ) : (
              files?.slice(0, 5).map((file) => (
                <div
                  key={file._id}
                  className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 transition-all duration-300 border border-slate-100 dark:border-white/5 group"
                >
                  <div className="flex items-center gap-4 overflow-hidden">
                    <div className="p-3 rounded-xl bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 group-hover:scale-110 transition-transform">
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900 dark:text-white truncate max-w-[200px] group-hover:text-cyan-600 dark:group-hover:text-cyan-300 transition-colors">
                        {file.name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {(file.size / (1024 * 1024)).toFixed(2)} MB •{" "}
                        {new Date(file.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-medium border border-emerald-100 dark:border-emerald-500/20 hidden sm:block">
                      Encrypted
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDownload(file._id, file.name)}
                      className="text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 rounded-full"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Network Topology Visualizer */}
        <div className="glass-panel rounded-3xl p-1 overflow-hidden h-full min-h-[300px]">
          <NetworkTopology files={files} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
