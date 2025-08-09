import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // <-- La nueva fuente de verdad

export default function ProtectedRoute() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    // Si el usuario NO está autenticado:
    // 1. Lo redirigimos a la página de /login.
    // 2. Guardamos la página que intentaba visitar (location) para poder volver a ella después del login.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Si el usuario SÍ está autenticado, renderiza las rutas anidadas (el panel de admin).
  return <Outlet />;
}