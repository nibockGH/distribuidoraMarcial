// src/components/ProtectedRoute.jsx

import React from "react";
import { Navigate, Outlet } from "react-router-dom";

export default function ProtectedRoute() {
  // Verificamos si el usuario está autenticado como admin
  const isAdmin = localStorage.getItem("isAdmin") === "true";

  // Si es admin, renderiza las rutas hijas (Outlet), si no, redirige a /admin-login
  return isAdmin ? <Outlet /> : <Navigate to="/admin-login" replace />;
}
