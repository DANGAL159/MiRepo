// backend/src/index.js
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io'); // Instalar: npm install socket.io

require('dotenv').config();

const db = require('./config/db');

// Importar Controladores
const { loginUser, updateProfile } = require('./controllers/userController');
const { registerUser, loginFacial } = require('./controllers/authController');
const { createPublication, getFeed, translateDescription, getAllTags } = require('./controllers/publicationController');
const { addComment, getComments } = require('./controllers/commentController');
const { sendFriendRequest, respondFriendRequest, getNonFriends, getPendingRequests } = require('./controllers/friendController');
const { handleChat } = require('./controllers/botController');

const app = express();

const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: '*' }
});

io.on('connection', (socket) => {
    console.log('Usuario conectado al chat');
    
    // Unirse a una sala privada
    socket.on('join_chat', (room) => {
        socket.join(room);
    });

    // Recibir y retransmitir mensaje
    socket.on('send_message', (data) => {
        io.to(data.room).emit('receive_message', data);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});

app.use(cors());
app.use(express.json());

// --- ENDPOINTS REST ---
app.get('/api/health', (req, res) => res.json({ status: 'OK' }));

// Auth & Usuarios
app.post('/api/auth/register', registerUser);
app.post('/api/auth/login', loginUser);
app.put('/api/users/:id', updateProfile);


// Amistades
app.get('/api/users/:id/non-friends', getNonFriends);
app.post('/api/friends/request', sendFriendRequest);
app.put('/api/friends/respond', respondFriendRequest);
app.get('/api/friends/pending/:id', getPendingRequests);
app.get('/api/friends/:id', getFriends);

// Publicaciones
app.post('/api/publications', createPublication);
app.get('/api/feed/:id', getFeed);
app.post('/api/translate', translateDescription);
app.get('/api/tags', getAllTags);
// Y agrega estas dos rutas en la sección de ENDPOINTS REST
app.post('/api/publications/comments', addComment);
app.get('/api/publications/:id_publicacion/comments', getComments);

app.post('/api/auth/login-facial', loginFacial);
app.post('/api/bot/chat', handleChat);

// --- CONFIGURACIÓN DE CHAT (WebSockets) ---
io.on('connection', (socket) => {
    console.log('Un usuario se conectó al chat');
    
    // Aquí implementarán la lógica de unirse a salas privadas por ID de amigo
    socket.on('join_chat', (room) => socket.join(room));
    
    socket.on('send_message', (data) => {
        // data debe contener { room, message, senderId }
        io.to(data.room).emit('receive_message', data);
    });

    socket.on('disconnect', () => console.log('Usuario desconectado'));
});

// Iniciar servidor
server.listen(PORT, () => {
    console.log(`Servidor Backend + WebSockets corriendo en http://localhost:${PORT}`);
});