/***
 * Spin Doctor - an HTML5 Canvas game
 * (c) 2024 by Aubrey Raech
 * Licensed under the AGPLv3+
 */

// TODO Fix calls to Wand.reverse() to make uniform in step adjustment

/***
 * General data and constants
 */

const SCALE = 64;
const MAX_HEIGHT = 7;
const MAX_WIDTH  = 9;

const MASK = {
    TYPE: 15,
    EPHEM: 16
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

const Color = {
    Wand: {
        White:  "255,255,255",
        Red: "240,180,180",
        Blue: "180,180,240",
        Green: "180,240,180",
    },
    Anchor: {
        White: "210,210,210",
        Red: "210,150,150",
        Blue: "150,150,210",
        Green: "150,210,150",
        Purple: "210,150,210",
        Exit: "240,240,160",
        ExitBorder: "240,180,120",
    },
    Gate: {
        Red: "210,80,80",
        Blue: "80,210,80",
        Green: "80,80,210",
    },
    Wall: "100,100,100",
    ERROR: "0,0,255"
}

const SpinLevels = [
    {
        num: 0,
        title: "Empty template",
        grid: [
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0]
        ],
        anchors: [],
        wands: [],
        walls: [],
        fields: [],
        gates: []
    },
    {
        num: 1,
        title: "The Grid",
        grid: [
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 1, 1, 1, 0, 0, 0],
            [0, 0, 1, 1, 1, 1, 1, 0, 0],
            [0, 0, 1, 1, 1, 1, 1, 0, 0],
            [0, 0, 1, 1, 1, 1, 9, 0, 0],
            [0, 0, 0, 1, 1, 1, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0]
        ],
        wands: [
            {x: 2, y: 2, type: 1}
        ],
        anchors: [],
        walls: [],
        fields: [],
        gates: []
    },
    {
        num: 2,
        title: "Walls",
        grid: [
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 1, 1, 1, 1, 9, 0],
            [0, 1, 1, 1, 1, 1, 1, 1, 0],
            [0, 1, 1, 1, 1, 1, 1, 1, 0],
            [0, 1, 1, 1, 1, 1, 1, 1, 0],
            [0, 1, 1, 1, 1, 1, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0]
        ],
        anchors: [],
        wands: [
            {x: 1, y: 5, type: 1}
        ],
        walls: [
            {x1: 2.5, y1: 2.2, x2: 2.5, y2: 5.2},
            {x1: 5.5, y1: 0.8, x2: 5.5, y2: 3.8}
        ],
        fields: [],
        gates: []
    },
    {
        num: 3,
        title: "Ephemera",
        grid: [
            [0,  0,  0, 0,  0, 0,  0, 0, 0],
            [0,  0,  1, 1,  1, 0,  1, 1, 0],
            [0,  1,  1, 1, 17, 0,  1, 1, 0],
            [0,  1, 17, 1, 17, 1, 17, 1, 0],
            [0,  1,  1, 0, 17, 1,  1, 1, 0],
            [0,  9,  1, 0,  1, 1,  1, 0, 0],
            [0,  0,  0, 0,  0, 0,  0, 0, 0]
        ],
        anchors: [],
        wands: [
            {x: 7, y: 1, type: 1}
        ],
        walls: [],
        fields: [],
        gates: []
    },
    {
        num: 4,
        title: "Wands",
        grid: [
            [0, 1, 1, 0, 0, 0, 0, 0, 0],
            [0, 1, 1, 1, 1, 1, 1, 2, 0],
            [0, 1, 1, 1, 1, 1, 1, 2, 0],
            [0, 1, 1, 1, 4, 1, 1, 1, 0],
            [0, 3, 1, 1, 1, 1, 1, 1, 0],
            [0, 3, 1, 1, 1, 1, 1, 1, 0],
            [0, 0, 0, 0, 0, 0, 1, 9, 0]
        ],
        anchors: [],
        wands: [
            {x: 1, y: 0, type: 1},
            {x: 4, y: 3, type: 4},
            {x: 1, y: 4, type: 3},
            {x: 7, y: 2, type: 2}
        ],
        walls: [],
        fields: [],
        gates: []
    },
    {
        num: 5,
        title: "Teleportation",
        grid: [
            [0, 0, 1, 1, 1, 1, 1, 1, 1],
            [0, 1, 1, 1, 1, 1, 1, 1, 9],
            [0, 5, 1, 1, 3, 3, 1, 1, 1],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [1, 1, 1, 2, 2, 1, 1, 5, 0],
            [1, 1, 1, 1, 1, 1, 1, 1, 0],
            [1, 1, 1, 1, 1, 1, 1, 0, 0]
        ],
        anchors: [
            {x: 1, y: 2, teleId:  1},
            {x: 7, y: 4, teleId: 11}
        ],
        wands: [
            {x: 0, y: 5, type: 1},
            {x: 3, y: 4, type: 2},
            {x: 5, y: 2, type: 3}
        ],
        walls: [],
        fields: [],
        gates: []
    },
    {
        num: 6,
        title: "Gates",
        grid: [
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0]
        ],
        anchors: [],
        wands: [],
        walls: [],
        fields: [],
        gates: []
    },
];

