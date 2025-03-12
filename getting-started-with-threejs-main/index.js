import * as THREE from "three";
import { OrbitControls } from "jsm/controls/OrbitControls.js";
import { FBXLoader } from "jsm/loaders/FBXLoader.js";
import { Pathfinding, PathfindingHelper } from "three-pathfinding";

// SCENE
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xa8def0);

// CAMERA
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 20000);
camera.position.set(0, 500, 1000);

// RENDERER
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

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
controls.maxPolarAngle = Math.PI / 2 - 0.05; // prevent camera below ground
controls.minPolarAngle = Math.PI / 4;        // prevent top down view
controls.update();

// LIGHTS
const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1);
hemiLight.position.set(0, 200, 0);
scene.add(hemiLight);

const dLight = new THREE.DirectionalLight('white', 0.1);
dLight.position.x = 20;
dLight.position.y = 500;
dLight.castShadow = true;
dLight.shadow.mapSize.width = 4096;
dLight.shadow.mapSize.height = 4096;
const d = 1000;
dLight.shadow.camera.left = -d;
dLight.shadow.camera.right = d;
dLight.shadow.camera.top = d;
dLight.shadow.camera.bottom = -d;
scene.add(dLight);

const aLight = new THREE.AmbientLight('white', 0.1);
scene.add(aLight);

// RESIZE HANDLER
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', onWindowResize);

// AGENT
const agentHeight = 40.0;
const agentRadius = 20.0;
const agent = new THREE.Mesh(
    new THREE.CylinderGeometry(agentRadius, agentRadius, agentHeight), 
    new THREE.MeshPhongMaterial({ color: 'green' })
);
agent.position.set(0, -27, 0); // Approximately at the navmesh height
const agentGroup = new THREE.Group();
agentGroup.add(agent);
agentGroup.position.set(0, 0, 500);
scene.add(agentGroup);

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

// Modify the click event listener
window.addEventListener('click', event => {
    clickMouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    clickMouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
    const found = intersect(clickMouse);
    if (found.length > 0) {
        let target = found[0].point;
        const agentpos = agentGroup.position.clone();
        
        // Define the specific area bounds
        const specificArea = {
            minX: 200,  // Adjust these values based on your museum layout
            maxX: 400,
            minZ: 200,
            maxZ: 400
        };

        // Check if click is within specific area
        const isInSpecificArea = (
            target.x >= specificArea.minX && 
            target.x <= specificArea.maxX && 
            target.z >= specificArea.minZ && 
            target.z <= specificArea.maxZ
        );
        
        // Only show navmesh if click is in specific area
        if (navmesh && isInSpecificArea) {
            navmesh.visible = true;
        }
        
        // Debug information
        console.log("Click detected at:", target);
        console.log("Agent position:", agentpos);
        console.log("Is in specific area:", isInSpecificArea);
        
        if (navmesh) {
            try {
                groupID = pathfinding.getGroup(ZONE, agentpos);
                console.log("Group ID:", groupID);
                
                // Find closest node to agent, just in case agent is out of bounds
                const closest = pathfinding.getClosestNode(agentpos, ZONE, groupID);
                console.log("Closest node:", closest);
                
                navpath = pathfinding.findPath(closest.centroid, target, ZONE, groupID);
                console.log("Path found:", navpath);
                
                if (navpath) {
                    pathfindingHelper.reset();
                    pathfindingHelper.setPlayerPosition(agentpos);
                    pathfindingHelper.setTargetPosition(target);
                    pathfindingHelper.setPath(navpath);
                }
            } catch (error) {
                console.error("Pathfinding error:", error);
            }
        } else {
            console.warn("Navmesh not available yet");
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
fbxloader.load('museum-navmesh.fbx', (object) => {
    console.log("Navmesh loaded:", object);
    object.traverse((node) => {
        if (!navmesh && node.isMesh) {
            navmesh = node;
            // Hide navmesh initially
            navmesh.visible = false;
            console.log("Found navmesh mesh:", navmesh);
            
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