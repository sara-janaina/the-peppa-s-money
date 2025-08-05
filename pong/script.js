const canvas = document.getElementById('pongCanvas');
const ctx = canvas.getContext('2d');

const paddleHeight = 80, paddleWidth = 12;
const playerX = 10, computerX = canvas.width - paddleWidth - 10;
let playerY = (canvas.height - paddleHeight) / 2;
let computerY = (canvas.height - paddleHeight) / 2;
let playerSpeed = 0;

const ballSize = 14;
let ballX = canvas.width / 2 - ballSize / 2;
let ballY = canvas.height / 2 - ballSize / 2;
let ballSpeedX = 5 * (Math.random() > 0.5 ? 1 : -1);
let ballSpeedY = 3 * (Math.random() > 0.5 ? 1 : -1);

let playerScore = 0;
let computerScore = 0;

// Paddle movement with keys
document.addEventListener('keydown', (e) => {
  if (e.key === "ArrowUp") playerSpeed = -7;
  if (e.key === "ArrowDown") playerSpeed = 7;
});
document.addEventListener('keyup', (e) => {
  if (e.key === "ArrowUp" || e.key === "ArrowDown") playerSpeed = 0;
});

// Paddle movement with mouse
canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  const mouseY = e.clientY - rect.top;
  playerY = mouseY - paddleHeight / 2;
  clampPlayerY();
});

function clampPlayerY() {
  if (playerY < 0) playerY = 0;
  if (playerY + paddleHeight > canvas.height) playerY = canvas.height - paddleHeight;
}

function clampComputerY() {
  if (computerY < 0) computerY = 0;
  if (computerY + paddleHeight > canvas.height) computerY = canvas.height - paddleHeight;
}

function resetBall() {
  ballX = canvas.width / 2 - ballSize / 2;
  ballY = canvas.height / 2 - ballSize / 2;
  ballSpeedX = 5 * (Math.random() > 0.5 ? 1 : -1);
  ballSpeedY = 3 * (Math.random() > 0.5 ? 1 : -1);
}

function draw() {
  // Clear
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw paddles
  ctx.fillStyle = "#fff";
  ctx.fillRect(playerX, playerY, paddleWidth, paddleHeight);
  ctx.fillRect(computerX, computerY, paddleWidth, paddleHeight);

  // Draw ball
  ctx.fillRect(ballX, ballY, ballSize, ballSize);
}

function update() {
  // Move paddles
  playerY += playerSpeed;
  clampPlayerY();

  // Computer paddle AI
  if (computerY + paddleHeight/2 < ballY + ballSize/2) computerY += 4;
  else if (computerY + paddleHeight/2 > ballY + ballSize/2) computerY -= 4;
  clampComputerY();

  // Move ball
  ballX += ballSpeedX;
  ballY += ballSpeedY;

  // Wall collision
  if (ballY <= 0 || ballY + ballSize >= canvas.height) {
    ballSpeedY = -ballSpeedY;
    ballY = ballY <= 0 ? 0 : canvas.height - ballSize;
  }

  // Paddle collision
  // Left paddle
  if (
    ballX <= playerX + paddleWidth &&
    ballX >= playerX &&
    ballY + ballSize >= playerY &&
    ballY <= playerY + paddleHeight
  ) {
    ballSpeedX = Math.abs(ballSpeedX);
    // Add some randomness based on where it hit
    let hitPos = (ballY + ballSize/2) - (playerY + paddleHeight/2);
    ballSpeedY += hitPos * 0.05;
    ballX = playerX + paddleWidth; // Prevent sticking
  }

  // Right paddle
  if (
    ballX + ballSize >= computerX &&
    ballX + ballSize <= computerX + paddleWidth &&
    ballY + ballSize >= computerY &&
    ballY <= computerY + paddleHeight
  ) {
    ballSpeedX = -Math.abs(ballSpeedX);
    let hitPos = (ballY + ballSize/2) - (computerY + paddleHeight/2);
    ballSpeedY += hitPos * 0.05;
    ballX = computerX - ballSize;
  }

  // Score
  if (ballX < 0) {
    computerScore++;
    updateScoreboard();
    resetBall();
  }
  if (ballX + ballSize > canvas.width) {
    playerScore++;
    updateScoreboard();
    resetBall();
  }
}

function updateScoreboard() {
  document.getElementById('playerScore').textContent = playerScore;
  document.getElementById('computerScore').textContent = computerScore;
}

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

gameLoop();