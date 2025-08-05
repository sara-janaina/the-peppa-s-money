// Get canvas and context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game variables
let gameRunning = false;
let gameTime = 60;
let currentLevel = 1;
let coinsCollected = 0;
let coins = [];
let obstacles = [];
let pathElements = [];

// Game settings from intro
let selectedCharacter = null;
let selectedDifficulty = 1;
let selectedPath = null;

// Player character
const player = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  size: 20,
  speed: 5,
  color: '#ff6b6b',
  emoji: '😊'
};

// Character types
const characters = {
  hero: { emoji: '😊', color: '#ff6b6b', speed: 5 },
  ninja: { emoji: '🥷', color: '#6c5ce7', speed: 6 },
  robot: { emoji: '🤖', color: '#00cec9', speed: 4 },
  cat: { emoji: '😸', color: '#fd79a8', speed: 7 },
  wizard: { emoji: '🧙‍♂️', color: '#a29bfe', speed: 4 },
  alien: { emoji: '👽', color: '#00b894', speed: 5 }
};

// Path themes
const pathThemes = {
  forest: {
    background: ['#2d5016', '#3e6b1c'],
    elements: ['🌲', '🌳', '🍄', '🦋'],
    coins: '🪙'
  },
  city: {
    background: ['#34495e', '#2c3e50'],
    elements: ['🏢', '🚗', '🚦', '💡'],
    coins: '💰'
  },
  space: {
    background: ['#0c0c0c', '#1a1a2e'],
    elements: ['🌟', '🚀', '🛸', '☄️'],
    coins: '⭐'
  },
  ocean: {
    background: ['#006994', '#004d6b'],
    elements: ['🐠', '🐙', '🦀', '🐚'],
    coins: '🔱'
  }
};

// Intro screen management
let selections = {
  character: null,
  level: null,
  path: null,
  music: null
};

// Audio system
let audioEnabled = true;
let currentMusic = null;
let gameMusic = null;
let audioVolume = 0.5;

// Music tracks (using Web Audio API for generated music)
const musicTracks = {
  upbeat: {
    name: "Arcade Retro",
    tempo: 140,
    pattern: [0, 4, 7, 12, 7, 4, 0, 7],
    bassPattern: [0, 0, 7, 7, 5, 5, 7, 7]
  },
  chill: {
    name: "Chill Lounge", 
    tempo: 90,
    pattern: [0, 3, 7, 10, 12, 10, 7, 3],
    bassPattern: [0, 0, 5, 5, 7, 7, 5, 5]
  },
  epic: {
    name: "Epic Adventure",
    tempo: 120,
    pattern: [0, 5, 7, 12, 14, 12, 7, 5],
    bassPattern: [0, 0, 7, 7, 5, 5, 0, 0]
  },
  techno: {
    name: "Future Techno",
    tempo: 130,
    pattern: [0, 7, 5, 12, 7, 5, 0, 12],
    bassPattern: [0, 5, 0, 5, 7, 5, 7, 5]
  }
};

// Audio context for music generation
let audioContext;
let musicInterval;

// Initialize intro screen
document.addEventListener('DOMContentLoaded', () => {
  setupIntroListeners();
  initAudioSystem();
});

function initAudioSystem() {
  try {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  } catch (e) {
    console.warn('Web Audio API not supported');
    audioEnabled = false;
  }
}

function generateTone(frequency, duration, type = 'sine', volume = 0.1) {
  if (!audioContext || !audioEnabled) return;
  
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
  oscillator.type = type;
  
  gainNode.gain.setValueAtTime(volume * audioVolume, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
  
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + duration);
}

function playMusicPattern(trackName) {
  if (!audioEnabled || !musicTracks[trackName]) return;
  
  const track = musicTracks[trackName];
  const baseFreq = 220; // A3
  const beatDuration = 60 / track.tempo; // Duration per beat
  
  let beatIndex = 0;
  
  musicInterval = setInterval(() => {
    const noteOffset = track.pattern[beatIndex % track.pattern.length];
    const bassOffset = track.bassPattern[beatIndex % track.bassPattern.length];
    
    // Main melody
    if (noteOffset !== null) {
      const frequency = baseFreq * Math.pow(2, noteOffset / 12);
      generateTone(frequency, beatDuration * 0.8, 'square', 0.15);
    }
    
    // Bass line
    const bassFrequency = (baseFreq / 2) * Math.pow(2, bassOffset / 12);
    generateTone(bassFrequency, beatDuration * 0.6, 'sawtooth', 0.1);
    
    beatIndex++;
  }, beatDuration * 1000);
}

