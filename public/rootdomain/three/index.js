const THREE = require("./three"),
    timer = new (require("../lib/time")),
    camera = new THREE.PerspectiveCamera(70,window.innerWidth/window.innerHeight,1,100000),
    person = new THREE.Object3D(),
    renderer = new THREE.WebGLRenderer(),
    scene = new THREE.Scene(),
    geometries = new Map,
    materials = new Map;

geometries.set("sphere", new THREE.SphereGeometry(1, 15, 15));
materials.set("gray", new THREE.MeshLambertMaterial({color:"#666666"}));
materials.set("lightgray", new THREE.MeshLambertMaterial({color:"#cccccc"}));
materials.set("orange", new THREE.MeshLambertMaterial({color:"#ffb343"}));


function createBall(x, y, z, r, dynamic = true, matname = "orange") {
    const mesh = new THREE.Mesh(geometries.get("sphere"), materials.get(matname));

    mesh.receiveShadow = true;
    mesh.castShadow = true;

    mesh.position.set(x, y, z);

    mesh.scale.multiplyScalar(r);

    mesh.updateMatrix();

    mesh.matrixAutoUpdate = dynamic;

    return mesh;
}

function createLight(x, y, z) {
    const light = new THREE.SpotLight(0xffffff);

    light.castShadow = true;
    light.shadow.mapSize.width = 0.5 * 1024;
    light.shadow.mapSize.height = 0.5 * 1024;
    light.shadow.camera.near = 1e1;
    light.shadow.camera.far = 2000;
    //light.angle = 1.075;

    light.position.set(x, y, z);
    //light.target.add(new THREE.Vector3(x, 0, z));
    light.target.position.set(x, 0, z);
    light.target.updateMatrixWorld();

    return light;
}

function createPlane(w, d = w, x = 0, z = 0) {
    const geometry = new THREE.PlaneGeometry(w, d, 32),
        material = new THREE.MeshPhongMaterial({ color: "white" }),
        mesh = new THREE.Mesh(geometry, material);

    mesh.receiveShadow = true;
    mesh.rotation.x = -Math.PI / 2;
    
    return mesh;
}


/////////////////////////////////////////////////////


function createBalls(cnt, r, h, br, dynamic = true) {
    for(let i=0; i<cnt; ++i) {
        const rbr = (br + Math.random() * br) / 2,
            ra = 2 * Math.PI * Math.random(),
            rr = r * Math.sqrt(Math.random()),
            rh = rbr + h * Math.random();
        scene.add(createBall(rr * Math.cos(ra), rh, rr * Math.sin(ra), rbr, dynamic));
    }
}


/////////////////////////////////////////////////////


function onCanvasMove(event) {
    person.rotation.y -= event.movementX / 100;
    camera.rotation.x -= event.movementY / 100;

    if (camera.rotation.x > Math.PI / 2)
        camera.rotation.x = Math.PI / 2;
    if (camera.rotation.x < -Math.PI / 2)
        camera.rotation.x = -Math.PI / 2;
}

function onWindowResize() {
    const e = renderer.domElement.parentElement,
        w = window.innerWidth || e.clientWidth,
        h = window.innerHeight || e.clientHeight;

    camera.aspect = w / h;
    camera.updateProjectionMatrix();

    renderer.setSize(w, h, false);
}

function init() {
    const C = renderer.domElement;

    document.body.appendChild(C);
    C.requestPointerLock = (C.mozRequestPointerLock || C.webkitRequestPointerLock || C.requestPointerLock);

    C.addEventListener("click", function (event) { C.requestPointerLock(); });
    C.addEventListener("mousemove", onCanvasMove);

    camera.position.z = 400;
    camera.position.y = 800;

    renderer.setPixelRatio(1);//window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    renderer.setClearColor("#ffffff");
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    window.addEventListener('resize', onWindowResize, false);

    person.add(camera);
    scene.add(person);

    scene.add(new THREE.AmbientLight( 0xffffff, 0.1 ));
    scene.add(createPlane(10000));
    scene.add(createLight(0, 1300, 0));
}

function main() {
    requestAnimationFrame(main);

    timer.update();

    renderer.render(scene, camera);
    scene.children.length = 100;
    createBalls(100, 2000, 300, 30);
}

global.createBall = createBall;
global.createPlane = createPlane;
global.createBalls = createBalls;
global.main = main;

global.renderer = renderer;
global.scene = scene;
global.timer = timer;
global.THREE = THREE;

window.onload = event => {
    init();
    createBalls(1000, 2000, 0, 30, false);
    main();
};