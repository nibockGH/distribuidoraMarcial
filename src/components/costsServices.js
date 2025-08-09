// src/components/costsService.js
const API_URL = 'https://distribuidoramarcial.onrender.com/api';

export const getCosts = async () => {
  const response = await fetch(`${API_URL}/costs`);
  if (!response.ok) throw new Error('Error al obtener los costos');
  return response.json();
};

export const addCost = async (costData) => {
  const response = await fetch(`${API_URL}/costs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(costData),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Error al registrar el costo');
  }
  return response.json();
};

export const deleteCost = async (type, id) => {
    const response = await fetch(`${API_URL}/costs/${type}/${id}`, {
        method: 'DELETE',
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al eliminar el costo');
    }
    return response.json();
};
