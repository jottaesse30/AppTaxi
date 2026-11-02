const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

const io = new Server(server, { 
    cors: { 
        origin: "*",
        methods: ["GET", "POST"]
    } 
});

const conductoresActivos = new Map();

io.on('connection', (socket) => {
    console.log('Nuevo dispositivo conectado:', socket.id);

    socket.on('estado_online', (datosUbicacion) => {
        conductoresActivos.set(socket.id, { 
            id: socket.id, 
            lat: datosUbicacion.lat, 
            lng: datosUbicacion.lng, 
            estado: 'disponible' 
        });
        console.log(`Conductor ${socket.id} online.`);
    });

    socket.on('actualizar_ubicacion', (coords) => {
        if (conductoresActivos.has(socket.id)) {
            const conductor = conductoresActivos.get(socket.id);
            conductor.lat = coords.lat;
            conductor.lng = coords.lng;
            conductoresActivos.set(socket.id, conductor);
        }
    });

    socket.on('estado_offline', () => {
        conductoresActivos.delete(socket.id);
        console.log(`Conductor ${socket.id} offline.`);
    });

    socket.on('disconnect', () => {
        conductoresActivos.delete(socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});