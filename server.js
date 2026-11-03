const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*", methods: ["GET", "POST"] } });

io.on('connection', (socket) => {
    console.log('Un usuario se conectó:', socket.id);

    socket.on('estado_online', (datos) => { socket.join('conductores'); });
    socket.on('estado_offline', () => { socket.leave('conductores'); });

    socket.on('solicitar_viaje', (datosViaje) => {
        // Añadimos el ID exacto del pasajero a la solicitud
        datosViaje.pasajeroId = socket.id;
        socket.broadcast.emit('nueva_solicitud', datosViaje);
    });

    socket.on('viaje_aceptado', (datos) => {
        if (datos && datos.pasajeroId) {
            // Enviamos la confirmación únicamente a ese pasajero
            io.to(datos.pasajeroId).emit('viaje_aceptado');
        }
    });

    socket.on('actualizar_ubicacion', (ubicacion) => { socket.broadcast.emit('ubicacion_conductor', ubicacion); });
    socket.on('disconnect', () => { console.log('Usuario desconectado:', socket.id); });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => { console.log(`Servidor corriendo en el puerto ${PORT}`); });
