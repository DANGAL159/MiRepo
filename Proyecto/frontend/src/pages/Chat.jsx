// frontend/src/pages/Chat.jsx
import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { api, SERVER_ROOT } from '../api';

const socket = io(SERVER_ROOT); 

export default function Chat({ user }) {
    const [amigos, setAmigos] = useState([]);
    const [amigoActivo, setAmigoActivo] = useState(null);
    const [mensaje, setMensaje] = useState('');
    const [chatLog, setChatLog] = useState([]);

    useEffect(() => {
        cargarAmigos();
        
        socket.on('receive_message', (data) => {
            setChatLog((prev) => [...prev, data]);
        });

        return () => socket.off('receive_message');
    }, []);

    const cargarAmigos = async () => {
        try {
            const { data } = await api.get(`/friends/${user.id}`);
            setAmigos(data);
        } catch (error) {
            console.error('Error cargando amigos');
        }
    };

    const seleccionarAmigo = (amigo) => {
        setAmigoActivo(amigo);
        setChatLog([]); // Limpiar chat anterior
        // Crear un ID de sala único y consistente (ej: "sala_2_5")
        const room = `sala_${[user.id, amigo.id].sort().join('_')}`;
        socket.emit('join_chat', room);
    };

    const enviarMensaje = (e) => {
        e.preventDefault();
        if (mensaje.trim() === '' || !amigoActivo) return;

        const room = `sala_${[user.id, amigoActivo.id].sort().join('_')}`;
        const data = { room, message: mensaje, sender: user.nombre_completo };
        
        socket.emit('send_message', data);
        setMensaje('');
    };

    return (
        <div className="panel" style={{ display: 'flex', height: '500px', maxWidth: '800px', margin: '2rem auto' }}>
            
            {/* Lista de Amigos (Izquierda) */}
            <div style={{ width: '30%', borderRight: '1px solid var(--border-color)', overflowY: 'auto' }}>
                <h3 style={{ padding: '1rem', margin: 0, borderBottom: '1px solid var(--border-color)' }}>Contactos</h3>
                {amigos.length === 0 ? (
                    <p style={{ padding: '1rem', color: 'var(--text-muted)' }}>No tienes amigos aún.</p>
                ) : (
                    amigos.map(a => (
                        <div 
                            key={a.id} 
                            onClick={() => seleccionarAmigo(a)}
                            style={{ 
                                padding: '1rem', 
                                cursor: 'pointer', 
                                borderBottom: '1px solid var(--border-color)',
                                background: amigoActivo?.id === a.id ? 'var(--border-color)' : 'transparent'
                            }}
                        >
                            {a.nombre_completo}
                        </div>
                    ))
                )}
            </div>

            {/* Ventana de Chat (Derecha) */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                {amigoActivo ? (
                    <>
                        <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-base)' }}>
                            <strong style={{ color: 'var(--neon-blue)' }}>Chat con {amigoActivo.nombre_completo}</strong>
                        </div>
                        
                        <div style={{ flex: 1, padding: '1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {chatLog.map((msg, idx) => (
                                <div key={idx} style={{ textAlign: msg.sender === user.nombre_completo ? 'right' : 'left' }}>
                                    <span style={{ 
                                        display: 'inline-block', padding: '0.5rem 1rem', borderRadius: '15px',
                                        background: msg.sender === user.nombre_completo ? 'var(--neon-blue)' : 'var(--border-color)',
                                        color: msg.sender === user.nombre_completo ? 'var(--bg-base)' : 'var(--text-main)'
                                    }}>
                                        {msg.message}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <form onSubmit={enviarMensaje} style={{ display: 'flex', padding: '1rem', borderTop: '1px solid var(--border-color)' }}>
                            <input 
                                style={{ flex: 1, marginRight: '1rem' }} 
                                type="text" 
                                value={mensaje} 
                                onChange={(e) => setMensaje(e.target.value)} 
                                placeholder="Cifra tu mensaje..."
                            />
                            <button type="submit">Enviar</button>
                        </form>
                    </>
                ) : (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                        Selecciona un contacto para iniciar un canal seguro.
                    </div>
                )}
            </div>
        </div>
    );
}