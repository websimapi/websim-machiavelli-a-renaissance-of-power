import { els } from "./elements.js";
import { getState, nextTurn, initSim } from "./simulation.js";
import { describeFortuna } from "./ai.js";
import { updateMap } from "./worldmap.js";
import { drawFlorence, inkSwipe, fitCanvasToDisplay } from "./ui.js";
import { setMode } from "./audio.js";

export function updateTurnUI() {
  const s = getState();
  els.turnNum.textContent = s.turn;
  els.yearNum.textContent = s.year;
  els.standingText.textContent = s.standing;
}

export async function endTurn() {
  const s = await nextTurn();
  updateTurnUI();
  updateMap(els.mapCanvas.getContext("2d"), s);
  drawFlorence(els.canvas.getContext("2d"), s);
  updateReputationUI();
  els.fortuneTicker.textContent = await describeFortuna(s);
  setMode(s.stability >= 0 ? "major" : "minor");
}

export function setDial(el, value01) {
  const pct = Math.max(0, Math.min(1, value01)) * 100;
  el.style.background = `linear-gradient(90deg, #bfa36a ${pct}%, rgba(0,0,0,.15) ${pct}%)`;
}

export function renderSerpents(v, f) {
  const ctx = els.serpentsCanvas.getContext("2d");
  fitCanvasToDisplay(els.serpentsCanvas);
  const w = els.serpentsCanvas.clientWidth, h = els.serpentsCanvas.clientHeight;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "rgba(0,0,0,0.03)";
  ctx.fillRect(0, 0, w, h);
  const steps = 32;
  ctx.lineWidth = 5;
  ctx.strokeStyle = "#7a5f23";
  ctx.beginPath();
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = 10 + t * (w - 20);
    const y = h / 2 + Math.sin(t * 6.283 + v * 2) * 20 - f * 4;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.strokeStyle = "#2f4f6f";
  ctx.beginPath();
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = 10 + t * (w - 20);
    const y = h / 2 + Math.cos(t * 6.283 + f * 2) * 18 + v * 4;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.stroke();
}

export function updateReputationUI() {
  const s = getState();
  setDial(els.dialCapital, s.capital / 100);
  setDial(els.dialPublic, (s.publicOpinion + 50) / 100);
  const avgTrust = (s.factions.medici.trust + s.factions.papal.trust + s.factions.merc.trust) / 3;
  setDial(els.dialTrust, avgTrust / 100);

  for (const id of ["medici", "papal", "merc"]) {
    const mood = s.factions[id].trust > 60 ? "Favorable" : s.factions[id].trust < 40 ? "Wary" : "Neutral";
    els.moods[id].textContent = mood;
    const img = els.portraits[id];
    img.classList.toggle("mood-good", s.factions[id].trust > 60);
    img.classList.toggle("mood-bad", s.factions[id].trust < 40);
  }

  renderSerpents(s.virtu / 100, s.fortuna / 100);
}

export function showWax(show) {
  const el = els.wax;
  if (!el) return;
  el.classList.toggle("show", show);
}

export function saveGame() {
  localStorage.setItem("machiavelli_save", JSON.stringify(getState()));
  showWax(true);
  setTimeout(() => showWax(false), 900);
}

export function loadGame() {
  const data = localStorage.getItem("machiavelli_save");
  if (data) {
    const state = JSON.parse(data);
    initSim(state);
    refreshAll();
    inkSwipe();
  }
}

export function refreshAll() {
  const s = getState();
  drawFlorence(els.canvas.getContext("2d"), s);
  updateMap(els.mapCanvas.getContext("2d"), s);
  updateReputationUI();
  updateTurnUI();
}

