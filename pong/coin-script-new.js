// Game Variables
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let gameRunning = false;
let gameTime = 60;
let currentLevel = 1;
let coinsCollected = 0;
let coins = [];
let obstacles = [];
let effects = [];

// Audio context for sound effects
let audioContext;

// Initialize audio
try {
  audioContext = new (window.AudioContext || window.webkitAudioContext)();
} catch (e) {
  console.warn('Web Audio API not supported');
}

// Game Settings
let selectedCharacter = null;
let selectedDifficulty = 1;
let selectedPath = null;
let selectedMusic = null;

// Player
const player = {
  x: canvas.width / 2,

  y: canvas.height / 2,
  size: 15,
  speed: 4,
  emoji: '😊'
};

// Characters
const characters = {
  hero: { emoji: '😊', speed: 4 },
  ninja: { emoji: '🥷', speed: 5 },
  robot: { emoji: '🤖', speed: 3 },
  cat: { emoji: '😸', speed: 6 }
};

// Path themes
const pathThemes = {
  forest: { bg: ['#2d5016', '#3e6b1c'], coin: '🪙' },
  city: { bg: ['#34495e', '#2c3e50'], coin: '💰' },
  space: { bg: ['#0c0c0c', '#1a1a2e'], coin: '⭐' }
};

// Controls
const keys = {};

// Initialize
document.addEventListener('DOMContentLoaded', setupGame);

function setupGame() {
  setupIntroListeners();
  setupGameControls();
}

function setupIntroListeners() {
  // Character selection
  document.querySelectorAll('.char-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.char-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      selectedCharacter = btn.dataset.character;
      checkReadyToPlay();
    });
  });

  // Level selection
  document.querySelectorAll('.level-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.level-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      selectedDifficulty = parseInt(btn.dataset.level);
      checkReadyToPlay();
    });
  });

  // Path selection
  document.querySelectorAll('.path-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.path-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      selectedPath = btn.dataset.path;
      checkReadyToPlay();
    });
  });

  // Music selection
  document.querySelectorAll('.music-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.music-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      selectedMusic = btn.dataset.music;
      checkReadyToPlay();
    });
  });

  // Play button
  document.getElementById('playBtn').addEventListener('click', startGame);
}

function setupGameControls() {
  // Keyboard controls
  document.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;
  });

  document.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
  });

  // Pause button
  document.getElementById('pauseBtn').addEventListener('click', togglePause);
}

function checkReadyToPlay() {
  const playBtn = document.getElementById('playBtn');
  if (selectedCharacter && selectedDifficulty && selectedPath && selectedMusic) {
    playBtn.disabled = false;
  } else {
    playBtn.disabled = true;
  }
}

function startGame() {
  // Apply selections
  const charData = characters[selectedCharacter];
  player.emoji = charData.emoji;
  player.speed = charData.speed;
  
  // Set difficulty
  currentLevel = selectedDifficulty;
  gameTime = 80 - (selectedDifficulty * 10);
  
  // Hide intro, show game
  document.getElementById('introScreen').style.display = 'none';
  document.getElementById('gameScreen').style.display = 'block';
  
  // Initialize game
  initGame();
  gameRunning = true;
  gameLoop();
  startTimer();
}

function initGame() {
  coins = [];
  obstacles = [];
  coinsCollected = 0;
  
  // Reset player position
  player.x = canvas.width / 2;
  player.y = canvas.height / 2;
  
  // Create initial coins
  for (let i = 0; i < 6; i++) {
    createCoin();
  }
  
  // Create obstacles based on difficulty
  for (let i = 0; i < selectedDifficulty; i++) {
    createObstacle();
  }
  
  updateUI();
}

function createCoin() {
  coins.push({
    x: Math.random() * (canvas.width - 40) + 20,
    y: Math.random() * (canvas.height - 40) + 20,
    size: 12,
    collected: false,
    sparkle: Math.random() * Math.PI * 2
  });
}

function createObstacle() {
  obstacles.push({
    x: Math.random() * (canvas.width - 30) + 15,
    y: Math.random() * (canvas.height - 30) + 15,
    width: 20,
    height: 20,
    dx: (Math.random() - 0.5) * (2 + selectedDifficulty * 0.5),
    dy: (Math.random() - 0.5) * (2 + selectedDifficulty * 0.5)
  });
}

