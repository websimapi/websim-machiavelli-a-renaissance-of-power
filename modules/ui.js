import { getState } from "./simulation.js";
import { gsap } from "gsap";

let scene = "courtyard";
let canvas;
let bgLayers = []; // generated images urls

export function init2_5D(c){
  canvas = c;
  // Resize for device pixel ratio and on viewport changes
  setupResponsiveCanvases();
  window.addEventListener("resize", setupResponsiveCanvases, { passive:true });

  // generate parchment city layers
  generateLayers();
  requestAnimationFrame(tick);
}

function setupResponsiveCanvases(){
  // Main scene canvas
  if (canvas) fitCanvasToDisplay(canvas);
  // Map + Serpents handled in main.js after get refs; provide helpers here if needed
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
  inkSwipe();
}

export function drawFlorence(ctx, state){
  if (!ctx) return;
  const w = ctx.canvas.clientWidth, h = ctx.canvas.clientHeight;
  ctx.clearRect(0,0,w,h);

  const index = scene==="courtyard"?0:scene==="market"?1:scene==="council"?2:3;
  const img = new Image();
  img.onload = ()=>{
    // parallax: draw base + soft overlay vignette
    ctx.drawImage(img, 0,0,w,h);
    // add subtle animated citizens as strokes
    ctx.fillStyle = "rgba(0,0,0,0.18)";
    for (let i=0;i<6;i++){
      const x = (Math.sin(Date.now()/1500 + i)*0.5+0.5)*w*0.8 + w*0.1;
      const y = h*0.65 + Math.sin(Date.now()/1800 + i*2)*6;
      ctx.fillRect(x, y, 6, 16);
    }
    // candle flicker overlay
    const glow = 0.03 + 0.02*Math.sin(Date.now()/500);
    ctx.fillStyle = `rgba(255,210,130,${glow})`;
    ctx.fillRect(0,0,w,h);
    // ink edges
    const grad = ctx.createLinearGradient(0,0,0,h);
    grad.addColorStop(0, "rgba(0,0,0,0.25)");
    grad.addColorStop(1, "rgba(0,0,0,0.35)");
    ctx.fillStyle = grad;
    ctx.fillRect(0,0,w,30);
    ctx.fillRect(0,h-30,w,30);
  };
  img.src = bgLayers[index] || "";
}

function tick(){
  const ctx = canvas?.getContext("2d");
  if (ctx) drawFlorence(ctx, {});
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