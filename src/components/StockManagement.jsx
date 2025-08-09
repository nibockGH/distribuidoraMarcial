import React, { useState, useEffect, useCallback } from 'react';
import { getProducts, adjustStock, getStockHistory } from './productService';
import { Link } from 'react-router-dom';

const StockMovementModal = ({ product, onClose, onStockAdjusted }) => {
  const [adjustment, setAdjustment] = useState({ change_quantity: '', movement_type: 'Ajuste Manual', reason: '' });
  const [history, setHistory] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  useEffect(() => {
    setIsLoadingHistory(true);
    getStockHistory(product.id)
      .then(data => setHistory(data))
      .catch(err => console.error("Error fetching history:", err))
      .finally(() => setIsLoadingHistory(false));
  }, [product.id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setAdjustment(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const quantity = adjustment.change_quantity.replace(',', '.');
    if (!quantity || parseFloat(quantity) === 0) {
      alert("La cantidad a modificar no puede ser cero."); return;
    }
    try {
      await adjustStock(product.id, { ...adjustment, change_quantity: quantity });
      onStockAdjusted();
    } catch (err) {
      alert(`Error al ajustar stock: ${err.message}`);
    }
  };

  const formatDate = (dateStr) => new Date(dateStr).toLocaleString('es-AR');

  return (
    <div className="modal-overlay">
      <div className="modal-content large">
        <button onClick={onClose} className="modal-close-button">×</button>
        <h3>Gestionar Stock de: {product.nombre}</h3>
        <p>Stock Actual: <strong>{product.stock} {product.unidad}</strong></p>

        <div className="detail-columns">
          <div className="detail-section">
            <h4>Realizar Ajuste</h4>
            <form onSubmit={handleSubmit} className="admin-form">
              <input type="text" name="change_quantity" placeholder="Cantidad (+10 o -2,5)" value={adjustment.change_quantity} onChange={handleChange} required />
              <select name="movement_type" value={adjustment.movement_type} onChange={handleChange}>
                <option value="Ajuste Manual">Ajuste Manual</option>
                <option value="Ingreso por Compra">Ingreso por Compra</option>
                <option value="Merma por Falla">Merma por Falla/Vencimiento</option>
              </select>
              <textarea name="reason" placeholder="Motivo del ajuste..." value={adjustment.reason} onChange={handleChange} rows="3"></textarea>
              <button type="submit" className="admin-button-primary">Aplicar Ajuste</button>
            </form>
          </div>
          <div className="detail-section">
            <h4>Historial de Movimientos (Kardex)</h4>
            <div className="table-wrapper" style={{maxHeight: '300px', overflowY: 'auto'}}>
              {isLoadingHistory ? <p>Cargando historial...</p> : (
                <table className="admin-table simple-table">
                  <thead><tr><th>Fecha</th><th>Tipo</th><th>Cambio</th><th>Stock Final</th><th>Motivo</th></tr></thead>
                  <tbody>
                    {history.map(h => (
                      <tr key={h.id}>
                        <td>{formatDate(h.created_at)}</td>
                        <td>{h.movement_type}</td>
                        <td style={{color: h.change_quantity > 0 ? 'green' : 'red', fontWeight:'bold'}}>{h.change_quantity > 0 ? `+${h.change_quantity}` : h.change_quantity}</td>
                        <td>{h.new_quantity}</td>
                        <td>{h.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function StockManagement() {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true); setError('');
    try {
      const data = await getProducts();
      setProducts(data);
    } catch (err) {
      setError(`Error al cargar productos: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);
  
  const handleStockAdjusted = () => {
    setSelectedProduct(null);
    fetchProducts();
  };

  if (isLoading) return <p>Cargando...</p>;
  if (error) return <p className="error-message global-error">{error}</p>;

  return (
    <div className="admin-panel-container">
      {selectedProduct && (
        <StockMovementModal 
          product={selectedProduct} 
          onClose={() => setSelectedProduct(null)}
          onStockAdjusted={handleStockAdjusted}
        />
      )}
      
      <h2>Gestión de Stock</h2>
      <div className="table-wrapper">
        <table className="admin-table stock-table">
          <thead><tr><th>ID</th><th>Nombre</th><th>Stock Actual</th><th>Acciones</th></tr></thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id}>
                <td data-label="ID">{p.id}</td>
                <td data-label="Nombre">{p.nombre}</td>
                <td data-label="Stock Actual" style={{fontWeight: 'bold'}}>{p.stock} {p.unidad}</td>
                <td data-label="Acciones">
                  <button onClick={() => setSelectedProduct(p)} className="action-button view">
                    Ajustar / Ver Historial
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}