// backend/src/controllers/authController.js
const db = require('../config/db');
const md5 = require('md5');

// Agrega esta importación arriba en authController.js
const { RekognitionClient, CompareFacesCommand } = require("@aws-sdk/client-rekognition");
const rekognition = new RekognitionClient({ region: "us-east-1" });

const registerUser = async (req, res) => {
    try {
        const { nombre_completo, correo, dpi, contrasena, foto_perfil_url, cognito_sub } = req.body;

        // Validación básica
        if (!nombre_completo || !correo || !dpi || !contrasena) {
            return res.status(400).json({ error: 'Faltan campos obligatorios' });
        }

        // Encriptar la contraseña con MD5 (Requisito de la rúbrica 1.5)
        const contrasenaEncriptada = md5(contrasena);

        // Insertar en PostgreSQL
        const query = `
            INSERT INTO usuarios (cognito_sub, nombre_completo, correo, dpi, contrasena, foto_perfil_url)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id, nombre_completo, correo;
        `;
        const values = [cognito_sub, nombre_completo, correo, dpi, contrasenaEncriptada, foto_perfil_url];

        const result = await db.query(query, values);

        res.status(201).json({
            message: 'Usuario registrado exitosamente en la base de datos',
            user: result.rows[0]
        });

    } catch (error) {
        console.error('Error al registrar usuario:', error);
        // Manejo de errores de llave duplicada (correo o dpi)
        if (error.code === '23505') {
            return res.status(409).json({ error: 'El correo o DPI ya están registrados' });
        }
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

const loginFacial = async (req, res) => {
    try {
        const { correo, imageBase64 } = req.body;

        // 1. Buscar al usuario por correo para obtener su foto de perfil
        const userQuery = 'SELECT * FROM usuarios WHERE correo = $1';
        const { rows } = await db.query(userQuery, [correo]);
        
        if (rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
        const user = rows[0];

        if (!user.foto_perfil_url) return res.status(400).json({ error: 'El usuario no tiene foto de perfil' });

        // 2. Extraer el nombre del archivo de la URL de S3
        // Ejemplo URL: https://bucket.s3.amazonaws.com/Fotos_Perfil/foto.jpg
        const s3Key = user.foto_perfil_url.split('.com/')[1]; 
        const bucketName = process.env.S3_BUCKET_NAME || 'semi1proyecto-g#';

        // 3. Preparar la imagen de la cámara
        const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
        const imageBuffer = Buffer.from(base64Data, 'base64');

        // 4. Comparar rostros con AWS Rekognition
        const params = {
            SourceImage: { S3Object: { Bucket: bucketName, Name: decodeURIComponent(s3Key) } },
            TargetImage: { Bytes: imageBuffer },
            SimilarityThreshold: 90 // Exigimos 90% de similitud
        };

        const command = new CompareFacesCommand(params);
        const response = await rekognition.send(command);

        if (response.FaceMatches && response.FaceMatches.length > 0) {
            // ¡Match exitoso!
            res.status(200).json({ message: 'Login facial exitoso', user });
        } else {
            res.status(401).json({ error: 'El rostro no coincide' });
        }
    } catch (error) {
        console.error("Error en Login Facial:", error);
        res.status(500).json({ error: 'Error procesando el reconocimiento facial' });
    }
};

module.exports = { registerUser, loginFacial }; // Asegúrate de exportarlo