const SCALE = 64;
const MAX_HEIGHT = 7;
const MAX_WIDTH  = 9;

const MASK = {
    TYPE: 15,
    EPHEM: 16
}

const testLevel = {
    grid: [
        [1, 1,  1,  1,  1, 2, 1, 1, 0],
        [1, 1,  1,  1,  1, 2, 1, 1, 5],
        [1, 1,  1,  0,  1, 2, 1, 1, 1],
        [1, 1, 17, 17, 17, 2, 1, 1, 1],
        [3, 3,  3,  3,  1, 2, 1, 1, 1],
        [1, 1,  1,  3,  1, 1, 1, 1, 1],
        [5, 1,  1,  1,  1, 0, 1, 1, 9]
    ],
    anchors: [
        { x: 8, y: 1, teleId: 1 },
        { x: 0, y: 6, teleId: 11 },
        { x: 3, y: 0, points: 1000 },
        { x: 2, y: 6, points: 2000 }
    ],
    wands: [
        { x: 0, y: 0, type: 1 },
        { x: 5,  y: 1, type: 2 },
        { x: 5, y: 3, type: 2 },
        { x: 1, y: 4, type: 3 }
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
    AnchorPurple: "220,160,220",
    Wall: "100,100,100",
    Exit: "240,240,160"
}

class SpinAnchor {
    constructor(x, y, type, ephemeral, teleId = 0) {
        this.x = SCALE * x;
        this.y = SCALE * y;
        this.type = type;
        this.ephemeral = ephemeral;
        this.ephlock = false;
        this.fcolor = this.#getfColor();
        this.scolor = this.#getsColor();
        this.wands = [];
        this.teleId = teleId; 
    }
    #getColor() {
        if (this.type == 2) {
            return Color.AnchorRed;
        } else if (this.type == 3) {
            return Color.AnchorBlue;
        } else if (this.type == 5) {
            return Color.AnchorPurple;
        } else if (this.type == 9) {
            return Color.Exit;
        } else {
            return Color.AnchorWhite;
        }
    }
    attachWand(wi) {
        this.wands.push(wi);
        if (this.ephemeral > 0 && this.ephlock == false) {
            this.toggleEph();
        }
        //console.log(`Attached ${wi} to ${this.x},${this.y}.`)
        // fixme logic for POINT BONUS status if wi == 0
    }
    detachWand(wi) {
        let i = this.wands.findIndex(i => wi == i);
        if (i >= 0) {
            // console.log(`Removed ${wi} from ${this.x},${this.y}.`)
            this.wands.splice(i, 1)
        } else {
            // console.log(`ERR: Tried to remove wand ${wi} from [${this.x},${this.y}] but it is not attached.`);
        }
    }
    hasWand(wi) {
        return (this.wands.some(w => w == wi))
    }
    toggleEph() {
        this.ephlock = true;
        this.fcolor = `rgb(${Color.Wall})`
    }
    #getfColor() {
        return this.ephemeral == MASK.EPHEM ? `rgba(${this.#getColor()},0)` : `rgb(${this.#getColor()})`;
    }
    #getsColor() {
        return `rgb(${this.#getColor()})`
    }
}

class SpinWand {
    constructor (x, y, type, angle = 0, speed = 1.5) {
        this.x = SCALE * x;
        this.y = SCALE * y;
        this.type = type;
        this.color = `rgb(${this.#getColor()})`;
        this.width = this.#getWidth();
        this.angle = angle;
        this.speed = speed;
        this.length = SCALE;
        this.controls = this.#getControl();
    }
    #getControl() {
        if (this.type == 2) {
            return { swing: true, latch: false, bounce: false };
        } else if (this.type == 3) {
            return { swing: false, latch: true, bounce: false };
        } else {
            return { swing: false, latch: false, bounce: false };
        }
    }
    #getColor() {
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
    #getWidth() {
        if (this.type == 1) {
            return 4;
        } else if (this.type == 2 || this.type == 3) {
            return 2;
        } else {
            return 8; // error
        }
    }
    dest(short = 0) {
        return destCoord(this.x, this.y, this.angle, this.length - short);
    }
    betweenRights() {
        return (~~this.angle % 90 < 85) && (~~this.angle % 90 > 5);
    }
    setAnchor(x, y) {
        this.x = x;
        this.y = y;
    }
    stepAngle(n = 1) { // FIXME way to accomplish this with fewer calculations?
        this.angle = (this.angle + (this.speed * n) + 360) % 360;
    }
    latchAngle() {
        this.angle += (this.angle <= 180) ? 180 : -180;
    }
    reverse(n = 1) {
        this.speed *= -1;
        this.stepAngle(n)
    }
}

