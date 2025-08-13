import { getState } from "./simulation.js";
import { gsap } from "gsap";
import * as THREE from "three";

let scene = "courtyard";
let canvas;
let bgLayers = []; // generated images urls

// 3D Scene variables
let threeScene, camera, renderer;
let environments = {};
let currentEnvironment = null;

// Camera controls
let cameraControls = {
  isDragging: false,
  previousPointer: { x: 0, y: 0 },
  spherical: { radius: 8, phi: Math.PI / 3, theta: 0 },
  target: { x: 0, y: 0, z: 0 }
};

export function init2_5D(c){
  canvas = c;
  setupResponsiveCanvases();
  window.addEventListener("resize", setupResponsiveCanvases, { passive:true });

  // Initialize 3D scene
  init3DScene();
  
  // generate parchment city layers for fallback
  generateLayers();
  requestAnimationFrame(tick);
}

function init3DScene() {
  if (!canvas) return;

  // Create Three.js scene
  threeScene = new THREE.Scene();
  threeScene.background = new THREE.Color(0x2a1810);

  // Create camera
  const aspect = canvas.clientWidth / canvas.clientHeight;
  camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 1000);
  updateCameraPosition();

  // Create renderer - ensure it uses the canvas correctly
  renderer = new THREE.WebGLRenderer({ 
    canvas: canvas, 
    antialias: true,
    alpha: false,
    preserveDrawingBuffer: false
  });
  renderer.setSize(canvas.clientWidth, canvas.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  // Create environments for each scene
  createEnvironments();
  
  // Set initial environment
  setEnvironment(scene);
  
  // Add camera controls
  setupCameraControls();
  
  // Start the render loop immediately
  tick();
}

function setupCameraControls() {
  // Mouse events
  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointerleave', onPointerUp);
  
  // Prevent context menu on right click
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());
}

function onPointerDown(event) {
  cameraControls.isDragging = true;
  cameraControls.previousPointer.x = event.clientX;
  cameraControls.previousPointer.y = event.clientY;
  canvas.style.cursor = 'grabbing';
  event.preventDefault();
}

function onPointerMove(event) {
  if (!cameraControls.isDragging) return;
  
  const deltaX = event.clientX - cameraControls.previousPointer.x;
  const deltaY = event.clientY - cameraControls.previousPointer.y;
  
  // Update spherical coordinates
  cameraControls.spherical.theta -= deltaX * 0.01;
  cameraControls.spherical.phi += deltaY * 0.01;
  
  // Clamp phi to prevent flipping
  cameraControls.spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, cameraControls.spherical.phi));
  
  updateCameraPosition();
  
  cameraControls.previousPointer.x = event.clientX;
  cameraControls.previousPointer.y = event.clientY;
  
  event.preventDefault();
}

function onPointerUp(event) {
  cameraControls.isDragging = false;
  canvas.style.cursor = 'grab';
  event.preventDefault();
}

function updateCameraPosition() {
  const spherical = cameraControls.spherical;
  const target = cameraControls.target;
  
  camera.position.x = target.x + spherical.radius * Math.sin(spherical.phi) * Math.cos(spherical.theta);
  camera.position.y = target.y + spherical.radius * Math.cos(spherical.phi);
  camera.position.z = target.z + spherical.radius * Math.sin(spherical.phi) * Math.sin(spherical.theta);
  
  camera.lookAt(target.x, target.y, target.z);
}

function createEnvironments() {
  environments = {
    courtyard: createCourtyard(),
    market: createMarket(), 
    council: createCouncil(),
    warroom: createWarRoom()
  };
}