function stopMusic() {
  if (musicInterval) {
    clearInterval(musicInterval);
    musicInterval = null;
  }
}

function setupIntroListeners() {
  // Audio toggle
  const audioToggle = document.getElementById('audioToggle');
  audioToggle.addEventListener('click', () => {
    audioEnabled = !audioEnabled;
    audioToggle.textContent = audioEnabled ? '🔊 Audio ON' : '🔇 Audio OFF';
    audioToggle.classList.toggle('muted', !audioEnabled);
    
    if (!audioEnabled) {
      stopMusic();
    }
  });

  // Volume control
  const volumeSlider = document.getElementById('volumeSlider');
  const volumeValue = document.getElementById('volumeValue');
  
  volumeSlider.addEventListener('input', (e) => {
    audioVolume = e.target.value / 100;
    volumeValue.textContent = e.target.value + '%';
  });

  // Character selection
  document.querySelectorAll('.character-option').forEach(option => {
    option.addEventListener('click', () => {
      document.querySelectorAll('.character-option').forEach(o => o.classList.remove('selected'));
      option.classList.add('selected');
      selections.character = option.dataset.character;
      playSelectSound();
      checkSelections();
    });
  });

  // Level selection
  document.querySelectorAll('.level-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.level-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      selections.level = parseInt(btn.dataset.level);
      playSelectSound();
      checkSelections();
    });
  });

  // Path selection
  document.querySelectorAll('.path-option').forEach(option => {
    option.addEventListener('click', () => {
      document.querySelectorAll('.path-option').forEach(o => o.classList.remove('selected'));
      option.classList.add('selected');
      selections.path = option.dataset.path;
      playSelectSound();
      checkSelections();
    });
  });

  // Music selection
  document.querySelectorAll('.music-option').forEach(option => {
    option.addEventListener('click', () => {
      document.querySelectorAll('.music-option').forEach(o => o.classList.remove('selected'));
      option.classList.add('selected');
      selections.music = option.dataset.music;
      playSelectSound();
      checkSelections();
    });
  });

  // Music preview buttons
  document.querySelectorAll('.play-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const trackName = btn.dataset.preview;
      
      // Stop current preview
      document.querySelectorAll('.play-btn').forEach(b => {
        b.textContent = '▶';
        b.classList.remove('playing');
      });
      stopMusic();
      
      if (audioEnabled) {
        // Start new preview
        btn.textContent = '⏸';
        btn.classList.add('playing');
        playMusicPattern(trackName);
        
        // Stop preview after 10 seconds
        setTimeout(() => {
          btn.textContent = '▶';
          btn.classList.remove('playing');
          stopMusic();
        }, 10000);
      }
    });
  });

  // Start game button
  document.getElementById('startGameBtn').addEventListener('click', startGameFromIntro);
}

function playSelectSound() {
  if (audioEnabled) {
    generateTone(880, 0.1, 'sine', 0.3); // A5 note
  }
}

function playCoinSound() {
  if (audioEnabled) {
    generateTone(1320, 0.2, 'sine', 0.4); // E6 note
    setTimeout(() => generateTone(1760, 0.1, 'sine', 0.3), 100); // A6 note
  }
}

function playGameOverSound() {
  if (audioEnabled) {
    generateTone(440, 0.3, 'sawtooth', 0.3); // A4
    setTimeout(() => generateTone(370, 0.3, 'sawtooth', 0.3), 300); // F#4
    setTimeout(() => generateTone(330, 0.5, 'sawtooth', 0.3), 600); // E4
  }
}

function updateProgress() {
  const completedCount = Object.values(selections).filter(v => v !== null).length;
  const progressBar = document.getElementById('progressBar');
  const progressText = document.getElementById('progressText');
  
  // Update progress bar
  const percentage = (completedCount / 4) * 100;
  progressBar.style.width = percentage + '%';
  
  // Update progress text
  const messages = [
    "Completa tutte le 4 sezioni per iniziare! (0/4)",
    "Ottimo inizio! Continua così... (1/4)", 
    "Stai andando bene! (2/4)",
    "Quasi pronto! (3/4)",
    "Perfetto! Ora puoi iniziare l'avventura! (4/4)"
  ];
  progressText.textContent = messages[completedCount];
  
  // Update section visual state
  updateSectionStates();
}

