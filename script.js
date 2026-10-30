
const mazeEl = document.getElementById("maze");
const timerEl = document.getElementById("timer");
const scoreEl = document.getElementById("score");
const bestScoreEl = document.getElementById("bestScore");
const levelSelect = document.getElementById("level");

let size;
let maze = [];
let player, exit;
let time = 10;
let score = 0;
let timerInterval;

// Load the saved best score
let bestScore = Number(localStorage.getItem("bestScore")) || 0;
bestScoreEl.textContent = bestScore;
scoreEl.textContent = score;

// Configure difficulty
function setupLevel() {
  const lvl = levelSelect.value;

  if (lvl === "easy") size = 9;
  else if (lvl === "medium") size = 13;
  else size = 17;
}

// Generate a maze using randomized DFS
function generateMaze() {
  setupLevel();

  // Initially, every cell is a wall
  maze = Array.from(
    { length: size },
    () => Array(size).fill("wall")
  );

  mazeEl.innerHTML = "";
  mazeEl.style.gridTemplateColumns = `repeat(${size}, 42px)`;

  // Starting position and exit
  player = { x: 1, y: 1 };
  exit = { x: size - 2, y: size - 2 };

  // DFS stack starts at the first room
  const stack = [{ x: 1, y: 1 }];
  maze[1][1] = "path";

  // Directions to neighboring rooms
  const directions = [
    [0, -2],
    [0, 2],
    [-2, 0],
    [2, 0]
  ];

  while (stack.length > 0) {
    // Current room is the top of the stack
    const current = stack[stack.length - 1];

    // Find unvisited neighboring rooms
    const neighbors = directions
      .map(([dx, dy]) => ({
        x: current.x + dx,
        y: current.y + dy
      }))
      .filter(({ x, y }) =>
        x > 0 &&
        y > 0 &&
        x < size - 1 &&
        y < size - 1 &&
        maze[y][x] === "wall"
      );

    if (neighbors.length > 0) {
      // Choose a random unvisited neighbor
      const next =
        neighbors[Math.floor(Math.random() * neighbors.length)];

      // Find the wall between the current and next rooms
      const wallX = (current.x + next.x) / 2;
      const wallY = (current.y + next.y) / 2;

      // Carve the passage
      maze[wallY][wallX] = "path";
      maze[next.y][next.x] = "path";

      // Continue deeper into the maze
      stack.push(next);
    } else {
      // No unvisited neighbors: backtrack
      stack.pop();
    }
  }

  // Create HTML cells from the generated maze
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const cell = document.createElement("div");
      cell.className = "cell";

      if (maze[y][x] === "wall") {
        cell.classList.add("wall");
      }

      if (x === exit.x && y === exit.y) {
        cell.classList.add("exit");
      }

      mazeEl.appendChild(cell);
    }
  }

  render();
}

// Render the player
function render() {
  mazeEl.querySelectorAll(".cell").forEach(cell => {
    cell.classList.remove("player", "hint");
  });

  const index = player.y * size + player.x;
  mazeEl.children[index].classList.add("player");
}

// Move the player
function move(dx, dy) {
  const nx = player.x + dx;
  const ny = player.y + dy;

  // Prevent movement outside the maze
  if (nx < 0 || ny < 0 || nx >= size || ny >= size) {
    return;
  }

  // Prevent movement through walls
  if (maze[ny][nx] === "wall") {
    return;
  }

  player.x = nx;
  player.y = ny;

  render();

  // Check whether the player reached the exit
  if (nx === exit.x && ny === exit.y) {
    score += time * 2;
    scoreEl.textContent = score;

    // Save a new best score
    if (score > bestScore) {
      bestScore = score;
      localStorage.setItem("bestScore", bestScore);
      bestScoreEl.textContent = bestScore;
    }

    resetLoop();
  }
}

// Find a valid next step using BFS for the hint
function showHint() {
  const queue = [{ x: player.x, y: player.y }];
  const visited = new Set();
  const parent = new Map();

  const key = ({ x, y }) => `${x},${y}`;
  const directions = [
    [0, -1],
    [0, 1],
    [-1, 0],
    [1, 0]
  ];

  visited.add(key(player));
  let found = false;

  while (queue.length > 0) {
    const current = queue.shift();

    if (current.x === exit.x && current.y === exit.y) {
      found = true;
      break;
    }

    for (const [dx, dy] of directions) {
      const next = {
        x: current.x + dx,
        y: current.y + dy
      };

      if (
        next.x < 0 ||
        next.y < 0 ||
        next.x >= size ||
        next.y >= size ||
        maze[next.y][next.x] === "wall" ||
        visited.has(key(next))
      ) {
        continue;
      }

      visited.add(key(next));
      parent.set(key(next), current);
      queue.push(next);
    }
  }

  if (!found) return;

  // Trace the path backwards to find the first step
  let current = { x: exit.x, y: exit.y };

  while (parent.has(key(current))) {
    const previous = parent.get(key(current));

    if (key(previous) === key(player)) {
      const index = current.y * size + current.x;
      mazeEl.children[index].classList.add("hint");
      return;
    }

    current = previous;
  }
}

// Reset the current round
function resetLoop() {
  time = 10;
  timerEl.textContent = time;
  generateMaze();
}

// Toggle between light and dark themes
function toggleTheme() {
  const isLight = document.body.classList.contains("light");

  document.body.classList.toggle("light", !isLight);
  document.body.classList.toggle("dark", isLight);
}

// Keyboard controls
document.addEventListener("keydown", e => {
  const moves = {
    ArrowUp: [0, -1],
    ArrowDown: [0, 1],
    ArrowLeft: [-1, 0],
    ArrowRight: [1, 0]
  };

  if (moves[e.key]) {
    e.preventDefault();
    move(...moves[e.key]);
  }
});

// Countdown timer: use only one interval
function startTimer() {
  if (timerInterval) clearInterval(timerInterval);

  timerInterval = setInterval(() => {
    time--;

    if (time <= 0) {
      resetLoop();
    } else {
      timerEl.textContent = time;
    }
  }, 1000);
}

// Changing difficulty starts a new round
levelSelect.addEventListener("change", resetLoop);

// Start the game
generateMaze();
startTimer();
