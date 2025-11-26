import React from "react";
import StorageMeter from "@/components/dashboard/StorageMeter";

const Dashboard = () => {
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StorageMeter used={25} total={100} />
        {/* Add more widgets here later */}
      </div>
    </div>
  );
};

export default Dashboard;
