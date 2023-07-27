var Animation = Bind.Animation;

var renderer, camera, imgData;
var maxCount = (1 << 19)/*  + (1 << 18) */, coordinates = new Int32Array(3 * maxCount), pCount = 0,
    buffer = new Uint16Array(2 * maxCount), sCount = 0;
var coordinates1 = new Int32Array(3 * maxCount),
    coordinates2 = new Int32Array(3 * maxCount);
var scl = 3e4, hgt = 0.7, basePoints1 = [
        new Point3(0,-hgt,0).multiplyScalar(scl),
        new Point3(1,hgt,0).multiplyScalar(scl),
        new Point3(Math.cos(2/3*Math.PI),hgt,Math.sin(2/3*Math.PI)).multiplyScalar(scl),
        new Point3(Math.cos(4/3*Math.PI),hgt,Math.sin(4/3*Math.PI)).multiplyScalar(scl)
    ], scl2 = 1.4 * scl,
    basePoints2 = [
        new Point3(-1,-1,-1).multiplyScalar(scl2),
        new Point3(-1,0,-1).multiplyScalar(scl2),
        new Point3(-1,1,-1).multiplyScalar(scl2),
        new Point3(0,1,-1).multiplyScalar(scl2),
        new Point3(1,1,-1).multiplyScalar(scl2),
        new Point3(1,0,-1).multiplyScalar(scl2),
        new Point3(1,-1,-1).multiplyScalar(scl2),
        new Point3(0,-1,-1).multiplyScalar(scl2),
        new Point3(-1,-1,0).multiplyScalar(scl2),
        new Point3(-1,1,0).multiplyScalar(scl2),
        new Point3(1,1,0).multiplyScalar(scl2),
        new Point3(1,-1,0).multiplyScalar(scl2),
        new Point3(-1,-1,1).multiplyScalar(scl2),
        new Point3(-1,0,1).multiplyScalar(scl2),
        new Point3(-1,1,1).multiplyScalar(scl2),
        new Point3(0,1,1).multiplyScalar(scl2),
        new Point3(1,1,1).multiplyScalar(scl2),
        new Point3(1,0,1).multiplyScalar(scl2),
        new Point3(1,-1,1).multiplyScalar(scl2),
        new Point3(0,-1,1).multiplyScalar(scl2)
    ],
    lastPoint1 = new Point3(),
    lastPoint2 = new Point3();//.copy(basePoints[0]);

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
};

function makePoint(x = 0, y = 0, z = 0) {
    let pn = 3 * pCount;

    coordinates[pn] = x;
    coordinates[++pn] = y;
    coordinates[++pn] = z;

    ++pCount;
}

function makeFractalPoint() {
    let i = 3 * pCount;

    lastPoint1.add(basePoints1[Math.trunc(basePoints1.length * Math.random())]);
    lastPoint1.multiplyScalar(1/2.5);

    coordinates1[i] = lastPoint1.x;
    coordinates1[i + 1] = lastPoint1.y;
    coordinates1[i + 2] = lastPoint1.z;

    lastPoint2.add(basePoints2[Math.trunc(basePoints2.length * Math.random())]);
    lastPoint2.multiplyScalar(1/5);

    coordinates2[i] = lastPoint2.x;
    coordinates2[i + 1] = lastPoint2.y;
    coordinates2[i + 2] = lastPoint2.z;

    pCount += pCount > maxCount - 2 ? 0 : 1;
}

function init() {
    let w = 600, h = 600, sz = 1 << 15, hsz = -(sz >> 1);

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
    camera.position.set(0, 0, -90000);
    camera.fov /= 1;
    //camera.lookAtCoord(0,0,0);

    renderer.canvas.onmousemove = event => {
        let x = event.movementX / 1e3, y = event.movementY / 1e3;

        camera.rotation.x += x;
        camera.rotation.y += y;
    }

    renderer.canvas.onclick = function (event) {
        renderer.canvas.requestPointerLock(event);
    };

/*     for (let i = 0; i < maxCount; ++i) {
        let a = 1 * Math.PI * Math.random(), b = 2 * Math.PI * Math.random();
        //velocities[3 * i+1] = 0;
        makePoint(
            sz * Math.sin(a) * Math.cos(b),
            sz * Math.sin(a) * Math.sin(b),
            sz * Math.cos(a)
        );
        //makePoint(hsz + sz * Math.random(), hsz + sz * Math.random(), hsz + sz * Math.random());
    } */
}

function setSize(elem, pcnt, w, h) {
    let q = w / h;

    elem.width = Math.trunc(Math.sqrt(pcnt * q));
    elem.height = Math.trunc(Math.sqrt(pcnt / q));

    elem.style.width = w;
    elem.style.height = h;
}

window.onload = event => {
        init();

        actx = new ACTX;
        //actx.onchange = event => ACTime.max = actx.duration;

        actx.onchange = () => {
            ACTime.max = actx.duration;
            ACTime.value = actx.currentTime;
        }
    
        actx.ondurationchange = () => {
            ACTime.title = ACTime.value = actx.currentTime;
    
            if(!ACTime.single.animation.animate)
                ACTime.single.animation.target = ACTime.value;
        };

        actx.monoAnalysing = true;
        actx.mainDataSize = 0;
        bind = new Bind;

        actx.update();

        main();
};

