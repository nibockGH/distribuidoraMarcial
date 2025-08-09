// src/components/productService.js
const API_URL = 'https://distribuidoramarcial.onrender.com/api';

export const getProducts = async () => {
  try {
    const response = await fetch(`${API_URL}/products`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(`Error HTTP ${response.status}: ${errorData.message || response.statusText}`);
    }
    const products = await response.json();
    return Array.isArray(products) ? products : [];
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
};

// MODIFICADO: Ahora acepta formData y no establece Content-Type
export const addProduct = async (formData) => {
  try {
    const response = await fetch(`${API_URL}/products`, {
      method: 'POST',
      body: formData, // No se usa JSON.stringify y no se pone Content-Type
    });
    if (!response.ok) {
     const errorData = await response.json().catch(() => ({ message: response.statusText }));
     throw new Error(`Error HTTP ${response.status}: ${errorData.message || response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error adding product:", error);
    throw error;
  }
};

// MODIFICADO: Ahora acepta formData y no establece Content-Type
export const updateProduct = async (productId, formData) => {
  try {
    const response = await fetch(`${API_URL}/products/${productId}`, {
      method: 'PUT',
      body: formData, // No se usa JSON.stringify y no se pone Content-Type
    });
    if (!response.ok) {
     const errorData = await response.json().catch(() => ({ message: response.statusText }));
     throw new Error(`Error HTTP ${response.status}: ${errorData.message || response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error updating product:", error);
    throw error;
  }
};

export const deleteProduct = async (id) => {
  try {
    const response = await fetch(`${API_URL}/products/${id}`, { method: 'DELETE' });
    if (!response.ok) {
     const errorData = await response.json().catch(() => ({ message: response.statusText }));
     throw new Error(`Error HTTP ${response.status}: ${errorData.message || response.statusText}`);
    }
    return await response.json(); 
  } catch (error) {
    console.error("Error deleting product:", error);
    throw error;
  }
};

export const adjustStock = async (productId, adjustmentData) => {
  const response = await fetch(`${API_URL}/stock/${productId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(adjustmentData),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Error al ajustar el stock');
  }
  return response.json();
};

export const getStockHistory = async (productId) => {
    const response = await fetch(`${API_URL}/products/${productId}/stock-history`);
    if (!response.ok) throw new Error('Error al obtener el historial de stock');
    return response.json();
};
// --- NUEVA FUNCIÓN EN productService.js ---

export const searchProducts = async (searchTerm) => {
  if (!searchTerm) {
    return [];
  }
  try {
    const response = await fetch(`${API_URL}/products/search?term=${searchTerm}`);
    if (!response.ok) {
      throw new Error('Error en la búsqueda de productos');
    }
    return response.json();
  } catch (error) {
    console.error("Error al buscar productos:", error);
    return []; // Devuelve un array vacío en caso de error
  }
};