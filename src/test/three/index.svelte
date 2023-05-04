<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import { GKM } from "../../libs/gui/gkm";
    import { Vector2 } from "../../libs/math/Vector2";
    import { Vector3 } from "../../libs/math/Vector3";

    // @ts-ignore
    import type * as THREET from '@types/three';
    import * as THREES from 'three';

    const THREE = <typeof THREET> THREES;

    const state = {
        isDestroyed: false,
        isPause: false,
        isMenu: false,
        // hoveredElement: <HTMLElement> null,
        program: <WebGLProgram> null,
        attributes: {
            positions: <number> null,
        },
        uniforms: {
            buffer: <WebGLBuffer> null,
            textures: <WebGLBuffer> null,
        },
        resolution: new Vector3(1, 1, 0.5),
        acceleration: 1, // Infinity, // 1e6,
        accelerationBoost: 10,
        time: 0,
        timeMultiplier: 1,
        hovered: {
            object: null,
            distance: Infinity,
        },
    };

    const gkm = new GKM<
        'moveFront' | 'moveBack' | 'moveLeft' | 'moveRight' |
        'moveUp' | 'moveDown' |
        'moveFast' | 'moveStop' |
        'zoomIn' | 'zoomOut' |
        'pause' | 'menu' | 'reset' |
        'viewZ+' | 'viewZ-' |
        'fire' | 'aim',
        'viewX' | 'viewY' | 'zoom'
    >({
        keysBindings: {
            KeyW: 'moveFront', GAMEPAD_TRIGGER_RIGHT: 'moveFront',
            KeyS: 'moveBack', GAMEPAD_TRIGGER_LEFT: 'moveBack',
            KeyA: 'moveLeft',
            KeyD: 'moveRight',
            ShiftLeft: 'moveDown',
            Space: 'moveUp',
            KeyX: 'moveFast', GAMEPAD_A: 'moveFast',
            ArrowUp: 'zoomIn', GAMEPAD_UP: 'zoomIn',
            ArrowDown: 'zoomOut', GAMEPAD_DOWN: 'zoomOut',
            ArrowLeft: 'viewZ-',
            ArrowRight: 'viewZ+',
            Escape: 'menu',
            KeyP: 'pause', GAMEPAD_GUIDE: 'pause',
            KeyR: 'reset', GAMEPAD_START: 'reset',
            KeyQ: 'moveStop',
            MOUSE_LEFT: 'fire', MOUSE_RIGHT: 'aim',
        },
        axesBindings: {
            MOUSE_MOVEMENT_X: 'viewX',
            MOUSE_MOVEMENT_Y: 'viewY',
            GAMEPAD_STICK_LEFT_X: 'viewX',
            GAMEPAD_STICK_LEFT_Y: 'viewY',
            MOUSE_WHEEL_Y: 'zoom',
        },
    });

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

    const renderer = new THREE.WebGLRenderer();
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( renderer.domElement );

    const group = new THREE.Group();
    scene.add(group);

    camera.position.z = 5;

    function addCube() {
        const geometry = new THREE.BoxGeometry( 1, 1, 1 );
        const material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
        const cube = new THREE.Mesh( geometry, material );

        group.add( cube );

        return cube;
    }

    const cube = addCube();

    state['three'] = {
        scene,
        camera,
        renderer,
        group,
        cube,
        THREE,
        addCube,
    };

    function draw() {
        // console.log('draw');
        if (state.isDestroyed) {
            return;
        }

        requestAnimationFrame(draw);

        if (state.isPause) {
            return;
        }

        // cube.rotation.x += 0.01;
        cube.rotation.y += 0.01;
        // cube.rotation.z += 0.01;

        camera.lookAt(cube.position);

        renderer.render( scene, camera );
    };

    onMount(async () => {
        gkm.init(document.body);

        globalThis['state'] = state;
        globalThis['gkm'] = gkm;

        draw();
    });

    onDestroy(() => {
        state.isDestroyed = true;
        gkm.destroy();
        document.body.removeChild(renderer.domElement);
    });
</script>

<svelte:body on:click={e => {
    document.body.requestPointerLock();
}}></svelte:body>

<style>
    canvas {
        background: black;
        width: 100vw;
        height: 100vh;
    }
</style>
