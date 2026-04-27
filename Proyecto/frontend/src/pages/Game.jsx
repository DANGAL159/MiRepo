import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { api, SERVER_ROOT } from '../api';

const socket = io(SERVER_ROOT, {
    transports: ['websocket', 'polling']
});

export default function Game({ user }) {
    const [amigos, setAmigos] = useState([]);
    const [amigoActivo, setAmigoActivo] = useState(null);
    const [tablero, setTablero] = useState(Array(9).fill(null));
    const [turnoActual, setTurnoActual] = useState('X');

    // Lógica para asignar símbolo determinista sin usar base de datos
    const miSimbolo = amigoActivo ? (user.id < amigoActivo.id ? 'X' : 'O') : null;
    const esMiTurno = turnoActual === miSimbolo;

    useEffect(() => {
        cargarAmigos();

        const handleConnect = () => {
            if (amigoActivo) {
                const room = `juego_${[user.id, amigoActivo.id].sort().join('_')}`;
                socket.emit('join_game', room);
            }
        };
        socket.on('connect', handleConnect);

        socket.on('receive_move', (data) => {
            setTablero(data.nuevoTablero);
            setTurnoActual(data.siguienteTurno);
        });

        socket.on('game_reset', () => {
            setTablero(Array(9).fill(null));
            setTurnoActual('X');
        });

        return () => {
            socket.off('connect', handleConnect);
            socket.off('receive_move');
            socket.off('game_reset');
        };
    }, [amigoActivo, user]);

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
        setTablero(Array(9).fill(null));
        setTurnoActual('X');
        const room = `juego_${[user.id, amigo.id].sort().join('_')}`;
        socket.emit('join_game', room);
    };

    const lineasGanadoras = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], 
        [0, 3, 6], [1, 4, 7], [2, 5, 8], 
        [0, 4, 8], [2, 4, 6]             
    ];

    const calcularGanador = (cuadros) => {
        for (let i = 0; i < lineasGanadoras.length; i++) {
            const [a, b, c] = lineasGanadoras[i];
            if (cuadros[a] && cuadros[a] === cuadros[b] && cuadros[a] === cuadros[c]) {
                return cuadros[a];
            }
        }
        return null;
    };

    const ganador = calcularGanador(tablero);
    const empate = !ganador && !tablero.includes(null);

    const jugarTurno = (indice) => {
        if (tablero[indice] || ganador || !esMiTurno) return;

        const nuevoTablero = [...tablero];
        nuevoTablero[indice] = miSimbolo;
        const siguienteTurno = miSimbolo === 'X' ? 'O' : 'X';
        
        setTablero(nuevoTablero);
        setTurnoActual(siguienteTurno);

        const room = `juego_${[user.id, amigoActivo.id].sort().join('_')}`;
        socket.emit('make_move', { room, nuevoTablero, siguienteTurno });
    };

    const reiniciarJuego = () => {
        setTablero(Array(9).fill(null));
        setTurnoActual('X');
        const room = `juego_${[user.id, amigoActivo.id].sort().join('_')}`;
        socket.emit('reset_game', room);
    };

    const MiniAvatar = ({ url }) => (
        url ? (
            <img src={url} alt="avatar" style={{ width: '35px', height: '35px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--pip-green)' }} />
        ) : (
            <div style={{ width: '35px', height: '35px', borderRadius: '50%', border: '1px dashed var(--pip-green-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem' }}>U</div>
        )
    );

    return (
        <div className="panel" style={{ display: 'flex', height: '550px', maxWidth: '800px', margin: '2rem auto' }}>
            
            {/* Panel de Contactos */}
            <div style={{ width: '35%', borderRight: '1px solid var(--border-color)', overflowY: 'auto' }}>
                <h3 style={{ padding: '1rem', margin: 0, borderBottom: '1px solid var(--border-color)' }}>Desafiantes</h3>
                {amigos.length === 0 ? (
                    <p style={{ padding: '1rem', color: 'var(--text-muted)' }}>Agrega contactos para jugar.</p>
                ) : (
                    amigos.map(a => (
                        <div
                            key={a.id}
                            onClick={() => seleccionarAmigo(a)}
                            style={{
                                padding: '1rem', cursor: 'pointer', borderBottom: '1px solid var(--border-color)',
                                background: amigoActivo?.id === a.id ? 'var(--pip-surface-light)' : 'transparent',
                                display: 'flex', alignItems: 'center', gap: '10px'
                            }}
                        >
                            <MiniAvatar url={a.foto_perfil_url} />
                            <span>{a.nombre_completo}</span>
                        </div>
                    ))
                )}
            </div>

            {/* Panel de Juego */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2rem' }}>
                {amigoActivo ? (
                    <>
                        <h2 style={{ color: 'var(--neon-blue)', marginBottom: '0.5rem', letterSpacing: '2px' }}>
                            ENLACE DE JUEGO // {amigoActivo.nombre_completo.toUpperCase()}
                        </h2>
                        
                        <div style={{ color: 'var(--pip-green-dim)', marginBottom: '1rem', fontSize: '0.9rem' }}>
                            TU SÍMBOLO ASIGNADO: [{miSimbolo}]
                        </div>

                        <div style={{ marginBottom: '2rem', height: '30px' }}>
                            {ganador ? (
                                <strong style={{ color: 'var(--pip-amber)', fontSize: '1.2rem', animation: 'pulse 1s infinite' }}>
                                    [ VICTORIA PARA {ganador === miSimbolo ? 'TI' : 'EL OPONENTE'} ]
                                </strong>
                            ) : empate ? (
                                <strong style={{ color: 'var(--pip-red)', fontSize: '1.2rem' }}>
                                    [ EMPATE TÁCTICO ]
                                </strong>
                            ) : (
                                <span style={{ color: 'var(--pip-green)', fontSize: '1.1rem' }}>
                                    {esMiTurno ? '> TU TURNO' : 'ESPERANDO AL OPONENTE...'}
                                </span>
                            )}
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', maxWidth: '300px' }}>
                            {tablero.map((casilla, index) => (
                                <button
                                    key={index}
                                    onClick={() => jugarTurno(index)}
                                    disabled={casilla !== null || ganador || !esMiTurno}
                                    style={{
                                        width: '90px', height: '90px', fontSize: '3rem', display: 'flex',
                                        alignItems: 'center', justifyContent: 'center',
                                        background: casilla ? 'var(--pip-surface-light)' : 'transparent',
                                        color: casilla === miSimbolo ? 'var(--neon-blue)' : 'var(--pip-amber)',
                                        border: '2px solid var(--pip-green-dark)',
                                        cursor: (casilla || ganador || !esMiTurno) ? 'not-allowed' : 'pointer'
                                    }}
                                >
                                    {casilla}
                                </button>
                            ))}
                        </div>

                        <button onClick={reiniciarJuego} style={{ marginTop: '2rem', width: '250px' }}>
                            REINICIAR TABLERO
                        </button>
                    </>
                ) : (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                        Selecciona un adversario en el panel izquierdo.
                    </div>
                )}
            </div>
        </div>
    );
}