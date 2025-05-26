// src/App.jsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import ProductList from "./components/ProductList";
import CartPage from "./components/Cart"; // Asegúrate de que este componente existe
import AdminLogin from "./components/AdminLogin";
import AdminPanel from "./components/AdminPanel";
import ProtectedRoute from "./components/protectedRoute";
import WhatsAppButton from "./components/WhatsappButton";
import { CartProvider } from "./components/CartContext";

export default function App() {
  return (
    <CartProvider>
      <div className="app-container">
        <Header />
        {/* El main es importante para semántica y para el flex-grow */}
        <main className="main-content">
          <Routes>
            <Route path="/" element={<ProductList />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/admin-login" element={<AdminLogin />} />

            <Route path="/admin" element={<ProtectedRoute />}>
              <Route index element={<AdminPanel />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <Footer />
        <WhatsAppButton />
      </div>
    </CartProvider>
  );
}