function update() {
  if (!gameRunning) return;
  
  // Update visual effects
  updateEffects();
  
  // Player movement
  if ((keys['arrowup'] || keys['w']) && player.y - player.size > 0) {
    player.y -= player.speed;
  }
  if ((keys['arrowdown'] || keys['s']) && player.y + player.size < canvas.height) {
    player.y += player.speed;
  }
  if ((keys['arrowleft'] || keys['a']) && player.x - player.size > 0) {
    player.x -= player.speed;
  }
  if ((keys['arrowright'] || keys['d']) && player.x + player.size < canvas.width) {
    player.x += player.speed;
  }
  
  // Check coin collection
  coins.forEach(coin => {
    if (!coin.collected) {
      const distance = Math.sqrt(
        Math.pow(player.x - coin.x, 2) + Math.pow(player.y - coin.y, 2)
      );
      if (distance < player.size + coin.size) {
        coin.collected = true;
        coinsCollected++;
        
        // Visual feedback - coin explosion effect
        createCoinEffect(coin.x, coin.y);
        
        // Audio feedback (simple beep using AudioContext)
        playCollectSound();
        
        // Create new coin
        createCoin();
        updateUI();
        
        // Speed boost every 10 coins
        if (coinsCollected % 10 === 0) {
          player.speed += 0.2;
        }
      }
    }
  });
  
  // Remove collected coins
  coins = coins.filter(coin => !coin.collected);
  
  // Update obstacles
  obstacles.forEach(obstacle => {
    obstacle.x += obstacle.dx;
    obstacle.y += obstacle.dy;
    
    // Bounce off walls
    if (obstacle.x <= 0 || obstacle.x >= canvas.width - obstacle.width) {
      obstacle.dx = -obstacle.dx;
    }
    if (obstacle.y <= 0 || obstacle.y >= canvas.height - obstacle.height) {
      obstacle.dy = -obstacle.dy;
    }
    
    // Check collision with player
    if (player.x + player.size > obstacle.x &&
        player.x - player.size < obstacle.x + obstacle.width &&
        player.y + player.size > obstacle.y &&
        player.y - player.size < obstacle.y + obstacle.height) {
      gameTime -= 3; // Penalty
      playHitSound();
      
      // Push player away from obstacle
      const pushX = player.x < obstacle.x + obstacle.width / 2 ? -5 : 5;
      const pushY = player.y < obstacle.y + obstacle.height / 2 ? -5 : 5;
      player.x += pushX;
      player.y += pushY;
      
      // Keep player in bounds
      player.x = Math.max(player.size, Math.min(canvas.width - player.size, player.x));
      player.y = Math.max(player.size, Math.min(canvas.height - player.size, player.y));
    }
  });
  
  // Level up
  if (coinsCollected > 0 && coinsCollected % 15 === 0) {
    currentLevel++;
    createObstacle();
    updateUI();
  }
}

