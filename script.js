const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const startScreen = document.getElementById('startScreen');
const howToScreen = document.getElementById('howToScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const startButton = document.getElementById('startButton');
const howToButton = document.getElementById('howToButton');
const howBackButton = document.getElementById('howBackButton');
const howToText = document.getElementById('howToText');
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
let velocity = 0.1;
const gravity = 1;
const jumpStrength = -10.5;

const pipeWidth = 60;
const pipeGap = 180;
const pipeSpacing = 250;
const basePipeSpeed = 3;
let currentPipeSpeed = basePipeSpeed;
let pipes = [];

let pellets = [];
const pelletSize = 20;
const pelletColor = '#ff69b4';

let score = 0;
let gameState = 'start';
let loopId = null;
let highScore = localStorage.getItem('flappyHighScore') || 0;

function setCanvasSize() {
  canvas.width = Math.min(window.innerWidth, 400);
  canvas.height = Math.min(window.innerHeight, 600);
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

    ctx.fillStyle = '#a8d5a2';
    ctx.fillRect(pipe.x, pipe.y, pipeWidth, pipe.height);
    ctx.fillRect(pipe.x, pipe.y + pipe.height + pipeGap, pipeWidth, canvas.height - (pipe.y + pipe.height + pipeGap));

    ctx.fillStyle = '#cbeac0';
    ctx.fillRect(pipe.x, pipe.y, 4, pipe.height);
    ctx.fillRect(pipe.x, pipe.y + pipe.height + pipeGap, 4, canvas.height - (pipe.y + pipe.height + pipeGap));

    ctx.fillStyle = '#7fa87a';
    ctx.fillRect(pipe.x + pipeWidth - 4, pipe.y, 4, pipe.height);
    ctx.fillRect(pipe.x + pipeWidth - 4, pipe.y + pipe.height + pipeGap, 4, canvas.height - (pipe.y + pipe.height + pipeGap));
  });
}

