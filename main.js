import * as Tone from "tone";
import { initAudio, setMode } from "./modules/audio.js";
import { initAI, parleyWithFaction, draftDirectiveAI, describeFortuna } from "./modules/ai.js";
import { initSim, applyCovertAction, nextTurn, getState, onLog } from "./modules/simulation.js";
import { drawFlorence, setScene, init2_5D, inkSwipe } from "./modules/ui.js";
import { initMap, updateMap } from "./modules/worldmap.js";

const els = {
  codex: document.getElementById("codex"),
  codexToggle: document.getElementById("codexToggle"),
  directivesList: document.getElementById("directivesList"),
  draftDirectiveBtn: document.getElementById("draftDirectiveBtn"),
  log: document.getElementById("log"),
  canvas: document.getElementById("florenceCanvas"),
  toCourtyard: document.getElementById("toCourtyard"),
  toMarket: document.getElementById("toMarket"),
  toCouncil: document.getElementById("toCouncil"),
  toWarRoom: document.getElementById("toWarRoom"),
  mapCanvas: document.getElementById("mapCanvas"),
  dialCapital: document.getElementById("dialCapital"),
  dialPublic: document.getElementById("dialPublic"),
  dialTrust: document.getElementById("dialTrust"),
  serpentsCanvas: document.getElementById("serpentsCanvas"),
  portraits: {
    medici: document.getElementById("portrait-medici"),
    papal: document.getElementById("portrait-papal"),
    merc: document.getElementById("portrait-merc"),
  },
  moods: {
    medici: document.getElementById("mood-medici"),
    papal: document.getElementById("mood-papal"),
    merc: document.getElementById("mood-merc"),
  },
  talkBtns: Array.from(document.querySelectorAll(".talk-btn")),
  portraitDrops: Array.from(document.querySelectorAll(".portrait-drop")),
  tokens: Array.from(document.querySelectorAll(".token")),
  dropzones: Array.from(document.querySelectorAll(".dropzone")),
  dialogue: document.getElementById("dialogue"),
  conversation: document.getElementById("conversation"),
  dialoguePortrait: document.getElementById("dialoguePortrait"),
  choices: document.getElementById("choices"),
  composeInput: document.getElementById("composeInput"),
  composeSend: document.getElementById("composeSend"),
  closeDialogue: document.querySelector(".close-dialogue"),
  turnNum: document.getElementById("turnNum"),
  yearNum: document.getElementById("yearNum"),
  standingText: document.getElementById("standingText"),
  fortuneTicker: document.getElementById("fortuneTicker"),
  newGameBtn: document.getElementById("newGameBtn"),
  saveBtn: document.getElementById("saveBtn"),
  loadBtn: document.getElementById("loadBtn"),
  aiAdvisorToggle: document.getElementById("aiAdvisorToggle"),
  autopilotToggle: document.getElementById("autopilotToggle"),
  ink: document.getElementById("ink-swipe"),
  wax: document.getElementById("wax-seal"),
};

let portraits = {
  medici: "",
  papal: "",
  merc: ""
};

let conversationHistory = [];

function log(msg){
  const line = document.createElement("div");
  line.textContent = msg;
  els.log.prepend(line);
}

onLog((m)=>log(m));

// Codex toggle
els.codexToggle.addEventListener("click", ()=>{
  els.codex.classList.toggle("collapsed");
});

// Scenes
els.toCourtyard.addEventListener("click", ()=>setScene("courtyard"));
els.toMarket.addEventListener("click", ()=>setScene("market"));
els.toCouncil.addEventListener("click", ()=>setScene("council"));
els.toWarRoom.addEventListener("click", ()=>setScene("warroom"));

// Drag n Drop tokens
els.tokens.forEach(t=>{
  t.addEventListener("dragstart", e=>{
    e.dataTransfer.setData("text/plain", t.dataset.action);
  });
});
const handleDrop = (target, data)=>{
  const zone = target.dataset.zone || null;
  const faction = target.dataset.faction || null;
  applyCovertAction({ action:data, zone, faction });
  inkSwipe();
};
[...els.dropzones, ...els.portraitDrops].forEach(dz=>{
  dz.addEventListener("dragover", e=>e.preventDefault());
  dz.addEventListener("drop", e=>{
    e.preventDefault();
    const data = e.dataTransfer.getData("text/plain");
    handleDrop(dz, data);
  });
});

