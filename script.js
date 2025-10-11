const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const startScreen = document.getElementById('startScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const startButton = document.getElementById('startButton');
const restartButton = document.getElementById('restartButton');
const finalScoreDisplay = document.getElementById('finalScore');

// Sounds
const jumpSound = new Audio('assets/jump.wav');
const scoreSound = new Audio('assets/score.wav');
const gameOverSound = new Audio('assets/gameover.wav');

// Game variables
const heartSize = 35;
let heartX = 50;
let heartY = 250;
let velocity = 0;
const gravity = 0.4;
const jumpStrength = -8;

const pipeWidth = 60;
const pipeGap = 150;
const pipeSpeed = 3;
let pipes = [];

let score = 0;
let gameState = 'start';

const heartImg = new Image();
heartImg.src = 'assets/heart.png';

function setCanvasSize() {
    canvas.width = 400;
    canvas.height = 600;
}
setCanvasSize();

function drawHeart() {
    ctx.drawImage(heartImg, heartX, heartY, heartSize, heartSize);
}

function drawPipes() {
    pipes.forEach(pipe => {
        const gradient = ctx.createLinearGradient(pipe.x, 0, pipe.x, canvas.height);
        gradient.addColorStop(0, '#32CD32');
        gradient.addColorStop(1, '#006400');
        ctx.fillStyle = gradient;

        // Top pipe
        ctx.fillRect(pipe.x, pipe.y, pipeWidth, pipe.height);
        ctx.fillRect(pipe.x - 5, pipe.y + pipe.height - 20, pipeWidth + 10, 20);

        // Bottom pipe
        ctx.fillRect(pipe.x, pipe.y + pipe.height + pipeGap, pipeWidth, canvas.height - (pipe.height + pipeGap));
        ctx.fillRect(pipe.x - 5, pipe.y + pipe.height + pipeGap, pipeWidth + 10, 20);
    });
}

function drawScore() {
    if (!document.querySelector('.score-container')) {
        const scoreContainer = document.createElement('div');
        scoreContainer.classList.add('score-container');
        document.body.appendChild(scoreContainer);
    }
    document.querySelector('.score-container').textContent = score;
}

function showStartScreen() {
    startScreen.classList.remove('hidden');
    gameOverScreen.classList.add('hidden');
    const scoreContainer = document.querySelector('.score-container');
    if (scoreContainer) scoreContainer.style.display = 'none';
}

function hideAllScreens() {
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    const scoreContainer = document.querySelector('.score-container');
    if (scoreContainer) scoreContainer.style.display = 'block';
}

function showGameOverScreen() {
    gameOverScreen.classList.remove('hidden');
    finalScoreDisplay.textContent = score;
    const scoreContainer = document.querySelector('.
