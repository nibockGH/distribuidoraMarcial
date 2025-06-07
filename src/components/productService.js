// src/components/productService.js
const API_URL = 'http://localhost:4000/api';

const cleanProductName = (name) => {
  if (!name) return '';
  return name.replace(/[\s\.\-]+$/, '').trim();
};

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

export const addProduct = async (productData) => {
  try {
    const response = await fetch(`${API_URL}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(productData),
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

export const updateProduct = async (updatedProduct) => {
  try {
    const response = await fetch(`${API_URL}/products/${updatedProduct.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedProduct),
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

export const updateStock = async (productId, quantity) => {
  try {
    const response = await fetch(`${API_URL}/stock/${productId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantity: Number(quantity) }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(`Error HTTP ${response.status}: ${errorData.message || response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error updating stock for product ${productId}:`, error);
    throw error;
  }
};