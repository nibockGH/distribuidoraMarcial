// src/components/CustomerDetail.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getCustomerById, getCustomerOrders, getSpecialPrices, addOrUpdateSpecialPrice, deleteSpecialPrice } from './customerService';
import { getProducts } from './productService';

export default function CustomerDetail() {
  const { customerId } = useParams();
  const navigate = useNavigate();
  
  const [customer, setCustomer] = useState(null);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [specialPrices, setSpecialPrices] = useState([]);
  
  const [newSpecialPrice, setNewSpecialPrice] = useState({ productId: '', specialPrice: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    if (!customerId) return;
    setIsLoading(true);
    try {
      const [customerData, customerOrders, productsData, specialPricesData] = await Promise.all([
        getCustomerById(customerId),
        getCustomerOrders(customerId),
        getProducts(),
        getSpecialPrices(customerId)
      ]);
      setCustomer(customerData);
      setOrders(customerOrders);
      setProducts(productsData);
      setSpecialPrices(specialPricesData);
    } catch (err) {
      setError(`Error al cargar datos: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSpecialPriceChange = (e) => {
    setNewSpecialPrice(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleAddSpecialPrice = async (e) => {
    e.preventDefault();
    if (!newSpecialPrice.productId || !newSpecialPrice.specialPrice) {
      alert("Por favor, selecciona un producto y establece un precio.");
      return;
    }
    try {
      await addOrUpdateSpecialPrice(customerId, newSpecialPrice.productId, parseFloat(newSpecialPrice.specialPrice));
      setNewSpecialPrice({ productId: '', specialPrice: '' });
      fetchData();
    } catch (err) {
      alert(`Error al guardar: ${err.message}`);
    }
  };

  const handleDeleteSpecialPrice = async (productId) => {
    if (window.confirm("¿Seguro que quieres eliminar este precio especial?")) {
      try {
        await deleteSpecialPrice(customerId, productId);
        fetchData();
      } catch (err) {
        alert(`Error al eliminar: ${err.message}`);
      }
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('es-AR', options);
  };

  if (isLoading) return <p>Cargando detalles del cliente...</p>;
  if (error) return <p className="error-message global-error">{error}</p>;
  if (!customer) return <p>Cliente no encontrado.</p>;

  return (
    <div className="detail-container">
      <button onClick={() => navigate('/admin/customers')} className="back-button">&larr; Volver a Lista</button>
      
      <div className="detail-header">
        <h2>{customer.name}</h2>
        <Link to={`/admin/customers/edit/${customer.id}`} className="admin-button-primary">Editar Cliente</Link>
      </div>

      <div className="detail-section">
        <h3>Información de Contacto</h3>
        <p><strong>Email:</strong> {customer.email || 'N/A'}</p>
        <p><strong>Teléfono:</strong> {customer.phone || 'N/A'}</p>
        <p><strong>Dirección:</strong> {customer.address || 'N/A'}</p>
      </div>

      <div className="detail-section">
        <h3>Precios Especiales para {customer.name}</h3>
        <form onSubmit={handleAddSpecialPrice} className="special-price-form">
          <select name="productId" value={newSpecialPrice.productId} onChange={handleSpecialPriceChange} required>
            <option value="">-- Seleccionar un producto --</option>
            {products.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
          </select>
          <input type="number" name="specialPrice" placeholder="Precio especial" value={newSpecialPrice.specialPrice}
            onChange={handleSpecialPriceChange} step="0.01" required />
          <button type="submit" className="admin-button-primary">Guardar Precio</button>
        </form>

        {specialPrices.length > 0 ? (
          <table className="admin-table simple-table">
            <thead>
              <tr><th>Producto</th><th>Precio Especial</th><th>Acciones</th></tr>
            </thead>
            <tbody>
              {specialPrices.map(sp => (
                <tr key={sp.product_id}>
                  <td>{sp.product_name}</td>
                  <td>${sp.special_price.toLocaleString('es-AR')}</td>
                  <td><button onClick={() => handleDeleteSpecialPrice(sp.product_id)} className="action-button delete">Eliminar</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>Este cliente no tiene precios especiales asignados.</p>
        )}
      </div>

      <div className="detail-section">
        <h3>Historial de Pedidos</h3>
        {orders.length > 0 ? (
          <table className="admin-table">
            <thead>
              <tr><th>ID Pedido</th><th>Fecha</th><th>Estado</th><th>Monto Total</th><th>Acciones</th></tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order.id}>
                  <td data-label="ID Pedido">{order.id}</td>
                  <td data-label="Fecha">{formatDate(order.order_date)}</td>
                  <td data-label="Estado">{order.status}</td>
                  <td data-label="Monto">${order.total_amount ? order.total_amount.toLocaleString('es-AR') : '0.00'}</td>
                  <td data-label="Acciones">
                    <Link to={`/admin/orders/${order.id}`} className="action-button view">Ver Detalles</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>Este cliente aún no tiene pedidos registrados.</p>
        )}
      </div>
    </div>
  );
}