class SpinWall {
    constructor(sx, sy, dx, dy) {
        this.x = ~~(SCALE * sx);
        this.y = ~~(SCALE * sy);
        this.x2 = ~~(SCALE * dx);
        this.y2 = ~~(SCALE * dy);
        this.color = this.#getColor();
    }
    #getColor() {
        return `rgb(${Color.Wall})`;
    }
    dest() {
        return { x: this.x2, y: this.y2 };
    }
}

class SpinField {
    constructor() {
        
    }
}

class SpinAnim {
    constructor() {

    }
}

class State {
    constructor() {
        this.anchors = [];
        this.wands = [];
        this.walls = [];   
    }
    load(l) {
        this.reset();
        for (let y = 0; y < l.grid.length; y++) {
            for (let x = 0; x < l.grid[0].length; x++) {
                if (l.grid[y][x] > 0) {
                    let anchor = new SpinAnchor(x, y, l.grid[y][x] & MASK.TYPE, l.grid[y][x] & MASK.EPHEM);
                    let special = l.anchors.find(a => a.x == x && a.y == y && Object.keys(a).some(p => p == "teleId"));
                    if (special) {
                        anchor.teleId = special.teleId;
                    }
                    this.anchors.push(anchor);
                }
            }
        }
        for (let i = 0; i < l.wands.length; i++) {
            let w = l.wands[i];
            this.wands.push(new SpinWand(w.x, w.y, w.type));
        }
        for (let i = 0; i < l.wands.length; i++) { // attach wands to initial anchors
            let w = this.wands[i];
            let aid = this.anchors.findIndex(a => a.x == w.x && a.y == w.y);
            this.anchors[aid].attachWand(i);
        }
        for (let i = 0; i < l.walls.length; i++) {
            let w = l.walls[i];
            this.walls.push(new SpinWall(w.x1, w.y1, w.x2, w.y2));
        }
    }
    reset() { // clear existing stacks
        while (this.anchors.length > 0) { this.anchors.pop(); }
        while (this.wands.length > 0) { this.wands.pop(); }
        while (this.walls.length > 0) { this.walls.pop(); }
    }
    tick() {
        this.wands.map(w => w.stepAngle());
        // other tick events here!
    }
    playerHitsBad() {
        // enemy wands
        for (let i = 1; i < this.wands.length; i++) {
            if (intersect(this.wands[0], this.wands[0].dest(2), this.wands[i], this.wands[i].dest(2)))
                return true;
        }

        // If on same anchor, mark as hitting enemy if within same 80 degree sector 
        let sharedAnchor = this.anchors.findIndex(a => a.wands.length > 1 && a.wands.some(w => w == 0));
        if (sharedAnchor > -1) {
            let angles = this.anchors[sharedAnchor].wands.map(wid => this.wands[wid].angle).sort((a,b) => a - b);
            if (angles[1] - angles[0] < 40 || angles[1] - angles[0] > 320) {
                return true;
            }
        }

        // other bad things?

        return false;
    }
    playerHitsBounceable() {
        // walls
        for (let i = 0; i < this.walls.length; i++) {
            if (intersect(this.wands[0], this.wands[0].dest(), this.walls[i], this.walls[i].dest())) {
                // This call moves the wand back quickly to avoid clipping
                this.wands[0].reverse(2);
                return true;
            }
        }

        // other bounceable things?
        return false;
    }
    latchableAnchorIdFor(wandId) {
        return this.anchors.findIndex(v => areClose(v, this.wands[wandId].dest()))
    }
    currentAnchorIdFor(wandId) {
        return this.anchors.findIndex(a => a.wands.some(wid => wid == wandId));
    }
    moveWand(wid, oid, tid) {

        if (this.anchors[tid].type == 5) {
            let telMatch = this.anchors[tid].teleId % 10;
            tid = this.anchors.findIndex(a => a.teleId % 10 == telMatch && a.teleId != this.anchors[tid].teleId);
        }

        let fromEph = this.anchors.findIndex(v => v.ephlock);

        this.anchors[oid].detachWand(wid);
        this.wands[wid].setAnchor(this.anchors[tid].x, this.anchors[tid].y);
        this.anchors[tid].attachWand(wid);

        if (wid == 0 && fromEph > -1) {
            this.anchors.splice(fromEph, 1);
        }

        this.wands[wid].latchAngle();
        
        if (this.wands[wid].controls.swing) {
            this.wands[wid].reverse();
        }
    }
    processWands() {
        for (let i = 1; i < this.wands.length; i++) {
            if (this.wands[i].betweenRights()) continue;
            let originId = this.currentAnchorIdFor(i);
            let targetId = this.latchableAnchorIdFor(i);
            if (targetId > -1) {
                if (this.anchors[targetId].type == this.wands[i].type) {
                    if (this.wands[i].controls.swing || this.wands[i].controls.latch) {
                        this.moveWand(i, originId, targetId);
                    } else if (this.wands[i].controls.bounce) {
                        this.wands[i].reverse();
                    }
                }
            }
        }
    }
}

