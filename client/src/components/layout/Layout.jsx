import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import TransferManager from "@/components/dashboard/TransferManager";
import GlobalDragDrop from "./GlobalDragDrop";

const Layout = () => {
  return (
    <GlobalDragDrop>
      <div className="flex min-h-screen w-full flex-col bg-transparent font-sans">
        <div className="hidden sm:fixed sm:inset-y-0 sm:left-0 sm:z-10 sm:block sm:w-72 p-4">
          <Sidebar />
        </div>
        <div className="flex flex-col sm:pl-72 transition-all duration-300 h-screen overflow-hidden">
          <Navbar />
          <main className="flex-1 items-start gap-4 p-4 sm:px-8 sm:py-8 md:gap-8 overflow-y-auto scrollbar-hide">
            <Outlet />
          </main>
        </div>
        <TransferManager />
      </div>
    </GlobalDragDrop>
  );
};

export default Layout;
