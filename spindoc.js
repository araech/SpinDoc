const SCALE = 64;

const level = {
    grid: [
        [1, 1, 1, 1, 1, 2, 1],
        [1, 1, 1, 1, 1, 2, 1],
        [0, 1, 1, 0, 1, 1, 0],
        [1, 3, 1, 1, 1, 1, 1],
        [1, 3, 1, 0, 1, 1, 9]
    ],
    wands: [
        {
            x: 0,
            y: 0,
            type: 1
        },
        {
            x: 5,
            y: 1,
            type: 2
        },
        {
            x: 1,
            y: 3,
            type: 3
        }
    ]
}

const Color = {
    WandWhite: "rgb(255 255 255)",
    WandRed: "rgb(240 180 180)",
    WandBlue: "rgb(180 180 240)",
    AnchorWhite: "rgb(200 200 200)",
    AnchorRed: "rgb(220 160 160)",
    AnchorBlue: "rgb(160 160 220)",
    Exit: "rgb(240 240 160)"
}

class Anchor {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.color = this.getColor();
    }
    getColor() {
        if (this.type == 2) {
            return Color.AnchorRed;
        } else if (this.type == 3) {
            return Color.AnchorBlue;
        } else if (this.type == 9) {
            return Color.Exit;
        } else {
            return Color.AnchorWhite;
        }
    }
}

class Wand {
    // fixme, x and y args should be modified based on scale and offset
    constructor (x, y, type, angle = 0, speed = 1.5) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.color = this.getColor();
        this.width = this.getWidth();
        this.angle = angle;
        this.speed = speed;
        this.length = SCALE;
        this.controls = this.getControl();
    }
    getControl() {
        if (this.type == 2) {
            return { swing: true, latch: false, bounce: false };
        } else if (this.type == 3) {
            return { swing: false, latch: true, bounce: false };
        } else {
            return { swing: false, latch: false, bounce: false };
        }
    }
    getColor() {
        if (this.type == 1) {
            return Color.WandWhite;
        } else if (this.type == 2) {
            return Color.WandRed;
        } else if (this.type == 3) {
            return Color.WandBlue;
        } else {
            return "rgb(0 255 0)"; // error
        }
    }
    getWidth() {
        if (this.type == 1) {
            return 4;
        } else if (this.type == 2 || this.type == 3) {
            return 2;
        } else {
            return 8; // error
        }
    }
    getDest() {
        return destCoord(this.x, this.y, this.angle, this.length);
    }
    setAnchor(x, y) {
        this.x = x;
        this.y = y;
    }
    stepAngle() {
        this.angle = this.angle + this.speed - (this.angle > 360 ? 360 : 0);
    }
    latchAngle() {
        this.angle += (this.angle <= 180) ? 180 : -180;
    }
    reverse() {
        this.speed *= -1;
    }
}

const Sounds = {
    bounce: new Audio('snd/bounce.wav'),
    latch: new Audio('snd/latch.wav'),
    pass: new Audio('snd/pass.wav'),
    switch: new Audio('snd/switch.wav'),
    win: new Audio('snd/win.wav'),
    lose: new Audio('snd/lose.wav')
}

$(document).ready(function() {
    $('body').on("keydown", event => {
        if (gameArea.wands < 1) return;
        switch (event.which) {
            case 32:
                Sounds.switch.play();
                gameArea.wands[0].reverse(); break;
            case 70:
                gameArea.wands[0].controls.swing = true; break;
            case 68:
                gameArea.wands[0].controls.latch = true; break;
            case 83:
                gameArea.wands[0].controls.bounce = true; break;
            default:
                break;
        }
    });
    $('body').on("keyup", event => {
        if (gameArea.wands < 1) return;
        switch (event.which) {
            case 70: // f
                gameArea.wands[0].controls.swing = false;
                break;
            case 68: //d
                gameArea.wands[0].controls.latch = false;
                break;
            case 83: // s
                gameArea.wands[0].controls.bounce = false;
                break;
            default:
                break;
        }
    })}
);

