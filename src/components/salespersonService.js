// src/components/salespersonService.js

const API_SALESPEOPLE_URL = 'http://localhost:4000/api/salespeople';
const API_SALESRECORDS_URL = 'http://localhost:4000/api/salesrecords';

export const getSalespeople = async () => {
  try {
    const response = await fetch(API_SALESPEOPLE_URL);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(`Error HTTP ${response.status}: ${errorData.message || response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching salespeople:", error);
    throw error;
  }
};

export const addSalesperson = async (salespersonData) => {
  try {
    const response = await fetch(API_SALESPEOPLE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(salespersonData),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(`Error HTTP ${response.status}: ${errorData.message || response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error adding salesperson:", error);
    throw error;
  }
};

export const getSalesRecords = async (salespersonId = null) => {
  try {
    let url = API_SALESRECORDS_URL;
    if (salespersonId) {
      url += `?salespersonId=${salespersonId}`;
    }
    const response = await fetch(url);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(`Error HTTP ${response.status}: ${errorData.message || response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching sales records:", error);
    throw error;
  }
};

export const addSaleRecord = async (saleRecordData) => {
  try {
    const response = await fetch(API_SALESRECORDS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(saleRecordData),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(`Error HTTP ${response.status}: ${errorData.message || response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error adding sale record:", error);
    throw error;
  }
};