function createCourtyard() {
  const group = new THREE.Group();
  
  // Ground plane with better visibility
  const groundGeometry = new THREE.PlaneGeometry(20, 20);
  const groundMaterial = new THREE.MeshLambertMaterial({ 
    color: 0x8B7355,
    side: THREE.DoubleSide
  });
  const ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  group.add(ground);

  // Courtyard walls - make them more visible
  const wallGeometry = new THREE.BoxGeometry(0.5, 4, 20);
  const wallMaterial = new THREE.MeshLambertMaterial({ color: 0xD4B896 });
  
  const leftWall = new THREE.Mesh(wallGeometry, wallMaterial);
  leftWall.position.set(-10, 2, 0);
  leftWall.castShadow = true;
  group.add(leftWall);
  
  const rightWall = new THREE.Mesh(wallGeometry, wallMaterial);
  rightWall.position.set(10, 2, 0);
  rightWall.castShadow = true;
  group.add(rightWall);

  // Back wall
  const backWallGeometry = new THREE.BoxGeometry(20, 4, 0.5);
  const backWall = new THREE.Mesh(backWallGeometry, wallMaterial);
  backWall.position.set(0, 2, -10);
  backWall.castShadow = true;
  group.add(backWall);

  // Fountain centerpiece - make it more prominent
  const fountainGeometry = new THREE.CylinderGeometry(1.5, 2, 1.5, 8);
  const fountainMaterial = new THREE.MeshLambertMaterial({ color: 0xA0A0A0 });
  const fountain = new THREE.Mesh(fountainGeometry, fountainMaterial);
  fountain.position.set(0, 0.75, 0);
  fountain.castShadow = true;
  group.add(fountain);

  // Add some architectural details
  for (let i = 0; i < 4; i++) {
    const pillarGeometry = new THREE.BoxGeometry(0.8, 5, 0.8);
    const pillarMaterial = new THREE.MeshLambertMaterial({ color: 0xC4A484 });
    const pillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
    const angle = (i / 4) * Math.PI * 2;
    pillar.position.set(Math.cos(angle) * 6, 2.5, Math.sin(angle) * 6);
    pillar.castShadow = true;
    group.add(pillar);
  }

  // Much stronger ambient lighting
  const ambientLight = new THREE.AmbientLight(0xFFE4B5, 0.8);
  group.add(ambientLight);
  
  const dirLight = new THREE.DirectionalLight(0xFFD700, 1.2);
  dirLight.position.set(5, 10, 5);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.width = 2048;
  dirLight.shadow.mapSize.height = 2048;
  dirLight.shadow.camera.near = 0.1;
  dirLight.shadow.camera.far = 50;
  dirLight.shadow.camera.left = -20;
  dirLight.shadow.camera.right = 20;
  dirLight.shadow.camera.top = 20;
  dirLight.shadow.camera.bottom = -20;
  group.add(dirLight);

  // Add fill light for better visibility
  const fillLight = new THREE.DirectionalLight(0xFFE4B5, 0.4);
  fillLight.position.set(-5, 5, -5);
  group.add(fillLight);

  return group;
}

function createMarket() {
  const group = new THREE.Group();
  
  // Ground
  const groundGeometry = new THREE.PlaneGeometry(25, 25);
  const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x8B6F47 });
  const ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  group.add(ground);

  // Market stalls
  for (let i = 0; i < 6; i++) {
    const stallGeometry = new THREE.BoxGeometry(3, 3, 2);
    const stallMaterial = new THREE.MeshLambertMaterial({ color: 0xDEB887 });
    const stall = new THREE.Mesh(stallGeometry, stallMaterial);
    stall.position.set((i % 3 - 1) * 5, 1.5, Math.floor(i / 3) * 6 - 3);
    stall.castShadow = true;
    group.add(stall);

    // Awnings
    const awningGeometry = new THREE.PlaneGeometry(4, 3);
    const awningMaterial = new THREE.MeshLambertMaterial({ 
      color: i % 2 ? 0xFF6B6B : 0x4ECDC4,
      side: THREE.DoubleSide
    });
    const awning = new THREE.Mesh(awningGeometry, awningMaterial);
    awning.position.set(stall.position.x, stall.position.y + 2, stall.position.z);
    awning.rotation.x = -Math.PI / 6;
    group.add(awning);
  }

  // Stronger market lighting
  const ambientLight = new THREE.AmbientLight(0xFFE4B5, 0.7);
  group.add(ambientLight);
  
  const dirLight = new THREE.DirectionalLight(0xFFD700, 1.0);
  dirLight.position.set(10, 15, 10);
  dirLight.castShadow = true;
  group.add(dirLight);

  // Additional warm lighting
  const warmLight = new THREE.DirectionalLight(0xFFA500, 0.3);
  warmLight.position.set(-8, 8, -8);
  group.add(warmLight);

  return group;
}

