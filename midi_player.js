/**
 * GTA VI: VICE OVERHEAD — Standard MIDI File (.mid) Parser & Web Audio Polyphonic Synthesizer
 * Loads and parses binary Format-1 .mid files from ./music/*.mid (with embedded binary fallback)
 * and synthesizes multi-track Radio Stations, Police Chase Action Music, and Street Grooves.
 */

(function () {
  class MidiSoundtrackEngine {
    constructor() {
      this.ctx = null;
      this.masterGain = null;
      this.delayNode = null;
      this.delayFeedback = null;
      this.isMuted = false;

      // Radio Stations & Dynamic Action Tracks backed by real .mid files in ./music/
      this.tracks = [
        {
          id: 'synthwave',
          file: 'music/vice_synthwave.mid',
          name: '📻 VICE SYNTH 104.9 FM',
          subtitle: 'OUTRUN NEON SYNTHWAVE (MIDI)',
          role: 'radio'
        },
        {
          id: 'bass',
          file: 'music/leonida_bass_fm.mid',
          name: '📻 LEONIDA BASS 98.3 FM',
          subtitle: 'MIAMI 808 G-FUNK & SUB BASS (MIDI)',
          role: 'radio'
        },
        {
          id: 'rock',
          file: 'music/gator_rock_fm.mid',
          name: '📻 GATOR ROCK 101.5 FM',
          subtitle: 'BAYOU OVERDRIVE SHRED ROCK (MIDI)',
          role: 'radio'
        },
        {
          id: 'cyber',
          file: 'music/cyber_electro_fm.mid',
          name: '📻 CYBER PULSE 107.7 FM',
          subtitle: 'INDUSTRIAL DARKSYNTH ELECTRO (MIDI)',
          role: 'radio'
        },
        {
          id: 'chase',
          file: 'music/action_chase_heat.mid',
          name: '🚨 VCPD PURSUIT HEAT',
          subtitle: 'HIGH-OCTANE ACTION CHASE (MIDI)',
          role: 'action'
        },
        {
          id: 'street',
          file: 'music/street_prowl_theme.mid',
          name: '🕶️ VICE NOIR STREET GROOVE',
          subtitle: 'ON-FOOT CITY SOUNDTRACK (MIDI)',
          role: 'ambient'
        },
        {
          id: 'off',
          file: null,
          name: '📻 RADIO OFF',
          subtitle: 'ENGINE & CITY AMBIENCE ONLY',
          role: 'off'
        }
      ];

      this.parsedMidis = {}; // id -> { ppq, bpm, durationTicks, events: [{tick, timeSec, ...}] }
      this.currentStationIdx = 0; // 0..3 are radio stations, 4 is chase, 5 is street, 6 is off
      this.activeTrackId = null;
      this.playheadSec = 0;
      this.eventCursor = 0;
      this.channelPrograms = new Array(16).fill(0);
      this.noiseBuffer = null;
      this.loaded = false;

      this.preloadAllMidiFiles();
    }

    async preloadAllMidiFiles() {
      // Load manifest fallback first if available, and fetch raw binary .mid files
      let manifest = {};
      try {
        const res = await fetch('music/midi_manifest.json');
        if (res.ok) manifest = await res.json();
      } catch (_) {}

      for (const tr of this.tracks) {
        if (!tr.file) continue;
        try {
          const resp = await fetch(tr.file);
          if (resp.ok) {
            const buf = await resp.arrayBuffer();
            this.parsedMidis[tr.id] = this.parseStandardMidiFile(new Uint8Array(buf));
            continue;
          }
        } catch (_) {}

        // Fallback to base64 manifest if needed
        const baseName = tr.file.split('/').pop();
        if (manifest[baseName]) {
          const binStr = atob(manifest[baseName]);
          const bytes = new Uint8Array(binStr.length);
          for (let i = 0; i < binStr.length; i++) bytes[i] = binStr.charCodeAt(i);
          this.parsedMidis[tr.id] = this.parseStandardMidiFile(bytes);
        }
      }
      this.loaded = true;
    }

    /**
     * Parses a binary Format-0 or Format-1 Standard MIDI File (.mid) into a timeline of events
     */
    parseStandardMidiFile(bytes) {
      let pos = 0;
      const readU16 = () => {
        const v = (bytes[pos] << 8) | bytes[pos + 1];
        pos += 2;
        return v;
      };
      const readU32 = () => {
        const v = ((bytes[pos] << 24) >>> 0) + ((bytes[pos + 1] << 16) | (bytes[pos + 2] << 8) | bytes[pos + 3]);
        pos += 4;
        return v;
      };
      const readVLQ = () => {
        let val = 0;
        while (pos < bytes.length) {
          const b = bytes[pos++];
          val = (val << 7) | (b & 0x7f);
          if ((b & 0x80) === 0) break;
        }
        return val;
      };

      // MThd Header
      pos += 4; // 'MThd'
      const hdrLen = readU32();
      const format = readU16();
      const numTracks = readU16();
      const ppq = readU16();
      pos = 8 + hdrLen;

      let bpm = 120;
      const rawEvents = [];
      let maxTick = 0;

      for (let t = 0; t < numTracks && pos < bytes.length; t++) {
        // 'MTrk'
        pos += 4;
        const trkLen = readU32();
        const trkEnd = pos + trkLen;
        let tick = 0;
        let runningStatus = 0;

        while (pos < trkEnd) {
          const delta = readVLQ();
          tick += delta;
          if (tick > maxTick) maxTick = tick;

          let status = bytes[pos];
          if (status < 0x80) {
            status = runningStatus;
          } else {
            pos++;
            if (status < 0xf0) runningStatus = status;
          }

          const cmd = status & 0xf0;
          const ch = status & 0x0f;

          if (cmd === 0x90) {
            const note = bytes[pos++];
            const vel = bytes[pos++];
            if (vel > 0) {
              rawEvents.push({ tick, type: 'noteOn', ch, note, vel });
            } else {
              rawEvents.push({ tick, type: 'noteOff', ch, note });
            }
          } else if (cmd === 0x80) {
            const note = bytes[pos++];
            pos++; // velocity
            rawEvents.push({ tick, type: 'noteOff', ch, note });
          } else if (cmd === 0xc0) {
            const prog = bytes[pos++];
            rawEvents.push({ tick, type: 'program', ch, prog });
          } else if (cmd === 0xb0 || cmd === 0xe0 || cmd === 0xa0) {
            pos += 2;
          } else if (cmd === 0xd0) {
            pos += 1;
          } else if (status === 0xff) {
            const metaType = bytes[pos++];
            const len = readVLQ();
            if (metaType === 0x51 && len === 3) {
              const mpqn = (bytes[pos] << 16) | (bytes[pos + 1] << 8) | bytes[pos + 2];
              bpm = Math.round(60000000 / mpqn);
            }
            pos += len;
          } else if (status === 0xf0 || status === 0xf7) {
            const len = readVLQ();
            pos += len;
          }
        }
        pos = trkEnd;
      }

      // Pair noteOn and noteOff into duration-aware note events for clean Web Audio scheduling
      rawEvents.sort((a, b) => a.tick - b.tick);
      const secPerTick = 60 / (bpm * ppq);
      const activeNotes = {};
      const scheduledEvents = [];

      for (const ev of rawEvents) {
        if (ev.type === 'program') {
          scheduledEvents.push({
            tick: ev.tick,
            timeSec: ev.tick * secPerTick,
            type: 'program',
            ch: ev.ch,
            prog: ev.prog
          });
        } else if (ev.type === 'noteOn') {
          const key = `${ev.ch}_${ev.note}`;
          activeNotes[key] = ev;
        } else if (ev.type === 'noteOff') {
          const key = `${ev.ch}_${ev.note}`;
          const startEv = activeNotes[key];
          if (startEv) {
            const durTicks = Math.max(20, ev.tick - startEv.tick);
            scheduledEvents.push({
              tick: startEv.tick,
              timeSec: startEv.tick * secPerTick,
              durSec: durTicks * secPerTick,
              type: 'note',
              ch: startEv.ch,
              note: startEv.note,
              vel: startEv.vel
            });
            delete activeNotes[key];
          }
        }
      }

      scheduledEvents.sort((a, b) => a.timeSec - b.timeSec);
      const loopDurationSec = Math.max(4, maxTick * secPerTick);

      return {
        ppq,
        bpm,
        durationSec: loopDurationSec,
        events: scheduledEvents
      };
    }

    initAudio(existingCtx) {
      if (this.ctx) return;
      this.ctx = existingCtx || new (window.AudioContext || window.webkitAudioContext)();

      // Master Music Bus with Stereo Echo/Reverb Send
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.34;

      // Stereo Slapback Delay for Lush 80s / Vice City Ambience
      this.delayNode = this.ctx.createDelay(1.0);
      this.delayNode.delayTime.value = 0.25;
      this.delayFeedback = this.ctx.createGain();
      this.delayFeedback.gain.value = 0.26;
      const delayFilter = this.ctx.createBiquadFilter();
      delayFilter.type = 'lowpass';
      delayFilter.frequency.value = 2400;

      this.delayNode.connect(delayFilter);
      delayFilter.connect(this.delayFeedback);
      this.delayFeedback.connect(this.delayNode);

      const delayWet = this.ctx.createGain();
      delayWet.gain.value = 0.22;
      this.delayNode.connect(delayWet);
      delayWet.connect(this.masterGain);

      this.masterGain.connect(this.ctx.destination);

      // Pre-generate White Noise Buffer for Snare, Clap, Hi-Hats, Crash
      const sr = this.ctx.sampleRate;
      this.noiseBuffer = this.ctx.createBuffer(1, sr * 0.6, sr);
      const data = this.noiseBuffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        data[i] = Math.random() * 2 - 1;
      }
    }

    /**
     * Called every frame from game.js update(dt)
     * Automatically selects Vehicle Radio Station, Police Chase Action Music, or On-Foot Street Groove!
     */
    update(dt, inVehicle, wantedLevel, isMissionActive) {
      if (!this.ctx || !this.loaded || this.isMuted) return;
      if (this.ctx.state === 'suspended') this.ctx.resume();

      // Determine which MIDI track should be playing right now
      let targetTrackId = null;
      const station = this.tracks[this.currentStationIdx];

      if (station && station.id === 'off') {
        targetTrackId = null;
      } else if (inVehicle) {
        // Inside any vehicle: play the selected Radio Station (or Chase track if Wanted >= 3 and not overridden)
        targetTrackId = station ? station.id : 'synthwave';
      } else {
        // On foot: if Wanted >= 1 or in an active contract mission, play high-octane Action Chase MIDI!
        // Otherwise play the user's R-selected track if they cycled tracks, or the Vice Noir Street Groove!
        if (Math.floor(wantedLevel) >= 1 || isMissionActive) {
          targetTrackId = 'chase';
        } else if (this.manualTrackOverride && station) {
          targetTrackId = station.id;
        } else {
          targetTrackId = 'street';
        }
      }

      if (!targetTrackId || !this.parsedMidis[targetTrackId]) {
        this.activeTrackId = null;
        return;
      }

      const midi = this.parsedMidis[targetTrackId];
      if (this.activeTrackId !== targetTrackId) {
        this.activeTrackId = targetTrackId;
        this.playheadSec = 0;
        this.eventCursor = 0;
        this.channelPrograms.fill(0);
      }

      const prevTime = this.playheadSec;
      this.playheadSec += dt;

      // Trigger all MIDI events between prevTime and playheadSec
      while (this.eventCursor < midi.events.length) {
        const ev = midi.events[this.eventCursor];
        if (ev.timeSec <= this.playheadSec) {
          if (ev.type === 'program') {
            this.channelPrograms[ev.ch] = ev.prog;
          } else if (ev.type === 'note') {
            this.triggerMidiNote(ev.ch, ev.note, ev.vel, ev.durSec);
          }
          this.eventCursor++;
        } else {
          break;
        }
      }

      // Seamless loop wrap-around at end of 8-bar MIDI file
      if (this.playheadSec >= midi.durationSec) {
        this.playheadSec = this.playheadSec % midi.durationSec;
        this.eventCursor = 0;
      }
    }

    triggerMidiNote(ch, note, vel, durSec) {
      if (!this.ctx || this.isMuted) return;
      const now = this.ctx.currentTime;

      // MIDI Channel 10 (index 9) is General MIDI Percussion Kit
      if (ch === 9) {
        this.triggerDrumNote(note, vel / 127, now);
        return;
      }

      const freq = 440 * Math.pow(2, (note - 69) / 12);
      const amp = (vel / 127) * 0.22;
      const prog = this.channelPrograms[ch] || 0;

      // Synthesize instrument timbre based on General MIDI Program number
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      let useOsc2 = true;
      let sendToDelay = false;

      if (prog >= 32 && prog <= 39) {
        // Bass Guitar / Analog Synth Bass / 808 Sub Bass
        osc1.type = prog === 39 ? 'triangle' : 'sawtooth';
        osc2.type = 'square';
        osc2.detune.value = -6;
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(prog === 39 ? 420 : 1150, now);
        filter.frequency.exponentialRampToValueAtTime(160, now + Math.min(0.28, durSec));
        filter.Q.value = 3.5;
      } else if (prog === 29 || prog === 30) {
        // Overdriven Rock / Shred Guitar
        osc1.type = 'sawtooth';
        osc2.type = 'square';
        osc2.detune.value = 14;
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1450, now);
        filter.Q.value = 1.8;
        sendToDelay = true;
      } else if (prog === 4 || prog === 5 || prog === 11) {
        // Rhodes Electric Piano / Vibraphone Bell
        osc1.type = 'sine';
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(freq * 2, now); // Bell harmonic
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2800, now);
        sendToDelay = true;
      } else if (prog === 55 || prog === 62) {
        // Synth Brass / Orchestra Hit Stabs
        osc1.type = 'sawtooth';
        osc2.type = 'sawtooth';
        osc2.detune.value = 18;
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(600, now);
        filter.frequency.exponentialRampToValueAtTime(3200, now + 0.06);
        filter.frequency.exponentialRampToValueAtTime(900, now + durSec);
        sendToDelay = true;
      } else {
        // Outrun Lead Synth / Polysynth Arpeggiator (prog 80, 81, 88)
        osc1.type = 'sawtooth';
        osc2.type = 'square';
        osc2.detune.value = 10;
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(3600, now);
        filter.frequency.exponentialRampToValueAtTime(950, now + durSec);
        filter.Q.value = 2.0;
        sendToDelay = true;
      }

      osc1.frequency.setValueAtTime(freq, now);
      if (prog !== 4 && prog !== 5 && prog !== 11) {
        osc2.frequency.setValueAtTime(freq, now);
      }

      const stopTime = now + Math.max(0.05, durSec);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(amp, now + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, stopTime + 0.04);

      osc1.connect(filter);
      if (useOsc2) osc2.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      if (sendToDelay && this.delayNode) {
        gain.connect(this.delayNode);
      }

      osc1.start(now);
      if (useOsc2) osc2.start(now);
      osc1.stop(stopTime + 0.05);
      if (useOsc2) osc2.stop(stopTime + 0.05);
    }

    triggerDrumNote(note, normVel, now) {
      if (note === 35 || note === 36) {
        // Punchy TR-808 / LinnDrum Kick
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(145, now);
        osc.frequency.exponentialRampToValueAtTime(34, now + 0.14);
        gain.gain.setValueAtTime(normVel * 0.55, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.23);
      } else if (note === 38 || note === 39) {
        // Gated Reverb Snare (38) & Hand Clap (39)
        const noise = this.ctx.createBufferSource();
        noise.buffer = this.noiseBuffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = note === 39 ? 950 : 320;
        const nGain = this.ctx.createGain();
        const dur = note === 39 ? 0.14 : 0.19;
        nGain.gain.setValueAtTime(normVel * 0.34, now);
        nGain.gain.exponentialRampToValueAtTime(0.001, now + dur);
        noise.connect(filter);
        filter.connect(nGain);
        nGain.connect(this.masterGain);
        noise.start(now);
        noise.stop(now + dur);

        if (note === 38) {
          // Snare body tone
          const body = this.ctx.createOscillator();
          const bGain = this.ctx.createGain();
          body.type = 'triangle';
          body.frequency.setValueAtTime(190, now);
          body.frequency.exponentialRampToValueAtTime(95, now + 0.09);
          bGain.gain.setValueAtTime(normVel * 0.28, now);
          bGain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);
          body.connect(bGain);
          bGain.connect(this.masterGain);
          body.start(now);
          body.stop(now + 0.12);
        }
      } else if (note === 42 || note === 46 || note === 49) {
        // Closed Hi-Hat (42), Open Hi-Hat (46), Crash Cymbal (49)
        const noise = this.ctx.createBufferSource();
        noise.buffer = this.noiseBuffer;
        const hp = this.ctx.createBiquadFilter();
        hp.type = 'highpass';
        hp.frequency.value = note === 49 ? 4500 : 7200;
        const gain = this.ctx.createGain();
        const dur = note === 42 ? 0.045 : (note === 46 ? 0.18 : 0.48);
        gain.gain.setValueAtTime(normVel * 0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
        noise.connect(hp);
        hp.connect(gain);
        gain.connect(this.masterGain);
        noise.start(now);
        noise.stop(now + dur);
      } else if (note === 45) {
        // Electronic Synth Tom Fill
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(160, now);
        osc.frequency.exponentialRampToValueAtTime(65, now + 0.16);
        gain.gain.setValueAtTime(normVel * 0.36, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.17);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.18);
      }
    }

    cycleStation() {
      this.currentStationIdx = (this.currentStationIdx + 1) % this.tracks.length;
      const st = this.tracks[this.currentStationIdx];
      this.manualTrackOverride = true;
      this.activeTrackId = null; // Force immediate track switch
      return st;
    }

    toggleMute() {
      this.isMuted = !this.isMuted;
      return this.isMuted;
    }

    getCurrentTrackLabel() {
      if (this.isMuted) return '🔇 MUSIC MUTED (PRESS M)';
      const tr = this.tracks.find(t => t.id === this.activeTrackId) || this.tracks[this.currentStationIdx];
      return tr ? `${tr.name} — ${tr.subtitle}` : '📻 VICE SYNTH 104.9 FM';
    }
  }

  window.MidiSoundtrack = new MidiSoundtrackEngine();
})();