function updateSectionStates() {
  // Character section
  const characterSection = document.querySelector('.character-section');
  if (selections.character) {
    characterSection.classList.add('completed');
  } else {
    characterSection.classList.remove('completed');
  }
  
  // Level section
  const levelSection = document.querySelector('.level-section');
  if (selections.level) {
    levelSection.classList.add('completed');
  } else {
    levelSection.classList.remove('completed');
  }
  
  // Path section
  const pathSection = document.querySelector('.path-section');
  if (selections.path) {
    pathSection.classList.add('completed');
  } else {
    pathSection.classList.remove('completed');
  }
  
  // Music section
  const musicSection = document.querySelector('.music-section');
  if (selections.music) {
    musicSection.classList.add('completed');
  } else {
    musicSection.classList.remove('completed');
  }
}

function checkSelections() {
  const startBtn = document.getElementById('startGameBtn');
  if (selections.character && selections.level && selections.path && selections.music) {
    startBtn.disabled = false;
  } else {
    startBtn.disabled = true;
  }
  
  // Update progress
  updateProgress();
}

function startGameFromIntro() {
  // Stop any preview music
  stopMusic();
  document.querySelectorAll('.play-btn').forEach(b => {
    b.textContent = '▶';
    b.classList.remove('playing');
  });
  
  // Apply selections
  selectedCharacter = selections.character;
  selectedDifficulty = selections.level;
  selectedPath = selections.path;
  
  // Set up player based on selection
  const charData = characters[selectedCharacter];
  player.emoji = charData.emoji;
  player.color = charData.color;
  player.speed = charData.speed + (selectedDifficulty - 1) * 0.5;
  
  // Set initial level and time based on difficulty
  currentLevel = selectedDifficulty;
  gameTime = Math.max(30, 80 - selectedDifficulty * 10);
  
  // Hide intro, show game
  document.getElementById('introScreen').style.display = 'none';
  document.getElementById('gameScreen').style.display = 'block';
  
  // Start game music
  if (audioEnabled && selections.music) {
    playMusicPattern(selections.music);
  }
  
  // Start game
  gameRunning = true;
  initGame();
  updateScore();
  gameLoop();
}

function backToMenu() {
  gameRunning = false;
  stopMusic();
  
  document.getElementById('gameScreen').style.display = 'none';
  document.getElementById('introScreen').style.display = 'flex';
  document.getElementById('gameOver').style.display = 'none';
  
  // Reset selections
  document.querySelectorAll('.selected').forEach(el => el.classList.remove('selected'));
  selections = { character: null, level: null, path: null, music: null };
  
  // Reset all section states
  document.querySelectorAll('.intro-section').forEach(section => {
    section.classList.remove('completed');
  });
  
  checkSelections();
}

// Game settings
const coinSettings = {
  size: 12,
  count: 8,
  color: '#ffd700',
  points: 10
};

const obstacleSettings = {
  width: 15,
  height: 60,
  speed: 2,
  color: '#ff4757'
};

// Controls
const keys = {};

// Event listeners
document.addEventListener('keydown', (e) => {
  keys[e.key.toLowerCase()] = true;
});

document.addEventListener('keyup', (e) => {
  keys[e.key.toLowerCase()] = false;
});

