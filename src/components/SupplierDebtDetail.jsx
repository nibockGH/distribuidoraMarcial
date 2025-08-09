// src/components/SupplierDebtDetail.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSupplierById } from './supplierService';
import { getSupplierPurchases, getSupplierPayments, addSupplierPayment } from './supplierService';

export default function SupplierDebtDetail() {
  const { supplierId } = useParams();
  const navigate = useNavigate();

  const [supplier, setSupplier] = useState(null);
  const [payments, setPayments] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [newPayment, setNewPayment] = useState({ payment_amount: '', payment_date: new Date().toISOString().split('T')[0], payment_method: 'transferencia', notes: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    setIsLoading(true); setError('');
    try {
      const [supplierData, paymentsData, purchasesData] = await Promise.all([
        getSupplierById(supplierId),
        getSupplierPayments(supplierId),
        getSupplierPurchases(supplierId)
      ]);
      setSupplier(supplierData);
      setPayments(paymentsData);
      setPurchases(purchasesData);
    } catch (err) {
      setError(`Error al cargar datos: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [supplierId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePaymentChange = (e) => {
    setNewPayment(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleAddPayment = async (e) => {
    e.preventDefault();
    if (!newPayment.payment_amount || !newPayment.payment_date) {
      alert("El monto y la fecha son obligatorios."); return;
    }
    try {
      await addSupplierPayment(supplierId, { ...newPayment, payment_amount: parseFloat(newPayment.payment_amount) });
      setNewPayment({ payment_amount: '', payment_date: new Date().toISOString().split('T')[0], payment_method: 'transferencia', notes: '' });
      fetchData();
    } catch (err) {
      alert(`Error al registrar el pago: ${err.message}`);
    }
  };

  const totalPurchased = purchases.reduce((sum, purchase) => sum + purchase.total_amount, 0);
  const totalPaid = payments.reduce((sum, payment) => sum + payment.payment_amount, 0);
  const balance = totalPurchased - totalPaid;

  const formatDate = (dateString) => new Date(dateString).toLocaleDateString('es-AR');

  if (isLoading) return <p>Cargando cuenta corriente del proveedor...</p>;
  if (error) return <p className="error-message global-error">{error}</p>;

  return (
    <div className="detail-container">
      <button onClick={() => navigate('/admin/debts')} className="back-button">&larr; Volver a Cuentas Corrientes</button>
      <h2>Cuenta Corriente de Proveedor: {supplier?.name}</h2>

      <div className="summary-boxes">
        <div className="summary-box"><span>Total Comprado</span>${totalPurchased.toLocaleString('es-AR')}</div>
        <div className="summary-box green"><span>Total Pagado</span>${totalPaid.toLocaleString('es-AR')}</div>
        <div className="summary-box red"><span>Saldo a Pagar</span>${balance.toLocaleString('es-AR')}</div>
      </div>

      <div className="admin-section">
        <h3>Registrar Nuevo Pago al Proveedor</h3>
        <form onSubmit={handleAddPayment} className="admin-form grid-form">
          <input type="number" name="payment_amount" placeholder="Monto del pago" value={newPayment.payment_amount} onChange={handlePaymentChange} step="0.01" required />
          <input type="date" name="payment_date" value={newPayment.payment_date} onChange={handlePaymentChange} required />
          <select name="payment_method" value={newPayment.payment_method} onChange={handlePaymentChange}>
            <option value="transferencia">Transferencia</option>
            <option value="efectivo">Efectivo</option>
            <option value="cheque">Cheque</option>
          </select>
          <input type="text" name="notes" placeholder="Notas (ej: nro de factura)" value={newPayment.notes} onChange={handlePaymentChange} />
          <button type="submit" className="admin-button-primary">Registrar Pago</button>
        </form>
      </div>

      <div className="detail-columns">
        <div className="detail-section">
          <h3>Historial de Compras</h3>
          <div className="table-wrapper" style={{maxHeight: '300px', overflowY: 'auto'}}>
            <table className="admin-table simple-table">
              <thead><tr><th>Fecha</th><th>Factura/Ref</th><th>Monto</th></tr></thead>
              <tbody>
                {purchases.map(p => <tr key={`purchase-${p.id}`}><td>{formatDate(p.purchase_date)}</td><td>{p.invoice_number || 'N/A'}</td><td>${p.total_amount.toLocaleString('es-AR')}</td></tr>)}
              </tbody>
            </table>
          </div>
        </div>
        <div className="detail-section">
          <h3>Historial de Pagos</h3>
          <div className="table-wrapper" style={{maxHeight: '300px', overflowY: 'auto'}}>
            <table className="admin-table simple-table">
              <thead><tr><th>Fecha</th><th>Monto</th><th>Método</th><th>Notas</th></tr></thead>
              <tbody>
                {payments.map(p => <tr key={`payment-${p.id}`}><td>{formatDate(p.payment_date)}</td><td style={{color:'green'}}>${p.payment_amount.toLocaleString('es-AR')}</td><td>{p.payment_method}</td><td>{p.notes}</td></tr>)}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
