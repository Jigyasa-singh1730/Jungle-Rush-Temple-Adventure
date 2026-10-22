
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const $ = (id) => document.getElementById(id);

const overlay = $("overlay");
const startBtn = $("startBtn");
const scoreEl = $("score");
const coinsEl = $("coins");

canvas.width = 600;
canvas.height = 800;

let running = false;
let score = 0;
let coins = 0;
let highScore = 0;
let speed = 300;
let objects = [];
let lastTime = 0;
let spawnTimer = 0;
let roadOffset = 0;
let jumpTime = 0;
let slideTime = 0;
let gameOver = false;

const player = {
  lane: 1,
  xLane: 1,
  y: 660
};

const laneX = [220, 300, 380];

function resetGame() {
  score = 0;
  coins = 0;
  speed = 300;
  objects = [];
  spawnTimer = 0;
  roadOffset = 0;
  jumpTime = 0;
  slideTime = 0;

  player.lane = 1;
  player.xLane = 1;

  scoreEl.textContent = "0";
  coinsEl.textContent = "0";
}

function startGame() {
  resetGame();
  gameOver = false;
  running = true;
  lastTime = performance.now();
  overlay.classList.add("hidden");
  requestAnimationFrame(loop);
}

function endGame() {
  running = false;
  gameOver = true;
  highScore = Math.max(highScore, score);

  $("messageTitle").textContent = "Game Over! 🎮";
  $("messageText").textContent =
    `Score: ${score} | Coins: ${coins} | Best: ${highScore}`;

  startBtn.textContent = "🔄 PLAY AGAIN";
  overlay.classList.remove("hidden");
}

function moveLeft() {
  if (running) player.lane = Math.max(0, player.lane - 1);
}

function moveRight() {
  if (running) player.lane = Math.min(2, player.lane + 1);
}

function jump() {
  if (running && jumpTime <= 0 && slideTime <= 0) {
    jumpTime = 0.75;
  }
}

function slide() {
  if (running && slideTime <= 0 && jumpTime <= 0) {
    slideTime = 0.65;
  }
}

// Keyboard controls
document.addEventListener("keydown", (e) => {
  if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", " "].includes(e.key)) {
    e.preventDefault();
  }

  if (e.repeat) return;

  if (e.key === "ArrowLeft" || e.key.toLowerCase() === "a") moveLeft();
  if (e.key === "ArrowRight" || e.key.toLowerCase() === "d") moveRight();
  if (e.key === "ArrowUp" || e.key === " ") jump();
  if (e.key === "ArrowDown" || e.key.toLowerCase() === "s") slide();
});

// Mobile and mouse controls
$("leftBtn").addEventListener("click", moveLeft);
$("rightBtn").addEventListener("click", moveRight);
$("jumpBtn").addEventListener("click", jump);
$("slideBtn").addEventListener("click", slide);
startBtn.addEventListener("click", startGame);

// Swipe controls
let touchStartX = 0;
let touchStartY = 0;

canvas.addEventListener("touchstart", (e) => {
  const t = e.changedTouches[0];
  touchStartX = t.clientX;
  touchStartY = t.clientY;
}, { passive: true });

canvas.addEventListener("touchend", (e) => {
  const t = e.changedTouches[0];
  const dx = t.clientX - touchStartX;
  const dy = t.clientY - touchStartY;

  if (Math.max(Math.abs(dx), Math.abs(dy)) < 25) return;

  if (Math.abs(dx) > Math.abs(dy)) {
    dx < 0 ? moveLeft() : moveRight();
  } else {
    dy < 0 ? jump() : slide();
  }
}, { passive: true });

