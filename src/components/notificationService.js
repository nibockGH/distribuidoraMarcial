import axios from 'axios';
const API_URL = 'http://localhost:4000/api/notifications';

export const getNotifications = async () => {
    const response = await axios.get(API_URL);
    return response.data;
};