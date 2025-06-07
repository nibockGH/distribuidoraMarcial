// src/components/orderService.js

const API_URL_ORDERS = 'http://localhost:4000/api/orders';

// Obtener todos los pedidos (LA FUNCIÓN QUE FALTABA)
export const getOrders = async () => {
  try {
    const response = await fetch(API_URL_ORDERS);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(`Error HTTP ${response.status}: ${errorData.message || response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching orders:", error);
    throw error;
  }
};

// Obtener un pedido específico por ID (con sus ítems)
export const getOrderById = async (id) => {
  try {
    const response = await fetch(`${API_URL_ORDERS}/${id}`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(`Error HTTP ${response.status}: ${errorData.message || response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching order with ID ${id}:`, error);
    throw error;
  }
};

// Actualizar el estado de un pedido
export const updateOrderStatus = async (id, status) => {
  try {
    const response = await fetch(`${API_URL_ORDERS}/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(`Error HTTP ${response.status}: ${errorData.message || response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error updating status for order ID ${id}:`, error);
    throw error;
  }
};

// Crear un nuevo pedido (este lo usa Cart.jsx)
export const createOrderInBackend = async (orderData) => {
  try {
    const response = await fetch(API_URL_ORDERS, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(`Error HTTP ${response.status}: ${errorData.message || response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error creating order:", error);
    throw error;
  }
};