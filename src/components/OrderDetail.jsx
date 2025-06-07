// src/components/OrderDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getOrderById } from './orderService';

export default function OrderDetail() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!orderId) return;
    const fetchOrderDetails = async () => {
      setIsLoading(true);
      try {
        const data = await getOrderById(orderId);
        setOrder(data);
      } catch (err) {
        setError(`Error al cargar detalles del pedido: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrderDetails();
  }, [orderId]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('es-AR', options);
  };

  if (isLoading) return <p>Cargando detalles del pedido...</p>;
  if (error) return <p className="error-message global-error">{error}</p>;
  if (!order) return <p>Pedido no encontrado.</p>;

  return (
    <div className="detail-container">
      <button onClick={() => navigate(-1)} className="back-button">&larr; Volver</button>
      
      <h2>Detalles del Pedido #{order.id}</h2>
      
      <div className="detail-section">
        <h3>Información General</h3>
        <p><strong>Fecha del Pedido:</strong> {formatDate(order.order_date)}</p>
        <p><strong>Estado:</strong> <span className={`status-badge status-${order.status?.toLowerCase()}`}>{order.status}</span></p>
        <p><strong>Monto Total:</strong> ${order.total_amount ? order.total_amount.toLocaleString('es-AR', { minimumFractionDigits: 2 }) : '0.00'}</p>
      </div>

      {order.customer_id && (
        <div className="detail-section">
          <h3>Información del Cliente</h3>
          <p><strong>Nombre:</strong> {order.customer_name || 'N/A'}</p>
          <p><strong>Email:</strong> {order.customer_email || 'N/A'}</p>
          <p><strong>Teléfono:</strong> {order.customer_phone || 'N/A'}</p>
          <p><Link to={`/admin/customers/${order.customer_id}`}>Ver Ficha del Cliente</Link></p>
        </div>
      )}

      <div className="detail-section">
        <h3>Ítems del Pedido</h3>
        {order.items && order.items.length > 0 ? (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Cantidad</th>
                <th>Precio Unitario</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map(item => (
                <tr key={item.id}>
                  <td data-label="Producto">{item.product_name}</td>
                  <td data-label="Cantidad">{item.quantity}</td>
                  <td data-label="Precio Unit.">${item.price_per_unit ? item.price_per_unit.toLocaleString('es-AR') : '0.00'}</td>
                  <td data-label="Subtotal">${(item.quantity * item.price_per_unit).toLocaleString('es-AR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No hay ítems en este pedido.</p>
        )}
      </div>
    </div>
  );
}