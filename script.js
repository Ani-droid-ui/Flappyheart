const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const startScreen = document.getElementById('startScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const startButton = document.getElementById('startButton');
const restartButton = document.getElementById('restartButton');
const finalScoreDisplay = document.getElementById('finalScore');

const jumpSound = new Audio('assets/jump.mp3');
const scoreSound = new Audio('assets/score.mp3');
const gameOverSound = new Audio('assets/gameover.mp3');

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

function drawBackground() {
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#fcefee');
    gradient.addColorStop(0.5, '#fbe8d3');
    gradient.addColorStop(1, '#e6f0ff');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawHeart() {
    ctx.drawImage(heartImg, heartX, heartY, heartSize, heartSize);
}

function drawPipes() {
    pipes.forEach(pipe => {
        const pipeGradient = ctx.createLinearGradient(pipe.x, 0, pipe.x, canvas.height);
        pipeGradient.addColorStop(0, '#b0eacd');
        pipeGradient.addColorStop(1, '#7ec8a9');
        ctx.fillStyle = pipeGradient;

        ctx.fillRect(pipe.x, pipe.y, pipeWidth, pipe.height);
        ctx.fillRect(pipe.x, pipe.y + pipe.height + pipeGap, pipeWidth, canvas.height - (pipe.height + pipeGap));
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
    const scoreContainer = document.querySelector('.score-container');
    if (scoreContainer) scoreContainer.style.display = 'none';
    gameOverSound.play();
}

function jump() {
    if (gameState === 'playing') {
        velocity = jumpStrength;
        jumpSound.play();
    }
}

function startGame() {
    gameState = 'playing';
    resetGame();
    hideAllScreens();
    setTimeout(() => {
        gameLoop();
    }, 200);
}

function endGame() {
    gameState = 'gameOver';
    showGameOverScreen();
}

function resetGame() {
    heartY = canvas.height / 2;
    velocity = 0;
    pipes = [];
    score = 0;
}

function update() {
    if (gameState !== 'playing') return;

    velocity += gravity;
    heartY += velocity;

    if (heartY + heartSize > canvas.height || heartY < 0) {
        endGame();
    }

    pipes.forEach(pipe => pipe.x -= pipeSpeed);

    if (pipes.length === 0 || pipes[pipes.length - 1].x < canvas.width - 200) {
        const pipeHeight = Math.floor(Math.random() * (canvas.height - pipeGap - 100)) + 50;
pipes.push({ x: canvas.width, y: 0, height: pipeHeight, passed: false });
    pipes.forEach(pipe => {
        if (pipe.x + pipeWidth < heartX && !pipe.passed) {
            score++;
            pipe.passed = true;
            scoreSound.play();
        }
    });

    if (pipes.length > 0 && pipes[0].x < -pipeWidth) {
        pipes.shift();
    }

    pipes.forEach(pipe => {
        if (
            heartX < pipe.x + pipeWidth &&
            heartX + heartSize > pipe.x &&
            (heartY < pipe.y + pipe.height || heartY + heartSize > pipe.y + pipe.height + pipeGap)
        ) {
            endGame();
        }
    });
}

function gameLoop() {
    if (gameState === 'playing' || gameState === 'gameOver') {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawBackground();
        update();
        drawPipes();
        drawHeart();
        if (gameState === 'playing') drawScore();
        requestAnimationFrame(gameLoop);
    }
}

document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') handleInput();
});
document.addEventListener('mousedown', handleInput);
startButton.addEventListener('click', startGame);
restartButton.addEventListener('click', startGame);

function handleInput() {
    if (gameState === 'playing') jump();
}

showStartScreen();
