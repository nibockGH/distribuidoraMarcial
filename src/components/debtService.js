// src/services/debtService.js
const API_URL = 'https://distribuidoramarcial.onrender.com/api';

export const getCustomerDebts = async () => {
    try {
        const response = await fetch(`${API_URL}/debts`);
        if (!response.ok) {
            throw new Error('Error al obtener deudas de clientes');
        }
        return response.json();
    } catch (error) {
        console.error(error);
        throw error;
    }
};

export const getSupplierDebts = async () => {
    try {
        const response = await fetch(`${API_URL}/suppliers/debts`);
        if (!response.ok) {
            throw new Error('Error al obtener deudas de proveedores');
        }
        return response.json();
    } catch (error) {
        console.error(error);
        throw error;
    }
};