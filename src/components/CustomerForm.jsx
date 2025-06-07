// src/components/CustomerForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { addCustomer, getCustomerById, updateCustomer } from './customerService';

export default function CustomerForm() {
  const navigate = useNavigate();
  const { customerId } = useParams();
  const isEditing = Boolean(customerId);

  const [customer, setCustomer] = useState({
    name: '', address: '', phone: '', email: '',
    contact_person: '', business_type: '', notes: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (isEditing) {
      const fetchCustomer = async () => {
        setIsLoading(true);
        try {
          const data = await getCustomerById(customerId);
          setCustomer(data);
        } catch (err) {
          setError(`Error al cargar el cliente: ${err.message}`);
        } finally {
          setIsLoading(false);
        }
      };
      fetchCustomer();
    }
  }, [customerId, isEditing]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCustomer(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    if (!customer.name.trim()) {
      setError('El nombre del cliente es obligatorio.');
      setIsLoading(false);
      return;
    }

    try {
      if (isEditing) {
        await updateCustomer(customerId, customer);
        setSuccessMessage('¡Cliente actualizado exitosamente!');
      } else {
        await addCustomer(customer);
        setSuccessMessage('¡Cliente agregado exitosamente!');
      }
      setTimeout(() => {
        navigate('/admin/customers');
      }, 1500);
    } catch (err) {
      setError(`Error al guardar el cliente: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && isEditing) return <p>Cargando cliente...</p>;

  return (
    <div className="admin-form-container">
      <h2>{isEditing ? 'Editar Cliente' : 'Agregar Nuevo Cliente'}</h2>
      {error && <p className="error-message global-error">{error}</p>}
      {successMessage && <p className="success-message global-success">{successMessage}</p>}
      
      <form onSubmit={handleSubmit} className="customer-form">
        <div className="form-field">
          <label htmlFor="name">Nombre:</label>
          <input type="text" id="name" name="name" value={customer.name} onChange={handleChange} required />
        </div>
        <div className="form-field">
          <label htmlFor="email">Email:</label>
          <input type="email" id="email" name="email" value={customer.email || ''} onChange={handleChange} />
        </div>
        <div className="form-field">
          <label htmlFor="phone">Teléfono:</label>
          <input type="tel" id="phone" name="phone" value={customer.phone || ''} onChange={handleChange} />
        </div>
        <div className="form-field">
          <label htmlFor="address">Dirección:</label>
          <input type="text" id="address" name="address" value={customer.address || ''} onChange={handleChange} />
        </div>
        <div className="form-field">
          <label htmlFor="contact_person">Persona de Contacto:</label>
          <input type="text" id="contact_person" name="contact_person" value={customer.contact_person || ''} onChange={handleChange} />
        </div>
        <div className="form-field">
          <label htmlFor="business_type">Tipo de Negocio:</label>
          <input type="text" id="business_type" name="business_type" value={customer.business_type || ''} onChange={handleChange} />
        </div>
        <div className="form-field full-width">
          <label htmlFor="notes">Notas:</label>
          <textarea id="notes" name="notes" value={customer.notes || ''} onChange={handleChange} rows="4"></textarea>
        </div>
        <div className="form-actions full-width">
          <button type="submit" disabled={isLoading} className="admin-button-primary">
            {isLoading ? 'Guardando...' : (isEditing ? 'Actualizar Cliente' : 'Agregar Cliente')}
          </button>
          {/* ----- ESTE ES EL BOTÓN PARA IR ATRÁS/CANCELAR ----- */}
          <Link to="/admin/customers" className="admin-button-secondary">Cancelar</Link>
        </div>
      </form>
    </div>
  );
}