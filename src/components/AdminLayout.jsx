// src/components/AdminLayout.jsx

import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';
import { 
    FaTachometerAlt, FaBoxOpen, FaUsers, FaTruck, FaFileInvoiceDollar, 
    FaUserTie, FaTags, FaCar, FaCogs, FaChartPie, FaSignOutAlt,
    FaRoute, FaBars
} from 'react-icons/fa';

const AdminLayout = () => {
    const { currentUser, isAdmin, logout } = useAuth();
    const navigate = useNavigate();
    const [isSidebarOpen, setSidebarOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const toggleSidebar = () => {
        setSidebarOpen(!isSidebarOpen);
    };
    
    // Cierra el sidebar al navegar en móvil
    const handleLinkClick = () => {
        if (window.innerWidth <= 768) {
            setSidebarOpen(false);
        }
    };

    return (
        <div className="admin-layout-container">
            
            <aside className={`admin-sidebar ${isSidebarOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <h2 className="sidebar-title">Distribuidora</h2>
                    {currentUser && (
                        <div className="sidebar-user-info">
                            <span>Bienvenido, <strong>{currentUser.username}</strong></span>
                            <small>Rol: {currentUser.role}</small>
                        </div>
                    )}
                </div>
                
                <nav className="sidebar-nav">
                    {isAdmin && (
                        <>
                            <NavLink to="/admin" end className="sidebar-link" onClick={handleLinkClick}><FaTachometerAlt /> <span>Dashboard</span></NavLink>
                            <NavLink to="/admin/products" className="sidebar-link" onClick={handleLinkClick}><FaTags /> <span>Productos</span></NavLink>
                            <NavLink to="/admin/logistics" className="sidebar-link" onClick={handleLinkClick}><FaRoute /> <span>Logística</span></NavLink>
                            <NavLink to="/admin/stock" className="sidebar-link" onClick={handleLinkClick}><FaBoxOpen /> <span>Stock</span></NavLink>
                            <NavLink to="/admin/transformations" className="sidebar-link" onClick={handleLinkClick}><FaCogs /> <span>Transformaciones</span></NavLink>
                            <NavLink to="/admin/fleet" className="sidebar-link" onClick={handleLinkClick}><FaCar /> <span>Flota</span></NavLink>
                            <NavLink to="/admin/orders" className="sidebar-link" onClick={handleLinkClick}><FaFileInvoiceDollar /> <span>Pedidos</span></NavLink>
                            <NavLink to="/admin/customers" className="sidebar-link" onClick={handleLinkClick}><FaUsers /> <span>Clientes</span></NavLink>
                            <NavLink to="/admin/suppliers" className="sidebar-link" onClick={handleLinkClick}><FaTruck /> <span>Proveedores</span></NavLink>
                            <NavLink to="/admin/debts" className="sidebar-link" onClick={handleLinkClick}><FaFileInvoiceDollar /> <span>Cuentas Ctes.</span></NavLink>
                            <NavLink to="/admin/reports" className="sidebar-link" onClick={handleLinkClick}><FaChartPie /> <span>Informes</span></NavLink>
                        </>
                    )}
                    <NavLink to="/admin/salespeople" className="sidebar-link" onClick={handleLinkClick}><FaUserTie /> <span>Ventas</span></NavLink>
                </nav>

                <div className="sidebar-footer">
                    <button onClick={handleLogout} className="logout-button">
                        <FaSignOutAlt />
                        <span>Cerrar Sesión</span>
                    </button>
                </div>
            </aside>

            {/* Overlay para oscurecer el fondo en móvil */}
            {isSidebarOpen && <div className="overlay" onClick={toggleSidebar}></div>}

            <main className="admin-main-content">
                <header className="admin-content-header">
                    <button className="menu-toggle" onClick={toggleSidebar}>
                        <FaBars />
                    </button>
                    <div className="header-left">
                        {/* Espacio para futuro título de página */}
                    </div>
                    <div className="header-right">
                        <NotificationBell />
                    </div>
                </header>
                
                <div className="page-content">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default AdminLayout;