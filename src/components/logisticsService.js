import axios from 'axios';
const API_URL = 'https://distribuidoramarcial.onrender.com'; 

export const getPendingOrders = async () => {
    const response = await axios.get(`${API_URL}/pending-orders`);
    return response.data;
};

export const getRoutes = async () => {
    const response = await axios.get(`${API_URL}/routes`);
    return response.data;
};

export const createRoute = async (routeData) => {
    const response = await axios.post(`${API_URL}/routes`, routeData);
    return response.data;
};

// --- NUEVA FUNCIÓN ---
export const getRoutePdf = async (routeId) => {
    const response = await axios.get(`${API_URL}/routes/${routeId}/pdf`, {
        responseType: 'blob', // ¡Importante! Le decimos que espere un archivo
    });
    // Creamos una URL temporal para el archivo PDF
    const fileURL = window.URL.createObjectURL(new Blob([response.data]));
    // Creamos un link invisible para iniciar la descarga
    const link = document.createElement('a');
    link.href = fileURL;
    link.setAttribute('download', `hoja-de-ruta-${routeId}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link); // Limpiamos el link
};