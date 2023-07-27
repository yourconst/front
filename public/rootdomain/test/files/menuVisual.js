const Animation = require("../bind").Animation;


class Point2 {
    setCoordinates(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }

    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }
}

function fillCircle(arr, r, startAngle = 0, offset = 0, cnt = arr.length - offset) {
    const da = 2 * Math.PI / (cnt - 1),
        ei = offset + cnt;

    for(let i=offset; i<ei; ++i) {
        const a = startAngle + i * da;

        arr[i].setCoordinates(r * Math.cos(a), r * Math.sin(a));
    }

    arr[offset + cnt - 1].setCoordinates(r * Math.cos(startAngle), r * Math.sin(startAngle));
}

function makeLogo(arr, offset = 0) {
    const symbols = [
        0, -120, -50, 0, -50, 110, -50, 0, -100, -70, -50, 0, 0, -120,  // Y
        -25, -60, -12, -80, 0, -95, 12, -110, 25, -110, 40, -100, 50, -80,  // C begin
        60, -70, 50, -80, 40, -100, 25, -110, 12, -110, 0, -95, -12, -80,
        -25, -60, -30, -30, -30, 0, -30, 30, -25, 60, -12, 80, 0, 95, 12, 110,
        25, 110, 40, 100, 50, 80, 60, 70, 50, 80, 40, 100, 25, 110, 12, 110,
        0, 95, -12, 80, -25, 60, -30, 30, -30, 0, -30, -30, -25, -60, 0, -120  // C end
    ];
    
    toPointArr(arr, symbols, offset);
}

function toPointArr(arr, xyarr, offset = 0) {
    for(let i=0; i<xyarr.length; i += 2)
        arr[offset+i>>1].setCoordinates(xyarr[i], xyarr[i + 1]);
}

function fillPointsArr(arr, cnt) {
    let l = arr.length;
    
    if(l == cnt)
        return;

    if(l > cnt)
        arr.splice(cnt);
    else
        for(let i=l;i<cnt;++i)
            arr.push(new Point2);
}

class MenuVisual {
    play(){ this.anim.begin(1); }
    pause(){ this.anim.begin(0); }

    draw(data, p1 = this.anim.getCurrentState(), p2 = 1 - p1) {
        const
            data2 = this.curve,
            lvls = 256, len = data.length,
            w = this.canvas.clientWidth,
            h = this.canvas.clientHeight,
            multX = w / (len - 1),
            multY = h / lvls;

        p2 *= multY;

        let wp2 = w / multY / 2;

        this.canvas.width = w;
        this.canvas.height = h;

        this.ctx.strokeStyle = this.color;

        this.ctx.lineWidth = 2;

        this.ctx.moveTo(p1*0*multX + p2*(wp2+data2[0].x), p1*data[0]*multY + p2*(128+data2[0].y));

        for(let i=1; i<len; ++i)
            this.ctx.lineTo(p1*i*multX + p2*(wp2+data2[i].x), p1*data[i]*multY + p2*(128+data2[i].y));

        this.ctx.stroke();
    }

    get pointsCount() { return this.curve.length; }
    set pointsCount(value) {
        fillPointsArr(this.curve, value);
        fillCircle(this.curve, 120, Math.PI / 2);
    }

    constructor(elem, pointsCount = 32) {
        this.canvas = elem;
        this.ctx = elem.getContext("2d");

        this.anim = new Animation(1.3, "bezier");

        this.color = "gray";

        this.curve = [];

        this.pointsCount = pointsCount;
    }
};

if(typeof module != 'undefined') {
    module.exports = MenuVisual;
}