var gameArea = {
    canvas: document.createElement("canvas"),
    start: function() {
        this.canvas.width = SCALE * (level.grid[0].length + 3);
        this.canvas.height = SCALE * (level.grid.length + 3);
        this.context = this.canvas.getContext("2d");
        document.body.insertBefore(this.canvas, document.body.childNodes[0]);
        this.interval = setInterval(updateGameArea, 20);

        this.anchors = [];
        this.wands = [];
        this.load(level);
        
    },
    load: function(l) {
        while (this.anchors.length > 0) {
            this.anchors.pop();
        }
        while (this.wands.length > 0) {
            this.wands.pop();
        }
        for (var y = 0; y < l.grid.length; y++) {
            for (var x = 0; x < l.grid[0].length; x++) {
                if (l.grid[y][x] > 0) {
                    this.anchors.push(new Anchor((x + 2) * SCALE, (y + 2) * SCALE, l.grid[y][x]));
                }
            }
        }
        for (let i = 0; i < l.wands.length; i++) {
            let w = l.wands[i];
            this.wands.push(new Wand(SCALE * (w.x + 2), SCALE * (w.y + 2), w.type));
        }
    },
    clear: function() {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    },
    draw: function() {
        for (let i = 0; i < this.wands.length; i++) {
            let dest = this.wands[i].getDest();
            this.context.beginPath();
            this.context.strokeStyle = this.wands[i].color;
            this.context.lineWidth = this.wands[i].width;
            this.context.moveTo(this.wands[i].x, this.wands[i].y);
            this.context.lineTo(dest.x, dest.y);
            this.context.closePath();
            this.context.stroke();
        }

        for (let i = 0; i < this.anchors.length; i++) {
            this.context.fillStyle = this.anchors[i].color;
            this.context.beginPath();
            this.context.arc(this.anchors[i].x, this.anchors[i].y, 4, 0, 2 * Math.PI);
            this.context.closePath();
            this.context.fill();
        }
    },
    restart: function() {
        clearInterval(this.interval);
        this.load(level);
        this.interval = setInterval(updateGameArea, 20);
    },
    gameOver: function () {
        clearInterval(this.interval);
        this.context.fillStyle = "rgb(255 255 255)";
        this.context.fillText("GAME OVER", 30, 50);
    }
}

function destCoord(sx, sy, angle, length) {
    let dx = sx + Math.cos(Math.PI * angle / 180) * length;
    let dy = sy + Math.sin(Math.PI * angle / 180) * length; 
    return {x: dx, y: dy};
}

function startGame() {
    gameArea.start();
}

function isClose(v1, v2) {
    return (Math.abs(v1.x - v2.x) < 1.3 && Math.abs(v1.y - v2.y) < 1.3)
}

function ccw(a, b, c) {
    return ((c.y - a.y) * (b.x - a.x) > (b.y - a.y) * (c.x - a.x))
}
function intersect(s1, s2) {
    let [d1, d2] = [s1.getDest(), s2.getDest()];
    return (ccw(s1, s2, d2) != ccw(d1, s2, d2) && ccw(s1, d1, s2) != ccw(s1, d1, d2));
}

function updateGameArea() {
    for (let i = 0; i < gameArea.wands.length; i++) {
        gameArea.wands[i].stepAngle();
    }

    if (intersect(gameArea.wands[0], gameArea.wands[1])) {
        Sounds.lose.play();
        gameArea.restart();
    }

    let hasTarget = gameArea.anchors.findIndex(v => isClose(v, gameArea.wands[0].getDest()));
    if (hasTarget > -1) {
        let target = gameArea.anchors[hasTarget];
        if (gameArea.wands[0].controls.swing || gameArea.wands[0].controls.latch) {
            if (gameArea.anchors[hasTarget].type == 9) {
                Sounds.win.play();
                gameArea.gameOver();
            }
            else {
                Sounds.latch.play();
                gameArea.wands[0].setAnchor(target.x, target.y);
                gameArea.wands[0].latchAngle();
                if (gameArea.wands[0].controls.swing) {
                    gameArea.wands[0].reverse();
                }
            }
        } else if (gameArea.wands[0].controls.bounce) {
            Sounds.bounce.play();
            gameArea.wands[0].reverse();
        } else {
            Sounds.pass.play();
        }
    }

    for (let i = 1; i < gameArea.wands.length; i++) {
        let hasTarget = gameArea.anchors.findIndex(v => isClose(v, gameArea.wands[i].getDest()));
        if (hasTarget > -1) {
            let target = gameArea.anchors[hasTarget];
            if (target.type == gameArea.wands[i].type) {
                if (gameArea.wands[i].controls.swing || gameArea.wands[i].controls.latch) {
                    gameArea.wands[i].setAnchor(target.x, target.y);
                    gameArea.wands[i].latchAngle();
                    if (gameArea.wands[i].controls.swing) {
                        gameArea.wands[i].reverse();
                    }
                }
            }
        }
    }



    gameArea.clear();
    gameArea.draw();
}