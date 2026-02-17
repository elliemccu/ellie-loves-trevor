// ===== GET CANVAS =====
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const previewCanvas = document.getElementById("previewCanvas");
const previewCtx = previewCanvas.getContext("2d");



// ===== GAME STATE =====
let circles = [];
let score = 0;
let highScore = localStorage.getItem("highScore") || 0;
let gameRunning = false;

// ===== UPDATE SCORE DISPLAY =====
function updateScoreDisplay(){

    const scoreEl = document.getElementById("score");
    const highEl = document.getElementById("highScore");

    if(scoreEl) scoreEl.innerText = score;
    if(highEl) highEl.innerText = highScore;
}

// ===== SIZES =====
const sizes = [25,35,45,55,65,75,85,95];

// ===== LOAD IMAGES =====
const imageFiles = [
    "images/level0.png",
    "images/level1.png",
    "images/level2.png",
    "images/level3.png",
    "images/level4.png",
    "images/level5.png",
    "images/level6.png",
    "images/level7.png"
];

const loadedImages = [];

for(let i=0;i<imageFiles.length;i++){
    let img = new Image();
    img.src = imageFiles[i];
    loadedImages.push(img);
}

// ===== NEXT CIRCLE =====
let nextLevel = 0;

function chooseNext(){

    nextLevel = Math.floor(Math.random()*4);

    drawPreview();
}

// ===== DRAW PREVIEW =====
function drawPreview(){

    previewCtx.clearRect(0,0,previewCanvas.width,previewCanvas.height);

    let img = loadedImages[nextLevel];

    previewCtx.save();

    previewCtx.beginPath();
    previewCtx.arc(40,40,30,0,Math.PI*2);
    previewCtx.clip();

    previewCtx.drawImage(img,10,10,60,60);

    previewCtx.restore();
}

// ===== DROP CIRCLE (WORKS ON MOBILE + DESKTOP) =====
canvas.addEventListener("pointerdown", function(e){

    if(!gameRunning) return;

    const rect = canvas.getBoundingClientRect();

    const scaleX = canvas.width / rect.width;

    const x = (e.clientX - rect.left) * scaleX;

    circles.push({
        x: x,
        y: 50,
        vx: 0,
        vy: 0,
        level: nextLevel,
        radius: sizes[nextLevel],
        img: loadedImages[nextLevel]
    });

    chooseNext();

});



// ===== GRAVITY + FLOOR =====
function applyPhysics(){

    for(let circle of circles){

        circle.vy += 0.4 + score * 0.002;

circle.vy *= 0.98;
circle.vx *= 0.98;

if(Math.abs(circle.vy) < 0.05) circle.vy = 0;
if(Math.abs(circle.vx) < 0.05) circle.vx = 0;


circle.y += circle.vy;
circle.x += circle.vx;


        // floor collision
        if(circle.y > canvas.height - circle.radius){

            circle.y = canvas.height - circle.radius;
            circle.vy = 0;

        }

        // wall collision LEFT
        if(circle.x < circle.radius){
            circle.x = circle.radius;
        }

        // wall collision RIGHT
        if(circle.x > canvas.width - circle.radius){
            circle.x = canvas.width - circle.radius;
        }

    }

}

// ===== PREVENT OVERLAP =====
function resolveCollisions(){

    for(let i=0;i<circles.length;i++){

        for(let j=i+1;j<circles.length;j++){

            let a = circles[i];
            let b = circles[j];

            let dx = b.x - a.x;
            let dy = b.y - a.y;

            let dist = Math.sqrt(dx*dx + dy*dy);

            let minDist = a.radius + b.radius;

            if(dist < minDist){

                let angle = Math.atan2(dy,dx);

                let overlap = minDist - dist;

                let moveX = Math.cos(angle) * overlap * 0.3;
		let moveY = Math.sin(angle) * overlap * 0.3;


                a.x -= moveX;
                a.y -= moveY;

                b.x += moveX;
                b.y += moveY;

            }

        }

    }

}

// ===== MERGE SYSTEM =====
function detectMerge(){

    for(let i = circles.length - 1; i >= 0; i--){

        for(let j = i - 1; j >= 0; j--){

            let a = circles[i];
            let b = circles[j];

            // only merge same level
            if(a.level !== b.level) continue;

            let dx = b.x - a.x;
            let dy = b.y - a.y;

            let dist = Math.sqrt(dx*dx + dy*dy);

            // FIX: use full radius sum
            if(dist < a.radius + b.radius - 2){

                if(a.level < sizes.length - 1){

                    let newLevel = a.level + 1;

                    circles.push({

                        x:(a.x+b.x)/2,
                        y:(a.y+b.y)/2,

                        vx:0,
                        vy:0,

                        level:newLevel,
                        radius:sizes[newLevel],
                        img:loadedImages[newLevel]

                    });

                    score += 10;

                    if(score > highScore){

                        highScore = score;
                        localStorage.setItem("highScore",highScore);

                    }

                    updateScoreDisplay();
                }

                circles.splice(i,1);
                circles.splice(j,1);

                return;
            }

        }

    }

}


// ===== DRAW =====
function draw(){

    ctx.clearRect(0,0,canvas.width,canvas.height);

    for(let circle of circles){

        ctx.save();

        ctx.beginPath();
        ctx.arc(circle.x,circle.y,circle.radius,0,Math.PI*2);
        ctx.clip();

        ctx.drawImage(
            circle.img,
            circle.x-circle.radius,
            circle.y-circle.radius,
            circle.radius*2,
            circle.radius*2
        );

        ctx.restore();

    }

}

// ===== UPDATE LOOP =====
function update(){

    applyPhysics();

    resolveCollisions();

    detectMerge();

}

// ===== GAME LOOP =====
function gameLoop(){

    if(!gameRunning) return;

    update();

    draw();

    requestAnimationFrame(gameLoop);

}

// ===== START GAME =====
function startGame(){

    document.getElementById("startScreen").style.display="none";
    document.getElementById("gameUI").style.display="block";

    circles = [];

    score = 0;

    updateScoreDisplay();

    chooseNext();

    gameRunning = true;

    gameLoop();

}

// ===== INITIAL DISPLAY =====
updateScoreDisplay();
