import React from "react";
import { Cloud, Database, Network } from "lucide-react";
import { cn } from "@/lib/utils";

const Loading = ({ className, size = "default", text = "Initializing..." }) => {
  // Size mapping for the container
  const sizeClasses = {
    sm: "h-16 w-16",
    default: "h-32 w-32",
    lg: "h-48 w-48",
  };

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center min-h-[300px] space-y-8",
        className
      )}
    >
      <div
        className={cn(
          "relative flex items-center justify-center",
          sizeClasses[size]
        )}
      >
        {/* Outer Ring - Slow Spin */}
        <div className="absolute inset-0 border-4 border-primary/20 border-t-primary rounded-full animate-[spin_3s_linear_infinite]" />

        {/* Middle Ring - Medium Spin Reverse */}
        <div className="absolute inset-4 border-4 border-blue-500/20 border-b-blue-500 rounded-full animate-[spin_2s_linear_infinite_reverse]" />

        {/* Inner Ring - Fast Spin */}
        <div className="absolute inset-8 border-4 border-cyan-400/20 border-l-cyan-400 rounded-full animate-[spin_1s_linear_infinite]" />

        {/* Core - Pulsing Cloud */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Cloud className="w-1/3 h-1/3 text-cyan-400 animate-pulse drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
        </div>

        {/* Orbiting Particle */}
        <div className="absolute inset-0 animate-[spin_4s_linear_infinite]">
          <div className="h-3 w-3 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,1)] absolute -top-1.5 left-1/2 -translate-x-1/2" />
        </div>
      </div>

      {text && (
        <div className="flex flex-col items-center space-y-2">
          <p className="text-lg font-mono tracking-widest text-primary animate-pulse uppercase">
            {text}
          </p>
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
          </div>
        </div>
      )}
    </div>
  );
};

export default Loading;
