import React, { useState, useEffect, useCallback } from 'react';
import { getSalespeople, addSalesperson, getSalesRecords, addSaleRecord } from './salespersonService';
import { getProducts } from './productService';
import { Link } from 'react-router-dom';

export default function SalespeopleManagement() {
  const [salespeople, setSalespeople] = useState([]);
  const [products, setProducts] = useState([]);
  const [allSalesRecords, setAllSalesRecords] = useState([]);
  const [filteredSalesRecords, setFilteredSalesRecords] = useState([]);
  
  const [newSalespersonName, setNewSalespersonName] = useState('');
  
  // Estado para el formulario de nueva venta
  const [saleDetails, setSaleDetails] = useState({
    salesperson_id: '',
    customer_name_manual: '',
    notes: ''
  });
  const [saleItems, setSaleItems] = useState([{ productId: '', quantity: 1 }]);

  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const [viewConfig, setViewConfig] = useState({
    selectedSalespersonIdForView: '',
    showSalespersonIdForCommission: '',
  });

  const COMMISSION_RATE = 0.05;

  const loadInitialData = useCallback(async () => {
    setIsLoading(true); setFormError('');
    try {
      const [spData, recordsData, productsData] = await Promise.all([
        getSalespeople(),
        getSalesRecords(),
        getProducts()
      ]);
      setSalespeople(Array.isArray(spData) ? spData : []);
      setAllSalesRecords(Array.isArray(recordsData) ? recordsData : []);
      setFilteredSalesRecords(Array.isArray(recordsData) ? recordsData : []);
      setProducts(Array.isArray(productsData) ? productsData : []);
    } catch (err) {
      setFormError(`Error cargando datos: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  useEffect(() => {
    if (viewConfig.selectedSalespersonIdForView) {
      setFilteredSalesRecords(
        allSalesRecords.filter(r => String(r.salesperson_id) === String(viewConfig.selectedSalespersonIdForView))
      );
    } else {
      setFilteredSalesRecords(allSalesRecords);
    }
  }, [viewConfig.selectedSalespersonIdForView, allSalesRecords]);

  const handleSaleDetailChange = (e) => {
    setSaleDetails(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSaleItemChange = (index, field, value) => {
    const updatedItems = [...saleItems];
    updatedItems[index][field] = value;
    setSaleItems(updatedItems);
  };

  const addSaleItemRow = () => {
    setSaleItems([...saleItems, { productId: '', quantity: 1 }]);
  };

  const removeSaleItemRow = (index) => {
    if (saleItems.length > 1) {
      setSaleItems(saleItems.filter((_, i) => i !== index));
    }
  };

  const handleAddSaleRecord = async (e) => {
    e.preventDefault();
    if (!saleDetails.salesperson_id || !saleDetails.customer_name_manual.trim()) {
      setFormError('Vendedor y nombre de cliente son obligatorios.'); return;
    }
    const validItems = saleItems.filter(item => item.productId && item.quantity > 0)
                                .map(item => ({ ...item, quantity: Number(item.quantity) }));

    if (validItems.length === 0) {
      setFormError('Debes añadir al menos un producto con cantidad válida a la venta.'); return;
    }
    
    setIsLoading(true); setFormError(''); setFormSuccess('');
    try {
      const payload = { ...saleDetails, items: validItems };
      await addSaleRecord(payload);
      
      setFormSuccess('Venta registrada y stock actualizado.');
      setSaleDetails({ salesperson_id: '', customer_name_manual: '', notes: '' });
      setSaleItems([{ productId: '', quantity: 1 }]);
      loadInitialData();
      setTimeout(() => setFormSuccess(''), 4000);
    } catch (err) {
      setFormError(`Error registrando venta: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleAddSalesperson = async (e) => {
    e.preventDefault();
    if (!newSalespersonName.trim()) { setFormError('El nombre del vendedor es obligatorio.'); return; }
    setIsLoading(true); setFormError(''); setFormSuccess('');
    try {
      await addSalesperson({ name: newSalespersonName.trim() });
      setNewSalespersonName('');
      setFormSuccess('Vendedor añadido.');
      loadInitialData();
      setTimeout(() => setFormSuccess(''), 3000);
    } catch (err) {
      setFormError(`Error añadiendo vendedor: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleViewConfigChange = (e) => {
    setViewConfig(prev => ({...prev, [e.target.name]: e.target.value}));
  };

  const calculateTotalCommissionForSalesperson = (salespersonId) => {
    if (!salespersonId) return 0;
    return allSalesRecords
      .filter(record => String(record.salesperson_id) === String(salespersonId))
      .reduce((total, record) => total + record.commission_amount, 0);
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-AR', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit'});
  };

  return (
    <div className="admin-panel-container salespeople-management-container">
      <nav className="admin-main-nav">
        <Link to="/admin" className="admin-nav-button">Gestionar Productos</Link>
        <Link to="/admin/stock" className="admin-nav-button">Gestionar Stock</Link>
        <Link to="/admin/salespeople" className="admin-nav-button active">Gestionar Vendedores</Link>
        { <Link to="/admin/customers" className="admin-nav-button">Gestionar Clientes</Link> }
        { <Link to="/admin/orders" className="admin-nav-button">Gestionar Pedidos</Link> }
      </nav>

      <h2>Gestión de Vendedores y Comisiones</h2>
      {formError && <p className="error-message global-error">{formError}</p>}
      {formSuccess && <p className="success-message global-success">{formSuccess}</p>}
      
      <div className="admin-section">
        <h3>Añadir Nuevo Vendedor</h3>
        <form onSubmit={handleAddSalesperson} className="admin-form inline-form">
          <input type="text" name="newSalespersonName" placeholder="Nombre del Vendedor" value={newSalespersonName}
            onChange={(e) => setNewSalespersonName(e.target.value)} />
          <button type="submit" disabled={isLoading} className="admin-button-primary">Añadir</button>
        </form>
      </div>

      <div className="admin-section">
        <h3>Registrar Nueva Venta (con Descuento de Stock)</h3>
        <form onSubmit={handleAddSaleRecord} className="admin-form">
          <div className="sale-details-grid">
            <select name="salesperson_id" value={saleDetails.salesperson_id} onChange={handleSaleDetailChange} required>
              <option value="">-- Seleccionar Vendedor --</option>
              {salespeople.map(sp => <option key={sp.id} value={sp.id}>{sp.name}</option>)}
            </select>
            <input type="text" name="customer_name_manual" placeholder="Nombre Cliente" value={saleDetails.customer_name_manual} onChange={handleSaleDetailChange} required/>
          </div>

          <h4>Ítems de la Venta</h4>
          <div className="sale-items-container">
            {saleItems.map((item, index) => (
              <div key={index} className="sale-item-row">
                <select name="productId" value={item.productId} onChange={(e) => handleSaleItemChange(index, 'productId', e.target.value)} required>
                  <option value="">-- Seleccionar Producto --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id} disabled={p.stock <= 0}>
                      {p.nombre} (Stock: {p.stock})
                    </option>
                  ))}
                </select>
                <input type="number" name="quantity" placeholder="Cant." value={item.quantity}
                  onChange={(e) => handleSaleItemChange(index, 'quantity', parseInt(e.target.value, 10) || 1)}
                  min="1" className="quantity-input" required />
                <button type="button" onClick={() => removeSaleItemRow(index)} className="remove-item-button" disabled={saleItems.length <= 1}>×</button>
              </div>
            ))}
          </div>
          <button type="button" onClick={addSaleItemRow} className="add-item-button">+ Añadir Producto</button>

          <textarea name="notes" placeholder="Notas Adicionales (Opcional)" value={saleDetails.notes} onChange={handleSaleDetailChange} rows="2"></textarea>
          <button type="submit" disabled={isLoading} className="admin-button-primary submit-sale-button">
            {isLoading ? 'Registrando...' : 'Registrar Venta'}
          </button>
        </form>
      </div>

      <div className="admin-section">
        <h3>Comisiones por Vendedor</h3>
        <div className="filter-group">
            <label htmlFor="salespersonForCommission">Ver comisión de:</label>
            <select name="showSalespersonIdForCommission" id="salespersonForCommission" value={viewConfig.showSalespersonIdForCommission} onChange={handleViewConfigChange}>
                <option value="">-- Seleccionar Vendedor --</option>
                {salespeople.map(sp => <option key={sp.id} value={sp.id}>{sp.name}</option>)}
            </select>
        </div>
        {viewConfig.showSalespersonIdForCommission && (
            <div className="commission-display">
                Total Comisiones para {salespeople.find(s=>String(s.id) === String(viewConfig.showSalespersonIdForCommission))?.name}: 
                <strong> ${calculateTotalCommissionForSalesperson(viewConfig.showSalespersonIdForCommission).toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</strong>
            </div>
        )}
      </div>

      <div className="admin-section">
        <h3>Historial de Ventas Registradas</h3>
        <div className="filter-group">
          <label htmlFor="salespersonFilterView">Filtrar Ventas por Vendedor:</label>
          <select name="selectedSalespersonIdForView" id="salespersonFilterView" value={viewConfig.selectedSalespersonIdForView} onChange={handleViewConfigChange}>
            <option value="">-- Mostrar Todos --</option>
            {salespeople.map(sp => <option key={sp.id} value={sp.id}>{sp.name}</option>)}
          </select>
        </div>
        {filteredSalesRecords.length === 0 && !isLoading ? <p>No hay ventas registradas para el filtro seleccionado.</p> : (
          <table className="admin-table sales-records-table">
            <thead>
              <tr>
                <th>Fecha</th>
                {!viewConfig.selectedSalespersonIdForView && <th>Vendedor</th>}
                <th>Cliente</th>
                <th>Monto Total</th>
                <th>Comisión</th>
              </tr>
            </thead>
            <tbody>
              {filteredSalesRecords.map(record => (
                <tr key={record.id}>
                  <td data-label="Fecha">{formatDate(record.sale_date)}</td>
                  {!viewConfig.selectedSalespersonIdForView && <td data-label="Vendedor">{record.salesperson_name}</td>}
                  <td data-label="Cliente">{record.customer_display_name}</td>
                  <td data-label="Monto Total">${record.sale_amount.toLocaleString('es-AR')}</td>
                  <td data-label="Comisión">${record.commission_amount.toLocaleString('es-AR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}