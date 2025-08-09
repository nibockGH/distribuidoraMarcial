import axios from 'axios';
const API_URL = 'https://distribuidoramarcial.onrender.com/api/transformations';

export const createTransformation = async (transformationData) => {
    const response = await axios.post(API_URL, transformationData);
    return response.data;
};