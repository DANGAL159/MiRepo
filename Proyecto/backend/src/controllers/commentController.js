// backend/src/controllers/commentController.js
const db = require('../config/db');

const addComment = async (req, res) => {
    try {
        const { id_publicacion, id_usuario, texto } = req.body;
        const query = `
            INSERT INTO comentarios (id_publicacion, id_usuario, texto) 
            VALUES ($1, $2, $3) RETURNING *;
        `;
        const { rows } = await db.query(query, [id_publicacion, id_usuario, texto]);
        res.status(201).json(rows[0]);
    } catch (error) {
        console.error('Error al agregar comentario:', error);
        res.status(500).json({ error: 'Error al agregar comentario' });
    }
};

const getComments = async (req, res) => {
    try {
        const { id_publicacion } = req.params;
        const query = `
            SELECT c.id, c.texto, c.fecha_comentario, u.nombre_completo, u.foto_perfil_url
            FROM comentarios c
            JOIN usuarios u ON c.id_usuario = u.id
            WHERE c.id_publicacion = $1
            ORDER BY c.fecha_comentario ASC;
        `;
        const { rows } = await db.query(query, [id_publicacion]);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error al obtener comentarios:', error);
        res.status(500).json({ error: 'Error al obtener comentarios' });
    }
};

module.exports = { addComment, getComments };