import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { CheckCircle, XCircle, Cloud } from "lucide-react";

const ProviderCard = ({ provider, isConnected, quota }) => {
  return (
    <Card className="relative overflow-hidden border-primary/20 bg-background/50 backdrop-blur-sm hover:bg-background/80 transition-all duration-300 group">
      {/* Background Glow */}
      <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary/10 blur-3xl group-hover:bg-primary/20 transition-all" />

      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium capitalize">
          {provider}
        </CardTitle>
        {isConnected ? (
          <CheckCircle className="h-4 w-4 text-green-500" />
        ) : (
          <XCircle className="h-4 w-4 text-muted-foreground" />
        )}
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-2 mb-2">
          <div
            className={cn(
              "p-2 rounded-full",
              isConnected
                ? "bg-primary/20 text-primary"
                : "bg-muted text-muted-foreground"
            )}
          >
            <Cloud className="h-5 w-5" />
          </div>
          <div className="text-2xl font-bold">
            {isConnected ? "Active" : "Inactive"}
          </div>
        </div>

        {isConnected && quota && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Used</span>
              <span>{Math.round((quota.used / quota.total) * 100)}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${(quota.used / quota.total) * 100}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground text-right mt-1">
              {(quota.used / 1024 / 1024 / 1024).toFixed(1)} GB /{" "}
              {(quota.total / 1024 / 1024 / 1024).toFixed(0)} GB
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProviderCard;
