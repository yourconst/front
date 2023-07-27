class Graph {
    drawRect(x, y, w, h) {
        let cw = this.w,
            ch = this.h;

        this.ctx.fillRect(cw * x, ch * y, cw * w, ch * h - 1);
    }

    draw(arrs) {
        let cnt = arrs.length, h = 1 / cnt;

        this.canvas.width = this.canvas.width;

        for(let i=0; i<cnt; ++i) {
            let len = arrs[i].length, w = 1 / len;
            let a = arrs[i], hi = h + 2 * h * Math.trunc(i/2), m = h * Math.pow(-1, i + 1);

            this.ctx.beginPath();
            this.ctx.moveTo(0, this.h * (hi + m * a[0] / 256));

            for(let j=1; j<len; ++j) {
                this.ctx.lineTo(this.w * w * j, this.h * (hi + m * a[j] / 256));
                //this.drawRect(w * j, hi, w, m * a[j] / 256);
            }

            //this.ctx.lineTo(this.w, this.h * hi);
            //this.ctx.lineTo(0, this.h * hi);
            this.ctx.stroke();
            this.ctx.closePath();
        }
    }

    updateRes() {
        //this.w = this.canvas.width = window.innerWidth - 50;
        //this.h = this.canvas.height = Math.trunc(window.innerWidth / 4);
        this.w = this.canvas.clientWidth;
        this.h = this.canvas.clientHeight;
    }

    constructor() {
        this.canvas = document.createElement("canvas");
        this.ctx = this.canvas.getContext("2d");
        this.w; this.h;

        this.updateRes();

        window.addEventListener('resize', this.updateRes.bind(this));
    }
};