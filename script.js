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
const gravity = 0.4;
const jumpStrength = -8;

const pipeWidth = 60;
const pipeGap = 180; // wider gap between top and bottom pipes
const pipeSpacing = 250; // more space between pipe pairs
const pipeSpeed = 2.5;
let pipes = [];

let score = 0;
let gameState = 'start';

function setCanvasSize() {
  canvas.width = 400;
  canvas.height = 600;
}
setCanvasSize();

function drawBackground() {
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, '#ff5e5b');
  gradient.addColorStop(0.2, '#ff774e');
  gradient.addColorStop(0.4, '#ff9966');
  gradient.addColorStop(0.6, '#ffcc70');
  gradient.addColorStop(0.8, '#ffe29a');
  gradient.addColorStop(1, '#fef9d7');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawHeart() {
  ctx.drawImage(heartImg, heartX, heartY, heartSize, heartSize);
}

function drawPipes() {
  pipes.forEach(pipe => {
    const gradient = ctx.createLinearGradient(pipe.x, 0, pipe.x, canvas.height);
    gradient.addColorStop(0, '#4CAF50');
    gradient.addColorStop(1, '#2E7D32');
    ctx.fillStyle = gradient;
    ctx.strokeStyle = '#1B5E20';
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.rect(pipe.x, pipe.y, pipeWidth, pipe.height);
    ctx.fill();
    ctx.stroke();

    const bottomY = pipe.y + pipe.height + pipeGap;
    ctx.beginPath();
    ctx.rect(pipe.x, bottomY, pipeWidth, canvas.height - bottomY);
    ctx.fill();
    ctx.stroke();
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
  resetGame();
  gameState = 'playing';
  hideAllScreens();
  requestAnimationFrame(gameLoop);
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
