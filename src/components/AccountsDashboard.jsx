// src/components/AccountsDashboard.jsx

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getCustomerDebts } from './customerService'; // Servicio de clientes
import { getSupplierDebts } from './supplierService'; // Servicio de proveedores

const AccountsDashboard = () => {
    const [activeTab, setActiveTab] = useState('customers'); // 'customers' o 'suppliers'
    const [customerDebts, setCustomerDebts] = useState([]);
    const [supplierDebts, setSupplierDebts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError('');
            try {
                // Obtenemos los datos de ambas fuentes al cargar
                const [customers, suppliers] = await Promise.all([
                    getCustomerDebts(),
                    getSupplierDebts()
                ]);
                setCustomerDebts(customers);
                setSupplierDebts(suppliers);
            } catch (err) {
                setError('No se pudieron cargar los datos de las cuentas corrientes.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const formatCurrency = (num) => {
        return "$" + (num || 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    return (
        <div className="admin-card">
            <div className="admin-page-header">
                <h2>Gestión de Cuentas Corrientes</h2>
                <a href="/api/products/export/csv" className="export-button">Exportar a Excel</a>
            </div>

            {/* AQUI ESTÁN LOS NUEVOS BOTONES */}
            <div className="tab-group">
                <button
                    className={`tab-button ${activeTab === 'customers' ? 'active' : ''}`}
                    onClick={() => setActiveTab('customers')}
                >
                    Cuentas por Cobrar (Clientes)
                </button>
                <button
                    className={`tab-button ${activeTab === 'suppliers' ? 'active' : ''}`}
                    onClick={() => setActiveTab('suppliers')}
                >
                    Cuentas por Pagar (Proveedores)
                </button>
            </div>
            
            {loading && <p className="loading-message">Cargando...</p>}
            {error && <p className="error-message">{error}</p>}
            
            {!loading && !error && (
                <>
                    {/* Contenido que cambia según la pestaña activa */}
                    {activeTab === 'customers' && (
                        <div>
                            <h3>Deudas de Clientes</h3>
                            <div className="table-wrapper">
                                <table className="admin-table">
                                    <thead>
                                        <tr>
                                            <th>Cliente</th>
                                            <th>Total Comprado (Cta. Cte.)</th>
                                            <th>Total Pagado</th>
                                            <th>Saldo Deudor</th>
                                            <th>Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {customerDebts.map(customer => (
                                            <tr key={customer.id}>
                                                <td data-label="Cliente">{customer.name}</td>
                                                <td data-label="Total Comprado">{formatCurrency(customer.totalSold)}</td>
                                                <td data-label="Total Pagado">{formatCurrency(customer.totalPaid)}</td>
                                                <td data-label="Saldo Deudor"><strong>{formatCurrency(customer.balance)}</strong></td>
                                                <td data-label="Acciones">
                                                    <Link to={`/admin/customers/${customer.id}`} className="action-button view">Ver Detalle</Link>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'suppliers' && (
                        <div>
                            <h3>Deudas a Proveedores</h3>
                            <div className="table-wrapper">
                                <table className="admin-table">
                                    <thead>
                                        <tr>
                                            <th>Proveedor</th>
                                            <th>Total Comprado</th>
                                            <th>Total Pagado</th>
                                            <th>Saldo a Pagar</th>
                                            <th>Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                       {supplierDebts.map(supplier => (
                                            <tr key={supplier.id}>
                                                <td data-label="Proveedor">{supplier.name}</td>
                                                <td data-label="Total Comprado">{formatCurrency(supplier.total_purchased)}</td>
                                                <td data-label="Total Pagado">{formatCurrency(supplier.total_paid)}</td>
                                                <td data-label="Saldo a Pagar"><strong>{formatCurrency(supplier.balance)}</strong></td>
                                                <td data-label="Acciones">
                                                <Link to={`/admin/suppliers/debts/${supplier.id}`} className="action-button view">Ver Detalle</Link>                                                </td>
                                            </tr>
                                       ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default AccountsDashboard;