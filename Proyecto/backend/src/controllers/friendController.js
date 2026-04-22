// backend/src/controllers/friendController.js
const db = require('../config/db');

const sendFriendRequest = async (req, res) => {
    try {
        const { id_usuario1, id_usuario2 } = req.body;
        const query = `INSERT INTO amistades (id_usuario1, id_usuario2, estado) VALUES ($1, $2, 'pendiente')`;
        await db.query(query, [id_usuario1, id_usuario2]);
        res.status(201).json({ message: 'Solicitud enviada' });
    } catch (error) {
        res.status(500).json({ error: 'Error al enviar solicitud' });
    }
};

const respondFriendRequest = async (req, res) => {
    try {
        const { id_usuario1, id_usuario2, estado } = req.body; // estado: 'aceptada' o 'rechazada'
        const query = `UPDATE amistades SET estado = $1 WHERE id_usuario1 = $2 AND id_usuario2 = $3`;
        await db.query(query, [estado, id_usuario1, id_usuario2]);
        res.status(200).json({ message: `Solicitud ${estado}` });
    } catch (error) {
        res.status(500).json({ error: 'Error al responder solicitud' });
    }
};

const getNonFriends = async (req, res) => {
    try {
        const userId = req.params.id;
        // Lógica: Seleccionar usuarios que no sean yo, y que no estén en la tabla de amistades conmigo
        const query = `
            SELECT id, nombre_completo, foto_perfil_url FROM usuarios
            WHERE id != $1 AND id NOT IN (
                SELECT id_usuario2 FROM amistades WHERE id_usuario1 = $1
                UNION
                SELECT id_usuario1 FROM amistades WHERE id_usuario2 = $1
            )
        `;
        const { rows } = await db.query(query, [userId]);
        res.status(200).json(rows);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener usuarios' });
    }
};

// backend/src/controllers/friendController.js

const getPendingRequests = async (req, res) => {
    try {
        const userId = req.params.id;
        // Buscamos donde el usuario actual es el destinatario (id_usuario2)
        // y el estado es 'pendiente'
        const query = `
            SELECT a.id_usuario1 as id, u.nombre_completo, u.foto_perfil_url, a.fecha_solicitud
            FROM amistades a
            JOIN usuarios u ON a.id_usuario1 = u.id
            WHERE a.id_usuario2 = $1 AND a.estado = 'pendiente'
        `;
        const { rows } = await db.query(query, [userId]);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error al obtener solicitudes pendientes:', error);
        res.status(500).json({ error: 'Error al obtener solicitudes' });
    }
};

module.exports = { sendFriendRequest, respondFriendRequest, getNonFriends, getPendingRequests };