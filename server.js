const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);

// Configuración de Socket.io permitiendo conexiones desde cualquier lugar (Netlify, APK, etc.)
const io = new Server(server, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST"]
  }
});

// Variable para recordar qué pasajero pidió el último viaje
let ultimoPasajero = null;

io.on('connection', (socket) => {
    console.log('Un usuario se conectó:', socket.id);

    // 1. Conductor se conecta
    socket.on('estado_online', (datos) => {
        console.log('Conductor disponible:', datos);
        socket.join('conductores');
    });

    // 2. Conductor se desconecta
    socket.on('estado_offline', () => {
        console.log('Conductor fuera de línea');
        socket.leave('conductores');
    });

    // 3. Pasajero pide un viaje
    socket.on('solicitar_viaje', (datosViaje) => {
        console.log('Solicitud recibida:', datosViaje);
        ultimoPasajero = socket.id; // Guardamos la identidad del pasajero
        // Reenviamos la alerta a todos (los conductores lo verán si coincide el vehículo)
        socket.broadcast.emit('nueva_solicitud', datosViaje);
    });

    // 4. Conductor acepta el viaje
    socket.on('viaje_aceptado', () => {
        console.log('Viaje aceptado por un conductor');
        if (ultimoPasajero) {
            // Le enviamos la notificación SOLO al pasajero que pidió el viaje
            io.to(ultimoPasajero).emit('viaje_aceptado');
            ultimoPasajero = null; // Reiniciamos para el siguiente viaje
        } else {
            // Respaldo por si acaso
            socket.broadcast.emit('viaje_aceptado');
        }
    });

    // 5. Ubicación en tiempo real
    socket.on('actualizar_ubicacion', (ubicacion) => {
        socket.broadcast.emit('ubicacion_conductor', ubicacion);
    });

    socket.on('disconnect', () => {
        console.log('Usuario desconectado:', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Servidor corriendo perfectamente en el puerto ${PORT}`);
});
