import axios from 'axios';

// 1. Exportas la raíz para que Socket.io la use
export const SERVER_ROOT = 'http://semisocial-alb-2051108905.us-east-1.elb.amazonaws.com';

// 2. Le agregas el /api para Axios
const BACKEND_URL = `${SERVER_ROOT}/api`;
export const LAMBDA_URL = 'https://qsvf7wsii9.execute-api.us-east-1.amazonaws.com/upload'; 

export const api = axios.create({
    baseURL: BACKEND_URL,
});

export const uploadImage = async (base64, filename, folder) => {
    const response = await axios.post(LAMBDA_URL, {
        imageBase64: base64,
        filename,
        folder
    });
    return response.data; // Retorna { message, url }
};