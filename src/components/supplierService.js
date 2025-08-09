// src/services/supplierService.js

const API_URL = 'https://distribuidoramarcial.onrender.com/api';

// --- FUNCIONES EXISTENTES ---
export const getSuppliers = async () => {
  const response = await fetch(`${API_URL}/suppliers`);
  if (!response.ok) throw new Error('Error al obtener proveedores');
  return response.json();
};

export const getSupplierById = async (id) => {
  const response = await fetch(`${API_URL}/suppliers/${id}`);
  if (!response.ok) throw new Error('Proveedor no encontrado');
  return response.json();
};

// V CAMBIO ACÁ: Renombramos 'addSupplier' a 'createSupplier' para que coincida con el formulario
export const createSupplier = async (supplierData) => {
    const response = await fetch(`${API_URL}/suppliers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(supplierData),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al crear proveedor');
    }
    return response.json();
};


// --- FUNCIONES QUE FALTABAN ---

export const updateSupplier = async (id, supplierData) => {
    const response = await fetch(`${API_URL}/suppliers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(supplierData),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al actualizar proveedor');
    }
    return response.json();
};

export const deleteSupplier = async (id) => {
    const response = await fetch(`${API_URL}/suppliers/${id}`, {
        method: 'DELETE',
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al eliminar proveedor');
    }
    return response.json();
};


// --- FUNCIONES DE CUENTAS CORRIENTES DE PROVEEDORES ---

export const getSupplierDebts = async () => {
  const response = await fetch(`${API_URL}/suppliers/debts`);
  if (!response.ok) throw new Error('Error al obtener las deudas de proveedores');
  return response.json();
};

export const getSupplierPurchases = async (supplierId) => {
    const response = await fetch(`${API_URL}/suppliers/${supplierId}/purchases`);
    if (!response.ok) throw new Error('Error al obtener las compras del proveedor');
    return response.json();
};

export const getSupplierPayments = async (supplierId) => {
  const response = await fetch(`${API_URL}/suppliers/${supplierId}/payments`);
  if (!response.ok) throw new Error('Error al obtener los pagos del proveedor');
  return response.json();
};

export const addSupplierPayment = async (supplierId, paymentData) => {
  const response = await fetch(`${API_URL}/suppliers/${supplierId}/payments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(paymentData),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Error al registrar el pago al proveedor');
  }
  return response.json();
};