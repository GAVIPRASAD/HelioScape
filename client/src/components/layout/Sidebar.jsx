import React from "react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Settings,
  Cloud,
  LogOut,
  FileIcon,
  Network,
  User,
  Film,
  PieChart,
  Server,
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { ROUTES, APP_NAME } from "@/constants";

const Sidebar = ({ className, onItemClick }) => {
  const logout = useAuthStore((state) => state.logout);

  const navItems = [
    {
      icon: LayoutDashboard,
      label: "Storage Overview",
      href: ROUTES.DASHBOARD,
    },
    { icon: FileIcon, label: "File Systems", href: "/files" },
    { icon: Network, label: "Network Map", href: "/visualizer" },
    { icon: Film, label: "Media Center", href: "/media" },
    { icon: User, label: "Profile", href: "/profile" },
    { icon: PieChart, label: "File Map", href: "/distribution/files" },
    { icon: Server, label: "Account Map", href: "/distribution/accounts" },
    { icon: Settings, label: "System Config", href: ROUTES.SETTINGS },
  ];

  return (
    <div
      className={cn(
        "h-full flex flex-col glass-panel rounded-3xl overflow-hidden border-r border-slate-200 dark:border-white/5",
        className
      )}
    >
      {/* Header */}
      <div className="p-6 border-b border-slate-200 dark:border-white/5">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 to-violet-500 shadow-lg">
            <Cloud className="h-4 w-4 text-white" />
            <div className="absolute inset-0 rounded-full bg-white/20 blur-md animate-pulse-glow" />
          </div>
          <span className="font-heading font-bold text-lg tracking-wide text-slate-900 dark:text-white">
            Helio<span className="text-cyan-500 dark:text-cyan-400">Scape</span>
          </span>
        </div>
      </div>

      {/* Nav Items */}
      <div className="flex-1 py-6 px-4 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            onClick={() => onItemClick && onItemClick()}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 group relative overflow-hidden",
                isActive
                  ? "text-cyan-600 dark:text-white bg-cyan-50 dark:bg-white/10 shadow-sm dark:shadow-[0_0_20px_rgba(34,211,238,0.1)] border border-cyan-100 dark:border-white/10"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5"
              )
            }
          >
            {({ isActive }) => (
              <>
                <div
                  className={cn(
                    "absolute left-0 top-0 bottom-0 w-1 bg-cyan-500 dark:bg-cyan-400 transition-all duration-300",
                    isActive ? "opacity-100" : "opacity-0"
                  )}
                />
                <item.icon
                  className={cn(
                    "h-5 w-5 transition-colors",
                    isActive
                      ? "text-cyan-600 dark:text-cyan-400"
                      : "text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-white"
                  )}
                />
                <span className="relative z-10">{item.label}</span>
                {isActive && (
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-transparent opacity-50" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>

      {/* Footer / Logout */}
      <div className="p-4 border-t border-slate-200 dark:border-white/5">
        <button
          onClick={() => {
            logout();
            if (onItemClick) onItemClick();
          }}
          className="flex w-full items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-white hover:bg-red-50 dark:hover:bg-red-500/10 hover:border-red-100 dark:hover:border-red-500/20 border border-transparent transition-all duration-300 group"
        >
          <LogOut className="h-5 w-5 group-hover:text-red-500 dark:group-hover:text-red-400 transition-colors" />
          <span>Disconnect</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
