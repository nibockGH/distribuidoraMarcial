import React, { useState, useEffect, useCallback } from 'react';
import { getPendingOrders, getRoutes, createRoute, getRoutePdf } from './logisticsService';
import { getVehicles } from './fleetService';
import { FaTruck, FaPlus, FaListAlt } from 'react-icons/fa';

const Logistics = () => {
    const [pendingOrders, setPendingOrders] = useState([]);
    const [createdRoutes, setCreatedRoutes] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    
    const [newRoute, setNewRoute] = useState({
        route_date: new Date().toISOString().split('T')[0],
        vehicle_id: '',
        driver_name: '',
        order_ids: []
    });

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [pendingData, routesData, vehiclesData] = await Promise.all([
                getPendingOrders(),
                getRoutes(),
                getVehicles()
            ]);
            setPendingOrders(pendingData);
            setCreatedRoutes(routesData);
            setVehicles(vehiclesData);
        } catch (err) {
            setError("Error al cargar los datos de logística.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleSelectOrder = (orderId) => {
        setNewRoute(prev => {
            const newOrderIds = prev.order_ids.includes(orderId)
                ? prev.order_ids.filter(id => id !== orderId)
                : [...prev.order_ids, orderId];
            return { ...prev, order_ids: newOrderIds };
        });
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewRoute(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmitRoute = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        if (newRoute.order_ids.length === 0) {
            setError("Debes seleccionar al menos un pedido para la ruta.");
            return;
        }
        setIsLoading(true);
        try {
            await createRoute(newRoute);
            setSuccess("Hoja de ruta creada exitosamente.");
            setNewRoute({
                route_date: new Date().toISOString().split('T')[0],
                vehicle_id: '',
                driver_name: '',
                order_ids: []
            });
            loadData();
        } catch (err) {
            setError(err.response?.data?.message || "Error al crear la hoja de ruta.");
        } finally {
            setIsLoading(false);
        }
    };

    // --- ¡NUEVA FUNCIÓN PARA DESCARGAR EL PDF! ---
    const handleDownloadPdf = async (routeId) => {
        try {
            await getRoutePdf(routeId);
        } catch (err) {
            setError("No se pudo generar el PDF de la ruta. Revisa la consola para más detalles.");
            console.error(err);
        }
    };

    return (
        <div className="admin-section">
            <h2>Logística y Hojas de Ruta</h2>
            
            {error && <p className="error-message global-error">{error}</p>}
            {success && <p className="success-message global-success">{success}</p>}

            <div className="logistics-container">
                <div className="pending-orders-column">
                    <h3><FaListAlt /> Pedidos Pendientes de Entrega</h3>
                    <div className="order-list">
                        {isLoading && <p>Cargando pedidos...</p>}
                        {pendingOrders.length > 0 ? pendingOrders.map(order => (
                            <div key={order.id} className="order-card">
                                <label>
                                    <input 
                                        type="checkbox"
                                        checked={newRoute.order_ids.includes(order.id)}
                                        onChange={() => handleSelectOrder(order.id)}
                                    />
                                    <div className="order-card-info">
                                        <strong>{order.customer_name}</strong>
                                        <span>{order.address}, {order.localidad}</span>
                                        <small>Pedido #{order.id} - ${order.sale_amount.toLocaleString('es-AR')}</small>
                                    </div>
                                </label>
                            </div>
                        )) : !isLoading && <p>No hay pedidos pendientes.</p>}
                    </div>
                </div>

                <div className="create-route-column">
                    <h3><FaPlus /> Crear Nueva Hoja de Ruta</h3>
                    <form onSubmit={handleSubmitRoute} className="admin-form">
                        <input type="date" name="route_date" value={newRoute.route_date} onChange={handleInputChange} required />
                        <select name="vehicle_id" value={newRoute.vehicle_id} onChange={handleInputChange} required>
                            <option value="">-- Seleccionar Vehículo --</option>
                            {vehicles.map(v => <option key={v.id} value={v.id}>{v.name} ({v.plate})</option>)}
                        </select>
                        <input type="text" name="driver_name" placeholder="Nombre del Conductor" value={newRoute.driver_name} onChange={handleInputChange} />
                        
                        <div className="selected-orders-summary">
                            <strong>{newRoute.order_ids.length}</strong> pedidos seleccionados
                        </div>

                        <button type="submit" className="admin-button-primary submit-sale-button" disabled={isLoading}>
                            {isLoading ? 'Creando...' : 'Crear Hoja de Ruta'}
                        </button>
                    </form>
                </div>
            </div>

            <div className="admin-section" style={{marginTop: '30px'}}>
                <h3><FaTruck /> Hojas de Ruta Creadas</h3>
                <div className="table-wrapper">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Fecha</th>
                                <th>Vehículo</th>
                                <th>Conductor</th>
                                <th>N° Pedidos</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {createdRoutes.map(route => (
                                <tr key={route.id}>
                                    <td>{new Date(route.route_date).toLocaleDateString('es-AR')}</td>
                                    <td>{route.vehicle_name} ({route.vehicle_plate})</td>
                                    <td>{route.driver_name || 'N/A'}</td>
                                    <td>{route.order_count}</td>
                                    <td><span className="status-badge status-procesando">{route.status}</span></td>
                                    <td data-label="Acciones">
                                        {/* --- ¡BOTÓN CONECTADO! --- */}
                                        <button 
                                            onClick={() => handleDownloadPdf(route.id)} 
                                            className="action-button view"
                                        >
                                            Ver PDF
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Logistics;
