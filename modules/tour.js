import { els } from "../main.js";

const tourSteps = [
  { el: () => document.querySelector(".tokens"), text: "Drag these covert tokens onto the map or a faction portrait to act in shadows." },
  { el: () => document.querySelector(".mini-map"), text: "This miniature map shows shifting influence. Drop tokens on its labeled zones." },
  { el: () => document.querySelector(".factions"), text: "Parley with factions here. Their trust changes based on your words and deeds." },
  { el: () => document.querySelector(".meters"), text: "Track your capital, public perception, and trust. Keep the dials healthy." },
  { el: () => els.dialogue, text: "In dialogue, pick a line or compose your own. Choices breed consequences." },
  { el: () => els.endTurnBtn, text: "Click End Turn to advance time and trigger Fortuna's events. Or wait for auto-turn." },
];
let tourIndex = 0;

export function openHelp() {
  els.helpModal.classList.remove("hidden");
}

export function closeHelp() {
  els.helpModal.classList.add("hidden");
}

export function startTour() {
  tourIndex = 0;
  els.tourOverlay.classList.remove("hidden");
  showStep();
}

export function endTour() {
  els.tourOverlay.classList.add("hidden");
  clearPulse();
}

function clearPulse() {
  document.querySelectorAll(".pulse").forEach(el => el.classList.remove("pulse"));
}

function showStep() {
  clearPulse();
  const step = tourSteps[tourIndex];
  const target = step.el();
  if (!target) { endTour(); return; }
  target.classList.add("pulse");
  const rect = target.getBoundingClientRect();
  const bubble = els.tourBubble;
  bubble.style.left = Math.min(window.innerWidth - 340, Math.max(12, rect.left + rect.width + 12)) + "px";
  bubble.style.top = Math.min(window.innerHeight - 200, Math.max(12, rect.top)) + "px";
  els.tourText.textContent = step.text;
}

export function tourNext() {
  tourIndex = Math.min(tourSteps.length - 1, tourIndex + 1);
  showStep();
}

export function tourPrev() {
  tourIndex = Math.max(0, tourIndex - 1);
  showStep();
}