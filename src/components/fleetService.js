// src/services/fleetService.js
import axios from 'axios';
const API_URL = 'https://distribuidoramarcial.onrender.com/api/vehicles';

export const getVehicles = async () => {
    const response = await axios.get(API_URL);
    return response.data;
};

export const addVehicle = async (vehicleData) => {
    const response = await axios.post(API_URL, vehicleData);
    return response.data;
};

export const updateVehicle = async (id, vehicleData) => {
    const response = await axios.put(`${API_URL}/${id}`, vehicleData);
    return response.data;
};

export const deleteVehicle = async (id) => {
    const response = await axios.delete(`${API_URL}/${id}`);
    return response.data;
};