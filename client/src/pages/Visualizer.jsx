import React from "react";
import { useUserQuery } from "@/hooks/useUserQuery";
import { useFilesQuery } from "@/hooks/useFilesQuery";
import Loading from "@/components/ui/Loading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Visualizer = () => {
  const { data: user, isLoading: isUserLoading } = useUserQuery();
  const { data: files, isLoading: isFilesLoading } = useFilesQuery(null); // Fetch all root files for now, ideally fetch ALL files flat

  // --- Topology Logic ---
  const providers = React.useMemo(() => {
    const uniqueProviders = new Set(["local-1", "local-2"]); // Always include local mocks
    if (user?.linkedAccounts) {
      user.linkedAccounts.forEach((acc) =>
        uniqueProviders.add(`${acc.provider}-${acc.providerId}`)
      );
    }
    // Also check files for any other providers
    files?.forEach((file) => {
      file.chunks?.forEach((chunk) => {
        if (chunk.provider) uniqueProviders.add(chunk.provider);
      });
    });
    return Array.from(uniqueProviders);
  }, [user, files]);

  // Calculate positions
  const centerX = 400;
  const centerY = 300;
  const radius = 200;

  const getProviderPos = (index, total) => {
    const angle = (index / total) * 2 * Math.PI - Math.PI / 2; // Start at top
    return {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    };
  };

  if (isUserLoading || isFilesLoading)
    return <Loading text="Loading topology..." />;

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="font-heading text-4xl font-bold tracking-tight text-slate-900 dark:text-white drop-shadow-sm">
          Network Topology
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-lg font-light">
          Live visualization of your distributed cloud storage.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="glass-panel rounded-3xl p-6 flex flex-col justify-between relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <div className="h-16 w-16 rounded-full bg-cyan-500 blur-xl" />
          </div>
          <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Total Files
          </h3>
          <div className="text-4xl font-bold text-slate-900 dark:text-white mt-2">
            {files?.length || 0}
          </div>
        </div>

        <div className="glass-panel rounded-3xl p-6 flex flex-col justify-between relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <div className="h-16 w-16 rounded-full bg-violet-500 blur-xl" />
          </div>
          <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Active Nodes
          </h3>
          <div className="text-4xl font-bold text-slate-900 dark:text-white mt-2">
            {providers.length}
          </div>
        </div>
      </div>

      <div className="glass-panel rounded-3xl h-[600px] relative overflow-hidden border border-slate-200 dark:border-white/10 bg-slate-950/5 dark:bg-black/40 shadow-inner">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-cyan-500/5 via-transparent to-transparent opacity-50" />

        <svg
          className="w-full h-full relative z-10"
          viewBox="0 0 800 600"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Defs for gradients/glows */}
          <defs>
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.1" />
              <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.1" />
            </linearGradient>
            <radialGradient id="nodeGradient">
              <stop offset="0%" stopColor="#0f172a" />
              <stop offset="100%" stopColor="#020617" />
            </radialGradient>
          </defs>

          {/* Connections */}
          {providers.map((provider, index) => {
            const pos = getProviderPos(index, providers.length);
            return (
              <g key={`link-${provider}`}>
                <line
                  x1={centerX}
                  y1={centerY}
                  x2={pos.x}
                  y2={pos.y}
                  stroke="url(#lineGradient)"
                  strokeWidth="1.5"
                  className="opacity-50"
                />
                {/* Animated Particle representing data flow */}
                <circle r="2" fill="#22d3ee" filter="url(#glow)">
                  <animateMotion
                    dur={`${3 + index}s`}
                    repeatCount="indefinite"
                    path={`M${centerX},${centerY} L${pos.x},${pos.y}`}
                    keyPoints="0;1"
                    keyTimes="0;1"
                    calcMode="linear"
                  />
                  <animate
                    attributeName="opacity"
                    values="0;1;0"
                    dur={`${3 + index}s`}
                    repeatCount="indefinite"
                  />
                </circle>
                <circle r="2" fill="#8b5cf6" filter="url(#glow)">
                  <animateMotion
                    dur={`${4 + index}s`}
                    repeatCount="indefinite"
                    path={`M${pos.x},${pos.y} L${centerX},${centerY}`}
                    keyPoints="0;1"
                    keyTimes="0;1"
                    calcMode="linear"
                  />
                  <animate
                    attributeName="opacity"
                    values="0;1;0"
                    dur={`${4 + index}s`}
                    repeatCount="indefinite"
                  />
                </circle>
              </g>
            );
          })}

          {/* Center Node (Client/User) */}
          <g
            filter="url(#glow)"
            className="cursor-pointer hover:scale-110 transition-transform duration-300"
          >
            <circle
              cx={centerX}
              cy={centerY}
              r="45"
              fill="url(#nodeGradient)"
              stroke="#22d3ee"
              strokeWidth="2"
              className="opacity-90"
            />
            <circle
              cx={centerX}
              cy={centerY}
              r="55"
              fill="none"
              stroke="#22d3ee"
              strokeWidth="1"
              strokeDasharray="4 4"
              className="opacity-30 animate-spin-slow"
              style={{ transformOrigin: `${centerX}px ${centerY}px` }}
            />
            <text
              x={centerX}
              y={centerY}
              textAnchor="middle"
              dy=".3em"
              fill="white"
              fontSize="14"
              fontWeight="bold"
              className="font-heading tracking-wider"
            >
              CORE
            </text>
          </g>

          {/* Provider Nodes */}
          {providers.map((provider, index) => {
            const pos = getProviderPos(index, providers.length);
            const isGoogle = provider.includes("google");
            const color = isGoogle ? "#f87171" : "#34d399"; // Red-400 for Google, Emerald-400 for Local
            const glowColor = isGoogle
              ? "rgba(248, 113, 113, 0.3)"
              : "rgba(52, 211, 153, 0.3)";

            return (
              <g
                key={provider}
                filter="url(#glow)"
                className="group cursor-pointer"
              >
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r="35"
                  fill="url(#nodeGradient)"
                  stroke={color}
                  strokeWidth="2"
                  className="transition-all duration-300 group-hover:stroke-width-4"
                />
                {/* Pulse Effect */}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r="35"
                  fill="none"
                  stroke={color}
                  strokeWidth="1"
                  className="opacity-50 animate-ping-slow"
                />

                <text
                  x={pos.x}
                  y={pos.y + 55}
                  textAnchor="middle"
                  fill="white"
                  fontSize="12"
                  className="capitalize font-medium tracking-wide opacity-80"
                >
                  {provider.split("-")[0]}
                </text>

                <text
                  x={pos.x}
                  y={pos.y}
                  textAnchor="middle"
                  dy=".3em"
                  fill={color}
                  fontSize="18"
                  fontWeight="bold"
                >
                  {isGoogle ? "G" : "L"}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Overlay Legend */}
        <div className="absolute bottom-6 right-6 glass-panel p-4 rounded-2xl border border-white/10 backdrop-blur-md">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-3 h-3 rounded-full bg-cyan-500 shadow-[0_0_10px_#22d3ee]"></div>
            <span className="text-xs font-medium text-slate-300">
              Core System
            </span>
          </div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-3 h-3 rounded-full bg-red-400 shadow-[0_0_10px_#f87171]"></div>
            <span className="text-xs font-medium text-slate-300">
              Google Drive
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399]"></div>
            <span className="text-xs font-medium text-slate-300">
              Local Storage
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Visualizer;
