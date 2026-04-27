import { useState, useEffect } from 'react';
import { api } from '../api';

export default function CommentSection({ pubId, user }) {
    const [comentarios, setComentarios] = useState([]);
    const [nuevoComentario, setNuevoComentario] = useState('');

    useEffect(() => {
        cargarComentarios();
    }, [pubId]);

    const cargarComentarios = async () => {
        try {
            const { data } = await api.get(`/publications/${pubId}/comments`);
            setComentarios(data);
        } catch (error) {
            console.error("Error cargando comentarios");
        }
    };

    const handleComentar = async (e) => {
        e.preventDefault();
        if (!nuevoComentario.trim()) return;
        
        try {
            await api.post('/publications/comments', {
                id_publicacion: pubId,
                id_usuario: user.id,
                texto: nuevoComentario
            });
            setNuevoComentario(''); 
            cargarComentarios(); 
        } catch (error) {
            alert("Error al enviar el comentario");
        }
    };

    return (
        <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--bg-base)', borderRadius: '4px', border: '1px dashed var(--pip-green-dark)' }}>
            <h4 style={{ margin: '0 0 1rem 0', color: 'var(--neon-blue)' }}>RESPUESTAS DE LA RED</h4>
            
            <div style={{ maxHeight: '150px', overflowY: 'auto', marginBottom: '1rem', fontSize: '0.9rem' }}>
                {comentarios.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)' }}>[ VACÍO ] Sé el primero en transmitir.</p>
                ) : (
                    comentarios.map(c => (
                        <div key={c.id} style={{ marginBottom: '0.8rem', paddingBottom: '0.8rem', borderBottom: '1px solid var(--border-color)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.3rem' }}>
                                {c.foto_perfil_url ? (
                                    <img src={c.foto_perfil_url} alt="avatar" style={{ width: '25px', height: '25px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--pip-green)' }} />
                                ) : (
                                    <div style={{ width: '25px', height: '25px', borderRadius: '50%', border: '1px dashed var(--pip-green-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem' }}>U</div>
                                )}
                                <strong style={{ color: 'var(--text-main)' }}>{c.nombre_completo}: </strong> 
                            </div>
                            <span style={{ color: 'var(--text-muted)', display: 'block', paddingLeft: '33px' }}>{c.texto}</span>
                        </div>
                    ))
                )}
            </div>

            <form onSubmit={handleComentar} style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                    type="text"
                    value={nuevoComentario}
                    onChange={(e) => setNuevoComentario(e.target.value)}
                    placeholder="Escribe un comentario..."
                    style={{ flex: 1, padding: '0.5rem' }}
                />
                <button type="submit" style={{ padding: '0.5rem 1rem' }}>ENVIAR</button>
            </form>
        </div>
    );
}