import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

const StorageMeter = ({ used = 0, total = 100 }) => {
  const percentage = Math.min((used / total) * 100, 100);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Storage Usage</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {used} GB / {total} GB
        </div>
        <Progress value={percentage} className="mt-4" />
        <p className="text-xs text-muted-foreground mt-2">
          {percentage.toFixed(1)}% used across all providers
        </p>
      </CardContent>
    </Card>
  );
};

export default StorageMeter;
