// three.js animataed line using BufferGeometry

var renderer, scene, camera;

var line, positions;
var MAX_POINTS = 2 << 15;
var drawCount;

window.onload = () => {
    init();
    makeCircles(forMaking, 7, 50,5e3);
    animate();
};

function makeSpiral(fn, loops, dr, dd = 14e3, startAngle = Math.max(1, -1000 / dr)) {
    const end = loops * 2 * Math.PI;
    let a = startAngle;

    dr /= 6.5;

    dd *= 1.04;
    a += dd / Math.abs(a * dr);

    for(let r = a * dr; a < end; r = Math.abs(a * dr), a += dd / r)
        fn(a, r);
}

function makeCircles(fn, loops, dr, dd) {
    dd *= 10 * 0.000002557;

    for(let i = 1, r = dr * i, dj = dd * Math.PI / i;
            i<loops; ++i,
            r = dr * i, dj = dd * Math.PI  / i)
        for(let j=0; j<2 * Math.PI; j+=dj)
            fn(j, r);
}

function forMaking(a, r) {
	positions[3 * drawCount] = r * Math.cos(a);
	positions[3 * drawCount + 1] = r * Math.sin(a);
    positions[3 * drawCount + 2] = 0;
    
	++drawCount;
}

function init() {
	// renderer
	renderer = new THREE.WebGLRenderer();
	
	renderer.setSize( window.innerWidth, window.innerHeight );
	document.body.appendChild( renderer.domElement );

	// scene
	scene = new THREE.Scene();

	// camera
	camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 10000 );
	camera.position.set( 0, 0, 1000 );

	// geometry
	var geometry = new THREE.BufferGeometry();

	// attributes
	positions = new Float32Array( MAX_POINTS * 3 ); // 3 vertices per point
	geometry.addAttribute( 'position', new THREE.BufferAttribute( positions, 3 ) );

	// drawcalls
	drawCount = 2; // draw the first 2 points, only
	geometry.setDrawRange( 0, drawCount );

	// material
	var material = new THREE.LineBasicMaterial( { color: 0x00ffff, linewidth: 50 } );

	// line
	line = new THREE.Line( geometry,  material );
	scene.add( line );
}

// render
function render() {
	//camera.position.z = (camera.position.z + 1) % 101;
	renderer.render( scene, camera );
}

// animate
function animate() {
	requestAnimationFrame( animate );

	line.geometry.setDrawRange( 0, drawCount );

    line.geometry.attributes.position.needsUpdate = true; // required after the first render
    
	render();
}