function createCouncil() {
  const group = new THREE.Group();
  
  // Floor
  const floorGeometry = new THREE.PlaneGeometry(15, 25);
  const floorMaterial = new THREE.MeshLambertMaterial({ color: 0x4A4A4A });
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  group.add(floor);

  // Long council table
  const tableGeometry = new THREE.BoxGeometry(12, 0.2, 3);
  const tableMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 });
  const table = new THREE.Mesh(tableGeometry, tableMaterial);
  table.position.set(0, 1, 0);
  table.castShadow = true;
  group.add(table);

  // Chairs around table
  for (let i = 0; i < 8; i++) {
    const chairGeometry = new THREE.BoxGeometry(0.8, 1.5, 0.8);
    const chairMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    const chair = new THREE.Mesh(chairGeometry, chairMaterial);
    const angle = (i / 8) * Math.PI * 2;
    chair.position.set(Math.cos(angle) * 4, 0.75, Math.sin(angle) * 2.5);
    chair.castShadow = true;
    group.add(chair);
  }

  // Much brighter ambient lighting for council chamber
  const ambientLight = new THREE.AmbientLight(0xFFE4B5, 1.2);
  group.add(ambientLight);
  
  // Multiple candle-like point lights with better intensity
  for (let i = 0; i < 4; i++) {
    const candleLight = new THREE.PointLight(0xFFAA00, 2.0, 15);
    candleLight.position.set((i % 2 - 0.5) * 8, 4, Math.floor(i / 2) * 8 - 4);
    candleLight.castShadow = true;
    group.add(candleLight);
  }

  // Strong overhead directional lighting
  const overheadLight = new THREE.DirectionalLight(0xFFE4B5, 1.0);
  overheadLight.position.set(0, 15, 0);
  overheadLight.target.position.set(0, 0, 0);
  group.add(overheadLight);
  group.add(overheadLight.target);

  // Additional fill lighting from multiple angles
  const fillLight1 = new THREE.DirectionalLight(0xFFD700, 0.6);
  fillLight1.position.set(10, 8, 10);
  group.add(fillLight1);

  const fillLight2 = new THREE.DirectionalLight(0xFFD700, 0.6);
  fillLight2.position.set(-10, 8, -10);
  group.add(fillLight2);

  return group;
}

function createWarRoom() {
  const group = new THREE.Group();
  
  // Floor
  const floorGeometry = new THREE.PlaneGeometry(20, 20);
  const floorMaterial = new THREE.MeshLambertMaterial({ color: 0x3C2414 });
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  group.add(floor);

  // War table with map
  const warTableGeometry = new THREE.BoxGeometry(8, 0.3, 6);
  const warTableMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 });
  const warTable = new THREE.Mesh(warTableGeometry, warTableMaterial);
  warTable.position.set(0, 1, 0);
  warTable.castShadow = true;
  group.add(warTable);

  // Weapon racks
  for (let i = 0; i < 4; i++) {
    const rackGeometry = new THREE.BoxGeometry(0.2, 3, 4);
    const rackMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    const rack = new THREE.Mesh(rackGeometry, rackMaterial);
    const angle = (i / 4) * Math.PI * 2;
    rack.position.set(Math.cos(angle) * 8, 1.5, Math.sin(angle) * 8);
    rack.castShadow = true;
    group.add(rack);
  }

  // Much brighter ambient lighting for war room
  const ambientLight = new THREE.AmbientLight(0xFFE4B5, 1.0);
  group.add(ambientLight);
  
  // Bright central fire light
  const fireLight = new THREE.PointLight(0xFF4500, 2.5, 25);
  fireLight.position.set(-6, 4, -6);
  fireLight.castShadow = true;
  group.add(fireLight);

  // Multiple torch lights for even illumination
  const torchLight1 = new THREE.PointLight(0xFFAA44, 1.5, 15);
  torchLight1.position.set(6, 4, 6);
  torchLight1.castShadow = true;
  group.add(torchLight1);

  const torchLight2 = new THREE.PointLight(0xFFAA44, 1.5, 15);
  torchLight2.position.set(-6, 4, 6);
  torchLight2.castShadow = true;
  group.add(torchLight2);

  const torchLight3 = new THREE.PointLight(0xFFAA44, 1.5, 15);
  torchLight3.position.set(6, 4, -6);
  torchLight3.castShadow = true;
  group.add(torchLight3);

  // Strong directional lighting from above
  const overheadLight = new THREE.DirectionalLight(0xFFE4B5, 0.8);
  overheadLight.position.set(0, 12, 0);
  overheadLight.target.position.set(0, 0, 0);
  group.add(overheadLight);
  group.add(overheadLight.target);

  // Additional strategic lighting for visibility
  const strategicLight1 = new THREE.DirectionalLight(0xFF8844, 0.5);
  strategicLight1.position.set(8, 6, 8);
  group.add(strategicLight1);

  const strategicLight2 = new THREE.DirectionalLight(0xFF8844, 0.5);
  strategicLight2.position.set(-8, 6, -8);
  group.add(strategicLight2);

  return group;
}

