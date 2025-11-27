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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Upload,
  HardDrive,
  Activity,
  ShieldCheck,
  Download,
} from "lucide-react";
import Loading from "@/components/ui/Loading";
import { useToast } from "@/components/ui/use-toast";
import axios from "axios";
import { useAuthStore } from "@/store/useAuthStore";
import NetworkTopology from "@/components/dashboard/NetworkTopology";
import { useQuery } from "@tanstack/react-query";

const API_URL = import.meta.env.VITE_API_URL;

const Dashboard = () => {
  const { data: user, isLoading: isUserLoading } = useUserQuery();
  const { data: files, isLoading: isFilesLoading } = useFilesQuery();
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const { toast } = useToast();

  const { data: quotaData, isLoading: isQuotaLoading } = useQuery({
    queryKey: ["quota"],
    queryFn: async () => {
      const token = useAuthStore.getState().token;
      const res = await axios.get(`${API_URL}/providers/quota`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data.data.quotas;
    },
    // Refetch every 5 minutes
    refetchInterval: 5 * 60 * 1000,
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
        responseType: "blob", // Important for binary data
      });

      // Create a blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", fileName); // or any other extension
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

  if (isUserLoading || isFilesLoading)
    return <Loading text="Initializing Command Center..." />;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header / Bridge */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
            Command Center
          </h1>
          <p className="text-muted-foreground mt-1">
            Welcome back, {user?.email?.split("@")[0]}. Systems operational.
          </p>
        </div>

        <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
          <DialogTrigger asChild>
            <Button
              size="lg"
              className="shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all"
            >
              <Upload className="mr-2 h-5 w-5" />
              Upload Data
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-xl bg-background/95 backdrop-blur-xl border-primary/20">
            <DialogHeader>
              <DialogTitle>Secure Transmission</DialogTitle>
              <DialogDescription>
                Encrypt, shard, and distribute your files across the network.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4">
              <UploadZone onUploadComplete={() => setIsUploadOpen(false)} />
            </div>
          </DialogContent>
        </Dialog>
      </div>
      {/* Core Status Section */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Storage Card */}
        <Card className="col-span-2 bg-gradient-to-br from-background to-muted/50 border-primary/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="h-5 w-5 text-primary" />
              Core Storage Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2">
              <span className="text-5xl font-bold tracking-tighter">
                {(totalUsed / (1024 * 1024 * 1024)).toFixed(2)}
              </span>
              <span className="text-xl text-muted-foreground mb-1">
                GB Used
              </span>
            </div>
            <div className="h-2 w-full bg-secondary mt-4 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-1000"
                style={{
                  width: `${
                    totalLimit > 0 ? (totalUsed / totalLimit) * 100 : 0
                  }%`,
                }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {totalLimit > 0 ? ((totalUsed / totalLimit) * 100).toFixed(1) : 0}
              % of aggregated cloud capacity.
            </p>
          </CardContent>
        </Card>

        {/* Provider Status Cards */}
        {quotaData?.map((quota) => (
          <ProviderCard
            key={`${quota.provider}-${quota.providerId}`}
            provider={
              quota.provider === "google"
                ? `Google Drive (${quota.email || "Linked"})`
                : quota.provider
            }
            isConnected={true}
            quota={quota}
          />
        ))}

        {/* Placeholder for unconnected providers if none exist */}
        {!quotaData?.some((q) => q.provider === "google") && (
          <ProviderCard
            provider="Google Drive"
            isConnected={false}
            quota={null}
          />
        )}
        <ProviderCard provider="Dropbox" isConnected={false} quota={null} />
      </div>

      {/* Recent Transmissions & Network Visualizer */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="col-span-2 border-primary/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-400" />
              Recent Transmissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {files?.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No files transmitted yet.
                </p>
              ) : (
                files?.slice(0, 5).map((file) => (
                  <div
                    key={file._id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors border border-transparent hover:border-primary/10"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="p-2 rounded-full bg-primary/10 text-primary shrink-0">
                        <ShieldCheck className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate max-w-[200px]">
                          {file.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {(file.size / (1024 * 1024)).toFixed(2)} MB •{" "}
                          {new Date(file.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="px-2 py-1 rounded-full bg-green-500/10 text-green-500 text-xs font-medium border border-green-500/20 hidden sm:block">
                        Encrypted
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDownload(file._id, file.name)}
                        className="hover:text-primary hover:bg-primary/10"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Network Topology Visualizer */}
        <NetworkTopology files={files} />
      </div>
    </div>
  );
};

export default Dashboard;
