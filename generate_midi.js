#!/usr/bin/env node
/**
 * GTA VI: VICE OVERHEAD — Multi-Track Standard MIDI File (.mid) Generator
 * Generates 6 authentic Format-1 multi-track .mid files in ./music/
 *   1. vice_synthwave.mid      (VICE SYNTH 104.9 - 80s Outrun Synthwave)
 *   2. leonida_bass_fm.mid     (LEONIDA BASS 98.3 - Miami 808 Hip-Hop & Funk Bass)
 *   3. gator_rock_fm.mid       (GATOR ROCK 101.5 - Driving Bayou Distortion Rock)
 *   4. cyber_electro_fm.mid    (CYBER PULSE 107.7 - Dark Cyberpunk Darksynth / Electro)
 *   5. action_chase_heat.mid   (WANTED / POLICE CHASE - High-Octane Action Breakbeat)
 *   6. street_prowl_theme.mid  (ON-FOOT ROAM - Cool Neon Noir Detective / Street Groove)
 */

const fs = require('fs');
const path = require('path');

const outDir = path.join(__dirname, 'music');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// Helper: Encode Variable-Length Quantity (VLQ) for MIDI delta times
function writeVLQ(val) {
  let buffer = [val & 0x7f];
  while ((val >>= 7) > 0) {
    buffer.unshift((val & 0x7f) | 0x80);
  }
  return buffer;
}

// Helper: Build a single MTrk chunk from an array of absolute-tick events
// Event format: { tick, type: 'noteOn'|'noteOff'|'program'|'tempo'|'trackName', channel, note, vel, program, bpm, text }
function buildTrack(events) {
  // Sort by tick, with program/tempo before noteOff before noteOn at same tick
  const order = { tempo: 0, trackName: 1, program: 2, noteOff: 3, noteOn: 4 };
  events.sort((a, b) => (a.tick - b.tick) || ((order[a.type] || 9) - (order[b.type] || 9)));

  const bytes = [];
  let lastTick = 0;

  for (const ev of events) {
    const delta = Math.max(0, Math.round(ev.tick - lastTick));
    lastTick = ev.tick;
    bytes.push(...writeVLQ(delta));

    if (ev.type === 'tempo') {
      const mpqn = Math.round(60000000 / ev.bpm);
      bytes.push(0xff, 0x51, 0x03, (mpqn >> 16) & 0xff, (mpqn >> 8) & 0xff, mpqn & 0xff);
    } else if (ev.type === 'trackName') {
      const strBytes = Buffer.from(ev.text, 'ascii');
      bytes.push(0xff, 0x03, ...writeVLQ(strBytes.length), ...strBytes);
    } else if (ev.type === 'program') {
      bytes.push(0xc0 | (ev.channel & 0x0f), ev.program & 0x7f);
    } else if (ev.type === 'noteOn') {
      bytes.push(0x90 | (ev.channel & 0x0f), ev.note & 0x7f, ev.vel & 0x7f);
    } else if (ev.type === 'noteOff') {
      bytes.push(0x80 | (ev.channel & 0x0f), ev.note & 0x7f, 0x00);
    }
  }

  // End of Track meta event
  bytes.push(0x00, 0xff, 0x2f, 0x00);

  const trackBuf = Buffer.from(bytes);
  const header = Buffer.alloc(8);
  header.write('MTrk', 0, 4, 'ascii');
  header.writeUInt32BE(trackBuf.length, 4);
  return Buffer.concat([header, trackBuf]);
}

// Helper: Build complete Format-1 Standard MIDI File (.mid)
function buildMidiFile(ppq, tracksEvents) {
  const trackBuffers = tracksEvents.map(buildTrack);
  const header = Buffer.alloc(14);
  header.write('MThd', 0, 4, 'ascii');
  header.writeUInt32BE(6, 4);
  header.writeUInt16BE(1, 8); // Format 1 (multi-track)
  header.writeUInt16BE(trackBuffers.length, 10);
  header.writeUInt16BE(ppq, 12);
  return Buffer.concat([header, ...trackBuffers]);
}

function addNote(arr, channel, note, startTick, durationTicks, vel = 100) {
  arr.push({ tick: startTick, type: 'noteOn', channel, note, vel });
  arr.push({ tick: startTick + durationTicks, type: 'noteOff', channel, note, vel: 0 });
}

const PPQ = 480; // 480 ticks per quarter note
const STEP = PPQ / 4; // 16th note = 120 ticks

