let actx = new ACTX,
    graph = new Graph,
    bind;
window.actx = actx;

var Animation = Bind.Animation;

/* var canvas = document.createElement("canvas"),
    ctx = canvas.getContext("2d"),
    BACKGROUND = "rgba(0,0,0,0.07)"; */

var renderer, scene, camera,
    nullVector = new THREE.Vector3(0,0,0);

var lines = [];

var multiplier = 1;

let freqCont = document.getElementById("freqCont"),
    btnAdd = document.getElementById("addBtn"),
    allFreq = document.getElementById("allFreq");

var filters = [];

allFreq.oninput = function() {
    let value = allFreq.checked;

    for(const f of filters)
        f.enabled = value;
};

function addFreq(cont = freqCont) {
    let filter = new FilterElement(actx, cont);

    filters.push(filter);

    filter.onchange = text => {
        if(text == "delete") {
            let l = filters.lastIndexOf(filter);

            if(l >= 0)
                filters.splice(l, 1);
        } else if(text == "enabled" && !filter.enabled) {
            allFreq.checked = false;
        }
    };

    return filter;
}

function init() {
    let size = 500;

    window.renderer = new THREE.WebGLRenderer(/* { alpha: true } */);
    window.clearColor = renderer.getClearColor();
	
    renderer.setSize( size, size );

	scene = new THREE.Scene();

	camera = new THREE.PerspectiveCamera( 45, 1 /*window.innerWidth / window.innerHeight */, 1, 10000 );
    camera.position.set( 0, 0, 1000 );
    
    // canvas.width = canvas.height = size;
    document.body.appendChild( renderer.domElement );
}

btnAdd.addEventListener("click", event => addFreq());

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

window.onload = () => {
    init();

    actx.update();

    actx.onchange = () => {
        currentTimeRange.max = actx.duration;
        currentTimeRange.value = actx.currentTime;
    }

    actx.ondurationchange = () => {
        currentTimeRange.title = currentTimeRange.value = actx.currentTime;

        if(!currentTimeRange.single.animation.animate)
            currentTimeRange.single.animation.target = currentTimeRange.value;
    };

    chanChange(monoBtn.checked);
    
    bind = new Bind;

    //alert(actx.ctx.baseLatency);
    graph.canvas.height = 100;
    graph.canvas.width = 300;
    waveFormCont.appendChild(graph.canvas);
    graph.updateRes();
    main();
};

function playChange() {
    if(actx.paused)
        actx.play();
    else
        actx.pause();
}

var loopsCount = 5, effectType = "circle",
    chanAnim = new Animation(1.3, "bezier"),
    chanAnim2 = new Animation(parseFloat(typeSelId.getAttribute("transition")), "bezier"),
    typeAnim = new Animation(chanAnim2.transition, "bezier");

function createLines(cnt) {
    for(let l of lines)
        l.destructor();

    lines.length = 0;

    actx.monoAnalysing = cnt == 1;
    //actx.channelsCount = cnt;

    for(let i=0; i<cnt; ++i)
        lines.push(new Line().addTo(scene));
}

function chanChange(value) {
    let cnt = 0;

    if(value && (lines.length != 1 || chanAnim.animate))
        cnt = 1;
    if(!value && (lines.length != actx.sourceChannelCount || chanAnim.animate))
        cnt = actx.sourceChannelCount;
        
    if(cnt > 1)
        createLines(cnt);

    if(cnt)
        chanAnim.begin(cnt);
}

var lastType = "circle";

chanAnim2.base = chanAnim2.target = 1;

function typeChange(type) {
    cntOfLoopsRow2.style.height = type != "circle" ? "" : "68px";
    cntOfLoopsRow.style.display = type == "circle" ? "none" : "";

    if(lastType != type) {
        if(lastType == "circle")
            chanAnim2.begin(lines.length, 1);
        else if(type == "circle") {
            chanAnim2.begin(1, lines.length);
        }
        
        lastType = type;
        typeAnim.begin(1, 0);

        for(let l of lines)
            l.copyPos();
    }

    let p = typeAnim.getCurrentState();
    //console.log(type, p);

    //console.log(p);
    
    for(let l of lines)
        l.percent = p;

    if(type == "circle")
        freqChange(actx.fCount, lines.length, chanAnim2.getCurrentState());
    else
        freqChange(actx.fCount, chanAnim2.getCurrentState(), 0);
}

function loopsChange(cnt) {
    //circlesAnim.begin(cnt);
    freqChange(actx.fCount);
}

function updateCamera() {
    camera.updateProjectionMatrix();
}

