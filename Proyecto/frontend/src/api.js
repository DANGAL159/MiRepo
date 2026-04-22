import axios from 'axios';

// En local, apuntamos a los puertos donde corren nuestros servicios
const BACKEND_URL = 'http://semisocial-alb-2051108905.us-east-1.elb.amazonaws.com/api'; // Cambia esto si tu backend corre en otro puerto o URL
const LAMBDA_URL = 'https://qsvf7wsii9.execute-api.us-east-1.amazonaws.com/upload'; // Este lo emularemos en el paso 3

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