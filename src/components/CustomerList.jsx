import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getCustomers, deleteCustomer } from './customerService';

export default function CustomerList() {
  const [customers, setCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const fetchCustomers = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await getCustomers();
      setCustomers(data);
    } catch (err) {
      setError(`Error al cargar clientes: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleDelete = async (id, name) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar al cliente "${name}"? Esta acción no se puede deshacer.`)) {
      try {
        await deleteCustomer(id);
        fetchCustomers();
      } catch (err) {
        setError(`Error al eliminar cliente: ${err.message}`);
      }
    }
  };

  if (isLoading && customers.length === 0) return <p>Cargando clientes...</p>;
  if (error) return <p className="error-message global-error">{error}</p>;

  return (
    <div className="admin-panel-container">
      
    
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Gestión de Clientes</h2>
        <Link to="/admin/customers/new" className="admin-button-primary">
          + Añadir Cliente
        </Link>
      </div>

      {customers.length === 0 ? (
        <p>No hay clientes registrados.</p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>Teléfono</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {customers.map(customer => (
              <tr key={customer.id}>
                <td data-label="Nombre">{customer.name}</td>
                <td data-label="Email">{customer.email || '-'}</td>
                <td data-label="Teléfono">{customer.phone || '-'}</td>
                <td data-label="Acciones" className="actions-cell">
                  <button onClick={() => navigate(`/admin/customers/${customer.id}`)} className="action-button view">Ver Detalles</button>
                  <button onClick={() => navigate(`/admin/customers/edit/${customer.id}`)} className="action-button edit">Editar</button>
                  <button onClick={() => handleDelete(customer.id, customer.name)} className="action-button delete">Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
