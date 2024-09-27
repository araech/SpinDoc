const SCALE = 64;

const level = {
    grid: [
        [1, 1, 1, 1, 1, 2, 1],
        [1, 1, 1, 1, 1, 2, 1],
        [1, 1, 1, 0, 1, 1, 1],
        [1, 3, 11, 11, 11, 1, 1],
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
    ],
    walls: [
        { x1: 1.2, y1: 0.5, x2: 3.8, y2: 0.5 }
    ]
}

const Color = {
    WandWhite: "255,255,255",
    WandRed: "240,180,180",
    WandBlue: "180,180,240",
    AnchorWhite: "200,200,200",
    AnchorRed: "220,160,160",
    AnchorBlue: "160,160,220",
    Wall: "100,100,100",
    Exit: "240,240,160"
}

class Anchor {
    constructor(x, y, type, ephemeral = 0) {
        this.x = SCALE * (x + 2);
        this.y = SCALE * (y + 2);
        this.type = type;
        this.ephemeral = ephemeral;
        this.ephlock = false;
        this.fcolor = this.getfColor();
        this.scolor = this.getsColor();

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
    toggleEph() {
        this.ephlock = true;
        this.fcolor = `rgb(${Color.Wall})`
    }
    getfColor() {
        return this.ephemeral == 1 ? `rgba(${this.getColor()},0)` : `rgb(${this.getColor()})`;
    }
    getsColor() {
        return `rgb(${this.getColor()})`
    }
}

class Wand {
    // fixme, x and y args should be modified based on scale and offset
    constructor (x, y, type, angle = 0, speed = 1.5) {
        this.x = SCALE * (x + 2);
        this.y = SCALE * (y + 2);
        this.type = type;
        this.color = `rgb(${this.getColor()})`;
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
            return "0 255 0"; // error
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
    getDest(short = 0) {
        return destCoord(this.x, this.y, this.angle, this.length - short);
    }
    setAnchor(x, y) {
        this.x = x;
        this.y = y;
    }
    stepAngle(n = 1) {
        this.angle = this.angle + (this.speed * n) - (this.angle > 360 ? 360 : 0);
    }
    latchAngle() {
        this.angle += (this.angle <= 180) ? 180 : -180;
    }
    reverse(n = 1) {
        this.speed *= -1;
        this.stepAngle(n)
    }
}

class Wall {
    constructor(sx, sy, dx, dy) {
        this.x = ~~(SCALE * (sx + 2));
        this.y = ~~(SCALE * (sy + 2));
        this.x2 = ~~(SCALE * (dx + 2));
        this.y2 = ~~(SCALE * (dy + 2));
        this.color = this.getColor();
    }
    getColor() {
        return `rgb(${Color.Wall})`;
    }
    getDest() {
        return { x: this.x2, y: this.y2 };
    }
}

const Sounds = {
    bounce: new Audio('snd/bounce.ogg'),
    latch: new Audio('snd/latch.ogg'),
    pass: new Audio('snd/pass.ogg'),
    switch: new Audio('snd/switch.ogg'),
    win: new Audio('snd/win.ogg'),
    lose: new Audio('snd/lose.ogg')
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
        this.walls = [];
        this.load(level);
        
    },
    load: function(l) {
        // clear existing stacks
        while (this.anchors.length > 0) { this.anchors.pop(); }
        while (this.wands.length > 0) { this.wands.pop(); }
        while (this.walls.length > 0) { this.walls.pop(); }

        for (var y = 0; y < l.grid.length; y++) {
            for (var x = 0; x < l.grid[0].length; x++) {
                if (l.grid[y][x] > 0) {
                    // x, y, type, ephemeral
                    this.anchors.push(new Anchor(x, y, l.grid[y][x] % 10, ~~(l.grid[y][x] / 10)));
                }
            }
        }
        for (let i = 0; i < l.wands.length; i++) {
            let w = l.wands[i];
            this.wands.push(new Wand(w.x, w.y, w.type));
        }
        for (let i = 0; i < l.walls.length; i++) {
            let w = l.walls[i];
            this.walls.push(new Wall(w.x1, w.y1, w.x2, w.y2));
        }
    },
    clear: function() {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    },
    draw: function() {
        for (let i = 0; i < this.walls.length; i++) {
            this.context.strokeStyle = this.walls[i].color;
            this.context.lineWidth = 3;
            this.context.beginPath();
            this.context.moveTo(this.walls[i].x, this.walls[i].y);
            this.context.lineTo(this.walls[i].x2, this.walls[i].y2);
            this.context.closePath();
            this.context.stroke();

        }

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
            this.context.fillStyle = this.anchors[i].fcolor;
            this.context.beginPath();
            this.context.arc(this.anchors[i].x, this.anchors[i].y, 4, 0, 2 * Math.PI);
            this.context.closePath();
            this.context.fill();
            if (this.anchors[i].ephemeral == 1) {
                this.context.strokeStyle = this.anchors[i].scolor;
                this.context.stroke();
            }
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

// Are these two vertices close?
function isClose(v1, v2) {
    return (Math.abs(v1.x - v2.x) < 1.3 && Math.abs(v1.y - v2.y) < 1.3)
}

function ccw(a, b, c) {
    return ((c.y - a.y) * (b.x - a.x) > (b.y - a.y) * (c.x - a.x))
}
function intersect(s1, d1, s2, d2) {
    return (ccw(s1, s2, d2) != ccw(d1, s2, d2) && ccw(s1, d1, s2) != ccw(s1, d1, d2));
}

function updateGameArea() {
    for (let i = 0; i < gameArea.wands.length; i++) {
        gameArea.wands[i].stepAngle();
    }

    for (let i = 1; i < gameArea.wands.length; i++) {
        // These calls to getDest reduce the length of the wand to limit false hits
        if (intersect(gameArea.wands[0], gameArea.wands[0].getDest(2), gameArea.wands[i], gameArea.wands[i].getDest(2))) {
            Sounds.lose.play();
            gameArea.restart();
            console.log("Intersected a wand!");
        }
    }

    for (let i = 0; i < gameArea.walls.length; i++) {
        if (intersect(gameArea.wands[0], gameArea.wands[0].getDest(), gameArea.walls[i], gameArea.walls[i].getDest())) {
            Sounds.bounce.play();
            // This call moves the wand back quickly to avoid clipping
            gameArea.wands[0].reverse(2);
            console.log("Wall bounce!");
        }
    }


    let hasTarget = gameArea.anchors.findIndex(v => isClose(v, gameArea.wands[0].getDest()));
    if (hasTarget > -1) {
        let target = gameArea.anchors[hasTarget];
        if (gameArea.wands[0].controls.swing || gameArea.wands[0].controls.latch) {
            let fromEph = gameArea.anchors.findIndex(v => v.ephlock);
            if (gameArea.anchors[hasTarget].type == 9) {
                Sounds.win.play();
                gameArea.gameOver();
            }
            else {
                if (fromEph > -1) {
                    gameArea.anchors.splice(fromEph, 1);
                }
                if (target.ephemeral == 1 && target.ephlock == false) {
                    target.toggleEph();
                }
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