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

const heartImg = new Image();
heartImg.src = 'assets/heart.png';

const heartSize = 35;
let heartX = 50;
let heartY = 250;
let velocity = 0;
const gravity = 0.25;
const jumpStrength = -6;

const pipeWidth = 60;
const pipeGap = 180;
const pipeSpacing = 250;
const pipeSpeed = 1.8;
let pipes = [];

let score = 0;
let gameState = 'start';
let loopId = null;

function setCanvasSize() {
  canvas.width = 400;
  canvas.height = 600;
}
setCanvasSize();

function drawBackground() {
  const colors = ['#fddde6', '#fbb8c1', '#fca3a3', '#fcbf85', '#fff1a8'];
  const bandHeight = Math.floor(canvas.height / colors.length);

  colors.forEach((color, i) => {
    ctx.fillStyle = color;
    for (let y = 0; y < bandHeight; y += 4) {
      ctx.fillRect(0, i * bandHeight + y, canvas.width, 4);
    }
  });

  // 8-bit sun
  const sunX = canvas.width / 2;
  const sunY = canvas.height * 0.85;
  const sunSize = 40;

  ctx.fillStyle = '#fff1a8';
  for (let y = -sunSize; y <= sunSize; y += 4) {
    for (let x = -sunSize; x <= sunSize; x += 4) {
      if (x * x + y * y <= sunSize * sunSize) {
        ctx.fillRect(sunX + x, sunY + y, 4, 4);
      }
    }
  }
}

function drawHeart() {
  ctx.drawImage(heartImg, heartX, heartY, heartSize, heartSize);
}

function drawPipes() {
  pipes.forEach(pipe => {
    ctx.imageSmoothingEnabled = false;

    // Base pipe
    ctx.fillStyle = '#a8d5a2';
    ctx.fillRect(pipe.x, pipe.y, pipeWidth, pipe.height);
    ctx.fillRect(pipe.x, pipe.y + pipe.height + pipeGap, pipeWidth, canvas.height - (pipe.y + pipe.height + pipeGap));

    // Left highlight
    ctx.fillStyle = '#cbeac0';
    ctx.fillRect(pipe.x, pipe.y, 4, pipe.height);
    ctx.fillRect(pipe.x, pipe.y + pipe.height + pipeGap, 4, canvas.height - (pipe.y + pipe.height + pipeGap));

    // Right shadow
    ctx.fillStyle = '#7fa87a';
    ctx.fillRect(pipe.x + pipeWidth - 4, pipe.y, 4, pipe.height);
    ctx.fillRect(pipe.x + pipeWidth - 4, pipe.y + pipe.height + pipeGap, 4, canvas.height - (pipe.y + pipe.height + pipeGap));
  });
}

function drawScore() {
  document.querySelector('.score-container').textContent = score;
}

function showStartScreen() {
  startScreen.classList.remove('hidden');
  gameOverScreen.classList.add('hidden');
  document.querySelector('.score-container').style.display = 'none';
}

function hideAllScreens() {
  startScreen.classList.add('hidden');
  gameOverScreen.classList.add('hidden');
  document.querySelector('.score-container').style.display = 'block';
}

function showGameOverScreen() {
  gameOverScreen.classList.remove('hidden');
  finalScoreDisplay.textContent = score;
  document.querySelector('.score-container').style.display = 'none';
  gameOverSound.play();
}

function jump() {
  if (gameState === 'playing') {
    velocity = jumpStrength;
    jumpSound.play();
  }
}

function startGame() {
  if (loopId) cancelAnimationFrame(loopId);
  resetGame();
  gameState = 'playing';
  hideAllScreens();
  loopId = requestAnimationFrame(gameLoop);
}

function resetGame() {
  heartY = canvas.height / 2;
  velocity = 0;
  pipes = [];
  score = 0;
}

function endGame() {
  gameState = 'gameOver';
  showGameOverScreen();
}

function update() {
  if (gameState !== 'playing') return;

  velocity += gravity;
  heartY += velocity;

  if (heartY + heartSize > canvas.height || heartY < 0) {
    endGame();
  }

  pipes.forEach(pipe => pipe.x -= pipeSpeed);

  if (pipes.length === 0 || pipes[pipes.length - 1].x < canvas.width - pipeSpacing) {
    const pipeHeight = Math.floor(Math.random() * (canvas.height - pipeGap - 100)) + 50;
    pipes.push({ x: canvas.width, y: 0, height: pipeHeight, passed: false });
  }

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
  if (gameState === 'playing') {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground();
    update();
    drawPipes();
    drawHeart();
    drawScore();
    loopId = requestAnimationFrame(gameLoop);
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