/***
 * Utility functions
 */

function clickLevel(num) {
    game.selectLevel(num);
    const menu = document.getElementById("selector");
    menu.className = menu.className === "hideme" ? "" : "hideme";
}

function destCoord(origin, angle, length) {
    return {
        x: origin.x + Math.cos(Math.PI * angle / 180) * length,
        y: origin.y + Math.sin(Math.PI * angle / 180) * length
    };
}
function areClose(v1, v2) { // Are these two vertices close?
    return (Math.abs(v1.x - v2.x) < 1.3 && Math.abs(v1.y - v2.y) < 1.3)
}
function ccw(a, b, c) {
    return ((c.y - a.y) * (b.x - a.x) > (b.y - a.y) * (c.x - a.x))
}
function lineIntersect(as, ae, bs, be) {
    // does line segment as,ad intersect line segment bs,bd?
    return (ccw(as, bs, be) != ccw(ae, bs, be) && ccw(as, ae, bs) != ccw(as, ae, be));
}

function pointsFar(v1, v2) {
    // are two vertices too far to warrant further calculation?
    return Math.sqrt(((v1.x - v2.x) ** 2) + ((v1.y - v2.y) ** 2)) > SCALE * 2;
}

function lineRectIntersect(as, ae, rv1, rv2) {
    // return early if more than SCALE from every rect vertex.
    const rvs = {
        a: {x: rv1.x, y: rv1.y},
        b: {x: rv2.x, y: rv1.y},
        c: {x: rv2.x, y: rv2.y},
        d: {x: rv1.x, y: rv2.y}
    };

    if (pointsFar(as, rvs.a)
        && pointsFar(as, rvs.b)
        && pointsFar(as, rvs.c)
        && pointsFar(as, rvs.d)) {
        return false;
    }

    const rect = {
        ab: { vs: rvs.a, ve: rvs.b },
        bc: { vs: rvs.b, ve: rvs.c },
        cd: { vs: rvs.c, ve: rvs.d },
        da: { vs: rvs.d, ve: rvs.a }
    };
    for (const ls in rect) {
        if (lineIntersect(as, ae, rect[ls].vs, rect[ls].ve))
            return true;
    }
    return false;
}

// Rather than check for circle intersection, pass the
// bounding box around the circle to rect intersection check.
function lineCircleIntersect(as, ae, orig, rad) {
    return lineRectIntersect(as, ae, {x: orig.x - rad, y: orig.y - rad}, {x: orig.x + rad, y: orig.y + rad});
}

/*** 
 * Classes
 */

