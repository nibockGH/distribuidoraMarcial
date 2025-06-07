// src/components/AdminPanel.jsx
import React, { useState, useEffect } from 'react';
import { getProducts, addProduct, updateProduct, deleteProduct } from './productService';
import { Link } from 'react-router-dom';

export default function AdminPanel() {
  const [products, setProducts] = useState([]);
  const [newProduct, setNewProduct] = useState({ nombre: '', precio: '', unidad: 'unidad', stock: 0 });
  const [editingProduct, setEditingProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchProducts = async () => {
    setIsLoading(true);
    setError('');
    try {
      const fetched = await getProducts();
      setProducts(fetched);
    } catch (err) {
      setError(`Error al cargar productos: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewProduct(prev => ({ ...prev, [name]: value }));
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditingProduct(prev => ({ ...prev, [name]: value }));
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!newProduct.nombre || !newProduct.precio) {
      setError('Nombre y precio son obligatorios.'); return;
    }
    setIsLoading(true); setError('');
    try {
      await addProduct({ ...newProduct, stock: Number(newProduct.stock) || 0 });
      setNewProduct({ nombre: '', precio: '', unidad: 'unidad', stock: 0 });
      await fetchProducts();
    } catch (err) {
      setError(`Error al añadir producto: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    if (!editingProduct) return;
    setIsLoading(true); setError('');
    try {
      await updateProduct(editingProduct);
      setEditingProduct(null);
      await fetchProducts();
    } catch (err) {
      setError(`Error al actualizar producto: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm("¿Seguro que quieres eliminar este producto?")) return;
    setIsLoading(true); setError('');
    try {
      await deleteProduct(id);
      await fetchProducts();
    } catch (err) {
      setError(`Error al eliminar producto: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const startEdit = (product) => {
    setEditingProduct({...product, precio: String(product.precio) });
    setError('');
  };

  return (
    <div className="admin-panel-container">
      <nav className="admin-main-nav">
        <Link to="/admin" className="admin-nav-button active">Gestionar Productos</Link>
        <Link to="/admin/stock" className="admin-nav-button">Gestionar Stock</Link>
        <Link to="/admin/salespeople" className="admin-nav-button">Gestionar Vendedores</Link>
        <Link to="/admin/customers" className="admin-nav-button">Gestionar Clientes</Link>
        <Link to="/admin/orders" className="admin-nav-button">Gestionar Pedidos</Link>
      </nav>

      <h2>Panel de Administración de Productos</h2>
      {error && <p className="error-message global-error">{error}</p>}
      
      <div className="admin-section">
        <h3>{editingProduct ? `Editando: ${editingProduct.nombre}` : 'Añadir Nuevo Producto'}</h3>
        <form onSubmit={editingProduct ? handleUpdateProduct : handleAddProduct} className="admin-form grid-form">
          <input type="text" name="nombre" placeholder="Nombre" required
            value={editingProduct ? editingProduct.nombre : newProduct.nombre}
            onChange={editingProduct ? handleEditChange : handleChange} />
          <input type="number" name="precio" placeholder="Precio" required
            value={editingProduct ? editingProduct.precio : newProduct.precio}
            onChange={editingProduct ? handleEditChange : handleChange} step="0.01" />
         
          {!editingProduct && (
            <input type="number" name="stock" placeholder="Stock Inicial"
              value={newProduct.stock} onChange={handleChange} min="0" />
          )}
          {editingProduct ? (
            <div className="admin-form-buttons">
              <button type="submit" disabled={isLoading}>Actualizar Producto</button>
              <button type="button" onClick={() => setEditingProduct(null)} disabled={isLoading}>Cancelar</button>
            </div>
          ) : (
            <button type="submit" disabled={isLoading}>Añadir Producto</button>
          )}
        </form>
         {editingProduct && <small>El stock de productos existentes se edita en la sección "Gestionar Stock".</small>}
      </div>

      <div className="admin-section">
        <h3>Listado de Productos</h3>
        {isLoading && <p>Cargando...</p>}
        <div className="product-list-admin-display">
          <table className="admin-table">
            <thead>
              <tr><th>ID</th><th>Nombre</th><th>Precio</th><th>Stock</th><th>Acciones</th></tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td data-label="ID">{p.id}</td><td data-label="Nombre">{p.nombre}</td>
                  <td data-label="Precio">${p.precio.toLocaleString('es-AR')}</td>
                  <td data-label="Stock">{p.stock}</td>
                  <td data-label="Acciones">
                    <button onClick={() => startEdit(p)} disabled={isLoading}>Editar</button>
                    <button onClick={() => handleDeleteProduct(p.id)} disabled={isLoading} className="delete-button">Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}