// src/components/ProductManagement.jsx

import React, { useState, useEffect } from 'react';
import { getProducts, addProduct, updateProduct, deleteProduct } from './productService'; // Asegúrate que la ruta al servicio sea correcta

// Define la URL base de tu backend.
const API_BASE_URL = 'http://localhost:4000';

export default function ProductManagement() {
  const [products, setProducts] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');

  const initialState = {
    nombre: '', 
    precio: '', 
    unidad: 'unidad', 
    stock: '', 
    cost_price: '', 
    expiration_date: '', 
    lot_number: ''
  };
  const [newProduct, setNewProduct] = useState(initialState);

  const fetchProducts = async () => {
    setIsLoading(true); setError('');
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

  const formatDateForDisplay = (dateString) => {
    if (!dateString || !dateString.includes('-')) return '-';
    const [year, month, day] = dateString.split('T')[0].split('-');
    return `${day}/${month}/${year}`;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewProduct(prev => ({ ...prev, [name]: value }));
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditingProduct(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const currentProductData = editingProduct || newProduct;

    if (!currentProductData.nombre || !currentProductData.precio) {
      setError('Nombre y Precio de Venta son obligatorios.');
      return;
    }

    const formData = new FormData();
    const processedData = {
        ...currentProductData,
        precio: parseFloat(String(currentProductData.precio || '0').replace(',', '.')) || 0,
        cost_price: parseFloat(String(currentProductData.cost_price || '0').replace(',', '.')) || 0,
        stock: parseFloat(String(currentProductData.stock || '0').replace(',', '.')) || 0
    };

    Object.keys(processedData).forEach(key => {
        if (key !== 'id' && processedData[key] !== null && processedData[key] !== undefined) {
            formData.append(key, processedData[key]);
        }
    });

    if (selectedFile) {
        formData.append('product_image', selectedFile);
    }
    
    setIsLoading(true);
    setError('');

    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, formData);
      } else {
        await addProduct(formData);
      }
      
      setNewProduct(initialState);
      setEditingProduct(null);
      setSelectedFile(null);
      setPreviewUrl('');
      await fetchProducts();

    } catch (err) {
      setError(`Error al guardar producto: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const startEdit = (product) => {
    const dateToEdit = product.expiration_date ? product.expiration_date.split('T')[0] : '';
    setEditingProduct({ ...product, expiration_date: dateToEdit });
    setSelectedFile(null);
    setPreviewUrl('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
  
  const currentFormData = editingProduct || newProduct;
  const handleFormChange = editingProduct ? handleEditChange : handleChange;

  const cancelEditing = () => {
    setEditingProduct(null);
    setSelectedFile(null);
    setPreviewUrl('');
  };

 
return (
  <>
    {/* Modifica esta parte */}
    <div className="admin-page-header">
        <h2>Panel de Administración de Productos</h2>
        <a 
            href="http://localhost:4000/api/products/export/csv" 
            className="export-button"
            download
        >
            Exportar a Excel
        </a>
    </div>

    {error && <p className="error-message global-error">{error}</p>}
      {error && <p className="error-message global-error">{error}</p>}
      
      <div className="admin-section">
        <h3>{editingProduct ? `Editando: ${editingProduct.nombre}` : 'Añadir Nuevo Producto'}</h3>
        <form onSubmit={handleSubmit} className="admin-form grid-form product-form">
          <div className="form-field">
            <label>Nombre del Producto</label>
            <input type="text" name="nombre" placeholder="Nombre del Producto" required value={currentFormData.nombre || ''} onChange={handleFormChange} />
          </div>
          <div className="form-field">
            <label>Número de Lote</label>
            <input type="text" name="lot_number" placeholder="Número de Lote" value={currentFormData.lot_number || ''} onChange={handleFormChange} />
          </div>
          <div className="form-field">
            <label>Fecha de Vencimiento</label>
            <input type="date" name="expiration_date" value={currentFormData.expiration_date || ''} onChange={handleFormChange} />
          </div>

          <div className="form-field">
            <label>Precio de Costo</label>
            <input type="text" name="cost_price" placeholder="Ej: 1500.50" value={currentFormData.cost_price || ''} onChange={handleFormChange} />
          </div>
          <div className="form-field">
            <label>Precio de Venta</label>
            <input type="text" name="precio" placeholder="Ej: 2000.00" required value={currentFormData.precio || ''} onChange={handleFormChange} />
          </div>
          <div className="form-field">
            <label>Tipo de Unidad</label>
            <select name="unidad" value={currentFormData.unidad || 'unidad'} onChange={handleFormChange}>
              <option value="unidad">Unidad</option>
              <option value="kilo">Kilo</option>
              <option value="caja">Caja</option>
            </select>
          </div>
          
          {!editingProduct && (
            <div className="form-field">
              <label>Stock Inicial</label>
              <input type="text" name="stock" placeholder="Ej: 100 o 50,5" value={currentFormData.stock || ''} onChange={handleFormChange} />
            </div>
          )}

          <div className="form-field full-span">
            <label>Imagen del Producto</label>
            <input type="file" name="product_image" onChange={handleFileChange} accept="image/*" />
          </div>
          
          {(previewUrl || (editingProduct && editingProduct.image_url)) && (
            <div className="form-field full-span image-preview">
                <label>Vista Previa</label>
                <img 
                    src={previewUrl || `${API_BASE_URL}${editingProduct.image_url}`} 
                    alt="Vista previa del producto" 
                    style={{ maxWidth: '150px', maxHeight: '150px', marginTop: '10px', borderRadius: '8px' }} 
                />
            </div>
          )}
          
          <div className="form-actions full-span">
            <button type="submit" disabled={isLoading} className="admin-button-primary">
              {isLoading ? 'Guardando...' : (editingProduct ? 'Actualizar Producto' : 'Añadir Producto')}
            </button>
            {editingProduct && (
              <button type="button" onClick={cancelEditing} disabled={isLoading} className="admin-button-secondary">
                Cancelar Edición
              </button>
            )}
          </div>
        </form>
         {editingProduct && <small>Nota: El stock se edita en "Gestionar Stock".</small>}
      </div>

      <div className="admin-section">
        <h3>Listado de Productos</h3>
        <div className="product-list-admin-display">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Imagen</th>
                <th>ID</th>
                <th>Nombre</th>
                <th>P. Costo</th>
                <th>P. Venta</th>
                <th>Unidad</th>
                <th>Stock</th>
                <th>Lote</th>
                <th>Vencimiento</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td data-label="Imagen">
                    {p.image_url ? (
                      <img src={`${API_BASE_URL}${p.image_url}`} alt={p.nombre} style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '4px' }} />
                    ) : (
                      <div style={{ width: '60px', height: '60px', backgroundColor: '#f0f0f0', textAlign: 'center', lineHeight: '60px', fontSize: '12px', color: '#888', borderRadius: '4px' }}>
                        Sin foto
                      </div>
                    )}
                  </td>
                  <td data-label="ID">{p.id}</td>
                  <td data-label="Nombre">{p.nombre}</td>
                  <td data-label="P. Costo">{p.cost_price ? `$${p.cost_price.toLocaleString('es-AR')}` : '-'}</td>
                  <td data-label="P. Venta">{p.precio ? `$${p.precio.toLocaleString('es-AR')}` : 'N/A'}</td>
                  <td data-label="Unidad">{p.unidad}</td>
                  <td data-label="Stock">{p.stock}</td>
                  <td data-label="Lote">{p.lot_number || '-'}</td>
                  <td data-label="Vencimiento">{formatDateForDisplay(p.expiration_date)}</td>
                  <td data-label="Acciones" className="actions-cell">
                    <button onClick={() => startEdit(p)} disabled={isLoading} className="action-button edit">Editar</button>
                    <button onClick={() => handleDeleteProduct(p.id)} disabled={isLoading} className="action-button delete">Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}