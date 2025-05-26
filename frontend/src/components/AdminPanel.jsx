import React, { useState, useEffect } from 'react';
import { getProducts, addProduct, updateProduct, deleteProduct } from './productService';

export default function AdminPanel() {
  const [products, setProducts] = useState([]);
  const [newProduct, setNewProduct] = useState({ nombre: '', precio: '', unidad: '' });
  const [editingProduct, setEditingProduct] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = () => {
    const fetched = getProducts();
    setProducts(fetched);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewProduct((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditingProduct((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddProduct = () => {
    if (!newProduct.nombre || !newProduct.precio || !newProduct.unidad) {
      setError('Todos los campos son obligatorios.');
      return;
    }
    const productToAdd = {
      id: Date.now(),
      nombre: newProduct.nombre,
      precio: Number(newProduct.precio),
      unidad: newProduct.unidad,
    };
    addProduct(productToAdd);
    setNewProduct({ nombre: '', precio: '', unidad: '' });
    fetchProducts();
    setError('');
  };

  const handleUpdateProduct = () => {
    if (!editingProduct.nombre || !editingProduct.precio || !editingProduct.unidad) {
      setError('Todos los campos son obligatorios.');
      return;
    }
    const updatedProductData = {
      ...editingProduct,
      precio: Number(editingProduct.precio)
    };
    updateProduct(updatedProductData);
    setEditingProduct(null);
    fetchProducts();
    setError('');
  };

  const handleDeleteProduct = (id) => {
    deleteProduct(id);
    fetchProducts();
  };

  return (
    <div className="admin-panel-container">
      <h2>Panel de Administración de Productos</h2>

      {error && <p className="error">{error}</p>}

      <div className="admin-form">
        <h3>{editingProduct ? 'Editar Producto' : 'Añadir Nuevo Producto'}</h3>
        <input
          type="text"
          name="nombre"
          placeholder="Nombre del Producto"
          value={editingProduct ? editingProduct.nombre : newProduct.nombre}
          onChange={editingProduct ? handleEditChange : handleChange}
        />
        <input
          type="number"
          name="precio"
          placeholder="Precio"
          value={editingProduct ? editingProduct.precio : newProduct.precio}
          onChange={editingProduct ? handleEditChange : handleChange}
        />
        <input
          type="text"
          name="unidad"
          placeholder="Unidad (ej: unidad, kg, pack)"
          value={editingProduct ? editingProduct.unidad : newProduct.unidad}
          onChange={editingProduct ? handleEditChange : handleChange}
        />
        {editingProduct ? (
          <div className="admin-form-buttons">
            <button onClick={handleUpdateProduct}>Guardar Cambios</button>
            <button onClick={() => setEditingProduct(null)}>Cancelar</button>
          </div>
        ) : (
          <div className="admin-form-buttons"> 
            <button onClick={handleAddProduct}>Añadir Producto</button>
          </div>
        )}
      </div>

      <h3>Productos Actuales</h3>
      <div className="product-list-admin">
        {products.length === 0 ? (
          <p>No hay productos en la base de datos.</p>
        ) : (
          <ul>
            {products.map((product) => (
              <li key={product.id}>
                <span>{product.nombre} - ${product.precio} </span>
                <div className="admin-item-buttons"> 
                  <button onClick={() => setEditingProduct(product)}>Editar</button>
                  <button onClick={() => handleDeleteProduct(product.id)}>Eliminar</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}