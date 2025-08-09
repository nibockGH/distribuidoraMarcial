// src/services/dashboardService.js

const API_URL = "https://distribuidoramarcial.onrender.com/api";

export const getDashboardData = async (period = 30) => {
    try {
        const [
            statsRes,
            salesOverTimeRes,
            salesByTypeRes, // Agregado
            topClientsRes,
            topProductsRes, // Agregado
            topSalespeopleRes,
            lowStockRes,
            inventoryValueRes,
        ] = await Promise.all([
            fetch(`${API_URL}/dashboard/stats?period=${period}`),
            fetch(`${API_URL}/reports/sales-over-time?days=${period}`),
            fetch(`${API_URL}/dashboard/sales-by-type`), // Agregado
            fetch(`${API_URL}/dashboard/top-clients`),
            fetch(`${API_URL}/dashboard/top-products`), // Agregado
            fetch(`${API_URL}/dashboard/top-salespeople`),
            fetch(`${API_URL}/dashboard/low-stock?threshold=10`),
            fetch(`${API_URL}/dashboard/inventory-value`),
        ]);

        if (!statsRes.ok) throw new Error(`Error en estadísticas: ${statsRes.statusText}`);
        if (!salesOverTimeRes.ok) throw new Error(`Error en ventas: ${salesOverTimeRes.statusText}`);
        if (!salesByTypeRes.ok) throw new Error(`Error en ventas por tipo: ${salesByTypeRes.statusText}`); // Agregado
        if (!topClientsRes.ok) throw new Error(`Error en top clientes: ${topClientsRes.statusText}`);
        if (!topProductsRes.ok) throw new Error(`Error en top productos: ${topProductsRes.statusText}`); // Agregado
        if (!topSalespeopleRes.ok) throw new Error(`Error en top vendedores: ${topSalespeopleRes.statusText}`);
        if (!lowStockRes.ok) throw new Error(`Error en bajo stock: ${lowStockRes.statusText}`);
        if (!inventoryValueRes.ok) throw new Error(`Error en valor de inventario: ${inventoryValueRes.statusText}`);

        const data = {
            stats: await statsRes.json(),
            salesOverTime: await salesOverTimeRes.json(),
            salesByType: await salesByTypeRes.json(), // Agregado
            topClients: await topClientsRes.json(),
            topProducts: await topProductsRes.json(), // Agregado
            topSalespeople: await topSalespeopleRes.json(),
            lowStock: await lowStockRes.json(),
            inventoryValue: await inventoryValueRes.json(),
        };

        return data;

    } catch (error) {
        console.error("Error en el servicio del dashboard:", error);
        throw error;
    }
};