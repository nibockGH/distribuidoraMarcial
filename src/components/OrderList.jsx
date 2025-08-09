// src/components/OrderList.jsx

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom'; // Importamos Link para una mejor navegación
import { getOrders, updateOrderStatus } from './orderService'; // Asegúrate de que la ruta sea correcta

const ORDER_STATUS_OPTIONS = ['Pendiente', 'Procesando', 'Enviado', 'Entregado', 'Cancelado'];
const API_URL = 'http://localhost:4000'; // Definimos la URL base del backend

export default function OrderList() {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // No necesitamos 'navigate' si usamos <Link> para los detalles

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

  const handleStatusChange = async (orderUniqueId, newStatus) => {
    try {
      // Usamos el unique_id para actualizar el estado
      await updateOrderStatus(orderUniqueId, newStatus);
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.unique_id === orderUniqueId ? { ...order, status: newStatus } : order
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

  if (isLoading) return <div className="admin-section"><p>Cargando pedidos...</p></div>;
  if (error) return <div className="admin-section"><p className="error-message global-error">{error}</p></div>;

  return (
    <div className="admin-section"> {/* o la clase que uses como contenedor principal */}

      {/* MODIFICACIÓN AQUÍ */}
      <div className="admin-page-header">
        <h2>Gestión de Pedidos</h2>
        <a 
            href="http://localhost:4000/api/orders/export/csv" 
            className="export-button"
            download
        >
            Exportar a Excel
        </a>
      </div>
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
                <tr key={order.unique_id}>
                  <td data-label="ID Pedido">{order.id} ({order.type.split(' ')[0]})</td>
                  <td data-label="Fecha">{formatDate(order.order_date)}</td>
                  <td data-label="Cliente">{order.customer_name || 'N/A'}</td>
                  <td data-label="Total">${order.total_amount ? Number(order.total_amount).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0,00'}</td>
                  <td data-label="Estado">
                    <select
                      value={order.status}
                      // CORRECCIÓN: Pasamos el unique_id para evitar ambigüedades
                      onChange={(e) => handleStatusChange(order.unique_id, e.target.value)}
                      className="status-select"
                    >
                      {ORDER_STATUS_OPTIONS.map(statusOption => (
                        <option key={statusOption} value={statusOption}>{statusOption}</option>
                      ))}
                    </select>
                  </td>
                  <td data-label="Acciones" className="actions-cell">
                    {/* CORRECCIÓN: Usamos Link para navegar y el unique_id */}
                    <Link to={`/admin/orders/${order.unique_id}`} className="action-button view">
                      Detalles
                    </Link>
                    
                    {/* NUEVO BOTÓN PARA PDF */}
                    <a 
                      href={`${API_URL}/api/orders/${order.unique_id}/pdf`}
                      className="action-button pdf"
                      target="_blank"
                      rel="noopener noreferrer"
                      download={`remito-${order.unique_id}.pdf`}
                    >
                      PDF
                    </a>
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