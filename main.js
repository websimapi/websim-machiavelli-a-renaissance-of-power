import Tone from "tone";
import { initAudio } from "./modules/audio.js";
import { initAI } from "./modules/ai.js";
import { initSim } from "./modules/simulation.js";
import { drawFlorence, init2_5D, inkSwipe, fitCanvasToDisplay } from "./modules/ui.js";
import { initMap } from "./modules/worldmap.js";
import { els } from "./modules/elements.js";
import { setupEventListeners, setRefreshHandler } from "./modules/events.js";
import { ensurePortraits } from "./modules/portraits.js";
import { refreshAll, updateReputationUI } from "./modules/game.js";
import { openHelp } from "./modules/tour.js";

async function startNewCampaign(showTour = false) {
  inkSwipe(true);
  initSim();
  await ensurePortraits();
  await initAI();
  await initAudio(Tone);
  
  // Ensure canvas elements exist before initializing
  if (els.canvas) {
    init2_5D(els.canvas);
    fitCanvasToDisplay(els.canvas);
  }
  if (els.mapCanvas) {
    initMap(els.mapCanvas);
    fitCanvasToDisplay(els.mapCanvas);
  }
  if (els.serpentsCanvas) {
    fitCanvasToDisplay(els.serpentsCanvas);
  }
  
  refreshAll();
  
  const line = document.createElement("div");
  line.textContent = "Welcome, Secretary. Open How to Play for a short primer, or take the Guided Tour.";
  els.log.prepend(line);
  
  if (showTour) {
    setTimeout(() => openHelp(), 400);
  }
  setTimeout(() => inkSwipe(false), 600);
}

// Initialize the application
async function init() {
  setRefreshHandler(refreshAll);
  setupEventListeners();
  
  els.newGameBtn.addEventListener("click", async () => {
    await startNewCampaign(true);
  });

  // Start the campaign
  await startNewCampaign();
}

// Boot the application
init();