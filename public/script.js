const socket = io();
let roomCode, turnTimer, restartTimer;
let timeLeft = 10;
let currentPlayer = "X";
let gameState = ["", "", "", "", "", "", "", "", ""];
let gameActive = false;

function joinGame() {
    roomCode = document.getElementById('roomInput').value;
    if(roomCode.length === 5) {
        socket.emit('joinRoom', roomCode);
        document.getElementById('room-overlay').classList.add('hidden');
        gameActive = true;
        startTurnTimer();
    }
}

function startTurnTimer() {
    clearInterval(turnTimer);
    timeLeft = 10;
    document.getElementById('timer').textContent = timeLeft + "s";
    turnTimer = setInterval(() => {
        timeLeft--;
        document.getElementById('timer').textContent = timeLeft + "s";
        if (timeLeft <= 0) {
            clearInterval(turnTimer);
            // If time is out, current player loses turn
            currentPlayer = currentPlayer === "X" ? "O" : "X"; 
            document.getElementById('status').textContent = `Time out! Player ${currentPlayer}'s turn`;
            startTurnTimer();
        }
    }, 1000);
}

document.querySelectorAll('.cell').forEach(cell => {
    cell.addEventListener('click', (e) => {
        const idx = e.target.dataset.index;
        if (gameState[idx] === "" && gameActive) {
            updateCell(idx, currentPlayer);
            socket.emit('makeMove', { index: idx, player: currentPlayer, room: roomCode });
            checkWinner();
        }
    });
});

socket.on('moveMade', (data) => {
    updateCell(data.index, data.player);
    checkWinner();
});

function updateCell(idx, player) {
    gameState[idx] = player;
    const cell = document.querySelector(`[data-index="${idx}"]`);
    cell.textContent = player;
    cell.classList.add(player.toLowerCase());
    currentPlayer = player === "X" ? "O" : "X";
    document.getElementById('status').textContent = `Player ${currentPlayer}'s turn`;
    startTurnTimer();
}

function checkWinner() {
    const wins = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    const won = wins.some(c => gameState[c[0]] && gameState[c[0]] === gameState[c[1]] && gameState[c[1]] === gameState[c[2]]);
    
    if (won || !gameState.includes("")) {
        gameActive = false;
        clearInterval(turnTimer);
        document.getElementById('status').textContent = won ? "GAME OVER!" : "DRAW!";
        showRestartOption();
    }
}

function showRestartOption() {
    const btn = document.getElementById('restartBtn');
    btn.classList.remove('hidden');
    let wait = 15;
    restartTimer = setInterval(() => {
        wait--;
        btn.textContent = `PLAY AGAIN? (${wait}s)`;
        if (wait <= 0) {
            socket.emit('terminateRoom', roomCode);
        }
    }, 1000);
    btn.onclick = () => {
        btn.textContent = "WAITING FOR PARTNER...";
        btn.disabled = true;
        socket.emit('requestRestart', roomCode);
    };
}

socket.on('gameRestarted', () => {
    clearInterval(restartTimer);
    location.reload(); // Fully resets the game for both
});

socket.on('roomClosed', () => {
    alert("Room Terminated - Player did not respond.");
    location.reload();
});