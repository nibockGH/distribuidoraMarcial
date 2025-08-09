// src/components/ProfitLossReport.jsx

import React, { useState } from 'react';

// Función para formatear moneda
const formatCurrency = (value) => {
    return `$${(value || 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

// Función para formatear fecha
const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    // Agregamos un día para corregir el desfase de zona horaria al mostrar
    date.setUTCDate(date.getUTCDate() + 1);
    return date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};


const ProfitLossReport = () => {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [reportData, setReportData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleGenerateReport = async () => {
        if (!startDate || !endDate) {
            setError('Por favor, selecciona una fecha de inicio y de fin.');
            return;
        }
        setIsLoading(true);
        setError('');
        setReportData(null);

        try {
            const response = await fetch(`http://localhost:4000/api/reports/profit-loss?startDate=${startDate}&endDate=${endDate}`);
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || 'Error en el servidor');
            }
            const data = await response.json();
            setReportData(data);
        } catch (err) {
            setError(`No se pudo generar el reporte: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="admin-section">
            <h2>Estado de Resultados (Pérdidas y Ganancias)</h2>
            
            <div className="report-filters">
                <div className="form-field">
                    <label>Fecha de Inicio</label>
                    <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
                <div className="form-field">
                    <label>Fecha de Fin</label>
                    <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </div>
                <button onClick={handleGenerateReport} disabled={isLoading} className="admin-button-primary">
                    {isLoading ? 'Generando...' : 'Generar Reporte'}
                </button>
            </div>

            {error && <p className="error-message global-error" style={{marginTop: '20px'}}>{error}</p>}

            {reportData && (
                <>
                    <div className="report-results">
                        <h3>Resultados para el período del {formatDate(reportData.period.startDate)} al {formatDate(reportData.period.endDate)}</h3>
                        <div className="pnl-summary">
                            <div className="pnl-item"><span>(+) Ingresos Totales por Ventas</span><span className="pnl-value">{formatCurrency(reportData.totalSales)}</span></div>
                            <div className="pnl-item"><span>(-) Costo de Mercadería Vendida (CMV)</span><span className="pnl-value">{formatCurrency(reportData.costOfGoodsSold)}</span></div>
                            <div className="pnl-item gross-margin"><span>(=) Margen Bruto</span><span className="pnl-value">{formatCurrency(reportData.grossMargin)}</span></div>
                            <div className="pnl-item"><span>(-) Otros Costos (Fijos y Variables)</span><span className="pnl-value">{formatCurrency(reportData.otherCosts)}</span></div>
                            <div className={`pnl-item net-profit ${reportData.netProfit >= 0 ? 'positive' : 'negative'}`}><span>(=) Resultado Neto (Ganancia / Pérdida)</span><span className="pnl-value">{formatCurrency(reportData.netProfit)}</span></div>
                        </div>
                    </div>

                    {/* NUEVA SECCIÓN: TABLA DE DESGLOSE DE COSTOS */}
                    {reportData.otherCostsDetail && reportData.otherCostsDetail.length > 0 && (
                        <div className="report-details-section">
                            <h4>Desglose de Otros Costos</h4>
                            <table className="admin-table report-details-table">
                                <thead>
                                    <tr>
                                        <th>Fecha</th>
                                        <th>Descripción</th>
                                        <th style={{textAlign: 'right'}}>Monto</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reportData.otherCostsDetail.map((cost, index) => (
                                        <tr key={index}>
                                            <td>{formatDate(cost.cost_date)}</td>
                                            <td>{cost.description}</td>
                                            <td style={{textAlign: 'right'}}>{formatCurrency(cost.amount)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default ProfitLossReport;