// Draw colourful jungle background
function drawBackground() {
  const sky = ctx.createLinearGradient(0, 0, 0, 800);
  sky.addColorStop(0, "#26c6da");
  sky.addColorStop(0.42, "#a3ed9b");
  sky.addColorStop(1, "#087f45");

  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, 600, 800);

  // Sun
  ctx.fillStyle = "#fff176";
  ctx.beginPath();
  ctx.arc(490, 90, 48, 0, Math.PI * 2);
  ctx.fill();

  // Distant mountains
  ctx.fillStyle = "#5ac17a";
  ctx.beginPath();
  ctx.moveTo(0, 310);
  ctx.lineTo(100, 140);
  ctx.lineTo(210, 310);
  ctx.lineTo(350, 155);
  ctx.lineTo(510, 310);
  ctx.lineTo(600, 190);
  ctx.lineTo(600, 440);
  ctx.lineTo(0, 440);
  ctx.fill();

  // Jungle trees
  for (let i = 0; i < 10; i++) {
    const x = i * 75 - 10;
    const y = 245 + (i % 3) * 25;

    ctx.fillStyle = "#795548";
    ctx.fillRect(x, y, 15, 140);

    ctx.fillStyle = i % 2 ? "#087f23" : "#159447";
    ctx.beginPath();
    ctx.arc(x + 7, y, 38, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#42c85a";
    ctx.beginPath();
    ctx.arc(x - 12, y + 15, 24, 0, Math.PI * 2);
    ctx.fill();
  }

  // Temple in the distance
  ctx.fillStyle = "#d9a441";
  ctx.fillRect(255, 185, 90, 105);
  ctx.fillStyle = "#ffe082";

  ctx.beginPath();
  ctx.moveTo(240, 190);
  ctx.lineTo(300, 130);
  ctx.lineTo(360, 190);
  ctx.fill();

  ctx.fillStyle = "#6d4c41";
  ctx.fillRect(285, 230, 30, 60);

  // Road
  ctx.fillStyle = "#c49a65";
  ctx.beginPath();
  ctx.moveTo(255, 290);
  ctx.lineTo(345, 290);
  ctx.lineTo(570, 800);
  ctx.lineTo(30, 800);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#e6bf83";
  ctx.beginPath();
  ctx.moveTo(270, 290);
  ctx.lineTo(330, 290);
  ctx.lineTo(420, 800);
  ctx.lineTo(180, 800);
  ctx.closePath();
  ctx.fill();

  // Road edges
  ctx.strokeStyle = "#fff3c4";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(255, 290);
  ctx.lineTo(30, 800);
  ctx.moveTo(345, 290);
  ctx.lineTo(570, 800);
  ctx.stroke();

  // Moving lane markers
  ctx.strokeStyle = "#fff4cd";
  ctx.lineWidth = 4;
  ctx.setLineDash([35, 30]);
  ctx.lineDashOffset = -roadOffset;

  ctx.beginPath();
  ctx.moveTo(280, 290);
  ctx.lineTo(240, 800);
  ctx.moveTo(320, 290);
  ctx.lineTo(360, 800);
  ctx.stroke();

  ctx.setLineDash([]);
}

// Map a lane to the road perspective
function getX(lane, y) {
  const progress = Math.max(0, Math.min(1, (y - 290) / 510));
  const center = 300 + (lane - 1) * 180 * progress;
  return center;
}

