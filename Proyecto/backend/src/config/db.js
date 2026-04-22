// backend/src/config/db.js
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

// Probar la conexión al iniciar
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('Error conectando a la base de datos', err.stack);
    } else {
        console.log('Base de datos conectada exitosamente');
    }
});

module.exports = {
    query: (text, params) => pool.query(text, params),
};