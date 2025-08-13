import { els } from "../main.js";
import { applyCovertAction, onLog } from "./simulation.js";
import { setScene, inkSwipe, fitCanvasToDisplay } from "./ui.js";
import { openDialogue, sendComposedMessage, closeDialogue, setPortraitGetter } from "./dialogue.js";
import { getPortraitUrl } from "./portraits.js";
import { openHelp, closeHelp, startTour, endTour, tourNext, tourPrev } from "./tour.js";
import { saveGame, loadGame, endTurn } from "./game.js";
import { draftDirectiveAI } from "./ai.js";
import { getState } from "./simulation.js";
import { initAudio } from "./audio.js";
import Tone from "tone";

let audioEnabled = true;
let touchDrag = null;

export function setupEventListeners() {
  // Set up portrait getter for dialogue
  setPortraitGetter(getPortraitUrl);

  // Log system
  onLog((m) => {
    const line = document.createElement("div");
    line.textContent = m;
    els.log.prepend(line);
  });

  // Audio initialization and toggle
  window.addEventListener("pointerdown", async function once() {
    await initAudio(Tone);
    window.removeEventListener("pointerdown", once, { capture: false });
  }, { capture: false, once: true });

  els.audioToggleBtn.addEventListener("click", async () => {
    audioEnabled = !audioEnabled;
    els.audioToggleBtn.setAttribute("aria-pressed", String(audioEnabled));
    els.audioToggleBtn.textContent = audioEnabled ? "🔈" : "🔇";
    if (audioEnabled) { await initAudio(Tone); }
    log(audioEnabled ? "Audio enabled." : "Audio muted.");
  });

  // UI toggles and navigation
  els.codexToggle.addEventListener("click", () => {
    els.codex.classList.toggle("collapsed");
  });

  els.toCourtyard.addEventListener("click", () => setScene("courtyard"));
  els.toMarket.addEventListener("click", () => setScene("market"));
  els.toCouncil.addEventListener("click", () => setScene("council"));
  els.toWarRoom.addEventListener("click", () => setScene("warroom"));

  // Drag and drop setup
  setupDragAndDrop();

  // Dialogue events
  setupDialogueEvents();

  // Game control events
  setupGameControlEvents();

  // Help and tour events
  setupHelpEvents();

  // Toggle events
  setupToggleEvents();

  // Auto-turn interval
  setupAutoTurn();

  // Resize handler
  window.addEventListener("resize", () => {
    fitCanvasToDisplay(els.canvas);
    fitCanvasToDisplay(els.mapCanvas);
    fitCanvasToDisplay(els.serpentsCanvas);
    refreshAll();
  }, { passive: true });
}

function setupDragAndDrop() {
  // Mouse drag
  els.tokens.forEach(t => {
    t.addEventListener("dragstart", e => {
      e.dataTransfer.setData("text/plain", t.dataset.action);
    });
  });

  // Touch drag
  els.tokens.forEach(t => {
    t.addEventListener("touchstart", (e) => {
      const touch = e.touches[0];
      touchDrag = { action: t.dataset.action, el: t };
      document.body.classList.add("dragging");
      e.preventDefault();
    }, { passive: false });
  });

  window.addEventListener("touchmove", (e) => {
    if (!touchDrag) return;
    const touch = e.touches[0];
    const target = getDropTargetFromPoint(touch.clientX, touch.clientY);
    document.querySelectorAll(".dropzone, .portrait-drop").forEach(z => z.classList.toggle("hover", z === target));
  }, { passive: true });

  window.addEventListener("touchend", (e) => {
    if (!touchDrag) return;
    const touch = e.changedTouches[0];
    const target = getDropTargetFromPoint(touch.clientX, touch.clientY);
    document.querySelectorAll(".dropzone, .portrait-drop").forEach(z => z.classList.remove("hover"));
    if (target) {
      handleDrop(target, touchDrag.action);
    }
    touchDrag = null;
    document.body.classList.remove("dragging");
  });

  // Drop zones
  [...els.dropzones, ...els.portraitDrops].forEach(dz => {
    dz.addEventListener("dragover", e => e.preventDefault());
    dz.addEventListener("drop", e => {
      e.preventDefault();
      const data = e.dataTransfer.getData("text/plain");
      handleDrop(dz, data);
    });
  });
}

function setupDialogueEvents() {
  els.talkBtns.forEach(btn => {
    btn.addEventListener("click", async () => {
      const faction = btn.dataset.faction;
      await openDialogue(faction);
    });
  });

  els.composeSend.addEventListener("click", sendComposedMessage);
  els.closeDialogue.addEventListener("click", closeDialogue);
}

function setupGameControlEvents() {
  els.endTurnBtn.addEventListener("click", async () => {
    inkSwipe();
    await endTurn();
  });

  els.saveBtn.addEventListener("click", saveGame);
  els.loadBtn.addEventListener("click", loadGame);

  els.draftDirectiveBtn.addEventListener("click", async () => {
    const suggestion = await draftDirectiveAI(getState());
    if (!suggestion) return;
    const li = document.createElement("li");
    li.textContent = `${suggestion.title} — ${suggestion.rationale}`;
    els.directivesList.prepend(li);
    log(`Directive drafted: ${suggestion.title}`);
  });
}

function setupHelpEvents() {
  els.helpBtn.addEventListener("click", openHelp);
  els.closeHelp.addEventListener("click", closeHelp);
  els.startTourBtn.addEventListener("click", () => {
    closeHelp();
    startTour();
  });
  els.tourNext.addEventListener("click", tourNext);
  els.tourPrev.addEventListener("click", tourPrev);
  els.tourExit.addEventListener("click", endTour);
}

function setupToggleEvents() {
  els.aiAdvisorToggle.addEventListener("change", () => {
    const enabled = els.aiAdvisorToggle.checked;
    log(enabled ? "AI Advisor summoned." : "AI Advisor dismissed.");
  });

  els.autopilotToggle.addEventListener("change", () => {
    const enabled = els.autopilotToggle.checked;
    log(enabled ? "Autopilot engaged." : "Autopilot disengaged.");
  });
}

function setupAutoTurn() {
  setInterval(async () => {
    if (document.hidden) return;
    if (els.autopilotToggle.checked) {
      const suggestion = await draftDirectiveAI(getState());
      if (suggestion) {
        log("AI Advisor: " + suggestion.title);
      }
    }
    await endTurn();
  }, 18000);
}

// Helper functions
function getDropTargetFromPoint(x, y) {
  const el = document.elementFromPoint(x, y);
  if (!el) return null;
  const dz = el.closest(".dropzone, .portrait-drop");
  return dz || null;
}

function handleDrop(target, data) {
  const zone = target.dataset.zone || null;
  const faction = target.dataset.faction || null;
  applyCovertAction({ action: data, zone, faction });
  inkSwipe();
}

function log(msg) {
  const line = document.createElement("div");
  line.textContent = msg;
  els.log.prepend(line);
}

// Import refreshAll from game module when needed
let refreshAll;
export function setRefreshHandler(fn) {
  refreshAll = fn;
}