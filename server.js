const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

const rooms = {};

io.on('connection', (socket) => {
    socket.on('joinRoom', (roomCode) => {
        socket.join(roomCode);
        if (!rooms[roomCode]) rooms[roomCode] = { ready: [] };
    });

    socket.on('makeMove', (data) => {
        socket.to(data.room).emit('moveMade', data);
    });

    socket.on('requestRestart', (roomCode) => {
        if (!rooms[roomCode].ready.includes(socket.id)) {
            rooms[roomCode].ready.push(socket.id);
        }
        if (rooms[roomCode].ready.length === 2) {
            io.in(roomCode).emit('gameRestarted');
            rooms[roomCode].ready = [];
        }
    });

    socket.on('terminateRoom', (roomCode) => {
        io.in(roomCode).emit('roomClosed');
        delete rooms[roomCode];
    });
});

// CRITICAL FOR RENDER: Use process.env.PORT and listen on 0.0.0.0
const PORT = process.env.PORT || 10000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
});