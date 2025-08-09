// src/components/PurchaseForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSuppliers } from './supplierService';
import { getProducts } from './productService';
// --- CORRECCIÓN AQUÍ: Se importa 'addPurchase' en lugar de 'createPurchase' ---
import { addPurchase } from './purchaseService';

export default function PurchaseForm() {
    const navigate = useNavigate();
    const [suppliers, setSuppliers] = useState([]);
    const [products, setProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [purchase, setPurchase] = useState({
        supplier_id: '',
        purchase_date: new Date().toISOString().split('T')[0],
        invoice_number: '',
        notes: ''
    });

    const [items, setItems] = useState([{ product_id: '', quantity: 1, cost_price: '' }]);

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                const [suppliersData, productsData] = await Promise.all([
                    getSuppliers(),
                    getProducts()
                ]);
                setSuppliers(suppliersData);
                setProducts(productsData);
            } catch (err) {
                setError('Error al cargar datos necesarios.');
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, []);

    const handleHeaderChange = (e) => {
        setPurchase(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleItemChange = (index, e) => {
        const { name, value } = e.target;
        const newItems = [...items];
        newItems[index][name] = value;
        setItems(newItems);
    };

    const addItemRow = () => {
        setItems([...items, { product_id: '', quantity: 1, cost_price: '' }]);
    };

    const removeItemRow = (index) => {
        if (items.length > 1) {
            setItems(items.filter((_, i) => i !== index));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!purchase.supplier_id) {
            setError('Por favor, selecciona un proveedor.');
            return;
        }
        const validItems = items.filter(item => item.product_id && item.quantity > 0 && item.cost_price > 0);
        if (validItems.length === 0) {
            setError('Debes añadir al menos un producto con cantidad y costo válidos.');
            return;
        }

        setIsLoading(true);
        try {
            const purchaseData = { ...purchase, items: validItems };
            // --- CORRECCIÓN AQUÍ: Se llama a 'addPurchase' ---
            await addPurchase(purchaseData);
            setSuccess('¡Compra registrada y stock actualizado exitosamente!');
            setTimeout(() => {
                navigate('/admin/suppliers');
            }, 2000);
        } catch (err) {
            setError(`Error al registrar la compra: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="admin-form-container" style={{maxWidth: '900px', margin: '2rem auto'}}>
            <h2 style={{textAlign: 'center', marginBottom: '2rem'}}>Registrar Compra a Proveedor</h2>
            {error && <p className="error-message global-error">{error}</p>}
            {success && <p className="success-message global-success">{success}</p>}

            <form onSubmit={handleSubmit} className="admin-form">
                <div style={{ marginBottom: '2rem' }}>
                    <h3 style={{ borderBottom: '1px solid #ccc', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Datos de la Compra</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                        <div>
                            <label>Proveedor</label>
                            <select name="supplier_id" value={purchase.supplier_id} onChange={handleHeaderChange} required>
                                <option value="">-- Selecciona un proveedor --</option>
                                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label>Fecha de Compra</label>
                            <input type="date" name="purchase_date" value={purchase.purchase_date} onChange={handleHeaderChange} required />
                        </div>
                        <div>
                            <label>N° Factura/Remito (Opcional)</label>
                            <input type="text" name="invoice_number" value={purchase.invoice_number} onChange={handleHeaderChange} />
                        </div>
                    </div>
                </div>

                <div>
                    <h3 style={{ borderBottom: '1px solid #ccc', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Ítems de la Compra</h3>
                    {items.map((item, index) => (
                        <div key={index} style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 1fr 40px', gap: '10px', marginBottom: '10px', alignItems: 'center' }}>
                            <select name="product_id" value={item.product_id} onChange={(e) => handleItemChange(index, e)} required>
                                <option value="">-- Selecciona un producto --</option>
                                {products.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                            </select>
                            <input type="number" name="quantity" placeholder="Cantidad" value={item.quantity} onChange={(e) => handleItemChange(index, e)} min="1" required />
                            <input type="number" name="cost_price" placeholder="Costo" value={item.cost_price} onChange={(e) => handleItemChange(index, e)} step="0.01" min="0" required />
                            <button type="button" onClick={() => removeItemRow(index)} className="remove-item-button" disabled={items.length <= 1}>×</button>
                        </div>
                    ))}
                    <button type="button" onClick={addItemRow} className="add-item-button" style={{marginRight: '1rem'}}>+ Añadir Ítem</button>
                </div>

                <div style={{marginTop: '2rem'}}>
                    <label>Notas Adicionales</label>
                    <textarea name="notes" value={purchase.notes} onChange={handleHeaderChange} rows="3"></textarea>
                </div>

                <div className="form-actions" style={{marginTop: '2rem', borderTop: '1px solid #ccc', paddingTop: '1.5rem'}}>
                    <button type="submit" disabled={isLoading} className="admin-button-primary">
                        {isLoading ? 'Registrando...' : 'Guardar Compra'}
                    </button>
                    <button type="button" onClick={() => navigate(-1)} className="admin-button-secondary">
                        Cancelar
                    </button>
                </div>
            </form>
        </div>
    );
}
