let synth, bass, current = "minor";
let initialized = false;
let transportStarted = false;

// New: keep references to scheduled events to avoid duplicates
let schedMelodyId = null;
let schedBassId = null;
let noteIndex = 0;

export async function initAudio(Tone){
  if (initialized || !Tone) return;

  // Start AudioContext on user gesture (may noop if already running)
  try { if (typeof Tone.start === "function") await Tone.start(); } catch(e){ /* ignore */ }

  // Instruments
  const PolySynth = Tone.PolySynth || (Tone?.Synth && Tone?.PolySynth);
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

  // Reverb if available
  if (Tone.Reverb){
    const reverb = new Tone.Reverb({ decay:2.4, wet:0.25 }).toDestination();
    synth.connect(reverb);
  }

  // Configure transport safely
  if (Tone?.Transport){
    Tone.Transport.bpm.value = 78;

    // Clear any pre-existing scheduled events (defensive)
    if (schedMelodyId !== null) { Tone.Transport.clear(schedMelodyId); schedMelodyId = null; }
    if (schedBassId !== null) { Tone.Transport.clear(schedBassId); schedBassId = null; }

    // Schedule melody with slight epsilon offset to avoid equal-time retriggers
    schedMelodyId = Tone.Transport.scheduleRepeat((time)=>{
      const scaleNotes = scale(current);
      const note = scaleNotes[noteIndex % scaleNotes.length];
      // tiny offset prevents "Start time must be strictly greater" in some browsers
      synth.triggerAttackRelease(note, "8n", time + 0.0005);
      noteIndex++;
    }, "8n");

    // Schedule bass
    schedBassId = Tone.Transport.scheduleRepeat((time)=>{
      const note = current === "minor" ? "A2" : "C3";
      bass.triggerAttackRelease(note, "8n", time + 0.0005);
    }, "2n");

    // Start transport once
    try {
      if (Tone.Transport.state !== "started") {
        Tone.Transport.start("+0.05"); // slight delay to ensure proper ordering
      }
      transportStarted = true;
    } catch(e){
      transportStarted = false; // will retry on next user interaction
    }

    // Handle page visibility to reduce glitches
    const onVis = ()=>{
      try{
        if (document.hidden){
          if (Tone.Transport.state === "started") Tone.Transport.pause();
        }else{
          // resume only if we had started before
          if (transportStarted && Tone.Transport.state !== "started"){
            Tone.Transport.start("+0.05");
          }
        }
      }catch(_e){}
    };
    document.removeEventListener("visibilitychange", onVis);
    document.addEventListener("visibilitychange", onVis, { passive:true });
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