// ============================================================================
// 1. VICE SYNTH 104.9 — "vice_synthwave.mid" (118 BPM, A Minor -> F -> C -> G)
// ============================================================================
function createViceSynthwave() {
  const t0 = [{ tick: 0, type: 'trackName', text: 'Vice Synthwave Tempo' }, { tick: 0, type: 'tempo', bpm: 118 }];
  const bass = [{ tick: 0, type: 'trackName', text: 'Analog Synth Bass' }, { tick: 0, type: 'program', channel: 0, program: 38 }];
  const chords = [{ tick: 0, type: 'trackName', text: 'Warm Polysynth Pad' }, { tick: 0, type: 'program', channel: 1, program: 81 }];
  const lead = [{ tick: 0, type: 'trackName', text: 'Outrun Lead Synth' }, { tick: 0, type: 'program', channel: 2, program: 80 }];
  const arp = [{ tick: 0, type: 'trackName', text: 'Neon Arpeggiator' }, { tick: 0, type: 'program', channel: 3, program: 88 }];
  const drums = [{ tick: 0, type: 'trackName', text: 'LinnDrum 80s Kit' }];

  // 8 Bars (128 16th-note steps)
  const progRoots = [45, 45, 41, 41, 48, 48, 43, 43]; // A2, A2, F2, F2, C3, C3, G2, G2
  const progChords = [
    [57, 60, 64, 69], [57, 60, 64, 67],
    [53, 57, 60, 65], [53, 57, 60, 64],
    [60, 64, 67, 72], [60, 64, 67, 71],
    [55, 59, 62, 67], [55, 59, 62, 65]
  ];

  const leadMelody = [
    // Bar 1-2 (Am)
    [0, 69, 3], [3, 72, 3], [6, 76, 4], [10, 74, 2], [12, 72, 4],
    [16, 69, 6], [22, 67, 2], [24, 69, 8],
    // Bar 3-4 (F)
    [32, 65, 3], [35, 69, 3], [38, 72, 4], [42, 76, 2], [44, 74, 4],
    [48, 72, 6], [54, 69, 2], [56, 67, 8],
    // Bar 5-6 (C)
    [64, 72, 3], [67, 76, 3], [70, 79, 4], [74, 76, 2], [76, 74, 4],
    [80, 72, 4], [84, 74, 4], [88, 76, 8],
    // Bar 7-8 (G)
    [96, 74, 3], [99, 71, 3], [102, 67, 4], [106, 71, 2], [108, 74, 4],
    [112, 76, 4], [116, 74, 4], [120, 71, 8]
  ];

  for (let bar = 0; bar < 8; bar++) {
    const barTick = bar * 16 * STEP;
    const root = progRoots[bar];
    const chord = progChords[bar];

    // Sustained Pad Chords + Stabs
    for (const n of chord) {
      addNote(chords, 1, n, barTick, 6 * STEP, 72);
      addNote(chords, 1, n, barTick + 6 * STEP, 6 * STEP, 68);
      addNote(chords, 1, n, barTick + 12 * STEP, 4 * STEP, 74);
    }

    // Driving 16th-note octave synth bassline
    for (let s = 0; s < 16; s++) {
      const note = (s % 2 === 1) ? root + 12 : root;
      addNote(bass, 0, note, barTick + s * STEP, STEP * 0.85, s % 4 === 0 ? 112 : 92);

      // Shimmering 16th arpeggio
      const arpNote = chord[s % chord.length] + 12;
      addNote(arp, 3, arpNote, barTick + s * STEP, STEP * 0.75, 68);

      // Drums (Ch 9): Kick on 0, 4, 8, 12 (+ syncopated 14), Snare on 4, 12, Hats every step
      const st = barTick + s * STEP;
      if (s === 0 || s === 4 || s === 8 || s === 12 || (bar % 2 === 1 && s === 14)) {
        addNote(drums, 9, 36, st, STEP, 118); // Kick
      }
      if (s === 4 || s === 12) {
        addNote(drums, 9, 38, st, STEP, 112); // Gated Reverb Snare
        addNote(drums, 9, 39, st, STEP, 85);  // Clap layer
      }
      addNote(drums, 9, s % 4 === 2 ? 46 : 42, st, STEP * 0.6, s % 2 === 0 ? 85 : 64); // Hi-hats
      if (s === 0 && bar % 4 === 0) {
        addNote(drums, 9, 49, st, STEP * 4, 95); // Crash cymbal
      }
    }
  }

  for (const [stepIdx, note, lenSteps] of leadMelody) {
    addNote(lead, 2, note, stepIdx * STEP, lenSteps * STEP * 0.92, 108);
  }

  return buildMidiFile(PPQ, [t0, bass, chords, lead, arp, drums]);
}

