// src/components/FleetManagement.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { getVehicles, addVehicle, updateVehicle, deleteVehicle } from './fleetService';
import {  FaPlus, FaEdit, FaTrash } from 'react-icons/fa';

// Un componente separado para el formulario, para mantener el código limpio
const VehicleForm = ({ vehicle, onSave, onCancel }) => {
    const [formData, setFormData] = useState(
        vehicle || {
            name: '', plate: '', brand: '', model: '', year: '',
            last_service_date: '', next_service_due_km: '',
            insurance_expiry_date: '', vtv_expiry_date: '', notes: ''
        }
    );

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content large">
                <form onSubmit={handleSubmit}>
                    <h3>{vehicle ? 'Editar Vehículo' : 'Añadir Nuevo Vehículo'}</h3>
                    <div className="admin-form grid-form">
                        <input name="name" value={formData.name} onChange={handleChange} placeholder="Nombre o Apodo (ej: Ranger Gris)" required />
                        <input name="plate" value={formData.plate} onChange={handleChange} placeholder="Patente" required />
                        <input name="brand" value={formData.brand} onChange={handleChange} placeholder="Marca" />
                        <input name="model" value={formData.model} onChange={handleChange} placeholder="Modelo" />
                        <input name="year" type="number" value={formData.year} onChange={handleChange} placeholder="Año" />
                        <div><label>Último Service:</label><input name="last_service_date" type="date" value={formData.last_service_date} onChange={handleChange} /></div>
                        <input name="next_service_due_km" type="number" value={formData.next_service_due_km} onChange={handleChange} placeholder="Próximo Service (KM)" />
                        <div><label>Vencimiento Seguro:</label><input name="insurance_expiry_date" type="date" value={formData.insurance_expiry_date} onChange={handleChange} /></div>
                        <div><label>Vencimiento VTV:</label><input name="vtv_expiry_date" type="date" value={formData.vtv_expiry_date} onChange={handleChange} /></div>
                        <textarea name="notes" value={formData.notes} onChange={handleChange} placeholder="Notas adicionales..." className="full-span"></textarea>
                    </div>
                    <div className="form-actions">
                        <button type="submit" className="admin-button-primary">Guardar</button>
                        <button type="button" onClick={onCancel} className="admin-button-secondary">Cancelar</button>
                    </div>
                </form>
            </div>
        </div>
    );
};


const FleetManagement = () => {
    const [vehicles, setVehicles] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingVehicle, setEditingVehicle] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const loadVehicles = useCallback(async () => {
        try {
            const data = await getVehicles();
            setVehicles(data);
        } catch (err) {
            setError('Error al cargar la flota.');
        }
    }, []);

    useEffect(() => {
        loadVehicles();
    }, [loadVehicles]);

    const handleSave = async (vehicleData) => {
        setError('');
        setSuccess('');
        try {
            if (editingVehicle) {
                await updateVehicle(editingVehicle.id, vehicleData);
                setSuccess('Vehículo actualizado correctamente.');
            } else {
                await addVehicle(vehicleData);
                setSuccess('Vehículo añadido a la flota.');
            }
            setIsModalOpen(false);
            setEditingVehicle(null);
            loadVehicles();
        } catch (err) {
            setError(err.response?.data?.message || 'Error al guardar el vehículo.');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Estás seguro de que quieres eliminar este vehículo?')) {
            setError('');
            setSuccess('');
            try {
                await deleteVehicle(id);
                setSuccess('Vehículo eliminado.');
                loadVehicles();
            } catch (err) {
                setError(err.response?.data?.message || 'Error al eliminar el vehículo.');
            }
        }
    };

    const openModal = (vehicle = null) => {
        setEditingVehicle(vehicle);
        setIsModalOpen(true);
        setError('');
        setSuccess('');
    };

    return (
        <div className="admin-section">
            <div className="admin-page-header">
                <h2>Gestión de Flota</h2>
                <button onClick={() => openModal()} className="admin-button-primary">
                    <FaPlus /> Añadir Vehículo
                </button>
            </div>

            {error && <p className="error-message global-error">{error}</p>}
            {success && <p className="success-message global-success">{success}</p>}

            {isModalOpen && <VehicleForm vehicle={editingVehicle} onSave={handleSave} onCancel={() => setIsModalOpen(false)} />}

            <div className="table-wrapper">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Nombre</th>
                            <th>Patente</th>
                            <th>Marca/Modelo</th>
                            <th>Venc. Seguro</th>
                            <th>Venc. VTV</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {vehicles.map(v => (
                            <tr key={v.id}>
                                <td data-label="Nombre">{v.name}</td>
                                <td data-label="Patente">{v.plate}</td>
                                <td data-label="Marca/Modelo">{v.brand} {v.model} ({v.year})</td>
                                <td data-label="Venc. Seguro">{v.insurance_expiry_date || 'N/A'}</td>
                                <td data-label="Venc. VTV">{v.vtv_expiry_date || 'N/A'}</td>
                                <td data-label="Acciones" className="actions-cell">
                                    <button onClick={() => openModal(v)} className="action-button edit"><FaEdit /></button>
                                    <button onClick={() => handleDelete(v.id)} className="action-button delete"><FaTrash /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default FleetManagement;