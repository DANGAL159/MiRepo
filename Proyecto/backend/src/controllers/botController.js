const { LexRuntimeV2Client, RecognizeTextCommand } = require("@aws-sdk/client-lex-runtime-v2");
const lexClient = new LexRuntimeV2Client({ region: "us-east-1" });

const handleChat = async (req, res) => {
    try {
        const { text, sessionId } = req.body;

        if (!process.env.LEX_BOT_ID || !process.env.LEX_BOT_ALIAS_ID) {
            return res.status(200).json({ reply: "⚠️ El bot Lex no está configurado en el .env aún." });
        }

        const command = new RecognizeTextCommand({
            botId: process.env.LEX_BOT_ID,
            botAliasId: process.env.LEX_BOT_ALIAS_ID,
            localeId: 'es_419',
            sessionId: sessionId || 'sesion-123',
            text: text
        });

        const response = await lexClient.send(command);
        const botResponse = response.messages && response.messages.length > 0 ? response.messages[0].content : "No entendí.";
        res.status(200).json({ reply: botResponse });
    } catch (error) {
        console.error("Error en Lex:", error);
        res.status(500).json({ error: "Error de red con AWS Lex" });
    }
};

module.exports = { handleChat };