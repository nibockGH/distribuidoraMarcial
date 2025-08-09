// src/components/DebtDetail.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCustomerById } from './customerService';
import { getCustomerDetails, addPayment } from './customerService.js';
import { getSalesRecords } from './salespersonService';

export default function DebtDetail() {
  const { customerId } = useParams();
  const navigate = useNavigate();

  const [customer, setCustomer] = useState(null);
  const [payments, setPayments] = useState([]);
  const [sales, setSales] = useState([]);
  
  const [newPayment, setNewPayment] = useState({ payment_amount: '', payment_date: new Date().toISOString().split('T')[0], payment_method: 'efectivo', notes: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    setIsLoading(true); setError('');
    try {
      const [customerData, paymentsData, allSalesData] = await Promise.all([
        getCustomerById(customerId),
        getCustomerPayments(customerId),
        getSalesRecords()
      ]);
      setCustomer(customerData);
      setPayments(paymentsData);
      // Filtra solo las ventas en cta_cte para este cliente
      setSales(allSalesData.filter(s => s.customer_id === parseInt(customerId) && s.payment_method === 'cta_cte'));
    } catch (err) {
      setError(`Error al cargar datos: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [customerId]);

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
      await addPayment(customerId, { ...newPayment, payment_amount: parseFloat(newPayment.payment_amount) });
      setNewPayment({ payment_amount: '', payment_date: new Date().toISOString().split('T')[0], payment_method: 'efectivo', notes: '' });
      fetchData(); // Recargar todo
    } catch (err) {
      alert(`Error al registrar el pago: ${err.message}`);
    }
  };

  const totalSold = sales.reduce((sum, sale) => sum + sale.sale_amount, 0);
  const totalPaid = payments.reduce((sum, payment) => sum + payment.payment_amount, 0);
  const balance = totalSold - totalPaid;

  const formatDate = (dateString) => new Date(dateString).toLocaleDateString('es-AR');

  if (isLoading) return <p>Cargando cuenta corriente...</p>;
  if (error) return <p className="error-message global-error">{error}</p>;

  return (
    <div className="detail-container">
      <button onClick={() => navigate('/admin/debts')} className="back-button">&larr; Volver a Cuentas Corrientes</button>
      <h2>Cuenta Corriente de: {customer?.name}</h2>

      <div className="summary-boxes">
        <div className="summary-box"><span>Total Comprado (Cta. Cte.)</span>${totalSold.toLocaleString('es-AR')}</div>
        <div className="summary-box green"><span>Total Pagado</span>${totalPaid.toLocaleString('es-AR')}</div>
        <div className="summary-box red"><span>Saldo Pendiente</span>${balance.toLocaleString('es-AR')}</div>
      </div>

      <div className="admin-section">
        <h3>Registrar Nuevo Pago</h3>
        <form onSubmit={handleAddPayment} className="admin-form grid-form">
          <input type="number" name="payment_amount" placeholder="Monto del pago" value={newPayment.payment_amount} onChange={handlePaymentChange} step="0.01" required />
          <input type="date" name="payment_date" value={newPayment.payment_date} onChange={handlePaymentChange} required />
          <select name="payment_method" value={newPayment.payment_method} onChange={handlePaymentChange}>
            <option value="efectivo">Efectivo</option>
            <option value="transferencia">Transferencia</option>
            <option value="mercadopago">Mercado Pago</option>
          </select>
          <input type="text" name="notes" placeholder="Notas (ej: nro de transferencia)" value={newPayment.notes} onChange={handlePaymentChange} />
          <button type="submit" className="admin-button-primary">Registrar Pago</button>
        </form>
      </div>

      <div className="detail-columns">
        <div className="detail-section">
          <h3>Historial de Ventas (Cta. Cte.)</h3>
          <div className="table-wrapper" style={{maxHeight: '300px', overflowY: 'auto'}}>
            <table className="admin-table simple-table">
              <thead><tr><th>Fecha</th><th>Monto</th></tr></thead>
              <tbody>
                {sales.map(sale => <tr key={`sale-${sale.id}`}><td>{formatDate(sale.sale_date)}</td><td>${sale.sale_amount.toLocaleString('es-AR')}</td></tr>)}
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

