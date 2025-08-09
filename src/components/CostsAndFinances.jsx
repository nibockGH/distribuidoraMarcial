// src/components/CostsAndFinances.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getCosts, addCost, deleteCost } from './costsService';

export default function CostsAndFinances() {
    const [costs, setCosts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    
    const initialFormState = { name: '', amount: '', payment_date: new Date().toISOString().split('T')[0], notes: '', type: 'Variable' };
    const [newCost, setNewCost] = useState(initialFormState);

    const fetchCosts = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await getCosts();
            setCosts(data);
        } catch (err) {
            setError('Error al cargar los costos.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCosts();
    }, [fetchCosts]);

    const handleChange = (e) => {
        setNewCost(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await addCost(newCost);
            setNewCost(initialFormState);
            fetchCosts();
        } catch (err) {
            setError(`Error al guardar: ${err.message}`);
        }
    };
    
    const handleDelete = async (type, id) => {
        if (window.confirm("¿Seguro que quieres eliminar este costo?")) {
            try {
                await deleteCost(type, id);
                fetchCosts();
            } catch (err) {
                setError(`Error al eliminar: ${err.message}`);
            }
        }
    };

    const formatDate = (dateString) => new Date(dateString).toLocaleDateString('es-AR');

    return (
        <div className="admin-panel-container">
            <nav className="admin-main-nav">
                {/* ... tus otros links de navegación ... */}
                <Link to="/admin/debts" className="admin-nav-button">Cuentas Corrientes</Link>
                <Link to="/admin/finances" className="admin-nav-button active">Costos y Finanzas</Link>
            </nav>

            <h2>Gestión de Costos</h2>
            {error && <p className="error-message global-error">{error}</p>}

            <div className="admin-section">
                <h3>Registrar Nuevo Costo</h3>
                <form onSubmit={handleSubmit} className="admin-form grid-form">
                    <input type="text" name="name" placeholder="Descripción del costo" value={newCost.name} onChange={handleChange} required />
                    <input type="number" name="amount" placeholder="Monto" value={newCost.amount} onChange={handleChange} step="0.01" required />
                    <input type="date" name="payment_date" value={newCost.payment_date} onChange={handleChange} required />
                    <select name="type" value={newCost.type} onChange={handleChange}>
                        <option value="Variable">Costo Variable</option>
                        <option value="Fijo">Costo Fijo</option>
                    </select>
                    <textarea name="notes" placeholder="Notas adicionales..." value={newCost.notes} onChange={handleChange} rows="2" className="full-span"></textarea>
                    <button type="submit" className="admin-button-primary full-span">Registrar Costo</button>
                </form>
            </div>

            <div className="admin-section">
                <h3>Historial de Costos</h3>
                <div className="table-wrapper">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Fecha</th>
                                <th>Descripción</th>
                                <th>Tipo</th>
                                <th>Monto</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {costs.map(cost => (
                                <tr key={`${cost.type}-${cost.id}`}>
                                    <td data-label="Fecha">{formatDate(cost.payment_date)}</td>
                                    <td data-label="Descripción">{cost.name}</td>
                                    <td data-label="Tipo">{cost.type}</td>
                                    <td data-label="Monto" style={{color: '#c0392b', fontWeight: 'bold'}}>${cost.amount.toLocaleString('es-AR')}</td>
                                    <td data-label="Acciones">
                                        <button onClick={() => handleDelete(cost.type, cost.id)} className="action-button delete">Eliminar</button>
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
