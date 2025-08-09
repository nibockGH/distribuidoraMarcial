// src/components/CustomerDetail.jsx

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getCustomerDetails } from './customerService';
import { FaFileInvoiceDollar, FaCalendarCheck, FaBalanceScale } from 'react-icons/fa';

// --- Funciones de formato ---
const formatCurrency = (value) => `$${(value || 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleDateString('es-AR') : 'N/A';

// --- Componente para las tarjetas de resumen ---
const StatCard = ({ icon, title, value }) => (
    <div className="detail-stat-card">
        <div className="detail-stat-icon">{icon}</div>
        <div>
            <p>{title}</p>
            <span>{value}</span>
        </div>
    </div>
);

const CustomerDetail = () => {
    const [details, setDetails] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('history'); // 'history', 'account', 'prices'
    const { customerId } = useParams();

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const data = await getCustomerDetails(customerId);
                setDetails(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };
        fetchDetails();
    }, [customerId]);

    if (isLoading) return <div className="admin-section"><p>Cargando detalles del cliente...</p></div>;
    if (error) return <div className="admin-section"><p className="error-message global-error">{error}</p></div>;
    if (!details) return null;

    const { customer, stats, salesHistory, paymentHistory, specialPrices } = details;

    // Combinar y ordenar transacciones para la cuenta corriente
    const transactions = [
        ...salesHistory.map(s => ({ ...s, type: 'Venta', date: s.sale_date, amount: s.sale_amount, credit: 0, debit: s.sale_amount })),
        ...paymentHistory.map(p => ({ ...p, type: 'Pago', date: p.payment_date, amount: p.payment_amount, credit: p.payment_amount, debit: 0 }))
    ].sort((a, b) => new Date(b.date) - new Date(a.date));

    return (
        <div className="customer-detail-container">
            <div className="detail-page-header">
                <div>
                    <h1>{customer.name}</h1>
                    <p>{customer.address}, {customer.localidad}</p>
                </div>
                <Link to="/admin/customers" className="admin-button-secondary">Volver al Listado</Link>
            </div>

            <div className="detail-stats-grid">
                <StatCard icon={<FaFileInvoiceDollar/>} title="Total Histórico Comprado" value={formatCurrency(stats.totalSold)} />
                <StatCard icon={<FaBalanceScale/>} title="Saldo Deudor Actual" value={formatCurrency(stats.balance)} />
                <StatCard icon={<FaCalendarCheck/>} title="Última Compra" value={formatDate(stats.lastSaleDate)} />
            </div>

            <div className="tab-navigation">
                <button onClick={() => setActiveTab('history')} className={activeTab === 'history' ? 'active' : ''}>Historial de Pedidos</button>
                <button onClick={() => setActiveTab('account')} className={activeTab === 'account' ? 'active' : ''}>Cuenta Corriente</button>
                <button onClick={() => setActiveTab('prices')} className={activeTab === 'prices' ? 'active' : ''}>Precios Especiales</button>
            </div>

            <div className="tab-content">
                {activeTab === 'history' && (
                    <div>
                        <h4>Pedidos del Cliente</h4>
                        <table className="admin-table">
                            <thead><tr><th>ID Venta</th><th>Fecha</th><th style={{textAlign: 'right'}}>Monto</th><th>Estado Entrega</th></tr></thead>
                            <tbody>
                                {salesHistory.map(sale => (
                                    <tr key={`sale-${sale.id}`}>
                                        <td>{sale.id}</td>
                                        <td>{formatDate(sale.sale_date)}</td>
                                        <td style={{textAlign: 'right'}}>{formatCurrency(sale.sale_amount)}</td>
                                        <td><span className={`status-badge status-${sale.delivery_status?.toLowerCase()}`}>{sale.delivery_status}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                {activeTab === 'account' && (
                     <div>
                        <h4>Movimientos de Cuenta Corriente</h4>
                         <table className="admin-table">
                            <thead><tr><th>Fecha</th><th>Tipo</th><th>Notas</th><th style={{textAlign: 'right'}}>Débito</th><th style={{textAlign: 'right'}}>Crédito</th></tr></thead>
                            <tbody>
                                {transactions.map((tx, index) => (
                                    <tr key={index}>
                                        <td>{formatDate(tx.date)}</td>
                                        <td>{tx.type}</td>
                                        <td>{tx.notes || '-'}</td>
                                        <td style={{textAlign: 'right'}}>{tx.debit > 0 ? formatCurrency(tx.debit) : '-'}</td>
                                        <td style={{textAlign: 'right'}}>{tx.credit > 0 ? formatCurrency(tx.credit) : '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                {activeTab === 'prices' && (
                    <div>
                        <h4>Precios Especiales Asignados</h4>
                        {/* Aquí puedes agregar el formulario para añadir/editar precios */}
                        <table className="admin-table">
                             <thead><tr><th>ID Producto</th><th>Nombre Producto</th><th style={{textAlign: 'right'}}>Precio Especial</th></tr></thead>
                             <tbody>
                                {specialPrices.map(price => (
                                    <tr key={price.product_id}>
                                        <td>{price.product_id}</td>
                                        <td>{price.product_name}</td>
                                        <td style={{textAlign: 'right'}}>{formatCurrency(price.special_price)}</td>
                                    </tr>
                                ))}
                             </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CustomerDetail;