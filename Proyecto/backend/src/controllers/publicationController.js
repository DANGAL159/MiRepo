// backend/src/controllers/publicationController.js
const db = require('../config/db');
const { obtenerEtiquetas, traducirTexto } = require('../services/awsService');

const createPublication = async (req, res) => {
    try {
        const { id_usuario, imagen_url, descripcion, s3_filename } = req.body;

        // 1. Insertar publicación
        const pubQuery = `INSERT INTO publicaciones (id_usuario, imagen_url, descripcion) VALUES ($1, $2, $3) RETURNING id`;
        const { rows } = await db.query(pubQuery, [id_usuario, imagen_url, descripcion]);
        const idPublicacion = rows[0].id;

        // 2. Obtener etiquetas de Rekognition (Asumiendo que envías el nombre del archivo en S3)
        const bucketName = process.env.S3_BUCKET_NAME || 'semi1proyecto-g#'; // Ajustar
        const etiquetas = await obtenerEtiquetas(bucketName, `Fotos_Publicadas/${s3_filename}`);

        // 3. Guardar etiquetas en BD y relacionarlas
        for (const nombreEtiqueta of etiquetas) {
            // Insertar etiqueta si no existe
            const tagQuery = `INSERT INTO etiquetas (nombre) VALUES ($1) ON CONFLICT (nombre) DO NOTHING RETURNING id`;
            await db.query(tagQuery, [nombreEtiqueta]);

            // Obtener ID de la etiqueta
            const getTag = `SELECT id FROM etiquetas WHERE nombre = $1`;
            const tagIdRes = await db.query(getTag, [nombreEtiqueta]);
            const tagId = tagIdRes.rows[0].id;

            // Relacionar publicación con etiqueta
            await db.query(`INSERT INTO publicacion_etiquetas (id_publicacion, id_etiqueta) VALUES ($1, $2)`, [idPublicacion, tagId]);
        }

        res.status(201).json({ message: 'Publicación creada con etiquetas', id: idPublicacion });
    } catch (error) {
        res.status(500).json({ error: 'Error al crear publicación' });
    }
};

const getFeed = async (req, res) => {
    try {
        const userId = req.params.id;
        // Obtiene publicaciones propias y de amigos aprobados
        const query = `
            SELECT p.*, u.nombre_completo, u.foto_perfil_url,
            COALESCE(
                (SELECT array_agg(e.nombre) 
                 FROM etiquetas e 
                 JOIN publicacion_etiquetas pe ON e.id = pe.id_etiqueta 
                 WHERE pe.id_publicacion = p.id), 
            '{}') as etiquetas
            FROM publicaciones p
            JOIN usuarios u ON p.id_usuario = u.id
            WHERE p.id_usuario = $1 OR p.id_usuario IN (
                SELECT id_usuario2 FROM amistades WHERE id_usuario1 = $1 AND estado = 'aceptada'
                UNION
                SELECT id_usuario1 FROM amistades WHERE id_usuario2 = $1 AND estado = 'aceptada'
            )
            ORDER BY p.fecha_publicacion DESC
        `;
        const { rows } = await db.query(query, [userId]);
        res.status(200).json(rows);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener el feed' });
    }
};

const translateDescription = async (req, res) => {
    try {
        const { texto, idioma } = req.body;
        const textoTraducido = await traducirTexto(texto, idioma);
        res.status(200).json({ translation: textoTraducido });
    } catch (error) {
        res.status(500).json({ error: 'Error al traducir' });
    }
};

const getAllTags = async (req, res) => {
    try {
        const { rows } = await db.query('SELECT nombre FROM etiquetas ORDER BY nombre ASC');
        res.status(200).json(rows.map(r => r.nombre));
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener etiquetas' });
    }
};

module.exports = { createPublication, getFeed, translateDescription, getAllTags };