// Utility functions
function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function distance(obj1, obj2) {
  const dx = obj1.x - obj2.x;
  const dy = obj1.y - obj2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

// Create coins
function createCoin() {
  return {
    x: randomBetween(coinSettings.size, canvas.width - coinSettings.size),
    y: randomBetween(coinSettings.size, canvas.height - coinSettings.size),
    size: coinSettings.size,
    collected: false,
    sparkle: Math.random() * Math.PI * 2
  };
}

// Create obstacles
function createObstacle() {
  const isVertical = Math.random() > 0.5;
  if (isVertical) {
    return {
      x: randomBetween(0, canvas.width - obstacleSettings.width),
      y: Math.random() > 0.5 ? -obstacleSettings.height : canvas.height,
      width: obstacleSettings.width,
      height: obstacleSettings.height,
      dx: 0,
      dy: Math.random() > 0.5 ? obstacleSettings.speed : -obstacleSettings.speed
    };
  } else {
    return {
      x: Math.random() > 0.5 ? -obstacleSettings.width : canvas.width,
      y: randomBetween(0, canvas.height - obstacleSettings.height),
      width: obstacleSettings.width,
      height: obstacleSettings.height,
      dx: Math.random() > 0.5 ? obstacleSettings.speed : -obstacleSettings.speed,
      dy: 0
    };
  }
}

// Create path elements
function createPathElement() {
  const theme = pathThemes[selectedPath];
  const elements = theme.elements;
  
  return {
    x: randomBetween(50, canvas.width - 50),
    y: randomBetween(50, canvas.height - 50),
    emoji: elements[Math.floor(Math.random() * elements.length)],
    size: randomBetween(20, 30),
    rotation: Math.random() * Math.PI * 2,
    rotationSpeed: (Math.random() - 0.5) * 0.02
  };
}

// Initialize game
function initGame() {
  coins = [];
  obstacles = [];
  pathElements = [];
  
  // Create path elements
  for (let i = 0; i < 8; i++) {
    pathElements.push(createPathElement());
  }
  
  // Create initial coins
  for (let i = 0; i < coinSettings.count + currentLevel; i++) {
    coins.push(createCoin());
  }
  
  // Create obstacles based on level
  for (let i = 0; i < Math.max(1, currentLevel - 1); i++) {
    obstacles.push(createObstacle());
  }
}

// Draw functions
function drawCircle(x, y, radius, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
}

function drawRect(x, y, width, height, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, width, height);
}

function drawEmoji(x, y, emoji, size) {
  ctx.font = `${size}px Arial`;
  ctx.textAlign = 'center';
  ctx.fillText(emoji, x, y + size/3);
}

function drawPlayer() {
  if (player.emoji) {
    // Draw emoji character
    drawEmoji(player.x, player.y, player.emoji, player.size * 2);
  } else {
    // Fallback to circle with face
    drawCircle(player.x, player.y, player.size, player.color);
    
    // Eyes
    drawCircle(player.x - 6, player.y - 5, 3, 'white');
    drawCircle(player.x + 6, player.y - 5, 3, 'white');
    drawCircle(player.x - 6, player.y - 5, 1.5, 'black');
    drawCircle(player.x + 6, player.y - 5, 1.5, 'black');
    
    // Smile
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(player.x, player.y + 2, 8, 0.2 * Math.PI, 0.8 * Math.PI);
    ctx.stroke();
  }
}

function drawCoin(coin) {
  if (coin.collected) return;
  
  // Sparkle effect
  coin.sparkle += 0.1;
  const sparkleScale = 1 + Math.sin(coin.sparkle) * 0.2;
  
  if (selectedPath && pathThemes[selectedPath].coins) {
    // Draw themed coin
    drawEmoji(coin.x, coin.y, pathThemes[selectedPath].coins, coin.size * 2 * sparkleScale);
  } else {
    // Original coin design
    const gradient = ctx.createRadialGradient(coin.x, coin.y, 0, coin.x, coin.y, coin.size * sparkleScale);
    gradient.addColorStop(0, '#ffd700');
    gradient.addColorStop(0.7, '#ffed4e');
    gradient.addColorStop(1, 'rgba(255, 215, 0, 0.3)');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(coin.x, coin.y, coin.size * sparkleScale, 0, Math.PI * 2);
    ctx.fill();
    
    drawCircle(coin.x, coin.y, coin.size * 0.8, '#ffd700');
    
    ctx.strokeStyle = '#ffed4e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(coin.x, coin.y, coin.size * 0.6, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawObstacle(obstacle) {
  // Main obstacle
  drawRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height, obstacleSettings.color);
  
  // Warning glow
  ctx.shadowColor = obstacleSettings.color;
  ctx.shadowBlur = 10;
  drawRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height, obstacleSettings.color);
  ctx.shadowBlur = 0;
}

function drawPathElement(element) {
  ctx.save();
  ctx.translate(element.x, element.y);
  ctx.rotate(element.rotation);
  drawEmoji(0, 0, element.emoji, element.size);
  ctx.restore();
  
  // Update rotation
  element.rotation += element.rotationSpeed;
}

