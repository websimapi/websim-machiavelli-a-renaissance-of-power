export function initMap(canvas){
  const ctx = canvas.getContext("2d");
  drawBase(ctx);
}
export function updateMap(ctx, state){
  drawBase(ctx);
  const w = ctx.canvas.width, h = ctx.canvas.height;
  // Borders shift
  const t = state.mapBordersShift || 0;
  // territories as radii
  const centers = {
    medici: { x: w*0.45, y: h*0.6, color:"#b23b3b" },
    papal:  { x: w*0.7, y: h*0.35, color:"#3b6ab2" },
    merc:   { x: w*0.3, y: h*0.25, color:"#3bb26b" }
  };
  for (const key of Object.keys(centers)){
    const faction = state.factions[key];
    const r = 40 + faction.territory*120 + Math.sin(t*2 + rseed(key))*6;
    ctx.beginPath();
    ctx.arc(centers[key].x, centers[key].y, r, 0, Math.PI*2);
    ctx.fillStyle = hexToRgba(centers[key].color, 0.18);
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = hexToRgba(centers[key].color, 0.55);
    ctx.stroke();
  }
  // city dots
  ctx.fillStyle = "#1b130b";
  for (let i=0;i<5;i++){
    ctx.fillRect(20+i*50, 20+ (i%2)*14, 2, 2);
  }
}
function drawBase(ctx){
  const w = ctx.canvas.width, h = ctx.canvas.height;
  ctx.clearRect(0,0,w,h);
  const grd = ctx.createLinearGradient(0,0,0,h);
  grd.addColorStop(0,"#e9ddc5");
  grd.addColorStop(1,"#d6c4a1");
  ctx.fillStyle = grd;
  ctx.fillRect(0,0,w,h);
  // river
  ctx.fillStyle = "#88a0b3";
  ctx.beginPath();
  ctx.moveTo(0, h*0.7);
  ctx.bezierCurveTo(w*0.2,h*0.6, w*0.4,h*0.8, w*0.7,h*0.7);
  ctx.lineTo(w, h*0.75);
  ctx.lineTo(w, h);
  ctx.lineTo(0,h);
  ctx.closePath();
  ctx.fill();
  // parchment grid
  ctx.strokeStyle = "rgba(0,0,0,0.08)";
  ctx.lineWidth = 1;
  for (let x=0;x<w;x+=20){ ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,h); ctx.stroke(); }
  for (let y=0;y<h;y+=20){ ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(w,y); ctx.stroke(); }
}

function hexToRgba(hex, a){
  const n = parseInt(hex.replace("#",""),16);
  const r = n>>16 & 255, g = n>>8 & 255, b = n & 255;
  return `rgba(${r},${g},${b},${a})`;
}
function rseed(s){
  let h=0; for(let i=0;i<s.length;i++) h=(h*31 + s.charCodeAt(i))|0;
  return (h>>>0)%100/50;
}

