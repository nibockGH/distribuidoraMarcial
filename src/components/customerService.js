// src/services/customerService.js

const API_URL = 'http://localhost:4000/api/customers';

// --- Funciones de Clientes ---
export const getCustomers = async () => {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error('Error al obtener clientes.');
    return response.json();
};

export const getCustomerById = async (id) => {
    const response = await fetch(`${API_URL}/${id}`);
    if (!response.ok) throw new Error('Error al obtener el cliente.');
    return response.json();
};

export const addCustomer = async (customer) => {
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customer)
    });
    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Error al crear cliente.');
    }
    return response.json();
};
// Función para crear un nuevo cliente
export const createCustomer = async (customerData) => {
    const response = await fetch(`${API_URL}/customers`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(customerData),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al crear el cliente');
    }
    return response.json();
};

export const updateCustomer = async (id, customer) => {
    const response = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customer)
    });
    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Error al actualizar cliente.');
    }
    return response.json();
};

// --- FUNCIÓN QUE FALTABA ---
export const deleteCustomer = async (id) => {
    const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
    });
    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Error al eliminar cliente.');
    }
    return response.json();
};


// --- Funciones de Detalles y Deudas de Clientes ---
export const getCustomerDetails = async (customerId) => {
  const response = await fetch(`${API_URL}/${customerId}/details`);
  if (!response.ok) throw new Error('No se pudieron cargar los detalles completos del cliente.');
  return response.json();
};

// --- Funciones que movimos desde debtService ---
export const getCustomerDebts = async () => {
    const BASE_API_URL = 'http://localhost:4000/api';
    const response = await fetch(`${BASE_API_URL}/debts`);
    if (!response.ok) throw new Error('Error al obtener deudas de clientes');
    return response.json();
};

export const getSupplierDebts = async () => {
    const BASE_API_URL = 'http://localhost:4000/api';
    const response = await fetch(`${BASE_API_URL}/suppliers/debts`);
    if (!response.ok) throw new Error('Error al obtener deudas de proveedores');
    return response.json();
};

export const addPayment = async (customerId, paymentData) => {
    const response = await fetch(`${API_URL}/${customerId}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentData)
    });
    if (!response.ok) throw new Error('Error al registrar el pago.');
    return response.json();
};

// --- Funciones de Precios Especiales ---
export const getSpecialPrices = async (customerId) => {
    const response = await fetch(`${API_URL}/${customerId}/prices`);
    if (!response.ok) throw new Error('Error al obtener precios especiales.');
    return response.json();
};