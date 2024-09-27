const SCALE = 64;
const MAX_HEIGHT = 7;
const MAX_WIDTH  = 9;


const MASK = {
    TYPE: 15,
    EPHEM: 16
}

const level = {
    grid: [
        [1, 1, 1, 1, 1, 2, 1, 1, 0],
        [1, 1, 1, 1, 1, 2, 1, 1, 1],
        [1, 1, 1, 0, 1, 2, 1, 1, 1],
        [1, 1, 17, 17, 17, 2, 1, 1, 1],
        [3, 3, 3, 3, 1, 2, 1, 1, 1],
        [1, 1, 1, 3, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 0, 1, 1, 9]
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
            x: 5,
            y: 3,
            type: 2
        },
        {
            x: 1,
            y: 4,
            type: 3
        }
    ],
    walls: [
        { x1: 1.2, y1: 0.5, x2: 3.8, y2: 0.5 },
        { x1: 6.5, y1: 1.2, x2: 6.5, y2: 3.8 }
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
    constructor(x, y, type, ephemeral) {
        this.x = SCALE * x;
        this.y = SCALE * y;
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
        return this.ephemeral == MASK.EPHEM ? `rgba(${this.getColor()},0)` : `rgb(${this.getColor()})`;
    }
    getsColor() {
        return `rgb(${this.getColor()})`
    }
}

class Wand {
    // fixme, x and y args should be modified based on scale and offset
    constructor (x, y, type, angle = 0, speed = 1.5) {
        this.x = SCALE * x;
        this.y = SCALE * y;
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
        this.x = ~~(SCALE * sx);
        this.y = ~~(SCALE * sy);
        this.x2 = ~~(SCALE * dx);
        this.y2 = ~~(SCALE * dy);
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
    bgcanvas: document.createElement("canvas"),
    start: function() {
        this.canvas.width = SCALE * (MAX_WIDTH + 2);
        this.canvas.height = SCALE * (MAX_HEIGHT + 2);
        this.bgcanvas.width = SCALE * (MAX_WIDTH + 3);
        this.bgcanvas.height = SCALE * (MAX_HEIGHT + 3);
        this.xos = ~~(SCALE / 2);
        this.yos = ~~(SCALE / 2);
        this.ctx = this.canvas.getContext("2d");
        this.bgctx = this.bgcanvas.getContext("2d");
        this.canvas.id = "gameui";
        this.bgcanvas.id = "bgui";
        document.getElementById("stage").appendChild(this.canvas);
        document.getElementById("stage").appendChild(this.bgcanvas);
        this.interval = setInterval(updateGameArea, 25);

        this.anchors = [];
        this.wands = [];
        this.walls = [];
        this.load(level);
        this.drawbg();
    },
    load: function(l) {
        // clear existing stacks
        while (this.anchors.length > 0) { this.anchors.pop(); }
        while (this.wands.length > 0) { this.wands.pop(); }
        while (this.walls.length > 0) { this.walls.pop(); }

        for (var y = 0; y < l.grid.length; y++) {
            for (var x = 0; x < l.grid[0].length; x++) {
                if (l.grid[y][x] > 0) {
                    this.anchors.push(new Anchor(x, y, l.grid[y][x] & MASK.TYPE, l.grid[y][x] & MASK.EPHEM));
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
    offset: function(x, y) {
        return [x + SCALE + this.xos, y + SCALE + this.yos]
    },
    clear: function() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    },
    draw: function() {
        for (let i = 0; i < this.walls.length; i++) {
            this.ctx.strokeStyle = this.walls[i].color;
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.moveTo(...this.offset(this.walls[i].x, this.walls[i].y));
            this.ctx.lineTo(...this.offset(this.walls[i].x2, this.walls[i].y2));
            this.ctx.closePath();
            this.ctx.stroke();

        }

        for (let i = 0; i < this.wands.length; i++) {
            let dest = this.wands[i].getDest();
            this.ctx.beginPath();
            this.ctx.strokeStyle = this.wands[i].color;
            this.ctx.lineWidth = this.wands[i].width;
            this.ctx.moveTo(...this.offset(this.wands[i].x, this.wands[i].y));
            this.ctx.lineTo(...this.offset(dest.x, dest.y));
            this.ctx.closePath();
            this.ctx.stroke();
        }

        for (let i = 0; i < this.anchors.length; i++) {
            this.ctx.fillStyle = this.anchors[i].fcolor;
            this.ctx.beginPath();
            this.ctx.arc(...this.offset(this.anchors[i].x, this.anchors[i].y), 4, 0, 2 * Math.PI);
            this.ctx.closePath();
            this.ctx.fill();
            if (this.anchors[i].ephemeral == MASK.EPHEM) {
                this.ctx.strokeStyle = this.anchors[i].scolor;
                this.ctx.stroke();
            }
        } 
    },
    drawbg: function() {
        this.bgctx.clearRect(0, 0, this.bgcanvas.width, this.bgcanvas.height);
        
        this.bgctx.fillStyle = "#eee";
        this.bgctx.font = "20px sans-serif";
        this.bgctx.fontVariantCaps = "small-caps";
        this.bgctx.letterSpacing = "2px"
        this.bgctx.textAlign = "left";
        this.bgctx.textBaseline = "top";
        this.bgctx.fillText("Spin Doctor", 7, 7);
        this.bgctx.textAlign = "right";
        this.bgctx.fillText("Level 1", this.bgcanvas.width - 7, 7)
        this.bgctx.textBaseline = "bottom";
        this.bgctx.textAlign = "left";
        this.bgctx.fillText("Wands: 3", 7, this.bgcanvas.height - 7);
        this.bgctx.textAlign = "right";
        this.bgctx.fillText("Score: 1000", this.bgcanvas.width - 7, this.bgcanvas.height - 7)
    },
    restart: function() {
        clearInterval(this.interval);
        this.load(level);
        this.interval = setInterval(updateGameArea, 25);
    },
    gameOver: function () {
        clearInterval(this.interval);
        // draw GAME OVER on this.bgctx
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
        // These calls to getDest reduce the length of the wands to limit false hits
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
            if (target.type == 9) {
                Sounds.win.play();
                gameArea.gameOver();
            } else {
                if (fromEph > -1) {
                    gameArea.anchors.splice(fromEph, 1);
                }
                if (target.ephemeral == MASK.EPHEM && target.ephlock == false) {
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