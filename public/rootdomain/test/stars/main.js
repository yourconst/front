var renderer, camera, imgData;
var maxCount = 80e3/* 1 << 16 */, coordinates = new Int32Array(3 * maxCount), pCount = 0,
    buffer = new Uint16Array(2 * maxCount), sCount = 0;
var velocities = new Int16Array(3 * maxCount), planets = [];
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

    for (let i = 0; i < maxCount; ++i) {
        let a = 2 * Math.PI * Math.random(), b = 2 * Math.PI * Math.random();
        //velocities[3 * i+1] = 0;
        makePoint(
            sz * Math.sin(a) * Math.cos(b),
            sz * Math.sin(a) * Math.sin(b),
            sz * Math.cos(a)
        );
        //makePoint(hsz + sz * Math.random(), hsz + sz * Math.random(), hsz + sz * Math.random());
    }
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

        planets.push(
            //new Body(6000, 5e10, new Point3(0, 0, 0))
            new Body(6000, 2e10, new Point3(-71000, 0, 0))//,
            /* new Body(4000, 7e9, new Point3(25000, 0, 0)),
            new Body(6000, 2e10, new Point3(71000, 25000, 0)),
            new Body(3000, 5e10, new Point3(-15000, 0, 0)),
            new Body(1150, 1e10, new Point3(0, 0, 15000)) */
        );

        //planets[0].makeSatellite(planets[1], {r: 3000});
        //planets[0].makeSatellite(planets[2], {r: 15000});
        //planets[1].makeSatellite(planets[2], {r: 4000});
        //planets[2].makeSatellite(planets[0], {r: 5000, dir: -1});
        //planets[2].position.y = 7000;
        makeCenter(new Point3, planets);

        actx = new ACTX;
        actx.onchange = event => ACTime.max = actx.duration;
        actx.monoAnalysing = true;
        actx.mainDataSize = 0;
        bind = new Bind;

        //timeCost = 0.01;

        main();
};

function makeCenter(p = new Point3, arr) {
    let sm = 0,
        cp = new Point3, cv = new Point3;

    for(let i=0; i<arr.length; ++i)
        sm += arr[i].m;

        
    for(let i=0; i<arr.length; ++i) {
        let o = arr[i];

        cp.addMultiplyScalar(o.position, o.m / sm);
        cv.addMultiplyScalar(o.velocity, o.m / sm);
    }

    p.sub(cp);
    
    for(let i=0; i<arr.length; ++i) {
        let o = arr[i];

        o.position.sub(cp);
        o.velocity.sub(cv);
    }
}

function planetsMovement(dt) {
    let G = 6.67430e-11;

    for(let i=0, pi; i < planets.length; ++i) {
        pi = planets[i];

        for(let j=i+1, pj, r, M, V; j < planets.length; ++j) {
            pj = planets[j];

            let pos = new Point3().copy(pi.position).sub(pj.position),
                max = 1 * Math.pow(Math.max(pi.m, pj.m), 1.29);

            r = pos.mod();

            M = Math.min(1e7, G * pj.m * pi.m / Math.pow(r, 3)) +
                2e9 / pi.r * Math.min(0, r - pi.r - pj.r);
            //V = -3e4 / pi.r * Math.min(0, r - pi.r - pj.r);
            pi.acceleration.addMultiplyScalar(pos, -M * pj.m / max);
            pj.acceleration.addMultiplyScalar(pos, M * pi.m / max);

            //pi.velocity.addMultiplyScalar(pos, -V * pj.m / max);
            //pj.velocity.addMultiplyScalar(pos, V * pi.m / max);


        }

        pi.update(dt);
    }
}