class SpinAnchor {
    constructor(origin, type, ephemeral, teleId = 0) {
        this.base = {
            x: SCALE * origin.x,
            y: SCALE * origin.y
        };
        this.type = type;
        this.ephemeral = ephemeral;
        this.ephlock = false;
        this.fcolor = this.#getfColor();
        this.scolor = this.#getsColor();
        this.wands = [];
        this.teleId = teleId; 
    }
    #getColor() {
        switch (this.type) {
            case 2: return Color.Anchor.Red;
            case 3: return Color.Anchor.Blue;
            case 4: return Color.Anchor.Green;
            case 5: return Color.Anchor.Purple;
            case 9: return Color.Anchor.Exit;
            default: return Color.Anchor.White;
        }
    }
    attachWand(wi) {
        this.wands.push(wi);
        if (this.ephemeral > 0 && this.ephlock === false) {
            this.toggleEph();
        }
        // TODO logic for POINT BONUS status if wi === 0
    }
    detachWand(wi) {
        const i = this.wands.findIndex(i => wi === i);
        if (i >= 0) {
            this.wands.splice(i, 1)
        } else {
            console.error(`Could not remove wand ${wi} from anchor.`);
        }
    }
    hasWand(wi) {
        return (this.wands.some(w => w === wi))
    }
    toggleEph() {
        this.ephlock = true;
        this.fcolor = `rgb(${Color.Wall})`
    }
    #getfColor() {
        return this.ephemeral === MASK.EPHEM ? `rgba(${this.#getColor()},0)` : `rgb(${this.#getColor()})`;
    }
    #getsColor() {
        if (this.type === 9) {
            return `rgb(${Color.Anchor.ExitBorder})`;
        } else {
            return `rgb(${this.#getColor()})`
        }
    }
    draw() {
        game.ctx.fillStyle = this.fcolor;
        game.ctx.beginPath();
        game.ctx.arc(...game.offset(this.base), 4, 0, 2 * Math.PI);
        game.ctx.closePath();
        game.ctx.fill();
        if (this.ephemeral === MASK.EPHEM || this.type === 9) {
            game.ctx.lineWidth = 1;
            game.ctx.strokeStyle = this.scolor;
            game.ctx.stroke();
        }
    }
}

class SpinWand {
    constructor (origin, type, angle = 0, speed = 1.5) {
        this.base = {
            x: origin.x * SCALE,
            y: origin.y * SCALE
        };
        this.dest = {
            x: 0,
            y: 0
        };
        this.type = type;
        this.color = `rgb(${this.#getColor()})`;
        this.width = this.#getWidth();
        this.angle = angle;
        this.speed = speed;
        this.length = SCALE;
        this.controls = this.#getControl();
    }
    #getControl() {
        if (this.type === 2) {
            return { swing: true, latch: false, bounce: false };
        } else if (this.type === 3) {
            return { swing: false, latch: true, bounce: false };
        } else {
            return { swing: false, latch: false, bounce: false };
        }
    }
    #getColor() {
        switch (this.type) {
            case 1: return Color.Wand.White;
            case 2: return Color.Wand.Red;
            case 3: return Color.Wand.Blue;
            case 4: return Color.Wand.Green;
            default: return Color.ERROR;
        }
    }
    #getWidth() {
        switch (this.type) {
            case 1: return 4;
            case 2: case 3: case 4: return 2;
            default: return 8; // error
        }
    }
    updateDest() {
        this.dest = destCoord(this.base, this.angle, this.length);
    }
    getDest(short = 0) {
        return (short === 0) ? this.dest : destCoord(this.base, this.angle, this.length - short);
    }
    betweenRights() {
        return (~~this.angle % 90 < 85) && (~~this.angle % 90 > 5);
    }
    setAnchor(vertex) { // assign seperately; may be vertex, may be anchor object
        this.base.x = vertex.x;
        this.base.y = vertex.y;
    }
    stepAngle(n = 1) { 
        this.angle = (this.angle + (this.speed * n) + 360) % 360;
        this.updateDest();
    }
    latchAngle() {
        this.angle += (this.angle <= 180) ? 180 : -180;
        this.updateDest();
    }
    reverse(n = 1) {
        this.speed *= -1;
        this.stepAngle(n);
    }
    draw() {
        game.ctx.beginPath();
        game.ctx.strokeStyle = this.color;
        game.ctx.lineWidth = this.width;
        game.ctx.moveTo(...game.offset(this.base));
        game.ctx.lineTo(...game.offset(this.dest));
        game.ctx.closePath();
        game.ctx.stroke();
    }
}

class SpinWall {
    constructor(sx, sy, dx, dy) {
        this.x = ~~(SCALE * sx);
        this.y = ~~(SCALE * sy);
        this.x2 = ~~(SCALE * dx);
        this.y2 = ~~(SCALE * dy);
        this.color = `rgb(${this.#getColor()})`;
    }
    #getColor() {
        return Color.Wall;
    }
    startxy() {
        return { x: this.x, y: this.y };
    }
    endxy() {
        return { x: this.x2, y: this.y2 };
    }
    draw() {
        game.ctx.strokeStyle = this.color;
        game.ctx.lineWidth = 3;
        game.ctx.beginPath();
        game.ctx.moveTo(...game.offset(this.startxy()));
        game.ctx.lineTo(...game.offset(this.endxy()));
        game.ctx.closePath();
        game.ctx.stroke();
    }
}

