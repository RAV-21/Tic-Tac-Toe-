// REPLACE WITH YOUR ACTUAL RENDER URL
const socket = io("https://tic-tac-toe-k1yo.onrender.com");

let roomCode, turnTimer, mySymbol, isMyTurn = false, gameActive = false;
let gameState = ["", "", "", "", "", "", "", "", ""];

function joinGame() {
    roomCode = document.getElementById('roomInput').value;
    if (roomCode.length === 5) {
        socket.emit('joinRoom', roomCode);
        document.getElementById('room-overlay').classList.add('hidden');
        document.getElementById('status').textContent = "WAITING FOR PARTNER...";
    }
}

socket.on('assignPlayer', (symbol) => {
    mySymbol = symbol;
    isMyTurn = (symbol === "X");
    gameActive = true;
    updateUI();
    startTimer();
});

function updateUI() {
    const status = document.getElementById('status');
    status.textContent = isMyTurn ? "YOUR TURN" : "PARTNER'S TURN";
    status.style.color = isMyTurn ? "#00ffcc" : "#ff0055";
}

document.querySelectorAll('.cell').forEach(cell => {
    cell.addEventListener('click', (e) => {
        const idx = e.target.dataset.index;
        // BUG FIX: Only allow move if it's your turn AND cell is empty
        if (gameActive && isMyTurn && gameState[idx] === "") {
            isMyTurn = false; // Lock turn
            applyMove(idx, mySymbol);
            socket.emit('makeMove', { index: idx, player: mySymbol, room: roomCode });
            updateUI();
        }
    });
});

socket.on('moveMade', (data) => {
    applyMove(data.index, data.player);
    isMyTurn = true; // Unlock turn
    updateUI();
});

function applyMove(idx, player) {
    gameState[idx] = player;
    const cell = document.querySelector(`[data-index="${idx}"]`);
    cell.textContent = player;
    cell.classList.add(player.toLowerCase());
    startTimer();
    checkWin();
}

function startTimer() {
    clearInterval(turnTimer);
    let time = 10;
    document.getElementById('timer').textContent = time + "s";
    turnTimer = setInterval(() => {
        time--;
        document.getElementById('timer').textContent = time + "s";
        if (time <= 0) {
            clearInterval(turnTimer);
            isMyTurn = !isMyTurn; // Skip turn
            updateUI();
            startTimer();
        }
    }, 1000);
}

function checkWin() {
    const wins = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    const won = wins.some(c => gameState[c[0]] && gameState[c[0]] === gameState[c[1]] && gameState[c[1]] === gameState[c[2]]);
    if (won || !gameState.includes("")) {
        gameActive = false;
        clearInterval(turnTimer);
        document.getElementById('status').textContent = won ? "VICTORY!" : "DRAW!";
        document.getElementById('restartBtn').classList.remove('hidden');
    }
}

document.getElementById('restartBtn').onclick = () => socket.emit('requestRestart', roomCode);
socket.on('gameRestarted', () => location.reload());