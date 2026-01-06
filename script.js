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

// Physics tuned to be less snappy and more realistic, with a slightly higher but not excessive jump.
// Unified gravity used for ascent/descent so jump and fall feel consistent.
const gravity = 0.95;        // reduced gravity for smoother (less snappy) movement
const jumpStrength = -11;   // stronger impulse to make jumps a bit higher (but not too high)
const terminalVelocity = 14; // lower cap to keep movement feeling controlled

const pipeWidth = 60;
const pipeGap = 180;
const pipeSpacing = 250;
const basePipeSpeed = 3.2; // starting speed
let currentPipeSpeed = basePipeSpeed;
let pipes = [];

let pellets = [];
const pelletSize = 20;
const pelletColor = '#ff69b4';

let score = 0;
let gameState = 'start';
let loopId = null;
let highScore = parseInt(localStorage.getItem('flappyHighScore')) || 0;

// Input-hold tracking (used for short-hop behavior)
let isHolding = false;

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

    // Main shaft
    ctx.fillStyle = '#a8d5a2';
    ctx.fillRect(pipe.x, pipe.y, pipeWidth, pipe.height);
    ctx.fillRect(pipe.x, pipe.y + pipe.height + pipeGap, pipeWidth, canvas.height - (pipe.y + pipe.height + pipeGap));

    // Side highlights for cylindrical feel
    ctx.fillStyle = '#cbeac0';
    ctx.fillRect(pipe.x + 6, pipe.y, 6, pipe.height);
    ctx.fillRect(pipe.x + 6, pipe.y + pipe.height + pipeGap, 6, canvas.height - (pipe.y + pipe.height + pipeGap));
    ctx.fillStyle = '#7fa87a';
    ctx.fillRect(pipe.x + pipeWidth - 12, pipe.y, 6, pipe.height);
    ctx.fillRect(pipe.x + pipeWidth - 12, pipe.y + pipe.height + pipeGap, 6, canvas.height - (pipe.y + pipe.height + pipeGap));

    // Rounded cap on the bottom of the upper pipe (top pipe end)
    ctx.save();
    ctx.beginPath();
    ctx.fillStyle = '#6fa464';
    ctx.arc(pipe.x + pipeWidth / 2, pipe.y + pipe.height, pipeWidth / 2, Math.PI, 2 * Math.PI);
    ctx.fill();
    ctx.restore();

    // Rounded cap on the top of the lower pipe (bottom pipe start)
    ctx.save();
    ctx.beginPath();
    ctx.fillStyle = '#6fa464';
    ctx.arc(pipe.x + pipeWidth / 2, pipe.y + pipe.height + pipeGap, pipeWidth / 2, 0, Math.PI);
    ctx.fill();
    ctx.restore();

    // Darker edges/shadows
    ctx.fillStyle = '#5c9064';
    ctx.fillRect(pipe.x, pipe.y, 4, pipe.height);
    ctx.fillRect(pipe.x + pipeWidth - 4, pipe.y, 4, pipe.height);
    ctx.fillRect(pipe.x, pipe.y + pipe.height + pipeGap, 4, canvas.height - (pipe.y + pipe.height + pipeGap));
    ctx.fillRect(pipe.x + pipeWidth - 4, pipe.y + pipe.height + pipeGap, 4, canvas.height - (pipe.y + pipe.height + pipeGap));
  });
}

function drawPellets() {
  pellets.forEach(p => {
    if (!p.collected) {
      ctx.fillStyle = pelletColor;
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

function hideAllScreens() {
  startScreen.classList.add('hidden');
  gameOverScreen.classList.add('hidden');
  document.querySelector('.score-container').style.display = 'block';
}

function showGameOverScreen() {
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
    // Reset vertical velocity to a consistent impulse for reliable consecutive jumps
    velocity = jumpStrength;

    // Ensure jump sound plays every time (reset playback position, play, ignore promise rejection)
    try {
      jumpSound.currentTime = 0;
    } catch (e) {
      // ignore if audio not ready
    }
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

  // Apply unified gravity for ascent and descent to keep jump/fall consistent and more realistic.
  velocity += gravity;

  // Cap terminal velocity
  if (velocity > terminalVelocity) velocity = terminalVelocity;
  if (velocity < -terminalVelocity) velocity = -terminalVelocity;

  heartY += velocity;

  // Cap heart within canvas to avoid flicker
  heartY = Math.max(Math.min(heartY, canvas.height - heartSize), 0);

  if (heartY + heartSize >= canvas.height || heartY <= 0) {
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

      // Slower acceleration with score (less aggressive increase)
      currentPipeSpeed = Math.min(basePipeSpeed + score * 0.06, 7.0);
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

  // Pellet logic - move pellets
  pellets.forEach(p => p.x -= currentPipeSpeed);

  // Spawn pellets only inside the gap (with margin) so they are reachable
  if (Math.random() < 0.014 && pipes.length > 0) {
    const lastPipe = pipes[pipes.length - 1];

    const safeMargin = 22;
    const gapTop = lastPipe.height + safeMargin;
    const gapBottom = lastPipe.height + pipeGap - pelletSize - safeMargin;

    if (gapBottom > gapTop) {
      const pelletY = Math.floor(Math.random() * (gapBottom - gapTop)) + gapTop;
      pellets.push({
        x: canvas.width,
        y: pelletY,
        collected: false
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
      score++;
      scoreSound.play();

      // also slightly speed up when picking up points
      currentPipeSpeed = Math.min(basePipeSpeed + score * 0.06, 7.0);
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

// Input handlers tuned for responsiveness:
// - Allow key auto-repeat (so quick consecutive jumps are possible by tapping/holding space).
// - Short-hop reduces upward velocity on release for tighter control.
const shortHopMultiplier = 0.75;
document.addEventListener('keydown', (e) => {
  if (e.code === 'Space') {
    e.preventDefault(); // prevent page scroll
    isHolding = true;
    handleInput(); // allow auto-repeat to trigger repeated keydown events if key is held
  }
});
document.addEventListener('keyup', (e) => {
  if (e.code === 'Space') {
    isHolding = false;
    // Short-hop: reduce upward velocity to limit height and make jumps more responsive
    if (velocity < 0) velocity *= shortHopMultiplier;
  }
});

document.addEventListener('mousedown', (e) => {
  isHolding = true;
  handleInput();
});
document.addEventListener('mouseup', (e) => {
  isHolding = false;
  if (velocity < 0) velocity *= shortHopMultiplier;
});

document.addEventListener('touchstart', (e) => {
  isHolding = true;
  handleInput();
}, {passive: false});
document.addEventListener('touchend', (e) => {
  isHolding = false;
  if (velocity < 0) velocity *= shortHopMultiplier;
});

startButton.addEventListener('click', startGame);
restartButton.addEventListener('click', startGame);

function handleInput() {
  if (gameState === 'playing') jump();
}

showStartScreen();
