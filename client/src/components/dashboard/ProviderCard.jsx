import React from "react";
import { cn } from "@/lib/utils";
import { CheckCircle, XCircle, Cloud } from "lucide-react";

const ProviderCard = ({ provider, subtext, isConnected, quota }) => {
  return (
    <div className="relative overflow-hidden glass-panel rounded-3xl p-6 transition-all duration-300 hover:bg-white/60 dark:hover:bg-white/10 hover:-translate-y-1 group">
      {/* Background Glow */}
      <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-cyan-500/10 blur-3xl group-hover:bg-cyan-500/20 transition-all" />

      <div className="flex flex-row items-start justify-between space-y-0 pb-4 relative z-10">
        <div>
          <h3 className="text-lg font-heading font-semibold capitalize text-slate-900 dark:text-white">
            {provider}
          </h3>
          {subtext && (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {subtext}
            </p>
          )}
        </div>
        {isConnected ? (
          <CheckCircle className="h-5 w-5 text-emerald-500 dark:text-emerald-400 drop-shadow-[0_0_5px_rgba(52,211,153,0.5)]" />
        ) : (
          <XCircle className="h-5 w-5 text-slate-400 dark:text-slate-600" />
        )}
      </div>

      <div className="relative z-10">
        <div className="flex items-center space-x-3 mb-4">
          <div
            className={cn(
              "p-2.5 rounded-xl transition-colors",
              isConnected
                ? "bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400"
                : "bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-slate-500"
            )}
          >
            <Cloud className="h-6 w-6" />
          </div>
          <div
            className={cn(
              "text-2xl font-bold font-heading",
              isConnected
                ? "text-slate-900 dark:text-white"
                : "text-slate-400 dark:text-slate-500"
            )}
          >
            {isConnected ? "Active" : "Inactive"}
          </div>
        </div>

        {isConnected && quota && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
              <span>Used</span>
              <span className="text-cyan-600 dark:text-cyan-400">
                {Math.round((quota.used / quota.total) * 100)}%
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-violet-500 transition-all duration-1000 relative"
                style={{ width: `${(quota.used / quota.total) * 100}%` }}
              >
                <div className="absolute inset-0 bg-white/20 animate-pulse" />
              </div>
            </div>
            <p className="text-xs text-slate-500 text-right mt-1 font-mono">
              {(quota.used / 1024 / 1024 / 1024).toFixed(1)} GB /{" "}
              {(quota.total / 1024 / 1024 / 1024).toFixed(0)} GB
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProviderCard;
