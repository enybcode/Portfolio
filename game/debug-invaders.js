const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const scoreText = document.getElementById("score");
const livesText = document.getElementById("lives");
const skillsText = document.getElementById("skills");
const startBtn = document.getElementById("startBtn");
const gameMessage = document.getElementById("gameMessage");

const goodWords = ["HTML", "CSS", "PHP", "SQL", "JAVA", "C#"];
const badWords = ["XSS", "SQLi", "NULL", "LOOP", "404", "CRASH", "MEM LEAK", "OVERFLOW", "DEADLOCK", "RACE"];
const matrixChars = ["0", "1", "01", "10", "00", "11", "<>", "{}", "[]", "/>", "//"];

const GOOD_SPAWN_CHANCE = 1 / 11;
const POINTS_DESTROY_SKILL = 100;
const POINTS_TOUCH_SKILL = 20;
const POINTS_DESTROY_BUG = 15;
const POINTS_TOUCH_BUG = -25;
const POINTS_MISS_BUG = -50;
const SCORE_GAME_OVER_LIMIT = -200;
const MAX_LIVES = 3;

let keys = {};
let bullets = [];
let objects = [];
let floatingTexts = [];
let rainColumns = [];
let damageFlash = 0;
let animationId = null;
let lastDisplayedLives = null;

let score = 0;
let lives = MAX_LIVES;
let skills = 0;
let gameRunning = false;
let spawnTimer = 0;

let player = {
    x: canvas.width / 2 - 30,
    y: canvas.height - 44,
    width: 60,
    height: 24,
    speed: 8.5
};

document.addEventListener("keydown", function(event) {
    keys[event.key.toLowerCase()] = true;

    if (event.code === "Space") {
        event.preventDefault();
        shoot();
    }
});

document.addEventListener("keyup", function(event) {
    keys[event.key.toLowerCase()] = false;
});

startBtn.addEventListener("click", startGame);

initializeRain();
updateInterface();
drawStartScreen();

function initializeRain() {
    rainColumns = [];
    const spacing = 26;
    const total = Math.ceil(canvas.width / spacing) + 2;

    for (let i = 0; i < total; i++) {
        rainColumns.push(createRainColumn(i * spacing + Math.random() * 8));
    }
}

function createRainColumn(x) {
    const length = 6 + Math.floor(Math.random() * 12);
    const glyphs = [];

    for (let i = 0; i < length; i++) {
        glyphs.push(randomMatrixChar());
    }

    return {
        x: x,
        y: Math.random() * -canvas.height,
        speed: 1 + Math.random() * 2.2,
        length: length,
        glyphs: glyphs,
        tick: Math.floor(Math.random() * 30)
    };
}

function randomMatrixChar() {
    return matrixChars[Math.floor(Math.random() * matrixChars.length)];
}

function startGame() {
    if (animationId !== null) {
        cancelAnimationFrame(animationId);
    }

    score = 0;
    lives = MAX_LIVES;
    skills = 0;
    bullets = [];
    objects = [];
    floatingTexts = [];
    damageFlash = 0;
    keys = {};
    spawnTimer = 0;
    lastDisplayedLives = null;

    player.x = canvas.width / 2 - player.width / 2;
    gameRunning = true;
    gameMessage.textContent = "";
    gameMessage.className = "game-message";

    updateInterface();
    gameLoop();
}

function shoot() {
    if (!gameRunning) return;

    bullets.push({
        x: player.x + player.width / 2 - 1,
        y: player.y - 6,
        width: 2,
        height: 18,
        speed: 10
    });
}

function spawnObject() {
    const isGood = Math.random() < GOOD_SPAWN_CHANCE;
    const wordList = isGood ? goodWords : badWords;
    const text = wordList[Math.floor(Math.random() * wordList.length)];

    objects.push({
        x: Math.random() * (canvas.width - 96),
        y: -120,
        width: 96,
        height: 112,
        speed: isGood ? 2 : 2.7,
        type: isGood ? "good" : "bad",
        text: text,
        streamLength: 4 + Math.floor(Math.random() * 3),
        drift: (Math.random() - 0.5) * 4,
        pulse: Math.random() * Math.PI * 2
    });
}