function toBuf(dt) {
    let cp = camera.position,
        cpx = cp.x, cpy = cp.y, cpz = cp.z,
        aX = camera.rotation.x, aY = camera.rotation.y, aZ = camera.rotation.z,
        sinX = Math.sin(aX), cosX = Math.cos(aX),
        sinY = Math.sin(aY), cosY = Math.cos(aY),
        sinZ = Math.sin(aZ), cosZ = Math.cos(aZ),
        x, y, z, xr, yr, zr;

    let px, py, pz, vx, vy, vz, ax, ay, az,
        m = 1, M, V, r, R, G = 6.67430e-11,
        v = velocities,
        dt2 = Math.pow(dt, 2) / 2;

    let p = coordinates, b = buffer, fov = camera.fov;
    let plen = coordinates.length, l = 0; // sCount
    let w = renderer.width, h = renderer.height,
        hw = renderer.hWidth, hh = renderer.hHeight;
    for (let i = 0; i < plen; ++i) {
        px = p[i];      vx = v[i];      ax = 0;
        py = p[++i];    vy = v[i];      ay = 0;
        pz = p[++i];    vz = v[i];      az = 0;

        let visible = true,
            x2 = px - cpx,
            y2 = py - cpy,
            z2 = pz - cpz,
            a = Math.pow(x2, 2) + Math.pow(y2, 2) + Math.pow(z2, 2);


         for(let pl of planets) {
            let p = pl.position;

            R = pl.r;

            x = px - p.x;
            y = py - p.y;
            z = pz - p.z;

            r = x*x+y*y+z*z;

            let b = 2 * ( x * x2 + y * y2 + z * z2),
                c = r - Math.pow(0.9 * R /*  - 155 */, 2);
                
            visible = visible && !(b<0 ? c<0 : (-b<2*a ? 4*a*c-b*b<0 : a+b+c<0));

            r = Math.sqrt(r);

            /* M = -G * pl.m / (1 * Math.pow(r, 3)) * Math.sign(Math.max(0, r - R));

            V = -Math.min(1e3, Math.pow(Math.max(0, R - r + 1), 14.63))
                * Math.sign(Math.min(0, r - R)) / (1e9 * Math.pow(r, 3));

            vx += V * x;
            vy += V * y;
            vz += V * z; */

                
            M = -Math.min(1e3, G * pl.m / Math.pow(r, 3)) -
                2e3 / R * Math.min(0, r - R);

            ax += M * x;
            ay += M * y;
            az += M * z;
        }
        
        vx += dt * ax;
        vy += dt * ay;
        vz += dt * az;

        px += dt * vx + ax * dt2;
        py += dt * vy + ay * dt2;
        pz += dt * vz + az * dt2;

        i-=2;

        p[i] = px;      v[i] = vx;
        p[++i] = py;    v[i] = vy;
        p[++i] = pz;    v[i] = vz;

/*         x = px - cpx;
        y = py - cpy;
        z = pz - cpz; */

        xr = x2 * cosX - z2 * sinX;
        zr = x2 * sinX + z2 * cosX;
        yr = y2 * cosY - zr * sinY;
        zr = y2 * sinY + zr * cosY;
        x2 = xr * cosZ - yr * sinZ;
        yr = xr * sinZ + yr * cosZ;

        xr = x2;
        
        x = hw + xr * fov / zr;
        y = hh + yr * fov / zr;

        //x = hw + x2 * fov / z2;
        //y = hh + y2 * fov / z2;

        b[l] = x;
        b[++l] = y;

        l += visible && zr > 0 && x > 0 && x < w && y > 0 && y < h ? 1 : -1;
    }

    sCount = l;

    //console.log(k, dt);
}

