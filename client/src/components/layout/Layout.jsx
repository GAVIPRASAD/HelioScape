import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

const Layout = () => {
  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <div className="hidden border-r bg-background sm:fixed sm:inset-y-0 sm:left-0 sm:z-10 sm:block sm:w-64">
        <Sidebar />
      </div>
      <div className="flex flex-col sm:pl-64">
        <Navbar />
        <main className="flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