function draw() {
  // Clear canvas with themed background
  if (selectedPath && pathThemes[selectedPath]) {
    const theme = pathThemes[selectedPath];
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, theme.background[0]);
    gradient.addColorStop(1, theme.background[1]);
    ctx.fillStyle = gradient;
  } else {
    // Default background
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#1e3c72');
    gradient.addColorStop(1, '#2a5298');
    ctx.fillStyle = gradient;
  }
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Draw grid pattern
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 1;
  for (let x = 0; x < canvas.width; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  for (let y = 0; y < canvas.height; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }
  
  // Draw path elements
  pathElements.forEach(drawPathElement);
  
  // Draw game objects
  coins.forEach(drawCoin);
  obstacles.forEach(drawObstacle);
  drawPlayer();
}

// Update game logic
function update() {
  if (!gameRunning) return;
  
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
    if (!coin.collected && distance(player, coin) < player.size + coin.size) {
      coin.collected = true;
      coinsCollected++;
      playCoinSound();
      updateScore();
      
      // Add new coin
      coins.push(createCoin());
    }
  });
  
  // Remove collected coins (keep some for visual effect)
  coins = coins.filter(coin => !coin.collected);
  
  // Update obstacles
  obstacles.forEach(obstacle => {
    obstacle.x += obstacle.dx;
    obstacle.y += obstacle.dy;
    
    // Remove obstacles that go off screen and add new ones
    if (obstacle.x < -obstacle.width || obstacle.x > canvas.width ||
        obstacle.y < -obstacle.height || obstacle.y > canvas.height) {
      const index = obstacles.indexOf(obstacle);
      obstacles.splice(index, 1);
      obstacles.push(createObstacle());
    }
    
    // Check collision with player
    if (player.x + player.size > obstacle.x &&
        player.x - player.size < obstacle.x + obstacle.width &&
        player.y + player.size > obstacle.y &&
        player.y - player.size < obstacle.y + obstacle.height) {
      gameTime -= 5; // Penalty for hitting obstacle
      
      // Play hit sound
      if (audioEnabled) {
        generateTone(220, 0.3, 'sawtooth', 0.2);
      }
      
      if (gameTime <= 0) {
        endGame();
      }
    }
  });
  
  // Level progression
  if (coinsCollected > 0 && coinsCollected % 20 === 0 && coinsCollected / 20 > currentLevel - 1) {
    levelUp();
  }
}

function levelUp() {
  currentLevel++;
  player.speed += 0.5;
  gameTime += 15; // Bonus time
  
  // Add more obstacles
  obstacles.push(createObstacle());
  
  // Play level up sound
  if (audioEnabled) {
    generateTone(660, 0.2, 'sine', 0.4); // E5
    setTimeout(() => generateTone(880, 0.2, 'sine', 0.4), 200); // A5
    setTimeout(() => generateTone(1320, 0.3, 'sine', 0.4), 400); // E6
  }
  
  updateScore();
}

function updateScore() {
  document.getElementById('coinScore').textContent = coinsCollected;
  document.getElementById('level').textContent = currentLevel;
}

function updateTimer() {
  if (!gameRunning) return;
  
  gameTime--;
  document.getElementById('timeLeft').textContent = Math.max(0, gameTime);
  
  if (gameTime <= 0) {
    endGame();
  }
}

function endGame() {
  gameRunning = false;
  stopMusic();
  playGameOverSound();
  
  document.getElementById('finalScore').textContent = coinsCollected;
  document.getElementById('gameOver').style.display = 'block';
}

function restartGame() {
  gameRunning = true;
  gameTime = Math.max(30, 80 - selectedDifficulty * 10);
  currentLevel = selectedDifficulty;
  coinsCollected = 0;
  player.x = canvas.width / 2;
  player.y = canvas.height / 2;
  
  // Reset player speed based on character and difficulty
  const charData = characters[selectedCharacter];
  player.speed = charData.speed + (selectedDifficulty - 1) * 0.5;
  
  document.getElementById('gameOver').style.display = 'none';
  
  // Restart music
  if (audioEnabled && selections.music) {
    stopMusic();
    playMusicPattern(selections.music);
  }
  
  initGame();
  updateScore();
  document.getElementById('timeLeft').textContent = gameTime;
}

// Game loop
function gameLoop() {
  if (gameRunning) {
    update();
    draw();
  }
  requestAnimationFrame(gameLoop);
}

// Timer
setInterval(() => {
  if (gameRunning) {
    updateTimer();
  }
}, 1000);

// Start the game loop (but not the game itself)
gameLoop();
