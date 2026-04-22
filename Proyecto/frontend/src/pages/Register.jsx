import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../api';

export default function Register() {
    const [formData, setFormData] = useState({
        nombre_completo: '',
        correo: '',
        dpi: '',
        contrasena: ''
    });
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        try {
            // Simulamos un cognito_sub temporal para no romper la restricción de la BD local
            const payload = { ...formData, cognito_sub: `local-${Date.now()}` };
            
            await api.post('/auth/register', payload);
            alert('Registro exitoso. Ahora puedes iniciar sesión.');
            navigate('/'); // Redirige al login
        } catch (error) {
            alert('Error en registro: ' + (error.response?.data?.error || 'Desconocido'));
        }
    };

    return (
        <div style={{ padding: '2rem', maxWidth: '400px', margin: '0 auto' }}>
            <h2>Registro en Semi-Social</h2>
            <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <input 
                    type="text" name="nombre_completo" placeholder="Nombre Completo" 
                    required onChange={handleChange} 
                />
                <input 
                    type="email" name="correo" placeholder="Correo" 
                    required onChange={handleChange} 
                />
                <input 
                    type="text" name="dpi" placeholder="DPI" 
                    required onChange={handleChange} 
                />
                <input 
                    type="password" name="contrasena" placeholder="Contraseña" 
                    required onChange={handleChange} 
                />
                <button type="submit">Registrarse</button>
            </form>
            <p style={{ marginTop: '1rem', textAlign: 'center' }}>
                ¿Ya tienes cuenta? <Link to="/">Inicia sesión aquí</Link>
            </p>
        </div>
    );
}