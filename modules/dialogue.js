import { els } from "../main.js";
import { parleyWithFaction } from "./ai.js";
import { getState } from "./simulation.js";
import { updateReputationUI } from "../main.js";

let conversationHistory = [];
let currentDialogueFaction = null;

export function addMessage(role, text) {
  const m = document.createElement("div");
  m.className = "message " + (role === "you" ? "you" : "them");
  m.textContent = text;
  els.conversation.appendChild(m);
  els.conversation.scrollTop = els.conversation.scrollHeight;
}

export async function openDialogue(factionId) {
  const state = getState();
  currentDialogueFaction = factionId;
  els.dialogue.classList.add("show");
  els.dialoguePortrait.src = await getPortraitUrl(factionId);
  els.conversation.innerHTML = "";
  addMessage("them", `You stand before the ${state.factions[factionId].name}. Choose your words with care.`);
  const aiChoices = await parleyWithFaction(factionId, conversationHistory, state);
  renderChoices(aiChoices, factionId);
}

function renderChoices(choices, factionId) {
  els.choices.innerHTML = "";
  choices.forEach((c) => {
    const b = document.createElement("button");
    b.className = "btn";
    b.textContent = c.text;
    b.addEventListener("click", async () => {
      addMessage("you", c.text);
      conversationHistory.push({ role: "user", content: c.text });
      conversationHistory = conversationHistory.slice(-10);
      const reply = await parleyWithFaction(factionId, conversationHistory, getState(), true);
      addMessage("them", reply.reply);
      conversationHistory.push({ role: "assistant", content: reply.reply });
      updateReputationUI();
      if (reply.followups && reply.followups.length) renderChoices(reply.followups, factionId);
      else els.choices.innerHTML = "";
    });
    els.choices.appendChild(b);
  });
}

export async function sendComposedMessage() {
  const msg = els.composeInput.value.trim();
  if (!msg) return;
  addMessage("you", msg);
  conversationHistory.push({ role: "user", content: msg });
  conversationHistory = conversationHistory.slice(-10);
  const reply = await parleyWithFaction(currentDialogueFaction || "medici", conversationHistory, getState(), true);
  addMessage("them", reply.reply);
  conversationHistory.push({ role: "assistant", content: reply.reply });
  els.composeInput.value = "";
  updateReputationUI();
}

export function closeDialogue() {
  els.dialogue.classList.remove("show");
  currentDialogueFaction = null;
}

// Import from portraits module when it's available
let getPortraitUrl;
export function setPortraitGetter(fn) {
  getPortraitUrl = fn;
}