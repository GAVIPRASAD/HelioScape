import React, { useState } from "react";
import { useUserQuery } from "@/hooks/useUserQuery";
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
import { Upload, HardDrive, Activity, ShieldCheck } from "lucide-react";
import Loading from "@/components/ui/Loading";

const Dashboard = () => {
  const { data: user, isLoading } = useUserQuery();
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  if (isLoading) return <Loading text="Initializing Command Center..." />;

  // Mock Data for "Recent Transmissions" until Phase 5
  const recentActivity = [
    {
      name: "Project_Alpha_Specs.pdf",
      size: "2.4 MB",
      status: "Encrypted",
      time: "2 mins ago",
    },
    {
      name: "Backup_2023.zip",
      size: "1.2 GB",
      status: "Distributed",
      time: "1 hour ago",
    },
    {
      name: "Client_Assets.png",
      size: "4.8 MB",
      status: "Sharded",
      time: "3 hours ago",
    },
  ];

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
              <span className="text-5xl font-bold tracking-tighter">45.2</span>
              <span className="text-xl text-muted-foreground mb-1">
                GB Used
              </span>
            </div>
            <div className="h-2 w-full bg-secondary mt-4 rounded-full overflow-hidden">
              <div className="h-full bg-primary w-[45%] animate-pulse" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              45% of total encrypted capacity utilized.
            </p>
          </CardContent>
        </Card>

        {/* Provider Status Cards */}
        <ProviderCard
          provider="Google Drive"
          isConnected={
            !!user?.linkedAccounts?.find((a) => a.provider === "google")
          }
          quota={{
            used: 15 * 1024 * 1024 * 1024,
            total: 100 * 1024 * 1024 * 1024,
          }} // Mock quota for now
        />
        <ProviderCard provider="Dropbox" isConnected={false} quota={null} />
      </div>

      {/* Recent Transmissions / Activity Feed */}
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
              {recentActivity.map((file, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors border border-transparent hover:border-primary/10"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-primary/10 text-primary">
                      <ShieldCheck className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {file.size} • {file.time}
                      </p>
                    </div>
                  </div>
                  <div className="px-2 py-1 rounded-full bg-green-500/10 text-green-500 text-xs font-medium border border-green-500/20">
                    {file.status}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats / Network Health */}
        <Card className="border-primary/10">
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Network Health
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Encryption</span>
              <span className="text-sm font-bold text-green-400">
                AES-256-GCM
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Shards</span>
              <span className="text-sm font-bold">3 Active</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Latency</span>
              <span className="text-sm font-bold">24ms</span>
            </div>
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground text-center">
                System integrity verified.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
