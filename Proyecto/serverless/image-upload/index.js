// serverless/image-upload/index.js
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

// Inicializa el cliente de S3. La región se tomará de las variables de entorno de AWS
const s3 = new S3Client();

exports.handler = async (event) => {
    // Cabeceras CORS obligatorias para que el frontend en S3 pueda comunicarse con el API Gateway
    const headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "OPTIONS,POST"
    };

    try {
        // API Gateway envía el body como un string, hay que parsearlo
        const body = JSON.parse(event.body);
        
        // Esperamos recibir: 
        // 1. La imagen en base64
        // 2. El nombre del archivo (ej. "user_123.jpg")
        // 3. El tipo de carpeta ("Fotos_Perfil" o "Fotos_Publicadas")
        const { imageBase64, filename, folder } = body;

        if (!imageBase64 || !filename || !folder) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: "Faltan parámetros requeridos (imageBase64, filename, folder)" })
            };
        }

        // Limpiar la cabecera del base64 si el frontend la envía (ej: "data:image/jpeg;base64,...")
        const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
        const imageBuffer = Buffer.from(base64Data, 'base64');

        // BUCKET_NAME se inyectará más adelante con Terraform como variable de entorno
        const bucketName = process.env.BUCKET_NAME; 
        const filePath = `${folder}/${filename}`; // Ej: Fotos_Perfil/user_123.jpg

        const params = {
            Bucket: bucketName,
            Key: filePath,
            Body: imageBuffer,
            ContentType: 'image/jpeg' // Puedes hacerlo dinámico si lo necesitas
        };

        // Subir la imagen a S3
        await s3.send(new PutObjectCommand(params));

        // Retornar la URL pública de la imagen
        const imageUrl = `https://${bucketName}.s3.amazonaws.com/${filePath}`;

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                message: "Imagen subida exitosamente",
                url: imageUrl
            })
        };

    } catch (error) {
        console.error("Error subiendo imagen:", error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: "Error interno del servidor al procesar la imagen" })
        };
    }
};