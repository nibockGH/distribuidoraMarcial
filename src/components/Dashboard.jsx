// src/components/Dashboard.jsx

import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { FaDollarSign, FaPiggyBank, FaChartLine, FaUsers, FaBoxOpen, FaWarehouse, FaUserTie, FaArrowUp, FaArrowDown } from 'react-icons/fa';
import { getDashboardData } from './dashboardService';

const ComparisonBadge = ({ current, previous }) => {
    if (previous === 0) {
        return <small className="comparison-badge neutral">--</small>;
    }
    const percentageChange = ((current - previous) / previous) * 100;
    const isPositive = percentageChange >= 0;

    return (
        <small className={`comparison-badge ${isPositive ? 'positive' : 'negative'}`}>
            {isPositive ? <FaArrowUp /> : <FaArrowDown />}
            {percentageChange.toFixed(1)}% vs. período anterior
        </small>
    );
};

const StatCard = ({ icon, title, value, colorClass, currentValue, previousValue }) => (
    <div className="stat-card">
        <div className={`stat-card-icon ${colorClass}`}>{icon}</div>
        <div className="stat-card-info">
            <p>{title}</p>
            <strong>{value}</strong>
            <ComparisonBadge current={currentValue} previous={previousValue} />
        </div>
    </div>
);

const Dashboard = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [period, setPeriod] = useState(30);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                const dashboardData = await getDashboardData(period);
                setData(dashboardData);
            } catch (err) {
                setError("No se pudieron cargar los datos del dashboard. Asegúrate de que el backend esté funcionando.");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [period]);

    const handlePeriodChange = (e) => setPeriod(Number(e.target.value));

    if (loading) return <div className="loading-message">Cargando dashboard...</div>;
    if (error) return <div className="error-message">{error}</div>;

    const { stats, salesOverTime, topClients, topSalespeople, lowStock, inventoryValue } = data;

    return (
        // La única diferencia es que la clase .dashboard-container ahora está DENTRO
        // de un div .admin-card para unificar el estilo.
        <div className="admin-card">
            <div className="dashboard-container">
                <div className="dashboard-header">
                    <h1>Dashboard</h1>
                    <select className="date-selector" value={period} onChange={handlePeriodChange}>
                        <option value={7}>Últimos 7 días</option>
                        <option value={30}>Últimos 30 días</option>
                        <option value={90}>Últimos 90 días</option>
                    </select>
                </div>

                <div className="dashboard-grid">
                    <div className="dashboard-main-col">
                        <div className="stats-grid">
                            <StatCard 
                                icon={<FaDollarSign />} title="Total Ventas" 
                                value={`$${(stats.current.totalSales || 0).toLocaleString('es-AR')}`} 
                                currentValue={stats.current.totalSales}
                                previousValue={stats.previous.totalSales}
                                colorClass="icon-green"/>
                            
                            <StatCard 
                                icon={<FaPiggyBank />} title="Margen Bruto" 
                                value={`$${(stats.current.grossMargin || 0).toLocaleString('es-AR')}`} 
                                currentValue={stats.current.grossMargin}
                                previousValue={stats.previous.grossMargin}
                                colorClass="icon-teal"/>

                            <StatCard 
                                icon={<FaChartLine />} title="Venta Promedio" 
                                value={`$${(stats.current.avgSale || 0).toLocaleString('es-AR', {minimumFractionDigits: 2})}`}
                                currentValue={stats.current.avgSale}
                                previousValue={stats.previous.avgSale}
                                colorClass="icon-blue"/>
                            
                            <StatCard 
                                icon={<FaUsers />} title="Clientes Nuevos" 
                                value={stats.current.newCustomers || 0} 
                                currentValue={stats.current.newCustomers}
                                previousValue={stats.previous.newCustomers}
                                colorClass="icon-purple"/>
                        </div>

                        <div className="chart-container">
                            <h2>Resumen de Ventas (Últimos {period} días)</h2>
                            <ResponsiveContainer width="100%" height={350}>
                                <LineChart data={salesOverTime} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="date" />
                                    <YAxis tickFormatter={(tick) => `$${(tick/1000)}k`} />
                                    <Tooltip formatter={(value) => `$${value.toLocaleString('es-AR')}`} />
                                    <Legend />
                                    <Line type="monotone" dataKey="total_sales" name="Ventas" stroke="#4F46E5" strokeWidth={2} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="dashboard-side-col">
                        <div className="stat-card">
                            <div className="stat-card-icon icon-dark-blue"><FaWarehouse /></div>
                            <div className="stat-card-info">
                                <p>Valor Total del Inventario</p>
                                <strong>${(inventoryValue.totalValue || 0).toLocaleString('es-AR')}</strong>
                            </div>
                        </div>
                        <div className="ranking-container">
                            <h2><FaUserTie /> Top Vendedores</h2>
                            <ul className="ranking-list">
                                {topSalespeople.length > 0 ? topSalespeople.map((sp, index) => (
                                    <li className="ranking-item" key={index}>
                                        <div className="ranking-number">{index + 1}</div>
                                        <div className="ranking-info">
                                            <span>{sp.name}</span>
                                            <strong>${(sp.totalAmount || 0).toLocaleString('es-AR')}</strong>
                                        </div>
                                    </li>
                                )) : <p className="no-data-message">No hay datos</p>}
                            </ul>
                        </div>
                        <div className="ranking-container">
                            <h2><FaBoxOpen /> Alerta de Bajo Stock</h2>
                            {lowStock.length > 0 ? (
                                <ul className="ranking-list low-stock-list">
                                    {lowStock.map((item, index) => (
                                        <li className="ranking-item" key={index}>
                                          <div className="ranking-info">
                                              <span>{item.name}</span>
                                              <strong>{item.quantity} u.</strong>
                                          </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : ( <p className="no-data-message">¡No hay productos con bajo stock!</p> )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;