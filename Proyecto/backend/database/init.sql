-- init.sql

-- Tabla de Usuarios
-- Almacenará la información básica, contraseña para cumplir con rúbrica, y el estado de Cognito.
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    cognito_sub VARCHAR(255) UNIQUE, -- Para enlazar con AWS Cognito
    nombre_completo VARCHAR(150) NOT NULL,
    correo VARCHAR(150) UNIQUE NOT NULL,
    dpi VARCHAR(20) UNIQUE NOT NULL,
    contrasena VARCHAR(255) NOT NULL, -- Obligatorio para cumplir el Criterio 1.5 (MD5)
    foto_perfil_url TEXT, -- URL del bucket de S3
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Amistades
-- Manejará las solicitudes al estilo Facebook.
CREATE TABLE amistades (
    id_usuario1 INT REFERENCES usuarios(id) ON DELETE CASCADE,
    id_usuario2 INT REFERENCES usuarios(id) ON DELETE CASCADE,
    estado VARCHAR(20) CHECK (estado IN ('pendiente', 'aceptada', 'rechazada')),
    fecha_solicitud TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_usuario1, id_usuario2)
);

-- Tabla de Publicaciones
CREATE TABLE publicaciones (
    id SERIAL PRIMARY KEY,
    id_usuario INT REFERENCES usuarios(id) ON DELETE CASCADE,
    imagen_url TEXT NOT NULL, 
    descripcion TEXT, 
    fecha_publicacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Comentarios
CREATE TABLE comentarios (
    id SERIAL PRIMARY KEY,
    id_publicacion INT REFERENCES publicaciones(id) ON DELETE CASCADE,
    id_usuario INT REFERENCES usuarios(id) ON DELETE CASCADE,
    texto TEXT NOT NULL,
    fecha_comentario TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Etiquetas (Rekognition)
CREATE TABLE etiquetas (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) UNIQUE NOT NULL
);

-- Tabla pivote entre Publicaciones y Etiquetas
CREATE TABLE publicacion_etiquetas (
    id_publicacion INT REFERENCES publicaciones(id) ON DELETE CASCADE,
    id_etiqueta INT REFERENCES etiquetas(id) ON DELETE CASCADE,
    PRIMARY KEY (id_publicacion, id_etiqueta)
);