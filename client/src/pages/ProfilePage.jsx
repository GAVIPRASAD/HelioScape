import React from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { User, Mail, Shield, Activity, HardDrive, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";

const ProfilePage = () => {
  const { user } = useAuthStore();

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div>
        <h1 className="font-heading text-4xl md:text-5xl font-bold tracking-tight text-slate-900 dark:text-white drop-shadow-sm dark:drop-shadow-lg">
          User Profile
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg font-light">
          Manage your identity and security settings.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        {/* Main Profile Card */}
        <div className="md:col-span-2 glass-panel rounded-3xl p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <User className="h-64 w-64 text-slate-900 dark:text-white" />
          </div>

          <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start">
            {/* Avatar */}
            <div className="h-32 w-32 rounded-full bg-gradient-to-br from-cyan-500 to-violet-500 p-[3px] shadow-xl">
              <div className="h-full w-full rounded-full bg-white dark:bg-black flex items-center justify-center">
                <User className="h-16 w-16 text-slate-900 dark:text-white" />
              </div>
            </div>

            {/* Details */}
            <div className="space-y-6 flex-1">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                  {user?.name || user?.email?.split("@")[0]}
                </h2>
                <p className="text-slate-500 dark:text-slate-400">
                  Identity Node
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                  <div className="flex items-center gap-3 mb-2">
                    <Mail className="h-4 w-4 text-cyan-500" />
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Email Address
                    </span>
                  </div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                    {user?.email}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                  <div className="flex items-center gap-3 mb-2">
                    <Shield className="h-4 w-4 text-emerald-500" />
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Security Status
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      Encrypted & Secure
                    </p>
                  </div>
                </div>
              </div>

              <Button className="rounded-full bg-slate-900 dark:bg-white text-white dark:text-black hover:bg-slate-800 dark:hover:bg-white/90">
                <Edit className="mr-2 h-4 w-4" />
                Edit Profile
              </Button>
            </div>
          </div>
        </div>

        {/* Stats / Side Panel */}
        <div className="space-y-6">
          <div className="glass-panel rounded-3xl p-6">
            <h3 className="font-heading font-semibold text-lg text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Activity className="h-5 w-5 text-violet-500" />
              Account Activity
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">
                  Status
                </span>
                <span className="px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-medium border border-emerald-500/20">
                  Active
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">
                  Member Since
                </span>
                <span className="text-slate-900 dark:text-white font-medium">
                  Nov 2024
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">
                  Last Login
                </span>
                <span className="text-slate-900 dark:text-white font-medium">
                  Just now
                </span>
              </div>
            </div>
          </div>

          <div className="glass-panel rounded-3xl p-6">
            <h3 className="font-heading font-semibold text-lg text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <HardDrive className="h-5 w-5 text-cyan-500" />
              Storage Plan
            </h3>
            <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-violet-500/10 border border-cyan-500/20">
              <p className="text-sm font-medium text-slate-900 dark:text-white mb-1">
                Free Tier
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                Up to 15GB aggregated storage
              </p>
              <Button
                variant="outline"
                size="sm"
                className="w-full rounded-full border-cyan-500/30 hover:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400"
              >
                Upgrade Plan
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
