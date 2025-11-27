import React, { useEffect, useState } from "react";
import { Cloud, Database, Server, ShieldCheck, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const NetworkTopology = ({ files }) => {
  const [packets, setPackets] = useState([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setPackets((prev) => {
        const now = Date.now();
        // 1. Clean up old packets (older than 2s)
        const active = prev.filter((p) => now - p.id < 2000);
        // 2. Add new packet
        const target = Math.random() > 0.5 ? "google" : "local";
        return [...active, { id: now, target }];
      });
    }, 1000); // Generate packet every 1 second
    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="col-span-1 border-primary/10 bg-gradient-to-br from-background via-muted/5 to-muted/20 overflow-hidden relative shadow-xl">
      {/* Subtle Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px]" />

      <CardHeader className="relative z-10 pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Activity className="h-5 w-5 text-primary" />
          Live Network Status
        </CardTitle>
      </CardHeader>

      <CardContent className="relative h-[350px] w-full z-10 p-0">
        <svg
          className="w-full h-full"
          viewBox="0 0 400 350"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(124, 58, 237, 0.1)" />
              <stop offset="50%" stopColor="rgba(124, 58, 237, 0.5)" />
              <stop offset="100%" stopColor="rgba(124, 58, 237, 0.1)" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Connection Lines - Coordinates matched to CSS positions */}
          {/* Hub (200, 175) to Google (80, 80) */}
          <path
            d="M 200 175 L 80 80"
            stroke="url(#lineGradient)"
            strokeWidth="2"
            fill="none"
            className="opacity-50"
          />
          {/* Hub (200, 175) to Dropbox (320, 80) */}
          <path
            d="M 200 175 L 320 80"
            stroke="gray"
            strokeWidth="1"
            strokeDasharray="4 4"
            fill="none"
            className="opacity-20"
          />
          {/* Hub (200, 175) to Local (200, 280) */}
          <path
            d="M 200 175 L 200 280"
            stroke="url(#lineGradient)"
            strokeWidth="2"
            fill="none"
            className="opacity-50"
          />

          {/* Data Packets */}
          {packets.map((packet) => (
            <circle
              key={packet.id}
              r="4"
              cx="0"
              cy="0"
              fill={packet.target === "google" ? "#3b82f6" : "#f97316"}
              filter="url(#glow)"
            >
              <animateMotion
                dur="1.5s"
                begin="0s"
                fill="freeze"
                repeatCount="1"
                path={
                  packet.target === "google"
                    ? "M 200 175 L 80 80"
                    : "M 200 175 L 200 280"
                }
              />
            </circle>
          ))}
        </svg>

        {/* DOM Nodes - Positioned to match SVG coordinates */}

        {/* Google Drive: Top Left (20%, 23%) */}
        <div className="absolute top-[23%] left-[20%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
          <div className="h-14 w-14 rounded-xl bg-background/80 backdrop-blur-md border border-blue-500/30 flex items-center justify-center shadow-lg shadow-blue-500/10 transition-transform hover:scale-110">
            <Cloud className="h-7 w-7 text-blue-500" />
          </div>
          <div className="mt-2 flex flex-col items-center">
            <span className="text-xs font-semibold text-foreground">
              Google Drive
            </span>
            <span className="text-[10px] text-green-500 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
              Connected
            </span>
          </div>
        </div>

        {/* Dropbox: Top Right (80%, 23%) */}
        <div className="absolute top-[23%] left-[80%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center opacity-60 grayscale hover:opacity-100 hover:grayscale-0 transition-all">
          <div className="h-14 w-14 rounded-xl bg-muted/50 border border-border flex items-center justify-center">
            <Server className="h-7 w-7 text-muted-foreground" />
          </div>
          <div className="mt-2 flex flex-col items-center">
            <span className="text-xs font-semibold text-muted-foreground">
              Dropbox
            </span>
            <span className="text-[10px] text-muted-foreground">Offline</span>
          </div>
        </div>

        {/* Central Hub: Center (50%, 50%) */}
        <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-20">
          <div className="relative group">
            <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full group-hover:bg-primary/30 transition-all duration-500" />
            <div className="h-20 w-20 rounded-full bg-background border-4 border-primary/20 flex items-center justify-center shadow-2xl shadow-primary/20 z-10 relative">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center border border-primary/50">
                <ShieldCheck className="h-8 w-8 text-primary" />
              </div>
            </div>
          </div>
          <div className="mt-3 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-md shadow-sm">
            <span className="text-xs font-bold text-primary tracking-wide">
              CORE SYSTEM
            </span>
          </div>
        </div>

        {/* Local Grid: Bottom Center (50%, 80%) */}
        <div className="absolute top-[80%] left-[50%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
          <div className="h-14 w-14 rounded-xl bg-background/80 backdrop-blur-md border border-orange-500/30 flex items-center justify-center shadow-lg shadow-orange-500/10 transition-transform hover:scale-110">
            <Database className="h-7 w-7 text-orange-500" />
          </div>
          <div className="mt-2 flex flex-col items-center">
            <span className="text-xs font-semibold text-foreground">
              Local Grid
            </span>
            <span className="text-[10px] text-green-500 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
              Active
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default NetworkTopology;
