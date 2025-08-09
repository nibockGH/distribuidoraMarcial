// src/components/CustomerDebtList.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllDebts } from './debtService';

export default function CustomerDebtList() {
  const [debts, setDebts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDebts = async () => {
      try {
        const data = await getAllDebts();
        setDebts(data);
      } catch (err) {
        setError('Error al cargar las cuentas corrientes.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDebts();
  }, []);

  if (isLoading) {
    return <p>Cargando cuentas de clientes...</p>;
  }

  if (error) {
    return <p className="error-message global-error">{error}</p>;
  }

  return (
    <div className="table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Total Comprado (Cta. Cte.)</th>
              <th>Total Pagado</th>
              <th>Saldo Deudor</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {debts.map((debt) => (
              <tr key={debt.id}>
                <td data-label="Cliente">{debt.name}</td>
                <td data-label="Total Comprado">${(debt.total_sold || 0).toLocaleString('es-AR')}</td>
                <td data-label="Total Pagado" style={{ color: 'green' }}>
                  ${(debt.total_paid || 0).toLocaleString('es-AR')}
                </td>
                <td data-label="Saldo Deudor" style={{ fontWeight: 'bold', color: debt.balance > 0 ? 'red' : 'inherit' }}>
                  ${(debt.balance || 0).toLocaleString('es-AR')}
                </td>
                <td data-label="Acciones">
                  <button onClick={() => navigate(`/admin/debts/${debt.id}`)} className="action-button view">
                    Ver Detalle
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
  );
}