function gameLoop() {
    if (!gameRunning) return;

    update();
    draw();

    animationId = requestAnimationFrame(gameLoop);
}

function update() {
    movePlayer();
    moveBullets();
    moveObjects();
    checkCollisions();
    updateFloatingTexts();
    updateRainColumns();

    if (damageFlash > 0) {
        damageFlash--;
    }

    spawnTimer++;

    if (spawnTimer > 45) {
        spawnObject();
        spawnTimer = 0;
    }

    if (skills >= 10) {
        winGame();
        return;
    }

    if (lives <= 0) {
        loseGame("Compilation échouée : plus aucun cœur disponible.");
        return;
    }

    if (score <= SCORE_GAME_OVER_LIMIT) {
        loseGame("Game over : le score est descendu à -200.");
        return;
    }

    updateInterface();
}

function updateRainColumns() {
    for (let i = 0; i < rainColumns.length; i++) {
        const column = rainColumns[i];
        column.y += column.speed;
        column.tick++;

        if (column.tick % 8 === 0) {
            const index = Math.floor(Math.random() * column.length);
            column.glyphs[index] = randomMatrixChar();
        }

        if (column.y - column.length * 18 > canvas.height) {
            rainColumns[i] = createRainColumn(column.x);
        }
    }
}

function movePlayer() {
    if (keys["arrowleft"] || keys["a"]) player.x -= player.speed;
    if (keys["arrowright"] || keys["d"]) player.x += player.speed;

    if (player.x < 0) player.x = 0;
    if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;
}

function moveBullets() {
    for (let i = bullets.length - 1; i >= 0; i--) {
        bullets[i].y -= bullets[i].speed;
        if (bullets[i].y + bullets[i].height < 0) bullets.splice(i, 1);
    }
}

function moveObjects() {
    for (let i = objects.length - 1; i >= 0; i--) {
        objects[i].y += objects[i].speed;
        objects[i].pulse += 0.04;

        if (objects[i].y > canvas.height) {
            if (objects[i].type === "bad") {
                score += POINTS_MISS_BUG;
                triggerPointLoss(POINTS_MISS_BUG, objects[i].x + objects[i].width / 2, canvas.height - 35);
            }
            objects.splice(i, 1);
        }
    }
}

function checkCollisions() {
    for (let i = objects.length - 1; i >= 0; i--) {
        const obj = objects[i];

        if (isColliding(player, obj)) {
            if (obj.type === "good") {
                skills++;
                score += POINTS_TOUCH_SKILL;
                addFloatingText("+" + POINTS_TOUCH_SKILL, obj.x + obj.width / 2, obj.y, "white");
            } else {
                lives--;
                score += POINTS_TOUCH_BUG;
                triggerPointLoss(POINTS_TOUCH_BUG, obj.x + obj.width / 2, obj.y);
            }

            objects.splice(i, 1);
            continue;
        }

        for (let j = bullets.length - 1; j >= 0; j--) {
            const bullet = bullets[j];

            if (isColliding(bullet, obj)) {
                if (obj.type === "bad") {
                    score += POINTS_DESTROY_BUG;
                    addFloatingText("+" + POINTS_DESTROY_BUG, obj.x + obj.width / 2, obj.y, "#ff4b4b");
                } else {
                    skills++;
                    score += POINTS_DESTROY_SKILL;
                    addFloatingText("+" + POINTS_DESTROY_SKILL, obj.x + obj.width / 2, obj.y, "white");
                }

                objects.splice(i, 1);
                bullets.splice(j, 1);
                break;
            }
        }
    }
}

