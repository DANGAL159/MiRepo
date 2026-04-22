// backend/src/controllers/botController.js
const { LexRuntimeV2Client, RecognizeTextCommand } = require("@aws-sdk/client-lex-runtime-v2");

const lexClient = new LexRuntimeV2Client({ region: "us-east-1" });

const handleChat = async (req, res) => {
    try {
        const { text, sessionId } = req.body;

        const params = {
            botId: process.env.LEX_BOT_ID || 'TU_BOT_ID', // Lo obtendrás de AWS
            botAliasId: process.env.LEX_BOT_ALIAS_ID || 'TU_ALIAS_ID', // Lo obtendrás de AWS
            localeId: 'es-419', // Español latinoamericano
            sessionId: sessionId || 'sesion-local-123',
            text: text
        };

        const command = new RecognizeTextCommand(params);
        const response = await lexClient.send(command);

        // Extraer el mensaje de respuesta de Lex
        const messages = response.messages;
        const botResponse = messages && messages.length > 0 ? messages[0].content : "No entendí eso.";

        res.status(200).json({ reply: botResponse });
    } catch (error) {
        console.error("Error en Lex:", error);
        res.status(500).json({ error: "Error al comunicarse con el bot" });
    }
};

module.exports = { handleChat };