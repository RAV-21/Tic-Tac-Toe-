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
        // Only restarts if BOTH players have clicked
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

server.listen(3000, () => console.log('Server running on port 3000'));