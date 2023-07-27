var ctx, canvas, video;
var renderer, scene, camera;
var points = [], pCount = 1 << 14;

function makePoint(x, y, z = 0) {
    let dotGeometry = new THREE.Geometry(),
        dotMaterial = new THREE.PointsMaterial( { size: 1, sizeAttenuation: false } ),
        dot;
        
    dotGeometry.vertices.push(new THREE.Vector3( x, y, z ));
    dot = new THREE.Points( dotGeometry, dotMaterial );
    scene.add( dot );
    points.push( dot );
}

function init() {
    let w = 500, h = 500, offset = 3, dx = canvas.width >> 1, dy = canvas.height >> 1;

	renderer = new THREE.WebGLRenderer();
    renderer.setSize( w, h );
    
	document.body.appendChild( renderer.domElement );

	scene = new THREE.Scene();

	camera = new THREE.PerspectiveCamera( 45, w / h, 1, 10000 );
    camera.position.set( 0, 0, 1000 );
    
    for(let j=0; j<canvas.height; ++j)
        for(let i=0; i<canvas.width; ++i) {
            makePoint(offset * (i - dx), offset * (dy - j));
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
    canvas = document.getElementById("canvas");
    video = document.getElementById("video");

    ctx = canvas.getContext("2d");

    //canvas.style.imageRendering = "pixelated";

    video.ondurationchange =
        event => setSize(canvas, pCount, video.videoWidth, video.videoHeight);

    video.ontimeupdate = event => draw(video);

    video.onloadeddata = event => {
        video.ondurationchange();
        init();
        main();

        video.onloadeddata = null;
    };

    video.src = "video.mp4";
};

function draw(src) {
    ctx.drawImage(src, 0, 0, canvas.width, canvas.height);
}

function project(data) {
    for(let i=0; i<points.length; ++i) {
        let p = points[i],
            c = p.material.color,
            g = p.geometry,
            ind = 4 * i;

        c.r = data[ind] / 255;
        c.g = data[++ind] / 255;
        c.b = data[++ind] / 255;

        g.vertices[0].z = data[ind];
        g.verticesNeedUpdate = true;
    }
}

function main() {
    requestAnimationFrame(main);

    if(!video.paused) {
        draw(video);
        project(ctx.getImageData(0,0,canvas.width,canvas.height).data);
    }

    renderer.render( scene, camera );
}