function drawObject(obj) {
  const progress = Math.max(0, (obj.y - 290) / 510);
  const size = 12 + progress * 38;
  const x = getX(obj.lane, obj.y);

  if (obj.type === "coin") {
    ctx.save();
    ctx.font = `${size * 1.3}px Arial`;
    ctx.textAlign = "center";
    ctx.fillText("🪙", x, obj.y);
    ctx.restore();
  } else if (obj.type === "rock") {
    ctx.fillStyle = "#6b7280";
    ctx.beginPath();
    ctx.moveTo(x - size, obj.y);
    ctx.lineTo(x - size * 0.6, obj.y - size);
    ctx.lineTo(x + size * 0.5, obj.y - size * 0.9);
    ctx.lineTo(x + size, obj.y);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#9ca3af";
    ctx.fillRect(x - size * 0.35, obj.y - size * 0.6, size * 0.45, size * 0.2);
  } else if (obj.type === "barrier") {
    ctx.fillStyle = "#e53935";
    ctx.fillRect(x - size, obj.y - size, size * 2, size);

    ctx.fillStyle = "#ffca28";
    ctx.fillRect(x - size, obj.y - size * 0.7, size * 2, size * 0.25);

    ctx.fillStyle = "#8d2c23";
    ctx.fillRect(x - size, obj.y - size * 0.2, size * 2, size * 0.2);
  } else if (obj.type === "log") {
    ctx.fillStyle = "#7c3f18";
    ctx.fillRect(x - size * 1.4, obj.y - size * 1.5, size * 2.8, size * 0.45);

    ctx.fillStyle = "#d69a53";
    ctx.beginPath();
    ctx.arc(x - size * 1.2, obj.y - size * 1.27, size * 0.2, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Draw the player
function drawPlayer() {
  player.xLane += (player.lane - player.xLane) * 0.22;

  const x = getX(player.xLane, player.y);
  let y = player.y;
  let emoji = "🏃";

  if (jumpTime > 0) {
    const progress = 1 - jumpTime / 0.75;
    y -= Math.sin(progress * Math.PI) * 125;
  }

  if (slideTime > 0) emoji = "🏂";

  ctx.save();
  ctx.textAlign = "center";
  ctx.font = slideTime > 0 ? "54px Arial" : "66px Arial";
  ctx.shadowColor = "#ffffff";
  ctx.shadowBlur = 12;
  ctx.fillText(emoji, x, y);
  ctx.restore();
}

// Create obstacles and coins
function spawnObjects() {
  const lane = Math.floor(Math.random() * 3);
  const roll = Math.random();

  if (roll < 0.43) {
    objects.push({ type: "coin", lane, y: 300 });
  } else if (roll < 0.64) {
    objects.push({ type: "rock", lane, y: 300 });
  } else if (roll < 0.82) {
    objects.push({ type: "barrier", lane, y: 300 });
  } else {
    objects.push({ type: "log", lane, y: 300 });
  }

  // Sometimes add a coin trail in another lane
  if (Math.random() < 0.45) {
    const otherLane = (lane + 1 + Math.floor(Math.random() * 2)) % 3;

    for (let i = 0; i < 3; i++) {
      objects.push({
        type: "coin",
        lane: otherLane,
        y: 340 + i * 52
      });
    }
  }
}

function update(dt) {
  score += Math.floor(dt * 10);
  speed = Math.min(620, speed + dt * 5);
  roadOffset = (roadOffset + speed * dt) % 65;

  if (jumpTime > 0) jumpTime = Math.max(0, jumpTime - dt);
  if (slideTime > 0) slideTime = Math.max(0, slideTime - dt);

  spawnTimer += dt;

  const spawnInterval = Math.max(0.48, 0.95 - score / 5000);

  if (spawnTimer >= spawnInterval) {
    spawnTimer = 0;
    spawnObjects();
  }

  for (let i = objects.length - 1; i >= 0; i--) {
    const obj = objects[i];
    obj.y += speed * dt;

    const sameLane = obj.lane === Math.round(player.xLane);
    const nearPlayer = obj.y > 615 && obj.y < 710;

    if (sameLane && nearPlayer) {
      if (obj.type === "coin") {
        coins++;
        score += 25;
        objects.splice(i, 1);
        continue;
      }

      // Jump over rocks and barriers; slide under logs
      const safe =
        (obj.type === "rock" || obj.type === "barrier")
          ? jumpTime > 0.12
          : slideTime > 0.12;

      if (!safe) {
        endGame();
        return;
      }

      objects.splice(i, 1);
      continue;
    }

    if (obj.y > 850) {
      objects.splice(i, 1);
    }
  }

  scoreEl.textContent = score;
  coinsEl.textContent = coins;
}

function draw() {
  drawBackground();

  for (const obj of objects) {
    drawObject(obj);
  }

  drawPlayer();

  // Small in-game speed indicator
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 17px Arial";
  ctx.textAlign = "left";
  ctx.fillText("⚡ " + Math.floor(speed / 10), 18, 35);
}

function loop(timestamp) {
  if (!running) return;

  const dt = Math.min((timestamp - lastTime) / 1000, 0.04);
  lastTime = timestamp;

  update(dt);

  if (!running) {
    draw();
    return;
  }

  draw();
  requestAnimationFrame(loop);
}

// Initial scene
drawBackground();
drawPlayer();
