// src/components/SupplierList.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getSuppliers, deleteSupplier } from './supplierService'; 

export default function SupplierList() {
  const [suppliers, setSuppliers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const fetchSuppliers = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await getSuppliers();
      setSuppliers(data);
    } catch (err) {
      setError(`Error al cargar proveedores: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleDelete = async (id, name) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar al proveedor "${name}"? Esta acción no se puede deshacer.`)) {
      try {
        await deleteSupplier(id);
        fetchSuppliers();
      } catch (err) {
        setError(`Error al eliminar proveedor: ${err.message}`);
      }
    }
  };

  if (isLoading && suppliers.length === 0) return <p>Cargando proveedores...</p>;
  if (error) return <p className="error-message global-error">{error}</p>;

  return (
    <div className="admin-panel-container">
   
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Gestión de Proveedores</h2>
        <div className="header-actions">
            {/* --- BOTÓN NUEVO AÑADIDO --- */}
            <Link to="/admin/purchases/new" className="admin-button-primary" style={{ marginRight: '10px' }}>
                + Registrar Compra
            </Link>
            <Link to="/admin/suppliers/new" className="admin-button-secondary">
                + Añadir Proveedor
            </Link>
        </div>
      </div>

      {suppliers.length === 0 ? (
        <p>No hay proveedores registrados.</p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>CUIT</th>
              <th>Contacto</th>
              <th>Teléfono</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {suppliers.map(supplier => (
              <tr key={supplier.id}>
                <td data-label="Nombre">{supplier.name}</td>
                <td data-label="CUIT">{supplier.cuit || '-'}</td>
                <td data-label="Contacto">{supplier.contact_person || '-'}</td>
                <td data-label="Teléfono">{supplier.phone || '-'}</td>
                <td data-label="Acciones" className="actions-cell">
                  <button onClick={() => navigate(`/admin/suppliers/edit/${supplier.id}`)} className="action-button edit">Editar</button>
                  <button onClick={() => handleDelete(supplier.id, supplier.name)} className="action-button delete">Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