// ============================================================================
// 2. LEONIDA BASS 98.3 — "leonida_bass_fm.mid" (96 BPM, Miami 808 Hip-Hop / G-Funk)
// ============================================================================
function createLeonidaBass() {
  const t0 = [{ tick: 0, type: 'trackName', text: 'Leonida Bass Tempo' }, { tick: 0, type: 'tempo', bpm: 96 }];
  const bass = [{ tick: 0, type: 'trackName', text: '808 Sub Bass' }, { tick: 0, type: 'program', channel: 0, program: 39 }];
  const keys = [{ tick: 0, type: 'trackName', text: 'Electric Piano Chords' }, { tick: 0, type: 'program', channel: 1, program: 4 }];
  const whistle = [{ tick: 0, type: 'trackName', text: 'G-Funk Whistle Lead' }, { tick: 0, type: 'program', channel: 2, program: 80 }];
  const brass = [{ tick: 0, type: 'trackName', text: 'Miami Brass Hits' }, { tick: 0, type: 'program', channel: 3, program: 62 }];
  const drums = [{ tick: 0, type: 'trackName', text: 'TR-808 Boom Kit' }];

  // C Minor -> Ab Major -> Fm7 -> G7
  const roots = [36, 36, 44, 44, 41, 41, 43, 43];
  const chords = [
    [60, 63, 67, 70], [60, 63, 67, 70],
    [56, 60, 63, 67], [56, 60, 63, 67],
    [53, 56, 60, 65], [53, 56, 60, 65],
    [55, 59, 62, 65], [55, 59, 62, 68]
  ];

  const funkLead = [
    [0, 72, 2], [2, 75, 2], [4, 79, 4], [8, 77, 2], [10, 75, 2], [12, 72, 4],
    [18, 70, 2], [20, 72, 6],
    [32, 72, 2], [34, 75, 2], [36, 80, 4], [40, 79, 2], [42, 75, 2], [44, 72, 4],
    [64, 68, 3], [67, 72, 3], [70, 77, 4], [74, 75, 2], [76, 72, 4],
    [96, 71, 2], [98, 74, 2], [100, 79, 4], [104, 77, 2], [106, 74, 2], [108, 71, 4]
  ];

  for (let bar = 0; bar < 8; bar++) {
    const bt = bar * 16 * STEP;
    const r = roots[bar];
    const ch = chords[bar];

    // Syncopated 808 Sub Bass
    const bassPattern = [[0, 3, r], [3, 3, r], [6, 2, r + 12], [10, 3, r], [14, 2, r + 7]];
    for (const [s, d, n] of bassPattern) {
      addNote(bass, 0, n, bt + s * STEP, d * STEP * 0.9, 120);
    }

    // Rhodes Chords on beat 1 & 3
    for (const n of ch) {
      addNote(keys, 1, n, bt, 4 * STEP, 78);
      addNote(keys, 1, n, bt + 8 * STEP, 4 * STEP, 76);
      addNote(keys, 1, n, bt + 14 * STEP, 2 * STEP, 70);
    }

    // Brass stabs on bar start
    if (bar % 2 === 0) {
      for (const n of ch) addNote(brass, 3, n - 12, bt, 2 * STEP, 102);
    }

    // Boom-bap + Trap hi-hat rolls
    for (let s = 0; s < 16; s++) {
      const st = bt + s * STEP;
      if (s === 0 || s === 3 || s === 6 || s === 10) addNote(drums, 9, 36, st, STEP, 122);
      if (s === 4 || s === 12) {
        addNote(drums, 9, 38, st, STEP, 114);
        addNote(drums, 9, 39, st, STEP, 100);
      }
      addNote(drums, 9, 42, st, STEP * 0.5, 82);
      if (s === 7 || s === 15) {
        // 32nd-note hat roll
        addNote(drums, 9, 42, st + STEP * 0.5, STEP * 0.4, 74);
      }
    }
  }

  for (const [s, n, d] of funkLead) {
    addNote(whistle, 2, n, s * STEP, d * STEP * 0.95, 104);
  }

  return buildMidiFile(PPQ, [t0, bass, keys, whistle, brass, drums]);
}