function drawPellets() {
  pellets.forEach(p => {
    if (!p.collected) {
      ctx.fillStyle = p.color || pelletColor;
      ctx.beginPath();
      ctx.arc(p.x + pelletSize / 2, p.y + pelletSize / 2, pelletSize / 2, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

function drawScore() {
  document.querySelector('.score-container').textContent = score;
}

function showStartScreen() {
  howToScreen.classList.add('hidden');
  startScreen.classList.remove('hidden');
  gameOverScreen.classList.add('hidden');
  document.querySelector('.score-container').style.display = 'none';

  const existingHighScore = document.getElementById('startHighScore');
  if (!existingHighScore) {
    const highScoreElement = document.createElement('p');
    highScoreElement.id = 'startHighScore';
    highScoreElement.textContent = `High Score: ${highScore}`;
    highScoreElement.style.marginTop = '15px';
    highScoreElement.style.color = '#666';
    startScreen.appendChild(highScoreElement);
  } else {
    existingHighScore.textContent = `High Score: ${highScore}`;
  }
}

function showHowToScreen() {
  // Display how-to overlay and hide others
  startScreen.classList.add('hidden');
  howToScreen.classList.remove('hidden');
  gameOverScreen.classList.add('hidden');
  document.querySelector('.score-container').style.display = 'none';
}

function hideAllScreens() {
  howToScreen.classList.add('hidden');
  startScreen.classList.add('hidden');
  gameOverScreen.classList.add('hidden');
  document.querySelector('.score-container').style.display = 'block';
}

function showGameOverScreen() {
  howToScreen.classList.add('hidden');
  gameOverScreen.classList.remove('hidden');
  finalScoreDisplay.textContent = score;

  const existingHighScore = document.getElementById('gameHighScore');
  if (!existingHighScore) {
    const highScoreElement = document.createElement('p');
    highScoreElement.id = 'gameHighScore';
    highScoreElement.textContent = `High Score: ${highScore}`;
    highScoreElement.style.marginTop = '10px';
    highScoreElement.style.color = '#666';
    gameOverScreen.appendChild(highScoreElement);
  } else {
    existingHighScore.textContent = `High Score: ${highScore}`;
  }

  document.querySelector('.score-container').style.display = 'none';
  gameOverSound.play();
}

function jump() {
  if (gameState === 'playing') {
    velocity = jumpStrength;
    // ensure the jump sound plays every time
    try { jumpSound.currentTime = 0; } catch (e) {}
    jumpSound.play().catch(() => {});
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
  pellets = [];
  score = 0;
  currentPipeSpeed = basePipeSpeed;
}

function endGame() {
  gameState = 'gameOver';

  if (score > highScore) {
    highScore = score;
    localStorage.setItem('flappyHighScore', highScore);
  }

  showGameOverScreen();
}

function update() {
  if (gameState !== 'playing') return;

  velocity += gravity;
  heartY += velocity;

  if (heartY + heartSize > canvas.height || heartY < 0) {
    endGame();
  }

  pipes.forEach(pipe => pipe.x -= currentPipeSpeed);

  if (pipes.length === 0 || pipes[pipes.length - 1].x < canvas.width - pipeSpacing) {
    const pipeHeight = Math.floor(Math.random() * (canvas.height - pipeGap - 100)) + 50;
    pipes.push({ x: canvas.width, y: 0, height: pipeHeight, passed: false });
  }

  pipes.forEach(pipe => {
    if (pipe.x + pipeWidth < heartX && !pipe.passed) {
      score++;
      pipe.passed = true;
      scoreSound.play();

      if (score % 2 === 0) {
        currentPipeSpeed += 0.02;
      }
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

  // Pellet logic
  pellets.forEach(p => p.x -= currentPipeSpeed);

  if (Math.random() < 0.01 && pipes.length > 0) {
    const lastPipe = pipes[pipes.length - 1];
    const safeMargin = 10;

    const safeZones = [
      { min: 0, max: lastPipe.height - pelletSize - safeMargin },
      { min: lastPipe.height + pipeGap + safeMargin, max: canvas.height - pelletSize }
    ];

    const zone = safeZones[Math.floor(Math.random() * safeZones.length)];
    const bandCount = 3;
    const bandHeight = (zone.max - zone.min) / bandCount;
    const bandIndex = Math.floor(Math.random() * bandCount);
    const pelletY = zone.min + bandIndex * bandHeight + bandHeight / 2 - pelletSize / 2;

    // Decide type: yellow rarer than pink
    if (Math.random() < 0.12) {
      // yellow pellet
      pellets.push({
        x: canvas.width,
        y: pelletY,
        collected: false,
        color: '#ffd54f',
        value: 3
      });
    } else {
      // pink pellet
      pellets.push({
        x: canvas.width,
        y: pelletY,
        collected: false,
        color: '#ff69b4',
        value: 1
      });
    }
  }

  pellets.forEach(p => {
    if (
      !p.collected &&
      heartX < p.x + pelletSize &&
      heartX + heartSize > p.x &&
      heartY < p.y + pelletSize &&
      heartY + heartSize > p.y
    ) {
      p.collected = true;
      score += (p.value || 1);
      scoreSound.play();
    }
  });

  pellets = pellets.filter(p => p.x > -pelletSize && !p.collected);
}

function gameLoop() {
  if (gameState === 'playing') {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground();
    update();
    drawPipes();
    drawPellets();
    drawHeart();
    drawScore();
    loopId = requestAnimationFrame(gameLoop);
  }
}

document.addEventListener('keydown', (e) => {
  if (e.code === 'Space') handleInput();
});
document.addEventListener('mousedown', handleInput);
document.addEventListener('touchstart', handleInput); // Mobile tap support
startButton.addEventListener('click', startGame);
restartButton.addEventListener('click', startGame);

// How-to interactions
howToButton.addEventListener('click', showHowToScreen);
howBackButton.addEventListener('click', showStartScreen);

// Optional: allow editing the how-to text dynamically from console, e.g.:
// document.getElementById('howToText').innerHTML = '<p>Your custom how-to text</p>';

function handleInput() {
  if (gameState === 'playing') jump();
}

showStartScreen();
