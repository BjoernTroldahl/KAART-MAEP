import * as THREE from "three";
import { OrbitControls } from "jsm/controls/OrbitControls.js";
import { FBXLoader } from "jsm/loaders/FBXLoader.js";
import { Pathfinding, PathfindingHelper } from "three-pathfinding";

// SCENE
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xa8def0);

// CAMERA
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 20000);
camera.position.set(0, 700, 300);

// RENDERER
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
//document.body.appendChild(renderer.domElement);
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
controls.maxPolarAngle = Math.PI / 2; // allow view up to horizontal
controls.minPolarAngle = 0; // allow exact top-down view

// Store initial camera position for reset
const initialCameraPosition = {
    position: new THREE.Vector3(0, 700, 300),
    target: new THREE.Vector3(0, 0, 0)
};

// Add reset camera function
document.getElementById('resetCamera').addEventListener('click', () => {
    camera.position.copy(initialCameraPosition.position);
    controls.target.copy(initialCameraPosition.target);
    controls.update();
    navmesh.visible = false;
    agentGroup2.visible = false;

});

controls.update();

// LIGHTS
// Soft ambient light
const aLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(aLight);

// Main directional light
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

// RESIZE HANDLER
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    //renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', onWindowResize);

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
agentGroup1.position.set(0, 0, 250);
scene.add(agentGroup1);

// AGENT 2
const agentHeight2 = 40.0;
const agentRadius2 = 20.0;
const agent2 = new THREE.Mesh(
    new THREE.CylinderGeometry(agentRadius2, agentRadius2, agentHeight2), 
    new THREE.MeshPhongMaterial({ color: 'red' })
);
agent2.position.set(0, -27, 0); // Approximately at the navmesh height
const agentGroup2 = new THREE.Group();
agentGroup2.add(agent2);
agentGroup2.position.set(0, 0, 0);
agentGroup2.visible = false; // Set agent2 invisible initially
scene.add(agentGroup2);

// INITIALIZE THREE-PATHFINDING
const pathfinding = new Pathfinding();
const pathfindingHelper = new PathfindingHelper();
scene.add(pathfindingHelper);
const ZONE = 'museum';
const SPEED = 200; // Adjusted for the scale of FBX models
let navmesh;
let groupID;
let navpath;

// RAYCASTING
const raycaster = new THREE.Raycaster();
const clickMouse = new THREE.Vector2();

function intersect(pos) {
    raycaster.setFromCamera(pos, camera);
    return raycaster.intersectObjects(scene.children);
}

// Button controls for visibility
document.getElementById('button1').addEventListener('click', () => {
    if (navmesh) {
        navmesh.visible = true;
        agentGroup2.visible = false; // Hide agent2 when navmesh becomes visible
    }
});

document.getElementById('button2').addEventListener('click', () => {
    if (navmesh) {
        navmesh.visible = false;
        agentGroup2.visible = true;
    }
});

// Keep the click event listener for pathfinding, but simplified
window.addEventListener('click', event => {
    clickMouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    clickMouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
    const found = intersect(clickMouse);
    if (found.length > 0) {
        let target = found[0].point;
        const agentpos = agentGroup1.position.clone();
        
        // Only proceed with pathfinding if navmesh is visible
        if (navmesh && navmesh.visible) {
            try {
                groupID = pathfinding.getGroup(ZONE, agentpos);
                
                // Find closest node to agent
                const closest = pathfinding.getClosestNode(agentpos, ZONE, groupID);
                
                navpath = pathfinding.findPath(closest.centroid, target, ZONE, groupID);
                
                if (navpath) {
                    pathfindingHelper.reset();
                    pathfindingHelper.setPlayerPosition(agentpos);
                    pathfindingHelper.setTargetPosition(target);
                    pathfindingHelper.setPath(navpath);
                }
            } catch (error) {
                console.error("Pathfinding error:", error);
            }
        }
    }
});

// MOVEMENT ALONG PATH
function move(delta) {
    if (!navpath || navpath.length <= 0) return;

    let targetPosition = navpath[0];
    const distance = targetPosition.clone().sub(agentGroup.position);

    if (distance.lengthSq() > 0.05 * 0.05) {
        distance.normalize();
        // Move player to target
        agentGroup.position.add(distance.multiplyScalar(delta * SPEED));
    } else {
        // Remove node from the path we calculated
        navpath.shift();
    }
}

// Load models
const fbxloader = new FBXLoader();

// Load navmesh first
fbxloader.load('1.fbx', (object) => {
    console.log("Navmesh loaded:", object);
    object.traverse((node) => {
        if (!navmesh && node.isMesh) {
            navmesh = node;
            // Hide navmesh initially
            navmesh.visible = false;
            console.log("Found navmesh mesh:", navmesh);
            
            // Apply same material style with yellow color
            navmesh.material = new THREE.MeshLambertMaterial({
                color: 0xffff00,  // Bright yellow
                flatShading: true,
                side: THREE.DoubleSide
            });
            navmesh.castShadow = true;
            navmesh.receiveShadow = true;
            
            try {
                const zoneData = Pathfinding.createZone(navmesh.geometry);
                console.log("Zone data created:", zoneData);
                
                pathfinding.setZoneData(ZONE, zoneData);
                console.log("Zone data set successfully");
                
                // Try to verify zone data
                const testPos = new THREE.Vector3(0, 0, 0);
                const testGroup = pathfinding.getGroup(ZONE, testPos, true);
                console.log("Available groups:", testGroup);
            } catch (error) {
                console.error("Error creating zone data:", error);
            }
        }
    });
    scene.add(object); // Add navmesh to scene here

    // Load main model after navmesh
    fbxloader.load('museum.fbx', (object) => {
        console.log("Main model loaded");
        object.traverse((child) => {
            if (child.isMesh) {
                // Replace material with non-reflective material
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
});

// GAMELOOP
const clock = new THREE.Clock();
function animate() {
    requestAnimationFrame(animate);
    
    const delta = clock.getDelta();
    move(delta);
    
    controls.update();
    renderer.render(scene, camera);
}

animate();