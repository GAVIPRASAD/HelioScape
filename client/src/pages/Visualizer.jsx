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
        <h1 className="text-3xl font-bold tracking-tight">Network Topology</h1>
        <p className="text-muted-foreground">
          Live visualization of your distributed cloud storage.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Files</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{files?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Providers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{providers.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="h-[600px] relative overflow-hidden bg-slate-950 border-slate-800">
        <svg
          className="w-full h-full"
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
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.5" />
            </linearGradient>
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
                  strokeWidth="2"
                />
                {/* Animated Particle representing data flow */}
                <circle r="3" fill="#fff">
                  <animateMotion
                    dur={`${3 + index}s`}
                    repeatCount="indefinite"
                    path={`M${centerX},${centerY} L${pos.x},${pos.y}`}
                  />
                </circle>
                <circle r="3" fill="#fff">
                  <animateMotion
                    dur={`${4 + index}s`}
                    repeatCount="indefinite"
                    path={`M${pos.x},${pos.y} L${centerX},${centerY}`}
                  />
                </circle>
              </g>
            );
          })}

          {/* Center Node (Client/User) */}
          <g filter="url(#glow)">
            <circle
              cx={centerX}
              cy={centerY}
              r="40"
              fill="#0f172a"
              stroke="#3b82f6"
              strokeWidth="4"
            />
            <text
              x={centerX}
              y={centerY}
              textAnchor="middle"
              dy=".3em"
              fill="white"
              fontSize="14"
              fontWeight="bold"
            >
              HelioScape
            </text>
          </g>

          {/* Provider Nodes */}
          {providers.map((provider, index) => {
            const pos = getProviderPos(index, providers.length);
            const isGoogle = provider.includes("google");
            const color = isGoogle ? "#ea4335" : "#10b981"; // Red for Google, Green for Local

            return (
              <g key={provider} filter="url(#glow)">
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r="30"
                  fill="#0f172a"
                  stroke={color}
                  strokeWidth="3"
                />
                <text
                  x={pos.x}
                  y={pos.y + 45}
                  textAnchor="middle"
                  fill="white"
                  fontSize="12"
                  className="capitalize"
                >
                  {provider.split("-")[0]}
                </text>
                {/* Icon placeholder */}
                <text
                  x={pos.x}
                  y={pos.y}
                  textAnchor="middle"
                  dy=".3em"
                  fill={color}
                  fontSize="16"
                  fontWeight="bold"
                >
                  {isGoogle ? "G" : "L"}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Overlay Legend or Info */}
        <div className="absolute bottom-4 right-4 bg-black/50 p-4 rounded-lg backdrop-blur-sm text-xs text-slate-300 border border-slate-800">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span>Client (You)</span>
          </div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span>Google Drive</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span>Local Storage</span>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Visualizer;