// Parley
els.talkBtns.forEach(btn=>{
  btn.addEventListener("click", async ()=>{
    const faction = btn.dataset.faction;
    await openDialogue(faction);
  });
});

// Dialogue mechanics
function addMessage(role, text){
  const m = document.createElement("div");
  m.className = "message " + (role === "you" ? "you" : "them");
  m.textContent = text;
  els.conversation.appendChild(m);
  els.conversation.scrollTop = els.conversation.scrollHeight;
}

async function openDialogue(factionId){
  const state = getState();
  els.dialogue.classList.add("show");
  els.dialoguePortrait.src = portraits[factionId];
  els.conversation.innerHTML = "";
  addMessage("them", `You stand before the ${state.factions[factionId].name}. Choose your words with care.`);
  // Build initial AI-driven choices
  const aiChoices = await parleyWithFaction(factionId, conversationHistory, state);
  renderChoices(aiChoices, factionId);
}

function renderChoices(choices, factionId){
  els.choices.innerHTML = "";
  choices.forEach((c, idx)=>{
    const b = document.createElement("button");
    b.className = "btn";
    b.textContent = c.text;
    b.addEventListener("click", async ()=>{
      addMessage("you", c.text);
      // Update conversation history and get reply
      conversationHistory.push({ role:"user", content: c.text });
      conversationHistory = conversationHistory.slice(-10);
      const reply = await parleyWithFaction(factionId, conversationHistory, getState(), true);
      addMessage("them", reply.reply);
      conversationHistory.push({ role:"assistant", content: reply.reply });
      updateReputationUI();
      if (reply.followups && reply.followups.length) renderChoices(reply.followups, factionId);
      else els.choices.innerHTML = "";
    });
    els.choices.appendChild(b);
  });
}

els.composeSend.addEventListener("click", async ()=>{
  const msg = els.composeInput.value.trim();
  if(!msg) return;
  addMessage("you", msg);
  conversationHistory.push({ role:"user", content: msg });
  conversationHistory = conversationHistory.slice(-10);
  const currentFaction = els.dialoguePortrait.src.includes(portraits.medici) ? "medici" :
                         els.dialoguePortrait.src.includes(portraits.papal) ? "papal" : "merc";
  const reply = await parleyWithFaction(currentFaction, conversationHistory, getState(), true);
  addMessage("them", reply.reply);
  conversationHistory.push({ role:"assistant", content: reply.reply });
  els.composeInput.value = "";
  updateReputationUI();
});

document.querySelector(".close-dialogue").addEventListener("click", ()=>{
  els.dialogue.classList.remove("show");
});

// New Game / Save / Load
els.newGameBtn.addEventListener("click", async ()=>{
  await startNewCampaign();
});
els.saveBtn.addEventListener("click", ()=>{
  localStorage.setItem("machiavelli_save", JSON.stringify(getState()));
  showWax(true);
  setTimeout(()=>showWax(false), 900);
});
els.loadBtn.addEventListener("click", ()=>{
  const data = localStorage.getItem("machiavelli_save");
  if (data){
    const state = JSON.parse(data);
    initSim(state); // re-init from save
    refreshAll();
    inkSwipe();
  }
});

// Toggles
els.aiAdvisorToggle.addEventListener("change", ()=>{
  const enabled = els.aiAdvisorToggle.checked;
  log(enabled ? "AI Advisor summoned." : "AI Advisor dismissed.");
});
els.autopilotToggle.addEventListener("change", ()=>{
  const enabled = els.autopilotToggle.checked;
  log(enabled ? "Autopilot engaged." : "Autopilot disengaged.");
});

// Turn cycle
function updateTurnUI(){
  const s = getState();
  els.turnNum.textContent = s.turn;
  els.yearNum.textContent = s.year;
  els.standingText.textContent = s.standing;
}
async function endTurn(){
  const s = await nextTurn();
  updateTurnUI();
  updateMap(els.mapCanvas.getContext("2d"), s);
  drawFlorence(els.canvas.getContext("2d"), s);
  updateReputationUI();
  els.fortuneTicker.textContent = await describeFortuna(s);
  setMode(s.stability >= 0 ? "major" : "minor");
}
setInterval(async ()=>{
  const s = getState();
  if (document.hidden) return;
  if (els.autopilotToggle.checked){
    // Let AI suggest and apply one directive per turn
    const suggestion = await draftDirectiveAI(getState());
    if (suggestion){
      log("AI Advisor: " + suggestion.title);
    }
  }
  await endTurn();
}, 18000);

