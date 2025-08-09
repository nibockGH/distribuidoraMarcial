// src/components/purchaseService.js
const API_URL = 'http://localhost:4000/api';

export const addPurchase = async (purchaseData) => {
  const response = await fetch(`${API_URL}/purchases`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(purchaseData)
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Error al registrar la compra');
  }
  return response.json();
};