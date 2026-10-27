const mazeEl = document.getElementById("maze");
const timerEl = document.getElementById("timer");
const scoreEl = document.getElementById("score");
const bestScoreEl = document.getElementById("bestScore");
const levelSelect = document.getElementById("level");

let size, wallChance;
let maze = [];
let player, exit;
let time = 10;
let score = 0;

bestScoreEl.textContent = localStorage.getItem("bestScore") || 0;

function setupLevel() {
  const lvl = levelSelect.value;
  if (lvl === "easy") [size, wallChance] = [6, 0.2];
  if (lvl === "medium") [size, wallChance] = [8, 0.3];
  if (lvl === "hard") [size, wallChance] = [10, 0.4];
}

function generateMaze() {
  setupLevel();
  maze = [];
  mazeEl.innerHTML = "";
  mazeEl.style.gridTemplateColumns = `repeat(${size}, 42px)`;

  player = { x: 0, y: 0 };
  exit = { x: size - 1, y: size - 1 };

  for (let y = 0; y < size; y++) {
    maze[y] = [];
    for (let x = 0; x < size; x++) {
      const cell = document.createElement("div");
      cell.className = "cell";

      const isWall =
        Math.random() < wallChance &&
        !(x === 0 && y === 0) &&
        !(x === exit.x && y === exit.y);

      maze[y][x] = isWall ? "wall" : "path";

      if (isWall) cell.classList.add("wall");
      if (x === exit.x && y === exit.y) cell.classList.add("exit");

      mazeEl.appendChild(cell);
    }
  }
  render();
}

function render() {
  document.querySelectorAll(".cell").forEach(c =>
    c.classList.remove("player", "hint")
  );
  mazeEl.children[player.y * size + player.x].classList.add("player");
}

function move(dx, dy) {
  const nx = player.x + dx;
  const ny = player.y + dy;
  if (nx < 0 || ny < 0 || nx >= size || ny >= size) return;
  if (maze[ny][nx] === "wall") return;

  player.x = nx;
  player.y = ny;
  render();

  if (nx === exit.x && ny === exit.y) {
    score += time * 2;
    scoreEl.textContent = score;
    if (score > bestScoreEl.textContent) {
      localStorage.setItem("bestScore", score);
      bestScoreEl.textContent = score;
    }
    resetLoop();
  }
}

function showHint() {
  const dx = Math.sign(exit.x - player.x);
  const dy = Math.sign(exit.y - player.y);

  const hx = player.x + dx;
  const hy = player.y + dy;

  if (maze[hy]?.[hx] !== "wall") {
    mazeEl.children[hy * size + hx].classList.add("hint");
  }
}

function resetLoop() {
  time = 10;
  generateMaze();
}

function toggleTheme() {
  document.body.classList.toggle("light");
  document.body.classList.toggle("dark");
}

document.addEventListener("keydown", e => {
  if (e.key === "ArrowUp") move(0, -1);
  if (e.key === "ArrowDown") move(0, 1);
  if (e.key === "ArrowLeft") move(-1, 0);
  if (e.key === "ArrowRight") move(1, 0);
});

setInterval(() => {
  time--;
  timerEl.textContent = time;
  if (time === 0) resetLoop();
}, 1000);

levelSelect.onchange = resetLoop;
generateMaze();