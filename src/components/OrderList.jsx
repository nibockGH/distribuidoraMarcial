// src/components/OrderList.jsx
import React, { useState, useEffect } from 'react';
// Se importa 'Link' para que funcione la barra de navegación que usas
import { useNavigate, Link } from 'react-router-dom';
import { getOrders, updateOrderStatus } from './orderService';

const ORDER_STATUS_OPTIONS = ['Pendiente', 'Procesando', 'Enviado', 'Entregado', 'Cancelado'];

export default function OrderList() {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const fetchOrders = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await getOrders();
      setOrders(data);
    } catch (err) {
      setError(`Error al cargar pedidos: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      );
    } catch (err) {
      alert(`Error al actualizar estado: ${err.message}`);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('es-AR', options);
  };

  if (isLoading) return <div className="admin-panel-container"><p>Cargando pedidos...</p></div>;
  if (error) return <div className="admin-panel-container"><p className="error-message global-error">{error}</p></div>;

  return (
    <div className="admin-panel-container">

      {/* ----- TU BARRA DE NAVEGACIÓN PEGADA AQUÍ ----- */}
      <nav className="admin-main-nav">
        <Link to="/admin" className="admin-nav-button">Gestionar Productos</Link>
        <Link to="/admin/stock" className="admin-nav-button">Gestionar Stock</Link>
        <Link to="/admin/salespeople" className="admin-nav-button">Gestionar Vendedores</Link>
        <Link to="/admin/customers" className="admin-nav-button">Gestionar Clientes</Link>
        {/* NOTA: Moví la clase "active" a este botón para que coincida con la página de Pedidos. */}
        <Link to="/admin/orders" className="admin-nav-button active">Gestionar Pedidos</Link>
      </nav>

      <h2>Gestión de Pedidos</h2>
      {orders.length === 0 ? (
        <p>No hay pedidos registrados.</p>
      ) : (
        <div className="product-list-admin-display">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID Pedido</th>
                <th>Fecha</th>
                <th>Cliente</th>
                <th>Total</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order.id}>
                  <td data-label="ID Pedido">{order.id}</td>
                  <td data-label="Fecha">{formatDate(order.order_date)}</td>
                  <td data-label="Cliente">{order.customer_name || 'N/A'}</td>
                  <td data-label="Total">${order.total_amount ? Number(order.total_amount).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0,00'}</td>
                  <td data-label="Estado">
                    <select
                      value={order.status}
                      onChange={(e) => handleStatusChange(order.id, e.target.value)}
                      className="status-select"
                    >
                      {ORDER_STATUS_OPTIONS.map(statusOption => (
                        <option key={statusOption} value={statusOption}>{statusOption}</option>
                      ))}
                    </select>
                  </td>
                  <td data-label="Acciones">
                    <button onClick={() => navigate(`/admin/orders/${order.id}`)} className="action-button view">
                      Ver Detalles
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}