function toBuf(dt) {
    let cp = camera.position,
        cpx = cp.x, cpy = cp.y, cpz = cp.z,
        aX = camera.rotation.x, aY = camera.rotation.y, aZ = camera.rotation.z,
        sinX = Math.sin(aX), cosX = Math.cos(aX),
        sinY = Math.sin(aY), cosY = Math.cos(aY),
        sinZ = Math.sin(aZ), cosZ = Math.cos(aZ),
        x, y, z, xr, yr, zr;

    let px, py, pz;

    let p = coordinates, b = buffer, fov = camera.fov;
    let plen = 3 * pCount, l = 0; // sCount
    let w = renderer.width, h = renderer.height,
        hw = renderer.hWidth, hh = renderer.hHeight;
    
    for (let i = 0; i < plen; ++i) {
        px = p[i] - cpx;
        py = p[++i] - cpy;
        pz = p[++i] - cpz;

        xr = px * cosX - pz * sinX;
        zr = px * sinX + pz * cosX;
        yr = py * cosY - zr * sinY;
        zr = py * sinY + zr * cosY;
        px = xr * cosZ - yr * sinZ;
        yr = xr * sinZ + yr * cosZ;

        xr = px;
        
        x = hw + xr * fov / zr;
        y = hh + yr * fov / zr;

        b[l] = x;
        b[++l] = y;

        l += zr > 0 && x > 0 && x < w && y > 0 && y < h ? 1 : -1;
    }

    sCount = l;

    //console.log(k, dt);
}

function draw() {
    let up = 255, w = imgData.width;
    let data = imgData.data, b = buffer, len = sCount;

    imgData.clear();

    for (var i = 0, j; i < len; ++i) {
        j = (b[i] + b[++i] * w) << 2;

        data[j] = data[++j] = data[++j] = data[++j] = up;
    }

    renderer.render(imgData);
}

var audioMult = 1;

function changePositions(aData, per1 = 1, per2 = 1 - per1) {
    let adl = aData.length, amlt = audioMult;

    let p = coordinates, p1 = coordinates1, p2 = coordinates2;
    let plen = 3 * (pCount / 5);
    
    for (let i = 0; i < plen; ++i) {
        p[i] = (per1 * p1[i] + per2 * p2[i])/*  + amlt * (aData[i % adl] - 128) */;
        ++i;
        p[i] = (per1 * p1[i] + per2 * p2[i]) + amlt * (aData[i % adl] - 128);
        ++i;
        p[i] = (per1 * p1[i] + per2 * p2[i]) + amlt * (aData[i % adl] - 128);
    }
}

var cvmax = 3e4, speed = 1, acc = 5, vmax;

function px(ax, az) {
    let v = camera.velocity;

    v.x = ax * vmax;
    v.z = az * vmax;
}

function keys() {
    let k = KEYS, dn = keyHold;
    let v = camera.velocity, a = camera.rotation.x,
        cos = Math.cos(a), sin = Math.sin(a);

    vmax = (dn[k.x] ? acc : 1) * speed * cvmax / timeCost;

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

var RADIUS = 85000, ALPHA = 3.5, flyingSpeed = 15, flyingEnable = true,
    lastPosition = new Point3(), nextPosition = new Point3(0,0,RADIUS),
    flyAnim = new Animation(1, "bezier");

function calcAnimDuration() {
    let d = camera.position.distanceTo(nextPosition);
    flyAnim.transition = 0.03 * (0.2 + Math.sqrt(d * 2 / flyingSpeed));
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
        calcPosition(nextPosition, 0);
        calcAnimDuration();
        flyAnim.begin(1, 0);
    } else {
        nextPosition.set(0,0,RADIUS);
        calcAnimDuration();
        flyAnim.begin(1, 0);
    }

    lastPosition.copy(camera.position);
}

function changeObjPos(obj, dt) {
    let p = flyAnim.getCurrentState(), per = flyAnim.getPercent(), pos = obj.position;
    
    if(flyAnim.animate) {
        let mb = new Point3().copy(nextPosition)
            .sub(lastPosition).multiplyScalar(p).add(lastPosition);

        calcPosition(pos, dt);
        if(flyingEnable) {
            pos.multiplyScalar(p).add(mb.multiplyScalar(1 - p));
        } else
            pos.multiplyScalar(1 - p).add(mb.multiplyScalar(p));
    } else {
        if(flyingEnable) {
            calcPosition(pos, dt);
        } else {
            // pos.set(0, 0, RADIUS);
            keys();
            move(obj, dt);
            //obj.update(dt);
        }
    }
    
    //camera.lookAtCoord(0,0,0);
}

var last = Date.now(), timeCost = 1, audioMult = 4, arrChoose = 1,
    fractalDelay = 0.15, fractalLast = Date.now();

function main() {
    requestAnimationFrame(main);

    let dt = (Date.now() - last) * timeCost / 1000;
    last = Date.now();

    if(pCount < maxCount-7)
        for(let i=0,
            l = Math.min(5e5,
                Math.trunc(
                    //(last-fractalLast) / fractalDelay * Math.exp(1+32*pCount/maxCount)+1
                    1 + Math.pow(400 * pCount / maxCount / fractalDelay, 1.63)
                    )
            );
            i < l; ++i) {
            fractalLast = last;
            makeFractalPoint();
        }

    dt = dt > 0.03 ? 0.017 : dt;

    //console.log(dt);

    changeObjPos(camera, dt);
    //keys();
    //move(camera, dt);
    camera.lookAtCoord(0,0,0);
    changePositions(actx.currentMainData[1], arrChoose);
    toBuf(dt);
    draw();
    
    bind.animate();
}