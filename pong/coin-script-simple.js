// Game Variables - Simple like Pong

// Game state
let gameRunning = false;
let coinsCollected = 0;
let coins = [];
let obstacles = [];
let effects = [];

// Player
let player;

// Controls
const keys = {};

// Audio context for sound effects
let audioContext;
try {
  audioContext = new (window.AudioContext || window.webkitAudioContext)();
} catch (e) {
  console.warn('Web Audio API not supported');
}

// Sound effects
function playCoinSound() {
  if (!audioContext) return;
  
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(1200, audioContext.currentTime + 0.1);
  
  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  oscillator.start();
  oscillator.stop(audioContext.currentTime + 0.1);
}

// --- Modalità e tipo moneta ---
function getGameParams() {
  const params = new URLSearchParams(window.location.search);
  let mode = params.get('mode');
  let coinType = params.get('coin');
  if (!mode) mode = 'timed';
  if (!coinType) coinType = 'diamond';
  return { mode, coinType };
}
const { mode, coinType } = getGameParams();

// Emoji e colore per tipo moneta
const coinTypes = {
  diamond: { emoji: '💎', color: '#00eaff' },
  ruby:    { emoji: '🔴', color: '#e74c3c' },
  emerald: { emoji: '🟢', color: '#00ff88' }
};

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');

  player = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    size: 15,
    speed: 4,
    emoji: '🎮'
  };

  function setupControls() {
    // Keyboard controls
    document.addEventListener('keydown', (e) => {
      keys[e.key.toLowerCase()] = true;
    });

    document.addEventListener('keyup', (e) => {
      keys[e.key.toLowerCase()] = false;
    });

    // Button controls
    document.getElementById('pauseBtn').addEventListener('click', togglePause);
    document.getElementById('resetBtn').addEventListener('click', resetGame);
  }

  function startGame() {
    if (!gameRunning) {
      gameRunning = true;
    }
  }

  function togglePause() {
    gameRunning = !gameRunning;
    document.getElementById('pauseBtn').textContent = gameRunning ? 'Pause' : 'Resume';
  }

  function resetGame() {
    gameRunning = false;
    coinsCollected = 0;
    player.x = canvas.width / 2;
    player.y = canvas.height / 2;
    initGame();
    updateUI();
    document.getElementById('pauseBtn').textContent = 'Pause';
    const gameOverScreen = document.getElementById('gameOverScreen');
    if (gameOverScreen) {
      gameOverScreen.style.display = 'none';
    }
  }

  async function initGame() {
    coins = [];
    obstacles = [];
    effects = [];
    for (let i = 0; i < 8; i++) createCoin();
    // Carica configurazione livello
    let obstacleCount = 3;
    let obstacleSpeed = 2.5;
    if (window.levelConfigFile) {
      try {
        const res = await fetch(window.levelConfigFile);
        const config = await res.json();
        obstacleCount = config.obstacles || obstacleCount;
        obstacleSpeed = config.obstacleSpeed || obstacleSpeed;
      } catch (e) { console.warn('Config livello non trovato:', e); }
    }
    for (let i = 0; i < obstacleCount; i++) createObstacle(obstacleSpeed);
  }

  function createCoin() {
    coins.push({
      x: Math.random() * (canvas.width - 40) + 20,
      y: Math.random() * (canvas.height - 40) + 20,
      size: 12,
      collected: false,
      sparkle: Math.random() * Math.PI * 2,
      emoji: coinTypes[coinType].emoji,
      color: coinTypes[coinType].color
    });
  }

  function createObstacle(speed = 2.5) {
    obstacles.push({
      x: Math.random() * (canvas.width - 30) + 15,
      y: Math.random() * (canvas.height - 30) + 15,
      width: 20,
      height: 20,
      dx: (Math.random() - 0.5) * speed,
      dy: (Math.random() - 0.5) * speed
    });
  }

  function update() {
    if (!gameRunning) return;
    
    // Update player movement
    if (keys['arrowup'] || keys['w']) player.y -= player.speed;
    if (keys['arrowdown'] || keys['s']) player.y += player.speed;
    if (keys['arrowleft'] || keys['a']) player.x -= player.speed;
    if (keys['arrowright'] || keys['d']) player.x += player.speed;
    
    // Keep player in bounds
    player.x = Math.max(player.size, Math.min(canvas.width - player.size, player.x));
    player.y = Math.max(player.size, Math.min(canvas.height - player.size, player.y));
    
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
    });
    
    // Check coin collection
    coins.forEach((coin, index) => {
      if (!coin.collected) {
        const dist = Math.sqrt((player.x - coin.x) ** 2 + (player.y - coin.y) ** 2);
        if (dist < player.size + coin.size) {
          coin.collected = true;
          coinsCollected++;
          playCoinSound();
          
          // Create sparkle effect
          for (let i = 0; i < 5; i++) {
            effects.push({
              x: coin.x,
              y: coin.y,
              vx: (Math.random() - 0.5) * 6,
              vy: (Math.random() - 0.5) * 6,
              life: 30,
              maxLife: 30,
              type: 'sparkle'
            });
          }
          
          // Remove collected coin and create new one
          coins.splice(index, 1);
          createCoin();
        }
      }
    });
    
    // Check obstacle collision
    obstacles.forEach(obstacle => {
      if (player.x < obstacle.x + obstacle.width &&
          player.x + player.size > obstacle.x &&
          player.y < obstacle.y + obstacle.height &&
          player.y + player.size > obstacle.y) {
        // Player hit obstacle - GAME OVER
        endGame();
      }
    });
    
    // Update effects
    effects.forEach((effect, index) => {
      effect.x += effect.vx;
      effect.y += effect.vy;
      effect.life--;
      
      if (effect.life <= 0) {
        effects.splice(index, 1);
      }
    });
    
    updateUI();
  }

  function draw() {
    // Clear canvas with gradient background
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#1e3c72');
    gradient.addColorStop(1, '#2a5298');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw coins
    coins.forEach(coin => {
      ctx.save();
      ctx.font = `${coin.size * 2}px Arial`;
      ctx.textAlign = 'center';
      ctx.shadowColor = coin.color;
      ctx.shadowBlur = 12;
      ctx.fillText(coin.emoji, coin.x, coin.y + coin.size * 0.7);
      ctx.restore();
    });
    
    // Draw obstacles
    obstacles.forEach(obstacle => {
      ctx.fillStyle = '#e74c3c';
      ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
      
      // Add glow
      ctx.save();
      ctx.shadowColor = '#e74c3c';
      ctx.shadowBlur = 15;
      ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
      ctx.restore();
    });
    
    // Draw player with glow
    ctx.save();
    ctx.shadowColor = '#00ff88';
    ctx.shadowBlur = 15;
    
    ctx.font = `${player.size * 2}px Arial`;
    ctx.textAlign = 'center';
    ctx.fillText(player.emoji, player.x, player.y + player.size * 0.7);
    
    ctx.restore();
    
    // Draw effects
    effects.forEach(effect => {
      if (effect.type === 'sparkle') {
        const alpha = effect.life / effect.maxLife;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.arc(effect.x, effect.y, 3 * alpha, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    });
  }

  function updateUI() {
    // Tempo rimosso
    document.getElementById('scoreDisplay').textContent = coinsCollected;
    document.getElementById('levelDisplay').textContent = Math.floor(coinsCollected / 10) + 1;
    
    // Mostra tipo moneta scelto
    const coinTypeDisplay = document.getElementById('coinTypeDisplay');
    if (coinTypeDisplay) {
      coinTypeDisplay.textContent = `Moneta: ${coinTypes[coinType].emoji} ${coinType.charAt(0).toUpperCase() + coinType.slice(1)}`;
    }
  }

  // --- Aggiorna record quando il gioco termina ---
  function endGame() {
    gameRunning = false;
    updateRecord(coinsCollected);
    showGameOver();
  }

  function showGameOver() {
    const gameOverHTML = `
      <div id="gameOverScreen" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 1000;">
        <div class="game-over-content" style="background: rgba(0,0,0,0.9); padding: 30px; border-radius: 15px; text-align: center; border: 2px solid #ffd700;">
          <h2 style="color: #ffd700; margin-bottom: 15px; font-size: 24px;">Game Over!</h2>
          <p style="margin-bottom: 20px; font-size: 16px;">Coins Collected: ${coinsCollected}</p>
          <div class="game-over-buttons" style="display: flex; gap: 15px; justify-content: center;">
            <button onclick="location.reload()" style="background: linear-gradient(45deg, #ffd700, #ffed4e); color: #333; border: none; padding: 10px 20px; border-radius: 20px; cursor: pointer; font-weight: bold;">Play Again</button>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', gameOverHTML);
  }

  setupControls();
  initGame();
  updateUI();
  gameRunning = true;
  function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
  }
  gameLoop();
});
