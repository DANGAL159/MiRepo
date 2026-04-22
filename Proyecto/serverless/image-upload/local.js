// serverless/image-upload/local.js
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Permitir imágenes grandes

// Crear carpeta temporal si no existe
const UPLOADS_DIR = path.join(__dirname, 'temp_s3');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR);

app.post('/upload', (req, res) => {
    try {
        const { imageBase64, filename, folder } = req.body;
        
        // Simular guardado local en vez de S3
        const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
        const filePath = path.join(UPLOADS_DIR, `${Date.now()}_${filename}`);
        
        fs.writeFileSync(filePath, base64Data, 'base64');

        // Devolvemos una URL falsa para probar el frontend
        res.status(200).json({
            message: "Imagen subida exitosamente (Simulado)",
            url: `http://localhost:3001/fake-s3/${filename}`
        });
    } catch (error) {
        res.status(500).json({ error: "Error interno" });
    }
});

app.listen(3001, () => {
    console.log('Lambda simulada corriendo en http://localhost:3001');
});