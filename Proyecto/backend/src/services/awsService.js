// backend/src/services/awsService.js
const { RekognitionClient, DetectLabelsCommand } = require("@aws-sdk/client-rekognition");
const { TranslateClient, TranslateTextCommand } = require("@aws-sdk/client-translate");

// Los clientes tomarán las credenciales de las variables de entorno automáticamente
const rekognition = new RekognitionClient({ region: "us-east-1" });
const translate = new TranslateClient({ region: "us-east-1" });

const obtenerEtiquetas = async (bucket, nombreArchivo) => {
    const params = {
        Image: { S3Object: { Bucket: bucket, Name: nombreArchivo } },
        MaxLabels: 5,
        MinConfidence: 75
    };
    try {
        const { Labels } = await rekognition.send(new DetectLabelsCommand(params));
        return Labels.map(label => label.Name);
    } catch (error) {
        console.error("Error en Rekognition:", error);
        return [];
    }
};

const traducirTexto = async (texto, idiomaDestino) => {
    // idiomaDestino puede ser 'en' (Inglés), 'fr' (Francés), 'pt' (Portugués)
    const params = {
        SourceLanguageCode: 'auto', // Detecta automáticamente el idioma de origen
        TargetLanguageCode: idiomaDestino,
        Text: texto
    };
    try {
        const data = await translate.send(new TranslateTextCommand(params));
        return data.TranslatedText;
    } catch (error) {
        console.error("Error en Translate:", error);
        return texto; // Si falla, devuelve el original
    }
};

module.exports = { obtenerEtiquetas, traducirTexto };