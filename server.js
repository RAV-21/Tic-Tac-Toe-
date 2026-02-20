const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" } // Allows connections from any device/phone
});

app.use(express.static(path.join(__dirname, 'public')));

const rooms = {};

io.on('connection', (socket) => {
    socket.on('joinRoom', (roomCode) => {
        socket.join(roomCode);
        const clients = io.sockets.adapter.rooms.get(roomCode);
        const numClients = clients ? clients.size : 0;
        
        // Assign X to first player, O to second
        const symbol = numClients === 1 ? "X" : "O";
        socket.emit('assignPlayer', symbol);

        if (!rooms[roomCode]) rooms[roomCode] = { ready: [] };
    });

    socket.on('makeMove', (data) => {
        socket.to(data.room).emit('moveMade', data);
    });

    socket.on('requestRestart', (roomCode) => {
        if (rooms[roomCode] && !rooms[roomCode].ready.includes(socket.id)) {
            rooms[roomCode].ready.push(socket.id);
        }
        if (rooms[roomCode] && rooms[roomCode].ready.length === 2) {
            io.in(roomCode).emit('gameRestarted');
            rooms[roomCode].ready = [];
        }
    });
});

// CRITICAL: Render needs 0.0.0.0 to talk to the internet
const PORT = process.env.PORT || 10000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});