var ctx, canvas, video;
var renderer, camera, imgData;
var maxCount = 1 << 18, coordinates = new Int16Array(3 * maxCount), pCount = 0,
    buffer = new Uint32Array(4 * maxCount), sCount = 0,
    zBuffer;
var bind, actx;

var KEYS = {
    ctrl: 17, alt: 18, shift: 16, esc: 27,
    enter: 13, backspace: 8, tab: 9, space: 32,
    w: 87, a: 65, s: 83, d: 68,
    up: 38, down: 40, left: 37, right: 39,
    plus: 189, minus: 187, m: 77, x: 88
}, keyHold = {};

document.addEventListener("keydown", function (event) {
    var code = event.keyCode;

    if (!keyHold[code])
        keyHold[code] = true;
});

document.addEventListener("keyup", function (event) {
    var code = event.keyCode;

    if (keyHold[code])
        keyHold[code] = false;
});

file.oninput = function(event) {
    if(!file.files.length)
        return;

    let fr = new FileReader();

    fr.onload = () => actx.changeSource(fr.result);

    fr.readAsArrayBuffer(file.files[0]);
    
   /*  fr.onload = () => {
        actx.changeSource(fr.result);
    }
    fr.readAsDataURL(file.files[0]); */
};

function makePoint(x = 0, y = 0, z = 0) {
    let pn = 3 * pCount;

    coordinates[pn] = x;
    coordinates[++pn] = y;
    coordinates[++pn] = z;

    ++pCount;
}

function init() {
    let w = 300, h = 300, offset = 3, dx = canvas.width >> 1, dy = canvas.height >> 1;

    renderer = new Renderer(w, h);
    renderer.onchange = event => {
        imgData = renderer.cleanImageData;
        zBuffer = new Uint16Array(renderer.width * renderer.height);
    };
    renderer.appendTo(document.body); // change call
    renderer.canvas.style = "width: 600px; height: 600px;";
    //document.body.appendChild(renderer.domElement);

    camera = new Camera(/*  45, w / h, 1, 10000  */);
    camera.rotation.set(Math.PI, 0);
    camera.position.set(0, 0, 3000);

    renderer.canvas.onmousemove = event => {
        let x = event.movementX / 1e3, y = event.movementY / 1e3;

        camera.rotation.x += x;
        camera.rotation.y += y;
    }

    renderer.canvas.onclick = function (event) {
        renderer.canvas.requestPointerLock(event);
    };

    for (let j = 0; j < canvas.height; ++j)
        for (let i = 0; i < canvas.width; ++i)
            makePoint(offset * (dx - i), offset * (j - dy));
}

function setSize(elem, pcnt, w, h) {
    let q = w / h;

    elem.width = Math.trunc(Math.sqrt(pcnt * q));
    elem.height = Math.trunc(Math.sqrt(pcnt / q));

    elem.style.width = w;
    elem.style.height = h;
}

window.onload = event => {
    canvas = document.getElementById("canvas");
    video = document.getElementById("video");

    ctx = canvas.getContext("2d");

    //canvas.style.imageRendering = "pixelated";

    video.ondurationchange =
        event => setSize(canvas, maxCount, video.videoWidth, video.videoHeight);

    video.ontimeupdate = event => ctx.drawFull(video);

    video.onloadeddata = event => {
        video.ondurationchange();
        video.volume = 0;
        init();
        actx = new ACTX;
        actx.onchange = event => ACTime.max = actx.duration;
        actx.monoAnalysing = true;
        bind = new Bind;
        video.onloadeddata = null;

        main();
    };

    video.src = "video.mp4";
};

function toBuf() {
    let cp = camera.position,
        cpx = cp.x, cpy = cp.y, cpz = cp.z;
    let aX = camera.rotation.x, aY = camera.rotation.y, aZ = camera.rotation.z,
        sinX = Math.sin(aX), cosX = Math.cos(aX),
        sinY = Math.sin(aY), cosY = Math.cos(aY),
        sinZ = Math.sin(aZ), cosZ = Math.cos(aZ);
    let x, y, z, xr, yr, zr;

    let p = coordinates, b = buffer, fov = camera.fov;
    let plen = coordinates.length, l = 0; // sCount
    let w = renderer.width, h = renderer.height,
        hw = renderer.hWidth, hh = renderer.hHeight;

    for (let i = 0; i < plen; ++i) {
        x = p[i] - cpx;
        y = p[++i] - cpy;
        z = p[++i] - cpz;

        xr = x * cosX - z * sinX;
        zr = x * sinX + z * cosX;
        yr = y * cosY - zr * sinY;
        zr = y * sinY + zr * cosY;
        x = xr * cosZ - yr * sinZ;
        yr = xr * sinZ + yr * cosZ;

        xr = x;

        /*          if(zr>0) {
                    x = hw + xr * fov / zr;
                    y = hh + yr * fov / zr;
                    if(x>0&&x<w&&y>0&&y<h) {
                            b[l++] = x;
                            b[l++] = y;
                    }
                } */    // 10-20 % more slow

        x = hw + xr * fov / zr;
        y = hh + yr * fov / zr;


        b[l] = x;
        b[++l] = y;
        b[++l] = zr;
        b[++l] = (i / 3) >> 0;

        l += zr > 0 && x > 0 && x < w && y > 0 && y < h ? 1 : -3;
    }

    sCount = l;
}

