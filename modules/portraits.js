import { els } from "./elements.js";

let portraits = { medici: "", papal: "", merc: "" };

export async function ensurePortraits() {
  const prompts = {
    medici: "Oil-painted Renaissance portrait, House Medici patron, stern yet opulent, warm chiaroscuro, subtle gold trim, 3/4 profile, canvas texture",
    papal: "Oil-painted Renaissance portrait, Papal envoy in crimson mozzetta, intelligent eyes, candlelit shadows, illuminated manuscript vibe",
    merc: "Oil-painted Renaissance portrait, condottiero captain, weathered steel gorget, calculating gaze, smoky war room light"
  };
  for (const key of Object.keys(prompts)) {
    try {
      const res = await websim.imageGen({ prompt: prompts[key], aspect_ratio: "1:1", seed: key.length });
      portraits[key] = res.url;
      els.portraits[key].src = res.url;
    } catch (e) {
      els.portraits[key].alt = key + " portrait unavailable";
    }
  }
}

export function getPortraitUrl(factionId) {
  return portraits[factionId] || "";
}

