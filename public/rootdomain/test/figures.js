class Figures {
    static makeSpiralOld(fn, loops, dr, dd = 14e3, startAngle = Math.max(1, -1000 / dr)) {
        const end = loops * 2 * Math.PI;
        let a = startAngle;

        dr /= 6.5;

        dd *= 1.04;
        a += dd / Math.abs(a * dr);

        for(let r = a * dr; a < end; r = Math.abs(a * dr), a += dd / r)
            fn(a, r);
    }

    static makeSpiral(fn, loops, cnt, r = 100, start = 0) {
        r /= 2 * Math.PI;
        
        let magic = 11.13666, 
            dr = r / loops,
            len = Math.pow(magic * dr * loops, 2) - Math.pow(dr / 2, 2),
            dl = len / --cnt,
            c = Math.pow(dr / 2, 2),
            vr;

        for(let i = 0, l = 0; i < cnt; ++i, l += dl) {
            vr = Math.sqrt(l / Math.PI + c);
            fn(start + vr / dr, vr);
        }

        vr = Math.sqrt(len / Math.PI + c);
        fn(start + vr / dr, vr);
    }

    static makeCirclesOld(fn, loops, dr, dd) {
        dd *= 10 * 0.000002557;

        for(let i = 1, r = dr * i, dj = dd * Math.PI / i;
                i<loops; ++i,
                r = dr * i, dj = dd * Math.PI  / i)
            for(let j=0; j<2 * Math.PI; j+=dj)
                fn(j, r);
    }

    static makeCircles(fn, loops, cnt, r, start = 0, stop = start + 2 * Math.PI) {
        if(loops < 0) {
            start += Math.PI;
            stop += Math.PI;
            loops = -loops;
        }

        let dr = r / loops,
            vlen = Math.abs(loops) == 1 ? 1 :
                    /* 2 * Math.PI * dr * */ ((1 + loops) * loops / 2);

        //console.log(loops, cnt);

        for(let i=1, p, step, cr, len; i<=loops; ++i) {
            p = i / vlen;
            vlen -= i;
            len = Math.trunc(cnt * p);
            cnt -= len;
            step = (stop - start) / (--len);

            //console.log(vlen, cnt);

            cr = dr * i;

            for(let j=0; j<len; ++j)
                fn(start + j * step, cr);

            fn(stop, cr)
        }
    }

    static makeCircle(fn, pntCnt, r, start = 0, stop = 2 * Math.PI) {
        let step = (stop - start) / (pntCnt - 1), delta = Math.abs(step / 8);

        for(let i = start; Math.abs(stop - i) > delta; i+=step)
            fn(i, r);

        fn(stop, r);
    }
};

if(typeof module != 'undefined') {
    module.exports = Figures;
}