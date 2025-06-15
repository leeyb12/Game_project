const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');

context.scale(20, 20);

const rows = 20;
const cols = 12;

function createMatrix(w, h) {
    const matrix = [];
    while (h--) {
        matrix.push(new Array(w).fill(0));
    }
    return matrix;
}

const arena = createMatrix(cols, rows);

function createPiece(type) {
    switch(type) {
        case 'T': return [[0, 1, 0], [1, 1, 1], [0, 0, 0]];
        case 'O': return [[2, 2], [2, 2]];
        case 'L': return [[0, 0, 3], [3, 3, 3], [0, 0, 0]];
        case 'J': return [[4, 0, 0], [4, 4, 4], [0, 0, 0]];
        case 'I': return [[0, 5, 0, 0], [0, 5, 0, 0], [0, 5, 0, 0], [0, 5, 0, 0]];
        case 'S': return [[0, 6, 6], [6, 6, 0], [0, 0, 0]];
        case 'Z': return [[7, 7, 0], [0, 7, 7], [0, 0, 0]];
    }
}

const colors = [null, 'purple', 'yellow', 'orange', 'blue', 'cyan', 'green', 'red'];

function drawMatrix(matrix, offset, isGhost = false) {
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                context.fillStyle = isGhost ? 'white' : colors[value];
                context.globalAlpha = isGhost ? 0.3 : 1.0;
                context.fillRect(x + offset.x, y + offset.y, 1, 1);
                if (!isGhost) {
                    context.strokeStyle = 'black';
                    context.lineWidth = 0.1;
                    context.strokeRect(x + offset.x, y + offset.y, 1, 1);
                }
                context.globalAlpha = 1.0;
            }
        });
    });
}

function getGhostPosition() {
    const ghost = {
        pos: { x: player.pos.x, y: player.pos.y },
        matrix: player.matrix,
    };
    while (!collide(arena, ghost)) {
        ghost.pos.y++;
    }
    ghost.pos.y--;
    return ghost;
}

function draw() {
    context.fillStyle = '#000';
    context.fillRect(0, 0, canvas.width, canvas.height);

    drawMatrix(arena, {x: 0, y: 0});
    drawMatrix(getGhostPosition().matrix, getGhostPosition().pos, true); // 고스트 블록
    drawMatrix(player.matrix, player.pos); // 실제 블록
}

function collide(arena, player) {
    const [m, o] = [player.matrix, player.pos];
    for (let y = 0; y < m.length; y++) {
        for (let x = 0; x < m[y].length; x++) {
            if (m[y][x] !== 0 &&
                (arena[y + o.y] && arena[y + o.y][x + o.x]) !== 0) {
                return true;
            }
        }
    }
    return false;
}

function merge(arena, player) {
    player.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                arena[y + player.pos.y][x + player.pos.x] = value;
            }
        });
    });
}

function rotate(matrix, clockwise = true) {
    for (let y = 0; y < matrix.length; ++y) {
        for (let x = 0; x < y; ++x) {
            [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
        }
    }

    if (clockwise) {
        matrix.forEach(row => row.reverse());
    } else {
        matrix.reverse();
    }
}

function playerReset() {
    const pieces = 'TJLOSZI';
    player.matrix = createPiece(pieces[Math.floor(Math.random() * pieces.length)]);
    player.pos.y = 0;
    player.pos.x = Math.floor(cols / 2) - Math.floor(player.matrix[0].length / 2);
    if (collide(arena, player)) {
        arena.forEach(row => row.fill(0));
        player.score = 0;
        updateScore();
        alert('Game Over');
    }
}

function arenaSweep() {
    let rowCount = 1;
    let linesCleared = 0;

    outer: for (let y = arena.length - 1; y >= 0; y--) {
        for (let x = 0; x < arena[y].length; x++) {
            if (arena[y][x] === 0) {
                continue outer;
            }
        }
        arena.splice(y, 1);
        arena.unshift(new Array(cols).fill(0));
        y++;
        linesCleared++;
        player.score += rowCount * 10;
        rowCount *= 2;
    }

    if (linesCleared > 0) {
        updateScore();
        updateDropSpeed();
    }
}

function updateScore() {
    document.getElementById('score').innerText = player.score;
}

let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;

function updateDropSpeed() {
    if (player.score >= 2500) dropInterval = 200;
    else if (player.score >= 1500) dropInterval = 300;
    else if (player.score >= 1000) dropInterval = 400;
    else if (player.score >= 500) dropInterval = 600;
    else if (player.score >= 200) dropInterval = 800;
    else dropInterval = 1000;
}

function playerDrop() {
    player.pos.y++;
    if (collide(arena, player)) {
        player.pos.y--;
        merge(arena, player);
        arenaSweep();
        playerReset();
    }
    dropCounter = 0;
}

function hardDrop() {
    while (!collide(arena, player)) {
        player.pos.y++;
    }
    player.pos.y--;
    playerDrop();
}

document.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') {
        player.pos.x--;
        if (collide(arena, player)) player.pos.x++;
    } else if (e.key === 'ArrowRight') {
        player.pos.x++;
        if (collide(arena, player)) player.pos.x--;
    } else if (e.key === 'ArrowDown') {
        playerDrop();
    } else if (e.key === 'ArrowUp') {
        rotate(player.matrix);
        if (collide(arena, player)) rotate(player.matrix, false);
    } else if (e.key === ' ') {
        hardDrop();
    }
});

function update(time = 0) {
    const deltaTime = time - lastTime;
    lastTime = time;

    dropCounter += deltaTime;
    if (dropCounter > dropInterval) {
        playerDrop();
    }

    draw();
    requestAnimationFrame(update);
}

const player = {
    pos: { x: 0, y: 0 },
    matrix: null,
    score: 0,
};

playerReset();
updateScore();
update();
