import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000'); // URL de tu backend EC2

export default function Chat({ user }) {
    const [mensaje, setMensaje] = useState('');
    const [chatLog, setChatLog] = useState([]);
    // En una app real, aquí seleccionarías a un amigo de una lista. Para probar, usamos una sala global.
    const room = 'sala_general'; 

    useEffect(() => {
        socket.emit('join_chat', room);

        socket.on('receive_message', (data) => {
            setChatLog((prev) => [...prev, data]);
        });

        return () => socket.off('receive_message');
    }, []);

    const enviarMensaje = (e) => {
        e.preventDefault();
        if (mensaje.trim() === '') return;

        const data = { room, message: mensaje, sender: user.nombre_completo };
        socket.emit('send_message', data);
        setMensaje('');
    };

    return (
        <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
            <h2>Chat en Tiempo Real</h2>
            <div style={{ height: '300px', overflowY: 'scroll', border: '1px solid #ccc', padding: '1rem', marginBottom: '1rem' }}>
                {chatLog.map((msg, idx) => (
                    <div key={idx} style={{ textAlign: msg.sender === user.nombre_completo ? 'right' : 'left' }}>
                        <strong>{msg.sender}: </strong> {msg.message}
                    </div>
                ))}
            </div>
            <form onSubmit={enviarMensaje} style={{ display: 'flex', gap: '1rem' }}>
                <input 
                    style={{ flex: 1 }} type="text" value={mensaje} 
                    onChange={(e) => setMensaje(e.target.value)} placeholder="Escribe un mensaje..."
                />
                <button type="submit">Enviar</button>
            </form>
        </div>
    );
}