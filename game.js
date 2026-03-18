// Hämta canvas om den finns, annars skapa en ny
let canvas = document.querySelector("canvas");

if (!canvas) {
    canvas = document.createElement("canvas");
    document.body.appendChild(canvas);
}

document.body.style.margin = "0";
document.body.style.overflow = "hidden";

const ctx = canvas.getContext("2d");

// Anpassa canvas till fönstrets storlek
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);


// Ladda bilder
const playerImages = [new Image(), new Image()];
playerImages[0].src = "otto_java.png";
playerImages[1].src = "otto_java2.png";

const obstacleImages = [new Image(), new Image()];
obstacleImages[0].src = "soptunna.png";
obstacleImages[1].src = "burgare.png";


// Spelaren
const player = {
    x: 200,
    y: 0,
    size: 90,
    colorIndex: 0
};


// Hinder och spelvariabler
let obstacles = [];
let speed = 4;
let score = 0;

let gameState = "menu";


// Spawn-logik baserat på avstånd istället för tid
let distanceSinceSpawn = 0;
const spawnDistance = 450; // avstånd mellan hinder i pixlar


// Bakgrundsfärgens övergång
let colorProgress = 0;


// Knapp för meny och gameover
class Button {
    constructor(text, x, y, w, h) {
        this.text = text;
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
    }

    draw() {
        ctx.fillStyle = "white";
        ctx.fillRect(this.x, this.y, this.w, this.h);

        ctx.fillStyle = "black";
        ctx.font = "30px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        ctx.fillText(this.text,
            this.x + this.w / 2,
            this.y + this.h / 2
        );
    }

    isClicked(mx, my) {
        return (
            mx > this.x &&
            mx < this.x + this.w &&
            my > this.y &&
            my < this.y + this.h
        );
    }
}


// Knapparna uppdateras när fönstret ändras för att alltid vara centrerade
let startButton;
let restartButton;

function updateButtons() {
    startButton = new Button(
        "START",
        canvas.width / 2 - 100,
        canvas.height / 2 - 40,
        200,
        80
    );

    restartButton = new Button(
        "RESTART",
        canvas.width / 2 - 100,
        canvas.height / 2 + 40,
        200,
        80
    );
}

updateButtons();
window.addEventListener("resize", updateButtons);


// Inputhantering
document.addEventListener("keydown", (e) => {
    if (gameState !== "playing") return;

    if (e.code === "Space") {
        player.colorIndex = (player.colorIndex + 1) % 2;
    }
});

canvas.addEventListener("click", (e) => {

    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    if (gameState === "menu" && startButton.isClicked(mx, my)) {
        startGame();
    }

    if (gameState === "gameover" && restartButton.isClicked(mx, my)) {
        startGame();
    }
});


// Hinder
class Obstacle {
    constructor() {
        this.size = 90;
        this.x = canvas.width + this.size;
        this.y = canvas.height / 2 - this.size / 2;
        this.colorIndex = Math.floor(Math.random() * 2);
    }

    update() {
        this.x -= speed;
    }

    draw() {
        ctx.drawImage(
            obstacleImages[this.colorIndex],
            this.x,
            this.y,
            this.size,
            this.size
        );
    }
}


// Spawna hinder
function spawnObstacle() {
    obstacles.push(new Obstacle());
}


// Startar spelet
function startGame() {

    obstacles = [];
    speed = 4;
    score = 0;
    distanceSinceSpawn = 0;

    gameState = "playing";

    spawnObstacle();
}


// Skar kollisionsdetektering
function isColliding(a, b) {
    return (
        a.x < b.x + b.size &&
        a.x + a.size > b.x &&
        a.y < b.y + b.size &&
        a.y + a.size > b.y
    );
}


// Hjälper övegången mellan färger i bakgrunden
function lerp(a, b, t) {
    return a + (b - a) * t;
}

function lerpColor(c1, c2, t) {
    return {
        r: Math.floor(lerp(c1.r, c2.r, t)),
        g: Math.floor(lerp(c1.g, c2.g, t)),
        b: Math.floor(lerp(c1.b, c2.b, t))
    };
}

const colors = [
    { r: 200, g: 40, b: 40 },
    { r: 40, g: 80, b: 220 },
    { r: 40, g: 200, b: 80 }
];


// Uppdaterar spelet
function update() {

    if (gameState !== "playing") return;

    player.y = canvas.height / 2 - player.size / 2;

    // Räkna avståndet som har gått sedan senaste spawnen
    distanceSinceSpawn += speed;

    // spawn baserat på avstånd istället för tid
    if (distanceSinceSpawn >= spawnDistance) {
        spawnObstacle();
        distanceSinceSpawn = 0;
    }

    for (let i = obstacles.length - 1; i >= 0; i--) {

        const o = obstacles[i];
        o.update();

        if (isColliding(player, o)) {

            if (o.colorIndex !== player.colorIndex) {
                gameState = "gameover";
            } else {
                if (o.colorIndex === 1) {
                    score += 10;
                    speed += 0.3; // spelet blir svårare
                    obstacles.splice(i, 1);
                }
            }
        }

        if (o.x + o.size < 0) {
            obstacles.splice(i, 1);
        }
    }

    colorProgress += 0.002;
}


// Bakgrunds färg övergår mellan tre färger i en loop
function drawBackground() {

    const phase = colorProgress % 3;
    const index = Math.floor(phase);
    const t = phase - index;

    const c = lerpColor(
        colors[index],
        colors[(index + 1) % colors.length],
        t
    );

    ctx.fillStyle = `rgb(${c.r},${c.g},${c.b})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}


// Ritar allt
function draw() {

    drawBackground();

    if (gameState === "menu") {
        ctx.fillStyle = "white";
        ctx.font = "60px Arial";
        ctx.textAlign = "center";

        ctx.fillText(
            "OTTOS MATÄVENTYR",
            canvas.width / 2,
            canvas.height / 3
        );

        startButton.draw();
        return;
    }

    ctx.drawImage(
        playerImages[player.colorIndex],
        player.x,
        player.y,
        player.size,
        player.size
    );

    obstacles.forEach(o => o.draw());

    ctx.fillStyle = "white";
    ctx.font = "30px Arial";
    ctx.textAlign = "left";
    ctx.fillText("Score: " + Math.floor(score / 10), 40, 50);

    if (gameState === "gameover") {

        ctx.font = "70px Arial";
        ctx.textAlign = "center";

        ctx.fillText(
            "GAME OVER",
            canvas.width / 2,
            canvas.height / 2 - 60
        );

        restartButton.draw();
    }
}


function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

gameLoop();