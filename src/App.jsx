// src/App.jsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import ProductList from "./components/ProductList";
import CartPage from "./components/Cart";
import AdminLogin from "./components/AdminLogin";
import AdminPanel from "./components/AdminPanel";
import ProtectedRoute from "./components/protectedRoute";
import WhatsAppButton from "./components/WhatsAppButton";
import { CartProvider } from "./components/CartContext";

// Admin Sections
import StockManagement from "./components/StockManagement";
import SalespeopleManagement from "./components/SalespeopleManagement";
import CustomerList from "./components/CustomerList";
import CustomerForm from "./components/CustomerForm";
import CustomerDetail from "./components/CustomerDetail";
import OrderList from "./components/OrderList";
import OrderDetail from "./components/OrderDetail";

export default function App() {
  return (
    <CartProvider>
      <div className="app-container">
        <Header />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<ProductList />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/admin-login" element={<AdminLogin />} />

            <Route path="/admin" element={<ProtectedRoute />}>
              <Route index element={<AdminPanel />} />
              <Route path="stock" element={<StockManagement />} />
              <Route path="salespeople" element={<SalespeopleManagement />} />
              
              {/* Rutas para Clientes */}
              <Route path="customers" element={<CustomerList />} />
              <Route path="customers/new" element={<CustomerForm />} />
              <Route path="customers/edit/:customerId" element={<CustomerForm />} />
              <Route path="customers/:customerId" element={<CustomerDetail />} />
              
              {/* Rutas para Pedidos */}
              <Route path="orders" element={<OrderList />} />
              <Route path="orders/:orderId" element={<OrderDetail />} />
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