// TODO Figure out da logicz
class SpinGate extends EventTarget {
    constructor(type, sx, sy, ex, ey) {
        this.type = type;
        this.color = this.#getColor();
        this.endA = {x: sx, y: sy};
        this.endB = {x: ex, y: ey};
        this.innerA = this.innerPoint();
        this.innerB = this.innerPoint();
        this.closed = true;
        this.opening = false;
        this.closing = false;
    }
    #getColor() {
        switch(this.type) {
            case 1: return Color.Gate.Red;
            case 2: return Color.Gate.Blue;
            case 3: return Color.Gate.Green;
            default: return Color.ERROR;
        }
    }
    tick() {
        if (!(this.opening && this.closing)) return;
        // adjust endA and endB one step UNTIL opened/closed,
        //   then set opening/closing to false.
        
    }
    innerPoint() {
        if (this.endA.x === this.endB.x) {
            return { x: this.endAx, y: ((this.endA.y + this.endB.y) >> 1) };
        } else if (this.endA.y === this.endB.y) {
            return { x: ((this.endA.x + this.endB.x) >> 1), y: this.endA.y }
        }
    }
    getDrawCoords() {
        return [this.endA, this.innerA, this.endB, this.innerB];
    }
    trigger() {
        if (this.opening || this.closing) return;
        if (this.closed) {
            this.opening = true;
        } else {
            this.closing = true;
        }
    }
}

// TODO - Logic incomplete!
class SpinField {
    /***
     * Rectangle area button, whose entering and exiting by the player
     * triggers a specified behavior. 
     */
    constructor(type, x, y) {
        this.type = type;
        this.x = x;
        this.y = y;
        this.sprite = game.sprite.button[this.type].up;
        this.lock = false;
        this.timer = 0;
    }
    getRect() {
        // return top left and bottom right corner vertices
        return [{x: this.x - 16, y: this.y - 16}, {x: this.x + 16, y: this.y + 16 }];
    }
    tick() {
        if (this.lock === true && this.timer > 0) {
            this.timer -= 1;
        } else {
            this.depress();
        }
    }
    press() {
        // lock
        this.lock = true;
        // change image from up to down
        this.sprite = game.sprite.button[this.type].down;
        // send message to gate
        game.state.gates.find(g => g.type === this.type).open(); // TODO fix me fix me fix me
        // start down timer
        this.timer = 100;
    }
    depress() {
        this.lock = false;
        this.sprite = game.sprite.button[this.type].up;
    }
    draw() {
        game.ctx.drawImage(this.sprite, this.x - 16, this.y - 16, 32, 32);
    }
}

