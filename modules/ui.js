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
  threeScene.background = new THREE.Color(0x0a0706);

  // Create camera
  const aspect = canvas.clientWidth / canvas.clientHeight;
  camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 1000);
  camera.position.set(0, 2, 5);

  // Create renderer
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(canvas.clientWidth, canvas.clientHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  // Create environments for each scene
  createEnvironments();
  
  // Set initial environment
  setEnvironment(scene);
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
  
  // Ground plane
  const groundGeometry = new THREE.PlaneGeometry(20, 20);
  const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
  const ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  group.add(ground);

  // Courtyard walls
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

  // Fountain centerpiece
  const fountainGeometry = new THREE.CylinderGeometry(1.5, 2, 1, 8);
  const fountainMaterial = new THREE.MeshLambertMaterial({ color: 0xA0A0A0 });
  const fountain = new THREE.Mesh(fountainGeometry, fountainMaterial);
  fountain.position.set(0, 0.5, 0);
  fountain.castShadow = true;
  group.add(fountain);

  // Ambient lighting
  const ambientLight = new THREE.AmbientLight(0xFFE4B5, 0.4);
  group.add(ambientLight);
  
  const dirLight = new THREE.DirectionalLight(0xFFD700, 0.8);
  dirLight.position.set(5, 10, 5);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.width = 2048;
  dirLight.shadow.mapSize.height = 2048;
  group.add(dirLight);

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

  // Market lighting
  const ambientLight = new THREE.AmbientLight(0xFFE4B5, 0.5);
  group.add(ambientLight);
  
  const dirLight = new THREE.DirectionalLight(0xFFD700, 0.7);
  dirLight.position.set(10, 15, 10);
  dirLight.castShadow = true;
  group.add(dirLight);

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

  // Dramatic candlelit lighting
  const ambientLight = new THREE.AmbientLight(0x2A1810, 0.3);
  group.add(ambientLight);
  
  // Multiple candle-like point lights
  for (let i = 0; i < 4; i++) {
    const candleLight = new THREE.PointLight(0xFFAA00, 0.8, 10);
    candleLight.position.set((i % 2 - 0.5) * 8, 3, Math.floor(i / 2) * 8 - 4);
    candleLight.castShadow = true;
    group.add(candleLight);
  }

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

  // Strategic lighting
  const ambientLight = new THREE.AmbientLight(0x4A2C2A, 0.3);
  group.add(ambientLight);
  
  const fireLight = new THREE.PointLight(0xFF4500, 1.2, 15);
  fireLight.position.set(-6, 2, -6);
  fireLight.castShadow = true;
  group.add(fireLight);

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
}

function setupResponsiveCanvases(){
  // Main scene canvas
  if (canvas) {
    fitCanvasToDisplay(canvas);
    if (renderer) {
      renderer.setSize(canvas.clientWidth, canvas.clientHeight);
      if (camera) {
        camera.aspect = canvas.clientWidth / canvas.clientHeight;
        camera.updateProjectionMatrix();
      }
    }
  }
}

export function fitCanvasToDisplay(cnv){
  const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  const rect = cnv.getBoundingClientRect();
  const w = Math.floor(rect.width * dpr);
  const h = Math.floor(rect.height * dpr);
  if (cnv.width !== w || cnv.height !== h){
    cnv.width = w;
    cnv.height = h;
  }
  const ctx = cnv.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // draw using CSS pixels
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
  // 3D rendering is now handled in the tick function
  // Keep this function for compatibility
}

function tick(){
  if (renderer && threeScene && camera) {
    // Add subtle camera movement for liveliness
    const time = Date.now() * 0.001;
    camera.position.x = Math.sin(time * 0.2) * 0.5;
    camera.position.y = 2 + Math.sin(time * 0.3) * 0.3;
    
    // Render the 3D scene
    renderer.render(threeScene, camera);
  }
  requestAnimationFrame(tick);
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