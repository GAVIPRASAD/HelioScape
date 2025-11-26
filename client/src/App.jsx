import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Layout from "@/components/layout/Layout";
import Dashboard from "@/pages/Dashboard";
import { ROUTES } from "@/constants";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to={ROUTES.DASHBOARD} replace />} />
          <Route path={ROUTES.DASHBOARD} element={<Dashboard />} />
          <Route
            path={ROUTES.SETTINGS}
            element={<div>Settings Page </div>}
          />
        </Route>
        <Route
          path={ROUTES.LOGIN}
          element={<div>Login Page (Coming Soon)</div>}
        />
      </Routes>
    </Router>
  );
}

export default App;
