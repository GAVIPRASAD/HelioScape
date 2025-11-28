import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";

const ProtectedRoute = () => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user && !user.isVerified) {
    return (
      <Navigate to="/verify-email" replace state={{ email: user.email }} />
    );
  }

  return <Outlet />;
};

export default ProtectedRoute;
