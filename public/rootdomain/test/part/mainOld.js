// three.js animataed line using BufferGeometry

var renderer, scene, camera;

var line;
var MAX_POINTS = 2 << 15;
var drawCount;
var splineArray= [];

window.onload = () => {
    init();
    animate();
};

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
	var positions = new Float32Array( MAX_POINTS * 3 ); // 3 vertices per point
	geometry.addAttribute( 'position', new THREE.BufferAttribute( positions, 3 ) );

	// drawcalls
	drawCount = 2; // draw the first 2 points, only
	geometry.setDrawRange( 0, drawCount );

	// material
	var material = new THREE.LineBasicMaterial( { color: 0x00ffff, linewidth: 50 } );

	// line
	line = new THREE.Line( geometry,  material );
	scene.add( line );

	// update positions
	updatePositions();
    
    document.addEventListener('mousedown', onMouseDown, false);
}

// update positions
function updatePositions() {

	var positions = line.geometry.attributes.position.array;

	var index = 0;
  
		for ( var i = 0; i < splineArray.length;  i ++ ) {

		positions[ index ++ ] = splineArray[i].x;
		positions[ index ++ ] = splineArray[i].y;
		positions[ index ++ ] = splineArray[i].z;


        }
}

// render
function render() {
	//camera.position.z = (camera.position.z + 1) % 101;
	renderer.render( scene, camera );
}

  function onMouseMove(evt) {
        if(renderer) {
       
 				 var x = ( event.clientX / window.innerWidth ) * 2 - 1;
  				var y =  - ( event.clientY / window.innerHeight ) * 2 + 1;
            var vNow = new THREE.Vector3(x, y, 0);

          vNow.unproject(camera);
        	splineArray.push(vNow);
            
        }
    }
    function onMouseUp(evt) {
          document.removeEventListener("mousemove",onMouseMove,false);
    }

    function onMouseDown(evt) {
               
        if(evt.which == 3) return;
    

    var x = ( event.clientX / window.innerWidth ) * 2 - 1;
  	var y =  - ( event.clientY / window.innerHeight ) * 2 + 1;
    
        // do not register if right mouse button is pressed.
        
        var vNow = new THREE.Vector3(x, y, 0);
       vNow.unproject(camera);
      console.log(vNow.x + " " + vNow.y+  " " + vNow.z); 
      splineArray.push(vNow);
        
       	document.addEventListener("mousemove",onMouseMove,false);
        document.addEventListener("mouseup",onMouseUp,false);
    }
// animate
function animate() {

	requestAnimationFrame( animate );

	drawCount = splineArray.length;

	line.geometry.setDrawRange( 0, drawCount );

	updatePositions();

	line.geometry.attributes.position.needsUpdate = true; // required after the first render

	

	render();

}
