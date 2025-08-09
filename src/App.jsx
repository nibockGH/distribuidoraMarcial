// src/App.jsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

// Providers (Contextos)
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./components/CartContext";
import { SearchProvider } from "./components/SearchContext";

// Layouts y Componentes de Ruta
import AdminLayout from "./components/AdminLayout";
import PublicLayout from "./components/PublicLayout"; // El nuevo layout que creamos
import ProtectedRoute from "./components/ProtectedRoute"; // El protector de rutas actualizado
import Login from "./components/Login"; // La nueva página de login
import FleetManagement from './components/FleetManagement'; // <-- Añade esta importación
import Transformation from './components/Transformation'; // <-- Añade esta importación

// Páginas Públicas
import ProductList from "./components/ProductList";
import CartPage from "./components/Cart";
import Nosotros from "./components/Nosotros";
import Faq from "./components/Faq";

// Páginas del Panel de Administración
import Dashboard from './components/Dashboard';
import ProductManagement from './components/ProductManagement';
import StockManagement from "./components/StockManagement";
import SalespeopleManagement from "./components/SalespeopleManagement";
import CustomerList from "./components/CustomerList";
import CustomerForm from "./components/CustomerForm";
import CustomerDetail from "./components/CustomerDetail";
import OrderList from "./components/OrderList";
import OrderDetail from "./components/OrderDetail";
import SupplierList from "./components/SupplierList";
import SupplierForm from "./components/SupplierForm";
import PurchaseForm from "./components/PurchaseForm";
import AccountsDashboard from "./components/AccountsDashboard";
import DebtDetail from "./components/DebtDetail";
import SupplierDebtDetail from "./components/SupplierDebtDetail";
import ProfitLossReport from './components/ProfitLossReport';
import Logistics from './components/Logistics'; // <-- Añade esta importación


// El componente principal que envuelve toda la aplicación
export default function App() {
  return (
    // 1. Envolvemos todo en los Providers, con AuthProvider en el nivel más alto.
    <AuthProvider>
      <CartProvider>
        <SearchProvider>
          <Routes>
            {/* --- RUTA PÚBLICA PARA EL LOGIN (sin Header/Footer) --- */}
            <Route path="/login" element={<Login />} />

            {/* --- RUTAS PÚBLICAS (con Header/Footer gracias a PublicLayout) --- */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<ProductList />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/nosotros" element={<Nosotros />} />
              <Route path="/faq" element={<Faq />} />
            </Route>

            {/* --- RUTAS PROTEGIDAS (requieren login) --- */}
            <Route element={<ProtectedRoute />}>
              <Route path="/admin" element={<AdminLayout />}>
                {/* Redirige /admin a /admin/dashboard por defecto */}
                <Route index element={<Navigate to="/admin/dashboard" replace />} /> 
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="logistics" element={<Logistics />} />

                <Route path="products" element={<ProductManagement />} />
                <Route path="stock" element={<StockManagement />} />
                <Route path="salespeople" element={<SalespeopleManagement />} />
                <Route path="customers" element={<CustomerList />} />
                <Route path="customers/new" element={<CustomerForm />} />
                <Route path="customers/edit/:customerId" element={<CustomerForm />} />
                <Route path="customers/:customerId" element={<CustomerDetail />} />
                <Route path="suppliers" element={<SupplierList />} />
                <Route path="fleet" element={<FleetManagement />} />
                <Route path="suppliers/new" element={<SupplierForm />} />
                <Route path="suppliers/edit/:supplierId" element={<SupplierForm />} />
                <Route path="orders" element={<OrderList />} />
                <Route path="orders/:orderId" element={<OrderDetail />} />
                <Route path="purchases/new" element={<PurchaseForm />} />
                <Route path="debts" element={<AccountsDashboard />} />
                <Route path="debts/:customerId" element={<DebtDetail />} />
                <Route path="suppliers/debts/:supplierId" element={<SupplierDebtDetail />} />
                <Route path="reports" element={<ProfitLossReport />} />
                <Route path="transformations" element={<Transformation />} />

              </Route>
            </Route>
            
            {/* Ruta para cualquier otra URL no encontrada */}
            <Route path="*" element={<h1>404: Página No Encontrada</h1>} />
          </Routes>
        </SearchProvider>
      </CartProvider>
    </AuthProvider>
  );
}