// Dials + Serpents
function setDial(el, value01){
  const pct = Math.max(0, Math.min(1, value01)) * 100;
  el.style.background = `linear-gradient(90deg, #bfa36a ${pct}%, rgba(0,0,0,.15) ${pct}%)`;
}
function renderSerpents(v, f){
  const ctx = els.serpentsCanvas.getContext("2d");
  const w = ctx.canvas.width, h = ctx.canvas.height;
  ctx.clearRect(0,0,w,h);
  // background parchment tone
  ctx.fillStyle = "rgba(0,0,0,0.03)";
  ctx.fillRect(0,0,w,h);
  // draw interlaced serpents as bezier waves
  const steps = 32;
  ctx.lineWidth = 5;
  // Virtù serpent
  ctx.strokeStyle = "#7a5f23";
  ctx.beginPath();
  for(let i=0;i<=steps;i++){
    const t = i/steps;
    const x = 10 + t*(w-20);
    const y = h/2 + Math.sin(t*6.283 + v*2)*20 - f*4;
    i===0?ctx.moveTo(x,y):ctx.lineTo(x,y);
  }
  ctx.stroke();
  // Fortuna serpent
  ctx.strokeStyle = "#2f4f6f";
  ctx.beginPath();
  for(let i=0;i<=steps;i++){
    const t = i/steps;
    const x = 10 + t*(w-20);
    const y = h/2 + Math.cos(t*6.283 + f*2)*18 + v*4;
    i===0?ctx.moveTo(x,y):ctx.lineTo(x,y);
  }
  ctx.stroke();
}

function updateReputationUI(){
  const s = getState();
  setDial(els.dialCapital, s.capital/100);
  setDial(els.dialPublic, (s.publicOpinion+50)/100);
  const avgTrust = (s.factions.medici.trust + s.factions.papal.trust + s.factions.merc.trust)/3;
  setDial(els.dialTrust, avgTrust/100);

  // mood text + portrait filters
  for (const id of ["medici","papal","merc"]){
    const mood = s.factions[id].trust > 60 ? "Favorable" : s.factions[id].trust < 40 ? "Wary" : "Neutral";
    els.moods[id].textContent = mood;
    const img = els.portraits[id];
    img.classList.toggle("mood-good", s.factions[id].trust > 60);
    img.classList.toggle("mood-bad", s.factions[id].trust < 40);
  }

  renderSerpents(s.virtu/100, s.fortuna/100);
}

// Portrait generation at runtime
async function ensurePortraits(){
  const prompts = {
    medici: "Oil-painted Renaissance portrait, House Medici patron, stern yet opulent, warm chiaroscuro, subtle gold trim, 3/4 profile, canvas texture",
    papal: "Oil-painted Renaissance portrait, Papal envoy in crimson mozzetta, intelligent eyes, candlelit shadows, illuminated manuscript vibe",
    merc: "Oil-painted Renaissance portrait, condottiero captain, weathered steel gorget, calculating gaze, smoky war room light"
  };
  for(const key of Object.keys(prompts)){
    try{
      const res = await websim.imageGen({ prompt: prompts[key], aspect_ratio: "1:1", seed: key.length });
      portraits[key] = res.url;
      els.portraits[key].src = res.url;
    }catch(e){
      // fallback placeholder
      els.portraits[key].alt = key + " portrait unavailable";
    }
  }
}

// Wax seal helper
function showWax(show){
  els.wax.classList.toggle("show", show);
}

// Start new campaign
async function startNewCampaign(){
  inkSwipe(true);
  initSim(); // fresh state
  await ensurePortraits();
  await initAI();
  initAudio(Tone);
  setMode("minor");
  init2_5D(els.canvas);
  initMap(els.mapCanvas);
  refreshAll();
  setTimeout(()=>inkSwipe(false), 600);
}

// Refresh UI
function refreshAll(){
  const s = getState();
  drawFlorence(els.canvas.getContext("2d"), s);
  updateMap(els.mapCanvas.getContext("2d"), s);
  updateReputationUI();
  updateTurnUI();
}

// Boot
startNewCampaign();

