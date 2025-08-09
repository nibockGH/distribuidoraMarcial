// src/components/SupplierDebtList.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSupplierDebts } from './supplierService';

export default function SupplierDebtList() {
  const [debts, setDebts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDebts = async () => {
      try {
        const data = await getSupplierDebts();
        setDebts(data);
      } catch (err) {
        setError('Error al cargar las deudas de proveedores.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDebts();
  }, []);

  if (isLoading) return <p>Cargando deudas de proveedores...</p>;
  if (error) return <p className="error-message">{error}</p>;

  return (
    <div className="table-wrapper">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Proveedor</th>
            <th>Total Comprado</th>
            <th>Total Pagado</th>
            <th>Saldo a Pagar</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {debts.map((debt) => (
            <tr key={debt.id}>
              <td data-label="Proveedor">{debt.name}</td>
              <td data-label="Total Comprado">${(debt.total_purchased || 0).toLocaleString('es-AR')}</td>
              <td data-label="Total Pagado" style={{ color: 'green' }}>
                ${(debt.total_paid || 0).toLocaleString('es-AR')}
              </td>
              <td data-label="Saldo a Pagar" style={{ fontWeight: 'bold', color: debt.balance > 0 ? 'red' : 'inherit' }}>
                ${(debt.balance || 0).toLocaleString('es-AR')}
              </td>
              <td data-label="Acciones">
                <button onClick={() => navigate(`/admin/suppliers/debts/${debt.id}`)} className="action-button view">
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
