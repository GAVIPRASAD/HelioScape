import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

const ProviderCardSkeleton = () => {
  return (
    <div className="glass-panel rounded-3xl p-6 relative overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <div>
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
        <Skeleton className="h-2 w-2 rounded-full" />
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-12" />
        </div>
        <Skeleton className="h-2 w-full rounded-full" />
      </div>
    </div>
  );
};

export default ProviderCardSkeleton;
