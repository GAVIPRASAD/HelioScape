import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Settings from "./pages/Settings";
import OAuthCallback from "./pages/OAuthCallback";
import { Toaster } from "@/components/ui/toaster";
import { useThemeStore } from "@/store/useThemeStore";
import Layout from "@/components/layout/Layout";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import Dashboard from "@/pages/Dashboard";
import LandingPage from "@/pages/LandingPage";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Files from "@/pages/Files";
import Visualizer from "@/pages/Visualizer";
import ProfilePage from "@/pages/ProfilePage";
import Media from "@/pages/Media";
import FileDistribution from "@/pages/FileDistribution";
import AccountDistribution from "@/pages/AccountDistribution";
import AccountDetails from "@/pages/AccountDetails";

function App() {
  // Initialize theme
  const { theme } = useThemeStore();

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/oauth/callback" element={<OAuthCallback />} />

        {/* Protected/Layout Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/files" element={<Files />} />
            <Route path="/visualizer" element={<Visualizer />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/media" element={<Media />} />
            <Route path="/distribution/files" element={<FileDistribution />} />
            <Route
              path="/distribution/accounts"
              element={<AccountDistribution />}
            />
            <Route
              path="/distribution/accounts/:provider/:providerId"
              element={<AccountDetails />}
            />
          </Route>
        </Route>
      </Routes>
      <Toaster />
    </Router>
  );
}

export default App;