function draw(clrs) {
    let opacity = 255, w = imgData.width, max = (1 << 16) - 1;
    let data = imgData.data, b = buffer, z = zBuffer, len = sCount;

    for(let i=0; i<z.length; ++i)
        z[i] = max;

    imgData.clear();

    for (var i = 0, j, k, dist; i < len; ++i) {
        j = (b[i] + b[++i] * w);
        dist = b[++i];
        k = b[++i] << 2;

        if(dist < z[j]) {
            z[j] = dist;

            j <<= 2;

            data[j] = clrs[k];
            data[++j] = clrs[++k];
            data[++j] = clrs[++k];
            data[++j] = opacity;
        }
    }

    renderer.render(imgData);
}

var audioMult = 1;

function changePositions(cData, aData) {
    let len = coordinates.length / 3, cmlt = mult / 3,
        adl = aData.length, amlt = audioMult;

    for (let i = 0; i < len; ++i) {
        let k = 4 * i;
        coordinates[3 * i + 2] =
            amlt * aData[i % adl] +
            cmlt * (cData[k] + cData[++k] + cData[++k]);
    }
}

var cvmax = 1000, acc = 5, vmax, mult = 1;

function px(ax, az) {
    let v = camera.velocity;

    v.x = ax * vmax;
    v.z = az * vmax;
}

function keys() {
    let k = KEYS, dn = keyHold;
    let v = camera.velocity, a = camera.rotation.x,
        cos = Math.cos(a), sin = Math.sin(a);

    vmax = (dn[k.x] ? acc : 1) * cvmax;

    if (dn[k.left] || dn[k.a]) px(-cos, sin); else
        if (dn[k.right] || dn[k.d]) px(cos, -sin); else
            if (dn[k.down] || dn[k.s]) px(-sin, -cos); else
                if (dn[k.up] || dn[k.w]) px(sin, cos); else px(0, 0);
    if (dn[k.shift]) v.y = vmax; else
        if (dn[k.space]) v.y = -vmax; else v.y = 0;
}

function move(o, dt) {
    let v = o.velocity, p = o.position,
        dx = v.x * dt, dy = v.y * dt, dz = v.z * dt;

    p.x += Math.trunc(dx);
    p.y += Math.trunc(dy);
    p.z += Math.trunc(dz);
}

var RADIUS = 3000, ALPHA = 0, flyingSpeed = 1, flyingEnable = false,
    lastPosition = new Point3(0,0,RADIUS),
    flyAnim = new Animation(1);

function calcAnimDuration() {
    let d = camera.position.distanceTo(lastPosition);
    flyAnim.transition = d * 0.001 * (0.2 + Math.sqrt(2 / flyingSpeed));
}

function Beta(a) {
    //return 1.5 * a;

    let aa = Math.abs(a);
    return a + Math.pow(aa, 0.8) - Math.pow(aa, 0.6) - Math.pow(aa, 0.4) - Math.pow(aa, 0.2);
}

function calcPosition(pos, dt = 0) {
    let b = Beta(ALPHA);

    ALPHA += 0.01 * flyingSpeed * dt;

    pos.set(
        RADIUS * Math.cos(ALPHA),
        RADIUS * Math.sin(ALPHA) * Math.cos(b),
        RADIUS * Math.sin(b)
    );
}

function flyChange() {
    if(flyingEnable) {
        calcPosition(lastPosition, 0);
        calcAnimDuration();
        flyAnim.begin(1, 0);
    } else {
        lastPosition.set(0,0,RADIUS);
        calcAnimDuration();
        flyAnim.begin(1, 0);
    }
}

function changeCamPos(dt) {
    let p = flyAnim.getCurrentState(), pos = camera.position;
    
    if(flyAnim.animate && flyAnim.getPercent() < 0.4) {
        pos.add(new Point3().copy(lastPosition).sub(pos).multiplyScalar(p));
    } else {
        if(flyingEnable) {
            calcPosition(pos, dt);
        } else {
            // pos.set(0, 0, RADIUS);
            keys();
            move(camera, dt);
        }
    }
    
    camera.lookAtCoord(0,0, 128 * (mult + audioMult));
}

let last = Date.now();

function main() {
    requestAnimationFrame(main);

    let dt = (Date.now() - last) / 1000,
        data = ctx.imageData.data;
    last = Date.now();

    if (!video.paused) {
        ctx.drawFull(video);
        //project(ctx.imageData.data);
    }

    changeCamPos(dt);

    changePositions(data, actx.currentMainData[1]);
    toBuf();
    draw(data);
    
    bind.animate();

    delete data;
}