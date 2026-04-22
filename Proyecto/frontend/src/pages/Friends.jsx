// frontend/src/pages/Friends.jsx
import { useState, useEffect } from 'react';
import { api } from '../api';

export default function Friends({ user }) {
    const [noAmigos, setNoAmigos] = useState([]);
    const [pendientes, setPendientes] = useState([]);

    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        try {
            const [resSugerencias, resPendientes] = await Promise.all([
                api.get(`/users/${user.id}/non-friends`),
                api.get(`/friends/pending/${user.id}`)
            ]);
            setNoAmigos(resSugerencias.data);
            setPendientes(resPendientes.data);
        } catch (error) {
            console.error('Error cargando datos de amigos');
        }
    };

    const enviarSolicitud = async (id_amigo) => {
        try {
            await api.post('/friends/request', { id_usuario1: user.id, id_usuario2: id_amigo });
            alert('Solicitud enviada');
            cargarDatos();
        } catch (error) {
            alert('Error al enviar solicitud');
        }
    };

    const responderSolicitud = async (id_remitente, nuevoEstado) => {
        try {
            // nuevoEstado será 'aceptada' o 'rechazada' 
            await api.put('/friends/respond', { 
                id_usuario1: id_remitente, 
                id_usuario2: user.id, 
                estado: nuevoEstado 
            });
            alert(`Solicitud ${nuevoEstado}`);
            cargarDatos();
        } catch (error) {
            alert('Error al responder solicitud');
        }
    };

    return (
        <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
            
            {/* SECCIÓN 1: SOLICITUDES RECIBIDAS */}
            <div className="panel" style={{ padding: '1rem', marginBottom: '2rem' }}>
                <h3 style={{ color: 'var(--neon-blue)', marginTop: 0 }}>Solicitudes Recibidas</h3>
                {pendientes.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)' }}>No tienes solicitudes pendientes.</p>
                ) : (
                    pendientes.map(u => (
                        <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 0', borderBottom: '1px solid var(--border-color)' }}>
                            <span>{u.nombre_completo}</span>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button onClick={() => responderSolicitud(u.id, 'aceptada')}>Aceptar</button>
                                <button 
                                    onClick={() => responderSolicitud(u.id, 'rechazada')}
                                    style={{ borderColor: '#ff4b2b', color: '#ff4b2b' }}
                                >
                                    Rechazar
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* SECCIÓN 2: SUGERENCIAS */}
            <div className="panel" style={{ padding: '1rem' }}>
                <h3 style={{ color: 'var(--neon-blue)', marginTop: 0 }}>Sugerencias de Amistad</h3>
                {noAmigos.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)' }}>No hay más usuarios registrados.</p>
                ) : (
                    noAmigos.map(u => (
                        <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 0', borderBottom: '1px solid var(--border-color)' }}>
                            <span>{u.nombre_completo}</span>
                            <button onClick={() => enviarSolicitud(u.id)}>Agregar</button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}