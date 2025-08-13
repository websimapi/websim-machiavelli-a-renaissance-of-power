let synth, bass, current = "minor";
let initialized = false;

export async function initAudio(Tone){
  if (initialized || !Tone) return;

  // Try to start audio context; browsers require a gesture, so this may fail harmlessly.
  try { if (typeof Tone.start === "function") await Tone.start(); } catch(e){ /* will start on next gesture */ }

  // Safe now retrieval across Tone builds
  let now;
  try {
    if (typeof Tone.now === "function") now = Tone.now();
    else if (Tone.getContext && typeof Tone.getContext === "function") now = Tone.getContext().now();
  } catch(e){ now = undefined; }

  // Instruments
  const PolySynth = Tone.PolySynth || (Tone?.Synth && Tone?.PolySynth); // fallback
  const MonoSynth = Tone.MonoSynth || (Tone?.Synth && Tone?.MonoSynth);

  synth = new PolySynth(Tone.Synth, {
    oscillator:{ type:"triangle" },
    envelope:{ attack:0.02, decay:0.2, sustain:0.2, release:0.6 }
  }).toDestination();

  bass = new MonoSynth({
    oscillator:{ type:"sawtooth" },
    filter: { Q: 2, type:"lowpass", rolloff:-12 },
    envelope:{ attack:0.03, decay:0.3, sustain:0.2, release:0.8 }
  }).toDestination();

  // Transport
  if (Tone?.Transport){
    Tone.Transport.bpm.value = 78;
    try {
      if (Tone.Transport.state !== "started") {
        // start immediately if no clock, or a slight delay if we have now
        Tone.Transport.start(now ? now + 0.1 : undefined);
      }
    } catch(e){ /* ignore */ }
  }

  // Musical patterns
  const Pattern = Tone.Pattern || Tone.Sequence;
  const Loop = Tone.Loop || Tone.Transport?.scheduleRepeat;

  const pattern = new Pattern((time, note)=>{
    synth.triggerAttackRelease(note, "8n", time);
  }, scale("minor"), "upDown");

  let bassPart;
  if (Loop){
    bassPart = new Loop((time)=>{
      bass.triggerAttackRelease(current==="minor" ? "A2" : "C3", "8n", time);
    }, "2n");
  }

  pattern.start(0);
  if (bassPart?.start) bassPart.start(0.5);

  // Reverb if available
  if (Tone.Reverb){
    const reverb = new Tone.Reverb({ decay:2.4, wet:0.25 }).toDestination();
    synth.connect(reverb);
  }

  initialized = true;
}

export function setMode(mode){
  current = mode;
}

function scale(mode){
  return mode==="minor"
    ? ["A3","C4","D4","E4","G4","A4"]
    : ["C4","E4","G4","A4","B4","C5"];
}