const SpinSound = {
    bounce: new Audio('snd/bounce.ogg'),
    latch: new Audio('snd/latch.ogg'),
    pass: new Audio('snd/pass.ogg'),
    switch: new Audio('snd/switch.ogg'),
    win: new Audio('snd/win.ogg'),
    lose: new Audio('snd/lose.ogg'),
    teleport: new Audio('snd/teleport.ogg')
}

var game = {
    canvas: document.createElement("canvas"),
    bgcanvas: document.createElement("canvas"),
    state: new State(),
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

        this.aniData = { // should be args?
            current: 0,
            step: 0,
            max: 0
        };

        this.state.load(testLevel);

        this.interval = setInterval(updateGameArea, 25);
        
        this.drawbg();
    },
    offset: function(x, y) {
        return [x + SCALE + this.xos, y + SCALE + this.yos]
    },
    clear: function() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    },
    draw: function() {
        // FIXME draw Animation frames
        // FIXME draw Field objects

        for (let i = 0; i < this.state.walls.length; i++) {
            this.ctx.strokeStyle = this.state.walls[i].color;
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.moveTo(...this.offset(this.state.walls[i].x, this.state.walls[i].y));
            this.ctx.lineTo(...this.offset(this.state.walls[i].x2, this.state.walls[i].y2));
            this.ctx.closePath();
            this.ctx.stroke();
        }

        for (let i = 0; i < this.state.wands.length; i++) {
            let dest = this.state.wands[i].dest();
            this.ctx.beginPath();
            this.ctx.strokeStyle = this.state.wands[i].color;
            this.ctx.lineWidth = this.state.wands[i].width;
            this.ctx.moveTo(...this.offset(this.state.wands[i].x, this.state.wands[i].y));
            this.ctx.lineTo(...this.offset(dest.x, dest.y));
            this.ctx.closePath();
            this.ctx.stroke();
        }

        for (let i = 0; i < this.state.anchors.length; i++) {
            this.ctx.fillStyle = this.state.anchors[i].fcolor;
            this.ctx.beginPath();
            this.ctx.arc(...this.offset(this.state.anchors[i].x, this.state.anchors[i].y), 4, 0, 2 * Math.PI);
            this.ctx.closePath();
            this.ctx.fill();
            if (this.state.anchors[i].ephemeral == MASK.EPHEM) {
                this.ctx.strokeStyle = this.state.anchors[i].scolor;
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
    drawDeathFrame: function() {
        let dest = this.state.wands[0].dest();
        let [cur, max] = [this.aniData.current, this.aniData.max];
        let width = ~~((this.state.wands[0].width + 2) * ((max - cur) / max));
        let [r, g, b] = [((max - cur) / max) > 0.5 ? 255 : 255 - ~~(cur / 2), 255 - cur, 255 - cur];
        this.ctx.beginPath();  
        this.ctx.strokeStyle = `rgba(${r},${g},${b},${(max - cur) / max})`;
        this.ctx.lineWidth = width;
        this.ctx.moveTo(...this.offset(this.state.wands[0].x, this.state.wands[0].y));
        this.ctx.lineTo(...this.offset(dest.x, dest.y));
        this.ctx.closePath();
        this.ctx.stroke();
    },
    animate: function(kind) {
        if (kind == "death") {
            clearInterval(this.interval);
            this.aniData.current = 0;
            this.aniData.step = 3;
            this.aniData.max = 200;
            this.interval = setInterval(animateDeath, 25);
        }
    },
    restart: function() {
        clearInterval(this.interval);
        this.state.load(testLevel);
        this.interval = setInterval(updateGameArea, 25);
    },
    gameOver: function () {
        clearInterval(this.interval);
        this.bgctx.textBaseline = "bottom";
        this.bgctx.textAlign = "center";
        this.bgctx.fillText("Game Over", ~~(this.bgcanvas.width / 2), this.bgcanvas.height - 7);
    }
}

function startGame() {
    game.start();
}

/***
 * Helper functions
 */
function destCoord(sx, sy, angle, length) {
    let dx = sx + Math.cos(Math.PI * angle / 180) * length;
    let dy = sy + Math.sin(Math.PI * angle / 180) * length; 
    return {x: dx, y: dy};
}
function areClose(v1, v2) { // Are these two vertices close?
    return (Math.abs(v1.x - v2.x) < 1.3 && Math.abs(v1.y - v2.y) < 1.3)
}
function ccw(a, b, c) {
    return ((c.y - a.y) * (b.x - a.x) > (b.y - a.y) * (c.x - a.x))
}
function intersect(s1, d1, s2, d2) {
    return (ccw(s1, s2, d2) != ccw(d1, s2, d2) && ccw(s1, d1, s2) != ccw(s1, d1, d2));
}

function updateGameArea() {
    game.state.tick();

    if (game.state.playerHitsBad()) {
        SpinSound.lose.play();
        game.animate("death");
        console.log("Intersected a bad!");
    }

    if (game.state.playerHitsBounceable()) {
        SpinSound.bounce.play();
    }
    
    let targetIndex = game.state.latchableAnchorIdFor(0);
    if (targetIndex > -1) {
        let originIndex = game.state.currentAnchorIdFor(0);
        let target = game.state.anchors[targetIndex];
        if (game.state.wands[0].controls.swing || game.state.wands[0].controls.latch) {
            if (target.type == 9) {
                SpinSound.win.play();
                game.gameOver();
            } else {
                if (target.type != 5) {
                    SpinSound.latch.play();
                } else {
                    SpinSound.teleport.play();
                }
                
                game.state.moveWand(0, originIndex, targetIndex);
            }
        } else if (game.state.wands[0].controls.bounce) {
            SpinSound.bounce.play();
            game.state.wands[0].reverse();
        } else {
            SpinSound.pass.play();
        }
    }

    game.state.processWands();

    game.clear();
    game.draw();
}

function animateDeath() {
    if (game.aniData.current >= game.aniData.max) {
        game.restart();
    } else {
        game.drawDeathFrame();
        game.aniData.current += game.aniData.step;
    }
}

$(document).ready(function() {
    $('body').on("keydown", event => {
        if (game.state.wands.length < 1) return;
        switch (event.which) {
            case 32:
                SpinSound.switch.play();
                game.state.wands[0].reverse(); break;
            case 70:
                game.state.wands[0].controls.swing = true; break;
            case 68:
                game.state.wands[0].controls.latch = true; break;
            case 83:
                game.state.wands[0].controls.bounce = true; break;
            default:
                break;
        }
    });
    $('body').on("keyup", event => {
        if (game.state.wands.length < 1) return;
        switch (event.which) {
            case 70: // f
                game.state.wands[0].controls.swing = false; break;
            case 68: //d
                game.state.wands[0].controls.latch = false; break;
            case 83: // s
                game.state.wands[0].controls.bounce = false; break;
            default:
                break;
        }
    })}
);