function setEnvironment(sceneName) {
  // Remove current environment
  if (currentEnvironment) {
    threeScene.remove(currentEnvironment);
  }
  
  // Add new environment
  const env = environments[sceneName];
  if (env) {
    threeScene.add(env);
    currentEnvironment = env;
  }
  
  // Force a render
  if (renderer && threeScene && camera) {
    renderer.render(threeScene, camera);
  }
}

function setupResponsiveCanvases(){
  // Main scene canvas
  if (canvas && renderer) {
    fitCanvasToDisplay(canvas);
    const rect = canvas.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) { // Ensure canvas has dimensions
      renderer.setSize(canvas.clientWidth, canvas.clientHeight);
      if (camera) {
        camera.aspect = canvas.clientWidth / canvas.clientHeight;
        camera.updateProjectionMatrix();
      }
      // Force a render after resize
      if (threeScene) {
        renderer.render(threeScene, camera);
      }
    }
  }
}

export function fitCanvasToDisplay(cnv){
  if (!cnv) return; // Add null check
  const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  const rect = cnv.getBoundingClientRect();
  const w = Math.floor(rect.width * dpr);
  const h = Math.floor(rect.height * dpr);
  if (cnv.width !== w || cnv.height !== h){
    cnv.width = w;
    cnv.height = h;
  }
  const ctx = cnv.getContext("2d");
  if (ctx) { // Add null check for context
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // draw using CSS pixels
  }
}

async function generateLayers(){
  const prompts = [
    "Renaissance Florence courtyard, warm chiaroscuro, oil painting, subtle motion, parchment canvas texture",
    "Bustling market with merchants and stalls, oil paint, golden light, 2.5D parallax",
    "Shadowed council chamber, long table, candlelit, smoke wisps, oil painted",
    "Candlelit war room with maps and tokens, oil painting, dramatic chiaroscuro"
  ];
  const map = { courtyard:0, market:1, council:2, warroom:3 };
  for (let i=0;i<prompts.length;i++){
    try{
      const res = await websim.imageGen({ prompt: prompts[i], aspect_ratio:"16:9", seed:i+1 });
      bgLayers[i] = res.url;
    }catch(e){
      bgLayers[i] = "";
    }
  }
  // set initial
  drawFlorence(canvas.getContext("2d"), getState());
}

export function setScene(s){
  scene = s;
  setEnvironment(s);
  inkSwipe();
}

export function drawFlorence(ctx, state){
  // 3D rendering is handled in the tick function
  // Force a render to ensure the scene is visible
  if (renderer && threeScene && camera) {
    renderer.render(threeScene, camera);
  }
}

let animationId;
function tick(){
  if (renderer && threeScene && camera) {
    // Remove automatic rotation to prevent infinite spinning glitch
    // Only update camera if user is actively dragging
    
    // Render the 3D scene
    renderer.render(threeScene, camera);
  }
  animationId = requestAnimationFrame(tick);
}

// Transitions
export function inkSwipe(forceShow){
  const el = document.getElementById("ink-swipe");
  if (!el) return;
  if (forceShow){
    el.classList.add("show");
    return;
  }
  el.classList.add("show");
  setTimeout(()=>el.classList.remove("show"), 500);
}