function isColliding(a, b) {
    return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

function addFloatingText(text, x, y, color) {
    floatingTexts.push({ text, x, y, color, life: 45, maxLife: 45, speedY: -1.1 });
}

function triggerPointLoss(points, x, y) {
    damageFlash = 18;
    addFloatingText(points.toString(), x, y, "#ff4b4b");

    canvas.classList.remove("damage-shake");
    void canvas.offsetWidth;
    canvas.classList.add("damage-shake");

    setTimeout(function() {
        canvas.classList.remove("damage-shake");
    }, 260);
}

function updateFloatingTexts() {
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
        floatingTexts[i].y += floatingTexts[i].speedY;
        floatingTexts[i].life--;
        if (floatingTexts[i].life <= 0) floatingTexts.splice(i, 1);
    }
}

function drawDamageOverlay() {
    if (damageFlash <= 0) return;
    const opacity = damageFlash / 90;

    ctx.save();
    ctx.fillStyle = "rgba(255, 0, 0, " + opacity + ")";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
}

function drawFloatingTexts() {
    for (const effect of floatingTexts) {
        const opacity = effect.life / effect.maxLife;

        ctx.save();
        ctx.globalAlpha = opacity;
        ctx.fillStyle = effect.color;
        ctx.font = "bold 22px Courier New";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(effect.text, effect.x, effect.y);
        ctx.restore();
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const shakeX = damageFlash > 0 ? (Math.random() - 0.5) * 7 : 0;
    const shakeY = damageFlash > 0 ? (Math.random() - 0.5) * 4 : 0;

    ctx.save();
    ctx.translate(shakeX, shakeY);
    drawMatrixBackground();
    drawObjects();
    drawBullets();
    drawPlayer();
    ctx.restore();

    drawDamageOverlay();
    drawFloatingTexts();
}

function drawStartScreen() {
    updateRainColumns();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawMatrixBackground();

    ctx.save();
    ctx.fillStyle = "rgba(0, 0, 0, 0.64)";
    ctx.fillRect(120, 180, canvas.width - 240, 88);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.18)";
    ctx.strokeRect(120, 180, canvas.width - 240, 88);
    ctx.fillStyle = "white";
    ctx.font = "bold 34px Courier New";
    ctx.textAlign = "center";
    ctx.fillText("DEBUG INVADERS", canvas.width / 2, 232);
    ctx.restore();
}

function drawMatrixBackground() {
    ctx.fillStyle = "#020202";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.font = "14px Courier New";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";

    for (const column of rainColumns) {
        for (let i = 0; i < column.length; i++) {
            const y = column.y - i * 18;
            if (y < -20 || y > canvas.height + 20) continue;

            const isHead = i === 0;
            const alpha = isHead ? 0.32 : Math.max(0.03, 0.14 - i * 0.01);
            ctx.fillStyle = "rgba(255, 255, 255, " + alpha + ")";
            ctx.fillText(column.glyphs[i], column.x, y);
        }
    }

    ctx.restore();

    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,0.045)";
    for (let y = 0; y < canvas.height; y += 4) {
        ctx.beginPath();
        ctx.moveTo(0, y + 0.5);
        ctx.lineTo(canvas.width, y + 0.5);
        ctx.stroke();
    }
    ctx.restore();
}

function drawPlayer() {
    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,0.95)";
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.lineWidth = 1;
    ctx.fillRect(player.x, player.y, player.width, player.height);
    ctx.strokeRect(player.x, player.y, player.width, player.height);

    ctx.fillStyle = "white";
    ctx.font = "bold 15px Courier New";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(">_", player.x + player.width / 2, player.y + player.height / 2 + 1);

    ctx.strokeStyle = "rgba(255,255,255,0.3)";
    ctx.beginPath();
    ctx.moveTo(player.x + player.width / 2, player.y);
    ctx.lineTo(player.x + player.width / 2, player.y - 12);
    ctx.stroke();
    ctx.restore();
}

