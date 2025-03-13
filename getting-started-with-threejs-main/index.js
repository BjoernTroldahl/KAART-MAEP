import * as THREE from "three";
import { OrbitControls } from "jsm/controls/OrbitControls.js";
import { FBXLoader } from "jsm/loaders/FBXLoader.js";

// SCENE
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffffff);

// CAMERA
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 3000);
camera.position.set(0, 1000, 0); // Changed from 1000 to 500 to be closer to museum

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
controls.enablePan = false; // Disable panning
controls.enableRotate = false; // Disable rotation
controls.enableZoom = false; // Disable zoom

// Store initial camera position for reset
const initialCameraPosition = {
    position: new THREE.Vector3(0, 1000, 0), // Changed from 2000 to 500
    target: new THREE.Vector3(0, 0, 0)
};

// Variables for models
let models = new Array(26).fill(null);

// LIGHTS
// Increase ambient light slightly
const aLight = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(aLight);

// Main directional light for sharp shadows
const dLight = new THREE.DirectionalLight(0xffffff, 1.0); // Increased intensity
dLight.position.set(0, 1000, 0); // Moved directly above for top-down shadows
dLight.castShadow = true;
dLight.shadow.mapSize.width = 4096;
dLight.shadow.mapSize.height = 4096;
dLight.shadow.camera.near = 1;
dLight.shadow.camera.far = 2000;
const d = 1000;
dLight.shadow.camera.left = -d;
dLight.shadow.camera.right = d;
dLight.shadow.camera.top = d;
dLight.shadow.camera.bottom = -d;
dLight.shadow.bias = -0.001; // Reduce shadow artifacts
scene.add(dLight);

// Add secondary directional light for softer shadows
const dLight2 = new THREE.DirectionalLight(0xffffff, 0.3);
dLight2.position.set(500, 800, 500);
scene.add(dLight2);

// AGENT 1
const agentHeight1 = 15.0;
const agentRadius1 = 8.0;
const agent1 = new THREE.Mesh(
    new THREE.CylinderGeometry(agentRadius1, agentRadius1, agentHeight1), 
    new THREE.MeshPhongMaterial({ color: 'green' })
);
agent1.position.set(0, 0, 0); // Approximately at the navmesh height
const agentGroup1 = new THREE.Group();
agentGroup1.add(agent1);
agentGroup1.position.set(0, 0, 250);
scene.add(agentGroup1);

// Load models
const fbxloader = new FBXLoader();

// Load all models
for (let i = 1; i <= 26; i++) {
    fbxloader.load(`${i}.fbx`, (object) => {
        models[i-1] = object;
        object.traverse((child) => {
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
        object.visible = false;
        scene.add(object);
    });
}

// Load museum model
fbxloader.load('museum.fbx', (object) => {
    object.traverse((child) => {
        if (child.isMesh) {
            child.material = new THREE.MeshLambertMaterial({
                color: 0x242c5c,
                flatShading: true,
                side: THREE.DoubleSide
            });
            child.castShadow = true;
            child.receiveShadow = true;
        }
    });
    scene.add(object);
});

// Button controls for visibility and camera movement
for (let i = 1; i <= 26; i++) {
    document.getElementById(`button${i}`).addEventListener('click', () => {
        if (models[i-1]) {
            // Hide all models first
            models.forEach(model => {
                if (model) model.visible = false;
            });
            // Show only the selected model
            models[i-1].visible = true;

            // Get the position of the selected model
            const boundingBox = new THREE.Box3().setFromObject(models[i-1]);
            const center = boundingBox.getCenter(new THREE.Vector3());

            // Calculate camera position above the model
            const newCameraPosition = new THREE.Vector3(
                center.x,
                700, // Fixed height for top-down view
                center.z
            );

            // Animate camera movement
            const duration = 1; // 1 second
            const startPosition = camera.position.clone();
            const startTime = Date.now();

            function animateCamera() {
                const now = Date.now();
                const progress = Math.min((now - startTime) / duration, 1);
                
                // Use easing function for smooth movement
                const easeProgress = progress * (2 - progress);

                // Interpolate camera position
                camera.position.lerpVectors(startPosition, newCameraPosition, easeProgress);
                
                // Update controls target
                controls.target.lerp(center, easeProgress);
                controls.update();

                if (progress < 1) {
                    requestAnimationFrame(animateCamera);
                }
            }

            animateCamera();
        }
    });
}

// Event listeners for menu control
document.getElementById('BIG1').addEventListener('click', showSection1);
document.getElementById('return1').addEventListener('click', showMainMenu);

document.getElementById('BIG2').addEventListener('click', showSection2);
document.getElementById('return2').addEventListener('click', showMainMenu);

document.getElementById('BIG3').addEventListener('click', showSection3);
document.getElementById('return3').addEventListener('click', showMainMenu);

document.getElementById('BIG4').addEventListener('click', showSection4);
document.getElementById('return4').addEventListener('click', showMainMenu);

document.getElementById('BIG5').addEventListener('click', showSection5);
document.getElementById('return5').addEventListener('click', showMainMenu);

function showSection1() {
    document.getElementById('mainMenu').classList.add('hidden');
    document.getElementById('section1').classList.add('active');
}

function showSection2() {
    document.getElementById('mainMenu').classList.add('hidden');
    document.getElementById('section2').classList.add('active');
}

function showSection3() {
    document.getElementById('mainMenu').classList.add('hidden');
    document.getElementById('section3').classList.add('active');
}

function showSection4() {
    document.getElementById('mainMenu').classList.add('hidden');
    document.getElementById('section4').classList.add('active');
}

function showSection5() {
    document.getElementById('mainMenu').classList.add('hidden');
    document.getElementById('section5').classList.add('active');
}

function showMainMenu() {
    // Remove active class from all sections
    document.querySelectorAll('.menu-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show main menu with slight delay
    setTimeout(() => {
        document.getElementById('mainMenu').classList.remove('hidden');
    }, 300); // Match this with CSS transition duration
}

// Reset camera function
document.getElementById('resetCamera').addEventListener('click', () => {
    camera.position.copy(initialCameraPosition.position);
    controls.target.copy(initialCameraPosition.target);
    controls.update();
    // Hide all models
    models.forEach(model => {
        if (model) model.visible = false;
    });
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