// ============================================================================
// 3. GATOR ROCK 101.5 — "gator_rock_fm.mid" (134 BPM, Bayou Overdrive Rock)
// ============================================================================
function createGatorRock() {
  const t0 = [{ tick: 0, type: 'trackName', text: 'Gator Rock Tempo' }, { tick: 0, type: 'tempo', bpm: 134 }];
  const bass = [{ tick: 0, type: 'trackName', text: 'Picked Rock Bass' }, { tick: 0, type: 'program', channel: 0, program: 34 }];
  const rhythmGtr = [{ tick: 0, type: 'trackName', text: 'Overdrive Power Chords' }, { tick: 0, type: 'program', channel: 1, program: 30 }];
  const soloGtr = [{ tick: 0, type: 'trackName', text: 'Lead Shred Guitar' }, { tick: 0, type: 'program', channel: 2, program: 29 }];
  const drums = [{ tick: 0, type: 'trackName', text: 'Heavy Stadium Drums' }];

  // E5 -> G5 -> A5 -> C5 / D5
  const roots = [40, 40, 43, 43, 45, 45, 48, 50];
  const soloNotes = [
    [0, 64, 2], [2, 67, 2], [4, 69, 2], [6, 71, 2], [8, 74, 4], [12, 71, 4],
    [16, 69, 2], [18, 67, 2], [20, 64, 4], [24, 67, 4], [28, 69, 4],
    [32, 71, 3], [35, 74, 3], [38, 76, 4], [42, 74, 2], [44, 71, 4],
    [48, 69, 4], [52, 67, 4], [56, 64, 8],
    [64, 76, 2], [66, 79, 2], [68, 81, 4], [72, 79, 2], [74, 76, 2], [76, 74, 4],
    [80, 76, 4], [84, 74, 4], [88, 71, 8],
    [96, 72, 2], [98, 74, 2], [100, 76, 4], [104, 79, 4], [108, 76, 4],
    [112, 74, 2], [114, 76, 2], [116, 79, 4], [120, 81, 8]
  ];

  for (let bar = 0; bar < 8; bar++) {
    const bt = bar * 16 * STEP;
    const r = roots[bar];

    for (let s = 0; s < 16; s += 2) {
      const st = bt + s * STEP;
      // Chugging 8th-note bass & power chords (root + fifth + octave)
      addNote(bass, 0, r, st, STEP * 1.7, 114);
      const riffOffset = (s === 6 || s === 14) ? 3 : 0;
      addNote(rhythmGtr, 1, r + 12 + riffOffset, st, STEP * 1.8, 102);
      addNote(rhythmGtr, 1, r + 19 + riffOffset, st, STEP * 1.8, 98);
      addNote(rhythmGtr, 1, r + 24 + riffOffset, st, STEP * 1.8, 92);
    }

    for (let s = 0; s < 16; s++) {
      const st = bt + s * STEP;
      if (s === 0 || s === 2 || s === 6 || s === 8 || s === 10) addNote(drums, 9, 36, st, STEP, 120);
      if (s === 4 || s === 12) addNote(drums, 9, 38, st, STEP, 118);
      if (s % 2 === 0) addNote(drums, 9, 46, st, STEP, 90);
      if (bar % 2 === 1 && s >= 12) addNote(drums, 9, 45, st, STEP, 108); // Tom fill
    }
  }

  for (const [s, n, d] of soloNotes) {
    addNote(soloGtr, 2, n, s * STEP, d * STEP * 0.9, 112);
  }

  return buildMidiFile(PPQ, [t0, bass, rhythmGtr, soloGtr, drums]);
}

