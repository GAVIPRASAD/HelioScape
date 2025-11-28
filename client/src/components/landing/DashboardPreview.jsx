import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  HardDrive,
  Upload,
  Activity,
  ShieldCheck,
  MoreVertical,
  Search,
  Bell,
  Menu,
} from "lucide-react";

const DashboardPreview = () => {
  return (
    <div className="relative w-full max-w-5xl mx-auto perspective-1000">
      {/* Floating Elements for Depth */}
      <div className="absolute -left-12 top-1/4 w-24 h-24 bg-cyan-500/20 rounded-full blur-2xl animate-pulse" />
      <div className="absolute -right-12 bottom-1/4 w-32 h-32 bg-violet-500/20 rounded-full blur-3xl animate-pulse delay-700" />

      {/* Main Dashboard Container */}
      <div className="relative bg-slate-950/80 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden transform rotate-x-12 transition-transform duration-700 hover:rotate-x-0">
        {/* Mock Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/5">
          <div className="flex items-center gap-4">
            <Menu className="h-5 w-5 text-slate-400" />
            <div className="h-8 w-32 bg-white/10 rounded-md animate-pulse" />
          </div>
          <div className="flex items-center gap-4">
            <Search className="h-5 w-5 text-slate-400" />
            <Bell className="h-5 w-5 text-slate-400" />
            <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-cyan-500 to-violet-500" />
          </div>
        </div>

        {/* Mock Content */}
        <div className="p-6 grid gap-6 md:grid-cols-3">
          {/* Storage Card */}
          <Card className="col-span-2 bg-white/5 border-white/10 text-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">
                Total Storage
              </CardTitle>
              <HardDrive className="h-4 w-4 text-cyan-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">128.4 GB</div>
              <p className="text-xs text-slate-400 mb-4">
                of 500 GB Used (Encrypted)
              </p>
              <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                <div className="h-full w-[25%] bg-gradient-to-r from-cyan-500 to-violet-500" />
              </div>
            </CardContent>
          </Card>

          {/* Upload Card */}
          <Card className="bg-white/5 border-white/10 text-white flex flex-col justify-center items-center p-6 space-y-4">
            <div className="h-12 w-12 rounded-full bg-white/10 flex items-center justify-center">
              <Upload className="h-6 w-6 text-cyan-400" />
            </div>
            <Button className="w-full bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 border-0">
              Upload File
            </Button>
          </Card>

          {/* Recent Files List */}
          <Card className="col-span-3 bg-white/5 border-white/10 text-white">
            <CardHeader>
              <CardTitle className="text-lg">Recent Transmissions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-md bg-cyan-500/10 text-cyan-400">
                      <ShieldCheck className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="h-4 w-32 bg-white/10 rounded mb-1" />
                      <div className="h-3 w-20 bg-white/5 rounded" />
                    </div>
                  </div>
                  <MoreVertical className="h-4 w-4 text-slate-500" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DashboardPreview;
