import axios from 'axios';
const API_URL = 'https://distribuidoramarcial.onrender.com'; 

export const getNotifications = async () => {
    const response = await axios.get(API_URL);
    return response.data;
};