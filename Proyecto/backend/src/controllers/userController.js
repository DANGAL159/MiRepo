// backend/src/controllers/userController.js
const db = require('../config/db');
const md5 = require('md5');

const loginUser = async (req, res) => {
    try {
        const { correo, contrasena } = req.body;
        const contrasenaEncriptada = md5(contrasena);

        const query = 'SELECT * FROM usuarios WHERE correo = $1 AND contrasena = $2';
        const { rows } = await db.query(query, [correo, contrasenaEncriptada]);

        if (rows.length === 0) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        res.status(200).json({ message: 'Login exitoso', user: rows[0] });
    } catch (error) {
        res.status(500).json({ error: 'Error en el servidor' });
    }
};

const updateProfile = async (req, res) => {
    try {
        const userId = req.params.id;
        const { nombre_completo, dpi, foto_perfil_url, contrasena_actual } = req.body;

        // Verificar contraseña actual (Requisito del PDF)
        const checkQuery = 'SELECT contrasena FROM usuarios WHERE id = $1';
        const checkResult = await db.query(checkQuery, [userId]);
        
        if (checkResult.rows[0].contrasena !== md5(contrasena_actual)) {
            return res.status(401).json({ error: 'Contraseña actual incorrecta' });
        }

        const updateQuery = `
            UPDATE usuarios 
            SET nombre_completo = $1, dpi = $2, foto_perfil_url = $3 
            WHERE id = $4 RETURNING id, nombre_completo, dpi, foto_perfil_url;
        `;
        const { rows } = await db.query(updateQuery, [nombre_completo, dpi, foto_perfil_url, userId]);

        res.status(200).json({ message: 'Perfil actualizado', user: rows[0] });
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar perfil' });
    }
};

module.exports = { loginUser, updateProfile };