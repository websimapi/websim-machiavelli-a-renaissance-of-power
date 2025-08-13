let advisorHistory = [];
const systemPersona = `
You are the living political persona of Niccolò Machiavelli embodied as either the player or an advisor.
Speak in concise, historically grounded Renaissance rhetoric with subtle poetic cadence.
Keep responses actionable for a political-strategy simulation UI.
Always provide follow-up choices when requested.
`;

export async function initAI(){
  advisorHistory = [];
}

export async function parleyWithFaction(factionId, conversationHistory, state, respondOnly=false){
  const factionNames = {
    medici: "House Medici",
    papal: "the Papal Envoy",
    merc: "the Condottieri Captain"
  };
  const mood = state.factions[factionId].trust;
  const prompt = `
Setting: Florence, year ${state.year}. You are speaking as ${factionNames[factionId]}.
Their current trust is ${mood}/100. Standing: ${state.standing}. Stability: ${state.stability}.
User is Machiavelli negotiating. Respond in two or three sentences max, in era tone.

If asked for choices, propose 3 short options the player may take, each starting with a strong verb.

Return JSON only:
{
  "reply": string,
  "followups": { "text": string }[]
}
  `;
  let messages = [
    { role: "system", content: systemPersona },
    { role: "user", content: [
        { type:"text", text: prompt }
      ] }
  ];
  // append tail of conversation
  const tail = conversationHistory.slice(-8).map(m=>({ role:m.role, content: [{type:"text", text:m.content}] }));
  messages = messages.concat(tail);

  const completion = await websim.chat.completions.create({
    messages,
    json: true
  });

  try{
    const result = JSON.parse(completion.content);
    return respondOnly ? result : (result.followups || []);
  }catch(e){
    return respondOnly ? { reply:"...", followups:[] } : [];
  }
}

export async function draftDirectiveAI(state){
  const prompt = `
You are Machiavelli's advisor. Given this JSON state, propose one shrewd directive title and a one-sentence rationale.
Return JSON only: { "title": string, "rationale": string }
STATE:
${JSON.stringify(slimState(state))}
  `;
  const completion = await websim.chat.completions.create({
    messages: [
      { role:"system", content:"Respond only with JSON per the user's schema." },
      { role:"user", content: [{ type:"text", text: prompt }] }
    ],
    json: true
  });
  try{
    const result = JSON.parse(completion.content);
    return result;
  }catch(e){
    return null;
  }
}

export async function describeFortuna(state){
  const completion = await websim.chat.completions.create({
    messages: [
      { role:"system", content:"In one vivid clause (max 12 words), describe Fortuna's winds. No punctuation except commas." },
      { role:"user", content:[{ type:"text", text: `Standing: ${state.standing}, Stability: ${state.stability}, Virtu: ${state.virtu}, Fortuna: ${state.fortuna}` }]}
    ]
  });
  return completion.content.trim();
}

function slimState(s){
  return {
    turn:s.turn, year:s.year, stability:s.stability, capital:s.capital,
    virtu:s.virtu, fortuna:s.fortuna,
    factions: Object.fromEntries(Object.entries(s.factions).map(([k,v])=>[k, {trust:v.trust, power:v.power, stance:v.stance}]))
  };
}