function freqChange(level, chnls = lines.length, dForC = 0) {
    let cnt = Math.trunc(16 * Math.pow(2, level)),
        R = 300,
        d = R * (chnls - 1);

    if(effectType == "m circle") {
        for(let i=0, l = chnls, dp = 2 * Math.PI / l, hp = 0.5 * Math.PI; i<lines.length; ++i) {
            let s = i % 2 ? -1 : 1, c = hp + s * Math.trunc(i / 2) * dp,
                a = c + s * dp / 2;
                
            lines[i].makeCurve(Figures.makeCircles, loopsCount, cnt, R, a + Math.PI);
            lines[i].line.position.x = d * Math.cos(a);
            lines[i].line.position.y = d * Math.sin(a);
        }
    } else if(effectType == "spiral") {
        for(let i=0, l = chnls, dp = 2 * Math.PI / l, hp = 0.5 * Math.PI; i<lines.length; ++i) {
            let s = i % 2 ? -1 : 1, c = hp + s * Math.trunc(i / 2) * dp,
                a = c + s * dp / 2;
                
            lines[i].makeCurve(Figures.makeSpiral, loopsCount, cnt, R, a + Math.PI);
            lines[i].line.position.x = d * Math.cos(a);
            lines[i].line.position.y = d * Math.sin(a);
        }
    } else if(effectType == "circle") {
        d = R * (dForC - 1);
        for(let i=0, l = chnls, dp = 2 * Math.PI / l, hp = 0.5 * Math.PI; i<lines.length; ++i) {
            let s = i % 2 ? -1 : 1, c = hp + s * Math.trunc(i / 2) * dp,
                a = c + s * dp / 2;
            
            lines[i].makeCurve(Figures.makeCircle, cnt, R, c, c + s * dp);
            lines[i].line.position.x = dForC ? d * Math.cos(a) : 0;
            lines[i].line.position.y = dForC ? d * Math.sin(a) : 0;
        }
    }
}

function Avr(m, num = 127, cnt = m.length, start = 0) {
    let res = 0;

    for(let i=0; i<cnt; ++i)
        res += Math.abs(m[start + i] - num);

    return res / cnt;
}

function Max(m, num = 127, cnt = m.length, start = 0) {
    let res = 0, tmp;

    for(let i=0; i<cnt; ++i) {
        tmp = Math.abs(m[start + i] - num);

        if(tmp > res)
            res = tmp;
    }

    return res;
}

function Beta(a) {
    //return 1.5 * a;

    let aa = Math.abs(a);
    return a + Math.pow(aa, 0.8) - Math.pow(aa, 0.6) - Math.pow(aa, 0.4) - Math.pow(aa, 0.2);
}

var RADIUS = 1000, ALPHA = 0.1, flyingSpeed = 1, flyingEnable = false,
    lastPosition = new THREE.Vector3(0,0,RADIUS),
    flyAnim = new Animation(1);

function calcAnimDuration() {
    let d = camera.position.distanceTo(lastPosition);
    flyAnim.transition = d * 0.004 * (0.2 + Math.sqrt(2 / flyingSpeed));
}
    
function flyChange() {
    if(flyingEnable) {
        let b = Beta(ALPHA);
        lastPosition.set(
            RADIUS * Math.cos(ALPHA),
            RADIUS * Math.sin(ALPHA) * Math.cos(b),
            RADIUS * Math.abs(Math.sin(b))
        );
        calcAnimDuration();
        flyAnim.begin(1, 0);
    } else {
        lastPosition.set(0,0,RADIUS);
        calcAnimDuration();
        flyAnim.begin(1, 0);
    }
}

function extra(dt) {
    if(!chanAnim.gotResultState) {
        let cc = chanAnim.getCurrentState();

        if(chanAnim.gotResultState && cc == 1)
            createLines(cc);

        freqChange(actx.fCount, cc);
    }

    let b = Beta(ALPHA), p, pos = camera.position;

    if(flyAnim.animate && (p = flyAnim.getCurrentState()) < 0.25) {
        pos.add(new THREE.Vector3().copy(lastPosition).sub(pos).multiplyScalar(p));
    } else {
        if(flyingEnable) {
            ALPHA += 0.0001 * 1 * flyingSpeed * dt;

            pos.set(
                RADIUS * Math.cos(ALPHA),
                RADIUS * Math.sin(ALPHA) * Math.cos(b),
                RADIUS * Math.abs(Math.sin(b))
            );
        } else {
            pos.set(0, 0, RADIUS);
        }
    }

    camera.lookAt(nullVector);
}

function project(data) {
    let m = multiplier;

    MATERIAL.uniforms.mult.value = m;

    for(let i=0; i<data.length; ++i) {
        let l = lines[i], p = l.positions, d = data[i];

        for(let j=0; j < d.length; ++j)
            p[3 * j + 2] = m * d[j];
        l.geometry.attributes.position.needsUpdate = true;
    }

/*     ctx.fillStyle = BACKGROUND;
    ctx.fillRect(0, 0, 500, 500);
    ctx.drawImage(renderer.domElement, 0, 0); */
}

let last = Date.now(), dt = 0;

function main() {
    requestAnimationFrame(main);
    //setTimeout(main, 0);

    dt = Date.now() - last;
    last = Date.now();

    bind.animate();
    extra(dt);

    project(actx.currentData);

    graph.draw(
        //actx._data.concat(actx.currentMainData)
        actx.currentMainData
    );
    
    renderer.render( scene, camera );
}