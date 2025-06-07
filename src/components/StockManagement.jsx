import React, { useState, useEffect, useCallback } from 'react';
import { getProducts, updateStock } from './productService';
import { Link } from 'react-router-dom';

function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => { setDebouncedValue(value); }, delay);
    return () => { clearTimeout(handler); };
  }, [value, delay]);
  return debouncedValue;
}

export default function StockManagement() {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [editQuantities, setEditQuantities] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true); setError('');
    try {
      const data = await getProducts();
      setProducts(data);
      const initialQuantities = {};
      data.forEach(p => { initialQuantities[p.id] = String(p.stock); });
      setEditQuantities(initialQuantities);
    } catch (err) { setError(`Error al cargar productos: ${err.message}`); } finally { setIsLoading(false); }
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const handleQuantityChange = (productId, value) => {
    setEditQuantities(prev => ({ ...prev, [productId]: value }));
  };

  const handleSaveStock = async (productId) => {
    const newQuantityStr = editQuantities[productId];
    if (newQuantityStr === undefined || newQuantityStr.trim() === '') return;
    const newQuantity = parseInt(newQuantityStr, 10);
    if (isNaN(newQuantity) || newQuantity < 0) {
      setError(`Cantidad inválida para producto ID ${productId}.`); return;
    }

    setIsLoading(true); setError(''); setSuccessMessage('');
    try {
      await updateStock(productId, newQuantity);
      setSuccessMessage(`Stock para producto ID ${productId} actualizado.`);
      setProducts(prev => prev.map(p => p.id === productId ? { ...p, stock: newQuantity } : p));
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(`Error actualizando stock: ${err.message}`);
      const originalProduct = products.find(p => p.id === productId);
      if (originalProduct) {
        setEditQuantities(prev => ({...prev, [productId]: String(originalProduct.stock)}));
      }
    } finally { setIsLoading(false); }
  };
  
  // ===== LÍNEA CORREGIDA =====
  // Cambiamos item.product_name a item.nombre para que coincida con los datos del backend.
  const filteredProducts = products.filter(item =>
    item.nombre && item.nombre.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
  );

  return (
    <div className="admin-panel-container stock-management-container">
      <nav className="admin-main-nav">
          <Link to="/admin" className="admin-nav-button">Gestionar Productos</Link>
          <Link to="/admin/stock" className="admin-nav-button active">Gestionar Stock</Link>
          <Link to="/admin/salespeople" className="admin-nav-button">Gestionar Vendedores</Link>
          <Link to="/admin/customers" className="admin-nav-button">Gestionar Clientes</Link>
          <Link to="/admin/orders" className="admin-nav-button">Gestionar Pedidos</Link>
      </nav>
      <h2>Gestión de Stock</h2>
      {error && <p className="error-message global-error">{error}</p>}
      {successMessage && <p className="success-message global-success">{successMessage}</p>}
      
      <div className="search-bar-container admin-search-bar">
        <input type="text" placeholder="Buscar producto..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="search-input"/>
      </div>
      
      {isLoading && <p>Cargando...</p>}
      
      <table className="admin-table stock-table">
        <thead><tr><th>ID</th><th>Nombre</th><th>Stock Actual</th><th>Nueva Cant.</th><th>Acciones</th></tr></thead>
        <tbody>
          {filteredProducts.map((p) => (
            <tr key={p.id}>
              <td data-label="ID">{p.id}</td>
              <td data-label="Nombre">{p.nombre}</td>
              <td data-label="Stock Actual">{p.stock}</td>
              <td data-label="Nueva Cant.">
                <input type="number" min="0" value={editQuantities[p.id] || ''}
                  onChange={(e) => handleQuantityChange(p.id, e.target.value)} className="stock-input-admin" disabled={isLoading}/>
              </td>
              <td data-label="Acciones">
                <button onClick={() => handleSaveStock(p.id)} disabled={isLoading || String(p.stock) === editQuantities[p.id]}>Actualizar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}