class State {
    constructor() {
        this.levmeta = {
            num: 0,
            title: ""
        }
        this.anchors = [];
        this.wands = [];
        this.walls = [];   
    }
    loadLevel(l) {
        this.reset();
        this.levmeta.num = l.num;
        this.levmeta.title = l.title;
        for (let y = 0; y < l.grid.length; y++) {
            for (let x = 0; x < l.grid[0].length; x++) {
                if (l.grid[y][x] > 0) {
                    const anchor = new SpinAnchor(
                        { x: x, y: y },
                        l.grid[y][x] & MASK.TYPE,
                        l.grid[y][x] & MASK.EPHEM);
                    const special = l.anchors.find(a => a.x === x && a.y === y
                        && Object.keys(a).some(p => p === "teleId"));
                    if (special) {
                        anchor.teleId = special.teleId;
                    }
                    this.anchors.push(anchor);
                }
            }
        }
        for (const w of l.wands) {
            this.wands.push(new SpinWand({ x: w.x, y: w.y }, w.type));
        }
        for (let i = 0; i < this.wands.length; i++) {
            const aid = this.anchors.findIndex(a => a.base.x === this.wands[i].base.x
                && a.base.y === this.wands[i].base.y);
            this.anchors[aid].attachWand(i);
        }
        for (const w of l.walls) {
            this.walls.push(new SpinWall(w.x1, w.y1, w.x2, w.y2));
        }
    }
    reset() { // clear existing stacks in state
        while (this.anchors.length > 0) { this.anchors.pop(); }
        while (this.wands.length > 0) { this.wands.pop(); }
        while (this.walls.length > 0) { this.walls.pop(); }
    }
    tick() {
        this.wands.forEach(w => w.stepAngle());
        // TODO other tick events here!
    }
    playerHitsBad() {
        // If on same anchor, mark as hitting enemy if within same 80 degree sector 
        let sharedAnchor = this.anchors.findIndex(a => a.wands.length > 1 && a.wands.some(w => w === 0));
        if (sharedAnchor > -1) {
            const angles = this.anchors[sharedAnchor].wands.map(wid => this.wands[wid].angle).sort((a,b) => a - b);
            if (angles[1] - angles[0] < 40 || angles[1] - angles[0] > 320) return true;
        }

        for (let i = 1; i < this.wands.length; i++) {
            // skip distant wands to avoid unncessary calculation
            if (pointsFar(this.wands[0].base, this.wands[i].base)) continue;
            // enemy wands -- (2) argument shortens the length to avoid unintentional hits.
            if (lineIntersect(this.wands[0].base, this.wands[0].getDest(2),
                                this.wands[i].base, this.wands[i].getDest(2))) {
                return true;
            }
            // Are wands overlapping perfectly from adjacent anchors?
            if (areClose(this.wands[0].base, this.wands[i].dest)
                && areClose(this.wands[0].dest, this.wands[i].base)) {
                return true;
            }
        }

        // other bad things?

        return false;
    }
    playerHitsBounceable() {
        // walls
        for (let i = 0; i < this.walls.length; i++) {
            if (lineIntersect(this.wands[0].base, this.wands[0].dest,
                this.walls[i].startxy(), this.walls[i].endxy())) {
                // This call moves the wand back quickly to avoid clipping
                this.wands[0].reverse(2);
                return true;
            }
        }

        // other bounceable things?
        return false;
    }
    latchableAnchorIdFor(wandId) {
        return this.anchors.findIndex(a => areClose(a.base, this.wands[wandId].dest))
    }
    currentAnchorIdFor(wandId) {
        return this.anchors.findIndex(a => a.wands.some(wid => wid === wandId));
    }
    moveWand(wid, oid, tid) {
        /***
         * move WandID from anchor OriginID to anchor TargetID
         */
        if (this.anchors[tid].type === 5) {
            const telMatch = this.anchors[tid].teleId % 10;
            tid = this.anchors.findIndex(a => a.teleId % 10 === telMatch && a.teleId != this.anchors[tid].teleId);
        }

        const fromEph = this.anchors.findIndex(v => v.ephlock);

        this.anchors[oid].detachWand(wid);
        this.wands[wid].setAnchor(this.anchors[tid].base);
        this.anchors[tid].attachWand(wid);

        if (wid === 0 && fromEph > -1) {
            this.anchors.splice(fromEph, 1);
        }

        this.wands[wid].latchAngle();
        
        if (this.wands[wid].controls.swing) {
            this.wands[wid].reverse(0);
        }
    }
    processWands() {
        /***
         * Determine latch behavior for eligible enemy wands
         */
        for (let i = 1; i < this.wands.length; i++) {
            if (this.wands[i].betweenRights()) continue;
            const originId = this.currentAnchorIdFor(i);
            const targetId = this.latchableAnchorIdFor(i);
            if (targetId > -1) {
                if (this.anchors[targetId].type === this.wands[i].type) {
                    if (this.wands[i].controls.swing || this.wands[i].controls.latch) {
                        this.moveWand(i, originId, targetId);
                    } else if (this.wands[i].controls.bounce) {
                        this.wands[i].reverse(0);
                    }
                }
            }
        }
    }
}

/***
 * Game object
 */

