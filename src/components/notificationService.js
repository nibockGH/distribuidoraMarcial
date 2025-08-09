import axios from 'axios';
const API_URL = 'https://distribuidoramarcial.onrender.com/api/notifications';

export const getNotifications = async () => {
    const response = await axios.get(API_URL);
    return response.data;
};