function toBuf2(dt) {
    let cp = camera.position,
        cpx = cp.x, cpy = cp.y, cpz = cp.z,
        aX = camera.rotation.x, aY = camera.rotation.y, aZ = camera.rotation.z,
        sinX = Math.sin(aX), cosX = Math.cos(aX),
        sinY = Math.sin(aY), cosY = Math.cos(aY),
        sinZ = Math.sin(aZ), cosZ = Math.cos(aZ),
        x, y, z, xr, yr, zr;

    let px, py, pz, vx, vy, vz, ax, ay, az,
        m = 1, M, r, R, G = 6.67430e-11,
        v = velocities,
        dt2 = Math.pow(dt, 2) / 2;

    let p = coordinates, buf = buffer, fov = camera.fov;
    let plen = coordinates.length, l = 0; // sCount
    let w = renderer.width, h = renderer.height,
        hw = renderer.hWidth, hh = renderer.hHeight;

    let r0 = planets[0].r, r1 = planets[1].r, r2 = planets[2].r,
        m0 = planets[0].m, m1 = planets[1].m, m2 = planets[2].m,
        ps0 = planets[0].position, ps1 = planets[1].position, ps2 = planets[2].position,
        p0x = ps0.x, p0y = ps0.y, p0z = ps0.z,
        p1x = ps1.x, p1y = ps1.y, p1z = ps1.z,
        p2x = ps2.x, p2y = ps2.y, p2z = ps2.z;

/*     console.log(r0,r1,r2);
    console.log(m0,m1,m2);
    console.log(p0x,p0y,p0z);
    console.log(p1x,p1y,p1z);
    console.log(p2x,p2y,p2z); */

    for (let i = 0; i < plen; ++i) {
        px = p[i];      vx = v[i];  ax = 0;
        py = p[++i];    vy = v[i];  ay = 0;
        pz = p[++i];    vz = v[i];  az = 0;

        let visible = true,
            x2 = px - cpx,
            y2 = py - cpy,
            z2 = pz - cpz,
            a = Math.pow(x2, 2) + Math.pow(y2, 2) + Math.pow(z2, 2),
            b, c;


        for(let pl of planets) {
            let p = pl.position;

            R = pl.r;

            x = px - p.x;
            y = py - p.y;
            z = pz - p.z;

            r = x*x+y*y+z*z;

            b = 2 * ( x * x2 + y * y2 + z * z2);
            c = r - Math.pow(0.97 * R, 2);
                
            visible = visible && !(b<0 ? c<0 : (-b<2*a ? 4*a*c-b*b<0 : a+b+c<0));

            r = Math.sqrt(r);

            M = Math.min(1e3, G * m * pl.m / Math.pow(r, 3)) +
                2e3 / R * Math.min(0, r - R);

            ax -= M * x;
            ay -= M * y;
            az -= M * z;
        }

        
        vx += dt * ax;
        vy += dt * ay;
        vz += dt * az;

        px += dt * vx + ax * dt2;
        py += dt * vy + ay * dt2;
        pz += dt * vz + az * dt2;

        i-=2;

        p[i] = px;      v[i] = vx;
        p[++i] = py;    v[i] = vy;
        p[++i] = pz;    v[i] = vz;

/*         x = px - cpx;
        y = py - cpy;
        z = pz - cpz; */

        xr = x2 * cosX - z2 * sinX;
        zr = x2 * sinX + z2 * cosX;
        yr = y2 * cosY - zr * sinY;
        zr = y2 * sinY + zr * cosY;
        x2 = xr * cosZ - yr * sinZ;
        yr = xr * sinZ + yr * cosZ;

        xr = x2;
        
        x = hw + xr * fov / zr;
        y = hh + yr * fov / zr;

        //x = hw + x2 * fov / z2;
        //y = hh + y2 * fov / z2;

        buf[l] = x;
        buf[++l] = y;

        l += visible && zr > 0 && x > 0 && x < w && y > 0 && y < h ? 1 : -1;
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

function changePositions(aData) {
    let len = coordinates.length / 3,
        adl = aData.length, amlt = audioMult;

    for (let i = 0; i < len; ++i) {
        coordinates[3 * i + 2] = amlt * aData[i % adl];
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
    lastPosition = new Point3(0,0,RADIUS),
    flyAnim = new Animation(1);

function calcAnimDuration() {
    let d = camera.position.distanceTo(lastPosition);
    flyAnim.transition = d * 0.0001 * (0.2 + Math.sqrt(2 / flyingSpeed));
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

function changeObjPos(obj, dt) {
    let p = flyAnim.getCurrentState(), pos = obj.position;
    
    if(flyAnim.animate && flyAnim.getPercent() < 0.339) {
        pos.add(new Point3().copy(lastPosition).sub(pos).multiplyScalar(p));
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

var last = Date.now(), timeCost = 1, audioMult = 4;

function main() {
    requestAnimationFrame(main);

    let dt = (Date.now() - last) * timeCost / 1000,
        curSZ = 16 << actx.mainDataSize;
    last = Date.now();

    dt = dt > 0.03 ? 0.017 : dt;

    //console.log(dt);

    changeObjPos(camera, dt);
    //keys();
    //move(camera, dt);
    camera.lookAtCoord(0,0,0);
    //camera.lookAt(planets[0].position);

    planets[0].radius = 6000 + audioMult * (actx.currentMainData[1][curSZ-1] - 128);
    //planets[0].radius = 6000 + audioMult * actx.currentMainData[1][4];
    //changePositions(actx.currentMainData[1]);
    planetsMovement(dt);
    toBuf(dt);
    draw();
    
    bind.animate();

    delete data;
}