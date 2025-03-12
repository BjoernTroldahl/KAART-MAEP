import * as THREE from "three";
import { OrbitControls } from "jsm/controls/OrbitControls.js";
import { FBXLoader } from "jsm/loaders/FBXLoader.js";

// SCENE
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xa8def0);

// CAMERA
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 20000);
camera.position.set(0, 1000, 300);

// RENDERER
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
const container = document.getElementById("three-container");
container.appendChild(renderer.domElement);

// ORBIT CAMERA CONTROLS
const controls = new OrbitControls(camera, renderer.domElement);
controls.mouseButtons = {
    MIDDLE: THREE.MOUSE.ROTATE,
    RIGHT: THREE.MOUSE.PAN
};
controls.enableDamping = true;
controls.enablePan = true;
controls.minDistance = 200;
controls.maxDistance = 3000;
controls.maxPolarAngle = Math.PI / 2;
controls.minPolarAngle = 0;

// Store initial camera position for reset
const initialCameraPosition = {
    position: new THREE.Vector3(0, 1000, 300),
    target: new THREE.Vector3(0, 0, 0)
};

// Variables for models
let model1, model2, model3, model4, model5;

// LIGHTS
const aLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(aLight);

const dLight = new THREE.DirectionalLight(0xffffff, 0.5);
dLight.position.set(500, 800, 500);
dLight.castShadow = true;
dLight.shadow.mapSize.width = 4096;
dLight.shadow.mapSize.height = 4096;
const d = 1000;
dLight.shadow.camera.left = -d;
dLight.shadow.camera.right = d;
dLight.shadow.camera.top = d;
dLight.shadow.camera.bottom = -d;
scene.add(dLight);

// AGENT 1
const agentHeight1 = 15.0;
const agentRadius1 = 5.0;
const agent1 = new THREE.Mesh(
    new THREE.CylinderGeometry(agentRadius1, agentRadius1, agentHeight1), 
    new THREE.MeshPhongMaterial({ color: 'green' })
);
agent1.position.set(0, 0, 0); // Approximately at the navmesh height
const agentGroup1 = new THREE.Group();
agentGroup1.add(agent1);
agentGroup1.position.set(0, 0, 260);
scene.add(agentGroup1);

// Load models
const fbxloader = new FBXLoader();

// Load all models
fbxloader.load('1.fbx', (object) => {
    model1 = object;
    model1.traverse((child) => {
        if (child.isMesh) {
            child.material = new THREE.MeshLambertMaterial({
                color: 0xffff00,
                flatShading: true,
                side: THREE.DoubleSide
            });
            child.castShadow = true;
            child.receiveShadow = true;
        }
    });
    model1.visible = false;
    scene.add(model1);
});

fbxloader.load('2.fbx', (object) => {
    model2 = object;
    model2.traverse((child) => {
        if (child.isMesh) {
            child.material = new THREE.MeshLambertMaterial({
                color: 0xffff00,
                flatShading: true,
                side: THREE.DoubleSide
            });
            child.castShadow = true;
            child.receiveShadow = true;
        }
    });
    model2.visible = false;
    scene.add(model2);
});

fbxloader.load('3.fbx', (object) => {
    model3 = object;
    model3.traverse((child) => {
        if (child.isMesh) {
            child.material = new THREE.MeshLambertMaterial({
                color: 0xffff00,
                flatShading: true,
                side: THREE.DoubleSide
            });
            child.castShadow = true;
            child.receiveShadow = true;
        }
    });
    model3.visible = false;
    scene.add(model3);
});

fbxloader.load('4.fbx', (object) => {
    model4 = object;
    model4.traverse((child) => {
        if (child.isMesh) {
            child.material = new THREE.MeshLambertMaterial({
                color: 0xffff00,
                flatShading: true,
                side: THREE.DoubleSide
            });
            child.castShadow = true;
            child.receiveShadow = true;
        }
    });
    model4.visible = false;
    scene.add(model4);
});

fbxloader.load('5.fbx', (object) => {
    model5 = object;
    model5.traverse((child) => {
        if (child.isMesh) {
            child.material = new THREE.MeshLambertMaterial({
                color: 0xffff00,
                flatShading: true,
                side: THREE.DoubleSide
            });
            child.castShadow = true;
            child.receiveShadow = true;
        }
    });
    model5.visible = false;
    scene.add(model5);
});

// Load museum model
fbxloader.load('museum.fbx', (object) => {
    object.traverse((child) => {
        if (child.isMesh) {
            child.material = new THREE.MeshLambertMaterial({
                color: 0xfbc9c7,
                flatShading: true,
                side: THREE.DoubleSide
            });
            child.castShadow = true;
            child.receiveShadow = true;
        }
    });
    scene.add(object);
});

// Button controls for visibility
document.getElementById('button1').addEventListener('click', () => {
    if (model1) {
        model1.visible = true;
        model2.visible = false;
        model3.visible = false;
        model4.visible = false;
        model5.visible = false;
    }
});

document.getElementById('button2').addEventListener('click', () => {
    if (model2) {
        model1.visible = false;
        model2.visible = true;
        model3.visible = false;
        model4.visible = false;
        model5.visible = false;
    }
});

document.getElementById('button3').addEventListener('click', () => {
    if (model3) {
        model1.visible = false;
        model2.visible = false;
        model3.visible = true;
        model4.visible = false;
        model5.visible = false;
    }
});

document.getElementById('button4').addEventListener('click', () => {
    if (model4) {
        model1.visible = false;
        model2.visible = false;
        model3.visible = false;
        model4.visible = true;
        model5.visible = false;
    }
});

document.getElementById('button5').addEventListener('click', () => {
    if (model5) {
        model1.visible = false;
        model2.visible = false;
        model3.visible = false;
        model4.visible = false;
        model5.visible = true;
    }
});

// Reset camera function
document.getElementById('resetCamera').addEventListener('click', () => {
    camera.position.copy(initialCameraPosition.position);
    controls.target.copy(initialCameraPosition.target);
    controls.update();
    if (model1) model1.visible = false;
    if (model2) model2.visible = false;
    if (model3) model3.visible = false;
    if (model4) model4.visible = false;
    if (model5) model5.visible = false;
});

// RESIZE HANDLER
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', onWindowResize);

// ANIMATION LOOP
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

animate();