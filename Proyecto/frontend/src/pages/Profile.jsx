import { useState } from 'react';
import { api, uploadImage } from '../api';

export default function Profile({ user, setUser }) {
    const [formData, setFormData] = useState({
        nombre_completo: user.nombre_completo,
        dpi: user.dpi,
        contrasena_actual: ''
    });
    const [archivo, setArchivo] = useState(null);

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            let fotoUrl = user.foto_perfil_url;
            if (archivo) {
                const lambdaRes = await uploadImage(archivo.base64, archivo.name, 'Fotos_Perfil');
                fotoUrl = lambdaRes.url;
            }

            const { data } = await api.put(`/users/${user.id}`, {
                ...formData,
                foto_perfil_url: fotoUrl
            });
            
            const updatedUser = { ...user, ...data.user };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            setUser(updatedUser);
            alert('Perfil actualizado con éxito');
        } catch (error) {
            alert('Error: ' + (error.response?.data?.error || 'Contraseña incorrecta'));
        }
    };

    return (
        <div style={{ padding: '2rem', maxWidth: '400px', margin: '0 auto' }}>
            <h2>Mi Perfil</h2>
            <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <input 
                    type="text" value={formData.nombre_completo} required
                    onChange={(e) => setFormData({...formData, nombre_completo: e.target.value})} 
                />
                <input 
                    type="text" value={formData.dpi} required
                    onChange={(e) => setFormData({...formData, dpi: e.target.value})} 
                />
                <input type="file" accept="image/*" onChange={(e) => {
                    const file = e.target.files[0];
                    const reader = new FileReader();
                    reader.onloadend = () => setArchivo({ base64: reader.result, name: file.name });
                    reader.readAsDataURL(file);
                }} />
                <input 
                    type="password" placeholder="Contraseña Actual (Obligatoria)" required
                    onChange={(e) => setFormData({...formData, contrasena_actual: e.target.value})} 
                />
                <button type="submit">Guardar Cambios</button>
            </form>
        </div>
    );
}