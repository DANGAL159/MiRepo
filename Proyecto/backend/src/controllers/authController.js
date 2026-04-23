const { CognitoIdentityProviderClient, SignUpCommand, AdminInitiateAuthCommand } = require("@aws-sdk/client-cognito-identity-provider");
const db = require('../config/db');

const cognito = new CognitoIdentityProviderClient({ region: "us-east-1" });

const registerUser = async (req, res) => {
    const { correo, contrasena, nombre_completo, dpi, foto_perfil_url } = req.body;
    try {
        // 1. Registrar en Amazon Cognito
        const signUpCommand = new SignUpCommand({
            ClientId: process.env.COGNITO_CLIENT_ID,
            Username: correo,
            Password: contrasena,
            UserAttributes: [{ Name: "email", Value: correo }]
        });
        await cognito.send(signUpCommand);

        // 2. Guardar metadata en PostgreSQL
        const query = 'INSERT INTO usuarios (correo, contrasena, nombre_completo, dpi, foto_perfil_url) VALUES ($1, $2, $3, $4, $5) RETURNING *';
        const { rows } = await db.query(query, [correo, contrasena, nombre_completo, dpi, foto_perfil_url]);
        
        res.status(201).json({ message: 'Usuario registrado exitosamente', user: rows[0] });
    } catch (error) {
        console.error("Error en Cognito/DB:", error);
        res.status(400).json({ error: error.message || 'Error al registrar usuario' });
    }
};

const loginUser = async (req, res) => {
    const { correo, contrasena } = req.body;
    try {
        // 1. Autenticar con Amazon Cognito
        const authCommand = new AdminInitiateAuthCommand({
            AuthFlow: "ADMIN_NO_SRP_AUTH",
            ClientId: process.env.COGNITO_CLIENT_ID,
            UserPoolId: process.env.COGNITO_POOL_ID,
            AuthParameters: { USERNAME: correo, PASSWORD: contrasena }
        });
        const cognitoRes = await cognito.send(authCommand);

        // 2. Traer datos de PostgreSQL para armar el perfil visual
        const { rows } = await db.query('SELECT * FROM usuarios WHERE correo = $1', [correo]);
        if (rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado en BD' });

        res.status(200).json({ message: 'Login exitoso', token: cognitoRes.AuthenticationResult.IdToken, user: rows[0] });
    } catch (error) {
        console.error("Login Error:", error);
        res.status(401).json({ error: 'Credenciales incorrectas o error en Cognito' });
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
        const bucketName = process.env.S3_BUCKET_NAME || 'semi1proyecto-g9-202203361';

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

module.exports = { registerUser, loginUser, loginFacial }; 