function drawBullets() {
    for (const bullet of bullets) {
        ctx.save();
        ctx.strokeStyle = "rgba(255,255,255,0.95)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(bullet.x + 1, bullet.y + bullet.height);
        ctx.lineTo(bullet.x + 1, bullet.y);
        ctx.stroke();
        ctx.restore();
    }
}

function drawObjects() {
    for (const obj of objects) drawMatrixStream(obj);
}

function drawMatrixStream(obj) {
    const red = obj.type === "bad";
    const mainColor = red ? "255, 75, 75" : "255, 255, 255";
    const shadowColor = red ? "70, 0, 0" : "70, 70, 70";
    const headX = obj.x + obj.width / 2 + Math.sin(obj.pulse) * obj.drift;
    const segmentGap = 16;
    const baseY = obj.y + 6;

    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "top";

    ctx.strokeStyle = "rgba(" + mainColor + ", 0.12)";
    ctx.beginPath();
    ctx.moveTo(headX, obj.y + 2);
    ctx.lineTo(headX, obj.y + obj.height - 4);
    ctx.stroke();

    for (let i = 0; i < obj.streamLength; i++) {
        const y = baseY + i * segmentGap;
        const opacity = i === 0 ? 0.98 : Math.max(0.15, 0.55 - i * 0.1);
        const fontSize = i === 0 ? 16 : 12;
        const label = i === 0 ? obj.text : getTrailLabel(obj.text, i);
        const xOffset = Math.sin(obj.pulse + i * 0.5) * 2.5;

        ctx.fillStyle = "rgba(" + shadowColor + ", " + Math.min(0.45, opacity) + ")";
        ctx.font = "bold " + fontSize + "px Courier New";
        ctx.fillText(label, headX + xOffset + 1, y + 1);

        ctx.fillStyle = "rgba(" + mainColor + ", " + opacity + ")";
        ctx.fillText(label, headX + xOffset, y);
    }

    for (let j = 0; j < 3; j++) {
        const sideX = headX + (j - 1) * 20;
        const sideY = baseY + 10 + j * 22;
        const sideText = red ? badWords[(j + Math.floor(obj.pulse * 10)) % badWords.length].slice(0, 2) : matrixChars[(j + Math.floor(obj.pulse * 10)) % matrixChars.length];
        ctx.fillStyle = "rgba(" + mainColor + ", 0.18)";
        ctx.font = "11px Courier New";
        ctx.fillText(sideText, sideX, sideY);
    }

    ctx.restore();
}

function getTrailLabel(text, index) {
    if (index === 1) return text;
    if (index === 2) return text.slice(0, Math.max(2, Math.ceil(text.length / 2)));
    if (index === 3) return matrixChars[index % matrixChars.length];
    return matrixChars[(index + text.length) % matrixChars.length];
}

function updateInterface() {
    scoreText.textContent = score;
    skillsText.textContent = skills;
    updateLivesHearts();
}

function updateLivesHearts() {
    if (lastDisplayedLives === lives) return;

    livesText.innerHTML = "";

    for (let i = 0; i < MAX_LIVES; i++) {
        const heart = document.createElement("span");
        heart.className = i < lives ? "pixel-heart active" : "pixel-heart empty";
        heart.title = i < lives ? "Vie disponible" : "Vie perdue";
        livesText.appendChild(heart);
    }

    lastDisplayedLives = lives;
}

function winGame() {
    gameRunning = false;
    cancelAnimationFrame(animationId);
    animationId = null;

    gameMessage.className = "game-message success";
    gameMessage.textContent = "Projet compilé avec succès.";
}

function loseGame(reason) {
    gameRunning = false;
    cancelAnimationFrame(animationId);
    animationId = null;
    updateInterface();

    gameMessage.className = "game-message error";
    gameMessage.textContent = reason || "Compilation échouée.";
}
