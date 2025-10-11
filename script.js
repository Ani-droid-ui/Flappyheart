const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game variables
const birdSize = 35;
let birdX = 50;
let birdY = 250;
let velocity = 0;
const gravity = 0.6;
const jumpStrength = -10;

const pipeWidth = 50;
const pipeGap = 150;
const pipeSpeed = 3;
let pipes = [];

let score = 0;
let gameOver = false;

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
    // Create the pink-to-red gradient for the heart
    const heartGradient = ctx.createLinearGradient(birdX, birdY, birdX, birdY + birdSize);
    heartGradient.addColorStop(0, 'pink');
    heartGradient.addColorStop(1, 'red');

    drawHeart(birdX + birdSize / 2, birdY, birdSize, heartGradient);
}

function drawPipes() {
    ctx.fillStyle = 'rgba(255, 140, 0, 0.6)'; // Semi-transparent dark orange for dimmed look
    pipes.forEach(pipe => {
        ctx.fillRect(pipe.x, pipe.y, pipeWidth, pipe.height);
        ctx.fillRect(pipe.x, pipe.y + pipe.height + pipeGap, pipeWidth, canvas.height - (pipe.height + pipeGap));
    });
}

function drawScore() {
    ctx.fillStyle = '#fff'; // White text for better contrast
    ctx.font = '24px Arial';
    ctx.fillText('Score: ' + score, 10, 30);
}

function drawGameOver() {
    ctx.fillStyle = '#fff'; // White text for better contrast
    ctx.font = '36px Arial';
    ctx.fillText('Game Over', canvas.width / 2 - 90, canvas.height / 2);
    ctx.font = '24px Arial';
    ctx.fillText('Click to Restart', canvas.width / 2 - 90, canvas.height / 2 + 40);
}

// Game logic (remains mostly the same)
function update() {
    if (gameOver) return;

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

    // Update score logic
    pipes.forEach(pipe => {
        if (pipe.x + pipeWidth < birdX && !pipe.passed) {
            score++;
            pipe.passed = true;
        }
    });

    // Remove old pipes
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

// Event listeners
function jump() {
    if (!gameOver) {
        velocity = jumpStrength;
    }
}

function handleInput() {
    if (gameOver) {
        resetGame();
    } else {
        jump();
    }
}

document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        handleInput();
    }
});

document.addEventListener('mousedown', () => {
    handleInput();
});

// Game flow
function endGame() {
    gameOver = true;
}

function resetGame() {
    birdY = 250;
    velocity = 0;
    pipes = [];
    score = 0;
    gameOver = false;
    gameLoop();
}

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    update();
    drawPipes();
    drawBird();
    drawScore();
    if (gameOver) {
        drawGameOver();
    }
    requestAnimationFrame(gameLoop);
}

// Start the game
gameLoop();
