// src/components/customerService.js

const API_URL_CUSTOMERS = 'http://localhost:4000/api/customers';

// Obtener todos los clientes
export const getCustomers = async () => {
  const response = await fetch(API_URL_CUSTOMERS);
  if (!response.ok) throw new Error('Error al obtener clientes');
  return response.json();
};

// Obtener un cliente por ID
export const getCustomerById = async (id) => {
  const response = await fetch(`${API_URL_CUSTOMERS}/${id}`);
  if (!response.ok) throw new Error('Cliente no encontrado');
  return response.json();
};

// Crear nuevo cliente
export const addCustomer = async (customerData) => {
  const response = await fetch(API_URL_CUSTOMERS, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(customerData),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Error al crear cliente');
  }
  return response.json();
};

// Actualizar un cliente
export const updateCustomer = async (id, customerData) => {
  const response = await fetch(`${API_URL_CUSTOMERS}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(customerData),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Error al actualizar cliente');
  }
  return response.json();
};

// Eliminar un cliente
export const deleteCustomer = async (id) => {
  const response = await fetch(`${API_URL_CUSTOMERS}/${id}`, { method: 'DELETE' });
  if (!response.ok) throw new Error('Error al eliminar cliente');
  return response.json();
};

// Obtener los pedidos de un cliente
export const getCustomerOrders = async (customerId) => {
  const response = await fetch(`${API_URL_CUSTOMERS}/${customerId}/orders`);
  if (!response.ok) throw new Error('Error al obtener los pedidos del cliente');
  return response.json();
};

// ===== NUEVAS FUNCIONES PARA PRECIOS ESPECIALES =====

// Obtener la lista de precios especiales para un cliente
export const getSpecialPrices = async (customerId) => {
  const response = await fetch(`${API_URL_CUSTOMERS}/${customerId}/prices`);
  if (!response.ok) throw new Error('Error al obtener la lista de precios especiales');
  return response.json();
};

// Añadir o actualizar un precio especial
export const addOrUpdateSpecialPrice = async (customerId, productId, specialPrice) => {
  const response = await fetch(`${API_URL_CUSTOMERS}/${customerId}/prices`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ productId, specialPrice }),
  });
  if (!response.ok) throw new Error('Error al guardar el precio especial');
  return response.json();
};

// Eliminar un precio especial
export const deleteSpecialPrice = async (customerId, productId) => {
  const response = await fetch(`${API_URL_CUSTOMERS}/${customerId}/prices/${productId}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Error al eliminar el precio especial');
  return response.json();
};