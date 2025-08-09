import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { getCustomerById, createCustomer, updateCustomer } from './customerService'; // Asegúrate que esta ruta sea correcta

const CustomerForm = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        localidad: '',
        business_type: '',
        notes: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    
    const navigate = useNavigate();
    const { customerId } = useParams();
    const isEditing = Boolean(customerId);

    useEffect(() => {
        if (isEditing) {
            setLoading(true);
            getCustomerById(customerId)
                .then(data => {
                    setFormData(data);
                })
                .catch(err => {
                    console.error("Error al cargar el cliente:", err);
                    setError('No se pudo cargar la información del cliente.');
                })
                .finally(() => setLoading(false));
        }
    }, [customerId, isEditing]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevData => ({
            ...prevData,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (isEditing) {
                await updateCustomer(customerId, formData);
            } else {
                await createCustomer(formData);
            }
            navigate('/admin/customers'); // Redirige a la lista de clientes después de guardar
        } catch (err) {
            console.error("Error al guardar el cliente:", err);
            setError(err.message || 'Ocurrió un error al guardar. Intente de nuevo.');
        } finally {
            setLoading(false);
        }
    };
    
    if (loading && isEditing) {
        return <div className="loading-message">Cargando datos del cliente...</div>;
    }

    return (
        <div className="admin-card">
            <h2>{isEditing ? 'Editar Cliente' : 'Agregar Nuevo Cliente'}</h2>
            
            {error && <div className="error-message global-error">{error}</div>}

            <form onSubmit={handleSubmit} className="form-grid">
                
                <div className="form-group">
                    <label htmlFor="name">Nombre / Razón Social</label>
                    <input 
                        id="name"
                        type="text"
                        name="name"
                        value={formData.name || ''}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input 
                        id="email"
                        type="email"
                        name="email"
                        value={formData.email || ''}
                        onChange={handleChange}
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="phone">Teléfono</label>
                    <input 
                        id="phone"
                        type="tel"
                        name="phone"
                        value={formData.phone || ''}
                        onChange={handleChange}
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="address">Dirección</label>
                    <input 
                        id="address"
                        type="text"
                        name="address"
                        value={formData.address || ''}
                        onChange={handleChange}
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="localidad">Localidad</label>
                    <input 
                        id="localidad"
                        type="text"
                        name="localidad"
                        value={formData.localidad || ''}
                        onChange={handleChange}
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="business_type">Tipo de Negocio</label>
                    <input 
                        id="business_type"
                        type="text"
                        name="business_type"
                        value={formData.business_type || ''}
                        onChange={handleChange}
                    />
                </div>
                
                <div className="form-group full-width">
                    <label htmlFor="notes">Notas (CUIT u otra info)</label>
                    <textarea 
                        id="notes" 
                        name="notes"
                        value={formData.notes || ''}
                        onChange={handleChange}
                    ></textarea>
                </div>

                <div className="form-actions">
                    <button type="button" className="btn btn-secondary" onClick={() => navigate('/admin/customers')}>
                        Cancelar
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? 'Guardando...' : (isEditing ? 'Guardar Cambios' : 'Agregar Cliente')}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CustomerForm;