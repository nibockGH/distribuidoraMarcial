// src/components/SalespeopleManagement.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext'; // <-- 1. IMPORTAMOS useAuth
import { getSalespeople, addSalesperson, getSalesRecords, updateCommissionStatus, addSaleRecord } from './salespersonService';
import { searchProducts } from './productService'; 
import { getCustomers, getSpecialPrices } from './customerService';
import CustomerForm from './CustomerForm';
import AsyncSelect from 'react-select/async';


export default function SalespeopleManagement() {
    const { currentUser, isAdmin } = useAuth(); // <-- 2. OBTENEMOS EL USUARIO Y ROL

    const [salespeople, setSalespeople] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [specialPricesMap, setSpecialPricesMap] = useState(new Map());
    const [allSalesRecords, setAllSalesRecords] = useState([]);
    const [newSalespersonName, setNewSalespersonName] = useState('');
    
    const initialSaleDetails = {
        // Si el usuario es un vendedor, se autoselecciona. Si es admin, empieza vacío.
        salesperson_id: !isAdmin ? currentUser.salesperson_id : '',
        customer_id: '',
        notes: '',
        delivery_date: '',
        payment_method: 'efectivo',
        is_paid_to_cashbox: false
    };
    const [saleDetails, setSaleDetails] = useState(initialSaleDetails);

    // ... (el resto de tus estados se mantienen igual)
    const initialSaleItem = { productId: '', quantity: '1', price: 0, productOption: null, priceType: 'lista', priceOverrideReason: '' };
    const [saleItems, setSaleItems] = useState([initialSaleItem]);
    const [isLoading, setIsLoading] = useState(false);
    const [formError, setFormError] = useState('');
    const [formSuccess, setFormSuccess] = useState('');
    const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [salespersonForUser, setSalespersonForUser] = useState(null);
    const [newUser, setNewUser] = useState({ username: '', password: '' });

    const loadInitialData = useCallback(async () => {
        setIsLoading(true); setFormError('');
        try {
            const [spData, recordsData, customersData] = await Promise.all([
                getSalespeople(), getSalesRecords(), getCustomers()
            ]);
            
            setSalespeople(spData || []);
            setCustomers(customersData || []);

            // --- 3. FILTRAMOS LAS VENTAS SEGÚN EL ROL ---
            const allRecords = recordsData || [];
            if (isAdmin) {
                setAllSalesRecords(allRecords);
            } else {
                const mySales = allRecords.filter(r => r.salesperson_id === currentUser.salesperson_id);
                setAllSalesRecords(mySales);
            }
            // ---------------------------------------------

        } catch (err) { setFormError(`Error cargando datos: ${err.message}`);
        } finally { setIsLoading(false); }
    }, [isAdmin, currentUser.salesperson_id]); // Dependemos de estos valores

    useEffect(() => { loadInitialData(); }, [loadInitialData]);

    // ... (el resto de tus funciones no necesitan grandes cambios)
    useEffect(() => {
        const fetchPrices = async () => {
            if (!saleDetails.customer_id) { setSpecialPricesMap(new Map()); return; }
            try {
                const prices = await getSpecialPrices(saleDetails.customer_id);
                const priceMap = new Map(prices.map(p => [p.product_id, p.special_price]));
                setSpecialPricesMap(priceMap);
                setSaleItems(prev => prev.map(item => {
                    if (!item.productOption) return item;
                    const product = item.productOption.product;
                    const specialPrice = priceMap.get(product.id);
                    const newPrice = specialPrice !== undefined ? specialPrice : product.price;
                    const newPriceType = specialPrice !== undefined ? 'especial' : 'lista';
                    return { ...item, price: newPrice, priceType: newPriceType };
                }));
            } catch (error) {
                console.error("Error al cargar precios especiales:", error);
                setSpecialPricesMap(new Map());
            }
        };
        fetchPrices();
    }, [saleDetails.customer_id]);
    
    const handleSaleDetailChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (name === 'customer_id' && value === 'add_new_customer') {
            setIsCustomerModalOpen(true);
        } else {
            setSaleDetails(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
        }
    };
    const loadProductOptions = (inputValue, callback) => {
        setTimeout(async () => {
            if (inputValue.length < 2) return callback([]);
            const options = await searchProducts(inputValue);
            callback(options);
        }, 400);
    };
    const handleProductChange = (selectedOption, index) => {
        const updatedItems = [...saleItems];
        const currentItem = { ...updatedItems[index] };
        if (selectedOption) {
            const product = selectedOption.product;
            currentItem.productOption = selectedOption;
            currentItem.productId = product.id;
            const specialPrice = specialPricesMap.get(product.id);
            currentItem.price = specialPrice !== undefined ? specialPrice : product.price;
            currentItem.priceType = specialPrice !== undefined ? 'especial' : 'lista';
        } else {
            currentItem.productOption = null;
            currentItem.productId = '';
            currentItem.price = 0;
        }
        updatedItems[index] = currentItem;
        setSaleItems(updatedItems);
    };
    const handleSaleItemChange = (index, field, value) => {
        const updatedItems = [...saleItems];
        let currentItem = { ...updatedItems[index] };
        if (field === 'quantity') value = value.replace(',', '.');
        currentItem[field] = value;
        if (field === 'priceType' && value === 'lista' && currentItem.productOption) {
            currentItem.price = currentItem.productOption.product.price;
        }
        updatedItems[index] = currentItem;
        setSaleItems(updatedItems);
    };
    const addSaleItemRow = () => setSaleItems([...saleItems, { ...initialSaleItem }]);
    const removeSaleItemRow = (index) => { if (saleItems.length > 1) setSaleItems(saleItems.filter((_, i) => i !== index)); };
    const handleCustomerCreated = (newCustomer) => {
        setIsCustomerModalOpen(false);
        loadInitialData().then(() => {
            setSaleDetails(prev => ({ ...prev, customer_id: newCustomer.id }));
        });
    };
    const handleAddSaleRecord = async (e) => {
        e.preventDefault();
        if (!saleDetails.salesperson_id || !saleDetails.customer_id) { setFormError('Vendedor y cliente son obligatorios.'); return; }
        const validItems = saleItems.filter(item => item.productId && parseFloat(String(item.quantity).replace(',', '.')) > 0 && parseFloat(item.price) >= 0)
                                     .map(item => ({ ...item, quantity: parseFloat(String(item.quantity).replace(',', '.')) }));
        if (validItems.length === 0) { setFormError('Debes añadir al menos un producto válido.'); return; }
        setIsLoading(true); setFormError(''); setFormSuccess('');
        try {
            const payload = { ...saleDetails, items: validItems };
            await addSaleRecord(payload);
            setFormSuccess('Venta registrada y stock actualizado.');
            setSaleDetails(initialSaleDetails);
            setSaleItems([initialSaleItem]);
            loadInitialData();
            setTimeout(() => setFormSuccess(''), 4000);
        } catch (err) {
            setFormError(`Error registrando venta: ${err.response?.data?.message || err.message}`);
        } finally {
            setIsLoading(false);
        }
    };
    const handleAddSalesperson = async (e) => {
        e.preventDefault();
        if (!newSalespersonName.trim()) { setFormError('El nombre del vendedor es obligatorio.'); return; }
        setIsLoading(true); setFormError(''); setFormSuccess('');
        try {
            const newSalesperson = await addSalesperson({ name: newSalespersonName.trim() });
            setNewSalespersonName('');
            setFormSuccess(`Vendedor '${newSalesperson.name}' añadido. Ahora, crea su usuario.`);
            loadInitialData();
            setSalespersonForUser(newSalesperson);
            setIsUserModalOpen(true);
        } catch (err) {
            setFormError(`Error añadiendo vendedor: ${err.response?.data?.message || err.message}`);
        } finally {
            setIsLoading(false);
        }
    };
    const handleNewUserChange = (e) => {
        setNewUser(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };
    const handleCreateUserSubmit = async (e) => {
        e.preventDefault();
        setFormError(''); setFormSuccess('');
        if (!salespersonForUser) return;
        try {
            const response = await fetch(`http://localhost:4000/api/salespeople/${salespersonForUser.id}/create-user`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newUser),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message);
            setFormSuccess(data.message);
            setIsUserModalOpen(false);
            setNewUser({ username: '', password: '' });
        } catch (err) {
            setFormError(err.message);
        }
    };
    const handleCommissionStatusUpdate = async (recordId, newStatus) => {
        if (!window.confirm(`¿Seguro que quieres cambiar el estado de la comisión a "${newStatus}"?`)) return;
        try {
            await updateCommissionStatus(recordId, newStatus);
            loadInitialData();
        } catch (err) {
            setFormError(`Error al actualizar estado de comisión: ${err.message}`);
        }
    };
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('es-AR', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit'});
    };

    return (
    <div className="admin-section">
        {/* --- 4. LA SECCIÓN PARA AÑADIR VENDEDORES SOLO LA VE EL ADMIN --- */}
        {isAdmin && (
             <div className="admin-section">
                <h3>Añadir Nuevo Vendedor</h3>
                <form onSubmit={handleAddSalesperson} className="admin-form inline-form">
                    <input type="text" name="newSalespersonName" placeholder="Nombre del Vendedor" value={newSalespersonName}
                        onChange={(e) => setNewSalespersonName(e.target.value)} />
                    <button type="submit" disabled={isLoading} className="admin-button-primary">Añadir</button>
                </form>
            </div>
        )}
        {/* ------------------------------------------------------------- */}


        <div className="admin-section">
            <h3>Registrar Nueva Venta</h3>
            <form onSubmit={handleAddSaleRecord} className="admin-form">
                <div className="sale-details-grid">
                    {/* El selector de vendedor se deshabilita si no es admin */}
                    <select name="salesperson_id" value={saleDetails.salesperson_id} onChange={handleSaleDetailChange} required disabled={!isAdmin}>
                        <option value="">-- Seleccionar Vendedor --</option>
                        {salespeople.map(sp => <option key={sp.id} value={sp.id}>{sp.name}</option>)}
                    </select>
                    <select name="customer_id" value={saleDetails.customer_id} onChange={handleSaleDetailChange} required>
                        <option value="">-- Seleccionar Cliente --</option>
                        {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        <option value="add_new_customer" style={{color: 'blue', fontWeight: 'bold'}}>+ Crear Nuevo Cliente...</option>
                    </select>
                    {/* ... resto del formulario de venta ... */}
                     <div>
                        <label>Fecha de Entrega</label>
                        <input type="date" name="delivery_date" value={saleDetails.delivery_date} onChange={handleSaleDetailChange} />
                    </div>
                    <select name="payment_method" value={saleDetails.payment_method} onChange={handleSaleDetailChange}>
                        <option value="efectivo">Efectivo</option>
                        <option value="transferencia">Transferencia</option>
                        <option value="cta_cte">Cta. Cte.</option>
                        <option value="mercadopago">Mercado Pago</option>
                    </select>
                    <div className="checkbox-field">
                        <input type="checkbox" id="is_paid_to_cashbox" name="is_paid_to_cashbox" checked={saleDetails.is_paid_to_cashbox} onChange={handleSaleDetailChange} />
                        <label htmlFor="is_paid_to_cashbox">Pago a Caja</label>
                    </div>
                </div>
                <h4>Ítems de la Venta</h4>
                <div className="sale-items-container">
                    {saleItems.map((item, index) => (
                        <div key={index} className="sale-item-full-row">
                            <AsyncSelect
                                className="product-search-select" classNamePrefix="react-select" cacheOptions defaultOptions
                                loadOptions={loadProductOptions} placeholder="Escribe para buscar un producto..."
                                onChange={(option) => handleProductChange(option, index)} value={item.productOption} isClearable
                            />
                            <input type="text" placeholder="Cant." value={item.quantity} onChange={(e) => handleSaleItemChange(index, 'quantity', e.target.value)} required className="quantity-input"/>
                            <div className="price-type-selector">
                                <label><input type="radio" value="lista" name={`priceType-${index}`} checked={item.priceType === 'lista'} onChange={(e) => handleSaleItemChange(index, 'priceType', e.target.value)} /> Lista</label>
                                <label><input type="radio" value="especial" name={`priceType-${index}`} checked={item.priceType === 'especial'} onChange={(e) => handleSaleItemChange(index, 'priceType', e.target.value)} disabled={!specialPricesMap.has(parseInt(item.productId))}/> Especial</label>
                                <label><input type="radio" value="personalizado" name={`priceType-${index}`} checked={item.priceType === 'personalizado'} onChange={(e) => handleSaleItemChange(index, 'priceType', e.target.value)} /> Personalizado</label>
                            </div>
                            <input type="number" value={item.price || 0} readOnly={item.priceType !== 'personalizado'} onChange={(e) => handleSaleItemChange(index, 'price', e.target.value)} step="0.01" className="price-input" required />
                            {item.priceType === 'personalizado' && (
                                <input type="text" placeholder="Motivo del precio personalizado" value={item.priceOverrideReason} onChange={(e) => handleSaleItemChange(index, 'priceOverrideReason', e.target.value)} className="reason-input"/>
                            )}
                            <button type="button" onClick={() => removeSaleItemRow(index)} className="remove-item-button" disabled={saleItems.length <= 1}>×</button>
                        </div>
                    ))}
                </div>
                <button type="button" onClick={addSaleItemRow} className="add-item-button">+ Añadir Producto</button>
                <textarea name="notes" placeholder="Notas Adicionales de la Venta" value={saleDetails.notes} onChange={handleSaleDetailChange} rows="2"></textarea>
                <button type="submit" disabled={isLoading} className="admin-button-primary submit-sale-button">{isLoading ? 'Registrando...' : 'Registrar Venta'}</button>
            </form>
        </div>
        
        <div className="admin-section">
            <h3>Historial de Ventas</h3>
            <table className="admin-table sales-records-table">
                <thead>
                    <tr>
                        <th>Fecha</th>
                        <th>Vendedor</th>
                        <th>Cliente</th>
                        <th>Monto</th>
                        <th>Comisión</th>
                        <th>Estado Comisión</th>
                        {/* El admin ve las acciones de comisión */}
                        {isAdmin && <th>Acciones</th>}
                    </tr>
                </thead>
                <tbody>
                    {allSalesRecords.map(record => (
                        <tr key={record.id}>
                            <td data-label="Fecha">{formatDate(record.sale_date)}</td>
                            <td data-label="Vendedor">{record.salesperson_name}</td>
                            <td data-label="Cliente">{record.customer_name || 'N/A'}</td>
                            <td data-label="Monto">${(record.sale_amount || 0).toLocaleString('es-AR')}</td>
                            <td data-label="Comisión">${(record.commission_amount || 0).toLocaleString('es-AR')}</td>
                            <td data-label="Estado Comisión">
                                <span className={`commission-status-badge status-${record.commission_paid_status}`}>{record.commission_paid_status}</span>
                            </td>
                            {isAdmin && (
                                <td data-label="Acciones">
                                    {record.commission_paid_status === 'pendiente' && (
                                        <button onClick={() => handleCommissionStatusUpdate(record.id, 'pagada')} className="action-button view">Marcar Pagada</button>
                                    )}
                                </td>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
         {/* Los modales se mantienen igual */}
         {isCustomerModalOpen && ( <div className="modal-overlay"> <div className="modal-content"> <CustomerForm isModal={true} onCustomerCreated={handleCustomerCreated} onCancel={() => setIsCustomerModalOpen(false)} /> </div> </div> )}
         {isUserModalOpen && ( <div className="modal-overlay"> <div className="modal-content"> <h3>Crear Usuario para "{salespersonForUser?.name}"</h3> <form onSubmit={handleCreateUserSubmit}> <div className="input-group"> <label htmlFor="username">Nombre de Usuario</label> <input id="username" name="username" type="text" value={newUser.username} onChange={handleNewUserChange} required /> </div> <div className="input-group"> <label htmlFor="password">Contraseña</label> <input id="password" name="password" type="password" value={newUser.password} onChange={handleNewUserChange} required /> </div> {formError && <p className="error-message">{formError}</p>} <div className="modal-actions"> <button type="submit" className="action-button">Crear Usuario</button> <button type="button" className="action-button secondary" onClick={() => setIsUserModalOpen(false)}>Cancelar</button> </div> </form> </div> </div> )}
    </div>
    );
}