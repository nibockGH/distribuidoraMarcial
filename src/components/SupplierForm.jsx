import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
// Asegúrate de que esta ruta sea correcta y que el archivo exista
import { getSupplierById, createSupplier, updateSupplier } from './supplierService'; 

const SupplierForm = () => {
    const [formData, setFormData] = useState({
        name: '',
        cuit: '',
        contact_person: '',
        phone: '',
        email: '',
        address: '',
        notes: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    
    const navigate = useNavigate();
    const { supplierId } = useParams();
    const isEditing = Boolean(supplierId);

    useEffect(() => {
        if (isEditing) {
            setLoading(true);
            getSupplierById(supplierId)
                .then(data => setFormData(data))
                .catch(err => {
                    console.error("Error al cargar el proveedor:", err);
                    setError('No se pudo cargar la información del proveedor.');
                })
                .finally(() => setLoading(false));
        }
    }, [supplierId, isEditing]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevData => ({ ...prevData, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (isEditing) {
                await updateSupplier(supplierId, formData);
            } else {
                await createSupplier(formData);
            }
            navigate('/admin/suppliers');
        } catch (err) {
            console.error("Error al guardar el proveedor:", err);
            setError(err.message || 'Ocurrió un error al guardar. Intente de nuevo.');
        } finally {
            setLoading(false);
        }
    };
    
    if (loading && isEditing) {
        return <div className="loading-message">Cargando datos del proveedor...</div>;
    }

    return (
        <div className="admin-card">
            <h2>{isEditing ? 'Editar Proveedor' : 'Agregar Nuevo Proveedor'}</h2>
            
            {error && <div className="error-message global-error">{error}</div>}

            <form onSubmit={handleSubmit} className="form-grid">
                
                <div className="form-group">
                    <label htmlFor="name">Nombre / Razón Social</label>
                    <input id="name" type="text" name="name" value={formData.name || ''} onChange={handleChange} required />
                </div>

                <div className="form-group">
                    <label htmlFor="cuit">CUIT</label>
                    <input id="cuit" type="text" name="cuit" value={formData.cuit || ''} onChange={handleChange} />
                </div>

                <div className="form-group">
                    <label htmlFor="contact_person">Persona de Contacto</label>
                    <input id="contact_person" type="text" name="contact_person" value={formData.contact_person || ''} onChange={handleChange} />
                </div>

                <div className="form-group">
                    <label htmlFor="phone">Teléfono</label>
                    <input id="phone" type="tel" name="phone" value={formData.phone || ''} onChange={handleChange} />
                </div>
                
                <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input id="email" type="email" name="email" value={formData.email || ''} onChange={handleChange} />
                </div>

                <div className="form-group">
                    <label htmlFor="address">Dirección</label>
                    <input id="address" type="text" name="address" value={formData.address || ''} onChange={handleChange} />
                </div>
                
                <div className="form-group full-width">
                    <label htmlFor="notes">Notas</label>
                    <textarea id="notes" name="notes" value={formData.notes || ''} onChange={handleChange}></textarea>
                </div>

                <div className="form-actions">
                    <button type="button" className="btn btn-secondary" onClick={() => navigate('/admin/suppliers')}>
                        Cancelar
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? 'Guardando...' : (isEditing ? 'Guardar Cambios' : 'Agregar Proveedor')}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default SupplierForm;