function draw() {
  // Clear canvas with themed background
  const theme = pathThemes[selectedPath];
  if (theme) {
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, theme.bg[0]);
    gradient.addColorStop(1, theme.bg[1]);
    ctx.fillStyle = gradient;
  } else {
    ctx.fillStyle = '#1e3c72';
  }
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Draw grid pattern for depth
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 1;
  for (let x = 0; x < canvas.width; x += 30) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  for (let y = 0; y < canvas.height; y += 30) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }
  
  // Draw coins with sparkle effect
  coins.forEach(coin => {
    if (!coin.collected) {
      const theme = pathThemes[selectedPath];
      
      // Update sparkle animation
      coin.sparkle += 0.1;
      
      if (theme && theme.coin) {
        // Themed coin with glow effect
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 10 + Math.sin(coin.sparkle) * 5;
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(theme.coin, coin.x, coin.y + 8);
        ctx.shadowBlur = 0;
      } else {
        // Default coin with sparkle
        const sparkleScale = 1 + Math.sin(coin.sparkle) * 0.3;
        
        // Outer glow
        const gradient = ctx.createRadialGradient(coin.x, coin.y, 0, coin.x, coin.y, coin.size * sparkleScale);
        gradient.addColorStop(0, '#ffd700');
        gradient.addColorStop(0.7, '#ffed4e');
        gradient.addColorStop(1, 'rgba(255, 215, 0, 0.3)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(coin.x, coin.y, coin.size * sparkleScale, 0, Math.PI * 2);
        ctx.fill();
        
        // Inner coin
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.arc(coin.x, coin.y, coin.size * 0.7, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  });
  
  // Draw obstacles with glow effect
  obstacles.forEach(obstacle => {
    ctx.shadowColor = '#ff4757';
    ctx.shadowBlur = 8;
    ctx.fillStyle = '#ff4757';
    ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    ctx.shadowBlur = 0;
    
    // Add danger stripes
    ctx.fillStyle = '#fff';
    ctx.fillRect(obstacle.x + 2, obstacle.y + 2, obstacle.width - 4, 2);
    ctx.fillRect(obstacle.x + 2, obstacle.y + obstacle.height - 4, obstacle.width - 4, 2);
  });
  
  // Draw player with glow effect
  ctx.shadowColor = '#00cec9';
  ctx.shadowBlur = 15;
  ctx.font = '30px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(player.emoji, player.x, player.y + 10);
  ctx.shadowBlur = 0;
  
  // Draw visual effects
  drawEffects();
}

function gameLoop() {
  update();
  draw();
  
  if (gameRunning) {
    requestAnimationFrame(gameLoop);
  }
}

function startTimer() {
  const timer = setInterval(() => {
    if (gameRunning && gameTime > 0) {
      gameTime--;
      updateUI();
      
      if (gameTime <= 0) {
        endGame();
        clearInterval(timer);
      }
    }
  }, 1000);
}

function updateUI() {
  document.getElementById('coins').textContent = coinsCollected;
  document.getElementById('timer').textContent = gameTime;
  document.getElementById('gameLevel').textContent = currentLevel;
}

function togglePause() {
  gameRunning = !gameRunning;
  const pauseBtn = document.getElementById('pauseBtn');
  pauseBtn.textContent = gameRunning ? '⏸️' : '▶️';
  
  if (gameRunning) {
    gameLoop();
  }
}

function endGame() {
  gameRunning = false;
  document.getElementById('finalCoins').textContent = coinsCollected;
  document.getElementById('gameOverScreen').style.display = 'flex';
}

function restartGame() {
  document.getElementById('gameOverScreen').style.display = 'none';
  initGame();
  gameRunning = true;
  gameLoop();
  startTimer();
}

function backToMenu() {
  gameRunning = false;
  document.getElementById('gameScreen').style.display = 'none';
  document.getElementById('gameOverScreen').style.display = 'none';
  document.getElementById('introScreen').style.display = 'block';
  
  // Reset selections
  document.querySelectorAll('.selected').forEach(el => el.classList.remove('selected'));
  selectedCharacter = null;
  selectedDifficulty = null;
  selectedPath = null;
  selectedMusic = null;
  checkReadyToPlay();
}

// Sound effects
function playCollectSound() {
  if (!audioContext) return;
  
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(1200, audioContext.currentTime + 0.1);
  oscillator.type = 'sine';
  
  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
  
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.2);
}

function playHitSound() {
  if (!audioContext) return;
  
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
  oscillator.type = 'sawtooth';
  
  gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
  
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.3);
}

// Visual effects
function createCoinEffect(x, y) {
  for (let i = 0; i < 8; i++) {
    effects.push({
      x: x,
      y: y,
      dx: (Math.random() - 0.5) * 6,
      dy: (Math.random() - 0.5) * 6,
      life: 30,
      maxLife: 30,
      color: `hsl(${Math.random() * 60 + 30}, 100%, 70%)`
    });
  }
}

function updateEffects() {
  effects.forEach((effect, index) => {
    effect.x += effect.dx;
    effect.y += effect.dy;
    effect.life--;
    
    if (effect.life <= 0) {
      effects.splice(index, 1);
    }
  });
}

function drawEffects() {
  effects.forEach(effect => {
    const alpha = effect.life / effect.maxLife;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = effect.color;
    ctx.beginPath();
    ctx.arc(effect.x, effect.y, 3, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
}
