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
  const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  skyGradient.addColorStop(0, '#fddde6');
  skyGradient.addColorStop(0.3, '#fbb8c1');
  skyGradient.addColorStop(0.6, '#fca3a3');
  skyGradient.addColorStop(0.8, '#fcbf85');
  skyGradient.addColorStop(1, '#fff1a8');
  ctx.fillStyle = skyGradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const sunX = canvas.width / 2;
  const sunY = canvas.height * 0.85;
  const sunRadius = 40;

  ctx.beginPath();
  ctx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2);
  ctx.fillStyle = '#fff1a8';
  ctx.fill();

  const glowGradient = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, sunRadius * 2);
  glowGradient.addColorStop(0, 'rgba(255, 241, 168, 0.4)');
  glowGradient.addColorStop(1, 'rgba(255, 241, 168, 0)');
  ctx.fillStyle = glowGradient;
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunRadius * 2, 0, Math.PI * 2);
  ctx.fill();
}

function drawHeart() {
  ctx.drawImage(heartImg, heartX, heartY, heartSize, heartSize);
}

function drawPipes() {
  pipes.forEach(pipe => {
    ctx.imageSmoothingEnabled = false;

    // Base pipe
    ctx.fillStyle = '#a8d5a2';
    ctx.strokeStyle = '#6c9c6b';
    ctx.lineWidth = 1;

    ctx.beginPath();
    ctx.rect(pipe.x, pipe.y, pipeWidth, pipe.height);
    ctx.fill();
    ctx.stroke();

    // Lighting: left highlight
    ctx.fillStyle = '#cbeac0';
    ctx.fillRect(pipe.x, pipe.y, 4, pipe.height);

    // Lighting: right shadow
    ctx.fillStyle = '#7fa87a';
    ctx.fillRect(pipe.x + pipeWidth - 4, pipe.y, 4, pipe.height);

    // Bottom pipe
    const bottomY = pipe.y + pipe.height + pipeGap;
    ctx.fillStyle = '#a8d5a2';
    ctx.beginPath();
    ctx.rect(pipe.x, bottomY, pipeWidth, canvas.height - bottomY);
    ctx.fill();
    ctx.stroke();

    // Bottom lighting
    ctx.fillStyle = '#cbeac0';
    ctx.fillRect(pipe.x, bottomY, 4, canvas.height - bottomY);
    ctx.fillStyle = '#7fa87a';
    ctx.fillRect(pipe.x + pipeWidth - 4, bottomY, 4, canvas.height - bottomY);
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
