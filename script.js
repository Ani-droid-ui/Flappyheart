const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const startScreen = document.getElementById('startScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const startButton = document.getElementById('startButton');
const restartButton = document.getElementById('restartButton');
const finalScoreDisplay = document.getElementById('finalScore');

// Game variables
const birdSize = 35;
let birdX = 50;
let birdY = 250;
let velocity = 0;
const gravity = 0.6;
const jumpStrength = -10;

const pipeWidth = 60;
const pipeGap = 150;
const pipeSpeed = 3;
let pipes = [];

let score = 0;
let gameState = 'start'; // 'start', 'playing', 'gameOver'

// Set canvas size
function setCanvasSize() {
    canvas.width = 400;
    canvas.height = 600;
}
setCanvasSize();

// --- Heart drawing function (using Bézier curves) ---
function drawHeart(x, y, size, fillGradient) {
    ctx.save();
    ctx.beginPath();
    const topCurveHeight = size * 0.3;
    ctx.moveTo(x, y + topCurveHeight);
    
    // Top left curve
    ctx.bezierCurveTo(x, y, x - size / 2, y, x - size / 2, y + topCurveHeight);
    
    // Bottom left curve
    ctx.bezierCurveTo(x - size / 2, y + (size + topCurveHeight) / 2, x, y + (size + topCurveHeight) / 2, x, y + size);
    
    // Bottom right curve
    ctx.bezierCurveTo(x, y + (size + topCurveHeight) / 2, x + size / 2, y + (size + topCurveHeight) / 2, x + size / 2, y + topCurveHeight);
    
    // Top right curve
    ctx.bezierCurveTo(x + size / 2, y, x, y, x, y + topCurveHeight);
    
    ctx.closePath();
    ctx.fillStyle = fillGradient;
    ctx.fill();
    ctx.strokeStyle = '#000'; // Black border
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
}

// Draw functions (updated to use new assets)
function drawBird() {
    const heartGradient = ctx.createLinearGradient(birdX, birdY, birdX, birdY + birdSize);
    heartGradient.addColorStop(0, 'pink');
    heartGradient.addColorStop(1, 'red');
    drawHeart(birdX + birdSize / 2, birdY, birdSize, heartGradient);
}

function drawPipes() {
    pipes.forEach(pipe => {
        // Draw top pipe
        ctx.fillStyle = 'rgba(255, 140, 0, 0.6)';
        ctx.fillRect(pipe.x, pipe.y, pipeWidth, pipe.height);
        ctx.fillRect(pipe.x - 5, pipe.y + pipe.height - 20, pipeWidth + 10, 20); // Top lip

        // Draw bottom pipe
        ctx.fillRect(pipe.x, pipe.y + pipe.height + pipeGap, pipeWidth, canvas.height - (pipe.height + pipeGap));
        ctx.fillRect(pipe.x - 5, pipe.y + pipe.height + pipeGap, pipeWidth + 10, 20); // Bottom lip
    });
}

function drawScore() {
    // Check if a score container already exists, if not, create one
    if (!document.querySelector('.score-container')) {
        const scoreContainer = document.createElement('div');
        scoreContainer.classList.add('score-container');
        document.body.appendChild(scoreContainer);
    }
    document.querySelector('.score-container').textContent = score;
}

// UI Management
function showStartScreen() {
    startScreen.classList.remove('hidden');
    gameOverScreen.classList.add('hidden');
    // Hide score container
    const scoreContainer = document.querySelector('.score-container');
    if (scoreContainer) scoreContainer.style.display = 'none';
}

function hideAllScreens() {
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    // Show score container
    const scoreContainer = document.querySelector('.score-container');
    if (scoreContainer) scoreContainer.style.display = 'block';
}

function showGameOverScreen() {
    gameOverScreen.classList.remove('hidden');
    finalScoreDisplay.textContent = score;
    // Hide score container
    const scoreContainer = document.querySelector('.score-container');
    if (scoreContainer) scoreContainer.style.display = 'none';
}

// Game flow
function jump() {
    if (gameState === 'playing') {
        velocity = jumpStrength;
    }
}

function startGame() {
    gameState = 'playing';
    resetGame();
    hideAllScreens();
    gameLoop();
}

function endGame() {
    gameState = 'gameOver';
    showGameOverScreen();
}

function resetGame() {
    birdY = 250;
    velocity = 0;
    pipes = [];
    score = 0;
}

// Game logic
function update() {
    if (gameState !== 'playing') return;

    // Bird movement
    velocity += gravity;
    birdY += velocity;

    // Check collision with top and bottom
    if (birdY + birdSize > canvas.height || birdY < 0) {
        endGame();
    }

    // Pipe movement
    pipes.forEach(pipe => {
        pipe.x -= pipeSpeed;
    });

    // Add new pipes
    if (pipes.length === 0 || pipes[pipes.length - 1].x < canvas.width - 200) {
        const pipeHeight = Math.floor(Math.random() * (canvas.height - pipeGap - 100)) + 50;
        pipes.push({ x: canvas.width, y: 0, height: pipeHeight, passed: false });
    }

    // Update score
    pipes.forEach(pipe => {
        if (pipe.x + pipeWidth < birdX && !pipe.passed) {
            score++;
            pipe.passed = true;
        }
    });
    
    // Remove off-screen pipes
    if (pipes.length > 0 && pipes.x < -pipeWidth) {
        pipes.shift();
    }

    // Check pipe collision
    pipes.forEach(pipe => {
        if (
            birdX < pipe.x + pipeWidth &&
            birdX + birdSize > pipe.x &&
            (birdY < pipe.y + pipe.height || birdY + birdSize > pipe.y + pipe.height + pipeGap)
        ) {
            endGame();
        }
    });
}

function gameLoop() {
    if (gameState === 'playing' || gameState === 'gameOver') {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        update();
        drawPipes();
        drawBird();
        if (gameState === 'playing') {
            drawScore();
        }
        requestAnimationFrame(gameLoop);
    }
}

// Event listeners
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        handleInput();
    }
});

document.addEventListener('mousedown', () => {
    handleInput();
});

startButton.addEventListener('click', startGame);
restartButton.addEventListener('click', startGame);

function handleInput() {
    if (gameState === 'playing') {
        jump();
    }
}

// Start the game loop on first load
showStartScreen();
