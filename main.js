import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1a2e);

// Camera setup
const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);
camera.position.set(10, 10, 10); // Zoom out a bit more for the larger scale
camera.lookAt(0, 0, 0);

// Renderer setup
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

// Label Renderer setup
const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(window.innerWidth, window.innerHeight);
labelRenderer.domElement.style.position = 'absolute';
labelRenderer.domElement.style.top = '0px';
labelRenderer.domElement.style.pointerEvents = 'none';
document.body.appendChild(labelRenderer.domElement);

// Controls setup
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.screenSpacePanning = false;
controls.minDistance = 1;
controls.maxDistance = 100;

// Add grid and axes helpers
const gridHelper = new THREE.GridHelper(40, 40, 0x444444, 0x222222);
scene.add(gridHelper);

const axesHelper = new THREE.AxesHelper(5);
scene.add(axesHelper);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(5, 10, 5);
scene.add(directionalLight);

// Conversation state
const colors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff, 0x00ffff,
                0xff6b6b, 0x4ecdc4, 0x45b7d1, 0xffa07a, 0x98d8c8, 0xf7dc6f];
let currentPoint = new THREE.Vector3(0, 0, 0);
let pathPoints = [currentPoint.clone()];
let conversationHistory = [];
let pathLine = null;

// Create initial sphere at origin
const originSphere = new THREE.Mesh(
    new THREE.SphereGeometry(0.15, 16, 16),
    new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: 0xffffff,
        emissiveIntensity: 0.3
    })
);
originSphere.position.copy(currentPoint);
scene.add(originSphere);

// Function to add vector to scene
function addVectorToScene(vector3D, text, color) {
    // Check visualization mode
    const vizMode = document.querySelector('input[name="viz-mode"]:checked').value;
    const isScatter = vizMode === 'scatter';

    const direction = new THREE.Vector3(vector3D.x, vector3D.y, vector3D.z);
    const length = direction.length();
    const normalizedDir = direction.clone().normalize();

    // Determine start point
    // If scatter, always start at origin (0,0,0)
    // If walk, start at the current cumulative point
    const startPoint = isScatter ? new THREE.Vector3(0, 0, 0) : currentPoint;

    // Create arrow
    const arrow = new THREE.ArrowHelper(
        normalizedDir,
        startPoint,
        length,
        color,
        length * 0.2,
        length * 0.15
    );
    scene.add(arrow);

    // Calculate end point (where the sphere/label goes)
    const endPoint = startPoint.clone().add(direction);

    // Create sphere at end point
    const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(0.12, 16, 16),
        new THREE.MeshStandardMaterial({
            color: color,
            emissive: color,
            emissiveIntensity: 0.2
        })
    );
    sphere.position.copy(endPoint);
    scene.add(sphere);

    // Create text label
    const div = document.createElement('div');
    div.className = 'label';
    div.textContent = text;
    div.style.borderColor = '#' + color.toString(16).padStart(6, '0');
    div.style.borderLeft = '3px solid';

    const label = new CSS2DObject(div);
    label.position.copy(endPoint);
    label.position.y += 0.3; // Offset slightly above the point
    scene.add(label);

    // Only update path/currentPoint if in Walk mode
    if (!isScatter) {
        // Update path
        pathPoints.push(endPoint.clone());
        updatePathLine();

        // Update current point
        currentPoint = endPoint;

        // Add/Move final sphere
        if (scene.getObjectByName('finalSphere')) {
            scene.remove(scene.getObjectByName('finalSphere'));
        }
        const finalSphere = new THREE.Mesh(
            new THREE.SphereGeometry(0.15, 16, 16),
            new THREE.MeshStandardMaterial({
                color: 0xffffff,
                emissive: 0xffffff,
                emissiveIntensity: 0.3
            })
        );
        finalSphere.name = 'finalSphere';
        finalSphere.position.copy(currentPoint);
        scene.add(finalSphere);
    }

    // Focus camera
    if (isScatter) {
        // Look at origin
        controls.target.set(0, 0, 0);
    } else {
        // Follow the path
        const centerPoint = new THREE.Vector3();
        pathPoints.forEach(p => centerPoint.add(p));
        centerPoint.divideScalar(pathPoints.length);
        controls.target.lerp(centerPoint, 0.1);
    }
}

// Function to update path line
function updatePathLine() {
    // Remove old path line
    if (pathLine) {
        scene.remove(pathLine);
    }

    // Create new path line
    const geometry = new THREE.BufferGeometry().setFromPoints(pathPoints);
    const material = new THREE.LineBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.3,
        linewidth: 2
    });
    pathLine = new THREE.Line(geometry, material);
    scene.add(pathLine);
}

// UI Elements
const textInput = document.getElementById('text-input');
const submitBtn = document.getElementById('submit-btn');
const statusDiv = document.getElementById('status');
const historyDiv = document.getElementById('conversation-history');

// Function to update conversation history UI
function updateHistoryUI() {
    if (conversationHistory.length === 0) {
        historyDiv.innerHTML = '<div style="color: #888; font-style: italic;">No messages yet. Start typing!</div>';
        return;
    }

    historyDiv.innerHTML = conversationHistory.map((msg, index) => {
        const color = colors[index % colors.length];
        const colorHex = '#' + color.toString(16).padStart(6, '0');
        return `<div class="message" style="border-left-color: ${colorHex}">
            ${msg.text}
        </div>`;
    }).join('');

    // Auto-scroll to bottom
    historyDiv.scrollTop = historyDiv.scrollHeight;
}

// Function to call backend API
async function getEmbedding(text, method) {
    const response = await fetch('http://localhost:3000/api/embed', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text, method })
    });

    if (!response.ok) {
        throw new Error('Failed to get embedding');
    }

    return await response.json();
}

// Handle submit
async function handleSubmit() {
    const text = textInput.value.trim();

    // Get selected method
    const method = document.querySelector('input[name="method"]:checked').value;

    if (!text) {
        statusDiv.textContent = 'Please enter some text';
        return;
    }

    // Disable input while processing
    submitBtn.disabled = true;
    textInput.disabled = true;
    statusDiv.textContent = 'Getting embedding...';

    try {
        const result = await getEmbedding(text, method);

        // Add to conversation
        const color = colors[conversationHistory.length % colors.length];
        conversationHistory.push({ text, vector: result.vector, color });

        // Add vector to scene
        addVectorToScene(result.vector, text, color);

        // Update UI
        updateHistoryUI();
        textInput.value = '';
        statusDiv.textContent = `Vector added! (${result.method})`;

        // Clear status after 3 seconds
        setTimeout(() => {
            statusDiv.textContent = '';
        }, 3000);

    } catch (error) {
        console.error('Error:', error);
        statusDiv.textContent = '❌ Error: ' + error.message;
    } finally {
        submitBtn.disabled = false;
        textInput.disabled = false;
        textInput.focus();
    }
}

// Event listeners
submitBtn.addEventListener('click', handleSubmit);
textInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
    }
});

// Initialize UI
updateHistoryUI();
textInput.focus();

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    labelRenderer.setSize(window.innerWidth, window.innerHeight);
});

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
    labelRenderer.render(scene, camera);
}

animate();

console.log('🎮 TextWalk - Ready!');
console.log('💡 Tip: Press Enter to submit | Shift+Enter for new line');