// ============================================================================
// 4. CYBER PULSE 107.7 — "cyber_electro_fm.mid" (128 BPM, Cyberpunk Darksynth)
// ============================================================================
function createCyberElectro() {
  const t0 = [{ tick: 0, type: 'trackName', text: 'Cyber Electro Tempo' }, { tick: 0, type: 'tempo', bpm: 128 }];
  const bass = [{ tick: 0, type: 'trackName', text: 'Reese Saw Bass' }, { tick: 0, type: 'program', channel: 0, program: 81 }];
  const arp = [{ tick: 0, type: 'trackName', text: 'Cyber Acid Arp' }, { tick: 0, type: 'program', channel: 1, program: 38 }];
  const lead = [{ tick: 0, type: 'trackName', text: 'Darksynth Brass Lead' }, { tick: 0, type: 'program', channel: 2, program: 62 }];
  const drums = [{ tick: 0, type: 'trackName', text: 'Industrial Techno Kit' }];

  // D Minor Phrygian Dark Progression: D -> Eb -> Bb -> A
  const roots = [38, 38, 39, 39, 34, 34, 33, 33];
  const arpPattern = [0, 3, 7, 12, 7, 3, 10, 7, 0, 3, 7, 12, 15, 12, 7, 3];

  const darkLead = [
    [0, 62, 6], [6, 65, 2], [8, 69, 8],
    [16, 67, 4], [20, 65, 4], [24, 62, 8],
    [32, 63, 6], [38, 67, 2], [40, 70, 8],
    [48, 69, 4], [52, 67, 4], [56, 63, 8],
    [64, 58, 6], [70, 62, 2], [72, 65, 8],
    [80, 67, 4], [84, 65, 4], [88, 62, 8],
    [96, 61, 6], [102, 64, 2], [104, 69, 8],
    [112, 70, 4], [116, 69, 4], [120, 61, 8]
  ];

  for (let bar = 0; bar < 8; bar++) {
    const bt = bar * 16 * STEP;
    const r = roots[bar];

    for (let s = 0; s < 16; s++) {
      const st = bt + s * STEP;
      // Relentless 16th-note darksynth bass
      addNote(bass, 0, s % 4 === 3 ? r + 12 : r, st, STEP * 0.85, 114);
      // Acid sequence
      addNote(arp, 1, r + 12 + arpPattern[s], st, STEP * 0.7, 88);

      // Four-on-the-floor industrial kick + offbeat open hi-hat
      if (s % 4 === 0) addNote(drums, 9, 36, st, STEP, 124);
      if (s === 4 || s === 12) addNote(drums, 9, 38, st, STEP, 115);
      if (s % 4 === 2) addNote(drums, 9, 46, st, STEP, 92);
      else addNote(drums, 9, 42, st, STEP * 0.5, 72);
    }
  }

  for (const [s, n, d] of darkLead) {
    addNote(lead, 2, n, s * STEP, d * STEP * 0.92, 108);
    addNote(lead, 2, n + 12, s * STEP, d * STEP * 0.92, 92);
  }

  return buildMidiFile(PPQ, [t0, bass, arp, lead, drums]);
}

// ============================================================================
// 5. ACTION CHASE HEAT — "action_chase_heat.mid" (146 BPM, Police Pursuit & Combat)
// ============================================================================
function createActionChase() {
  const t0 = [{ tick: 0, type: 'trackName', text: 'Action Chase Tempo' }, { tick: 0, type: 'tempo', bpm: 146 }];
  const bass = [{ tick: 0, type: 'trackName', text: 'Urgent Chase Bass' }, { tick: 0, type: 'program', channel: 0, program: 38 }];
  const stabs = [{ tick: 0, type: 'trackName', text: 'Orchestral Action Hits' }, { tick: 0, type: 'program', channel: 1, program: 55 }];
  const sirenSynth = [{ tick: 0, type: 'trackName', text: 'Pursuit Tension Arp' }, { tick: 0, type: 'program', channel: 2, program: 81 }];
  const drums = [{ tick: 0, type: 'trackName', text: 'Breakbeat Pursuit Drums' }];

  // Fast E Minor -> F -> F#m -> B7 tension loop
  const roots = [40, 40, 41, 41, 40, 40, 42, 47];
  const arpOffsets = [0, 7, 12, 15, 12, 7, 15, 19];

  for (let bar = 0; bar < 8; bar++) {
    const bt = bar * 16 * STEP;
    const r = roots[bar];

    // Dramatic stabs on 0, 3, 6, 12
    for (const hitStep of [0, 3, 6, 12]) {
      addNote(stabs, 1, r + 12, bt + hitStep * STEP, STEP * 1.5, 115);
      addNote(stabs, 1, r + 15, bt + hitStep * STEP, STEP * 1.5, 110);
      addNote(stabs, 1, r + 19, bt + hitStep * STEP, STEP * 1.5, 110);
    }

    for (let s = 0; s < 16; s++) {
      const st = bt + s * STEP;
      addNote(bass, 0, (s % 2 === 0) ? r : r + 12, st, STEP * 0.8, 118);
      addNote(sirenSynth, 2, r + 24 + arpOffsets[s % 8], st, STEP * 0.75, 96);

      // Syncopated Amen/Breakbeat Drum Pattern
      if (s === 0 || s === 2 || s === 10 || s === 11) addNote(drums, 9, 36, st, STEP, 124);
      if (s === 4 || s === 7 || s === 9 || s === 12 || s === 15) {
        addNote(drums, 9, 38, st, STEP, s === 4 || s === 12 ? 120 : 88);
      }
      addNote(drums, 9, s % 2 === 0 ? 42 : 46, st, STEP * 0.6, 94);
    }
  }

  return buildMidiFile(PPQ, [t0, bass, stabs, sirenSynth, drums]);
}

