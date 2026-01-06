// Robust, fixed script.js (v12 stable)
// - Includes pink (+1) and yellow (+3) pellets (yellow rarer)
// - Safe pellet spawning inside pipe gaps
// - Rounded/capped pipes drawing
// - Stable audio playback for jump and score
// - Proper start / restart / gameOver flow and input handling
// - Prevents spacebar page scrolling, supports mouse/touch
// - Handles window resize and keeps the game playable
(function () {
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');

  const startScreen = document.getElementById('startScreen');
  const gameOverScreen = document.getElementById('gameOverScreen');
  const startButton = document.getElementById('startButton');
  const restartButton = document.getElementById('restartButton');
  const finalScoreDisplay = document.getElementById('finalScore');

  // audio
  const jumpSound = new Audio('assets/jump.mp3');
  const scoreSound = new Audio('assets/score.mp3');
  const gameOverSound = new Audio('assets/gameover.mp3');

  // image
  const heartImg = new Image();
  heartImg.src = 'assets/heart.png';

  // player
  const heartSize = 35;
  let heartX = 50;
  let heartY = 250;
  let velocity = 0;

const gravity = 0.58;
const jumpStrength = -10;
const terminalVelocity = 17;

const pipeWidth = 60;
const pipeGap = 170;   // slightly more forgiving
const pipeSpacing = 300;
const basePipeSpeed = 2.1;  // smoother, less frantic
let currentPipeSpeed = basePipeSpeed;
let pipes = [];

  // pellets (pink common, yellow rarer)
  let pellets = [];
  const pelletSize = 20;
  const pinkPelletColor = '#ff69b4';
  const yellowPelletColor = '#ffd54f';
  const pinkPelletValue = 1;
  const yellowPelletValue = 3;
  const pelletSpawnChance = 0.012; // per frame spawn chance when spawning conditions met
  const yellowProbability = 0.10; // 10% of pellets are yellow

  // score/state
  let score = 0;
  let gameState = 'start'; // 'start' | 'playing' | 'gameOver'
  let loopId = null;
  let highScore = parseInt(localStorage.getItem('flappyHighScore')) || 0;

  // helpers
  function setCanvasSize() {
    // Keep a reasonable max size for layout
    canvas.width = Math.min(window.innerWidth, 400);
    canvas.height = Math.min(window.innerHeight, 600);
  }
  setCanvasSize();

  // Recompute canvas size on resize and avoid breaking game visually.
  window.addEventListener('resize', () => {
    const prevH = canvas.height;
    setCanvasSize();
    // keep player vertically in bounds after resize
    heartY = Math.max(0, Math.min(heartY, canvas.height - heartSize));
  });

  // Drawing
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
    // If image not loaded yet, draw a simple placeholder
    if (heartImg.complete && heartImg.naturalWidth !== 0) {
      ctx.drawImage(heartImg, heartX, heartY, heartSize, heartSize);
    } else {
      ctx.fillStyle = '#ff6b9a';
      ctx.beginPath();
      ctx.arc(heartX + heartSize / 2, heartY + heartSize / 2, heartSize / 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawPipes() {
    pipes.forEach(pipe => {
      ctx.imageSmoothingEnabled = false;

      // main shafts
      ctx.fillStyle = '#a8d5a2';
      ctx.fillRect(pipe.x, pipe.y, pipeWidth, pipe.height);
      ctx.fillRect(pipe.x, pipe.y + pipe.height + pipeGap, pipeWidth, canvas.height - (pipe.y + pipe.height + pipeGap));

      // side highlights
      ctx.fillStyle = '#cbeac0';
      ctx.fillRect(pipe.x + 6, pipe.y, 6, pipe.height);
      ctx.fillRect(pipe.x + 6, pipe.y + pipe.height + pipeGap, 6, canvas.height - (pipe.y + pipe.height + pipeGap));
      ctx.fillStyle = '#7fa87a';
      ctx.fillRect(pipe.x + pipeWidth - 12, pipe.y, 6, pipe.height);
      ctx.fillRect(pipe.x + pipeWidth - 12, pipe.y + pipe.height + pipeGap, 6, canvas.height - (pipe.y + pipe.height + pipeGap));

      // rounded caps
      ctx.save();
      ctx.fillStyle = '#6fa464';
      // bottom edge of upper pipe (cap)
      ctx.beginPath();
      ctx.arc(pipe.x + pipeWidth / 2, pipe.y + pipe.height, pipeWidth / 2, Math.PI, 2 * Math.PI);
      ctx.fill();

      // top edge of lower pipe (cap)
      ctx.beginPath();
      ctx.arc(pipe.x + pipeWidth / 2, pipe.y + pipe.height + pipeGap, pipeWidth / 2, 0, Math.PI);
      ctx.fill();
      ctx.restore();

      // darker edges
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
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x + pelletSize / 2, p.y + pelletSize / 2, pelletSize / 2, 0, Math.PI * 2);
        ctx.fill();

        if (p.type === 'yellow') {
          ctx.strokeStyle = '#c89b1f';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      }
    });
  }

  function drawScore() {
    const el = document.querySelector('.score-container');
    if (el) el.textContent = score;
  }

  // UI screens
  function showStartScreen() {
    if (startScreen) startScreen.classList.remove('hidden');
    if (gameOverScreen) gameOverScreen.classList.add('hidden');
    const sc = document.querySelector('.score-container');
    if (sc) sc.style.display = 'none';
  }

  function hideAllScreens() {
    if (startScreen) startScreen.classList.add('hidden');
    if (gameOverScreen) gameOverScreen.classList.add('hidden');
    const sc = document.querySelector('.score-container');
    if (sc) sc.style.display = 'block';
  }

  function showGameOverScreen() {
    if (gameOverScreen) gameOverScreen.classList.remove('hidden');
    if (startScreen) startScreen.classList.add('hidden');
    finalScoreDisplay.textContent = score;

    // display/update high score
    let existing = document.getElementById('gameHighScore');
    if (!existing) {
      existing = document.createElement('p');
      existing.id = 'gameHighScore';
      existing.style.marginTop = '10px';
      existing.style.color = '#666';
      gameOverScreen.appendChild(existing);
    }
    existing.textContent = `High Score: ${highScore}`;

    const sc = document.querySelector('.score-container');
    if (sc) sc.style.display = 'none';

    // play sound (best-effort)
    try { gameOverSound.currentTime = 0; } catch (e) {}
    gameOverSound.play().catch(() => {});
  }

  // Game control
  function resetGame() {
    heartY = canvas.height / 2;
    velocity = 0;
    pipes = [];
    pellets = [];
    score = 0;
    currentPipeSpeed = basePipeSpeed;
  }

  function startGame() {
    if (loopId) cancelAnimationFrame(loopId);
    resetGame();
    gameState = 'playing';
    hideAllScreens();
    // create an initial pipe so the player sees something immediately
    spawnInitialPipes();
    loopId = requestAnimationFrame(gameLoop);
  }

  function endGame() {
    gameState = 'gameOver';

    if (score > highScore) {
      highScore = score;
      localStorage.setItem('flappyHighScore', String(highScore));
    }

    showGameOverScreen();
    if (loopId) {
      cancelAnimationFrame(loopId);
      loopId = null;
    }
  }

  function safePlay(audio) {
    // try to reset and play, ignore promise rejection
    try { audio.currentTime = 0; } catch (e) {}
    audio.play && audio.play().catch(() => {});
  }

  function jump() {
    if (gameState !== 'playing') return;
    // reset vertical velocity so consecutive jumps are consistent
    velocity = jumpStrength;
    safePlay(jumpSound);
  }

  // Spawning helpers
  function spawnInitialPipes() {
    // Start with two pipes spaced apart
    const firstHeight = Math.floor(Math.random() * (canvas.height - pipeGap - 120)) + 50;
    pipes.push({ x: canvas.width + 20, y: 0, height: firstHeight, passed: false });
    const secondHeight = Math.floor(Math.random() * (canvas.height - pipeGap - 120)) + 50;
    pipes.push({ x: canvas.width + 20 + pipeSpacing, y: 0, height: secondHeight, passed: false });
  }

  function spawnPipe() {
    const pipeHeight = Math.floor(Math.random() * (canvas.height - pipeGap - 100)) + 50;
    pipes.push({ x: canvas.width, y: 0, height: pipeHeight, passed: false });
  }

  function spawnPelletInGap(lastPipe) {
    const safeMargin = 14; // margin from pipe edges
    const gapTop = lastPipe.height + safeMargin;
    const gapBottom = lastPipe.height + pipeGap - pelletSize - safeMargin;
    if (gapBottom <= gapTop) return null;
    const pelletY = Math.floor(Math.random() * (gapBottom - gapTop + 1)) + gapTop;
    // choose type
    if (Math.random() < yellowProbability) {
      return { x: canvas.width, y: pelletY, collected: false, type: 'yellow', color: yellowPelletColor, value: yellowPelletValue };
    } else {
      return { x: canvas.width, y: pelletY, collected: false, type: 'pink', color: pinkPelletColor, value: pinkPelletValue };
    }
  }

  // Main update
  function update() {
    if (gameState !== 'playing') return;

    // physics
    velocity += gravity;
    if (velocity > terminalVelocity) velocity = terminalVelocity;
    if (velocity < -terminalVelocity) velocity = -terminalVelocity;
    heartY += velocity;

    // keep inside canvas vertically
    heartY = Math.max(0, Math.min(heartY, canvas.height - heartSize));

    // check ground/ceiling collision
    if (heartY + heartSize >= canvas.height || heartY <= 0) {
      endGame();
      return;
    }

    // move pipes
    pipes.forEach(pipe => pipe.x -= currentPipeSpeed);

    // spawn new pipe when needed
    if (pipes.length === 0 || pipes[pipes.length - 1].x < canvas.width - pipeSpacing) {
      spawnPipe();
    }

    // mark passed pipes for scoring
    pipes.forEach(pipe => {
      if (!pipe.passed && pipe.x + pipeWidth < heartX) {
        pipe.passed = true;
        score++;
        safePlay(scoreSound);
        // gradually increase speed, capped
        currentPipeSpeed = Math.min(basePipeSpeed + score * 0.10, 8.0);
      }
    });

    // remove off-screen pipes
    if (pipes.length > 0 && pipes[0].x < -pipeWidth - 20) {
      pipes.shift();
    }

    // collision with pipes
    for (let i = 0; i < pipes.length; i++) {
      const pipe = pipes[i];
      const withinX = heartX < pipe.x + pipeWidth && heartX + heartSize > pipe.x;
      if (withinX) {
        if (heartY < pipe.height || heartY + heartSize > pipe.height + pipeGap) {
          endGame();
          return;
        }
      }
    }

    // move pellets
    pellets.forEach(p => p.x -= currentPipeSpeed);

    // spawn pellets occasionally inside last pipe gap so they're reachable
    if (Math.random() < pelletSpawnChance && pipes.length > 0) {
      const lastPipe = pipes[pipes.length - 1];
      const p = spawnPelletInGap(lastPipe);
      if (p) pellets.push(p);
    }

    // pellet collisions
    pellets.forEach(p => {
      if (!p.collected &&
          heartX < p.x + pelletSize &&
          heartX + heartSize > p.x &&
          heartY < p.y + pelletSize &&
          heartY + heartSize > p.y) {
        p.collected = true;
        score += (p.value || 1);
        safePlay(scoreSound);
        // small speed bump for pacing
        currentPipeSpeed = Math.min(currentPipeSpeed + 0.01, 8.0);
      }
    });

    // prune pellets
    pellets = pellets.filter(p => p.x > -pelletSize && !p.collected);
  }

  // rendering + loop
  function gameLoop() {
    if (gameState !== 'playing') return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground();
    update();
    drawPipes();
    drawPellets();
    drawHeart();
    drawScore();
    loopId = requestAnimationFrame(gameLoop);
  }

  // Input handlers
  function handleKey(e) {
    if (e.code === 'Space') {
      e.preventDefault();
      if (gameState === 'start') {
        startGame();
      } else if (gameState === 'playing') {
        jump();
      } else if (gameState === 'gameOver') {
        // restart quickly with space
        startGame();
      }
    }
  }

  function handlePointerDown(e) {
    // start if on start screen, otherwise jump / restart on gameOver
    if (gameState === 'start') {
      startGame();
    } else if (gameState === 'playing') {
      jump();
    } else if (gameState === 'gameOver') {
      startGame();
    }
  }

  // safe attach handlers (avoid duplicates if script reloaded)
  document.removeEventListener('keydown', handleKey);
  document.addEventListener('keydown', handleKey, { passive: false });

  document.removeEventListener('mousedown', handlePointerDown);
  document.addEventListener('mousedown', handlePointerDown);

  document.removeEventListener('touchstart', handlePointerDown);
  document.addEventListener('touchstart', handlePointerDown, { passive: false });

  // button wiring
  if (startButton) {
    startButton.addEventListener('click', startGame);
  }
  if (restartButton) {
    restartButton.addEventListener('click', startGame);
  }

  // Show initial UI
  showStartScreen();
})();