var game = {
    canvas: document.createElement("canvas"),
    bgcanvas: document.createElement("canvas"),
    offscreen: new OffscreenCanvas(SCALE * (MAX_WIDTH + 2), SCALE * (MAX_HEIGHT + 2)),
    state: new State(),
    sprite: {
        button: {
            1: { up: null, down: null },
            2: { up: null, down: null },
            3: { up: null, down: null }
        },
        anchor: {
            1: { default: null, eph: null, points: null },
            2: { default: null, eph: null, points: null },
            3: { default: null, eph: null, points: null },
            4: { default: null, eph: null, points: null },
            5: { default: null, eph: null, points: null },
            9: { default: null, eph: null, points: null }
        }
    },
    start: function() {
        this.canvas.width = SCALE * (MAX_WIDTH + 2);
        this.canvas.height = SCALE * (MAX_HEIGHT + 2);
        this.bgcanvas.width = SCALE * (MAX_WIDTH + 3);
        this.bgcanvas.height = SCALE * (MAX_HEIGHT + 3);
        this.xos = ~~(SCALE / 2);
        this.yos = ~~(SCALE / 2);
        this.fgctx = this.canvas.getContext("2d");
        this.ctx = this.offscreen.getContext("2d");
        this.bgctx = this.bgcanvas.getContext("2d");
        this.canvas.id = "gameui";
        this.bgcanvas.id = "bgui";
        document.getElementById("stage").appendChild(this.canvas);
        document.getElementById("stage").appendChild(this.bgcanvas);
        this.createMenuEntries();
        this.interval = 0;

        this.aniData = { // should be args?
            current: 0,
            step: 0,
            max: 0
        };
        
        this.drawbg();
    },
    selectLevel: function(levelid) {
        this.state.loadLevel(SpinLevels[levelid]);
        this.canvas.focus();
        this.drawbg();
        this.startGameLoop();
    },
    offset: function(xy) { // for canvas draws, return integers
        return [~~(xy.x + SCALE + this.xos), ~~(xy.y + SCALE + this.yos)]
    },
    loadSprites: function() {
        const btnImg = document.getElementById("buttSprite");
        Promise.all([
            createImageBitmap(btnImg, 0, 0, 32, 32),
            createImageBitmap(btnImg, 32, 0, 32, 32),
            createImageBitmap(btnImg, 0, 32, 32, 32),
            createImageBitmap(btnImg, 32, 32, 32, 32),
            createImageBitmap(btnImg, 0, 64, 32, 32),
            createImageBitmap(btnImg, 32, 64, 32, 32)
        ]).then((sprites) => {
            this.sprite.button[1].up = sprites[0];
            this.sprite.button[1].down = sprites[1];
            this.sprite.button[2].up = sprites[2];
            this.sprite.button[2].down = sprites[3];
            this.sprite.button[3].up = sprites[4];
            this.sprite.button[3].down = sprites[5];
        });
        const aImg = document.getElementById("anchorSprite");
        Promise.all([
            createImageBitmap(aImg, 0, 0, 11, 11),   // white
            createImageBitmap(aImg, 11, 0, 11, 11),
            createImageBitmap(aImg, 22, 0, 11, 11),
            createImageBitmap(aImg, 0, 11, 11, 11),  // red
            createImageBitmap(aImg, 11, 11, 11, 11),
            createImageBitmap(aImg, 22, 11, 11, 11),
            createImageBitmap(aImg, 0, 22, 11, 11),  // blue
            createImageBitmap(aImg, 11, 22, 11, 11),
            createImageBitmap(aImg, 22, 22, 11, 11),
            createImageBitmap(aImg, 0, 33, 11, 11),  // green
            createImageBitmap(aImg, 11, 33, 11, 11),
            createImageBitmap(aImg, 22, 33, 11, 11),
            createImageBitmap(aImg, 0, 44, 11, 11), // tele
            createImageBitmap(aImg, 0, 55, 11, 11), // exit
        ]).then((sprites) => {
            this.sprite.anchor[1].default = sprites[0];
            this.sprite.anchor[1].eph = sprites[1];
            this.sprite.anchor[1].points = sprites[2];
            this.sprite.anchor[2].default = sprites[3];
            this.sprite.anchor[2].eph = sprites[4];
            this.sprite.anchor[2].points = sprites[5];
            this.sprite.anchor[3].default = sprites[6];
            this.sprite.anchor[3].eph = sprites[7];
            this.sprite.anchor[3].points = sprites[8];
            this.sprite.anchor[4].default = sprites[9];
            this.sprite.anchor[4].eph = sprites[10];
            this.sprite.anchor[4].points = sprites[11];
            this.sprite.anchor[5].default = sprites[12];
            this.sprite.anchor[9].default = sprites[13];
        });
    },
    clear: function() {
        this.ctx.clearRect(0, 0, this.offscreen.width, this.offscreen.height);
        this.fgctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    },
    draw: function() {
        // TODO draw Animation frames
        // TODO draw Field objects and Gates

        this.state.walls.forEach(w => w.draw());
        this.state.wands.forEach(w => w.draw());
        this.state.anchors.forEach(a => a.draw());

        this.fgctx.drawImage(this.offscreen, 0, 0);
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
        if (this.state.levmeta.num > 0) {
            this.bgctx.textAlign = "right";
            const levstring = `Level ${this.state.levmeta.num}: ${this.state.levmeta.title}`;
            this.bgctx.fillText(levstring, this.bgcanvas.width - 7, 7)
        }
        this.bgctx.textBaseline = "bottom";
        this.bgctx.textAlign = "left";
        this.bgctx.fillText("Wands: ∞", 7, this.bgcanvas.height - 7);
        this.bgctx.textAlign = "right";
        this.bgctx.fillText("Score: 0", this.bgcanvas.width - 7, this.bgcanvas.height - 7)
    },
    drawDeathFrame: function() {
        const [cur, max] = [this.aniData.current, this.aniData.max];
        const width = ~~((this.state.wands[0].width + 2) * ((max - cur) / max));
        const [r, g, b] = [((max - cur) / max) > 0.5 ? 255 : 255 - ~~(cur / 2), 255 - cur, 255 - cur];
        this.fgctx.beginPath();  
        this.fgctx.strokeStyle = `rgba(${r},${g},${b},${(max - cur) / max})`;
        this.fgctx.lineWidth = width;
        this.fgctx.moveTo(...this.offset(this.state.wands[0].base));
        this.fgctx.lineTo(...this.offset(this.state.wands[0].dest));
        this.fgctx.closePath();
        this.fgctx.stroke();
    },
    animate: function(kind) {
        if (kind == "death") {
            clearInterval(this.interval);
            this.aniData.current = 0;
            this.aniData.step = 3;
            this.aniData.max = 200;
            this.interval = setInterval(animateDeath, 30);
        }
    },
    restart: function() {
        clearInterval(this.interval);
        this.state.loadLevel(SpinLevels[this.state.levmeta.num]);
        this.startGameLoop();
    },
    gameOver: function () {
        clearInterval(this.interval);
        this.bgctx.textBaseline = "bottom";
        this.bgctx.textAlign = "center";
        this.bgctx.fillText("Game Over", ~~(this.bgcanvas.width / 2), this.bgcanvas.height - 7);
        this.openMenu();
    },
    createMenuEntries: function() {
        const seldiv = document.createElement("div");
        const h2 = document.createElement("h2");
        h2.innerText = "Select Level";
        seldiv.appendChild(h2);
        seldiv.id = "selector";
        for (let lvi = 1; lvi < SpinLevels.length; lvi++) {
            const span = document.createElement("span");
            span.innerText = `Level ${SpinLevels[lvi].num}: ${SpinLevels[lvi].title}`;
            span.setAttribute("onclick", `clickLevel(${lvi})`);
            seldiv.appendChild(span);
        }
        document.getElementById("stage").appendChild(seldiv);
    },
    startGameLoop: function() {
        this.canvas.focus();
        this.interval = setInterval(updateGameArea, 30);
    },
    openMenu: function() {
        clearInterval(this.interval);
        const menu = document.getElementById("selector");
        menu.classList.remove("hideme");
    }
}

function startGame() {
    game.loadSprites();

    game.start();
}

/**
 * Game Loop
 */

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
    
    const targetIndex = game.state.latchableAnchorIdFor(0);
    if (targetIndex > -1) {
        const originIndex = game.state.currentAnchorIdFor(0);
        const target = game.state.anchors[targetIndex];
        if (game.state.wands[0].controls.swing || game.state.wands[0].controls.latch) {
            if (target.type === 9) {
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

    // non-player wands
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
            case 27: // escape
                game.openMenu(); break;
            case 32: // space
                event.preventDefault();
                SpinSound.switch.play();
                game.state.wands[0].reverse(); break;
            case 70: // f
                game.state.wands[0].controls.swing = true; break;
            case 68: // d
                game.state.wands[0].controls.latch = true; break;
            case 83: // s
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
            case 68: // d
                game.state.wands[0].controls.latch = false; break;
            case 83: // s
                game.state.wands[0].controls.bounce = false; break;
            default:
                break;
        }
    })}
);