// ============================================================================
// 6. STREET PROWL THEME — "street_prowl_theme.mid" (104 BPM, Cool On-Foot Groove)
// ============================================================================
function createStreetProwl() {
  const t0 = [{ tick: 0, type: 'trackName', text: 'Street Prowl Tempo' }, { tick: 0, type: 'tempo', bpm: 104 }];
  const bass = [{ tick: 0, type: 'trackName', text: 'Slap Funk Bass' }, { tick: 0, type: 'program', channel: 0, program: 36 }];
  const pad = [{ tick: 0, type: 'trackName', text: 'Noir Electric Keys' }, { tick: 0, type: 'program', channel: 1, program: 5 }];
  const vibes = [{ tick: 0, type: 'trackName', text: 'Neon Vibraphone Bell' }, { tick: 0, type: 'program', channel: 2, program: 11 }];
  const drums = [{ tick: 0, type: 'trackName', text: 'Street Groove Kit' }];

  // G Minor 9 -> C9 -> Eb Maj7 -> D7#9 (GTA 2 / Vice Street Vibe)
  const roots = [43, 43, 36, 36, 39, 39, 38, 38];
  const chords = [
    [55, 58, 62, 65], [55, 58, 62, 65],
    [55, 58, 60, 64], [55, 58, 60, 64],
    [55, 58, 62, 67], [55, 58, 62, 67],
    [54, 57, 60, 65], [54, 57, 60, 65]
  ];

  for (let bar = 0; bar < 8; bar++) {
    const bt = bar * 16 * STEP;
    const r = roots[bar];
    const ch = chords[bar];

    for (const n of ch) {
      addNote(pad, 1, n, bt, 8 * STEP, 66);
      addNote(pad, 1, n, bt + 8 * STEP, 7 * STEP, 62);
    }

    const bassGroove = [[0, 2, r], [3, 2, r + 7], [6, 3, r + 10], [10, 2, r], [12, 3, r + 12]];
    for (const [s, d, n] of bassGroove) {
      addNote(bass, 0, n, bt + s * STEP, d * STEP * 0.85, 102);
    }

    // Cool vibraphone motif
    addNote(vibes, 2, ch[3] + 12, bt + 2 * STEP, 3 * STEP, 78);
    addNote(vibes, 2, ch[2] + 12, bt + 6 * STEP, 4 * STEP, 74);
    addNote(vibes, 2, ch[1] + 12, bt + 12 * STEP, 4 * STEP, 72);

    for (let s = 0; s < 16; s++) {
      const st = bt + s * STEP;
      if (s === 0 || s === 6 || s === 10) addNote(drums, 9, 36, st, STEP, 104);
      if (s === 4 || s === 12) addNote(drums, 9, 38, st, STEP, 96);
      if (s % 2 === 0) addNote(drums, 9, 42, st, STEP * 0.5, 72);
    }
  }

  return buildMidiFile(PPQ, [t0, bass, pad, vibes, drums]);
}

const files = [
  { name: 'vice_synthwave.mid',    buf: createViceSynthwave() },
  { name: 'leonida_bass_fm.mid',   buf: createLeonidaBass() },
  { name: 'gator_rock_fm.mid',     buf: createGatorRock() },
  { name: 'cyber_electro_fm.mid',  buf: createCyberElectro() },
  { name: 'action_chase_heat.mid', buf: createActionChase() },
  { name: 'street_prowl_theme.mid',buf: createStreetProwl() }
];

const embeddedMap = {};
for (const f of files) {
  const fullPath = path.join(outDir, f.name);
  fs.writeFileSync(fullPath, f.buf);
  embeddedMap[f.name] = f.buf.toString('base64');
  console.log(`Generated ${fullPath} (${f.buf.length} bytes)`);
}

// Write an export helper for midi_player.js
fs.writeFileSync(
  path.join(outDir, 'midi_manifest.json'),
  JSON.stringify(embeddedMap, null, 2)
);
console.log('Generated music/midi_manifest.json successfully!');
