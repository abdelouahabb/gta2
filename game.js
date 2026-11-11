/**
 * GTA VI: LEONIDA CARBON // 2027 HYPER-EDITION
 * Next-Gen 2.5D Top-Down Open-World Sandbox Engine
 * - 80x80 Mega-State (12,800 x 12,800 px) with O(1) Spatial Grid Broadphase
 * - 7 Distinct Biomes, Elevated Maglev Sky-Rail, Dynamic Monsoon/Lightning Weather
 * - Carbon X-2027 Hypercar, Rhino Tank (Rotating Turret), Viper Speedboat, VCPD Chopper, Hydra VTOL Jet
 * - 7 Weapons (incl. Carbon Railgun & EMP Shockwave) + Carbon Reflex Bullet-Time
 * - Interactive Satellite Megamap (Fast-Travel & GPS Waypoint) + Orbital Drop-Pod Spawner
 */

(() => {
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  const minimapCanvas = document.getElementById('minimapCanvas');
  const mctx = minimapCanvas.getContext('2d');
  const megamapCanvas = document.getElementById('megamapCanvas');
  const megaCtx = megamapCanvas ? megamapCanvas.getContext('2d') : null;
  const newsCamCanvas = document.getElementById('newsCamCanvas');
  const newsCtx = newsCamCanvas ? newsCamCanvas.getContext('2d') : null;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  // ==========================================
  // 1. WEB AUDIO SFX SYNTHESIZER + MIDI BRIDGE
  // ==========================================
  class SoundEngine {
    constructor() {
      this.ctx = null;
      this.radioStation = 0;
      this.stations = [
        '📻 VICE SYNTH 104.9 FM',
        '📻 LEONIDA BASS 98.3 FM',
        '📻 GATOR ROCK 101.5 FM',
        '📻 RADIO OFF'
      ];
      this.nextNoteTime = 0;
      this.step = 0;
    }

    init() {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
          this.nextNoteTime = this.ctx.currentTime + 0.05;
        }
      } else if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      if (window.MidiSoundtrack && this.ctx) {
        window.MidiSoundtrack.initAudio(this.ctx);
      }
    }

    playShoot(type) {
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);

      if (type === 'pistol' || type === 'smg') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(type === 'pistol' ? 340 : 440, now);
        osc.frequency.exponentialRampToValueAtTime(55, now + 0.085);
        gain.gain.setValueAtTime(0.14, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.085);
        osc.start(now);
        osc.stop(now + 0.085);
      } else if (type === 'shotgun') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(185, now);
        osc.frequency.exponentialRampToValueAtTime(32, now + 0.18);
        gain.gain.setValueAtTime(0.22, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
        osc.start(now);
        osc.stop(now + 0.18);
      } else if (type === 'rocket') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(250, now);
        osc.frequency.linearRampToValueAtTime(80, now + 0.28);
        gain.gain.setValueAtTime(0.22, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
        osc.start(now);
        osc.stop(now + 0.28);
      } else if (type === 'flame') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(110 + Math.random() * 60, now);
        gain.gain.setValueAtTime(0.055, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
        osc.start(now);
        osc.stop(now + 0.07);
      } else if (type === 'railgun') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(1400, now);
        osc.frequency.exponentialRampToValueAtTime(95, now + 0.32);
        gain.gain.setValueAtTime(0.26, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
        osc.start(now);
        osc.stop(now + 0.32);
      } else if (type === 'emp') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(90, now);
        osc.frequency.exponentialRampToValueAtTime(980, now + 0.16);
        osc.frequency.exponentialRampToValueAtTime(45, now + 0.48);
        gain.gain.setValueAtTime(0.28, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.48);
        osc.start(now);
        osc.stop(now + 0.48);
      }
    }

    playExplosion(heavy = false) {
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const dur = heavy ? 0.65 : 0.45;
      const bufferSize = Math.floor(this.ctx.sampleRate * dur);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * (heavy ? 0.22 : 0.14)));
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(heavy ? 320 : 440, now);
      filter.frequency.linearRampToValueAtTime(48, now + dur);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(heavy ? 0.42 : 0.34, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + dur);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      noise.start(now);
    }

    playBuildingCollapse() {
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const dur = 1.25;
      // 1. Deep Seismic Sub-Bass Rumble
      const sub = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      sub.type = 'sawtooth';
      sub.frequency.setValueAtTime(76, now);
      sub.frequency.exponentialRampToValueAtTime(20, now + dur);
      subGain.gain.setValueAtTime(0.36, now);
      subGain.gain.exponentialRampToValueAtTime(0.008, now + dur);
      sub.connect(subGain);
      subGain.connect(this.ctx.destination);
      sub.start(now);
      sub.stop(now + dur);

      // 2. Cascading Concrete & Masonry Crunch Noise
      const bufferSize = Math.floor(this.ctx.sampleRate * dur);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        const t = i / this.ctx.sampleRate;
        const burst = 0.65 + 0.35 * Math.sin(t * 28);
        data[i] = (Math.random() * 2 - 1) * burst * Math.exp(-t * 2.1);
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(380, now);
      filter.frequency.linearRampToValueAtTime(52, now + dur);
      const nGain = this.ctx.createGain();
      nGain.gain.setValueAtTime(0.44, now);
      nGain.gain.exponentialRampToValueAtTime(0.01, now + dur);
      noise.connect(filter);
      filter.connect(nGain);
      nGain.connect(this.ctx.destination);
      noise.start(now);
    }

    playWaterSplash(heavy = false) {
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const dur = heavy ? 0.52 : 0.28;
      const bufferSize = Math.floor(this.ctx.sampleRate * dur);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * (heavy ? 0.18 : 0.09)));
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const bp = this.ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.setValueAtTime(heavy ? 520 : 880, now);
      bp.frequency.exponentialRampToValueAtTime(220, now + dur);
      bp.Q.value = 1.1;
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(heavy ? 0.32 : 0.16, now);
      gain.gain.exponentialRampToValueAtTime(0.008, now + dur);
      noise.connect(bp);
      bp.connect(gain);
      gain.connect(this.ctx.destination);
      noise.start(now);
    }

    playCash() {
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(987.77, now);
      osc.frequency.setValueAtTime(1318.51, now + 0.06);
      gain.gain.setValueAtTime(0.11, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.22);
    }

    playHorn(isPolice) {
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = isPolice ? 'sawtooth' : 'square';
      if (isPolice) {
        osc.frequency.setValueAtTime(660, now);
        osc.frequency.linearRampToValueAtTime(990, now + 0.18);
        osc.frequency.linearRampToValueAtTime(660, now + 0.35);
      } else {
        osc.frequency.setValueAtTime(290, now);
      }
      gain.gain.setValueAtTime(0.13, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + (isPolice ? 0.36 : 0.22));
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + (isPolice ? 0.36 : 0.22));
    }

    playPhoneRing() {
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.setValueAtTime(1100, now + 0.04);
      osc.frequency.setValueAtTime(880, now + 0.08);
      gain.gain.setValueAtTime(0.045, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.14);
    }

    playDropPod() {
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.exponentialRampToValueAtTime(65, now + 0.38);
      gain.gain.setValueAtTime(0.22, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.4);
    }

    playGlassShatter() {
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      if (this._lastGlass && now - this._lastGlass < 0.055) return;
      this._lastGlass = now;

      const dur = 0.22;
      const bufLen = Math.floor(this.ctx.sampleRate * dur);
      const buf = this.ctx.createBuffer(1, bufLen, this.ctx.sampleRate);
      const ch = buf.getChannelData(0);
      for (let i = 0; i < bufLen; i++) {
        ch[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.055));
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buf;
      const hp = this.ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.setValueAtTime(2400, now);
      const nGain = this.ctx.createGain();
      nGain.gain.setValueAtTime(0.18, now);
      nGain.gain.exponentialRampToValueAtTime(0.001, now + dur);
      noise.connect(hp);
      hp.connect(nGain);
      nGain.connect(this.ctx.destination);
      noise.start(now);

      const freqs = [2650, 3420, 4180];
      for (let k = 0; k < freqs.length; k++) {
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'triangle';
        const t0 = now + k * 0.024;
        osc.frequency.setValueAtTime(freqs[k] + (Math.random() - 0.5) * 280, t0);
        osc.frequency.exponentialRampToValueAtTime(freqs[k] * 0.62, t0 + 0.11);
        g.gain.setValueAtTime(0.06, t0);
        g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.12);
        osc.connect(g);
        g.connect(this.ctx.destination);
        osc.start(t0);
        osc.stop(t0 + 0.12);
      }
    }

    playParachute() {
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const dur = 0.42;
      const bufLen = Math.floor(this.ctx.sampleRate * dur);
      const buf = this.ctx.createBuffer(1, bufLen, this.ctx.sampleRate);
      const ch = buf.getChannelData(0);
      for (let i = 0; i < bufLen; i++) {
        const env = Math.sin(Math.min(1, i / (this.ctx.sampleRate * 0.08)) * Math.PI * 0.5) * Math.exp(-i / (this.ctx.sampleRate * 0.18));
        ch[i] = (Math.random() * 2 - 1) * env;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buf;
      const bp = this.ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.setValueAtTime(420, now);
      bp.frequency.exponentialRampToValueAtTime(1150, now + 0.16);
      bp.frequency.exponentialRampToValueAtTime(340, now + dur);
      bp.Q.value = 1.2;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.26, now);
      g.gain.exponentialRampToValueAtTime(0.005, now + dur);
      noise.connect(bp);
      bp.connect(g);
      g.connect(this.ctx.destination);
      noise.start(now);
    }

    playTreeFall() {
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      if (this._lastTreeFall && now - this._lastTreeFall < 0.08) return;
      this._lastTreeFall = now;

      // 1. Sharp timber trunk snap crack
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(240, now);
      osc.frequency.exponentialRampToValueAtTime(38, now + 0.19);
      g.gain.setValueAtTime(0.24, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.20);
      osc.connect(g);
      g.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.20);

      // 2. Rustling palm fronds & heavy ground thud
      const dur = 0.48;
      const bufLen = Math.floor(this.ctx.sampleRate * dur);
      const buf = this.ctx.createBuffer(1, bufLen, this.ctx.sampleRate);
      const ch = buf.getChannelData(0);
      for (let i = 0; i < bufLen; i++) {
        ch[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.16));
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buf;
      const lp = this.ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.setValueAtTime(950, now);
      lp.frequency.exponentialRampToValueAtTime(180, now + dur);
      const ng = this.ctx.createGain();
      ng.gain.setValueAtTime(0.20, now);
      ng.gain.exponentialRampToValueAtTime(0.002, now + dur);
      noise.connect(lp);
      lp.connect(ng);
      ng.connect(this.ctx.destination);
      noise.start(now);
    }

    playHeliSpool(starting = true) {
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(starting ? 65 : 220, now);
      osc.frequency.exponentialRampToValueAtTime(starting ? 235 : 52, now + 0.65);
      g.gain.setValueAtTime(0.11, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.68);
      osc.connect(g);
      g.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.68);
    }

    playCarHorn(pitch = 310, isTruck = false, stressed = false, distance = 0, pan = 0) {
      const MAX_HORN_DIST = 1150;
      const clampedDist = Math.max(0, Number.isFinite(distance) ? distance : 0);
      if (clampedDist >= MAX_HORN_DIST) {
        this.lastHornGain = 0;
        this.lastHornDistance = clampedDist;
        return 0;
      }
      // Realistic acoustic distance attenuation: loud & bright up close, smoothly quieter & air-muffled far away!
      const prox = Math.max(0, Math.min(1, 1 - Math.max(0, clampedDist - 55) / (MAX_HORN_DIST - 55)));
      const distAtten = prox * (0.20 + 0.80 * prox);
      const basePeak = (isTruck ? 0.098 : 0.066) * (stressed ? 1.16 : 0.88);
      const peakGain = Math.max(0.0005, basePeak * distAtten);

      this.lastHornGain = peakGain;
      this.lastHornDistance = clampedDist;
      this.hornCount = (this.hornCount || 0) + 1;

      if (!this.ctx) return peakGain;
      const now = this.ctx.currentTime;
      if (this._lastCommuterHorn && now - this._lastCommuterHorn < 0.065) return peakGain;
      this._lastCommuterHorn = now;

      const baseFreq = isTruck ? 142 : pitch;
      const chordRatio = isTruck ? 1.189 : 1.25; // Minor third air-horn for 18-wheelers, classic major third dual-tone for cars!
      const blasts = stressed ? (isTruck ? [[0, 0.56]] : [[0, 0.19], [0.24, 0.34]]) : [[0, 0.24]];
      const cutoffHz = (isTruck ? 1020 : 1680) * (0.32 + 0.68 * prox);
      const clampedPan = Math.max(-1, Math.min(1, Number.isFinite(pan) ? pan : 0));

      for (const [offset, dur] of blasts) {
        const t0 = now + offset;
        for (const mult of [1, chordRatio]) {
          const osc = this.ctx.createOscillator();
          const lp = this.ctx.createBiquadFilter();
          const g = this.ctx.createGain();
          osc.type = isTruck ? 'sawtooth' : 'square';
          osc.frequency.setValueAtTime(baseFreq * mult, t0);
          lp.type = 'lowpass';
          lp.frequency.setValueAtTime(cutoffHz, t0);
          g.gain.setValueAtTime(0.0001, t0);
          g.gain.linearRampToValueAtTime(peakGain, t0 + 0.018);
          g.gain.setValueAtTime(peakGain * 0.92, t0 + Math.max(0.03, dur - 0.04));
          g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
          osc.connect(lp);
          lp.connect(g);
          if (typeof this.ctx.createStereoPanner === 'function') {
            const panner = this.ctx.createStereoPanner();
            panner.pan.setValueAtTime(clampedPan, t0);
            g.connect(panner);
            panner.connect(this.ctx.destination);
          } else {
            g.connect(this.ctx.destination);
          }
          osc.start(t0);
          osc.stop(t0 + dur + 0.01);
        }
      }
      return peakGain;
    }

    playCatastrophicCrash() {
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      // Deep seismic sub-bass shockwave + cascading aviation fuel roar
      const sub = this.ctx.createOscillator();
      const sg = this.ctx.createGain();
      sub.type = 'sawtooth';
      sub.frequency.setValueAtTime(92, now);
      sub.frequency.exponentialRampToValueAtTime(18, now + 1.45);
      sg.gain.setValueAtTime(0.42, now);
      sg.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
      sub.connect(sg);
      sg.connect(this.ctx.destination);
      sub.start(now);
      sub.stop(now + 1.52);

      const dur = 1.65;
      const bufLen = Math.floor(this.ctx.sampleRate * dur);
      const buf = this.ctx.createBuffer(1, bufLen, this.ctx.sampleRate);
      const ch = buf.getChannelData(0);
      for (let i = 0; i < bufLen; i++) {
        ch[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.55));
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buf;
      const lp = this.ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.setValueAtTime(1250, now);
      lp.frequency.exponentialRampToValueAtTime(95, now + dur);
      const ng = this.ctx.createGain();
      ng.gain.setValueAtTime(0.38, now);
      ng.gain.exponentialRampToValueAtTime(0.002, now + dur);
      noise.connect(lp);
      lp.connect(ng);
      ng.connect(this.ctx.destination);
      noise.start(now);
    }

    updateRadio() {}
  }

  const sfx = new SoundEngine();

  // ==========================================
  // 2. HUMONGOUS 80x80 STATE OF LEONIDA (12,800 x 12,800 PX)
  // ==========================================
  const TILE_SIZE = 160;
  const GRID_W = 80;
  const GRID_H = 80;
  const WORLD_W = GRID_W * TILE_SIZE; // 12,800 px!
  const WORLD_H = GRID_H * TILE_SIZE; // 12,800 px!

  // Tile Types:
  // 0: Asphalt Road
  // 1: Building Block
  // 2: Botanical Park / Plaza
  // 3: Golden Vice Beach Sand
  // 4: Deep Water (Atlantic Ocean, Intercoastal Bay, Yacht Canal & Everglades River — also flows UNDER elevated bridges!)
  // 5: Pay N' Spray Custom Shop
  // 6: Leonida International Spaceport & Airbase Tarmac / Runway
  // 7: Port Leonida Concrete Dockyard
  const worldGrid = [];
  const bridgeGrid = []; // bridgeGrid[gy][gx] = null | { axis: 'x'|'y', style: 'causeway'|'truss'|'canal', isTower: bool, closedEast?: bool }
  const waterMeta = [];  // waterMeta[gy][gx] = { biome, depthNorm, typeN, typeS, typeW, typeE, naturalProps }
  const buildings = [];
  const buildingsGrid = []; // O(1) Spatial Index: buildingsGrid[gy][gx] = Array<Building>
  const collapsingBuildings = []; // Active progressive 2.5D collapses
  const debrisChunks = []; // Active 3D bouncing masonry, concrete, rebar, wood & glass shrapnel
  const settledDebrisGrid = []; // O(1) Permanent Destruction Rubble Grid: settledDebrisGrid[gy][gx] = Array<Debris>
  const rainImpacts = []; // World-space interactive raindrop splashes on rooftops, puddles, cars & water
  const waterRipples = []; // Expanding hydro-rings, cannon geyser wakes & boat Kelvin V-wakes
  const courtyardProps = []; // Ground-level courtyard pools, plazas, and gardens for L/U-shaped buildings
  const streetlamps = [];
  const palmTrees = [];
  const treesGrid = []; // O(1) Spatial Index for physical knock-down palm trees: treesGrid[gy][gx] = Array<Tree>
  const beachProps = []; // Beach umbrellas & lounge towels
  const payphones = [];
  const pickups = [];
  const stuntJumps = [];
  const gasStations = [];     // Explosive RON-99 Hyper-Octane Fuel Stations (domino pump chain-reactions!)
  const powerNodes = [];      // High-Voltage Grid Substations (destruction triggers rolling district blackouts!)
  const waterPredators = [];  // Everglades Alligators & Atlantic Great White Sharks
  const tsunamiWaves = [];    // Expanding tidal surge rings from aircraft/explosive water impacts
  const waterJets = [];       // Pressurized Firetruck Hydro-Cannon streams (extinguishes fires & blasts cars!)
  const swatRopes = [];       // 4★+ Helicopter SWAT Tactical Fast-Rope Rappelling Lines
  const payNSprayRects = [];
  const baseMapCanvas = document.createElement('canvas');
  baseMapCanvas.width = 400;
  baseMapCanvas.height = 400;

  function hasBridgeAt(gx, gy) {
    return gx >= 0 && gx < GRID_W && gy >= 0 && gy < GRID_H && !!(bridgeGrid[gy] && bridgeGrid[gy][gx]);
  }

  function isRoadOrBridge(gx, gy) {
    return gx >= 0 && gx < GRID_W && gy >= 0 && gy < GRID_H && (worldGrid[gy][gx] === 0 || !!(bridgeGrid[gy] && bridgeGrid[gy][gx]));
  }

  // Elevated Maglev Sky-Rail Loop around Downtown Metropolis (gx: 33..49, gy: 31..49)
  const SKYRAIL_BOUNDS = { x1: 33 * TILE_SIZE + 80, y1: 31 * TILE_SIZE + 80, x2: 49 * TILE_SIZE + 80, y2: 49 * TILE_SIZE + 80 };
  const skyTrain = {
    progress: 0, // 0..perimeter
    speed: 440,
    cars: 4
  };

  const GANGS = {
    syndicate: { name: 'FLAMINGO SYNDICATE', color: '#e05263', respect: 50 },
    runners:   { name: 'CHROME RUNNERS',     color: '#38bdf8', respect: 50 },
    gators:    { name: 'GATOR KINGS',        color: '#4ade80', respect: 50 }
  };

  function getGangForPos(wx, wy) {
    const gx = Math.floor(wx / TILE_SIZE);
    if (gx >= 52) return 'syndicate';
    if (gx >= 26) return 'runners';
    return 'gators';
  }

  function getDistrictName(wx, wy) {
    const gx = Math.floor(wx / TILE_SIZE);
    const gy = Math.floor(wy / TILE_SIZE);
    if (gx >= 65) return 'STAR ISLAND BILLIONAIRE KEYS';
    if (gx >= 56) return 'OCEAN DRIVE & VICE BEACH';
    if (gx >= 4 && gx <= 19 && gy >= 46 && gy <= 69) return 'LEONIDA INTL SPACEPORT & AIRBASE';
    if (gx < 23 && gy < 46) return 'EVERGLADES BAYOU & GATOR SWAMPS';
    if (gx >= 22 && gx <= 35 && gy >= 54) return 'PORT LEONIDA CARGO DOCKS';
    if (gy <= 25 && gx >= 24 && gx <= 55) return 'SILICON HILLS TECH CORRIDOR';
    if (gx >= 32 && gx <= 52 && gy >= 28 && gy <= 52) return 'DOWNTOWN VICE METROPOLIS';
    return 'MIDTOWN LEONIDA BOULEVARD';
  }

  // Grounded, Authentic South Florida / Vice City Architectural Materials (Zero Vibe-Coding Neon Slop!)
  const DISTRICT_MATERIALS = {
    ocean_deco: [
      { wall: '#e5dccb', roof: '#c8bfb0', trim: '#2a9d8f', awning: '#1e5f58', facade: 'art_deco', sign: 'THE CARLYLE' },
      { wall: '#dfc1b3', roof: '#c4a698', trim: '#b5533c', awning: '#8c3824', facade: 'art_deco', sign: 'COLONY GRAND' },
      { wall: '#c5dcd4', roof: '#a7bfb7', trim: '#266d68', awning: '#1d3557', facade: 'art_deco', sign: 'DELANO PALMS' },
      { wall: '#e6d8b5', roof: '#cabd9b', trim: '#c28632', awning: '#2d5a43', facade: 'art_deco', sign: 'MARLIN HOTEL' },
      { wall: '#e6e2da', roof: '#cbc6be', trim: '#47687d', awning: '#1e3a5f', facade: 'balcony',  sign: 'SOUTH BEACH TOWER' },
      { wall: '#d9b5ae', roof: '#bf9b94', trim: '#82303c', awning: '#6b222d', facade: 'art_deco', sign: 'CASA TIDES' }
    ],
    star_estates: [
      { wall: '#e7decb', roof: '#9e4229', trim: '#c7b89e', awning: '#7c2d12', facade: 'masonry',  sign: null },
      { wall: '#dcc5a7', roof: '#8c3822', trim: '#b89f80', awning: '#6b2c1a', facade: 'masonry',  sign: null },
      { wall: '#e4e1da', roof: '#8b6f52', trim: '#94a3b8', awning: '#334155', facade: 'balcony',  sign: null },
      { wall: '#d5c7b4', roof: '#a34830', trim: '#b0a08b', awning: '#2d5a43', facade: 'masonry',  sign: null }
    ],
    downtown_core: [
      { wall: '#384f63', roof: '#5e666e', trim: '#98aab9', awning: '#243442', facade: 'curtain_glass', sign: 'BRICKELL TRUST' },
      { wall: '#5c4e41', roof: '#6e6256', trim: '#ad977c', awning: '#3b3229', facade: 'curtain_glass', sign: 'SEAGRAM PLAZA' },
      { wall: '#aba192', roof: '#8c8375', trim: '#595247', awning: '#2e3842', facade: 'masonry',       sign: 'LEONIDA RESERVE' },
      { wall: '#484d54', roof: '#636870', trim: '#bab7af', awning: '#282c30', facade: 'curtain_glass', sign: 'ONE METROPOLIS' },
      { wall: '#324d4c', roof: '#566968', trim: '#96a8a7', awning: '#1f3332', facade: 'curtain_glass', sign: 'BISCAYNE MUTUAL' },
      { wall: '#dce1e5', roof: '#b8c0c7', trim: '#526575', awning: '#2b3d4f', facade: 'balcony',       sign: 'SOLARIS CONDOS' }
    ],
    silicon_campus: [
      { wall: '#d5d9de', roof: '#b5bbc2', trim: '#9c6b43', awning: '#785030', facade: 'curtain_glass', sign: 'BIOTECH ATRIUM' },
      { wall: '#7f8994', roof: '#646d75', trim: '#cfd6de', awning: '#374151', facade: 'curtain_glass', sign: 'HELIOS LABS' },
      { wall: '#ccc5b8', roof: '#aba498', trim: '#4b5563', awning: '#2f4842', facade: 'masonry',       sign: 'LEONIDA INSTITUTE' },
      { wall: '#537368', roof: '#425c53', trim: '#d1ccc0', awning: '#283b34', facade: 'curtain_glass', sign: 'VERDIGRIS CENTER' }
    ],
    midtown_urban: [
      { wall: '#824032', roof: '#595550', trim: '#cbbfa9', awning: '#26533d', facade: 'masonry', sign: 'HAVANA BODEGA' },
      { wall: '#765543', roof: '#5c534c', trim: '#bfa98e', awning: '#7c2935', facade: 'masonry', sign: 'CALLE OCHO CAFE' },
      { wall: '#a3866a', roof: '#696259', trim: '#42403d', awning: '#223c5e', facade: 'masonry', sign: 'MIDTOWN HARDWARE' },
      { wall: '#cfc3ae', roof: '#8f8678', trim: '#9e4733', awning: '#b57826', facade: 'masonry', sign: 'PALM GROCERY' },
      { wall: '#8c8f94', roof: '#6e7175', trim: '#4a4d52', awning: '#334155', facade: 'masonry', sign: 'METRO TRANSIT' },
      { wall: '#6e3b30', roof: '#4f4a46', trim: '#c7b9a3', awning: '#1f4736', facade: 'masonry', sign: 'DOMINO LOUNGE' }
    ],
    industrial_port: [
      { wall: '#6e757b', roof: '#585e63', trim: '#c7882a', awning: '#474c50', facade: 'industrial', sign: 'TERMINAL LOGISTICS' },
      { wall: '#7a4b39', roof: '#5c3c30', trim: '#9e9a93', awning: '#3d2c26', facade: 'industrial', sign: 'LEONIDA FOUNDRY' },
      { wall: '#6e3c30', roof: '#524b47', trim: '#b3aba0', awning: '#3b3835', facade: 'masonry',    sign: 'BAYOU COLD STORAGE' },
      { wall: '#596459', roof: '#464f46', trim: '#9aa19b', awning: '#333b33', facade: 'industrial', sign: 'EVERGLADES MARINE' },
      { wall: '#705842', roof: '#656c70', trim: '#b89f82', awning: '#4a3a2b', facade: 'industrial', sign: 'GATOR BOATWORKS' }
    ]
  };

  function getDistrictPaletteKey(gx, gy) {
    if (gx >= 66) return 'star_estates';
    if (gx >= 53) return 'ocean_deco';
    if (gx < 24 || (gx <= 35 && gy >= 54)) return 'industrial_port';
    if (gy <= 25 && gx >= 24 && gx <= 52) return 'silicon_campus';
    if (Math.hypot(gx - 40, gy - 40) < 12.5) return 'downtown_core';
    return 'midtown_urban';
  }

  function cellHash(x, y) {
    const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
    return n - Math.floor(n);
  }

  function addPalmTree(x, y, r = 22) {
    const tree = {
      x,
      y,
      r,
      trunkR: 9.5,
      hp: 95,
      maxHp: 95,
      falling: false,
      fallen: false,
      fallProgress: 0,
      fallAngle: 0,
      shakeTimer: 0,
      burnTimer: 0,
      maxBurn: 10.5,
      burnt: false,
      regrowTimer: 0
    };
    palmTrees.push(tree);
    const gx = Math.max(0, Math.min(GRID_W - 1, Math.floor(x / TILE_SIZE)));
    const gy = Math.max(0, Math.min(GRID_H - 1, Math.floor(y / TILE_SIZE)));
    if (treesGrid[gy] && treesGrid[gy][gx]) {
      treesGrid[gy][gx].push(tree);
    }
    return tree;
  }

  function computeWindowMode(facadeStyle, seed) {
    if (facadeStyle === 'curtain_glass') return 'glazed';
    if (facadeStyle === 'container' || facadeStyle === 'parking' || facadeStyle === 'industrial') return 'none';
    if (facadeStyle === 'balcony' || facadeStyle === 'art_deco') {
      return seed < 0.52 ? 'glazed' : (seed < 0.80 ? 'minimal' : 'none');
    }
    // Masonry / Stucco / Estates: mostly solid calm plaster/brick walls; ~26% have shatterable glazed windows!
    return seed < 0.26 ? 'glazed' : (seed < 0.54 ? 'minimal' : 'none');
  }

  function registerBuilding(b) {
    const areaFactor = (b.w * b.h) / (90 * 90);
    b.maxHp = b.facadeStyle === 'container'
      ? 190
      : Math.round(230 + areaFactor * 185 + b.height * 3.1);
    b.hp = b.maxHp;
    b.collapsing = false;
    b.collapseProgress = 0;
    b.collapsed = false;
    b.hitShake = 0;
    b.cracks = 0;
    b.smokeTimer = 0;
    b.burnTimer = 0;
    b.ruin = null;
    b.brokenWindows = new Set();

    const wSeed = cellHash(b.x * 0.13 + 7.1, b.y * 0.19 + 3.7);
    b.windowMode = b.windowMode || computeWindowMode(b.facadeStyle, wSeed);
    if (b.tiers && b.tiers.length > 0) {
      for (let t = 0; t < b.tiers.length; t++) {
        const tr = b.tiers[t];
        tr.windowMode = tr.windowMode || computeWindowMode(tr.facadeStyle || b.facadeStyle, cellHash(b.x + t * 23, b.y + t * 41));
      }
    }

    buildings.push(b);
    const minX = Math.max(0, Math.floor(b.x / TILE_SIZE));
    const maxX = Math.min(GRID_W - 1, Math.floor((b.x + b.w) / TILE_SIZE));
    const minY = Math.max(0, Math.floor(b.y / TILE_SIZE));
    const maxY = Math.min(GRID_H - 1, Math.floor((b.y + b.h) / TILE_SIZE));
    for (let gy = minY; gy <= maxY; gy++) {
      for (let gx = minX; gx <= maxX; gx++) {
        buildingsGrid[gy][gx].push(b);
      }
    }
  }

  function initWorld() {
    for (let y = 0; y < GRID_H; y++) {
      buildingsGrid[y] = [];
      bridgeGrid[y] = [];
      settledDebrisGrid[y] = [];
      treesGrid[y] = [];
      for (let x = 0; x < GRID_W; x++) {
        buildingsGrid[y][x] = [];
        bridgeGrid[y][x] = null;
        settledDebrisGrid[y][x] = [];
        treesGrid[y][x] = [];
      }
    }

    // Organic Metropolitan Arterial Avenues & Cross Streets across 80x80
    const roadXSet = new Set([0, 4, 8, 12, 16, 20, 24, 28, 33, 36, 40, 44, 49, 53, 57, 61, 68, 72, 75, 79]);
    const roadYSet = new Set([0, 4, 8, 12, 16, 20, 24, 28, 31, 35, 40, 44, 49, 53, 56, 60, 64, 68, 73, 77, 79]);

    const sprayCoords = new Set(['38,38', '55,34', '16,52', '42,15', '28,62']);

    for (let y = 0; y < GRID_H; y++) {
      worldGrid[y] = [];
      for (let x = 0; x < GRID_W; x++) {
        const isCausewayY = (y === 20 || y === 40 || y === 56);

        // 1. Far East Atlantic Ocean & Observation Pier Bridge (x >= 76)
        if (x >= 76) {
          worldGrid[y][x] = 4;
          if (y === 40 && x <= 77) {
            bridgeGrid[y][x] = { axis: 'x', style: 'causeway', isTower: x === 76, closedEast: x === 77 };
          }
          continue;
        }
        // 1B. Star Island & Venetian Keys (x: 67..74, y: 14..64)
        if (x >= 67 && x <= 74 && y >= 14 && y <= 64) {
          if (y >= 32 && y <= 34) {
            // Venetian Yacht Canal flows continuously East-West; N-S avenues cross OVER on elevated canal bridges!
            worldGrid[y][x] = 4;
            if (x === 68 || x === 72) {
              bridgeGrid[y][x] = { axis: 'y', style: 'canal', isTower: y === 33 };
            }
          } else if (isCausewayY || roadXSet.has(x) || roadYSet.has(y)) {
            worldGrid[y][x] = 0;
          } else {
            worldGrid[y][x] = ((x + y) % 5 === 0) ? 2 : 1;
          }
          continue;
        }
        // 1C. Biscayne Intercoastal Bay (x: 62..75) — Real Water + 3 Grand Cable-Stayed Causeway Bridges!
        if (x >= 62 && x <= 75) {
          worldGrid[y][x] = 4;
          if (isCausewayY && x <= 66) {
            bridgeGrid[y][x] = { axis: 'x', style: 'causeway', isTower: (x === 63 || x === 65) };
          } else if (y === 40 && x === 75) {
            bridgeGrid[y][x] = { axis: 'x', style: 'causeway', isTower: false };
          }
          continue;
        }

        // 2. Golden Vice Beach Coastline (x: 59..61) — Causeway approach roads connect cleanly to bridges
        if (x >= 59 && x <= 61) {
          worldGrid[y][x] = (isCausewayY || y === 8 || y === 73) ? 0 : 3;
          continue;
        }

        // 3. Southwest Leonida International Spaceport & Military Airbase (x: 5..18, y: 47..67)
        if (x >= 5 && x <= 18 && y >= 47 && y <= 67) {
          worldGrid[y][x] = 6;
          continue;
        }

        // 4. Winding Everglades Bayou River & Canals (West Leonida) — Continuous navigable river + Steel Truss Bridges!
        const riverCenter = Math.round(21 + Math.sin(y * 0.16) * 2.2);
        if (x === riverCenter || x === riverCenter + 1) {
          const isRiverBridge = (y === 12 || y === 24 || y === 40 || y === 56 || y === 68);
          worldGrid[y][x] = 4;
          if (isRiverBridge) {
            bridgeGrid[y][x] = { axis: 'x', style: 'truss', isTower: x === riverCenter };
          }
          continue;
        }

        // 5. Southern Shipping Channel at Port Leonida
        if (y >= 76 && x >= 18 && x <= 58) {
          worldGrid[y][x] = 4;
          continue;
        }
        if (x >= 24 && x <= 34 && y >= 58 && y <= 75) {
          if (roadXSet.has(x) || roadYSet.has(y)) {
            worldGrid[y][x] = 0;
          } else if (sprayCoords.has(`${x},${y}`)) {
            worldGrid[y][x] = 5;
          } else {
            worldGrid[y][x] = 7; // Port Concrete Dockyard & Container Stacks
          }
          continue;
        }

        // 6. Organic Metropolitan Street Network
        let isRoadX = roadXSet.has(x);
        let isRoadY = roadYSet.has(y);
        const h = cellHash(Math.floor(x / 4), Math.floor(y / 4));
        if (isRoadX && x !== 40 && x !== 33 && x !== 49 && x !== 57 && x !== 20 && x !== 24 && h < 0.14 && !isCausewayY) {
          isRoadX = false;
        }
        if (isRoadY && y !== 40 && y !== 31 && y !== 49 && y !== 20 && y !== 56 && y !== 12 && y !== 24 && y !== 68 && h > 0.86) {
          isRoadY = false;
        }

        if (isRoadX || isRoadY) {
          worldGrid[y][x] = 0;
        } else if (sprayCoords.has(`${x},${y}`)) {
          worldGrid[y][x] = 5;
          payNSprayRects.push({
            x: x * TILE_SIZE + 12,
            y: y * TILE_SIZE + 12,
            w: TILE_SIZE - 24,
            h: TILE_SIZE - 24
          });
        } else if (cellHash(x * 3, y * 5) < (x < 20 ? 0.44 : 0.27)) {
          worldGrid[y][x] = 2; // Lush Everglades / Urban Botanical Parks (More open breathing room!)
        } else {
          worldGrid[y][x] = 1;
        }
      }
    }

    // Ensure Port Pay N' Spray rect is registered if placed inside Port loop
    for (let y = 0; y < GRID_H; y++) {
      for (let x = 0; x < GRID_W; x++) {
        if (worldGrid[y][x] === 5 && !payNSprayRects.some(r => Math.abs(r.x - (x * TILE_SIZE + 12)) < 5 && Math.abs(r.y - (y * TILE_SIZE + 12)) < 5)) {
          payNSprayRects.push({ x: x * TILE_SIZE + 12, y: y * TILE_SIZE + 12, w: TILE_SIZE - 24, h: TILE_SIZE - 24 });
        }
      }
    }

    // Populate Diverse, Grounded 2.5D Architecture (Multi-Tier Setbacks, L/U Courtyards, Rowhouses, Silos & Villas)
    for (let y = 0; y < GRID_H; y++) {
      for (let x = 0; x < GRID_W; x++) {
        const t = worldGrid[y][x];
        const wx = x * TILE_SIZE;
        const wy = y * TILE_SIZE;
        const h1 = cellHash(x, y);
        const h2 = cellHash(x + 71, y + 37);
        const h3 = cellHash(x * 13 + 7, y * 29 + 11);
        const h4 = cellHash(x * 41 + 19, y * 17 + 53);

        if (t === 1) {
          const distKey = getDistrictPaletteKey(x, y);
          const palList = DISTRICT_MATERIALS[distKey];
          const matA = palList[Math.floor(h1 * palList.length)];
          const matB = palList[Math.floor(h2 * palList.length)];
          const matC = palList[Math.floor(h3 * palList.length)];

          const distFromCore = Math.hypot(x - 40, y - 40);
          const isCore = distKey === 'downtown_core';
          const isDeco = distKey === 'ocean_deco';
          const isStar = distKey === 'star_estates';
          const isInd  = distKey === 'industrial_port';
          const isSil  = distKey === 'silicon_campus';

          // ~23% of urban blocks are open landscaped civic plazas, villa lawns, or palm courtyards (ZERO building cram!)
          if (h4 < (isCore ? 0.16 : 0.24)) {
            const openKind = isStar || isDeco ? 'villa_pool' : (isInd ? 'industrial_yard' : (h2 < 0.5 ? 'plaza' : 'garden'));
            courtyardProps.push({ x: wx + 18, y: wy + 18, w: TILE_SIZE - 36, h: TILE_SIZE - 36, kind: openKind });
            if (!isInd) {
              addPalmTree(wx + 38 + h1 * 22, wy + 38 + h2 * 22, 22);
              if (h3 > 0.35) addPalmTree(wx + TILE_SIZE - 38 - h2 * 18, wy + TILE_SIZE - 38 - h1 * 18, 22);
            }
          } else if (isStar) {
            courtyardProps.push({ x: wx + 22, y: wy + 78, w: 116, h: 62, kind: 'villa_pool' });
            registerBuilding({
              x: wx + 20, y: wy + 18, w: 120, h: 52, height: 26 + Math.floor(h1 * 16),
              wallColor: matA.wall, roofColor: matA.roof, trimColor: matA.trim, awningColor: matA.awning,
              facadeStyle: matA.facade, roofType: matA.facade === 'balcony' ? 'pool_terrace' : 'terracotta_hip',
              tiers: h2 < 0.55 ? [{ dx: 32, dy: 6, w: 56, h: 34, height: 42 + Math.floor(h3 * 12), wallColor: matA.wall, roofColor: matA.roof, trimColor: matA.trim, facadeStyle: matA.facade, roofType: 'terracotta_hip' }] : undefined
            });
            addPalmTree(wx + 32, wy + 132, 21);
            if (h3 > 0.4) addPalmTree(wx + 128, wy + 132, 21);
          } else if (isDeco) {
            if (h2 < 0.50) {
              courtyardProps.push({ x: wx + 20, y: wy + 96, w: 120, h: 46, kind: 'villa_pool' });
              registerBuilding({
                x: wx + 18, y: wy + 18, w: 124, h: 70, height: 36 + Math.floor(h1 * 22),
                wallColor: matA.wall, roofColor: matA.roof, trimColor: matA.trim, awningColor: matA.awning,
                facadeStyle: 'art_deco', roofType: 'clean_coping', sign: h3 < 0.5 ? matA.sign : null,
                tiers: [
                  { dx: 22, dy: 10, w: 80, h: 46, height: 56 + Math.floor(h1 * 22), wallColor: matA.wall, roofColor: matA.roof, trimColor: matA.trim, facadeStyle: 'art_deco', roofType: 'clean_coping' }
                ]
              });
              addPalmTree(wx + 34, wy + 132, 20);
              addPalmTree(wx + 126, wy + 132, 20);
            } else if (h2 < 0.82) {
              courtyardProps.push({ x: wx + 82, y: wy + 22, w: 58, h: 116, kind: 'plaza' });
              registerBuilding({
                x: wx + 18, y: wy + 20, w: 58, h: 120, height: 46 + Math.floor(h1 * 38),
                wallColor: matA.wall, roofColor: matA.roof, trimColor: matA.trim, awningColor: matA.awning,
                facadeStyle: matA.facade, roofType: 'pool_terrace', sign: h4 < 0.5 ? matA.sign : null
              });
              addPalmTree(wx + 112, wy + 80, 22);
            } else {
              registerBuilding({
                x: wx + 22, y: wy + 22, w: 116, h: 116, height: 26,
                wallColor: '#dfd9ce', roofColor: '#c7bfb0', trimColor: matA.trim,
                facadeStyle: 'masonry', roofType: 'pool_terrace',
                tiers: [
                  { dx: 18, dy: 18, w: 80, h: 80, height: 84 + Math.floor(h1 * 36), shape: 'cylinder', wallColor: matA.wall, roofColor: matA.roof, trimColor: matA.trim, facadeStyle: 'balcony', roofType: 'helipad' }
                ]
              });
            }
          } else if (isCore) {
            if (x === 41 && y === 39) {
              courtyardProps.push({ x: wx + 14, y: wy + 14, w: 132, h: 132, kind: 'plaza' });
              addPalmTree(wx + 26, wy + 26, 20);
              addPalmTree(wx + 134, wy + 134, 20);
            } else {
              const coreBoost = Math.max(0, Math.round((13 - distFromCore) * 4.2));
              if (h2 < 0.36) {
                const hBase = 30 + Math.floor(h3 * 12);
                const hMid  = 84 + Math.floor(h1 * 36) + coreBoost;
                const hTop  = hMid + 26 + Math.floor(h4 * 22);
                registerBuilding({
                  x: wx + 18, y: wy + 18, w: 124, h: 124, height: hBase,
                  wallColor: matC.wall, roofColor: matC.roof, trimColor: matC.trim, awningColor: matC.awning,
                  facadeStyle: 'masonry', roofType: 'clean_coping', sign: h3 < 0.45 ? matA.sign : null,
                  tiers: [
                    { dx: 16, dy: 16, w: 92, h: 92, height: hMid, wallColor: matA.wall, roofColor: matA.roof, trimColor: matA.trim, facadeStyle: matA.facade, roofType: 'gravel_mech' },
                    { dx: 30, dy: 30, w: 64, h: 64, height: hTop, wallColor: matA.wall, roofColor: matA.roof, trimColor: matA.trim, facadeStyle: matA.facade, roofType: h1 < 0.45 ? 'helipad' : 'gravel_mech' }
                  ]
                });
              } else if (h2 < 0.72) {
                courtyardProps.push({ x: wx + 16, y: wy + 16, w: 128, h: 128, kind: 'plaza' });
                const mainH = 88 + Math.floor(h1 * 48) + coreBoost;
                registerBuilding({
                  x: wx + 20, y: wy + 20, w: 74, h: 120, height: mainH,
                  wallColor: matA.wall, roofColor: matA.roof, trimColor: matA.trim,
                  facadeStyle: matA.facade, roofType: h4 < 0.4 ? 'helipad' : 'gravel_mech',
                  sign: h3 < 0.4 ? matA.sign : null
                });
                addPalmTree(wx + 118, wy + 80, 22);
              } else if (h2 < 0.88) {
                registerBuilding({
                  x: wx + 20, y: wy + 20, w: 120, h: 120, height: 30,
                  wallColor: '#aba192', roofColor: '#8c8375', trimColor: '#595247',
                  facadeStyle: 'masonry', roofType: 'green_roof',
                  tiers: [
                    { dx: 18, dy: 18, w: 84, h: 84, height: 104 + Math.floor(h1 * 44) + coreBoost, shape: 'cylinder', wallColor: matA.wall, roofColor: matA.roof, trimColor: matA.trim, facadeStyle: 'curtain_glass', roofType: 'helipad' }
                  ]
                });
              } else {
                registerBuilding({
                  x: wx + 18, y: wy + 18, w: 124, h: 124, height: 46 + Math.floor(h1 * 22),
                  wallColor: '#8d9196', roofColor: '#696d73', trimColor: '#eab308',
                  facadeStyle: 'parking', roofType: 'parking_deck', sign: 'PUBLIC PARKING'
                });
              }
            }
          } else if (isSil) {
            courtyardProps.push({ x: wx + 18, y: wy + 86, w: 124, h: 56, kind: 'garden' });
            registerBuilding({
              x: wx + 18, y: wy + 18, w: 124, h: 62, height: 46 + Math.floor(h1 * 30),
              wallColor: matA.wall, roofColor: matA.roof, trimColor: matA.trim,
              facadeStyle: matA.facade, roofType: h2 < 0.5 ? 'green_roof' : 'sawtooth', sign: h3 < 0.4 ? matA.sign : null,
              tiers: h2 >= 0.5 ? [{ dx: 24, dy: 10, w: 76, h: 40, height: 68 + Math.floor(h3 * 22), wallColor: matB.wall, roofColor: matB.roof, trimColor: matB.trim, facadeStyle: 'curtain_glass', roofType: 'green_roof' }] : undefined
            });
            addPalmTree(wx + 42, wy + 116, 20);
            addPalmTree(wx + 118, wy + 116, 20);
          } else if (isInd) {
            courtyardProps.push({ x: wx + 14, y: wy + 14, w: 132, h: 132, kind: 'industrial_yard' });
            if (h2 < 0.36) {
              registerBuilding({
                x: wx + 24, y: wy + 26, w: 56, h: 56, height: 46 + Math.floor(h1 * 20),
                shape: 'cylinder', wallColor: '#b0b7bd', roofColor: '#8d959c', trimColor: '#c7882a',
                facadeStyle: 'industrial', roofType: 'clean_coping'
              });
              if (h3 > 0.45) {
                registerBuilding({
                  x: wx + 88, y: wy + 84, w: 50, h: 50, height: 40 + Math.floor(h2 * 18),
                  shape: 'cylinder', wallColor: '#a3abb2', roofColor: '#848c94', trimColor: '#c7882a',
                  facadeStyle: 'industrial', roofType: 'clean_coping'
                });
              }
            } else {
              registerBuilding({
                x: wx + 18, y: wy + 22, w: 124, h: 78, height: 32 + Math.floor(h1 * 22),
                wallColor: matA.wall, roofColor: matA.roof, trimColor: matA.trim,
                facadeStyle: matA.facade, roofType: h2 < 0.68 ? 'sawtooth' : 'corrugated', sign: h3 < 0.4 ? matA.sign : null
              });
            }
          } else {
            if (h2 < 0.42) {
              courtyardProps.push({ x: wx + 18, y: wy + 84, w: 124, h: 58, kind: 'garden' });
              registerBuilding({
                x: wx + 18, y: wy + 18, w: 124, h: 58, height: 34 + Math.floor(h1 * 28),
                wallColor: matA.wall, roofColor: matA.roof, trimColor: matA.trim, awningColor: matA.awning,
                facadeStyle: 'masonry', roofType: h3 < 0.4 ? 'water_tower' : 'gravel_mech', sign: h4 < 0.4 ? matA.sign : null
              });
              addPalmTree(wx + 80, wy + 114, 21);
            } else if (h2 < 0.78) {
              courtyardProps.push({ x: wx + 84, y: wy + 18, w: 58, h: 124, kind: 'plaza' });
              registerBuilding({
                x: wx + 18, y: wy + 18, w: 60, h: 124, height: 38 + Math.floor(h1 * 28),
                wallColor: matA.wall, roofColor: matA.roof, trimColor: matA.trim, awningColor: matA.awning,
                facadeStyle: 'masonry', roofType: h1 < 0.45 ? 'water_tower' : 'clean_coping', sign: h3 < 0.38 ? matA.sign : null
              });
              addPalmTree(wx + 114, wy + 80, 20);
            } else {
              registerBuilding({
                x: wx + 22, y: wy + 22, w: 116, h: 116, height: 32 + Math.floor(h1 * 18),
                wallColor: h3 < 0.4 ? '#8a8d91' : matA.wall,
                roofColor: '#686b70', trimColor: matA.trim, awningColor: matA.awning,
                facadeStyle: h3 < 0.4 ? 'parking' : 'masonry',
                roofType: h3 < 0.4 ? 'parking_deck' : 'gravel_mech',
                tiers: h3 >= 0.4 ? [{ dx: 22, dy: 22, w: 72, h: 72, height: 58 + Math.floor(h4 * 22), wallColor: matB.wall, roofColor: matB.roof, trimColor: matB.trim, facadeStyle: 'masonry', roofType: 'water_tower' }] : undefined
              });
            }
          }

          if ((x + y) % 2 === 0) {
            streetlamps.push({ x: wx + 8, y: wy + 8 });
          }
        } else if (t === 7) {
          const containerColors = ['#2b5b84', '#9b3428', '#b87324', '#2d6a4f', '#5c6670', '#7c3f2c'];
          const c1 = containerColors[Math.floor(h1 * containerColors.length)];
          const c3 = containerColors[Math.floor(h3 * containerColors.length)];
          registerBuilding({
            x: wx + 18, y: wy + 34, w: 124, h: 42,
            height: 22 + Math.floor(h1 * 18),
            wallColor: c1, roofColor: c1, trimColor: '#d6d3d1',
            facadeStyle: 'container', roofType: 'corrugated',
            tiers: h3 > 0.45 ? [{ dx: 18, dy: 4, w: 64, h: 34, height: 42 + Math.floor(h2 * 12), wallColor: c3, roofColor: c3, trimColor: '#d6d3d1', facadeStyle: 'container', roofType: 'corrugated' }] : undefined
          });
        } else if (t === 6 && x === 6 && (y === 50 || y === 55 || y === 62)) {
          registerBuilding({
            x: wx + 12, y: wy + 12, w: TILE_SIZE - 24, h: TILE_SIZE - 24,
            height: 44,
            wallColor: '#788088', roofColor: '#5c646b', trimColor: '#c98a2c',
            facadeStyle: 'industrial', roofType: y === 55 ? 'helipad' : 'corrugated',
            sign: y === 55 ? 'LEONIDA ATC TOWER' : 'HANGAR BAY',
            tiers: y === 55 ? [{ dx: 42, dy: 42, w: 52, h: 52, height: 108, wallColor: '#cbd5e1', roofColor: '#64748b', trimColor: '#38bdf8', facadeStyle: 'curtain_glass', roofType: 'clean_coping' }] : undefined
          });
        } else if (t === 2) {
          addPalmTree(wx + 34 + h1 * 26, wy + 34 + h2 * 26, 22);
          if (h3 > 0.24) {
            addPalmTree(wx + TILE_SIZE - 36 - h2 * 22, wy + TILE_SIZE - 36 - h1 * 22, 24);
          }
          if (h4 > 0.58) {
            addPalmTree(wx + 76 + (h1 - 0.5) * 28, wy + 80 + (h2 - 0.5) * 28, 21);
          }
        } else if (t === 3) {
          if (x === 59 && h1 > 0.30) {
            addPalmTree(wx + 32, wy + 40 + h2 * 60, 22);
          }
          if (x === 60 && h2 > 0.32) {
            const umbCols = ['#d94e4e', '#2a9d8f', '#e9c46a', '#2563eb', '#e76f51'];
            beachProps.push({
              x: wx + 45 + h1 * 70,
              y: wy + 35 + h3 * 90,
              color: umbCols[Math.floor((h1 + h2) * 5) % umbCols.length]
            });
          }
        }
      }
    }

    // 8 Insane Stunt Jump Ramps across Bridges, Canals, Port & Spaceport!
    stuntJumps.push(
      { x: 61 * TILE_SIZE + 80, y: 40 * TILE_SIZE + 80, dir: 0 },
      { x: 61 * TILE_SIZE + 80, y: 20 * TILE_SIZE + 80, dir: 0 },
      { x: 67 * TILE_SIZE + 80, y: 56 * TILE_SIZE + 80, dir: Math.PI },
      { x: 24 * TILE_SIZE + 80, y: 40 * TILE_SIZE + 80, dir: Math.PI },
      { x: 18 * TILE_SIZE + 80, y: 56 * TILE_SIZE + 80, dir: 0 },
      { x: 40 * TILE_SIZE + 80, y: 31 * TILE_SIZE + 80, dir: -Math.PI / 2 },
      { x: 40 * TILE_SIZE + 80, y: 49 * TILE_SIZE + 80, dir: Math.PI / 2 },
      { x: 28 * TILE_SIZE + 80, y: 60 * TILE_SIZE + 80, dir: -Math.PI / 2 }
    );

    // 7 Explosive RON-99 HYPER-OCTANE Gas Stations across all Major Districts (Domino Chain-Reactions!)
    const gasCoords = [
      { gx: 42, gy: 40, dx: 0,   dy: -54, name: 'DOWNTOWN OCTANE' },
      { gx: 57, gy: 42, dx: -52, dy: 0,   name: 'OCEAN DRIVE FUEL' },
      { gx: 31, gy: 40, dx: 0,   dy: 54,  name: 'MIDTOWN PETRO' },
      { gx: 40, gy: 21, dx: 54,  dy: 0,   name: 'SILICON HYPER-FUEL' },
      { gx: 29, gy: 57, dx: -54, dy: 0,   name: 'PORT DOCKS DIESEL' },
      { gx: 23, gy: 39, dx: 52,  dy: 0,   name: 'BAYOU OUTPOST GAS' },
      { gx: 20, gy: 56, dx: 0,   dy: -54, name: 'SPACEPORT AVGAS' }
    ];
    for (const gc of gasCoords) {
      const cx = gc.gx * TILE_SIZE + 80 + gc.dx;
      const cy = gc.gy * TILE_SIZE + 80 + gc.dy;
      gasStations.push({
        x: cx,
        y: cy,
        name: gc.name,
        exploded: false,
        pumps: [
          { x: cx - 22, y: cy, hp: 65, leaking: false, fuseTimer: 0, exploded: false },
          { x: cx + 22, y: cy, hp: 65, leaking: false, fuseTimer: 0, exploded: false }
        ]
      });
    }

    // 5 Destructible High-Voltage Grid Substations (Triggers Rolling District Power Blackouts!)
    const powerCoords = [
      { gx: 37, gy: 38, name: 'DOWNTOWN GRID-A1', radius: 1750 },
      { gx: 55, gy: 38, name: 'OCEAN DRIVE SUB-2', radius: 1650 },
      { gx: 39, gy: 17, name: 'SILICON HILLS HV-3', radius: 1650 },
      { gx: 27, gy: 61, name: 'PORT LEONIDA SUB-4', radius: 1650 },
      { gx: 67, gy: 41, name: 'STAR ISLAND GRID-5', radius: 1550 }
    ];
    for (const pc of powerCoords) {
      powerNodes.push({
        x: pc.gx * TILE_SIZE + 22,
        y: pc.gy * TILE_SIZE + 22,
        name: pc.name,
        hp: 180,
        maxHp: 180,
        destroyed: false,
        blackoutTimer: 0,
        blackoutRadius: pc.radius,
        flickerTimer: 0
      });
    }

    // 10 Ringing Green Payphones across all 7 Mega-Districts
    const phoneCoords = [
      { gx: 40, gy: 40, gang: 'runners',   title: 'CARBON HYPER-RUN',   type: 'checkpoint' },
      { gx: 57, gy: 40, gang: 'syndicate', title: 'OCEAN DRIVE VIP HIT',type: 'bounty' },
      { gx: 68, gy: 40, gang: 'syndicate', title: 'STAR ISLAND HEIST',  type: 'checkpoint' },
      { gx: 24, gy: 40, gang: 'gators',    title: 'EVERGLADES RAMPAGE', type: 'rampage' },
      { gx: 19, gy: 56, gang: 'gators',    title: 'SPACEPORT TAKEDOWN', type: 'bounty' },
      { gx: 40, gy: 20, gang: 'runners',   title: 'SILICON HILLS PURGE',type: 'rampage' },
      { gx: 28, gy: 56, gang: 'gators',    title: 'PORT DOCKS AMBUSH',  type: 'bounty' },
      { gx: 49, gy: 31, gang: 'runners',   title: 'SKY-RAIL SPRINT',    type: 'checkpoint' }
    ];
    for (const pc of phoneCoords) {
      payphones.push({
        x: pc.gx * TILE_SIZE - 14,
        y: pc.gy * TILE_SIZE - 14,
        gang: pc.gang,
        title: pc.title,
        type: pc.type,
        ringTimer: 0
      });
    }

    // 22 Weapon, Railgun, EMP, Health & Armor Crates across the 80x80 Mega-State
    const pickupSpots = [
      { gx: 40, gy: 39, kind: 'railgun' },
      { gx: 41, gy: 40, kind: 'emp' },
      { gx: 39, gy: 40, kind: 'smg' },
      { gx: 44, gy: 40, kind: 'rocket' },
      { gx: 40, gy: 42, kind: 'health' },
      { gx: 42, gy: 38, kind: 'armor' },
      { gx: 57, gy: 40, kind: 'railgun' },
      { gx: 60, gy: 40, kind: 'health' },
      { gx: 68, gy: 40, kind: 'rocket' },
      { gx: 70, gy: 20, kind: 'emp' },
      { gx: 14, gy: 56, kind: 'railgun' },
      { gx: 10, gy: 52, kind: 'rocket' },
      { gx: 12, gy: 60, kind: 'armor' },
      { gx: 28, gy: 64, kind: 'shotgun' },
      { gx: 24, gy: 24, kind: 'flame' },
      { gx: 40, gy: 16, kind: 'railgun' },
      { gx: 49, gy: 49, kind: 'emp' },
      { gx: 33, gy: 31, kind: 'shotgun' }
    ];
    for (const ps of pickupSpots) {
      pickups.push({
        x: ps.gx * TILE_SIZE + TILE_SIZE * 0.5,
        y: ps.gy * TILE_SIZE + TILE_SIZE * 0.5,
        kind: ps.kind,
        respawnTimer: 0
      });
    }

    // Precompute Hydrological Biomes, Continuous Bathymetry Depth & Organic Riverbank Flora
    for (let y = 0; y < GRID_H; y++) {
      waterMeta[y] = [];
      for (let x = 0; x < GRID_W; x++) {
        if (worldGrid[y][x] !== 4) {
          waterMeta[y][x] = null;
          continue;
        }
        let biome = 'bay';
        if (x <= 26 && y < 72) biome = 'river';
        else if (x <= 28 && y >= 72) biome = 'estuary';
        else if (y >= 75 && x <= 58) biome = 'harbor';
        else if (x >= 67 && x <= 74 && y >= 32 && y <= 34) biome = 'canal';
        else if (x >= 76) biome = 'ocean';

        // Exact Euclidean distance to nearest non-water land tile for smooth shallow-to-abyss bathymetry
        let minDistSq = 25;
        for (let dy = -4; dy <= 4; dy++) {
          const ny = y + dy;
          if (ny < 0 || ny >= GRID_H) continue;
          for (let dx = -4; dx <= 4; dx++) {
            const nx = x + dx;
            if (nx < 0 || nx >= GRID_W) continue;
            if (worldGrid[ny][nx] !== 4) {
              const d2 = dx * dx + dy * dy;
              if (d2 < minDistSq) minDistSq = d2;
            }
          }
        }
        const minDist = Math.sqrt(minDistSq);
        const depthNorm = Math.max(0, Math.min(1, (minDist - 1.0) / 3.2));

        const typeN = y > 0 ? worldGrid[y - 1][x] : 4;
        const typeS = y < GRID_H - 1 ? worldGrid[y + 1][x] : 4;
        const typeW = x > 0 ? worldGrid[y][x - 1] : 4;
        const typeE = x < GRID_W - 1 ? worldGrid[y][x + 1] : 4;

        // Deterministic organic lily pads, reeds & coastal boulders along natural river/park banks
        const naturalProps = [];
        const hasBridge = !!bridgeGrid[y][x];
        if (!hasBridge && (biome === 'river' || biome === 'estuary' || typeN === 2 || typeS === 2 || typeW === 2 || typeE === 2)) {
          for (let k = 0; k < 5; k++) {
            const hk = cellHash(x * 19 + k * 7, y * 31 + k * 13);
            const hk2 = cellHash(x * 43 + k * 5, y * 17 + k * 23);
            if (typeW !== 4 && hk < 0.68) {
              naturalProps.push({ kind: hk > 0.32 ? 'lily' : 'boulder', ox: 12 + hk * 28, oy: 18 + hk2 * 124, r: 4.5 + hk * 4.5 });
            }
            if (typeE !== 4 && hk2 < 0.68) {
              naturalProps.push({ kind: hk2 > 0.32 ? 'lily' : 'boulder', ox: TILE_SIZE - 12 - hk2 * 28, oy: 18 + hk * 124, r: 4.5 + hk2 * 4.5 });
            }
          }
        }

        waterMeta[y][x] = {
          biome,
          depthNorm,
          estuaryMix: biome === 'estuary' ? Math.max(0, Math.min(1, (x - 20) / 8 + (y - 74) * 0.15)) : 0,
          typeN, typeS, typeW, typeE,
          naturalProps
        };
      }
    }

    // Pre-bake 400x400 Satellite Terrain Texture (with Bathymetry, River-to-Sea Gradient & Elevated Bridges!)
    const bctx = baseMapCanvas.getContext('2d');
    const pxPerTile = baseMapCanvas.width / GRID_W; // 5px per tile
    bctx.fillStyle = '#0c1622';
    bctx.fillRect(0, 0, baseMapCanvas.width, baseMapCanvas.height);
    for (let y = 0; y < GRID_H; y++) {
      for (let x = 0; x < GRID_W; x++) {
        const t = worldGrid[y][x];
        if (t === 0) bctx.fillStyle = '#262b33';
        else if (t === 1) bctx.fillStyle = '#8a8277';
        else if (t === 2) bctx.fillStyle = '#2d6a4f';
        else if (t === 3) bctx.fillStyle = '#dec08b';
        else if (t === 4) {
          const wm = waterMeta[y][x];
          if (wm.biome === 'river') bctx.fillStyle = wm.depthNorm > 0.25 ? '#164237' : '#245c4b';
          else if (wm.biome === 'estuary') bctx.fillStyle = '#144d52';
          else if (wm.biome === 'harbor') bctx.fillStyle = '#0d3b4c';
          else if (wm.biome === 'canal') bctx.fillStyle = '#0d9488';
          else if (wm.biome === 'ocean') bctx.fillStyle = wm.depthNorm > 0.5 ? '#0b2545' : '#0369a1';
          else bctx.fillStyle = wm.depthNorm < 0.28 ? '#0ea5b7' : '#0284c7';
        }
        else if (t === 5) bctx.fillStyle = '#eab308';
        else if (t === 6) bctx.fillStyle = '#475569';
        else if (t === 7) bctx.fillStyle = '#6b7280';
        bctx.fillRect(x * pxPerTile, y * pxPerTile, pxPerTile, pxPerTile);

        const br = bridgeGrid[y][x];
        if (br) {
          bctx.fillStyle = '#cbd5e1';
          if (br.axis === 'x') {
            bctx.fillRect(x * pxPerTile, y * pxPerTile + 1, pxPerTile, pxPerTile - 2);
          } else {
            bctx.fillRect(x * pxPerTile + 1, y * pxPerTile, pxPerTile - 2, pxPerTile);
          }
        }
      }
    }
    // Draw Sky-Rail loop on pre-baked map
    bctx.strokeStyle = 'rgba(56, 189, 248, 0.7)';
    bctx.lineWidth = 1.8;
    bctx.strokeRect(33 * pxPerTile, 31 * pxPerTile, 16 * pxPerTile, 18 * pxPerTile);
  }

  initWorld();

  // ==========================================
  // 3. EXPANDED 2027 WEAPONRY (7 SLOTS WITH LETHAL DEGREES)
  // ==========================================
  const WEAPONS = [
    { id: 'pistol',  name: '9MM PISTOL',      cooldown: 0.19, speed: 940,  damage: 30,  structDmg: 6,   tierLabel: 'TIER I • LIGHT BALLISTIC (GLASS)', tierColor: '#fde047', spread: 0.04, count: 1, range: 680,  color: '#ffe600' },
    { id: 'smg',     name: 'VIPER MICRO-SMG', cooldown: 0.07, speed: 1020, damage: 22,  structDmg: 11,  tierLabel: 'TIER II • RAPID BREACHER',        tierColor: '#38bdf8', spread: 0.11, count: 1, range: 640,  color: '#00f0ff' },
    { id: 'shotgun', name: 'COMBAT SHOTGUN',  cooldown: 0.52, speed: 880,  damage: 25,  structDmg: 11,  tierLabel: 'TIER II • HEAVY BUCKSHOT',        tierColor: '#fb923c', spread: 0.24, count: 8, range: 440,  color: '#ff9100' },
    { id: 'rocket',  name: 'RPG LAUNCHER',    cooldown: 0.90, speed: 680,  damage: 260, structDmg: 420, tierLabel: 'TIER V • HEAVY DEMOLITION',       tierColor: '#ff1744', spread: 0.02, count: 1, range: 960,  color: '#ff1744', explosive: true, demolish: true },
    { id: 'flame',   name: 'FLAMETHROWER',    cooldown: 0.04, speed: 430,  damage: 11,  structDmg: 15,  tierLabel: 'TIER III • THERMAL INCENDIARY',   tierColor: '#f97316', spread: 0.28, count: 2, range: 265,  color: '#ff6d00', flame: true },
    { id: 'railgun', name: 'CARBON RAILGUN',  cooldown: 0.68, speed: 2400, damage: 360, structDmg: 315, tierLabel: 'TIER IV • ANTI-MATERIEL CORE',    tierColor: '#00f0ff', spread: 0.0,  count: 1, range: 1150, color: '#00f0ff', railgun: true },
    { id: 'emp',     name: 'EMP SHOCKWAVE',   cooldown: 1.15, speed: 0,    damage: 150, structDmg: 85,  tierLabel: 'TIER III • ELECTRO-SHATTER',      tierColor: '#c084fc', spread: 0.0,  count: 1, range: 360,  color: '#a855f7', emp: true }
  ];

  // ==========================================
  // 4. PLAYER, REALISTIC VEHICLE SPECS, PARACHUTE & STATE
  // ==========================================
  const player = {
    x: 40 * TILE_SIZE + 80,
    y: 40 * TILE_SIZE + 80,
    z: 0,
    vx: 0,
    vy: 0,
    angle: 0,
    radius: 13,
    health: 100,
    maxHealth: 100,
    armor: 75,
    maxArmor: 100,
    reflex: 100,
    maxReflex: 100,
    reflexActive: false,
    nitro: 100,
    cash: 2500,
    multiplier: 1,
    multTimer: 0,
    wanted: 0,
    wantedDecay: 0,
    vehicle: null,
    parachute: null,
    burnTimer: 0,
    weaponIdx: 0,
    ammo: {
      pistol: Infinity,
      smg: 240,
      shotgun: 60,
      rocket: 18,
      flame: 320,
      railgun: 20,
      emp: 10
    },
    fireTimer: 0,
    stepPhase: 0,
    currentDistrict: ''
  };

  // Grounded, Realistic Vehicle Speed Hierarchy: Heavy Slow Tank (175) -> Skate (195) -> Truck (255) -> Sedans (325) -> Bike (460) -> Falcon Heli (480) -> Hyper (505) -> Jet (685)
  const VEHICLE_SPECS = {
    sedan:    { name: 'LEONIDA PREMIER',     w: 56, h: 27, maxSpeed: 325, accel: 285, grip: 0.92, maxHp: 270,  mass: 1.2,  colors: ['#94a3b8', '#475569', '#e2e8f0', '#1e3a8a', '#7f1d1d', '#d6cfc2'] },
    suv:      { name: 'NAVIGATOR LUX SUV',   w: 64, h: 30, maxSpeed: 335, accel: 295, grip: 0.91, maxHp: 360,  mass: 1.7,  colors: ['#1e293b', '#f8fafc', '#64748b', '#3f3f46', '#14532d', '#451a03'] },
    hyper:    { name: 'CARBON X-2027',       w: 62, h: 30, maxSpeed: 505, accel: 465, grip: 0.96, maxHp: 340,  mass: 1.3,  colors: ['#00f0ff', '#ff2a85', '#a855f7', '#39ff14'], isHyper: true },
    banshee:  { name: 'VICE BANSHEE GT',     w: 54, h: 26, maxSpeed: 425, accel: 385, grip: 0.92, maxHp: 240,  mass: 1.05, colors: ['#dc2626', '#0284c7', '#eab308', '#f8fafc'], stripe: true },
    stinger:  { name: 'INFERNUS TURBO',      w: 56, h: 27, maxSpeed: 445, accel: 405, grip: 0.91, maxHp: 220,  mass: 1.05, colors: ['#e11d48', '#ea580c', '#facc15', '#f8fafc'], stripe: false },
    muscle:   { name: 'SABRE MUSCLE',        w: 56, h: 28, maxSpeed: 375, accel: 340, grip: 0.84, maxHp: 310,  mass: 1.45, colors: ['#ea580c', '#b91c1c', '#1d4ed8', '#18181b'], stripe: true },
    cab:      { name: 'KAUFMAN CAB',         w: 54, h: 27, maxSpeed: 310, accel: 275, grip: 0.91, maxHp: 280,  mass: 1.15, colors: ['#facc15'], isCab: true },
    truck:    { name: 'HAULER 18-WHEELER',   w: 96, h: 34, maxSpeed: 255, accel: 210, grip: 0.88, maxHp: 900,  mass: 4.6,  colors: ['#b91c1c', '#1d4ed8', '#15803d', '#c2410c', '#cbd5e1'], isTruck: true },
    firetruck:{ name: 'LEONIDA FD ENGINE 07',w: 90, h: 33, maxSpeed: 295, accel: 245, grip: 0.90, maxHp: 1100, mass: 5.2,  colors: ['#dc2626'], isFiretruck: true },
    bike:     { name: 'PCJ-600 SUPERBIKE',   w: 38, h: 14, maxSpeed: 460, accel: 455, grip: 0.95, maxHp: 150,  mass: 0.45, colors: ['#e11d48', '#16a34a', '#0284c7', '#eab308'], isBike: true, exposedRider: true },
    skate:    { name: 'NEON SKATEBOARD',     w: 28, h: 10, maxSpeed: 195, accel: 290, grip: 0.97, maxHp: 100,  mass: 0.25, colors: ['#ff2a85', '#00f0ff', '#39ff14', '#ffe600'], isSkate: true, exposedRider: true },
    falcon:   { name: 'FALCON GUNSHIP HELI',   w: 98,  h: 46,  maxSpeed: 480, accel: 360, grip: 0.94, maxHp: 640,  mass: 2.8,  colors: ['#dc2626', '#0284c7', '#3f4f3e', '#ea580c'], isHeli: true, isFalcon: true },
    jet:      { name: 'HYDRA VTOL JET',        w: 182, h: 152, maxSpeed: 685, accel: 540, grip: 0.96, maxHp: 920,  mass: 6.2,  colors: ['#475569', '#334155', '#1e293b'], isJet: true },
    airliner: { name: 'LEONIDA AIRWAYS 747-8', w: 404, h: 386, maxSpeed: 540, accel: 290, grip: 0.98, maxHp: 2200, mass: 28.0, colors: ['#0284c7', '#0ea5e9', '#1d4ed8'], isJet: true, isAirliner: true },
    tank:     { name: 'RHINO M1A3 TANK',       w: 78,  h: 44,  maxSpeed: 175, accel: 165, grip: 0.98, maxHp: 2400, mass: 12.0, colors: ['#3f4f3e', '#334155'], isTank: true },
    boat:     { name: 'VIPER SPEEDBOAT',       w: 88,  h: 30,  maxSpeed: 370, accel: 315, grip: 0.89, maxHp: 320,  mass: 1.5,  colors: ['#f8fafc', '#e11d48', '#0284c7'], isBoat: true },
    heli:     { name: 'VCPD MAVERICK',         w: 98,  h: 46,  maxSpeed: 470, accel: 350, grip: 0.94, maxHp: 540,  mass: 2.5,  colors: ['#111827'], isPolice: true, isHeli: true },
    police:   { name: 'VCPD INTERCEPTOR',    w: 56, h: 27, maxSpeed: 395, accel: 360, grip: 0.93, maxHp: 330,  mass: 1.3,  colors: ['#111827'], isPolice: true },
    swat:     { name: 'LEONIDA SWAT VAN',    w: 66, h: 32, maxSpeed: 290, accel: 250, grip: 0.95, maxHp: 650,  mass: 2.8,  colors: ['#1e293b'], isPolice: true, isSwat: true }
  };

  const vehicles = [];
  const peds = [];
  const bullets = [];
  const railBeams = [];   // Instantaneous glowing Railgun plasma traces
  const shockwaves = [];  // Expanding shockwave / EMP / Drop-Pod rings
  const particles = [];
  const skidMarks = [];
  const floatingTexts = [];
  let customWaypoint = null; // { x, y } set from Megamap

  let activeMission = null;

  // Live WLTV Action News 6 PiP Broadcast, Sky-Drone Photo Cam & Stunt Jump State
  const newsState = {
    manualOverride: null, // null = auto (3★+ or disaster), true = forced ON, false = forced OFF
    disasterTimer: 0,
    headline: 'WLTV SKY-CAM 6 LIVE OVER LEONIDA METROPOLIS',
    headlineTimer: 0
  };
  const droneState = {
    active: false,
    x: 40 * TILE_SIZE + 80,
    y: 40 * TILE_SIZE + 80,
    zoom: 0.42
  };
  const stuntState = {
    active: false,
    startX: 0,
    startY: 0,
    slowMoTimer: 0
  };
  let fireDispatchCooldown = 0;

  function setBreakingNews(text, disasterBoostSec = 0) {
    newsState.headline = text;
    newsState.headlineTimer = 9.0;
    if (disasterBoostSec > 0) {
      newsState.disasterTimer = Math.max(newsState.disasterTimer, disasterBoostSec);
    }
    const tickEl = document.getElementById('news-ticker-text');
    if (tickEl) tickEl.textContent = text;
  }

  function isBlackedOutAt(wx, wy) {
    for (let i = 0; i < powerNodes.length; i++) {
      const pn = powerNodes[i];
      if (!pn.destroyed || pn.blackoutTimer <= 0) continue;
      // Brief initial transformer arc flicker before full blackout settles!
      if (pn.flickerTimer > 0 && Math.sin(pn.flickerTimer * 42) > 0.15) continue;
      const dx = wx - pn.x;
      const dy = wy - pn.y;
      if (dx * dx + dy * dy <= pn.blackoutRadius * pn.blackoutRadius) return true;
    }
    return false;
  }

  // ==========================================
  // 4B. REAL-TIME 24-HOUR SOLAR EPHEMERIS & DYNAMIC WEATHER
  // ==========================================
  let worldClock = 8.75; // Always starts at 08:45 crisp Leonida Morning when colors, ocean & architecture look vibrant!
  const CLOCK_HOURS_PER_SEC = 0.095; // ~10.5 real seconds per game hour (~4.2 mins full 24h cycle)
  let lastClockMinuteHud = -1;
  let skyFlightTimer = 18.0; // Rare single high-altitude airliner/patrol corridor timer
  let trafficSpawnTimer = 0;

  let weatherMode = 0;
  let weatherAutoTimer = 78.0;
  const WEATHER_MODES = [
    { id: 'clear',    label: '☀️ CLEAR SKY' },
    { id: 'rain',     label: '⛈️ TROPICAL MONSOON' },
    { id: 'fog',      label: '🌫️ COASTAL MIST' },
    { id: 'sunburst', label: '🔥 MIAMI HEATWAVE' }
  ];
  let lightningFlash = 0;
  let fpsEstimate = 60;

  // Continuous 24-Hour Atmospheric Tint Keyframes [hour, r, g, b, alpha]
  const SKY_TINT_KEYS = [
    [0.0,   5,  10,  28, 0.46], // Deep Midnight
    [4.8,   6,  12,  32, 0.44], // Pre-Dawn
    [6.1, 244, 114, 148, 0.16], // Atlantic Rose Dawn
    [7.4, 253, 210, 140, 0.08], // Warm Morning Sun
    [10.0, 255, 252, 240, 0.01], // Crisp Miami Day
    [15.5, 255, 246, 220, 0.03], // Afternoon Sun
    [17.5, 245, 158,  38, 0.14], // Golden Hour
    [18.8, 190,  34,  92, 0.22], // Vice Coral-Magenta Sunset
    [20.2,   8,  14,  36, 0.39], // Neon Evening
    [24.0,   5,  10,  28, 0.46]  // Wrap Midnight
  ];

  const envState = {
    hour: 8.75,
    clockStr: '08:45',
    phaseLabel: '🌅 MORNING',
    lightsOn: false,
    lampStrength: 0,
    windowLitQuota: 0,
    shadowDX: -12,
    shadowDY: 8,
    shadowAlpha: 0.25,
    eastSunlit: true,
    westSunlit: false,
    southSunlit: true,
    solarWarmth: 0.25, // 0 = neutral noon/night, 1 = rich golden dawn/sunset
    ambientRGBA: 'rgba(255, 252, 240, 0.02)',
    horizonSide: null, // 'east' | 'west' | null
    horizonAlpha: 0,
    trafficMult: 1.15,
    pedMult: 1.15,
    beachActive: true
  };

  function updateEnvironmentState() {
    const h = ((worldClock % 24) + 24) % 24;
    envState.hour = h;
    const hh = Math.floor(h);
    const mm = Math.floor((h - hh) * 60);
    envState.clockStr = `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;

    const wId = WEATHER_MODES[weatherMode].id;
    const isRain = wId === 'rain';
    const isFog = wId === 'fog';

    if (h < 5.25) envState.phaseLabel = '🌙 DEEP MIDNIGHT';
    else if (h < 7.5) envState.phaseLabel = '🌅 ATLANTIC DAWN';
    else if (h < 11.2) envState.phaseLabel = '☀️ MIAMI MORNING';
    else if (h < 15.8) envState.phaseLabel = '🌴 TROPICAL NOON';
    else if (h < 18.2) envState.phaseLabel = '🌇 GOLDEN HOUR';
    else if (h < 19.75) envState.phaseLabel = '🌆 VICE SUNSET';
    else envState.phaseLabel = '🌃 NEON NIGHT';

    // Smooth Twilight Photocell Ramp for Streetlamps & Vehicle Headlights
    let nightFactor = 0;
    if (h >= 19.0 || h < 5.8) nightFactor = 1;
    else if (h >= 17.8 && h < 19.0) nightFactor = (h - 17.8) / 1.2;
    else if (h >= 5.8 && h < 7.0) nightFactor = 1 - (h - 5.8) / 1.2;
    if (isRain) nightFactor = Math.max(nightFactor, 0.82);
    else if (isFog) nightFactor = Math.max(nightFactor, 0.65);

    envState.lampStrength = nightFactor;
    envState.lightsOn = nightFactor > 0.35;

    // Staggered Room-by-Room Building Window Schedule (0..9 out of 11 hash buckets)
    if (h >= 7.2 && h < 17.4) {
      envState.windowLitQuota = isRain ? 3 : 0;
    } else if (h >= 17.4 && h < 20.0) {
      envState.windowLitQuota = Math.round(1 + ((h - 17.4) / 2.6) * 7); // Rooms turn on organically across dusk!
    } else if (h >= 20.0 && h < 23.5) {
      envState.windowLitQuota = 8;
    } else if (h >= 23.5 || h < 5.2) {
      const lateH = h >= 23.5 ? h - 23.5 : h + 0.5;
      envState.windowLitQuota = Math.max(3, Math.round(8 - Math.min(5, lateH * 1.6))); // Tapers down late at night!
    } else {
      envState.windowLitQuota = Math.max(0, Math.round(3 * (1 - (h - 5.2) / 2.0)));
    }

    // Dynamic Solar / Lunar Shadow Vector & Sunlit Wall Orientation
    if (h >= 5.6 && h <= 19.4) {
      const u = (h - 5.6) / 13.8; // 0 = East Sunrise, 0.5 = Solar Noon, 1 = West Sunset
      envState.shadowDX = -25 + u * 52; // Casts West (-25px) at Dawn -> Tight (+1px) at Noon -> East (+27px) at Sunset!
      envState.shadowDY = 5 + Math.pow(Math.abs(u - 0.5) * 2, 1.35) * 7.5;
      const sunElev = Math.sin(u * Math.PI);
      envState.shadowAlpha = (0.17 + sunElev * 0.22) * (isRain || isFog ? 0.52 : 1.0);
      envState.eastSunlit = h < 12.8;
      envState.westSunlit = h > 12.2;
      envState.southSunlit = true;
      envState.solarWarmth = Math.min(1, Math.max(0, (Math.abs(u - 0.5) - 0.24) * 3.6));
    } else {
      envState.shadowDX = 6;
      envState.shadowDY = 8;
      envState.shadowAlpha = 0.25;
      envState.eastSunlit = false;
      envState.westSunlit = false;
      envState.southSunlit = true;
      envState.solarWarmth = 0;
    }

    // Interpolate 24h Sky Ambient Color Grading
    for (let k = 0; k < SKY_TINT_KEYS.length - 1; k++) {
      const a = SKY_TINT_KEYS[k];
      const b = SKY_TINT_KEYS[k + 1];
      if (h >= a[0] && h <= b[0]) {
        const f = (h - a[0]) / Math.max(0.001, b[0] - a[0]);
        const cr = Math.round(a[1] + (b[1] - a[1]) * f);
        const cg = Math.round(a[2] + (b[2] - a[2]) * f);
        const cb = Math.round(a[3] + (b[3] - a[3]) * f);
        const ca = (a[4] + (b[4] - a[4]) * f).toFixed(3);
        envState.ambientRGBA = `rgba(${cr}, ${cg}, ${cb}, ${ca})`;
        break;
      }
    }

    // Directional Horizon Sun Glow (East at Dawn, West at Sunset)
    if (h >= 5.3 && h <= 7.8) {
      envState.horizonSide = 'east';
      envState.horizonAlpha = Math.sin(((h - 5.3) / 2.5) * Math.PI) * 0.26;
    } else if (h >= 17.0 && h <= 19.8) {
      envState.horizonSide = 'west';
      envState.horizonAlpha = Math.sin(((h - 17.0) / 2.8) * Math.PI) * 0.30;
    } else {
      envState.horizonSide = null;
      envState.horizonAlpha = 0;
    }

    // Circadian Traffic, Pedestrian & Beach Activity Rhythm
    if ((h >= 7.25 && h <= 9.75) || (h >= 16.25 && h <= 19.0)) {
      envState.trafficMult = 1.15; // Morning & Evening Rush Hour!
      envState.pedMult = 1.15;
    } else if (h > 9.75 && h < 16.25) {
      envState.trafficMult = 0.95;
      envState.pedMult = 1.05;
    } else if (h > 19.0 && h < 23.0) {
      envState.trafficMult = 0.80;
      envState.pedMult = 0.85;
    } else {
      envState.trafficMult = 0.48; // Quiet late-night streets
      envState.pedMult = 0.45;
    }
    envState.beachActive = h >= 8.5 && h <= 18.3 && !isRain;

    // Live-update HUD Digital Clock & Solar Phase Readout once per game minute
    const totalMin = hh * 60 + mm;
    if (totalMin !== lastClockMinuteHud) {
      lastClockMinuteHud = totalMin;
      const td = document.getElementById('time-display');
      if (td) td.textContent = envState.clockStr;
      const tpr = document.getElementById('time-phase-readout');
      if (tpr) tpr.textContent = `${envState.phaseLabel.split(' ')[0]} ${envState.clockStr} ${envState.phaseLabel.split(' ').slice(1).join(' ')}`;
    }
  }

  function advanceTimeOfDay() {
    worldClock = (worldClock + 3.5) % 24;
    lastClockMinuteHud = -1;
    updateEnvironmentState();
    showBanner(`${envState.clockStr} // ${envState.phaseLabel}`, '#00f0ff');
  }
  updateEnvironmentState();

  const camera = {
    x: player.x,
    y: player.y,
    zoom: 1.0,
    shake: 0
  };

  // ==========================================
  // 5. INPUT, UI MODALS & HOTKEYS
  // ==========================================
  const keys = {};
  const pressedKeys = {};
  const mouse = { x: 0, y: 0, worldX: 0, worldY: 0, down: false, hasAimed: false };

  const droppodModal = document.getElementById('droppod-modal');
  const megamapModal = document.getElementById('megamap-modal');

  function toggleDropPodModal(forceState) {
    const hide = forceState !== undefined ? !forceState : !droppodModal.classList.contains('hidden');
    if (hide) droppodModal.classList.add('hidden');
    else {
      megamapModal.classList.add('hidden');
      droppodModal.classList.remove('hidden');
    }
  }

  function toggleMegamapModal(forceState) {
    const hide = forceState !== undefined ? !forceState : !megamapModal.classList.contains('hidden');
    if (hide) megamapModal.classList.add('hidden');
    else {
      droppodModal.classList.add('hidden');
      megamapModal.classList.remove('hidden');
      renderMegamap();
    }
  }

  function setWeatherByIndex(idx, announce = true) {
    weatherMode = ((idx % WEATHER_MODES.length) + WEATHER_MODES.length) % WEATHER_MODES.length;
    const wm = WEATHER_MODES[weatherMode];
    const el = document.getElementById('weather-readout');
    if (el) el.textContent = wm.label;
    updateEnvironmentState();
    if (announce) showBanner(`WEATHER: ${wm.label}`, '#00f0ff');
  }

  function cycleWeather() {
    weatherAutoTimer = 95.0;
    setWeatherByIndex(weatherMode + 1, true);
  }

  window.addEventListener('keydown', (e) => {
    sfx.init();
    const code = e.code;
    const k = e.key ? e.key.toLowerCase() : '';
    keys[code] = true;
    if (k) pressedKeys[k] = true;

    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Tab'].includes(code)) {
      e.preventDefault();
    }

    if (code === 'Escape') {
      const hadModal = !droppodModal.classList.contains('hidden') || !megamapModal.classList.contains('hidden');
      toggleDropPodModal(false);
      toggleMegamapModal(false);
      if (!hadModal && droneState.active) toggleDroneMode();
      return;
    }

    if (code === 'KeyF' || code === 'Enter') {
      toggleVehicle();
    } else if (code === 'Tab' || code === 'KeyC') {
      cycleWeapon(1);
    } else if (code >= 'Digit1' && code <= 'Digit7') {
      player.weaponIdx = parseInt(code.replace('Digit', ''), 10) - 1;
      updateHUD();
    } else if (code === 'KeyX') {
      player.reflexActive = !player.reflexActive;
      document.getElementById('reflex-overlay').classList.toggle('hidden', !player.reflexActive);
      if (player.reflexActive) showBanner('⚡ CARBON REFLEX ENGAGED', '#00f0ff');
    } else if (code === 'KeyV') {
      toggleDropPodModal();
    } else if (code === 'KeyG') {
      toggleMegamapModal();
    } else if (code === 'KeyB') {
      cycleWeather();
    } else if (code === 'KeyE') {
      if (player.vehicle) {
        player.vehicle.sirenOn = !player.vehicle.sirenOn;
        sfx.playHorn(player.vehicle.isPolice || player.vehicle.isFiretruck);
      }
    } else if (code === 'KeyR') {
      if (window.MidiSoundtrack) {
        const st = window.MidiSoundtrack.cycleStation();
        showRadioBanner(`${st.name} // ${st.subtitle}`);
        updateHUD();
      }
    } else if (code === 'KeyM') {
      if (window.MidiSoundtrack) {
        const muted = window.MidiSoundtrack.toggleMute();
        showRadioBanner(muted ? '🔇 MIDI SOUNDTRACK MUTED' : '🔊 MIDI SOUNDTRACK ACTIVE');
        updateHUD();
      }
    } else if (code === 'KeyL') {
      if (player.vehicle && player.vehicle.isHeli) {
        const hv = player.vehicle;
        if (hv.heliLanded) {
          hv.heliLanded = false;
          hv.autoLanding = false;
          hv.altitude = 6;
          showBanner('🚁 LIFT-OFF ENGAGED — HOLD [SPACE] OR PRESS [L] TO LAND', '#00f0ff');
        } else {
          hv.autoLanding = !hv.autoLanding;
          showBanner(
            hv.autoLanding
              ? '🚁 AUTO-LANDING ENGAGED — DESCENDING TO TOUCHDOWN...'
              : '🚁 AUTO-LAND CANCELLED — HOVER ALTITUDE HOLD',
            hv.autoLanding ? '#39ff14' : '#00f0ff'
          );
        }
      }
    } else if (code === 'KeyU') {
      toggleTowCable();
    } else if (code === 'KeyN') {
      toggleNewsCam();
    } else if (code === 'KeyP') {
      toggleDroneMode();
    } else if (code === 'KeyO') {
      snapPostcardPNG();
    } else if (code === 'KeyT') {
      advanceTimeOfDay();
    } else if (code === 'KeyH') {
      document.getElementById('controls-card').classList.toggle('hidden');
    }
  });

  window.addEventListener('keyup', (e) => {
    keys[e.code] = false;
    const k = e.key ? e.key.toLowerCase() : '';
    if (k) pressedKeys[k] = false;
  });

  window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    mouse.hasAimed = true;
  });

  window.addEventListener('mousedown', (e) => {
    sfx.init();
    if (!droppodModal.classList.contains('hidden') || !megamapModal.classList.contains('hidden')) return;
    if (e.target.closest('.quick-actions') || e.target.closest('#hud-bottom-left') || e.target.closest('#drone-hud') || e.target.closest('#news-pip')) return;
    if (e.button === 0) {
      mouse.down = true;
      mouse.hasAimed = true;
    } else if (e.button === 2) {
      toggleTowCable();
    }
  });

  window.addEventListener('contextmenu', (e) => {
    if (megamapModal.classList.contains('hidden')) e.preventDefault();
  });

  window.addEventListener('mouseup', (e) => {
    if (e.button === 0) mouse.down = false;
  });

  window.addEventListener('wheel', (e) => {
    if (droneState.active) {
      droneState.zoom = Math.max(0.24, Math.min(1.45, droneState.zoom * (e.deltaY > 0 ? 0.90 : 1.11)));
      return;
    }
    cycleWeapon(e.deltaY > 0 ? 1 : -1);
  });

  function cycleWeapon(dir) {
    player.weaponIdx = (player.weaponIdx + dir + WEAPONS.length) % WEAPONS.length;
    updateHUD();
  }

  function toggleNewsCam() {
    const currentlyShown = newsState.manualOverride === true ||
      (newsState.manualOverride === null && (Math.floor(player.wanted) >= 3 || newsState.disasterTimer > 0));
    newsState.manualOverride = !currentlyShown;
    showBanner(newsState.manualOverride ? '📺 WLTV SKY-CAM 6 LIVE FEED ON' : '📺 WLTV SKY-CAM 6 MINIMIZED', '#ef4444');
  }

  function toggleDroneMode() {
    droneState.active = !droneState.active;
    const dh = document.getElementById('drone-hud');
    if (dh) dh.classList.toggle('hidden', !droneState.active);
    if (droneState.active) {
      const anchor = player.vehicle || player;
      droneState.x = anchor.x;
      droneState.y = anchor.y;
      droneState.zoom = 0.44;
      showBanner('🛸 SKY-DRONE ACTIVE — [WASD] PAN • [WHEEL] ZOOM • [O] SNAP PNG', '#00f0ff');
    } else {
      showBanner('🛸 RETURNED TO PLAYER CAMERA', '#00f0ff');
    }
  }

  function snapPostcardPNG() {
    try {
      const link = document.createElement('a');
      link.download = `leonida-carbon-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      showBanner('📸 POSTCARD SAVED TO DOWNLOADS!', '#39ff14');
    } catch (_) {
      showBanner('📸 SNAPSHOT CAPTURED!', '#39ff14');
    }
  }

  function toggleTowCable() {
    const v = player.vehicle;
    if (!v || (!v.isHeli && !v.isTruck && !v.isFiretruck && !v.isTank)) return;

    // Release currently towed vehicle -> Catapult / Air-Drop!
    if (v.towTarget) {
      const target = v.towTarget;
      target.towedBy = null;
      v.towTarget = null;
      if ((target.altitude || 0) > 12) {
        target.airDropTimer = 1.6;
        target.airDropVz = 0;
      }
      sfx.playDropPod();
      showBanner(`🪝 RELEASED ${target.name}!`, '#ffe600');
      return;
    }

    // Latch nearest vehicle or permanent charred wreck within 195px!
    let best = null;
    let bestD = 195;
    for (const cand of vehicles) {
      if (cand === v || cand.isAirliner || cand.isJet || cand.towedBy) continue;
      if ((cand.altitude || 0) > 35) continue;
      const d = Math.hypot(cand.x - v.x, cand.y - v.y);
      if (d < bestD) {
        bestD = d;
        best = cand;
      }
    }
    if (best) {
      v.towTarget = best;
      best.towedBy = v;
      best.airDropTimer = 0;
      if (best.driver && best.driver !== 'player') {
        best.driver = null; // Terrified NPC bails or freezes as car lifts into the sky!
      }
      sfx.playDropPod();
      spawnSparks(best.x, best.y, 12, '#00f0ff');
      showBanner(`🪝 MAG-CABLE LATCHED: ${best.name} — SWING WRECKING BALL!`, '#00f0ff');
      if (v.isHeli) {
        setBreakingNews(`BREAKING: ROGUE HELICOPTER SWINGING ${best.name} OVER ${getDistrictName(v.x, v.y)}!`, 14);
      }
    } else {
      showBanner('🪝 FLY / DRIVE CLOSER TO A VEHICLE TO MAG-TOW [R-CLICK / U]', '#94a3b8');
    }
  }

  // Wire HUD Buttons, Orbital Drop-Pod Cards & Satellite Megamap Fast-Travel
  document.getElementById('btn-droppod').addEventListener('click', () => toggleDropPodModal());
  document.getElementById('close-droppod').addEventListener('click', () => toggleDropPodModal(false));
  document.getElementById('btn-megamap').addEventListener('click', () => toggleMegamapModal());
  document.getElementById('close-megamap').addEventListener('click', () => toggleMegamapModal(false));
  document.getElementById('btn-weather').addEventListener('click', () => cycleWeather());
  const btnNewsEl = document.getElementById('btn-newscam');
  if (btnNewsEl) btnNewsEl.addEventListener('click', () => toggleNewsCam());
  const newsHeaderEl = document.getElementById('news-pip-header');
  if (newsHeaderEl) newsHeaderEl.addEventListener('click', () => toggleNewsCam());
  const btnDroneEl = document.getElementById('btn-drone');
  if (btnDroneEl) btnDroneEl.addEventListener('click', () => toggleDroneMode());
  const btnSnapEl = document.getElementById('btn-snap-png');
  if (btnSnapEl) btnSnapEl.addEventListener('click', () => snapPostcardPNG());
  const btnTimeEl = document.getElementById('btn-time');
  if (btnTimeEl) btnTimeEl.addEventListener('click', () => advanceTimeOfDay());
  document.getElementById('minimap-trigger').addEventListener('click', () => toggleMegamapModal(true));

  document.querySelectorAll('.pod-card').forEach((btn) => {
    btn.addEventListener('click', () => {
      const vKey = btn.getAttribute('data-veh');
      orbitalDropVehicle(vKey);
      toggleDropPodModal(false);
    });
  });

  document.querySelectorAll('.tp-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const [gx, gy] = btn.getAttribute('data-tp').split(',').map(Number);
      orbitalFastTravel(gx * TILE_SIZE + 80, gy * TILE_SIZE + 80);
      toggleMegamapModal(false);
    });
  });

  if (megamapCanvas) {
    megamapCanvas.addEventListener('mousedown', (e) => {
      e.preventDefault();
      const rect = megamapCanvas.getBoundingClientRect();
      const nx = (e.clientX - rect.left) / rect.width;
      const ny = (e.clientY - rect.top) / rect.height;
      const wx = Math.max(120, Math.min(WORLD_W - 120, nx * WORLD_W));
      const wy = Math.max(120, Math.min(WORLD_H - 120, ny * WORLD_H));
      if (e.button === 2) {
        customWaypoint = { x: wx, y: wy };
        showBanner('GPS WAYPOINT LOCKED', '#ff2a85');
        renderMegamap();
      } else {
        orbitalFastTravel(wx, wy);
        toggleMegamapModal(false);
      }
    });
    megamapCanvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  // ==========================================
  // 6. SPAWNERS, ORBITAL DROP-POD & FAST-TRAVEL
  // ==========================================
  let bannerTimeout = null;
  function showBanner(text, color = '#ffe600') {
    const el = document.getElementById('banner-message');
    el.textContent = text;
    el.style.color = color;
    el.style.opacity = '1';
    el.style.transform = 'scale(1.12)';
    setTimeout(() => { el.style.transform = 'scale(1.0)'; }, 150);
    if (bannerTimeout) clearTimeout(bannerTimeout);
    bannerTimeout = setTimeout(() => { el.style.opacity = '0'; }, 2600);
  }

  let districtTimeout = null;
  function showDistrictBanner(name) {
    const el = document.getElementById('district-banner');
    if (!el) return;
    el.textContent = name;
    el.classList.remove('hidden');
    if (districtTimeout) clearTimeout(districtTimeout);
    districtTimeout = setTimeout(() => { el.classList.add('hidden'); }, 3200);
  }

  let radioTimeout = null;
  function showRadioBanner(text) {
    const el = document.getElementById('radio-banner');
    el.textContent = text;
    el.classList.remove('hidden');
    if (radioTimeout) clearTimeout(radioTimeout);
    radioTimeout = setTimeout(() => { el.classList.add('hidden'); }, 2800);
  }

  function addFloatingText(x, y, text, color = '#39ff14') {
    floatingTexts.push({ x, y, text, color, life: 1.15, maxLife: 1.15 });
  }

  function addCash(amount, wx, wy) {
    const total = Math.round(amount * player.multiplier);
    player.cash += total;
    player.multTimer = 6.5;
    if (Math.random() < 0.38 && player.multiplier < 12) {
      player.multiplier++;
    }
    sfx.playCash();
    if (wx !== undefined && wy !== undefined) {
      addFloatingText(wx, wy, `+$${total}`, '#39ff14');
    }
    updateHUD();
  }

  function addWanted(amount) {
    const prev = Math.floor(player.wanted);
    player.wanted = Math.min(6, player.wanted + amount);
    player.wantedDecay = 15.0;
    const curr = Math.floor(player.wanted);
    if (curr > prev) {
      showBanner(curr === 6 ? '★ 6-STAR MILITARY LOCKDOWN! ★' : `WANTED LEVEL ${curr} ★`, '#ff1744');
    }
    updateHUD();
  }

  function setMinimumWanted(minStars, bannerText = null) {
    player.wanted = Math.min(6, Math.max(player.wanted, minStars));
    player.wantedDecay = 26.0;
    if (bannerText) {
      showBanner(bannerText, '#ff1744');
    } else {
      showBanner(`★ WANTED LEVEL ${Math.floor(player.wanted)} ★`, '#ff1744');
    }
    updateHUD();
  }

  function modifyRespect(gangKey, delta) {
    if (!GANGS[gangKey]) return;
    GANGS[gangKey].respect = Math.max(0, Math.min(100, GANGS[gangKey].respect + delta));
    updateHUD();
  }

  function spawnVehicle(typeKey, x, y, angle = 0, driverType = 'civilian') {
    const spec = VEHICLE_SPECS[typeKey];
    if (!spec) return null;
    const color = spec.colors[Math.floor(Math.random() * spec.colors.length)];
    const v = {
      typeKey,
      name: spec.name,
      x,
      y,
      vx: 0,
      vy: 0,
      angle,
      turretAngle: angle,
      rotorAngle: Math.random() * Math.PI * 2,
      tailRotorAngle: Math.random() * Math.PI * 2,
      rotorRPM: (spec.isHeli && driverType) ? 1.0 : 0.0,
      heliLanded: spec.isHeli ? !driverType : false,
      angularVel: 0,
      w: spec.w,
      h: spec.h,
      maxSpeed: spec.maxSpeed,
      accel: spec.accel,
      grip: spec.grip,
      hp: spec.maxHp,
      maxHp: spec.maxHp,
      mass: spec.mass || 1.0,
      color,
      stripe: spec.stripe,
      isHyper: !!spec.isHyper,
      isCab: !!spec.isCab,
      isTruck: !!spec.isTruck,
      isFiretruck: !!spec.isFiretruck,
      isBike: !!spec.isBike,
      isSkate: !!spec.isSkate,
      isJet: !!spec.isJet,
      isAirliner: !!spec.isAirliner,
      isTank: !!spec.isTank,
      isBoat: !!spec.isBoat,
      isHeli: !!spec.isHeli,
      isFalcon: !!spec.isFalcon,
      exposedRider: !!spec.exposedRider,
      isPolice: !!spec.isPolice,
      isSwat: !!spec.isSwat,
      sirenOn: !!(spec.isPolice || spec.isFiretruck),
      sirenPhase: Math.random() * 10,
      driver: driverType,
      altitude: (spec.isJet && driverType === 'civilian') ? (spec.isAirliner ? 295 : 240) : (spec.isHeli && driverType === 'police' ? 140 : 0),
      unmannedGlide: false,
      wasPlayerAircraft: false,
      lastHitByPlayer: false,
      targetHeading: angle,
      isBraking: false,
      turnSignal: null,
      turnSignalTimer: 0,
      lastTurnCell: '',
      hornCooldown: 2 + Math.random() * 4,
      idleWaitTimer: 0,
      stressHonkCooldown: 0,
      honkVisualTimer: 0,
      lastHonkTime: 0,
      hornPitch: spec.isTruck ? (138 + Math.random() * 24) : (260 + Math.random() * 145),
      empTimer: 0
    };
    vehicles.push(v);
    return v;
  }

  function orbitalDropVehicle(typeKey) {
    sfx.init();
    sfx.playDropPod();
    const spec = VEHICLE_SPECS[typeKey] || { w: 60, h: 30 };
    const ang = player.vehicle ? player.vehicle.angle : player.angle;
    const dropDist = Math.max(98, 56 + (spec.w || 60) * 0.56);
    const dx = Math.max(240, Math.min(WORLD_W - 240, player.x + Math.cos(ang) * dropDist));
    const dy = Math.max(240, Math.min(WORLD_H - 240, player.y + Math.sin(ang) * dropDist));
    const v = spawnVehicle(typeKey, dx, dy, ang, null);
    if (!v) return;
    shockwaves.push({ x: dx, y: dy, r: 12, maxR: Math.max(130, v.w * 0.65), color: '#00f0ff', life: 0.45, maxLife: 0.45 });
    spawnSparks(dx, dy, 18, '#00f0ff');
    camera.shake = v.isAirliner ? 20 : 12;
    showBanner(`🛰️ DROPPED ${v.name}!`, '#00f0ff');
  }

  function orbitalFastTravel(wx, wy) {
    sfx.init();
    sfx.playDropPod();
    const gx = Math.max(0, Math.min(GRID_W - 1, Math.floor(wx / TILE_SIZE)));
    const gy = Math.max(0, Math.min(GRID_H - 1, Math.floor(wy / TILE_SIZE)));
    if (droneState.active) {
      droneState.active = false;
      const dh = document.getElementById('drone-hud');
      if (dh) dh.classList.add('hidden');
    }
    if (player.vehicle) {
      if (player.vehicle.towTarget) {
        player.vehicle.towTarget.towedBy = null;
        player.vehicle.towTarget.altitude = 0;
        player.vehicle.towTarget = null;
      }
      player.vehicle.x = wx;
      player.vehicle.y = wy;
      player.vehicle.vx = 0;
      player.vehicle.vy = 0;
      player.vehicle.inWater = false;
    }
    player.x = wx;
    player.y = wy;
    player.z = 0;
    player.parachute = null;
    player.burnTimer = 0;
    player.inWater = !player.vehicle && worldGrid[gy][gx] === 4 && !hasBridgeAt(gx, gy);
    camera.x = wx;
    camera.y = wy;
    shockwaves.push({ x: wx, y: wy, r: 10, maxR: 170, color: '#ff2a85', life: 0.55, maxLife: 0.55 });
    showBanner(`⚡ FAST-TRAVELED TO ${getDistrictName(wx, wy)}`, '#00f0ff');
  }

  function isHotTurfZone(wx, wy) {
    const gx = Math.floor(wx / TILE_SIZE);
    const gy = Math.floor(wy / TILE_SIZE);
    // Rough Port Docks, Everglades Gator Swamps, Syndicate South-Alley Strips & Gang Border Crossings
    if (gx >= 20 && gx <= 35 && gy >= 54) return true; // Port Leonida Docks
    if (gx <= 23 && gy >= 14 && gy <= 46) return true; // Everglades Bayou & Gator Turf
    if (gx >= 53 && gx <= 58 && gy >= 46 && gy <= 66) return true; // South Ocean Syndicate Strip
    if (Math.abs(gx - 26) <= 2 || Math.abs(gx - 52) <= 2) return true; // Rival Gang Border Zones!
    return false;
  }

  function spawnPed(x, y, role = 'civilian', gang = null) {
    const colors = {
      civilian: ['#f43f5e', '#38bdf8', '#fbbf24', '#a855f7', '#ec4899', '#ffffff'],
      police:   ['#2563eb'],
      syndicate:['#ff2a85'],
      runners:  ['#00f0ff'],
      gators:   ['#39ff14']
    };
    const palette = colors[gang || role] || colors.civilian;
    const skinTones = ['#f5d0b5', '#e2b28f', '#c68b59', '#8d5524', '#f8d9c0'];
    const inRoughZone = isHotTurfZone(x, y);
    const isAggressive = role === 'gang'
      ? (inRoughZone || Math.random() < 0.45)
      : (role === 'civilian' && (inRoughZone ? Math.random() < 0.34 : Math.random() < 0.12));

    const ped = {
      x,
      y,
      vx: 0,
      vy: 0,
      angle: Math.random() * Math.PI * 2,
      radius: 11,
      hp: role === 'police' ? 85 : (gang ? 95 : (isAggressive ? 65 : 42)),
      role,
      gang,
      isAggressive,
      hostileTimer: (role === 'gang' && inRoughZone && Math.random() < 0.42) ? 18.0 : 0,
      strafeDir: Math.random() < 0.5 ? 1 : -1,
      inWater: false,
      color: palette[Math.floor(Math.random() * palette.length)],
      skinColor: skinTones[Math.floor(Math.random() * skinTones.length)],
      stepPhase: Math.random() * 10,
      aiTimer: Math.random() * 2,
      shootTimer: 0.45 + Math.random() * 0.75,
      panicTimer: 0,
      burnTimer: 0
    };
    peds.push(ped);
    return ped;
  }

  function spawnGangCrew(cx, cy, gangKey, count = 3, hostile = false) {
    for (let m = 0; m < count; m++) {
      const a = (m / count) * Math.PI * 2 + Math.random() * 0.5;
      const r = 14 + Math.random() * 16;
      const px = Math.max(80, Math.min(WORLD_W - 80, cx + Math.cos(a) * r));
      const py = Math.max(80, Math.min(WORLD_H - 80, cy + Math.sin(a) * r));
      const gx = Math.floor(px / TILE_SIZE);
      const gy = Math.floor(py / TILE_SIZE);
      if (worldGrid[gy] && worldGrid[gy][gx] !== 4) {
        const gp = spawnPed(px, py, 'gang', gangKey);
        gp.isAggressive = true;
        if (hostile) gp.hostileTimer = 30.0;
      }
    }
  }

  const LANE_OFFSET = 32; // Right-hand lane center offset from 80px road centerline (64px separation between opposing lanes!)

  function pickTrafficVehicleForTile(gx, gy, hour) {
    const onBr = !!bridgeGrid[gy][gx];
    const isDay = hour >= 7.0 && hour <= 19.0;
    // Port Leonida Docks & Industrial Freight Corridor
    if (gx >= 20 && gx <= 36 && gy >= 52) {
      const pool = ['truck', 'truck', 'suv', 'sedan', 'sedan', 'muscle', 'cab'];
      return pool[Math.floor(Math.random() * pool.length)];
    }
    // Star Island & Ocean Drive Luxury Strip
    if (gx >= 56) {
      const pool = (!onBr && isDay)
        ? ['suv', 'sedan', 'stinger', 'banshee', 'cab', 'bike', 'skate', 'hyper']
        : ['suv', 'sedan', 'stinger', 'banshee', 'cab', 'hyper', 'bike'];
      return pool[Math.floor(Math.random() * pool.length)];
    }
    // Downtown Vice Metropolis & Silicon Hills
    if (gx >= 30 && gx <= 54 && gy <= 52) {
      const pool = ['sedan', 'sedan', 'sedan', 'suv', 'suv', 'cab', 'cab', 'banshee', 'muscle', 'bike'];
      return pool[Math.floor(Math.random() * pool.length)];
    }
    // General Midtown / Bayou Highways
    const pool = ['sedan', 'sedan', 'suv', 'suv', 'muscle', 'cab', 'truck', 'bike'];
    return pool[Math.floor(Math.random() * pool.length)];
  }

  function getValidRoadHeadings(gx, gy) {
    const br = bridgeGrid[gy] && bridgeGrid[gy][gx];
    if (br) {
      return br.axis === 'x' ? [0, Math.PI] : [Math.PI * 0.5, -Math.PI * 0.5];
    }
    const dirs = [];
    if (gx < GRID_W - 1 && isRoadOrBridge(gx + 1, gy) && !(bridgeGrid[gy][gx + 1] && bridgeGrid[gy][gx + 1].closedEast)) dirs.push(0);
    if (gx > 0 && isRoadOrBridge(gx - 1, gy)) dirs.push(Math.PI);
    if (gy < GRID_H - 1 && isRoadOrBridge(gx, gy + 1)) dirs.push(Math.PI * 0.5);
    if (gy > 0 && isRoadOrBridge(gx, gy - 1)) dirs.push(-Math.PI * 0.5);
    return dirs;
  }

  function spawnRightLaneTrafficAt(gx, gy) {
    if (!isRoadOrBridge(gx, gy)) return null;
    const br = bridgeGrid[gy][gx];
    if (br && br.closedEast) return null;
    const dirs = getValidRoadHeadings(gx, gy);
    if (dirs.length === 0) return null;

    const ang = dirs[Math.floor(Math.random() * dirs.length)];
    const rightX = -Math.sin(ang);
    const rightY = Math.cos(ang);
    const laneOff = br ? 24 : LANE_OFFSET;
    const wx = gx * TILE_SIZE + TILE_SIZE * 0.5 + rightX * laneOff;
    const wy = gy * TILE_SIZE + TILE_SIZE * 0.5 + rightY * laneOff;

    // Ensure clean headway spacing so vehicles never spawn overlapping
    for (let i = 0; i < vehicles.length; i++) {
      const ov = vehicles[i];
      if (!ov.isAirborne && Math.abs(ov.x - wx) < 95 && Math.abs(ov.y - wy) < 95) return null;
    }

    const vType = pickTrafficVehicleForTile(gx, gy, envState.hour);
    return spawnVehicle(vType, wx, wy, ang, 'civilian');
  }

  function spawnHighAltitudeFlight(forceMilitary = false) {
    // Only 1 ambient aircraft in the sky at a time so airspace stays calm & realistic!
    const activeSky = vehicles.filter(v => v.driver === 'civilian' && v.isJet && v.hp > 0).length;
    if (activeSky >= 1) return;

    const isMil = forceMilitary || Math.floor(player.wanted) >= 5;
    const typeKey = isMil ? 'jet' : 'airliner';
    // Realistic trans-Leonida airway corridors (e.g. Atlantic Coastal Airway or Spaceport Runway 14 Approach)
    const routes = [
      { x: 12 * TILE_SIZE, y: 120,            ang: Math.PI * 0.46 },  // North -> Spaceport approach
      { x: 66 * TILE_SIZE, y: WORLD_H - 120,  ang: -Math.PI * 0.52 }, // South Atlantic -> North coastal corridor
      { x: WORLD_W - 120,  y: 26 * TILE_SIZE, ang: Math.PI * 0.86 },  // Atlantic East -> Spaceport Westbound
      { x: 120,            y: 56 * TILE_SIZE, ang: -0.18 }            // Spaceport Departure -> Eastbound over Vice
    ];
    const rt = routes[Math.floor(Math.random() * routes.length)];
    const plane = spawnVehicle(typeKey, rt.x, rt.y, rt.ang, 'civilian');
    if (plane) {
      plane.isHighTransit = true;
      plane.altitude = isMil ? 230 : 265;
      const cruise = isMil ? 540 : 395;
      plane.vx = Math.cos(rt.ang) * cruise;
      plane.vy = Math.sin(rt.ang) * cruise;
    }
  }

  function populateInitialEntities() {
    // 1. Grounded Showcase Fleet parked neatly on Downtown Vice Core curbs + Helipad Plaza
    spawnVehicle('hyper',   40 * TILE_SIZE + 128, 40 * TILE_SIZE + 114, 0, null);
    spawnVehicle('suv',     40 * TILE_SIZE + 42,  39 * TILE_SIZE + 65, Math.PI * 0.5, null);
    spawnVehicle('tank',    39 * TILE_SIZE + 55,  40 * TILE_SIZE + 114, 0, null);
    spawnVehicle('bike',    40 * TILE_SIZE + 128, 40 * TILE_SIZE + 46, Math.PI, null);
    spawnVehicle('skate',   40 * TILE_SIZE + 26,  40 * TILE_SIZE + 26, 0, null);
    spawnVehicle('truck',   40 * TILE_SIZE + 48,  41 * TILE_SIZE + 60, Math.PI * 0.5, null);
    spawnVehicle('stinger', 41 * TILE_SIZE + 45,  40 * TILE_SIZE + 114, 0, null);
    // Downtown Helipad Plaza — Player-flyable Falcon Gunship Helicopter & Ready-to-Roll Leonida Fire Engine!
    spawnVehicle('falcon',    41 * TILE_SIZE + 80,  39 * TILE_SIZE + 80, 0, null);
    spawnVehicle('firetruck', 38 * TILE_SIZE + 80,  40 * TILE_SIZE + 114, 0, null);
    spawnVehicle('firetruck', 57 * TILE_SIZE + 114, 41 * TILE_SIZE + 80, Math.PI * 0.5, null);

    // 2. Leonida International Spaceport & Military Airbase Apron (Real-Scale Jets, Colossal 747-8 Jumbo & Gunship Heli)
    spawnVehicle('jet',      9 * TILE_SIZE + 80,  50 * TILE_SIZE + 80, Math.PI * 0.5, null);
    spawnVehicle('jet',      14 * TILE_SIZE + 80, 50 * TILE_SIZE + 80, Math.PI * 0.5, null);
    spawnVehicle('airliner', 12 * TILE_SIZE,      61 * TILE_SIZE + 80, -Math.PI * 0.5, null);
    spawnVehicle('falcon',   7 * TILE_SIZE + 80,  54 * TILE_SIZE + 80, 0, null);
    spawnVehicle('tank',     7 * TILE_SIZE + 80,  57 * TILE_SIZE + 80, 0, null);
    spawnVehicle('tank',     7 * TILE_SIZE + 80,  59 * TILE_SIZE + 80, 0, null);
    spawnVehicle('suv',      10 * TILE_SIZE + 80, 55 * TILE_SIZE + 80, 0, null);

    // 3. Miami Viper Speedboats Moored in Biscayne Bay, Star Island Yacht Canal & Bayou River!
    spawnVehicle('boat', 62 * TILE_SIZE + 80, 39 * TILE_SIZE + 40, Math.PI * 0.5, null);
    spawnVehicle('boat', 62 * TILE_SIZE + 80, 41 * TILE_SIZE + 120, Math.PI * 0.5, null);
    spawnVehicle('boat', 66 * TILE_SIZE + 80, 39 * TILE_SIZE + 40, -Math.PI * 0.5, null);
    spawnVehicle('boat', 70 * TILE_SIZE + 80, 33 * TILE_SIZE + 80, 0, null);
    spawnVehicle('boat', 64 * TILE_SIZE + 80, 25 * TILE_SIZE + 80, Math.PI * 0.5, 'civilian');
    spawnVehicle('boat', 64 * TILE_SIZE + 80, 50 * TILE_SIZE + 80, -Math.PI * 0.5, 'civilian');
    spawnVehicle('boat', 21 * TILE_SIZE + 80, 38 * TILE_SIZE + 80, Math.PI * 0.5, null);

    // 4. Star Island Villa Cars, Helipad & Ocean Drive Cruisers
    spawnVehicle('hyper',   68 * TILE_SIZE + 80, 40 * TILE_SIZE + 112, 0, null);
    spawnVehicle('falcon',  68 * TILE_SIZE + 80, 38 * TILE_SIZE + 80, Math.PI, null);
    spawnVehicle('stinger', 72 * TILE_SIZE + 80, 40 * TILE_SIZE + 48, Math.PI, null);
    spawnVehicle('bike',    57 * TILE_SIZE + 48, 40 * TILE_SIZE + 50, Math.PI * 0.5, null);

    // 5. Spawn 155 Right-Hand-Lane Traffic Vehicles across Roads & Causeway Bridges
    let spawned = 0;
    for (let attempts = 0; attempts < 900 && spawned < 155; attempts++) {
      const gx = Math.floor(Math.random() * (GRID_W - 6)) + 2;
      const gy = Math.floor(Math.random() * (GRID_H - 6)) + 2;
      const wx = gx * TILE_SIZE + 80;
      const wy = gy * TILE_SIZE + 80;
      if (Math.hypot(wx - player.x, wy - player.y) > 320) {
        if (spawnRightLaneTrafficAt(gx, gy)) spawned++;
      }
    }

    // 6. Single High-Altitude Commercial Flight on the Atlantic/Spaceport Corridor (instead of 6 circling fighter jets!)
    spawnHighAltitudeFlight(false);

    // 7. Spawn 210 Pedestrians + Coordinated Street-Corner Gang Crews & Rival Border Skirmishes!
    for (let i = 0; i < 210; i++) {
      const gx = Math.floor(Math.random() * (GRID_W - 6)) + 2;
      const gy = Math.floor(Math.random() * (GRID_H - 6)) + 2;
      if (worldGrid[gy][gx] === 4) continue;
      const wx = gx * TILE_SIZE + 14;
      const wy = gy * TILE_SIZE + 14;
      const gang = getGangForPos(wx, wy);
      const isGang = Math.random() < 0.30;
      spawnPed(wx, wy, isGang ? 'gang' : 'civilian', isGang ? gang : null);
    }

    // Active Gang Turf Hotspots & Rival Gang Skirmish Flashpoints across Leonida
    spawnGangCrew(26 * TILE_SIZE + 28, 40 * TILE_SIZE + 22, 'runners', 3, true);
    spawnGangCrew(25 * TILE_SIZE + 132, 40 * TILE_SIZE + 136, 'gators', 3, true);
    spawnGangCrew(52 * TILE_SIZE + 28, 40 * TILE_SIZE + 24, 'syndicate', 3, true);
    spawnGangCrew(51 * TILE_SIZE + 132, 40 * TILE_SIZE + 134, 'runners', 3, true);
    spawnGangCrew(29 * TILE_SIZE + 30, 60 * TILE_SIZE + 30, 'gators', 4, true);    // Port Docks Gator Enforcers
    spawnGangCrew(56 * TILE_SIZE + 30, 52 * TILE_SIZE + 30, 'syndicate', 4, true); // South Ocean Syndicate Crew
    spawnGangCrew(36 * TILE_SIZE + 26, 35 * TILE_SIZE + 26, 'runners', 3, false);  // Downtown Border Runners

    // 8. Living Water Predators: Everglades Bayou Alligators & Atlantic / Bay Great White Sharks!
    const gatorSpots = [
      [18, 22], [19, 28], [20, 34], [17, 38], [21, 42], [15, 18], [22, 30], [19, 45]
    ];
    for (const [gx, gy] of gatorSpots) {
      if (worldGrid[gy] && worldGrid[gy][gx] === 4) {
        waterPredators.push({
          kind: 'gator',
          x: gx * TILE_SIZE + 80,
          y: gy * TILE_SIZE + 80,
          angle: Math.random() * Math.PI * 2,
          speed: 44,
          phase: Math.random() * 10,
          biteCooldown: 0
        });
      }
    }
    const sharkSpots = [
      [63, 30], [64, 44], [65, 54], [76, 36], [77, 48], [63, 18], [75, 26], [62, 62]
    ];
    for (const [gx, gy] of sharkSpots) {
      if (worldGrid[gy] && worldGrid[gy][gx] === 4) {
        waterPredators.push({
          kind: 'shark',
          x: gx * TILE_SIZE + 80,
          y: gy * TILE_SIZE + 80,
          angle: Math.random() * Math.PI * 2,
          speed: 78,
          phase: Math.random() * 10,
          biteCooldown: 0
        });
      }
    }
  }

  populateInitialEntities();
  // ==========================================
  // 7. ENTER / EXIT / PARK HELICOPTER & AIRCRAFT PARACHUTE BAILOUT
  // ==========================================
  function toggleVehicle() {
    if (!player.vehicle && (player.parachute || player.z > 12)) return;

    if (player.vehicle) {
      const v = player.vehicle;
      if (v.towTarget) {
        const tt = v.towTarget;
        tt.towedBy = null;
        v.towTarget = null;
        if ((tt.altitude || 0) > 12) {
          tt.airDropTimer = 1.6;
          tt.airDropVz = 0;
        }
      }

      // Helicopter Low-Hover or Landed Exit -> Cleanly Settle Skids & Park Without Throwing/Crashing!
      if (v.isHeli && (v.heliLanded || (v.altitude || 0) <= 52)) {
        v.driver = null;
        v.altitude = 0;
        v.isAirborne = false;
        v.heliLanded = true;
        v.unmannedGlide = false;
        v.vx = 0;
        v.vy = 0;
        const ex = v.x + Math.cos(v.angle - Math.PI / 2) * (v.h + 22);
        const ey = v.y + Math.sin(v.angle - Math.PI / 2) * (v.h + 22);
        player.x = ex;
        player.y = ey;
        player.z = 0;
        player.parachute = null;
        const egx = Math.max(0, Math.min(GRID_W - 1, Math.floor(player.x / TILE_SIZE)));
        const egy = Math.max(0, Math.min(GRID_H - 1, Math.floor(player.y / TILE_SIZE)));
        player.inWater = (worldGrid[egy][egx] === 4 && !hasBridgeAt(egx, egy));
        player.vx = 0;
        player.vy = 0;
        player.vehicle = null;
        sfx.playHeliSpool(false);
        document.getElementById('radio-banner').classList.add('hidden');
        showBanner('🚁 HELICOPTER PARKED — ROTORS SPOOLING DOWN', '#39ff14');
        updateHUD();
        updateMissionHUD();
        return;
      }

      // High-Altitude Bailout from Jet / Airliner / High Helicopter -> Deploy Ram-Air Parachute!
      if ((v.isJet && (v.altitude || 0) > 32) || (v.isHeli && (v.altitude || 0) > 52)) {
        v.driver = null;
        v.unmannedGlide = true;
        player.vehicle = null;
        player.x = v.x;
        player.y = v.y;
        player.z = v.altitude;
        player.inWater = false;
        player.vx = v.vx * 0.42;
        player.vy = v.vy * 0.42;
        player.parachute = { deployed: false, deployTimer: 0.36, roll: 0 };
        document.getElementById('radio-banner').classList.add('hidden');
        sfx.playParachute();
        showBanner('🪂 BAILED OUT! STEER PARACHUTE [WASD] • [SHIFT] DIVE • [SPACE] FLARE', '#00f0ff');
        updateHUD();
        updateMissionHUD();
        return;
      }

      v.driver = null;
      if (v.isJet || v.isHeli) {
        v.altitude = 0;
        v.isAirborne = false;
      }
      const exitLat = v.isAirliner ? 48 : (v.isJet ? 54 : (v.h + 20));
      const exitFwd = v.isAirliner ? 115 : (v.isJet ? 30 : 0);
      let ex = v.x + Math.cos(v.angle) * exitFwd + Math.cos(v.angle - Math.PI / 2) * exitLat;
      let ey = v.y + Math.sin(v.angle) * exitFwd + Math.sin(v.angle - Math.PI / 2) * exitLat;
      // If exiting a boat near a dock/seawall/beach, prefer stepping onto dry land if within reach!
      if (v.isBoat) {
        for (let a = 0; a < 8; a++) {
          const testAng = (a / 8) * Math.PI * 2;
          const tx = v.x + Math.cos(testAng) * 58;
          const ty = v.y + Math.sin(testAng) * 58;
          const tgx = Math.max(0, Math.min(GRID_W - 1, Math.floor(tx / TILE_SIZE)));
          const tgy = Math.max(0, Math.min(GRID_H - 1, Math.floor(ty / TILE_SIZE)));
          if (worldGrid[tgy][tgx] !== 4) {
            ex = tx;
            ey = ty;
            break;
          }
        }
      }
      player.x = ex;
      player.y = ey;
      player.z = 0;
      player.parachute = null;
      const egx = Math.max(0, Math.min(GRID_W - 1, Math.floor(player.x / TILE_SIZE)));
      const egy = Math.max(0, Math.min(GRID_H - 1, Math.floor(player.y / TILE_SIZE)));
      player.inWater = (worldGrid[egy][egx] === 4 && (!hasBridgeAt(egx, egy) || v.isBoat || v.inWater));
      player.vx = v.vx * 0.3;
      player.vy = v.vy * 0.3;
      player.vehicle = null;
      document.getElementById('radio-banner').classList.add('hidden');
      updateHUD();
      updateMissionHUD();
      return;
    }

    let bestV = null;
    let bestScore = Infinity;
    for (const v of vehicles) {
      if (v.hp <= 0 || v.inWater || v.unmannedGlide) continue;
      if ((v.isAirborne || (v.altitude || 0) > 28) && (v.isJet || v.isHeli)) continue;
      // Prevent boarding a boat below while standing high up on a bridge deck (or vice versa)
      const pgx = Math.max(0, Math.min(GRID_W - 1, Math.floor(player.x / TILE_SIZE)));
      const pgy = Math.max(0, Math.min(GRID_H - 1, Math.floor(player.y / TILE_SIZE)));
      const playerOnBridgeDeck = hasBridgeAt(pgx, pgy) && !player.inWater;
      if (playerOnBridgeDeck && v.isBoat) continue;
      if (player.inWater && !v.isBoat) continue;

      const maxReach = Math.max(96, Math.max(v.w || 60, v.h || 30) * 0.62);
      const d = Math.hypot(v.x - player.x, v.y - player.y);
      if (d < maxReach && d < bestScore) {
        bestScore = d;
        bestV = v;
      }
    }

    if (bestV) {
      if (bestV.driver && bestV.driver !== 'player') {
        const ejectX = bestV.x + Math.cos(bestV.angle - Math.PI / 2) * 34;
        const ejectY = bestV.y + Math.sin(bestV.angle - Math.PI / 2) * 34;
        if (!bestV.isBoat) {
          const p = spawnPed(ejectX, ejectY, bestV.driver === 'police' ? 'police' : 'civilian');
          p.panicTimer = 6.0;
        }
        addWanted(bestV.isPolice || bestV.isTank ? 1.2 : 0.35);
        showBanner(`JACKED ${bestV.name}!`, '#00f0ff');
      } else {
        showBanner(bestV.name, '#00f0ff');
      }
      bestV.driver = 'player';
      bestV.unmannedGlide = false;
      if (bestV.towedBy) {
        bestV.towedBy.towTarget = null;
        bestV.towedBy = null;
        bestV.altitude = 0;
      }
      if (bestV.isJet || bestV.isHeli) {
        bestV.wasPlayerAircraft = true;
      }
      if (bestV.isHeli) {
        bestV.heliLanded = (bestV.altitude || 0) <= 6;
        bestV.autoLanding = false;
        sfx.playHeliSpool(true);
        showBanner(`🚁 ${bestV.name} — [SPACE / L] LAND • [F] PARK • [R-CLICK / U] MAG-TOW`, '#00f0ff');
      } else if (bestV.isAirliner) {
        showBanner(`✈️ ${bestV.name} — [L-CLICK / CTRL] AGM MISSILES • [W] FLY • CRASH = 5★!`, '#00f0ff');
      } else if (bestV.isJet) {
        showBanner(`✈️ ${bestV.name} — [L-CLICK / CTRL] FIRE AGM MISSILES • [F] PARACHUTE!`, '#00f0ff');
      } else if (bestV.isFiretruck) {
        showBanner(`🚒 ${bestV.name} — [L-CLICK / CTRL] HYDRO-CANNON • [E] SIREN • [R-CLICK / U] MAG-TOW`, '#38bdf8');
      }
      player.vehicle = bestV;
      player.z = 0;
      player.parachute = null;
      player.inWater = false;
      if (!bestV.isHeli) sfx.playHorn(bestV.isPolice || bestV.isFiretruck);
      if (window.MidiSoundtrack) {
        const st = window.MidiSoundtrack.tracks[window.MidiSoundtrack.currentStationIdx];
        showRadioBanner(st ? `${st.name} // ${st.subtitle}` : window.MidiSoundtrack.getCurrentTrackLabel());
      }
      updateHUD();
      updateMissionHUD();
    }
  }

  // ==========================================
  // 8. O(1) SPATIAL GRID, OBB TANK PHYSICS, SHATTERABLE GLASS & FIRE PROPAGATION
  // ==========================================
  function onWaterLayer(entity) {
    return !!(entity.isBoat || entity.inWater);
  }

  function circleRectCollide(cx, cy, r, rx, ry, rw, rh) {
    const closestX = Math.max(rx, Math.min(cx, rx + rw));
    const closestY = Math.max(ry, Math.min(cy, ry + rh));
    const dx = cx - closestX;
    const dy = cy - closestY;
    const distSq = dx * dx + dy * dy;
    if (distSq < r * r && distSq > 0.0001) {
      const dist = Math.sqrt(distSq);
      return { nx: dx / dist, ny: dy / dist, overlap: r - dist };
    }
    return null;
  }

  // Exact 2D Oriented Bounding Box (OBB) vs Axis-Aligned Building Rect SAT Collision
  function obbRectCollide(cx, cy, hw, hh, angle, rx, ry, rw, rh) {
    const ux = Math.cos(angle);
    const uy = Math.sin(angle);
    const vx = -uy;
    const vy = ux;

    const rhw = rw * 0.5;
    const rhh = rh * 0.5;
    const rcx = rx + rhw;
    const rcy = ry + rhh;
    const dx = cx - rcx;
    const dy = cy - rcy;

    let minOverlap = Infinity;
    let bestNx = 0;
    let bestNy = 0;

    // Axis 1: World X (1, 0)
    const ov1 = (rhw + Math.abs(ux) * hw + Math.abs(vx) * hh) - Math.abs(dx);
    if (ov1 <= 0) return null;
    if (ov1 < minOverlap) {
      minOverlap = ov1;
      bestNx = dx >= 0 ? 1 : -1;
      bestNy = 0;
    }

    // Axis 2: World Y (0, 1)
    const ov2 = (rhh + Math.abs(uy) * hw + Math.abs(vy) * hh) - Math.abs(dy);
    if (ov2 <= 0) return null;
    if (ov2 < minOverlap) {
      minOverlap = ov2;
      bestNx = 0;
      bestNy = dy >= 0 ? 1 : -1;
    }

    // Axis 3: Vehicle Forward Axis (ux, uy)
    const d3 = dx * ux + dy * uy;
    const ov3 = (hw + Math.abs(ux) * rhw + Math.abs(uy) * rhh) - Math.abs(d3);
    if (ov3 <= 0) return null;
    if (ov3 < minOverlap) {
      minOverlap = ov3;
      const s = d3 >= 0 ? 1 : -1;
      bestNx = ux * s;
      bestNy = uy * s;
    }

    // Axis 4: Vehicle Lateral Axis (vx, vy)
    const d4 = dx * vx + dy * vy;
    const ov4 = (hh + Math.abs(vx) * rhw + Math.abs(vy) * rhh) - Math.abs(d4);
    if (ov4 <= 0) return null;
    if (ov4 < minOverlap) {
      minOverlap = ov4;
      const s = d4 >= 0 ? 1 : -1;
      bestNx = vx * s;
      bestNy = vy * s;
    }

    // Exact contact point along the masonry wall face
    const hullReach = Math.abs(bestNx * ux + bestNy * uy) * hw + Math.abs(bestNx * vx + bestNy * vy) * hh;
    const contactX = Math.max(rx, Math.min(cx - bestNx * hullReach, rx + rw));
    const contactY = Math.max(ry, Math.min(cy - bestNy * hullReach, ry + rh));

    return { nx: bestNx, ny: bestNy, overlap: minOverlap, contactX, contactY };
  }

  function shatterBuildingGlass(b, hitX, hitY, count = 2) {
    if (!b || b.collapsing || b.collapsed || b.windowMode !== 'glazed') return;
    if (!b.brokenWindows) b.brokenWindows = new Set();
    if (b.brokenWindows.size >= 44) return;

    const relX = Math.max(0, Math.min(0.999, (hitX - b.x) / Math.max(1, b.w)));
    const relY = Math.max(0, Math.min(0.999, (hitY - b.y) / Math.max(1, b.h)));
    const baseIdx = (Math.floor((relX + relY) * 12) + Math.floor(Math.random() * 6)) % 48;

    let brokeNew = false;
    for (let i = 0; i < count; i++) {
      const paneIdx = (baseIdx + i * 5 + Math.floor(Math.random() * 4)) % 48;
      if (!b.brokenWindows.has(paneIdx)) {
        b.brokenWindows.add(paneIdx);
        brokeNew = true;
      }
    }
    if (!brokeNew) return;

    sfx.playGlassShatter();
    const shardCount = Math.min(18, count * 4);
    const glassCols = ['#e0f2fe', '#bae6fd', '#7dd3fc', '#ffffff'];
    for (let i = 0; i < shardCount; i++) {
      const a = Math.random() * Math.PI * 2;
      const spd = 45 + Math.random() * 165;
      debrisChunks.push({
        x: hitX + (Math.random() - 0.5) * 18,
        y: hitY + (Math.random() - 0.5) * 18,
        z: 10 + Math.random() * Math.min(62, b.height || 36),
        vx: Math.cos(a) * spd,
        vy: Math.sin(a) * spd,
        vz: 55 + Math.random() * 145,
        rot: Math.random() * Math.PI * 2,
        vrot: (Math.random() - 0.5) * 20,
        w: 3 + Math.random() * 5,
        h: 2 + Math.random() * 4,
        color: glassCols[i % glassCols.length],
        life: 0.9 + Math.random() * 0.8,
        maxLife: 1.7
      });
    }
  }

  // Prune only temporary rubber tire drift marks while preserving 100% of explosion & fire scorch craters forever!
  function pruneTireSkids(maxTireSkids = 460) {
    let tireCount = 0;
    for (let i = 0; i < skidMarks.length; i++) {
      if (!skidMarks[i].isScorch) tireCount++;
    }
    if (tireCount <= maxTireSkids) return;
    let toRemove = tireCount - maxTireSkids;
    for (let i = 0; i < skidMarks.length && toRemove > 0; i++) {
      if (!skidMarks[i].isScorch) {
        skidMarks.splice(i, 1);
        i--;
        toRemove--;
      }
    }
  }

  function persistDebrisChunk(dc) {
    const gx = Math.max(0, Math.min(GRID_W - 1, Math.floor(dc.x / TILE_SIZE)));
    const gy = Math.max(0, Math.min(GRID_H - 1, Math.floor(dc.y / TILE_SIZE)));
    // Don't leave floating masonry on open water (sink into water ripple instead)
    if (worldGrid[gy] && worldGrid[gy][gx] === 4 && !hasBridgeAt(gx, gy)) {
      if (waterRipples.length < 140) {
        waterRipples.push({ x: dc.x, y: dc.y, r: 2, maxR: 14, life: 0.35, maxLife: 0.35, color: 'rgba(224, 242, 254, 0.45)' });
      }
      return;
    }
    const cell = settledDebrisGrid[gy] && settledDebrisGrid[gy][gx];
    if (!cell) return;
    if (cell.length >= 700) {
      cell.shift();
    }
    cell.push({
      x: dc.x,
      y: dc.y,
      w: dc.w,
      h: dc.h,
      rot: dc.rot,
      color: dc.color
    });
  }

  function knockDownTree(tree, fallAngle = 0) {
    if (!tree || tree.fallen || tree.falling) return;
    tree.falling = true;
    tree.fallProgress = 0.02;
    tree.fallAngle = fallAngle;
    tree.hp = 0;
    sfx.playTreeFall();

    // Scatter persistent wood splinters, bark & torn green palm frond chunks!
    const woodPalette = tree.burnt
      ? ['#1c1917', '#292524', '#44403c', '#78350f']
      : ['#78350f', '#92400e', '#15803d', '#166534', '#a16207'];
    for (let i = 0; i < 12; i++) {
      const a = fallAngle + (Math.random() - 0.5) * 1.5;
      const spd = 35 + Math.random() * 145;
      debrisChunks.push({
        x: tree.x + (Math.random() - 0.5) * 12,
        y: tree.y + (Math.random() - 0.5) * 12,
        z: 6 + Math.random() * 24,
        vx: Math.cos(a) * spd,
        vy: Math.sin(a) * spd,
        vz: 45 + Math.random() * 115,
        rot: Math.random() * Math.PI * 2,
        vrot: (Math.random() - 0.5) * 14,
        w: i % 2 === 0 ? (6 + Math.random() * 7) : (4 + Math.random() * 4),
        h: 2.2 + Math.random() * 3,
        color: woodPalette[i % woodPalette.length],
        life: 2.0,
        maxLife: 2.0
      });
    }
  }

  function damageTree(tree, amount, hitAngle = 0) {
    if (!tree || tree.fallen || tree.falling) return;
    tree.hp -= amount;
    tree.shakeTimer = 0.42;
    if (Math.random() < 0.6) {
      particles.push({
        x: tree.x + (Math.random() - 0.5) * 12,
        y: tree.y + (Math.random() - 0.5) * 12,
        vx: Math.cos(hitAngle) * (35 + Math.random() * 65),
        vy: Math.sin(hitAngle) * (35 + Math.random() * 65),
        r: 3 + Math.random() * 3,
        color: tree.burnt ? '#292524' : '#22c55e',
        life: 0.4,
        maxLife: 0.4
      });
    }
    if (tree.hp <= 0) {
      knockDownTree(tree, hitAngle);
    }
  }

  function igniteTree(tree) {
    if (!tree || tree.burnt) return;
    if (tree.burnTimer <= 0) {
      tree.burnTimer = tree.maxBurn || 8.5;
      sfx.playShoot('flame');
    }
  }

  function updateTreesAndFires(dt) {
    // 1. Palm Tree Falling Physics, Shake, Dramatic Crown Inferno, Ember Showers & Heat Propagation
    for (let i = 0; i < palmTrees.length; i++) {
      const tree = palmTrees[i];
      if (tree.shakeTimer > 0) {
        tree.shakeTimer = Math.max(0, tree.shakeTimer - dt);
      }
      if (tree.falling) {
        // Accelerating gravity tip-over (0 -> 1)
        tree.fallProgress = Math.min(1, tree.fallProgress + (1.15 + tree.fallProgress * 2.6) * dt);
        if (tree.fallProgress >= 1) {
          tree.falling = false;
          tree.fallen = true;
          tree.fallProgress = 1;
        }
      }
      if (tree.burnTimer > 0) {
        tree.burnTimer -= dt;
        const nearCam = Math.abs(tree.x - camera.x) < 1100 && Math.abs(tree.y - camera.y) < 850;
        if (nearCam && Math.random() < 0.72) {
          // Roaring upward flame & dark smoke plume
          const isSmoke = Math.random() < 0.34;
          const firePalette = ['#fff7ed', '#fde047', '#fb923c', '#f97316', '#ef4444'];
          particles.push({
            x: tree.x + (Math.random() - 0.5) * tree.r * 1.15,
            y: tree.y - 6 + (Math.random() - 0.5) * tree.r * 0.85,
            vx: (Math.random() - 0.5) * 34 + (isSmoke ? 16 : 5),
            vy: -38 - Math.random() * (isSmoke ? 68 : 52),
            r: isSmoke ? (9 + Math.random() * 12) : (5 + Math.random() * 10),
            color: isSmoke ? (Math.random() < 0.5 ? '#292524' : '#44403c') : firePalette[Math.floor(Math.random() * firePalette.length)],
            life: isSmoke ? 0.85 : 0.42,
            maxLife: isSmoke ? 0.85 : 0.42
          });
          // Falling glowing embers
          if (Math.random() < 0.32) {
            particles.push({
              x: tree.x + (Math.random() - 0.5) * tree.r * 1.4,
              y: tree.y + (Math.random() - 0.5) * tree.r,
              vx: (Math.random() - 0.5) * 75,
              vy: 18 + Math.random() * 55,
              r: 2.2 + Math.random() * 2.2,
              color: '#fbbf24',
              life: 0.55,
              maxLife: 0.55
            });
          }
        }

        // Thermal heat spread to neighboring trees & peds
        if (tree.burnTimer < (tree.maxBurn || 8.5) * 0.68 && Math.random() < dt * 1.4) {
          for (let j = 0; j < palmTrees.length; j++) {
            const other = palmTrees[j];
            if (other !== tree && !other.burnt && other.burnTimer <= 0) {
              if (Math.abs(other.x - tree.x) < 84 && Math.abs(other.y - tree.y) < 84 && Math.hypot(other.x - tree.x, other.y - tree.y) < 82) {
                igniteTree(other);
              }
            }
          }
        }
        for (let k = 0; k < peds.length; k++) {
          const p = peds[k];
          if (Math.abs(p.x - tree.x) < 32 && Math.abs(p.y - tree.y) < 32) {
            p.burnTimer = Math.max(p.burnTimer || 0, 3.8);
          }
        }

        if (tree.burnTimer <= 0) {
          tree.burnTimer = 0;
          tree.burnt = true;
          skidMarks.push({ x1: tree.x - 14, y1: tree.y - 14, x2: tree.x + 14, y2: tree.y + 14, width: 28, alpha: 0.55, isScorch: true });
        }
      }
    }

    // 2. Scorched / Burning Building Facades near Camera
    const cgx = Math.floor(camera.x / TILE_SIZE);
    const cgy = Math.floor(camera.y / TILE_SIZE);
    for (let gy = Math.max(0, cgy - 5); gy <= Math.min(GRID_H - 1, cgy + 5); gy++) {
      for (let gx = Math.max(0, cgx - 7); gx <= Math.min(GRID_W - 1, cgx + 7); gx++) {
        const cell = buildingsGrid[gy][gx];
        for (let i = 0; i < cell.length; i++) {
          const b = cell[i];
          if (b.burnTimer > 0 && !b.collapsing && !b.collapsed) {
            b.burnTimer -= dt;
            b.hp -= 12 * dt;
            if (Math.random() < 0.35) {
              particles.push({
                x: b.x + Math.random() * b.w,
                y: b.y + Math.random() * b.h,
                vx: (Math.random() - 0.5) * 24,
                vy: -32 - Math.random() * 36,
                r: 6 + Math.random() * 9,
                color: Math.random() < 0.45 ? '#292524' : '#f97316',
                life: 0.55,
                maxLife: 0.55
              });
            }
            if (b.hp <= 0) {
              startBuildingCollapse(b, b.x + b.w * 0.5, b.y + b.h * 0.5, true);
            }
          }
        }
      }
    }
  }

  function resolveBridgeAndWaterCollisions(entity, radius, kind = 'ped') {
    const gx0 = Math.max(0, Math.min(GRID_W - 1, Math.floor(entity.x / TILE_SIZE)));
    const gy0 = Math.max(0, Math.min(GRID_H - 1, Math.floor(entity.y / TILE_SIZE)));

    // 1. Boats sail at z = 0 freely UNDERNEATH elevated bridges, colliding only with land & seawalls
    if (entity.isBoat) {
      for (let gy = Math.max(0, gy0 - 1); gy <= Math.min(GRID_H - 1, gy0 + 1); gy++) {
        for (let gx = Math.max(0, gx0 - 1); gx <= Math.min(GRID_W - 1, gx0 + 1); gx++) {
          const t = worldGrid[gy][gx];
          if (t === 4) continue; // Navigable water (including under bridges!)
          const inset = t === 3 ? 22 : 0; // Allow boats to nose gently onto sandy beaches
          const hit = circleRectCollide(
            entity.x, entity.y, radius,
            gx * TILE_SIZE + inset, gy * TILE_SIZE + inset,
            TILE_SIZE - inset * 2, TILE_SIZE - inset * 2
          );
          if (hit) {
            entity.x += hit.nx * hit.overlap;
            entity.y += hit.ny * hit.overlap;
            entity.vx *= 0.6;
            entity.vy *= 0.6;
          }
        }
      }
      return;
    }

    // 2. Elevated Bridge Guardrails / Concrete Jersey Barriers (z = 1)
    if (!entity.inWater && !entity.isAirborne && hasBridgeAt(gx0, gy0)) {
      const br = bridgeGrid[gy0][gx0];
      const wx = gx0 * TILE_SIZE;
      const wy = gy0 * TILE_SIZE;
      const railInset = kind === 'vehicle' ? 18 : 15;
      const speed = Math.hypot(entity.vx || 0, entity.vy || 0);

      if (br.axis === 'x') {
        if (gy0 > 0 && !isRoadOrBridge(gx0, gy0 - 1)) {
          const minY = wy + railInset + radius;
          if (entity.y < minY) {
            entity.y = minY;
            if (kind === 'vehicle' && speed > 135 && entity.vy < -25) {
              spawnSparks(entity.x, wy + railInset, 5, '#fbbf24');
            }
            if (entity.vy < 0) entity.vy *= -0.32;
            if (kind === 'ped') entity.angle = Math.abs(entity.angle);
          }
        }
        if (gy0 < GRID_H - 1 && !isRoadOrBridge(gx0, gy0 + 1)) {
          const maxY = wy + TILE_SIZE - railInset - radius;
          if (entity.y > maxY) {
            entity.y = maxY;
            if (kind === 'vehicle' && speed > 135 && entity.vy > 25) {
              spawnSparks(entity.x, wy + TILE_SIZE - railInset, 5, '#fbbf24');
            }
            if (entity.vy > 0) entity.vy *= -0.32;
            if (kind === 'ped') entity.angle = -Math.abs(entity.angle);
          }
        }
        if (br.closedEast || (gx0 < GRID_W - 1 && !isRoadOrBridge(gx0 + 1, gy0) && worldGrid[gy0][gx0 + 1] === 4)) {
          const maxX = wx + TILE_SIZE - 20 - radius;
          if (entity.x > maxX) {
            entity.x = maxX;
            if (kind === 'vehicle' && speed > 120 && entity.vx > 20) {
              spawnSparks(wx + TILE_SIZE - 20, entity.y, 6, '#fbbf24');
            }
            if (entity.vx > 0) entity.vx *= -0.32;
            if (kind === 'ped') entity.angle += Math.PI;
          }
        }
        if (gx0 > 0 && !isRoadOrBridge(gx0 - 1, gy0) && worldGrid[gy0][gx0 - 1] === 4) {
          const minX = wx + 20 + radius;
          if (entity.x < minX) {
            entity.x = minX;
            if (entity.vx < 0) entity.vx *= -0.32;
            if (kind === 'ped') entity.angle += Math.PI;
          }
        }
      } else {
        // North-South Bridge Span (axis === 'y')
        if (gx0 > 0 && !isRoadOrBridge(gx0 - 1, gy0)) {
          const minX = wx + railInset + radius;
          if (entity.x < minX) {
            entity.x = minX;
            if (kind === 'vehicle' && speed > 135 && entity.vx < -25) {
              spawnSparks(wx + railInset, entity.y, 5, '#fbbf24');
            }
            if (entity.vx < 0) entity.vx *= -0.32;
            if (kind === 'ped') entity.angle = Math.PI - entity.angle;
          }
        }
        if (gx0 < GRID_W - 1 && !isRoadOrBridge(gx0 + 1, gy0)) {
          const maxX = wx + TILE_SIZE - railInset - radius;
          if (entity.x > maxX) {
            entity.x = maxX;
            if (kind === 'vehicle' && speed > 135 && entity.vx > 25) {
              spawnSparks(wx + TILE_SIZE - railInset, entity.y, 5, '#fbbf24');
            }
            if (entity.vx > 0) entity.vx *= -0.32;
            if (kind === 'ped') entity.angle = Math.PI - entity.angle;
          }
        }
      }
      return;
    }

    // 3. Shoreline Concrete Seawalls & Open Water Immersion
    const curTile = worldGrid[gy0][gx0];
    if (!entity.inWater && (curTile !== 4 || hasBridgeAt(gx0, gy0))) {
      // On solid land (non-beach) or for AI peds, raised seawall curbs prevent falling into deep water
      if (curTile !== 3 || kind === 'ped') {
        for (let gy = Math.max(0, gy0 - 1); gy <= Math.min(GRID_H - 1, gy0 + 1); gy++) {
          for (let gx = Math.max(0, gx0 - 1); gx <= Math.min(GRID_W - 1, gx0 + 1); gx++) {
            if (worldGrid[gy][gx] !== 4) continue;
            const br = bridgeGrid[gy][gx];
            const alignedBridgeEntry = br && ((br.axis === 'x' && gy === gy0) || (br.axis === 'y' && gx === gx0));
            if (alignedBridgeEntry) continue;

            const hit = circleRectCollide(entity.x, entity.y, radius, gx * TILE_SIZE, gy * TILE_SIZE, TILE_SIZE, TILE_SIZE);
            if (hit) {
              entity.x += hit.nx * hit.overlap;
              entity.y += hit.ny * hit.overlap;
              if (kind === 'vehicle') {
                const spd = Math.hypot(entity.vx, entity.vy);
                if (spd > 190) spawnSparks(entity.x - hit.nx * radius, entity.y - hit.ny * radius, 4, '#fbbf24');
                entity.vx *= 0.65;
                entity.vy *= 0.65;
              } else if (kind === 'ped') {
                entity.angle += Math.PI * 0.65;
              }
            }
          }
        }
      }
    }

    // Re-evaluate tile after seawall push
    const gx1 = Math.max(0, Math.min(GRID_W - 1, Math.floor(entity.x / TILE_SIZE)));
    const gy1 = Math.max(0, Math.min(GRID_H - 1, Math.floor(entity.y / TILE_SIZE)));
    const postTile = worldGrid[gy1][gx1];

    if (postTile === 4 && (!hasBridgeAt(gx1, gy1) || entity.inWater)) {
      if (kind === 'player') {
        entity.inWater = true;
      } else if (kind === 'vehicle') {
        if (!entity.inWater) {
          entity.inWater = true;
          shockwaves.push({ x: entity.x, y: entity.y, r: 8, maxR: 75, color: '#e0f2fe', life: 0.4, maxLife: 0.4 });
          spawnSparks(entity.x, entity.y, 14, '#e0f2fe');
          if (entity.driver === 'player') {
            showBanner('🌊 VEHICLE FLOODED! SWIM TO SHORE OR BOAT', '#38bdf8');
          }
        }
        entity.vx *= 0.86;
        entity.vy *= 0.86;
        if (Math.hypot(entity.vx, entity.vy) < 95 && entity.driver) {
          if (entity.driver === 'player' && player.vehicle === entity) {
            entity.driver = null;
            player.vehicle = null;
            player.inWater = true;
            player.x = entity.x;
            player.y = entity.y;
            document.getElementById('radio-banner').classList.add('hidden');
            updateHUD();
          } else {
            entity.driver = null;
          }
        }
      } else if (kind === 'ped') {
        entity.angle += Math.PI;
      }
    } else if (entity.inWater && postTile !== 4) {
      entity.inWater = false;
    }
  }

  function spawnDebrisBurst(x, y, count, bld, speedScale = 1) {
    const palette = [
      bld.wallColor || '#a8a29e',
      bld.roofColor || '#78716c',
      bld.trimColor || '#d6d3d1',
      '#57534e',
      '#bae6fd'
    ];
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const spd = (45 + Math.random() * 250) * speedScale;
      debrisChunks.push({
        x: x + (Math.random() - 0.5) * 28,
        y: y + (Math.random() - 0.5) * 28,
        z: 6 + Math.random() * Math.min(70, bld.height || 36),
        vx: Math.cos(a) * spd,
        vy: Math.sin(a) * spd,
        vz: (75 + Math.random() * 190) * speedScale,
        rot: Math.random() * Math.PI * 2,
        vrot: (Math.random() - 0.5) * 14,
        w: 4 + Math.random() * 8,
        h: 3 + Math.random() * 6,
        color: palette[i % palette.length],
        life: 1.8 + Math.random() * 1.6,
        maxLife: 3.4
      });
    }
  }

  function spawnWaterPlume(x, y, scale = 1) {
    sfx.playWaterSplash(scale > 1.05);
    for (let ring = 0; ring < 3; ring++) {
      waterRipples.push({
        x, y,
        r: 6 + ring * 8,
        maxR: (58 + ring * 34) * scale,
        life: 0.75 + ring * 0.22,
        maxLife: 0.75 + ring * 0.22,
        color: ring === 0 ? 'rgba(240, 249, 255, 0.75)' : 'rgba(125, 211, 252, 0.48)'
      });
    }
    if (waterRipples.length > 140) waterRipples.splice(0, waterRipples.length - 140);

    const drops = Math.round(22 * scale);
    for (let i = 0; i < drops; i++) {
      const a = Math.random() * Math.PI * 2;
      const spd = (35 + Math.random() * 210) * scale;
      particles.push({
        x: x + (Math.random() - 0.5) * 14,
        y: y + (Math.random() - 0.5) * 14,
        vx: Math.cos(a) * spd,
        vy: Math.sin(a) * spd,
        r: (4 + Math.random() * 9) * scale,
        color: i % 3 === 0 ? '#ffffff' : (i % 3 === 1 ? '#e0f2fe' : '#7dd3fc'),
        life: 0.35 + Math.random() * 0.35,
        maxLife: 0.7
      });
    }
  }

  function startBuildingCollapse(b, hitX, hitY, byPlayer = true) {
    if (b.collapsing || b.collapsed) return;
    b.collapsing = true;
    b.collapseProgress = 0.01;
    b.smokeTimer = 20.0;
    collapsingBuildings.push(b);

    // Pre-generate persistent ground-level rubble ruin geometry tailored to this building
    const slabs = [];
    for (let s = 0; s < 14; s++) {
      const hs1 = cellHash(b.x + s * 13, b.y + s * 7);
      const hs2 = cellHash(b.y + s * 29, b.x + s * 19);
      slabs.push({
        dx: 6 + hs1 * Math.max(8, b.w - 22),
        dy: 6 + hs2 * Math.max(8, b.h - 22),
        sw: 10 + (s % 4) * 5,
        sh: 7 + ((s + 2) % 3) * 5,
        rot: (hs1 - 0.5) * Math.PI,
        col: s % 3 === 0 ? b.wallColor : (s % 3 === 1 ? b.roofColor : '#57534e')
      });
    }
    const rebars = [];
    for (let r = 0; r < 7; r++) {
      const hr = cellHash(b.x * 0.3 + r * 17, b.y * 0.7 + r * 23);
      const ang = hr * Math.PI * 2;
      const rx = b.w * (0.2 + 0.6 * cellHash(r * 11, b.x));
      const ry = b.h * (0.2 + 0.6 * cellHash(b.y, r * 13));
      rebars.push({ x1: rx, y1: ry, x2: rx + Math.cos(ang) * 16, y2: ry + Math.sin(ang) * 16 });
    }
    b.ruin = { slabs, rebars };

    // Live-update Satellite Megamap & Radar Minimap base texture with scorched rubble!
    const bctx = baseMapCanvas.getContext('2d');
    const sx = baseMapCanvas.width / WORLD_W;
    const sy = baseMapCanvas.height / WORLD_H;
    bctx.fillStyle = '#3f3a36';
    bctx.fillRect(b.x * sx, b.y * sy, Math.max(2, b.w * sx), Math.max(2, b.h * sy));
    bctx.fillStyle = '#1c1917';
    bctx.fillRect((b.x + b.w * 0.25) * sx, (b.y + b.h * 0.25) * sy, Math.max(1, b.w * 0.5 * sx), Math.max(1, b.h * 0.5 * sy));

    sfx.playBuildingCollapse();
    const cx = b.x + b.w * 0.5;
    const cy = b.y + b.h * 0.5;
    camera.shake = Math.min(36, camera.shake + 26);
    shockwaves.push({ x: cx, y: cy, r: 14, maxR: Math.max(b.w, b.h) * 1.35, color: '#d6d3d1', life: 0.55, maxLife: 0.55 });
    spawnDebrisBurst(hitX || cx, hitY || cy, 34, b, 1.25);

    // Billowing concrete dust & ember plume
    const dustCols = ['#e7e5e4', '#d6d3d1', '#a8a29e', '#78716c', '#fb923c'];
    for (let i = 0; i < 42; i++) {
      const a = Math.random() * Math.PI * 2;
      const spd = 25 + Math.random() * 210;
      particles.push({
        x: b.x + Math.random() * b.w,
        y: b.y + Math.random() * b.h,
        vx: Math.cos(a) * spd,
        vy: Math.sin(a) * spd,
        r: 12 + Math.random() * 22,
        color: dustCols[i % dustCols.length],
        life: 0.65 + Math.random() * 0.75,
        maxLife: 1.4
      });
    }

    // Crush nearby hostiles/peds caught in falling masonry
    const crushR = Math.max(b.w, b.h) * 0.72;
    for (let k = peds.length - 1; k >= 0; k--) {
      const p = peds[k];
      if (Math.hypot(p.x - cx, p.y - cy) < crushR) {
        p.hp -= 250;
        if (p.hp <= 0) {
          if (byPlayer) handlePedKilled(p, k);
          else peds.splice(k, 1);
        }
      }
    }

    if (byPlayer) {
      const bounty = Math.round((400 + b.height * 12) / 50) * 50;
      addCash(bounty, cx, cy);
      addWanted(0.85);
      player.reflex = Math.min(player.maxReflex, player.reflex + 18);
      showBanner(`💥 DEMOLISHED ${b.sign || 'STRUCTURE'}! +$${bounty}`, '#f59e0b');
    }
  }

  function damageBuilding(b, amount, hitX, hitY, byPlayer = true) {
    if (!b || b.collapsing || b.collapsed || amount <= 0) return;
    b.hp -= amount;
    if (amount >= 25) {
      b.hitShake = Math.min(10, b.hitShake + Math.min(6, amount * 0.04));
    }
    const dmgRatio = 1 - Math.max(0, b.hp) / b.maxHp;
    if (dmgRatio > 0.14) {
      b.cracks = Math.min(5, Math.max(1, Math.ceil(dmgRatio * 5)));
    }

    const chunkCount = amount >= 90 ? 9 : (amount >= 25 ? 4 : (Math.random() < 0.35 ? 1 : 0));
    if (chunkCount > 0) {
      spawnDebrisBurst(hitX, hitY, chunkCount, b, amount >= 90 ? 0.85 : 0.55);
    }
    const dustCount = amount >= 90 ? 8 : (amount >= 25 ? 3 : 1);
    for (let i = 0; i < dustCount; i++) {
      const a = Math.random() * Math.PI * 2;
      particles.push({
        x: hitX + (Math.random() - 0.5) * 12,
        y: hitY + (Math.random() - 0.5) * 12,
        vx: Math.cos(a) * (24 + Math.random() * 75),
        vy: Math.sin(a) * (24 + Math.random() * 75),
        r: 5 + Math.random() * (amount >= 90 ? 10 : 5),
        color: i % 2 === 0 ? '#d6d3d1' : '#a8a29e',
        life: 0.35 + Math.random() * 0.25,
        maxLife: 0.6
      });
    }

    if (b.hp <= 0) {
      startBuildingCollapse(b, hitX, hitY, byPlayer);
    }
  }

  function resolveBuildingCollisions(entity, radius, isVehicle = false, kind = null) {
    entity.x = Math.max(radius, Math.min(WORLD_W - radius, entity.x));
    entity.y = Math.max(radius, Math.min(WORLD_H - radius, entity.y));

    const entityKind = kind || (isVehicle ? 'vehicle' : (entity === player ? 'player' : 'ped'));
    resolveBridgeAndWaterCollisions(entity, radius, entityKind);

    const gx0 = Math.floor(entity.x / TILE_SIZE);
    const gy0 = Math.floor(entity.y / TILE_SIZE);
    const tileSpan = (isVehicle && entity.w && entity.h)
      ? Math.max(1, Math.ceil((Math.max(entity.w, entity.h) * 0.55) / TILE_SIZE))
      : 1;

    for (let gy = Math.max(0, gy0 - tileSpan); gy <= Math.min(GRID_H - 1, gy0 + tileSpan); gy++) {
      for (let gx = Math.max(0, gx0 - tileSpan); gx <= Math.min(GRID_W - 1, gx0 + tileSpan); gx++) {
        const cellBlds = buildingsGrid[gy][gx];
        for (let i = 0; i < cellBlds.length; i++) {
          const b = cellBlds[i];
          if (b.collapsing || b.collapsed) continue; // Flattened ruins can be driven & walked right across!

          const hit = (isVehicle && entity.w && entity.h)
            ? obbRectCollide(entity.x, entity.y, entity.w * 0.48, entity.h * 0.47, entity.angle || 0, b.x, b.y, b.w, b.h)
            : circleRectCollide(entity.x, entity.y, radius, b.x, b.y, b.w, b.h);

          if (hit) {
            const contactX = hit.contactX !== undefined ? hit.contactX : (entity.x - hit.nx * radius);
            const contactY = hit.contactY !== undefined ? hit.contactY : (entity.y - hit.ny * radius);

            if (isVehicle && entity.isTank && !entity.exploded) {
              // Exact inward velocity component along the wall normal — prevents side-brush phantom hits!
              const intoWallSpd = -(entity.vx * hit.nx + entity.vy * hit.ny);
              const speed = Math.hypot(entity.vx, entity.vy);
              if (intoWallSpd > 14 && (!entity.ramTimer || entity.ramTimer <= 0)) {
                entity.ramTimer = 0.11;
                shatterBuildingGlass(b, contactX, contactY, 8);
                const ramDmg = 135 + intoWallSpd * 2.25 + speed * 0.45;
                damageBuilding(b, ramDmg, contactX, contactY, entity.driver === 'player');
                sfx.playExplosion(false);
                camera.shake = Math.min(20, camera.shake + 7);
              }
              // If the Rhino Tank just breached/collapsed the building, PLOW STRAIGHT THROUGH!
              if (b.collapsing || b.collapsed) {
                entity.vx *= 0.88;
                entity.vy *= 0.88;
                continue;
              }
              entity.x += hit.nx * hit.overlap;
              entity.y += hit.ny * hit.overlap;
              if (intoWallSpd > 0) {
                entity.vx += hit.nx * intoWallSpd * 0.82;
                entity.vy += hit.ny * intoWallSpd * 0.82;
              }
            } else {
              entity.x += hit.nx * hit.overlap;
              entity.y += hit.ny * hit.overlap;
              if (isVehicle) {
                const intoWallSpd = -(entity.vx * hit.nx + entity.vy * hit.ny);
                const speed = Math.hypot(entity.vx, entity.vy);
                if (intoWallSpd > 125) {
                  shatterBuildingGlass(b, contactX, contactY, 3);
                }
                if (speed > 215) {
                  entity.hp -= (speed - 185) * 0.06;
                  spawnSparks(contactX, contactY, 6);
                }
                if (intoWallSpd > 0) {
                  entity.vx += hit.nx * intoWallSpd * 1.15;
                  entity.vy += hit.ny * intoWallSpd * 1.15;
                }
                entity.vx *= 0.72;
                entity.vy *= 0.72;
              }
            }
          }
        }

        // Physical Palm Tree Trunk Collisions & Knock-Down Physics!
        if (!entity.isAirborne && !entity.inWater) {
          const cellTrees = treesGrid[gy] && treesGrid[gy][gx];
          if (cellTrees) {
            for (let tIdx = 0; tIdx < cellTrees.length; tIdx++) {
              const tr = cellTrees[tIdx];
              if (tr.fallen || tr.falling) continue;
              const dx = entity.x - tr.x;
              const dy = entity.y - tr.y;
              const minD = (isVehicle ? Math.min(entity.w, entity.h) * 0.45 : radius) + (tr.trunkR || 9.5);
              if (Math.abs(dx) > minD || Math.abs(dy) > minD) continue;
              const dist = Math.hypot(dx, dy);
              if (dist < minD && dist > 0.001) {
                if (isVehicle) {
                  const spd = Math.hypot(entity.vx, entity.vy);
                  if (entity.isTank || entity.isTruck || spd >= 92) {
                    const hitAng = spd > 8 ? Math.atan2(entity.vy, entity.vx) : (entity.angle || 0);
                    knockDownTree(tr, hitAng);
                    if (!entity.isTank) {
                      const slow = entity.isTruck ? 0.93 : 0.80;
                      entity.vx *= slow;
                      entity.vy *= slow;
                      entity.hp -= Math.max(2, spd * 0.025);
                    }
                    if (entity.driver === 'player') {
                      camera.shake = Math.min(14, camera.shake + 5);
                    }
                    continue;
                  }
                  tr.shakeTimer = 0.42;
                }
                const nx = dx / dist;
                const ny = dy / dist;
                const ov = minD - dist;
                entity.x += nx * ov;
                entity.y += ny * ov;
                if (isVehicle) {
                  entity.vx *= 0.62;
                  entity.vy *= 0.62;
                } else if (entityKind === 'ped') {
                  entity.angle += 0.9;
                }
              }
            }
          }
        }
      }
    }
  }

  function spawnSparks(x, y, count = 8, color = '#ffe600') {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const spd = 60 + Math.random() * 220;
      particles.push({
        x, y,
        vx: Math.cos(a) * spd,
        vy: Math.sin(a) * spd,
        r: 2 + Math.random() * 3.2,
        color,
        life: 0.25 + Math.random() * 0.25,
        maxLife: 0.5
      });
    }
  }

  function provokeNearbyPeds(x, y, radius = 380) {
    let shouted = false;
    for (let i = 0; i < peds.length; i++) {
      const p = peds[i];
      if (p.hp <= 0 || p.burnTimer > 0) continue;
      if (Math.abs(p.x - x) > radius || Math.abs(p.y - y) > radius) continue;
      const d = Math.hypot(p.x - x, p.y - y);
      if (d > radius) continue;

      if (p.role === 'gang' || p.isAggressive) {
        p.hostileTimer = Math.max(p.hostileTimer || 0, 16.0);
        p.panicTimer = 0;
        if (!shouted && Math.random() < 0.28) {
          shouted = true;
          const taunts = p.role === 'gang'
            ? ['TURF WAR!', 'LIGHT HIM UP!', 'WRONG BLOCK!', 'CREW UP!']
            : ['WATCH IT!', 'YOU PICKED A FIGHT!', 'BACK OFF!'];
          addFloatingText(p.x, p.y - 16, taunts[Math.floor(Math.random() * taunts.length)], p.color || '#ff2a85');
        }
      } else if (p.role === 'civilian') {
        p.panicTimer = Math.max(p.panicTimer, 4.5);
        p.angle = Math.atan2(p.y - y, p.x - x);
      }
    }
  }

  function createExplosion(x, y, radius = 145, damage = 200, demolishBuildings = false) {
    const gx = Math.max(0, Math.min(GRID_W - 1, Math.floor(x / TILE_SIZE)));
    const gy = Math.max(0, Math.min(GRID_H - 1, Math.floor(y / TILE_SIZE)));
    const hitOpenWater = worldGrid[gy][gx] === 4 && !hasBridgeAt(gx, gy);

    if (hitOpenWater) {
      spawnWaterPlume(x, y, Math.max(0.9, radius / 115));
    } else {
      sfx.playExplosion(radius > 160);
    }
    camera.shake = Math.min(32, camera.shake + 20);
    shockwaves.push({ x, y, r: 10, maxR: radius * 1.15, color: hitOpenWater ? '#7dd3fc' : '#ff6d00', life: 0.36, maxLife: 0.36 });

    if (!hitOpenWater) {
      const fireColors = ['#ffffff', '#ffe600', '#ff6d00', '#ff1744', '#262626'];
      for (let i = 0; i < 48; i++) {
        const a = Math.random() * Math.PI * 2;
        const spd = 30 + Math.random() * 360;
        const c = fireColors[Math.floor(Math.random() * fireColors.length)];
        particles.push({
          x: x + (Math.random() - 0.5) * 22,
          y: y + (Math.random() - 0.5) * 22,
          vx: Math.cos(a) * spd,
          vy: Math.sin(a) * spd,
          r: 8 + Math.random() * 18,
          color: c,
          life: 0.4 + Math.random() * 0.55,
          maxLife: 0.95
        });
      }

      skidMarks.push({ x1: x - 24, y1: y - 24, x2: x + 24, y2: y + 24, width: 48, alpha: 0.68, isScorch: true });
    }

    // Blast wave shatters windows across nearby glazed buildings & demolishes structures!
    const seenBlds = new Set();
    const cellSpan = Math.max(2, Math.ceil((radius * 1.55) / TILE_SIZE));
    for (let cy = Math.max(0, gy - cellSpan); cy <= Math.min(GRID_H - 1, gy + cellSpan); cy++) {
      for (let cx = Math.max(0, gx - cellSpan); cx <= Math.min(GRID_W - 1, gx + cellSpan); cx++) {
        for (const bld of buildingsGrid[cy][cx]) {
          if (seenBlds.has(bld) || bld.collapsing || bld.collapsed) continue;
          seenBlds.add(bld);
          const nearX = Math.max(bld.x, Math.min(x, bld.x + bld.w));
          const nearY = Math.max(bld.y, Math.min(y, bld.y + bld.h));
          const d = Math.hypot(x - nearX, y - nearY);
          if (d < radius * 1.48) {
            shatterBuildingGlass(bld, nearX, nearY, radius >= 300 ? 22 : 12);
          }
          if (d < radius * 0.96) {
            const falloff = 1 - (d / (radius * 0.96)) * 0.58;
            const structMult = demolishBuildings ? 1.85 : 0.42;
            damageBuilding(bld, damage * structMult * falloff, nearX, nearY, true);
          }
        }
      }
    }

    // Ignite AND blast-fell palm trees caught in the shockwave!
    for (let i = 0; i < palmTrees.length; i++) {
      const tree = palmTrees[i];
      if (Math.abs(tree.x - x) < radius * 1.1 && Math.abs(tree.y - y) < radius * 1.1) {
        const td = Math.hypot(tree.x - x, tree.y - y);
        if (td < radius * 1.05) {
          if (!tree.burnt) igniteTree(tree);
          if (!tree.fallen && !tree.falling && td < radius * 0.88) {
            knockDownTree(tree, Math.atan2(tree.y - y, tree.x - x));
          }
        }
      }
    }
    provokeNearbyPeds(x, y, radius * 2.4);

    for (let i = peds.length - 1; i >= 0; i--) {
      const p = peds[i];
      const d = Math.hypot(p.x - x, p.y - y);
      if (d < radius) {
        p.hp -= damage * (1 - d / radius * 0.6);
        if (p.hp > 0 && d < radius * 0.85) p.burnTimer = Math.max(p.burnTimer || 0, 3.5);
        if (p.hp <= 0) handlePedKilled(p, i);
      }
    }

    for (const v of vehicles) {
      if (v.hp <= 0) continue;
      const d = Math.hypot(v.x - x, v.y - y);
      if (d < radius) {
        v.hp -= damage * (1 - d / radius * 0.5);
        const ang = Math.atan2(v.y - y, v.x - x);
        const push = 280 / (v.mass || 1);
        v.vx += Math.cos(ang) * push;
        v.vy += Math.sin(ang) * push;
      }
    }

    if (hitOpenWater && radius >= 140) {
      tsunamiWaves.push({
        x,
        y,
        r: 22,
        maxR: Math.min(760, radius * 2.55),
        speed: 265 + Math.min(145, radius * 0.35),
        force: 360 + radius * 0.9,
        life: 2.4,
        maxLife: 2.4
      });
      if (radius >= 240) {
        setBreakingNews(`TSUNAMI SURGE ALERT: MASSIVE IMPACT IN ${getDistrictName(x, y)} WATERS!`, 14);
      }
    }

    // Rupture nearby RON-99 Gas Station pumps (Domino Chain-Reaction!) & High-Voltage Power Substations!
    for (let gi = 0; gi < gasStations.length; gi++) {
      const gs = gasStations[gi];
      for (let pi = 0; pi < gs.pumps.length; pi++) {
        const pump = gs.pumps[pi];
        if (!pump.exploded && Math.hypot(pump.x - x, pump.y - y) < radius * 1.06) {
          ruptureGasPump(gs, pump, 0.26);
        }
      }
    }
    for (let ni = 0; ni < powerNodes.length; ni++) {
      const pn = powerNodes[ni];
      if (!pn.destroyed && Math.hypot(pn.x - x, pn.y - y) < radius + 28) {
        damagePowerSubstation(pn, damage * 0.78, true);
      }
    }

    if (!player.vehicle && player.z < 40 && !(player.crashProtectTimer > 0)) {
      const d = Math.hypot(player.x - x, player.y - y);
      if (d < radius) {
        damagePlayer(damage * 0.42 * (1 - d / radius));
      }
    }
  }

  function ruptureGasPump(station, pump, maxFuse = 1.15) {
    if (!pump || pump.exploded) return;
    if (!pump.leaking) {
      pump.leaking = true;
      pump.fuseTimer = maxFuse;
      spawnSparks(pump.x, pump.y, 12, '#f97316');
      addFloatingText(pump.x, pump.y - 24, '⛽ FUEL RUPTURE!!', '#ff6d00');
    } else {
      pump.fuseTimer = Math.min(pump.fuseTimer, maxFuse);
    }
  }

  function detonateGasPump(station, pump) {
    if (!pump || pump.exploded) return;
    pump.exploded = true;
    pump.leaking = false;
    station.exploded = true;
    addCash(850, station.x, station.y);
    addWanted(1.15);
    showBanner(`💥 ${station.name} THERMOBARIC BLAST!`, '#ff6d00');
    setBreakingNews(`BREAKING: ${station.name} ERUPTS IN MASSIVE RON-99 FIREBALL!`, 15);
    for (let i = 0; i < station.pumps.length; i++) {
      const sib = station.pumps[i];
      if (sib !== pump && !sib.exploded) {
        ruptureGasPump(station, sib, 0.28);
      }
    }
    createExplosion(pump.x, pump.y, 275, 560, true);
  }

  function damagePowerSubstation(pn, amount, fromPlayer = true) {
    if (!pn || pn.destroyed) return;
    pn.hp -= amount;
    spawnSparks(pn.x, pn.y, 10, '#38bdf8');
    if (pn.hp <= 0) {
      pn.hp = 0;
      pn.destroyed = true;
      pn.blackoutTimer = 55.0;
      pn.flickerTimer = 1.35;
      shockwaves.push({ x: pn.x, y: pn.y, r: 14, maxR: 420, color: '#00f0ff', life: 0.55, maxLife: 0.55 });
      if (fromPlayer) {
        addCash(1200, pn.x, pn.y);
        addWanted(1.35);
      }
      showBanner(`⚡ ${pn.name} BLOWN — DISTRICT POWER BLACKOUT!`, '#00f0ff');
      setBreakingNews(`GRID EMERGENCY: ${pn.name} DESTROYED — BLACKOUT ACROSS ${getDistrictName(pn.x, pn.y)}!`, 16);
      createExplosion(pn.x, pn.y, 185, 340, false);
    }
  }

  function damagePlayer(amount) {
    if (player.armor > 0) {
      const absorb = Math.min(player.armor, amount * 0.72);
      player.armor -= absorb;
      player.health -= (amount - absorb);
    } else {
      player.health -= amount;
    }

    if (player.health <= 0) {
      player.health = 100;
      player.armor = 75;
      player.wanted = 0;
      player.multiplier = 1;
      player.reflexActive = false;
      document.getElementById('reflex-overlay').classList.add('hidden');
      if (droneState.active) {
        droneState.active = false;
        const dh = document.getElementById('drone-hud');
        if (dh) dh.classList.add('hidden');
      }
      player.cash = Math.max(0, player.cash - 100);
      if (player.vehicle) {
        if (player.vehicle.towTarget) {
          player.vehicle.towTarget.towedBy = null;
          player.vehicle.towTarget.altitude = 0;
          player.vehicle.towTarget = null;
        }
        player.vehicle.driver = null;
        player.vehicle = null;
      }
      player.x = 40 * TILE_SIZE + 80;
      player.y = 40 * TILE_SIZE + 80;
      player.z = 0;
      player.parachute = null;
      player.burnTimer = 0;
      player.inWater = false;
      activeMission = null;
      showBanner('WASTED! (-$100 TRAUMA MEDEVAC)', '#ff1744');
    }
    updateHUD();
  }

  function handlePedKilled(p, index) {
    spawnSparks(p.x, p.y, 10, '#dc2626');
    const pgx = Math.max(0, Math.min(GRID_W - 1, Math.floor(p.x / TILE_SIZE)));
    const pgy = Math.max(0, Math.min(GRID_H - 1, Math.floor(p.y / TILE_SIZE)));
    if (worldGrid[pgy] && (worldGrid[pgy][pgx] !== 4 || hasBridgeAt(pgx, pgy))) {
      skidMarks.push({ x1: p.x - 6, y1: p.y - 6, x2: p.x + 6, y2: p.y + 6, width: 13, alpha: 0.46, isScorch: true });
    }
    addCash(p.role === 'bounty' ? 1500 : (p.role === 'police' ? 180 : 75), p.x, p.y);
    player.reflex = Math.min(player.maxReflex, player.reflex + 10);

    addWanted(p.role === 'police' ? 0.55 : 0.20);

    if (p.gang) {
      modifyRespect(p.gang, -6);
      const rivals = Object.keys(GANGS).filter(k => k !== p.gang);
      modifyRespect(rivals[0], 4);
      modifyRespect(rivals[1], 4);
    }

    if (activeMission) {
      if (activeMission.type === 'rampage') {
        activeMission.killsNeeded = Math.max(0, activeMission.killsNeeded - 1);
        if (activeMission.killsNeeded === 0) completeMission();
      } else if (activeMission.type === 'bounty' && p === activeMission.targetEntity) {
        completeMission();
      }
    }

    peds.splice(index, 1);
  }

  // ==========================================
  // 9. PAYPHONE CONTRACTS SYSTEM
  // ==========================================
  function startPayphoneMission(phone) {
    sfx.playCash();
    if (phone.type === 'checkpoint') {
      activeMission = {
        type: 'checkpoint',
        gang: phone.gang,
        title: phone.title || 'CARBON HYPER-RUN',
        desc: 'Blast through 3 neon checkpoints across Leonida before the clock hits zero!',
        timer: 75,
        checkpoints: [
          { x: 49 * TILE_SIZE + 80, y: 40 * TILE_SIZE + 80 },
          { x: 57 * TILE_SIZE + 80, y: 40 * TILE_SIZE + 80 },
          { x: 68 * TILE_SIZE + 80, y: 40 * TILE_SIZE + 80 }
        ],
        reward: 5000
      };
    } else if (phone.type === 'bounty') {
      const tx = Math.min(72 * TILE_SIZE, Math.max(10 * TILE_SIZE, phone.x + 5 * TILE_SIZE));
      const ty = Math.min(72 * TILE_SIZE, Math.max(10 * TILE_SIZE, phone.y + 3 * TILE_SIZE));
      const boss = spawnPed(tx, ty, 'bounty', 'runners');
      boss.hp = 320;
      boss.radius = 14;
      spawnPed(tx + 30, ty, 'gang', 'runners');
      spawnPed(tx - 30, ty, 'gang', 'runners');
      spawnPed(tx, ty + 30, 'gang', 'runners');
      activeMission = {
        type: 'bounty',
        gang: phone.gang,
        title: phone.title || 'SYNDICATE VIP HIT',
        desc: 'Eliminate the heavily armed Syndicate Underboss marked on your GPS!',
        timer: 85,
        targetEntity: boss,
        reward: 6000
      };
    } else {
      activeMission = {
        type: 'rampage',
        gang: phone.gang,
        title: phone.title || 'LEONIDA RAMPAGE',
        desc: 'Neutralize 12 hostile targets or VCPD officers before time runs out!',
        timer: 60,
        killsNeeded: 12,
        reward: 4500
      };
    }
    showBanner(`CONTRACT: ${activeMission.title}`, '#39ff14');
    updateHUD();
  }

  function completeMission() {
    if (!activeMission) return;
    const reward = activeMission.reward;
    const gang = activeMission.gang;
    player.cash += reward;
    modifyRespect(gang, 25);
    sfx.playCash();
    showBanner(`MISSION PASSED! +$${reward} & RESPECT+`, '#ffe600');
    activeMission = null;
    updateHUD();
  }

  // ==========================================
  // 10. MAIN SIMULATION LOOP (BULLET-TIME, SKY-RAIL, WEATHER, PHYSICS)
  // ==========================================
  function update(rawDt) {
    // Carbon Reflex Bullet-Time Time-Dilation
    let dt = rawDt;
    if (player.reflexActive) {
      player.reflex -= rawDt * 22;
      if (player.reflex <= 0) {
        player.reflex = 0;
        player.reflexActive = false;
        document.getElementById('reflex-overlay').classList.add('hidden');
      } else {
        dt = rawDt * 0.36;
      }
      updateHUD();
    } else if (player.reflex < player.maxReflex) {
      player.reflex = Math.min(player.maxReflex, player.reflex + rawDt * 9);
      if (Math.random() < 0.2) updateHUD();
    }

    if (stuntState.slowMoTimer > 0) {
      stuntState.slowMoTimer = Math.max(0, stuntState.slowMoTimer - rawDt);
      if (!player.reflexActive) dt = rawDt * 0.48;
    }

    const activeEntity = player.vehicle || player;
    mouse.worldX = camera.x + (mouse.x - canvas.width * 0.5) / camera.zoom;
    mouse.worldY = camera.y + (mouse.y - canvas.height * 0.5) / camera.zoom;

    // Check District Transitions & Announce New Biome
    const distName = getDistrictName(activeEntity.x, activeEntity.y);
    if (distName !== player.currentDistrict) {
      player.currentDistrict = distName;
      const distEl = document.getElementById('district-readout');
      if (distEl) distEl.textContent = `📍 ${distName}`;
      showDistrictBanner(distName);
    }

    // Clear custom GPS waypoint once reached
    if (customWaypoint && Math.hypot(activeEntity.x - customWaypoint.x, activeEntity.y - customWaypoint.y) < 150) {
      customWaypoint = null;
      showBanner('ARRIVED AT GPS DESTINATION', '#39ff14');
    }

    // Advance 24-Hour Leonida World Clock, Solar Ephemeris & Natural Weather Drift
    worldClock = (worldClock + CLOCK_HOURS_PER_SEC * rawDt) % 24;
    updateEnvironmentState();

    weatherAutoTimer -= rawDt;
    if (weatherAutoTimer <= 0) {
      weatherAutoTimer = 75 + Math.random() * 35;
      const h = envState.hour;
      const roll = Math.random();
      let nextW = 0; // Mostly clear Miami skies
      if (h >= 5.0 && h <= 7.8 && roll < 0.36) nextW = 2;      // Morning Everglades / coastal mist
      else if (h >= 14.5 && h <= 18.2 && roll < 0.34) nextW = 1; // Afternoon tropical rain shower
      else if (h >= 11.5 && h <= 15.0 && roll < 0.25) nextW = 3; // Midday Miami heatwave
      if (nextW !== weatherMode) setWeatherByIndex(nextW, true);
    }

    // Rare Single High-Altitude Trans-Leonida Flight Corridor (no aircraft swarms!)
    skyFlightTimer -= rawDt;
    if (skyFlightTimer <= 0) {
      skyFlightTimer = 42 + Math.random() * 28;
      spawnHighAltitudeFlight(false);
    }

    // Circadian Traffic Population Balancer (Rush Hour surge vs. calm Late Night streets)
    trafficSpawnTimer -= rawDt;
    if (trafficSpawnTimer <= 0) {
      trafficSpawnTimer = 1.6;
      const targetTraffic = Math.round(145 * envState.trafficMult);
      let civRoadCount = 0;
      let farCandidateIdx = -1;
      for (let i = 0; i < vehicles.length; i++) {
        const cv = vehicles[i];
        if (cv.driver === 'civilian' && cv.hp > 0 && !cv.exploded && !cv.isBoat && !cv.isJet && !cv.isHeli) {
          civRoadCount++;
          if (farCandidateIdx < 0 && Math.hypot(cv.x - player.x, cv.y - player.y) > 2200) {
            farCandidateIdx = i;
          }
        }
      }
      if (civRoadCount < targetTraffic) {
        for (let tries = 0; tries < 8; tries++) {
          const ang = Math.random() * Math.PI * 2;
          const dist = 950 + Math.random() * 900;
          const gx = Math.floor((player.x + Math.cos(ang) * dist) / TILE_SIZE);
          const gy = Math.floor((player.y + Math.sin(ang) * dist) / TILE_SIZE);
          if (gx >= 2 && gx < GRID_W - 2 && gy >= 2 && gy < GRID_H - 2) {
            if (spawnRightLaneTrafficAt(gx, gy)) break;
          }
        }
      } else if (civRoadCount > targetTraffic + 12 && farCandidateIdx >= 0) {
        vehicles.splice(farCandidateIdx, 1);
      }
    }

    // Advance Automated Downtown Maglev Sky-Rail Train
    const railW = SKYRAIL_BOUNDS.x2 - SKYRAIL_BOUNDS.x1;
    const railH = SKYRAIL_BOUNDS.y2 - SKYRAIL_BOUNDS.y1;
    const railPerim = 2 * (railW + railH);
    skyTrain.progress = (skyTrain.progress + skyTrain.speed * dt) % railPerim;

    // Weather Monsoon Thunder & Lightning
    if (WEATHER_MODES[weatherMode].id === 'rain') {
      if (lightningFlash > 0) lightningFlash = Math.max(0, lightningFlash - rawDt * 2.8);
      if (Math.random() < rawDt * 0.14) {
        lightningFlash = 0.85;
        sfx.playExplosion(true);
      }
    } else {
      lightningFlash = 0;
    }

    // Multiplier & Wanted Decay
    if (player.multTimer > 0) {
      player.multTimer -= rawDt;
      if (player.multTimer <= 0 && player.multiplier > 1) {
        player.multiplier = Math.max(1, player.multiplier - 1);
        player.multTimer = 4.0;
        updateHUD();
      }
    }

    if (player.crashProtectTimer > 0) {
      player.crashProtectTimer = Math.max(0, player.crashProtectTimer - rawDt);
    }
    if (player.wanted > 0) {
      player.wantedDecay -= rawDt;
      if (player.wantedDecay <= 0) {
        player.wanted = Math.max(0, player.wanted - rawDt * 0.15);
        updateHUD();
      }
    }

    // Pay N' Spray Garages (5 across Leonida)
    if (player.vehicle && payNSprayRects.length > 0) {
      const v = player.vehicle;
      for (const rect of payNSprayRects) {
        if (
          v.x > rect.x && v.x < rect.x + rect.w &&
          v.y > rect.y && v.y < rect.y + rect.h &&
          Math.hypot(v.vx, v.vy) < 120
        ) {
          if (v.hp < v.maxHp || player.wanted > 0) {
            v.hp = v.maxHp;
            player.wanted = 0;
            const colors = ['#00f0ff', '#ff2a85', '#39ff14', '#ffe600', '#a855f7', '#ffffff'];
            v.color = colors[Math.floor(Math.random() * colors.length)];
            sfx.playCash();
            showBanner('CARBON CUSTOMS: REPAIRED & COPS EVADED!', '#39ff14');
            updateHUD();
          }
        }
      }
    }

    // Insane Stunt Jump Ramps + Cinematic Hang-Time Slow-Mo & FT Distance Bonus!
    if (player.vehicle && !player.vehicle.isJet && !player.vehicle.isHeli) {
      const v = player.vehicle;
      const spd = Math.hypot(v.vx, v.vy);
      if (spd > 205 && (!v.stuntAirTimer || v.stuntAirTimer <= 0)) {
        for (const sj of stuntJumps) {
          if (Math.hypot(v.x - sj.x, v.y - sj.y) < 56) {
            v.stuntAirTimer = 1.25;
            v.vx *= 1.32;
            v.vy *= 1.32;
            stuntState.active = true;
            stuntState.startX = v.x;
            stuntState.startY = v.y;
            stuntState.slowMoTimer = 0.95;
            addCash(1000, v.x, v.y);
            showBanner('🚀 INSANE STUNT LAUNCH! +$1000', '#00f0ff');
            setBreakingNews(`AIRBORNE STUNT: DAREDEVIL LAUNCHES OFF ${getDistrictName(v.x, v.y)} RAMP!`, 10);
            break;
          }
        }
      } else if (stuntState.active && (!v.stuntAirTimer || v.stuntAirTimer <= 0)) {
        stuntState.active = false;
        const distFt = Math.max(45, Math.round(Math.hypot(v.x - stuntState.startX, v.y - stuntState.startY) * 0.44));
        addCash(distFt * 4, v.x, v.y);
        showBanner(`🏁 STUNT TOUCHDOWN: ${distFt} FT! +$${distFt * 4}`, '#39ff14');
      }
    } else if (stuntState.active) {
      stuntState.active = false;
    }

    // Update MIDI Soundtrack Engine
    if (window.MidiSoundtrack) {
      window.MidiSoundtrack.update(rawDt, !!player.vehicle, player.wanted, !!activeMission);
    }

    // Player Driving / Boating / Helicopter / Jet / Tank / Firetruck Controls
    if (player.vehicle && droneState.active) {
      const v = player.vehicle;
      if (!v.isJet && !v.isHeli) {
        v.vx *= Math.max(0, 1 - 3.5 * rawDt);
        v.vy *= Math.max(0, 1 - 3.5 * rawDt);
      }
      player.x = v.x;
      player.y = v.y;
      player.z = v.altitude || 0;
    } else if (player.vehicle) {
      const v = player.vehicle;
      const playerDt = player.reflexActive ? rawDt * 0.62 : dt; // Player retains sharper control during Bullet-Time!

      const up = keys['KeyW'] || keys['ArrowUp'] || keys['KeyZ'] || pressedKeys['w'] || pressedKeys['z'] || pressedKeys['arrowup'];
      const down = keys['KeyS'] || keys['ArrowDown'] || pressedKeys['s'] || pressedKeys['arrowdown'];
      const left = keys['KeyA'] || keys['ArrowLeft'] || keys['KeyQ'] || pressedKeys['a'] || pressedKeys['q'] || pressedKeys['arrowleft'];
      const right = keys['KeyD'] || keys['ArrowRight'] || pressedKeys['d'] || pressedKeys['arrowright'];
      const handbrake = keys['Space'] || pressedKeys[' '];
      const nitroHeld = (keys['ShiftLeft'] || keys['ShiftRight']) && player.nitro > 2 && !v.isSkate;

      let throttle = 0;
      if (up) throttle += 1;
      if (down) throttle -= 0.7;

      let steer = 0;
      if (left) steer -= 1;
      if (right) steer += 1;

      if (!v.isHeli && throttle === 0 && steer !== 0) {
        const targetScreenAngle = steer < 0 ? Math.PI : 0;
        let angleDiff = targetScreenAngle - v.angle;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        throttle = 0.88;
        if (Math.abs(angleDiff) > 0.08) steer = Math.sign(angleDiff);
        else { v.angle = targetScreenAngle; steer = 0; }
      }

      let cos = Math.cos(v.angle);
      let sin = Math.sin(v.angle);
      let forwardSpeed = v.vx * cos + v.vy * sin;
      let lateralSpeed = -v.vx * sin + v.vy * cos;

      let boostMult = 1.0;
      if (nitroHeld && throttle >= 0) {
        throttle = 1.35;
        boostMult = 1.32;
        player.nitro = Math.max(0, player.nitro - rawDt * 32);
        // Twin blue plasma nitrous flames
        particles.push({
          x: v.x - cos * (v.w * 0.5) + (Math.random() - 0.5) * 6,
          y: v.y - sin * (v.w * 0.5) + (Math.random() - 0.5) * 6,
          vx: -cos * 240, vy: -sin * 240,
          r: 4 + Math.random() * 4,
          color: Math.random() < 0.6 ? '#00f0ff' : '#ff2a85',
          life: 0.16, maxLife: 0.16
        });
      } else {
        player.nitro = Math.min(100, player.nitro + rawDt * 14);
      }

      if (throttle !== 0) {
        forwardSpeed += throttle * v.accel * playerDt;
      } else {
        forwardSpeed *= Math.max(0, 1 - (v.isHeli ? 2.4 : 1.7) * playerDt);
      }

      if (handbrake && !v.isHeli) {
        forwardSpeed *= Math.max(0, 1 - 3.6 * playerDt);
      }
      v.isBraking = (!v.isHeli && handbrake) || (throttle < 0 && forwardSpeed > 20);

      const absFwd = Math.abs(forwardSpeed);
      if (steer !== 0 && (absFwd > 5 || throttle !== 0 || v.isTank || v.isHeli)) {
        const speedFactor = (v.isTank || v.isHeli) ? 0.92 : Math.max(0.48, Math.min(1.0, absFwd / 140));
        const dirSign = (v.isHeli || forwardSpeed >= -15) ? 1 : -1;
        const turnRate = (handbrake && !v.isHeli ? 4.2 : (v.isHeli ? 2.9 : (v.isBoat ? 2.5 : (v.isTank ? 1.85 : 3.2)))) * speedFactor * dirSign;
        v.angle += steer * turnRate * playerDt;
        cos = Math.cos(v.angle);
        sin = Math.sin(v.angle);
      }

      // Wet monsoon asphalt makes drifting extra slick!
      const rainSlip = WEATHER_MODES[weatherMode].id === 'rain' ? 0.72 : 1.0;
      const gripFactor = (handbrake && !v.isHeli) ? 0.986 : Math.max(0, 1 - v.grip * rainSlip * 7.5 * playerDt);
      lateralSpeed *= gripFactor;

      if (v.isHeli && v.heliLanded && (!up || handbrake || (v.rotorRPM || 0) < 0.45)) {
        forwardSpeed = 0;
        lateralSpeed = 0;
      }

      v.vx = cos * forwardSpeed - sin * lateralSpeed;
      v.vy = sin * forwardSpeed + cos * lateralSpeed;

      const cap = v.maxSpeed * boostMult;
      const totalSpd = Math.hypot(v.vx, v.vy);
      if (totalSpd > cap) {
        v.vx = (v.vx / totalSpd) * cap;
        v.vy = (v.vy / totalSpd) * cap;
      }

      // Helicopter Rotor Spin-Up, Assisted Landing/Parking ([SPACE] Hold or [L] Auto-Land) & Fixed-Wing Altitude Physics!
      if (v.isHeli) {
        v.rotorRPM = Math.min(1.0, (v.rotorRPM || 0) + 0.68 * rawDt);
        if (up && !handbrake) {
          v.autoLanding = false;
        }
        const descendingToLand = handbrake || !!v.autoLanding;
        if (v.heliLanded) {
          v.altitude = 0;
          v.vx *= Math.max(0, 1 - 6.0 * playerDt);
          v.vy *= Math.max(0, 1 - 6.0 * playerDt);
          // Lift off smoothly once pilot holds [W]/[Up] and rotor blades reach flight RPM!
          if (up && !handbrake && v.rotorRPM >= 0.45) {
            v.heliLanded = false;
            v.autoLanding = false;
            v.altitude = 4;
          }
        } else if (descendingToLand) {
          // Hold [Space] or press [L] Auto-Land to stabilize horizontal drift & descend cleanly to land/park!
          v.vx *= Math.max(0, 1 - 3.6 * playerDt);
          v.vy *= Math.max(0, 1 - 3.6 * playerDt);
          v.altitude = Math.max(0, (v.altitude || 0) - 125 * playerDt);
          if (v.altitude <= 0.5) {
            v.altitude = 0;
            v.heliLanded = true;
            v.autoLanding = false;
            v.vx = 0;
            v.vy = 0;
            showBanner('🚁 LANDED — PRESS [F] TO PARK & EXIT • [W] LIFT OFF', '#39ff14');
          }
        } else if (v.rotorRPM >= 0.45) {
          v.altitude = Math.min(148, (v.altitude || 0) + 78 * playerDt);
        }
        v.isAirborne = v.altitude > 16;
      } else if (v.isJet) {
        const takeoffSpd = v.isAirliner ? 155 : 140;
        const targetAlt = (totalSpd > takeoffSpd && !handbrake) ? (v.isAirliner ? 295 : 240) : 0;
        v.altitude = Math.max(0, (v.altitude || 0) + (targetAlt - (v.altitude || 0)) * (v.isAirliner ? 1.65 : 2.2) * playerDt);
        v.isAirborne = v.altitude > 16;
      }

      // Aim Tank 120mm Turret or Firetruck Roof Hydro-Cannon toward mouse cursor!
      if (v.isTank || v.isFiretruck) {
        v.turretAngle = Math.atan2(mouse.worldY - v.y, mouse.worldX - v.x);
      }

      // Tire Skidmarks on Land & Elevated Bridge Decks (plus Wet Monsoon Tire Water Spray!)
      const gx = Math.max(0, Math.min(GRID_W - 1, Math.floor(v.x / TILE_SIZE)));
      const gy = Math.max(0, Math.min(GRID_H - 1, Math.floor(v.y / TILE_SIZE)));
      const onWater = worldGrid[gy][gx] === 4 && (!hasBridgeAt(gx, gy) || v.inWater);

      if (!v.isAirborne && !onWater && !v.isBoat && WEATHER_MODES[weatherMode].id === 'rain' && totalSpd > 75 && Math.random() < 0.75) {
        const rearX = v.x - cos * (v.w * 0.42);
        const rearY = v.y - sin * (v.w * 0.42);
        const sideX = -sin * (v.h * 0.38);
        const sideY = cos * (v.h * 0.38);
        for (const sgn of [-1, 1]) {
          particles.push({
            x: rearX + sideX * sgn + (Math.random() - 0.5) * 4,
            y: rearY + sideY * sgn + (Math.random() - 0.5) * 4,
            vx: -v.vx * 0.25 + (Math.random() - 0.5) * 32,
            vy: -v.vy * 0.25 + (Math.random() - 0.5) * 32,
            r: 2.8 + Math.random() * 3.5,
            color: 'rgba(224, 242, 254, 0.48)',
            life: 0.22,
            maxLife: 0.22
          });
        }
      }

      if (!v.isAirborne && !onWater && !v.isBoat && (Math.abs(lateralSpeed) > 95 || (handbrake && totalSpd > 110))) {
        const rearX = v.x - cos * (v.w * 0.36);
        const rearY = v.y - sin * (v.w * 0.36);
        const sideX = -sin * (v.h * 0.38);
        const sideY = cos * (v.h * 0.38);
        skidMarks.push({ x1: rearX + sideX, y1: rearY + sideY, x2: rearX + sideX - v.vx * playerDt, y2: rearY + sideY - v.vy * playerDt, width: 4, alpha: 0.45 });
        skidMarks.push({ x1: rearX - sideX, y1: rearY - sideY, x2: rearX - sideX - v.vx * playerDt, y2: rearY - sideY - v.vy * playerDt, width: 4, alpha: 0.45 });
        pruneTireSkids(460);
      }

      player.x = v.x;
      player.y = v.y;
      player.z = v.altitude || 0;
    } else if (player.z > 0) {
      // High-Altitude Freefall & Steerable Ram-Air Parachute Descent!
      const skyDt = player.reflexActive ? rawDt * 0.68 : dt;
      let mx = 0, my = 0;
      if (keys['KeyW'] || keys['ArrowUp'] || keys['KeyZ'] || pressedKeys['w'] || pressedKeys['z'] || pressedKeys['arrowup']) my -= 1;
      if (keys['KeyS'] || keys['ArrowDown'] || pressedKeys['s'] || pressedKeys['arrowdown']) my += 1;
      if (keys['KeyA'] || keys['ArrowLeft'] || keys['KeyQ'] || pressedKeys['a'] || pressedKeys['q'] || pressedKeys['arrowleft']) mx -= 1;
      if (keys['KeyD'] || keys['ArrowRight'] || pressedKeys['d'] || pressedKeys['arrowright']) mx += 1;
      const spaceHeld = keys['Space'] || pressedKeys[' '];
      const shiftHeld = keys['ShiftLeft'] || keys['ShiftRight'];

      if (!player.parachute) {
        player.parachute = { deployed: true, deployTimer: 0, roll: 0 };
      }
      if (!player.parachute.deployed) {
        player.parachute.deployTimer -= skyDt;
        if (player.parachute.deployTimer <= 0 || spaceHeld || player.z < 115) {
          player.parachute.deployed = true;
          sfx.playParachute();
          shockwaves.push({ x: player.x, y: player.y - player.z * 0.55, r: 6, maxR: 52, color: '#00f0ff', life: 0.3, maxLife: 0.3 });
        }
      }

      const len = Math.hypot(mx, my);
      const glideSpd = player.parachute.deployed ? (shiftHeld ? 235 : 178) : 140;
      if (len > 0) {
        const tx = (mx / len) * glideSpd;
        const ty = (my / len) * glideSpd;
        player.vx += (tx - player.vx) * 4.2 * skyDt;
        player.vy += (ty - player.vy) * 4.2 * skyDt;
        player.angle = Math.atan2(player.vy, player.vx);
        player.parachute.roll += (mx * 0.35 - player.parachute.roll) * 6 * skyDt;
      } else {
        player.vx *= Math.max(0, 1 - 2.2 * skyDt);
        player.vy *= Math.max(0, 1 - 2.2 * skyDt);
        player.parachute.roll *= Math.max(0, 1 - 5 * skyDt);
      }

      const sinkRate = !player.parachute.deployed
        ? 125
        : (shiftHeld ? 76 : (spaceHeld ? 22 : 39));
      player.z -= sinkRate * skyDt;
      player.x = Math.max(40, Math.min(WORLD_W - 40, player.x + player.vx * skyDt));
      player.y = Math.max(40, Math.min(WORLD_H - 40, player.y + player.vy * skyDt));

      // Safe Touchdown on Street, Rooftop Plaza, Beach, or Water!
      if (player.z <= 0) {
        player.z = 0;
        player.parachute = null;
        const lgx = Math.max(0, Math.min(GRID_W - 1, Math.floor(player.x / TILE_SIZE)));
        const lgy = Math.max(0, Math.min(GRID_H - 1, Math.floor(player.y / TILE_SIZE)));
        player.inWater = worldGrid[lgy][lgx] === 4 && !hasBridgeAt(lgx, lgy);
        if (player.inWater) {
          spawnWaterPlume(player.x, player.y, 0.85);
        } else {
          resolveBuildingCollisions(player, player.radius, false);
          shockwaves.push({ x: player.x, y: player.y, r: 4, maxR: 38, color: '#39ff14', life: 0.28, maxLife: 0.28 });
        }
        addCash(250, player.x, player.y);
        showBanner('🪂 PERFECT PARACHUTE TOUCHDOWN! +$250', '#39ff14');
      }
    } else if (!droneState.active) {
      // On-Foot & Swimming Controls (WASD / ZQSD / Arrows)
      const footDt = player.reflexActive ? rawDt * 0.68 : dt;
      let mx = 0, my = 0;
      if (keys['KeyW'] || keys['ArrowUp'] || keys['KeyZ'] || pressedKeys['w'] || pressedKeys['z'] || pressedKeys['arrowup']) my -= 1;
      if (keys['KeyS'] || keys['ArrowDown'] || pressedKeys['s'] || pressedKeys['arrowdown']) my += 1;
      if (keys['KeyA'] || keys['ArrowLeft'] || keys['KeyQ'] || pressedKeys['a'] || pressedKeys['q'] || pressedKeys['arrowleft']) mx -= 1;
      if (keys['KeyD'] || keys['ArrowRight'] || pressedKeys['d'] || pressedKeys['arrowright']) mx += 1;

      const sprint = (keys['ShiftLeft'] || keys['ShiftRight']) ? 1.28 : 1.0;
      const len = Math.hypot(mx, my);
      const walkSpeed = (player.inWater ? 140 : 235) * sprint;
      if (len > 0) {
        player.vx = (mx / len) * walkSpeed;
        player.vy = (my / len) * walkSpeed;
        player.stepPhase += footDt * (player.inWater ? 8 : 12) * sprint;
        if (player.inWater && Math.random() < 0.28) {
          particles.push({
            x: player.x + (Math.random() - 0.5) * 12,
            y: player.y + (Math.random() - 0.5) * 12,
            vx: -player.vx * 0.25,
            vy: -player.vy * 0.25,
            r: 3 + Math.random() * 4,
            color: 'rgba(224, 242, 254, 0.72)',
            life: 0.32,
            maxLife: 0.32
          });
        }
      } else {
        player.vx *= 0.75;
        player.vy *= 0.75;
      }

      player.x += player.vx * footDt;
      player.y += player.vy * footDt;
      player.angle = Math.atan2(mouse.worldY - player.y, mouse.worldX - player.x);

      // OBB collision between On-Foot Player and Same-Elevation Vehicles
      for (const v of vehicles) {
        if (v.isAirborne || (v.altitude || 0) > 18) continue;
        if (onWaterLayer(player) !== onWaterLayer(v)) continue;
        const dx = player.x - v.x;
        const dy = player.y - v.y;
        const reach = Math.max(65, Math.max(v.w || 60, v.h || 30) * 0.56 + 22);
        if (Math.abs(dx) > reach || Math.abs(dy) > reach) continue;

        const cos = Math.cos(-v.angle);
        const sin = Math.sin(-v.angle);
        const localX = dx * cos - dy * sin;
        const localY = dx * sin + dy * cos;

        const hw = v.w * 0.5;
        const hh = v.h * 0.5;
        const cx = Math.max(-hw, Math.min(hw, localX));
        const cy = Math.max(-hh, Math.min(hh, localY));
        const distX = localX - cx;
        const distY = localY - cy;
        const distSq = distX * distX + distY * distY;

        if (distSq < player.radius * player.radius && distSq > 0.0001) {
          const dist = Math.sqrt(distSq);
          const overlap = player.radius - dist;
          const wcos = Math.cos(v.angle);
          const wsin = Math.sin(v.angle);
          const wnx = (distX / dist) * wcos - (distY / dist) * wsin;
          const wny = (distX / dist) * wsin + (distY / dist) * wcos;

          player.x += wnx * overlap;
          player.y += wny * overlap;

          const vSpeed = Math.hypot(v.vx, v.vy);
          const approachDot = (v.vx * wnx + v.vy * wny);
          if (approachDot > 80) {
            player.vx += wnx * approachDot * 1.15;
            player.vy += wny * approachDot * 1.15;
            v.vx *= 0.72;
            v.vy *= 0.72;
            if (vSpeed > 130) {
              damagePlayer((vSpeed - 105) * 0.14);
              spawnSparks(player.x, player.y, 6, '#dc2626');
            }
          }
        }
      }

      resolveBuildingCollisions(player, player.radius, false);
    }

    // Firing Weapons / Tank Cannon / Jet & 747 AGM Missiles / Helicopter Rockets / Railgun / EMP
    // Note: Airborne aircraft set player.z = v.altitude (> 18), so allow firing at ANY altitude when inside a vehicle!
    player.fireTimer = Math.max(0, player.fireTimer - rawDt * (player.reflexActive ? 0.85 : 1.0));
    const fireHeld = mouse.down || keys['ControlLeft'] || keys['ControlRight'] || keys['KeyK'] || pressedKeys['k'];
    const canShootNow = Boolean(player.vehicle) || player.z <= 18;
    if (fireHeld && player.fireTimer <= 0 && canShootNow) {
      firePlayerWeapon();
    }

    // Update Pickups
    for (const pk of pickups) {
      if (pk.respawnTimer > 0) {
        pk.respawnTimer -= dt;
        continue;
      }
      if (player.z < 28 && Math.hypot(player.x - pk.x, player.y - pk.y) < 34) {
        if (pk.kind === 'health') {
          player.health = Math.min(player.maxHealth, player.health + 50);
          showBanner('HEALTH +50', '#ff2a55');
        } else if (pk.kind === 'armor') {
          player.armor = Math.min(player.maxArmor, player.armor + 50);
          showBanner('CARBON ARMOR +50', '#00e5ff');
        } else {
          const addAmt = pk.kind === 'rocket' ? 10 : (pk.kind === 'railgun' ? 12 : (pk.kind === 'emp' ? 6 : 80));
          player.ammo[pk.kind] = (player.ammo[pk.kind] || 0) + addAmt;
          const wIndex = WEAPONS.findIndex(w => w.id === pk.kind);
          if (wIndex >= 0) player.weaponIdx = wIndex;
          showBanner(`PICKED UP ${pk.kind.toUpperCase()}!`, '#ffe600');
        }
        sfx.playCash();
        pk.respawnTimer = 22;
        updateHUD();
      }
    }

    // Ringing Payphones
    for (const ph of payphones) {
      ph.ringTimer += dt;
      const dist = Math.hypot(player.x - ph.x, player.y - ph.y);
      if (!activeMission && dist < 240 && Math.floor(ph.ringTimer * 2) % 4 === 0 && Math.random() < 0.07) {
        sfx.playPhoneRing();
      }
      if (!activeMission && player.z < 24 && dist < 36) {
        startPayphoneMission(ph);
      }
    }

    // Active Mission Timer
    if (activeMission) {
      activeMission.timer -= dt;
      if (activeMission.type === 'checkpoint') {
        const cp = activeMission.checkpoints[0];
        if (cp && Math.hypot(player.x - cp.x, player.y - cp.y) < 72) {
          activeMission.checkpoints.shift();
          sfx.playCash();
          if (activeMission.checkpoints.length === 0) completeMission();
          else showBanner(`${activeMission.checkpoints.length} CHECKPOINTS LEFT!`, '#00f0ff');
        }
      }
      if (activeMission && activeMission.timer <= 0) {
        showBanner('CONTRACT EXPIRED!', '#ff1744');
        activeMission = null;
        updateHUD();
      }
      updateMissionHUD();
    }

    updateTreesAndFires(dt);
    updateVehicles(dt);
    updatePeds(dt);
    updateBullets(dt);
    updateMesmerizingSystems(dt, rawDt);

    // Update Progressive Building Collapses, 3D Masonry Debris, Water Ripples, Beams & Particles
    for (let i = collapsingBuildings.length - 1; i >= 0; i--) {
      const cb = collapsingBuildings[i];
      cb.collapseProgress += dt * 0.95;
      cb.hitShake = (1 - cb.collapseProgress) * 9;
      if (Math.random() < 0.55) {
        particles.push({
          x: cb.x + Math.random() * cb.w,
          y: cb.y + Math.random() * cb.h,
          vx: (Math.random() - 0.5) * 70,
          vy: (Math.random() - 0.5) * 70,
          r: 10 + Math.random() * 16,
          color: Math.random() < 0.5 ? '#d6d3d1' : '#a8a29e',
          life: 0.55,
          maxLife: 0.55
        });
      }
      if (cb.collapseProgress >= 1) {
        cb.collapsing = false;
        cb.collapsed = true;
        cb.collapseProgress = 1;
        cb.hitShake = 0;
        collapsingBuildings.splice(i, 1);
      }
    }

    for (let i = debrisChunks.length - 1; i >= 0; i--) {
      const dc = debrisChunks[i];
      dc.x += dc.vx * dt;
      dc.y += dc.vy * dt;
      dc.vz -= 480 * dt;
      dc.z += dc.vz * dt;
      if (dc.z <= 0) {
        dc.z = 0;
        if (Math.abs(dc.vz) > 45) {
          dc.vz = -dc.vz * 0.36;
          dc.vx *= 0.65;
          dc.vy *= 0.65;
          dc.vrot *= 0.6;
        } else {
          dc.vz = 0;
          dc.vx *= 0.80;
          dc.vy *= 0.80;
          dc.vrot *= 0.5;
        }
      }
      dc.rot += dc.vrot * dt;
      dc.life -= dt;
      // Persist settled destruction debris permanently on the ground instead of deleting it!
      if ((dc.z <= 0 && Math.abs(dc.vz) < 6 && Math.hypot(dc.vx, dc.vy) < 9) || dc.life <= 0) {
        persistDebrisChunk(dc);
        debrisChunks.splice(i, 1);
      }
    }

    // World-Space Interactive Rain Splashes (Rooftops, Puddles, Vehicles & Water Rings!)
    if (WEATHER_MODES[weatherMode].id === 'rain') {
      const halfSpanW = (canvas.width * 0.52) / camera.zoom + 90;
      const halfSpanH = (canvas.height * 0.52) / camera.zoom + 90;
      const spawnDrops = Math.min(14, Math.ceil(220 * rawDt));
      for (let r = 0; r < spawnDrops && rainImpacts.length < 135; r++) {
        const rx = camera.x + (Math.random() - 0.5) * halfSpanW * 2;
        const ry = camera.y + (Math.random() - 0.5) * halfSpanH * 2;
        const rgx = Math.floor(rx / TILE_SIZE);
        const rgy = Math.floor(ry / TILE_SIZE);
        if (rgx < 0 || rgx >= GRID_W || rgy < 0 || rgy >= GRID_H) continue;

        let kind = 'ground';
        let drawX = rx;
        let drawY = ry;

        // 1. Check if raindrop strikes an elevated 2.5D building rooftop!
        const bCell = buildingsGrid[rgy][rgx];
        for (let bi = 0; bi < bCell.length; bi++) {
          const b = bCell[bi];
          if (b.collapsing || b.collapsed) continue;
          if (rx >= b.x && rx <= b.x + b.w && ry >= b.y && ry <= b.y + b.h) {
            const hScale = (b.height || 36) * 0.0022;
            const bcx = b.x + b.w * 0.5;
            const bcy = b.y + b.h * 0.5;
            drawX = rx + (bcx - camera.x) * hScale;
            drawY = ry + (bcy - camera.y) * hScale;
            kind = 'roof';
            break;
          }
        }

        // 2. Otherwise check if raindrop hits open water vs wet asphalt/puddle
        if (kind === 'ground' && worldGrid[rgy][rgx] === 4 && !hasBridgeAt(rgx, rgy)) {
          kind = 'water';
        }

        rainImpacts.push({
          x: drawX,
          y: drawY,
          kind,
          r: 1.2,
          maxR: kind === 'water' ? (9 + Math.random() * 9) : (kind === 'roof' ? (4.5 + Math.random() * 4) : (5.5 + Math.random() * 6.5)),
          life: kind === 'water' ? 0.38 : 0.22,
          maxLife: kind === 'water' ? 0.38 : 0.22
        });
      }
    }
    for (let i = rainImpacts.length - 1; i >= 0; i--) {
      const ri = rainImpacts[i];
      ri.life -= rawDt;
      ri.r += (ri.maxR - ri.r) * 9.5 * rawDt;
      if (ri.life <= 0) rainImpacts.splice(i, 1);
    }

    for (let i = waterRipples.length - 1; i >= 0; i--) {
      const wr = waterRipples[i];
      wr.life -= rawDt;
      wr.r += (wr.maxR - wr.r) * 3.8 * rawDt;
      if (wr.life <= 0) waterRipples.splice(i, 1);
    }

    // Decay hitShake on damaged standing buildings near player
    const pGX = Math.max(0, Math.min(GRID_W - 1, Math.floor(player.x / TILE_SIZE)));
    const pGY = Math.max(0, Math.min(GRID_H - 1, Math.floor(player.y / TILE_SIZE)));
    for (let gy = Math.max(0, pGY - 4); gy <= Math.min(GRID_H - 1, pGY + 4); gy++) {
      for (let gx = Math.max(0, pGX - 4); gx <= Math.min(GRID_W - 1, pGX + 4); gx++) {
        for (const bld of buildingsGrid[gy][gx]) {
          if (bld.hitShake > 0 && !bld.collapsing) {
            bld.hitShake = Math.max(0, bld.hitShake - 28 * dt);
          }
          if (bld.collapsed && bld.smokeTimer > 0) {
            bld.smokeTimer -= dt * 0.25;
          }
        }
      }
    }

    for (let i = railBeams.length - 1; i >= 0; i--) {
      railBeams[i].life -= rawDt;
      if (railBeams[i].life <= 0) railBeams.splice(i, 1);
    }
    for (let i = shockwaves.length - 1; i >= 0; i--) {
      const sw = shockwaves[i];
      sw.life -= rawDt;
      sw.r = sw.maxR * (1 - Math.max(0, sw.life / sw.maxLife));
      if (sw.life <= 0) shockwaves.splice(i, 1);
    }
    if (particles.length > 750) {
      particles.splice(0, particles.length - 750);
    }
    for (let i = particles.length - 1; i >= 0; i--) {
      const pt = particles[i];
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.vx *= 0.92;
      pt.vy *= 0.92;
      pt.life -= dt;
      if (pt.life <= 0) particles.splice(i, 1);
    }
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
      const ft = floatingTexts[i];
      ft.y -= 34 * rawDt;
      ft.life -= rawDt;
      if (ft.life <= 0) floatingTexts.splice(i, 1);
    }

    // Escalating VCPD Pursuit Spawner: Interceptors (1★+), Chopper (3★+), SWAT (4★+), Rhino Tank (6★)!
    const wStars = Math.floor(player.wanted);
    if (wStars >= 1 && Math.random() < dt * 0.48 * wStars) {
      const copCars = vehicles.filter(v => v.isPolice && !v.isHeli && v.hp > 0).length;
      if (copCars < wStars + 1) {
        const ang = Math.random() * Math.PI * 2;
        const sx = Math.max(140, Math.min(WORLD_W - 140, player.x + Math.cos(ang) * 760));
        const sy = Math.max(140, Math.min(WORLD_H - 140, player.y + Math.sin(ang) * 760));
        const sgx = Math.floor(sx / TILE_SIZE);
        const sgy = Math.floor(sy / TILE_SIZE);
        if (worldGrid[sgy] && (worldGrid[sgy][sgx] !== 4 || hasBridgeAt(sgx, sgy))) {
          let vType = 'police';
          if (wStars >= 6 && Math.random() < 0.35) vType = 'tank';
          else if (wStars >= 4 && Math.random() < 0.45) vType = 'swat';
          const unit = spawnVehicle(vType, sx, sy, ang + Math.PI, 'police');
          if (unit && vType === 'tank') unit.isPolice = true;
        }
      }

      // Spawn VCPD Maverick Helicopter at 3+ Wanted Stars!
      if (wStars >= 3) {
        const hasHeli = vehicles.some(v => v.isPolice && v.isHeli && v.hp > 0);
        if (!hasHeli) {
          const hAng = Math.random() * Math.PI * 2;
          spawnVehicle('heli', player.x + Math.cos(hAng) * 900, player.y + Math.sin(hAng) * 900, hAng + Math.PI, 'police');
          showBanner('🚁 VCPD MAVERICK CHOPPER INBOUND!', '#38bdf8');
        }
      }
    }

    // Dynamic Altitude & Speed-Adaptive Camera (or Free-Fly Sky-Drone Camera!) + Speedometer HUD Update
    const speed = player.vehicle ? Math.hypot(player.vehicle.vx, player.vehicle.vy) : Math.hypot(player.vx, player.vy);
    const activeAlt = player.vehicle ? (player.vehicle.altitude || 0) : (player.z || 0);
    if (droneState.active) {
      let dmx = 0, dmy = 0;
      if (keys['KeyW'] || keys['ArrowUp'] || keys['KeyZ'] || pressedKeys['w'] || pressedKeys['z'] || pressedKeys['arrowup']) dmy -= 1;
      if (keys['KeyS'] || keys['ArrowDown'] || pressedKeys['s'] || pressedKeys['arrowdown']) dmy += 1;
      if (keys['KeyA'] || keys['ArrowLeft'] || keys['KeyQ'] || pressedKeys['a'] || pressedKeys['q'] || pressedKeys['arrowleft']) dmx -= 1;
      if (keys['KeyD'] || keys['ArrowRight'] || pressedKeys['d'] || pressedKeys['arrowright']) dmx += 1;
      const dLen = Math.hypot(dmx, dmy);
      if (dLen > 0) {
        const boost = (keys['ShiftLeft'] || keys['ShiftRight']) ? 1.85 : 1.0;
        const panSpd = (560 / Math.max(0.26, droneState.zoom)) * boost;
        droneState.x = Math.max(80, Math.min(WORLD_W - 80, droneState.x + (dmx / dLen) * panSpd * rawDt));
        droneState.y = Math.max(80, Math.min(WORLD_H - 80, droneState.y + (dmy / dLen) * panSpd * rawDt));
      }
      camera.zoom += (droneState.zoom - camera.zoom) * 8.0 * rawDt;
      camera.x += (droneState.x - camera.x) * 10.5 * rawDt;
      camera.y += (droneState.y - camera.y) * 10.5 * rawDt;
    } else {
      let targetZoom = 1.04;
      if (player.vehicle) {
        if (player.vehicle.isAirliner) {
          targetZoom = activeAlt > 25
            ? Math.max(0.34, 0.64 - activeAlt * 0.0010)
            : Math.max(0.52, 0.68 - (speed / 540) * 0.14);
        } else if (player.vehicle.isJet && activeAlt > 45) {
          targetZoom = Math.max(0.42, 0.80 - activeAlt * 0.0015);
        } else if (player.vehicle.isJet) {
          targetZoom = Math.max(0.62, 0.84 - (speed / 685) * 0.18);
        } else if (player.vehicle.isHeli && activeAlt > 25) {
          targetZoom = Math.max(0.62, 0.90 - activeAlt * 0.0018);
        } else {
          targetZoom = Math.max(0.68, 0.98 - (speed / 580) * 0.28);
        }
      } else if (player.z > 10) {
        targetZoom = Math.max(0.70, 0.98 - player.z * 0.0012);
      }
      if (stuntState.slowMoTimer > 0) targetZoom *= 0.85;
      camera.zoom += (targetZoom - camera.zoom) * 4.2 * rawDt;

      const leadX = activeEntity.x + (player.vehicle ? player.vehicle.vx * 0.22 : (mouse.worldX - player.x) * 0.12);
      const leadY = activeEntity.y + (player.vehicle ? player.vehicle.vy * 0.22 : (mouse.worldY - player.y) * 0.12);
      camera.x += (leadX - camera.x) * 7.5 * rawDt;
      camera.y += (leadY - camera.y) * 7.5 * rawDt;
    }

    if (camera.shake > 0) {
      camera.shake = Math.max(0, camera.shake - 36 * rawDt);
    }

    // Update Bottom-Center Digital Speedometer
    const speedoHud = document.getElementById('speedo-hud');
    if (player.vehicle) {
      speedoHud.classList.remove('hidden');
      const mph = Math.round(speed * 0.30);
      document.getElementById('speedo-val').textContent = String(mph).padStart(3, '0');
      document.getElementById('speedo-unit').textContent = (player.vehicle.isJet || player.vehicle.isHeli) ? 'KTS' : 'MPH';
      document.getElementById('nitro-bar').style.width = `${Math.round(player.nitro)}%`;
      document.getElementById('veh-hp-bar').style.width = `${Math.max(0, Math.round((player.vehicle.hp / player.vehicle.maxHp) * 100))}%`;
    } else {
      speedoHud.classList.add('hidden');
    }
  }

  // ==========================================
  // 10A. MESMERIZING WORLD SYSTEMS: HYDRO-CANNON, GAS DOMINOES, BLACKOUTS, MAG-TOW, SWAT ROPES, SHARKS/GATORS & NEWS TV
  // ==========================================
  function fireWaterCannon(v, aimAng) {
    if (!v || waterJets.length > 165) return;
    const nozX = v.x + Math.cos(aimAng) * 20;
    const nozY = v.y + Math.sin(aimAng) * 20;
    for (let s = 0; s < 2; s++) {
      const jitter = (Math.random() - 0.5) * 0.085;
      const spd = 575 + Math.random() * 80;
      waterJets.push({
        x: nozX + Math.cos(aimAng) * (s * 9),
        y: nozY + Math.sin(aimAng) * (s * 9),
        vx: (v.vx || 0) * 0.35 + Math.cos(aimAng + jitter) * spd,
        vy: (v.vy || 0) * 0.35 + Math.sin(aimAng + jitter) * spd,
        r: 6.2 + Math.random() * 2.6,
        life: 0.56,
        maxLife: 0.56,
        sourceVeh: v
      });
    }
    if (Math.random() < 0.65) {
      particles.push({
        x: nozX,
        y: nozY,
        vx: Math.cos(aimAng + (Math.random() - 0.5) * 0.45) * 190,
        vy: Math.sin(aimAng + (Math.random() - 0.5) * 0.45) * 190,
        r: 4 + Math.random() * 4,
        color: 'rgba(224, 242, 254, 0.76)',
        life: 0.22,
        maxLife: 0.22
      });
    }
  }

  function findNearestActiveFire(ox, oy, maxDist = 1350) {
    let best = null;
    let bestD = maxDist;
    for (let i = 0; i < palmTrees.length; i++) {
      const tr = palmTrees[i];
      if (tr.burnTimer && tr.burnTimer > 0) {
        const d = Math.hypot(tr.x - ox, tr.y - oy);
        if (d < bestD) { bestD = d; best = { x: tr.x, y: tr.y, kind: 'tree' }; }
      }
    }
    for (let i = 0; i < vehicles.length; i++) {
      const v = vehicles[i];
      if (v.wreckBurnTimer && v.wreckBurnTimer > 1.2) {
        const d = Math.hypot(v.x - ox, v.y - oy);
        if (d < bestD) { bestD = d; best = { x: v.x, y: v.y, kind: 'wreck' }; }
      }
    }
    for (let i = 0; i < gasStations.length; i++) {
      const gs = gasStations[i];
      for (let p = 0; p < gs.pumps.length; p++) {
        const pump = gs.pumps[p];
        if (pump.leaking && !pump.exploded) {
          const d = Math.hypot(pump.x - ox, pump.y - oy);
          if (d < bestD) { bestD = d; best = { x: pump.x, y: pump.y, kind: 'pump' }; }
        }
      }
    }
    return best;
  }

  function emitSteamCloud(x, y, count = 4) {
    for (let i = 0; i < count; i++) {
      particles.push({
        x: x + (Math.random() - 0.5) * 14,
        y: y + (Math.random() - 0.5) * 14,
        vx: (Math.random() - 0.5) * 42,
        vy: -24 - Math.random() * 38,
        r: 7 + Math.random() * 9,
        color: 'rgba(241, 245, 249, 0.78)',
        life: 0.48,
        maxLife: 0.48
      });
    }
  }

  function updateMesmerizingSystems(dt, rawDt) {
    // 1. RON-99 Gas Stations: Vehicle Ramming, Sparking Fuel Leaks & Domino Chain-Reaction Detonations!
    for (let gi = 0; gi < gasStations.length; gi++) {
      const gs = gasStations[gi];
      for (let pi = 0; pi < gs.pumps.length; pi++) {
        const pump = gs.pumps[pi];
        if (pump.exploded) {
          if (Math.random() < dt * 2.2) {
            particles.push({
              x: pump.x + (Math.random() - 0.5) * 18,
              y: pump.y + (Math.random() - 0.5) * 18,
              vx: (Math.random() - 0.5) * 18,
              vy: -22 - Math.random() * 24,
              r: 6 + Math.random() * 7,
              color: 'rgba(39, 39, 42, 0.62)',
              life: 0.65,
              maxLife: 0.65
            });
          }
          continue;
        }
        // Check vehicle ramming into fuel island
        for (let vi = 0; vi < vehicles.length; vi++) {
          const v = vehicles[vi];
          if (v.isAirborne || (v.altitude || 0) > 16) continue;
          const vSpd = Math.hypot(v.vx, v.vy);
          if (vSpd > 88 && Math.abs(v.x - pump.x) < 38 && Math.abs(v.y - pump.y) < 38) {
            if (Math.hypot(v.x - pump.x, v.y - pump.y) < 34) {
              pump.hp -= vSpd * 0.55;
              v.vx *= 0.68;
              v.vy *= 0.68;
              if (pump.hp <= 0) ruptureGasPump(gs, pump, vSpd > 210 ? 0.38 : 1.05);
            }
          }
        }
        if (pump.leaking) {
          if (Math.random() < 0.72) {
            const a = Math.random() * Math.PI * 2;
            particles.push({
              x: pump.x + Math.cos(a) * 6,
              y: pump.y + Math.sin(a) * 6,
              vx: Math.cos(a) * (40 + Math.random() * 65),
              vy: Math.sin(a) * (40 + Math.random() * 65) - 18,
              r: 4 + Math.random() * 5,
              color: Math.random() < 0.55 ? '#fb923c' : '#fde047',
              life: 0.28,
              maxLife: 0.28
            });
          }
          pump.fuseTimer -= dt;
          if (pump.fuseTimer <= 0) {
            detonateGasPump(gs, pump);
          }
        }
      }
    }

    // 2. High-Voltage Grid Substations: Tank/Vehicle Ramming, HV Arc Sparks & Rolling District Blackout Timers!
    for (let ni = 0; ni < powerNodes.length; ni++) {
      const pn = powerNodes[ni];
      if (!pn.destroyed) {
        for (let vi = 0; vi < vehicles.length; vi++) {
          const v = vehicles[vi];
          if (v.isAirborne || (v.altitude || 0) > 16) continue;
          const vSpd = Math.hypot(v.vx, v.vy);
          if ((v.isTank && vSpd > 30) || vSpd > 135) {
            if (Math.abs(v.x - pn.x) < 42 && Math.abs(v.y - pn.y) < 42 && Math.hypot(v.x - pn.x, v.y - pn.y) < 38) {
              damagePowerSubstation(pn, v.isTank ? 220 : vSpd * 0.42, v.driver === 'player');
              if (!v.isTank) { v.vx *= 0.55; v.vy *= 0.55; }
              break;
            }
          }
        }
      } else {
        if (pn.flickerTimer > 0) pn.flickerTimer = Math.max(0, pn.flickerTimer - rawDt);
        if (pn.blackoutTimer > 0) {
          pn.blackoutTimer = Math.max(0, pn.blackoutTimer - rawDt);
          if (Math.random() < dt * 3.8) {
            spawnSparks(pn.x + (Math.random() - 0.5) * 20, pn.y + (Math.random() - 0.5) * 20, 4, '#38bdf8');
          }
          if (pn.blackoutTimer <= 0) {
            pn.destroyed = false;
            pn.hp = pn.maxHp;
            showBanner(`💡 ${pn.name} REPAIRED — DISTRICT POWER RESTORED`, '#fde047');
          }
        }
      }
    }

    // 3. Pressurized Firetruck Hydro-Cannon Streams: Extinguish Fires + Billowing Steam + Knockback Cars & Peds!
    for (let i = waterJets.length - 1; i >= 0; i--) {
      const wj = waterJets[i];
      wj.x += wj.vx * dt;
      wj.y += wj.vy * dt;
      wj.vx *= Math.max(0, 1 - 1.15 * dt);
      wj.vy *= Math.max(0, 1 - 1.15 * dt);
      wj.life -= dt;
      if (wj.life <= 0) {
        waterJets.splice(i, 1);
        continue;
      }

      const spd = Math.hypot(wj.vx, wj.vy) || 1;
      const nx = wj.vx / spd;
      const ny = wj.vy / spd;
      let splashed = false;

      // 3a. Douse burning palm trees!
      for (let ti = 0; ti < palmTrees.length; ti++) {
        const tr = palmTrees[ti];
        if (tr.burnTimer && tr.burnTimer > 0 && Math.abs(wj.x - tr.x) < 36 && Math.abs(wj.y - tr.y) < 36) {
          if (Math.hypot(wj.x - tr.x, wj.y - tr.y) < 34) {
            tr.burnTimer = Math.max(0, tr.burnTimer - 1.8);
            emitSteamCloud(tr.x, tr.y - 8, 3);
            if (tr.burnTimer <= 0) {
              tr.burnTimer = 0;
              addFloatingText(tr.x, tr.y - 24, '💨 FIRE DOUSED!', '#38bdf8');
              if (wj.sourceVeh && wj.sourceVeh === player.vehicle) addCash(125, tr.x, tr.y);
            }
            splashed = true;
            break;
          }
        }
      }

      // 3b. Douse burning buildings & cool leaking gas pumps!
      const wgx = Math.floor(wj.x / TILE_SIZE);
      const wgy = Math.floor(wj.y / TILE_SIZE);
      if (!splashed && wgx >= 0 && wgx < GRID_W && wgy >= 0 && wgy < GRID_H) {
        const cellBlds = buildingsGrid[wgy][wgx];
        for (let bi = 0; bi < cellBlds.length; bi++) {
          const bld = cellBlds[bi];
          if (bld.collapsing || bld.collapsed) continue;
          if (wj.x >= bld.x && wj.x <= bld.x + bld.w && wj.y >= bld.y && wj.y <= bld.y + bld.h) {
            if (bld.burnTimer && bld.burnTimer > 0) {
              bld.burnTimer = Math.max(0, bld.burnTimer - 1.6);
              emitSteamCloud(wj.x, wj.y, 3);
              if (bld.burnTimer <= 0 && wj.sourceVeh === player.vehicle) {
                addCash(200, wj.x, wj.y);
                addFloatingText(wj.x, wj.y - 20, '💨 BUILDING SAVED! +$200', '#38bdf8');
              }
            }
            splashed = true;
            break;
          }
        }
      }

      if (!splashed) {
        for (let gi = 0; gi < gasStations.length; gi++) {
          const gs = gasStations[gi];
          for (let pi = 0; pi < gs.pumps.length; pi++) {
            const pump = gs.pumps[pi];
            if (pump.leaking && !pump.exploded && Math.hypot(wj.x - pump.x, wj.y - pump.y) < 32) {
              pump.leaking = false;
              pump.hp = Math.max(30, pump.hp);
              emitSteamCloud(pump.x, pump.y, 4);
              addFloatingText(pump.x, pump.y - 20, '💨 FUEL LEAK COOLED!', '#38bdf8');
              splashed = true;
              break;
            }
          }
        }
      }

      // 3c. Cool blazing vehicle wrecks & physically hydro-push cars across intersections!
      if (!splashed) {
        for (let vi = 0; vi < vehicles.length; vi++) {
          const v = vehicles[vi];
          if (v === wj.sourceVeh || v.isAirborne || (v.altitude || 0) > 20) continue;
          if (Math.abs(wj.x - v.x) < 42 && Math.abs(wj.y - v.y) < 42 && Math.hypot(wj.x - v.x, wj.y - v.y) < 36) {
            if (v.wreckBurnTimer && v.wreckBurnTimer > 0) {
              v.wreckBurnTimer = Math.max(0, v.wreckBurnTimer - 1.9);
              emitSteamCloud(v.x, v.y, 3);
              if (v.wreckBurnTimer <= 0 && wj.sourceVeh === player.vehicle) {
                addCash(150, v.x, v.y);
                addFloatingText(v.x, v.y - 22, '💨 WRECK EXTINGUISHED!', '#38bdf8');
              }
            }
              if (!v.isTank && !v.isAirliner) {
                const push = 46 / Math.max(0.8, v.mass || 1);
                v.vx += nx * push;
                v.vy += ny * push;
              }
              wj.life -= 0.18;
              if (wj.life <= 0) splashed = true;
              break;
            }
          }
        }

      // 3d. Non-lethal Riot Hydro-Blast on Pedestrians (+ extinguishes burning peds!)
      if (!splashed) {
        for (let pi = 0; pi < peds.length; pi++) {
          const p = peds[pi];
          if (Math.abs(wj.x - p.x) < 26 && Math.abs(wj.y - p.y) < 26 && Math.hypot(wj.x - p.x, wj.y - p.y) < 22) {
            p.burnTimer = 0;
            p.vx += nx * 175;
            p.vy += ny * 175;
            p.panicTimer = Math.max(p.panicTimer || 0, 3.2);
            wj.life -= 0.12;
            if (wj.life <= 0) splashed = true;
            break;
          }
        }
      }

      if (splashed) {
        waterJets.splice(i, 1);
      }
    }

    // 4. Autonomous Leonida Fire Department Engine 07 Dispatch when City Fires Burn!
    if (fireDispatchCooldown > 0) fireDispatchCooldown = Math.max(0, fireDispatchCooldown - rawDt);
    if (fireDispatchCooldown <= 0) {
      const activeBlaze = findNearestActiveFire(player.x, player.y, 1100);
      if (activeBlaze) {
        const activeFD = vehicles.some(v => v.isFiretruck && v.driver === 'firefighter' && v.hp > 0);
        if (!activeFD) {
          for (let tries = 0; tries < 10; tries++) {
            const ang = Math.random() * Math.PI * 2;
            const dist = 540 + Math.random() * 240;
            const fx = Math.max(180, Math.min(WORLD_W - 180, activeBlaze.x + Math.cos(ang) * dist));
            const fy = Math.max(180, Math.min(WORLD_H - 180, activeBlaze.y + Math.sin(ang) * dist));
            const fgx = Math.floor(fx / TILE_SIZE);
            const fgy = Math.floor(fy / TILE_SIZE);
            if (worldGrid[fgy] && worldGrid[fgy][fgx] === 0) {
              const fd = spawnVehicle('firetruck', fgx * TILE_SIZE + 80, fgy * TILE_SIZE + 80, ang + Math.PI, 'firefighter');
              if (fd) {
                fd.sirenOn = true;
                fireDispatchCooldown = 32.0;
                showBanner('🚒 LEONIDA FD ENGINE 07 DISPATCHED TO BLAZE!', '#ef4444');
              }
              break;
            }
          }
        }
      }
    }

    // 5. Magnetic Tow-Cable / Sky Wrecking-Ball Physics & Air-Dropped Vehicle Gravity Slam!
    for (let vi = 0; vi < vehicles.length; vi++) {
      const v = vehicles[vi];
      if (v.towTarget) {
        const t = v.towTarget;
        if (v.hp <= 0 || (!v.driver && v !== player.vehicle) || !vehicles.includes(t)) {
          if (t) t.towedBy = null;
          v.towTarget = null;
        } else {
          const cableLen = v.isHeli ? 84 : 92;
          const anchorX = v.x - Math.cos(v.angle) * (v.isHeli ? 6 : v.w * 0.44);
          const anchorY = v.y - Math.sin(v.angle) * (v.isHeli ? 6 : v.w * 0.44);
          const dx = t.x - anchorX;
          const dy = t.y - anchorY;
          const dist = Math.hypot(dx, dy) || 1;
          const nx = dx / dist;
          const ny = dy / dist;

          if (dist > cableLen) {
            const stretch = dist - cableLen;
            t.vx -= nx * stretch * 17.5 * dt;
            t.vy -= ny * stretch * 17.5 * dt;
            // Transfer carrier momentum for dramatic pendulum whip!
            t.vx += (v.vx - t.vx) * 2.1 * dt;
            t.vy += (v.vy - t.vy) * 2.1 * dt;
            if (dist > cableLen * 1.55) {
              t.x = anchorX + nx * cableLen * 1.55;
              t.y = anchorY + ny * cableLen * 1.55;
            }
          }
          t.vx *= Math.max(0, 1 - 1.05 * dt);
          t.vy *= Math.max(0, 1 - 1.05 * dt);

          const tSpd = Math.hypot(t.vx, t.vy);
          if (tSpd > 25) {
            const moveAng = Math.atan2(t.vy, t.vx);
            let ad = moveAng - t.angle;
            while (ad > Math.PI) ad -= Math.PI * 2;
            while (ad < -Math.PI) ad += Math.PI * 2;
            t.angle += ad * 4.5 * dt;
          }

          if (v.isHeli) {
            const targetAlt = Math.max(0, (v.altitude || 0) - 24);
            t.altitude = (t.altitude || 0) + (targetAlt - (t.altitude || 0)) * 6.0 * dt;
            t.isAirborne = t.altitude > 14;
          } else {
            t.altitude = 0;
            t.isAirborne = false;
          }

          if (t.towHitCooldown && t.towHitCooldown > 0) {
            t.towHitCooldown = Math.max(0, t.towHitCooldown - dt);
          }

          // Wrecking-Ball Collisions against Glazed Skyscrapers, Palm Trees & Traffic!
          if (tSpd > 78 && (!t.towHitCooldown || t.towHitCooldown <= 0)) {
            const tgx = Math.floor(t.x / TILE_SIZE);
            const tgy = Math.floor(t.y / TILE_SIZE);
            for (let cy = Math.max(0, tgy - 1); cy <= Math.min(GRID_H - 1, tgy + 1); cy++) {
              for (let cx = Math.max(0, tgx - 1); cx <= Math.min(GRID_W - 1, tgx + 1); cx++) {
                const cellBlds = buildingsGrid[cy][cx];
                for (let bi = 0; bi < cellBlds.length; bi++) {
                  const bld = cellBlds[bi];
                  if (bld.collapsing || bld.collapsed) continue;
                  if ((t.altitude || 0) > (bld.height || 42) + 16) continue;
                  const nearX = Math.max(bld.x, Math.min(t.x, bld.x + bld.w));
                  const nearY = Math.max(bld.y, Math.min(t.y, bld.y + bld.h));
                  if (Math.hypot(t.x - nearX, t.y - nearY) < Math.max(t.w || 54, t.h || 28) * 0.42) {
                    shatterBuildingGlass(bld, nearX, nearY, 10);
                    damageBuilding(bld, Math.max(48, tSpd * 0.42), nearX, nearY, v === player.vehicle);
                    spawnSparks(nearX, nearY, 12, '#38bdf8');
                    camera.shake = Math.min(24, camera.shake + 9);
                    t.vx = -t.vx * 0.58 + (t.x - nearX) * 3.2;
                    t.vy = -t.vy * 0.58 + (t.y - nearY) * 3.2;
                    t.towHitCooldown = 0.20;
                    break;
                  }
                }
                const cellTrees = treesGrid[cy] && treesGrid[cy][cx];
                if (cellTrees && (t.altitude || 0) < 42) {
                  for (let ti = 0; ti < cellTrees.length; ti++) {
                    const tr = cellTrees[ti];
                    if (!tr.fallen && !tr.falling && Math.hypot(t.x - tr.x, t.y - tr.y) < 26) {
                      knockDownTree(tr, Math.atan2(t.vy, t.vx));
                    }
                  }
                }
              }
            }
            for (let oi = 0; oi < vehicles.length; oi++) {
              const other = vehicles[oi];
              if (other === v || other === t) continue;
              if (Math.abs((t.altitude || 0) - (other.altitude || 0)) > 28) continue;
              if (Math.hypot(other.x - t.x, other.y - t.y) < 46) {
                other.vx += t.vx * 0.88;
                other.vy += t.vy * 0.88;
                other.hp -= tSpd * 0.24;
                spawnSparks((other.x + t.x) * 0.5, (other.y + t.y) * 0.5, 8);
                t.towHitCooldown = 0.16;
                break;
              }
            }
          }
        }
      }

      // Air-Dropped Vehicle Freefall & Ground Smash!
      if (!v.towedBy && v.airDropTimer && v.airDropTimer > 0) {
        v.airDropVz = (v.airDropVz || 0) + 320 * dt;
        v.altitude = Math.max(0, (v.altitude || 0) - v.airDropVz * dt);
        v.isAirborne = v.altitude > 14;
        if (v.altitude <= 0) {
          v.airDropTimer = 0;
          v.airDropVz = 0;
          v.isAirborne = false;
          shockwaves.push({ x: v.x, y: v.y, r: 10, maxR: 110, color: '#ffe600', life: 0.36, maxLife: 0.36 });
          camera.shake = Math.min(28, camera.shake + 15);
          if (v.wrecked || v.hp <= 150) {
            v.hp = 0;
            createExplosion(v.x, v.y, 150, 260, true);
          } else {
            v.hp -= 145;
            spawnSparks(v.x, v.y, 16, '#ffe600');
          }
        }
      }
    }

    // 6. 4★+ VCPD Helicopter Tactical SWAT Fast-Rope Insertions!
    for (let i = swatRopes.length - 1; i >= 0; i--) {
      const sr = swatRopes[i];
      if (sr.heli && sr.heli.hp > 0) {
        sr.x += (sr.heli.x + sr.offsetX - sr.x) * 5.0 * dt;
        sr.y += (sr.heli.y + sr.offsetY - sr.y) * 5.0 * dt;
        sr.alt = sr.heli.altitude || 140;
      }
      sr.progress += dt * 0.72;
      if (sr.progress >= 1.0) {
        const sgx = Math.max(0, Math.min(GRID_W - 1, Math.floor(sr.x / TILE_SIZE)));
        const sgy = Math.max(0, Math.min(GRID_H - 1, Math.floor(sr.y / TILE_SIZE)));
        if (worldGrid[sgy] && (worldGrid[sgy][sgx] !== 4 || hasBridgeAt(sgx, sgy))) {
          const trooper = spawnPed(sr.x, sr.y, 'police');
          if (trooper) trooper.hp = 145;
          shockwaves.push({ x: sr.x, y: sr.y, r: 4, maxR: 26, color: '#38bdf8', life: 0.22, maxLife: 0.22 });
        }
        swatRopes.splice(i, 1);
      }
    }

    // 7. Living Water Predators: Everglades Alligators & Atlantic Great White Sharks!
    for (let i = 0; i < waterPredators.length; i++) {
      const wp = waterPredators[i];
      wp.phase += dt * (wp.kind === 'shark' ? 4.4 : 3.1);
      if (wp.biteCooldown > 0) wp.biteCooldown = Math.max(0, wp.biteCooldown - dt);

      let prey = null;
      let preyDist = 250;
      if (!player.vehicle && player.inWater && player.z <= 4) {
        const d = Math.hypot(player.x - wp.x, player.y - wp.y);
        if (d < preyDist) { prey = player; preyDist = d; }
      }
      for (let pi = 0; pi < peds.length; pi++) {
        const p = peds[pi];
        if (p.inWater) {
          const d = Math.hypot(p.x - wp.x, p.y - wp.y);
          if (d < preyDist) { prey = p; preyDist = d; }
        }
      }

      let curSpd = wp.speed;
      if (prey) {
        const targetAng = Math.atan2(prey.y - wp.y, prey.x - wp.x);
        let ad = targetAng - wp.angle;
        while (ad > Math.PI) ad -= Math.PI * 2;
        while (ad < -Math.PI) ad += Math.PI * 2;
        wp.angle += ad * 3.8 * dt;
        curSpd = wp.speed * 1.48;

        if (preyDist < 28 && wp.biteCooldown <= 0) {
          wp.biteCooldown = 2.1;
          spawnWaterPlume(wp.x, wp.y, 0.55);
          spawnSparks(wp.x, wp.y, 8, '#dc2626');
          if (prey === player) {
            damagePlayer(wp.kind === 'shark' ? 24 : 18);
            showBanner(wp.kind === 'shark' ? '🦈 GREAT WHITE SHARK ATTACK!' : '🐊 EVERGLADES ALLIGATOR LUNGE!', '#ff1744');
          } else {
            prey.hp -= 75;
          }
        }
      } else {
        wp.angle += Math.sin(wp.phase * 0.45 + i) * 0.55 * dt;
      }

      const nx = wp.x + Math.cos(wp.angle) * curSpd * dt;
      const ny = wp.y + Math.sin(wp.angle) * curSpd * dt;
      const gx = Math.floor(nx / TILE_SIZE);
      const gy = Math.floor(ny / TILE_SIZE);
      if (gx >= 1 && gx < GRID_W - 1 && gy >= 1 && gy < GRID_H - 1 && worldGrid[gy][gx] === 4) {
        wp.x = nx;
        wp.y = ny;
        if (Math.random() < dt * 2.4 && waterRipples.length < 140) {
          waterRipples.push({
            x: wp.x - Math.cos(wp.angle) * 14,
            y: wp.y - Math.sin(wp.angle) * 14,
            r: 5,
            maxR: wp.kind === 'shark' ? 28 : 22,
            life: 0.48,
            maxLife: 0.48,
            color: 'rgba(186, 230, 253, 0.34)'
          });
        }
      } else {
        wp.angle += Math.PI * 0.76 + (Math.random() - 0.5) * 0.45;
      }
    }

    // 8. Water-Crash Tsunami Surge Rings: Outward Hydrodynamic Push on Speedboats, Floating Cars & Swimmers!
    for (let i = tsunamiWaves.length - 1; i >= 0; i--) {
      const tw = tsunamiWaves[i];
      tw.r += tw.speed * dt;
      tw.life -= rawDt;
      if (tw.life <= 0 || tw.r >= tw.maxR) {
        tsunamiWaves.splice(i, 1);
        continue;
      }
      for (let vi = 0; vi < vehicles.length; vi++) {
        const v = vehicles[vi];
        if (v.isAirborne || !onWaterLayer(v)) continue;
        const d = Math.hypot(v.x - tw.x, v.y - tw.y);
        if (Math.abs(d - tw.r) < 38 && d > 1) {
          const ang = Math.atan2(v.y - tw.y, v.x - tw.x);
          const surge = (tw.force * dt * 2.8) / Math.max(0.8, v.mass || 1);
          v.vx += Math.cos(ang) * surge;
          v.vy += Math.sin(ang) * surge;
          v.angularVel = (v.angularVel || 0) + (Math.random() - 0.5) * 1.4 * dt;
        }
      }
      if (!player.vehicle && player.inWater) {
        const pd = Math.hypot(player.x - tw.x, player.y - tw.y);
        if (Math.abs(pd - tw.r) < 36 && pd > 1) {
          const pang = Math.atan2(player.y - tw.y, player.x - tw.x);
          player.x += Math.cos(pang) * 190 * dt;
          player.y += Math.sin(pang) * 190 * dt;
        }
      }
    }

    // 9. Live WLTV Action News 6 PiP Chopper Broadcast Visibility & Contextual Chyron
    if (newsState.disasterTimer > 0) newsState.disasterTimer = Math.max(0, newsState.disasterTimer - rawDt);
    if (newsState.headlineTimer > 0) newsState.headlineTimer = Math.max(0, newsState.headlineTimer - rawDt);
    const wStars = Math.floor(player.wanted);
    const shouldShowNews = newsState.manualOverride === true ||
      (newsState.manualOverride === null && (wStars >= 3 || newsState.disasterTimer > 0));
    const newsPipEl = document.getElementById('news-pip');
    if (newsPipEl) {
      newsPipEl.classList.toggle('hidden', !shouldShowNews);
    }
    if (shouldShowNews && newsState.headlineTimer <= 0) {
      const distLabel = getDistrictName(player.x, player.y);
      let msg = `LIVE // WLTV SKY-CAM 6 TRACKING SUSPECT IN ${distLabel}`;
      if (player.vehicle && player.vehicle.towTarget) {
        msg = `BREAKING: ROGUE ${player.vehicle.name} SWINGING ${player.vehicle.towTarget.name} AS WRECKING BALL IN ${distLabel}!`;
      } else if (player.vehicle && player.vehicle.isAirliner) {
        msg = `FAA EMERGENCY: HIJACKED TITAN 747-8 JUMBO LOW OVER ${distLabel}!`;
      } else if (player.vehicle && player.vehicle.isTank) {
        msg = `MARTIAL ALERT: ARMORED M1A3 TANK RAMPAGING THROUGH ${distLabel}!`;
      } else if (player.vehicle && player.vehicle.isFiretruck) {
        msg = `SPECIAL REPORT: COMMANDEERED FD ENGINE 07 BLASTING HYDRO-CANNON IN ${distLabel}!`;
      } else if (wStars >= 5) {
        msg = `FEDERAL MANHUNT (${wStars}★): SWAT & AIR SUPPORT CONVERGING ON ${distLabel}!`;
      } else if (wStars >= 3) {
        msg = `HIGH-SPEED PURSUIT (${wStars}★): VCPD INTERCEPTORS CHASING SUSPECT ACROSS ${distLabel}!`;
      }
      setBreakingNews(msg, 0);
      newsState.headlineTimer = 5.5;
    }
  }

  // ==========================================
  // 10B. TIERED WEAPONS, RAILGUN, EMP, TANK CANNON & AIRCRAFT ORDNANCE
  // ==========================================
  function getAircraftStrikeTarget(v) {
    const defaultRange = v.isAirliner ? 490 : (v.isJet ? 410 : 320);
    if (!mouse.hasAimed) {
      return {
        tx: v.x + Math.cos(v.angle) * defaultRange,
        ty: v.y + Math.sin(v.angle) * defaultRange,
        launchAng: v.angle
      };
    }
    const rawDist = Math.hypot(mouse.worldX - v.x, mouse.worldY - v.y);
    const aimAng = Math.atan2(mouse.worldY - v.y, mouse.worldX - v.x);
    if (v.isJet) {
      const diff = Math.atan2(Math.sin(aimAng - v.angle), Math.cos(aimAng - v.angle));
      const inForwardCone = Math.abs(diff) < 1.05 && rawDist > 70;
      const launchAng = inForwardCone ? aimAng : v.angle;
      const strikeDist = inForwardCone ? Math.max(210, Math.min(860, rawDist)) : defaultRange;
      return {
        tx: v.x + Math.cos(launchAng) * strikeDist,
        ty: v.y + Math.sin(launchAng) * strikeDist,
        launchAng
      };
    }
    const heliAng = rawDist > 48 ? aimAng : v.angle;
    const heliDist = rawDist > 48 ? Math.max(125, Math.min(660, rawDist)) : defaultRange;
    return {
      tx: v.x + Math.cos(heliAng) * heliDist,
      ty: v.y + Math.sin(heliAng) * heliDist,
      launchAng: heliAng
    };
  }

  function firePlayerWeapon() {
    // 1. Hydra VTOL Jet / 747-8 Airliner Air-to-Ground Demolition Missiles (Destroys Houses & Buildings!)
    if (player.vehicle && player.vehicle.isJet) {
      const v = player.vehicle;
      player.fireTimer = 0.30;
      sfx.playShoot('rocket');
      const cos = Math.cos(v.angle);
      const sin = Math.sin(v.angle);
      const pylonSpan = v.isAirliner ? 98 : 52;
      const pylonFwd = v.isAirliner ? 42 : 48;
      const sideX = -sin * pylonSpan;
      const sideY = cos * pylonSpan;
      const { tx, ty } = getAircraftStrikeTarget(v);

      for (const sign of [-1, 1]) {
        const sx = v.x + cos * pylonFwd + sideX * sign;
        const sy = v.y + sin * pylonFwd + sideY * sign;
        const mAng = Math.atan2(ty - sy, tx - sx);
        const mSpd = 900;
        spawnSparks(sx, sy, 6, '#38bdf8');
        bullets.push({
          x: sx,
          y: sy,
          vx: Math.cos(mAng) * mSpd,
          vy: Math.sin(mAng) * mSpd,
          alt: v.altitude || 180,
          airToGround: true,
          targetX: tx + sideX * sign * 0.42,
          targetY: ty + sideY * sign * 0.42,
          startDist: Math.max(80, Math.hypot(tx - sx, ty - sy)),
          damage: 480,
          structDmg: 560,
          demolish: true,
          life: 1.45,
          color: '#38bdf8',
          explosive: true,
          fromPlayer: true
        });
      }
      return;
    }

    // 1B. Falcon Gunship / VCPD Maverick Helicopter Hydra-70 Demolition Rockets!
    if (player.vehicle && player.vehicle.isHeli) {
      const v = player.vehicle;
      player.fireTimer = 0.26;
      sfx.playShoot('rocket');
      const { tx, ty, launchAng } = getAircraftStrikeTarget(v);
      const sideX = -Math.sin(v.angle) * 20;
      const sideY = Math.cos(v.angle) * 20;
      const podSign = (Math.floor(performance.now() / 140) % 2 === 0) ? 1 : -1;
      const sx = v.x + Math.cos(v.angle) * 18 + sideX * podSign;
      const sy = v.y + Math.sin(v.angle) * 18 + sideY * podSign;
      const rAng = Math.atan2(ty - sy, tx - sx) || launchAng;
      const rSpd = 810;
      spawnSparks(sx, sy, 6, '#fb923c');
      bullets.push({
        x: sx,
        y: sy,
        vx: Math.cos(rAng) * rSpd,
        vy: Math.sin(rAng) * rSpd,
        alt: v.altitude || 120,
        airToGround: true,
        targetX: tx,
        targetY: ty,
        startDist: Math.max(60, Math.hypot(tx - sx, ty - sy)),
        damage: 350,
        structDmg: 430,
        demolish: true,
        life: 1.3,
        color: '#fb923c',
        explosive: true,
        fromPlayer: true
      });
      return;
    }

    // 2. Rhino M1A3 Battle Tank 120mm High-Explosive Demolition Cannon!
    if (player.vehicle && player.vehicle.isTank) {
      const v = player.vehicle;
      player.fireTimer = 0.68;
      sfx.playExplosion(true);
      const tAng = v.turretAngle || v.angle;
      const muzX = v.x + Math.cos(tAng) * 48;
      const muzY = v.y + Math.sin(tAng) * 48;
      // Recoil impulse on hull
      v.vx -= Math.cos(tAng) * 65;
      v.vy -= Math.sin(tAng) * 65;
      camera.shake = Math.min(24, camera.shake + 12);
      spawnSparks(muzX, muzY, 14, '#fef08a');
      bullets.push({
        x: muzX, y: muzY,
        vx: Math.cos(tAng) * 960,
        vy: Math.sin(tAng) * 960,
        damage: 520, structDmg: 620, demolish: true,
        life: 1.25, color: '#ffe600', explosive: true, tankShell: true, fromPlayer: true
      });
      return;
    }

    // 2B. Leonida Fire Department Engine 07 — Pressurized Roof Deluge Hydro-Cannon!
    if (player.vehicle && player.vehicle.isFiretruck) {
      const v = player.vehicle;
      player.fireTimer = 0.048;
      const tAng = mouse.hasAimed
        ? Math.atan2(mouse.worldY - v.y, mouse.worldX - v.x)
        : (v.turretAngle !== undefined ? v.turretAngle : v.angle);
      v.turretAngle = tAng;
      fireWaterCannon(v, tAng);
      return;
    }

    let w = WEAPONS[player.weaponIdx];
    if (player.vehicle && !['pistol', 'smg', 'emp'].includes(w.id)) {
      w = (player.ammo.smg || 0) > 0 ? WEAPONS[1] : WEAPONS[0];
    }

    if (player.ammo[w.id] <= 0) {
      player.weaponIdx = 0;
      w = WEAPONS[0];
      updateHUD();
    }

    if (player.ammo[w.id] !== Infinity) {
      player.ammo[w.id]--;
      updateHUD();
    }

    player.fireTimer = w.cooldown;
    sfx.playShoot(w.id);

    const originX = player.x;
    const originY = player.y;
    const baseAngle = Math.atan2(mouse.worldY - originY, mouse.worldX - originX);
    provokeNearbyPeds(originX, originY, 360);

    // 3. EMP Shockwave Discharge (Tier III — Mass Facade Glass Blowout + Structural Pulse!)
    if (w.emp) {
      shockwaves.push({ x: originX, y: originY, r: 12, maxR: w.range, color: '#a855f7', life: 0.48, maxLife: 0.48 });
      camera.shake = Math.min(20, camera.shake + 10);
      const egx = Math.floor(originX / TILE_SIZE);
      const egy = Math.floor(originY / TILE_SIZE);
      const seenEmpBlds = new Set();
      for (let cy = Math.max(0, egy - 2); cy <= Math.min(GRID_H - 1, egy + 2); cy++) {
        for (let cx = Math.max(0, egx - 2); cx <= Math.min(GRID_W - 1, egx + 2); cx++) {
          for (const bld of buildingsGrid[cy][cx]) {
            if (seenEmpBlds.has(bld) || bld.collapsing || bld.collapsed) continue;
            seenEmpBlds.add(bld);
            const nx = Math.max(bld.x, Math.min(originX, bld.x + bld.w));
            const ny = Math.max(bld.y, Math.min(originY, bld.y + bld.h));
            if (Math.hypot(nx - originX, ny - originY) < w.range) {
              shatterBuildingGlass(bld, nx, ny, 16);
              damageBuilding(bld, w.structDmg || 95, nx, ny, true);
            }
          }
        }
      }
      for (const v of vehicles) {
        if (v === player.vehicle || v.hp <= 0) continue;
        const d = Math.hypot(v.x - originX, v.y - originY);
        if (d < w.range) {
          v.empTimer = 5.0;
          v.hp -= w.damage * (1 - d / w.range * 0.5);
          const pushAng = Math.atan2(v.y - originY, v.x - originX);
          v.vx += Math.cos(pushAng) * 340 / (v.mass || 1);
          v.vy += Math.sin(pushAng) * 340 / (v.mass || 1);
          spawnSparks(v.x, v.y, 10, '#a855f7');
        }
      }
      for (let k = peds.length - 1; k >= 0; k--) {
        const p = peds[k];
        if (Math.hypot(p.x - originX, p.y - originY) < w.range * 0.85) {
          p.hp -= 95;
          if (p.hp <= 0) handlePedKilled(p, k);
        }
      }
      return;
    }

    // 4. Instantaneous Hyper-Velocity CARBON RAILGUN Beam (Tier IV — Core Structural Penetration!)
    if (w.railgun) {
      const cos = Math.cos(baseAngle);
      const sin = Math.sin(baseAngle);
      let endX = originX + cos * w.range;
      let endY = originY + sin * w.range;

      // Raymarch in 22px steps to pierce peds, vehicles & ignite trees, and crack/collapse buildings!
      const steps = Math.floor(w.range / 22);
      for (let s = 1; s <= steps; s++) {
        const rx = originX + cos * s * 22;
        const ry = originY + sin * s * 22;
        const gx = Math.floor(rx / TILE_SIZE);
        const gy = Math.floor(ry / TILE_SIZE);
        if (gx < 0 || gx >= GRID_W || gy < 0 || gy >= GRID_H) { endX = rx; endY = ry; break; }

        let hitBld = null;
        for (const bld of buildingsGrid[gy][gx]) {
          if (bld.collapsing || bld.collapsed) continue;
          if (rx > bld.x && rx < bld.x + bld.w && ry > bld.y && ry < bld.y + bld.h) {
            endX = rx; endY = ry; hitBld = bld; break;
          }
        }
        if (hitBld) {
          shatterBuildingGlass(hitBld, endX, endY, 10);
          damageBuilding(hitBld, w.structDmg || 315, endX, endY, true);
          spawnSparks(endX, endY, 16, '#00f0ff');
          shockwaves.push({ x: endX, y: endY, r: 4, maxR: 62, color: '#00f0ff', life: 0.25, maxLife: 0.25 });
          break;
        }

        if (s % 4 === 0) {
          shockwaves.push({ x: rx, y: ry, r: 2, maxR: 26, color: '#00f0ff', life: 0.22, maxLife: 0.22 });
        }

        for (let ti = 0; ti < palmTrees.length; ti++) {
          const tr = palmTrees[ti];
          if (Math.abs(tr.x - rx) < 22 && Math.abs(tr.y - ry) < 22) {
            if (!tr.burnt) igniteTree(tr);
            if (!tr.fallen && !tr.falling) knockDownTree(tr, baseAngle);
          }
        }

        for (const v of vehicles) {
          if (v === player.vehicle || v.hp <= 0) continue;
          const hitR = Math.max(32, Math.min(v.w || 60, v.h || 30) * 0.42);
          if (Math.hypot(v.x - rx, v.y - ry) < hitR) {
            v.hp -= w.damage;
            v.lastHitByPlayer = true;
            spawnSparks(v.x, v.y, 12, '#00f0ff');
          }
        }
        for (let k = peds.length - 1; k >= 0; k--) {
          const p = peds[k];
          if (Math.hypot(p.x - rx, p.y - ry) < 22) {
            p.hp -= w.damage;
            if (p.hp <= 0) handlePedKilled(p, k);
          }
        }
      }

      railBeams.push({ x1: originX + cos * 18, y1: originY + sin * 18, x2: endX, y2: endY, life: 0.28, maxLife: 0.28 });
      camera.shake = Math.min(18, camera.shake + 8);
      return;
    }

    // 5. Ballistic / Flame / Heavy RPG Projectiles (Tier I – V Structural Lethality!)
    const muzX = originX + Math.cos(baseAngle) * 20;
    const muzY = originY + Math.sin(baseAngle) * 20;
    particles.push({ x: muzX, y: muzY, vx: 0, vy: 0, r: w.explosive ? 11 : 7, color: '#fef08a', life: 0.06, maxLife: 0.06 });

    for (let i = 0; i < w.count; i++) {
      const a = baseAngle + (Math.random() - 0.5) * w.spread;
      bullets.push({
        x: originX + Math.cos(a) * 20,
        y: originY + Math.sin(a) * 20,
        vx: Math.cos(a) * w.speed,
        vy: Math.sin(a) * w.speed,
        damage: w.damage,
        structDmg: w.structDmg || 6,
        demolish: !!w.demolish,
        life: w.range / w.speed,
        color: w.color,
        explosive: !!w.explosive,
        flame: !!w.flame,
        fromPlayer: true
      });
    }
  }

  // ==========================================
  // 10C. INTERSECTION TRAFFIC SIGNALS, RIGHT-LANE AI & PHYSICS
  // ==========================================
  function normAngle(a) {
    return Math.atan2(Math.sin(a), Math.cos(a));
  }

  function isIntersectionTile(gx, gy) {
    if (gx <= 0 || gx >= GRID_W - 1 || gy <= 0 || gy >= GRID_H - 1 || worldGrid[gy][gx] !== 0) return false;
    const hasN = isRoadOrBridge(gx, gy - 1);
    const hasS = isRoadOrBridge(gx, gy + 1);
    const hasW = isRoadOrBridge(gx - 1, gy);
    const hasE = isRoadOrBridge(gx + 1, gy);
    return (hasN || hasS) && (hasW || hasE) && ((hasN ? 1 : 0) + (hasS ? 1 : 0) + (hasW ? 1 : 0) + (hasE ? 1 : 0) >= 3);
  }

  function getTrafficSignal(gx, gy, nowSec) {
    // 26-second green-wave signal cycle staggered along avenues & cross-streets
    const CYCLE = 26.0;
    const phase = ((nowSec + gx * 1.45 + gy * 0.95) % CYCLE + CYCLE) % CYCLE;
    if (phase < 10.2) return { ns: 'green', ew: 'red' };
    if (phase < 12.4) return { ns: 'amber', ew: 'red' };
    if (phase < 13.0) return { ns: 'red',   ew: 'red' }; // All-red safety clearance
    if (phase < 23.2) return { ns: 'red',   ew: 'green' };
    if (phase < 25.4) return { ns: 'red',   ew: 'amber' };
    return { ns: 'red', ew: 'red' };
  }

  function updateVehicles(dt) {
    const nowSec = performance.now() * 0.001;

    for (let i = vehicles.length - 1; i >= 0; i--) {
      const v = vehicles[i];
      v.sirenPhase += dt * 10;
      if (v.turnSignalTimer > 0) {
        v.turnSignalTimer = Math.max(0, v.turnSignalTimer - dt);
        if (v.turnSignalTimer <= 0) v.turnSignal = null;
      }
      if (v.hornCooldown > 0) v.hornCooldown = Math.max(0, v.hornCooldown - dt);
      if (v.stressHonkCooldown > 0) v.stressHonkCooldown = Math.max(0, v.stressHonkCooldown - dt);
      if (v.honkVisualTimer > 0) v.honkVisualTimer = Math.max(0, v.honkVisualTimer - dt);

      if (v.exploded) {
        // Permanent Destroyed Wreckage: Charred hulks (cars, tanks, helicopters, jets & colossal 747-8!) stay on the streets forever!
        v.driver = null;
        v.sirenOn = false;
        v.honkVisualTimer = 0;
        v.altitude = 0;
        v.isAirborne = false;
        v.vx *= Math.max(0, 1 - 5.5 * dt);
        v.vy *= Math.max(0, 1 - 5.5 * dt);
        if (Math.hypot(v.vx, v.vy) < 4) { v.vx = 0; v.vy = 0; }
        if (v.wreckBurnTimer > 0) {
          v.wreckBurnTimer = Math.max(0, v.wreckBurnTimer - dt);
        }
        if (Math.abs(v.x - camera.x) < 1100 && Math.abs(v.y - camera.y) < 850) {
          const spanX = v.isAirliner ? 150 : (v.isJet ? 56 : 16);
          const spanY = v.isAirliner ? 130 : (v.isJet ? 44 : 12);
          if ((v.wreckBurnTimer || 0) > 0 && Math.random() < (v.isAirliner ? 0.85 : 0.45)) {
            const isSmoke = Math.random() < 0.42;
            particles.push({
              x: v.x + (Math.random() - 0.5) * spanX,
              y: v.y + (Math.random() - 0.5) * spanY,
              vx: (Math.random() - 0.5) * 26,
              vy: -24 - Math.random() * 38,
              r: isSmoke ? (7 + Math.random() * 9) : (4 + Math.random() * 7),
              color: isSmoke ? '#18181b' : (Math.random() < 0.5 ? '#f97316' : '#facc15'),
              life: isSmoke ? 0.72 : 0.36,
              maxLife: isSmoke ? 0.72 : 0.36
            });
          } else if (Math.random() < 0.05) {
            // Faint persistent smoldering char wisp rising from cold battlefield wrecks
            particles.push({
              x: v.x + (Math.random() - 0.5) * (spanX * 0.5),
              y: v.y + (Math.random() - 0.5) * (spanY * 0.5),
              vx: (Math.random() - 0.5) * 10,
              vy: -16 - Math.random() * 18,
              r: 5 + Math.random() * 5,
              color: 'rgba(39, 39, 42, 0.55)',
              life: 0.75,
              maxLife: 0.75
            });
          }
        }
      } else if (v.empTimer && v.empTimer > 0) {
        v.empTimer = Math.max(0, v.empTimer - dt);
        v.vx *= Math.max(0, 1 - 4.5 * dt);
        v.vy *= Math.max(0, 1 - 4.5 * dt);
        v.isBraking = true;
        v.idleWaitTimer = 0;
      } else if (v.driver === 'civilian' && v.hp > 0) {
        const cos = Math.cos(v.angle);
        const sin = Math.sin(v.angle);

        if (v.isJet) {
          // Steady high-altitude trans-Leonida flight corridor (no circling over city blocks!)
          const cruise = v.isAirliner ? 395 : 540;
          v.altitude = v.isAirliner ? 295 : 240;
          v.vx = cos * cruise;
          v.vy = sin * cruise;
          v.isBraking = false;
          if (v.x < -560 || v.x > WORLD_W + 560 || v.y < -560 || v.y > WORLD_H + 560) {
            vehicles.splice(i, 1);
            continue;
          }
        } else if (v.isBoat) {
          const boatSpd = 175;
          v.vx = cos * boatSpd;
          v.vy = sin * boatSpd;
          v.isBraking = false;
          const lx = Math.floor((v.x + cos * 92) / TILE_SIZE);
          const ly = Math.floor((v.y + sin * 92) / TILE_SIZE);
          if (lx < 1 || lx >= GRID_W - 1 || ly < 1 || ly >= GRID_H - 1 || worldGrid[ly][lx] !== 4) {
            v.angle = normAngle(v.angle + Math.PI * 0.5);
          }
        } else {
          // Realistic Urban Commuter AI: Right-Hand Lane Discipline, Traffic Signals, Smooth Turns & Queueing!
          const curGX = Math.max(0, Math.min(GRID_W - 1, Math.floor(v.x / TILE_SIZE)));
          const curGY = Math.max(0, Math.min(GRID_H - 1, Math.floor(v.y / TILE_SIZE)));
          const curBr = bridgeGrid[curGY] && bridgeGrid[curGY][curGX];
          if (v.targetHeading === undefined) v.targetHeading = Math.round(v.angle / (Math.PI * 0.5)) * (Math.PI * 0.5);

          // 1. Evaluate Road Exits & Turns once per entered tile
          const cellKey = `${curGX},${curGY}`;
          const tileCX = curGX * TILE_SIZE + TILE_SIZE * 0.5;
          const tileCY = curGY * TILE_SIZE + TILE_SIZE * 0.5;
          if (v.lastTurnCell !== cellKey && Math.hypot(v.x - tileCX, v.y - tileCY) < 62) {
            const validDirs = getValidRoadHeadings(curGX, curGY);
            if (validDirs.length > 0) {
              const revAng = normAngle(v.targetHeading + Math.PI);
              const fwdDirs = validDirs.filter(d => Math.abs(normAngle(d - revAng)) > 0.45);
              let chosen = v.targetHeading;
              if (fwdDirs.length === 0) {
                chosen = validDirs[0];
              } else {
                const straightOpt = fwdDirs.find(d => Math.abs(normAngle(d - v.targetHeading)) < 0.35);
                const turnOpts = fwdDirs.filter(d => Math.abs(normAngle(d - v.targetHeading)) >= 0.35);
                if (straightOpt !== undefined && (turnOpts.length === 0 || Math.random() < 0.74)) {
                  chosen = straightOpt;
                } else if (turnOpts.length > 0) {
                  chosen = turnOpts[Math.floor(Math.random() * turnOpts.length)];
                } else {
                  chosen = fwdDirs[0];
                }
              }
              const turnDelta = normAngle(chosen - v.targetHeading);
              if (Math.abs(turnDelta) > 0.35) {
                v.turnSignal = turnDelta > 0 ? 'right' : 'left';
                v.turnSignalTimer = 2.2;
              }
              v.targetHeading = chosen;
            }
            v.lastTurnCell = cellKey;
          }

          const tCos = Math.cos(v.targetHeading);
          const tSin = Math.sin(v.targetHeading);

          // 2. Check Emergency Sirens Nearby (Drivers pull slightly toward the right curb & slow down)
          let sirenNearby = false;
          if (player.vehicle && player.vehicle.sirenOn && Math.hypot(player.vehicle.x - v.x, player.vehicle.y - v.y) < 230) {
            sirenNearby = true;
          }

          // 3. Smooth Right-Hand Lane Keeping Steering
          const rX = -tSin;
          const rY = tCos;
          const laneOff = (curBr ? 24 : LANE_OFFSET) + (sirenNearby ? 9 : 0);
          let aimX, aimY;
          if (Math.abs(tCos) > 0.7) {
            aimX = v.x + tCos * 64;
            aimY = tileCY + rY * laneOff;
          } else {
            aimX = tileCX + rX * laneOff;
            aimY = v.y + tSin * 64;
          }
          const curSpd = Math.hypot(v.vx, v.vy);
          if (curSpd > 6) {
            const desiredAng = Math.atan2(aimY - v.y, aimX - v.x);
            const diff = normAngle(desiredAng - v.angle);
            const maxTurn = 3.8 * dt * Math.min(1, curSpd / 65);
            v.angle = normAngle(v.angle + Math.sign(diff) * Math.min(Math.abs(diff), maxTurn));
          }

          // 4. Check Red/Amber Traffic Signal at Upcoming Intersection Stop-Line
          let redLightStop = false;
          const nextGX = curGX + Math.round(tCos);
          const nextGY = curGY + Math.round(tSin);
          if (!curBr && !isIntersectionTile(curGX, curGY) && isIntersectionTile(nextGX, nextGY)) {
            let distToStopLine = 999;
            if (tCos > 0.7) distToStopLine = (curGX + 1) * TILE_SIZE - v.x;
            else if (tCos < -0.7) distToStopLine = v.x - curGX * TILE_SIZE;
            else if (tSin > 0.7) distToStopLine = (curGY + 1) * TILE_SIZE - v.y;
            else distToStopLine = v.y - curGY * TILE_SIZE;

            if (distToStopLine > 8 && distToStopLine < 72) {
              const sig = getTrafficSignal(nextGX, nextGY, nowSec);
              const myLight = Math.abs(tCos) > 0.7 ? sig.ew : sig.ns;
              if (myLight === 'red' || (myLight === 'amber' && distToStopLine > 24)) {
                redLightStop = true;
              }
            }
          }

          // 5. Check Player, Crosswalk Pedestrians & Same-Lane Lead Vehicles Ahead
          let obstacleAhead = false;
          let emergencyBrake = false;
          const toPlayerX = player.x - v.x;
          const toPlayerY = player.y - v.y;
          const distToPlayer = Math.hypot(toPlayerX, toPlayerY);
          if (distToPlayer < 155) {
            const forwardDot = (toPlayerX * cos + toPlayerY * sin) / (distToPlayer || 1);
            const lateralDist = Math.abs(-toPlayerX * sin + toPlayerY * cos);
            if ((forwardDot > 0.45 && lateralDist < 34) || (!player.vehicle && player.z < 20 && distToPlayer < 64 && forwardDot > 0.2)) {
              obstacleAhead = true;
              emergencyBrake = true;
              // Occasional polite commuter horn tap if player blocks an active daytime lane (distance-attenuated!)
              if (v.hornCooldown <= 0 && distToPlayer < 115 && envState.hour >= 7 && envState.hour <= 22 && Math.random() < 0.04) {
                const listenerX = player.vehicle ? player.vehicle.x : player.x;
                const listenerY = player.vehicle ? player.vehicle.y : player.y;
                const hDist = Math.hypot(v.x - listenerX, v.y - listenerY);
                const hPan = (v.x - camera.x) / 520;
                v.honkVisualTimer = 0.36;
                sfx.playCarHorn(v.hornPitch || 310, v.isTruck, false, hDist, hPan);
                v.hornCooldown = 7 + Math.random() * 6;
              }
            }
          }

          // Yield to pedestrians crossing ahead in crosswalks
          if (!obstacleAhead && distToPlayer < 950) {
            for (let pk = 0; pk < peds.length; pk++) {
              const ped = peds[pk];
              const pdx = ped.x - v.x;
              const pdy = ped.y - v.y;
              if (Math.abs(pdx) > 85 || Math.abs(pdy) > 85) continue;
              const pdist = Math.hypot(pdx, pdy);
              if (pdist < 82) {
                const fDot = (pdx * cos + pdy * sin) / (pdist || 1);
                const lDist = Math.abs(-pdx * sin + pdy * cos);
                if (fDot > 0.55 && lDist < 24) {
                  obstacleAhead = true;
                  emergencyBrake = true;
                  break;
                }
              }
            }
          }

          // Same-lane lead vehicle headway queueing (ignores oncoming lane traffic!)
          if (!obstacleAhead) {
            const safeGap = v.isTruck ? 128 : 102;
            for (let j = 0; j < vehicles.length; j++) {
              const other = vehicles[j];
              if (other === v || other.isAirborne || onWaterLayer(other) !== onWaterLayer(v)) continue;
              const odx = other.x - v.x;
              const ody = other.y - v.y;
              if (Math.abs(odx) > safeGap || Math.abs(ody) > safeGap) continue;
              // Ignore oncoming vehicles cleanly passing in the opposite lane
              if (other.driver === 'civilian' && Math.cos(other.angle - v.angle) < -0.25) continue;
              const odist = Math.hypot(odx, ody);
              if (odist < safeGap) {
                const fDot = (odx * cos + ody * sin) / (odist || 1);
                const lDist = Math.abs(-odx * sin + ody * cos);
                if (fDot > 0.58 && lDist < 26) {
                  obstacleAhead = true;
                  if (odist < 68) emergencyBrake = true;
                  break;
                }
              }
            }
          }

          if (obstacleAhead || redLightStop) {
            v.isBraking = true;
            const brakeStrength = emergencyBrake ? 9.0 : 5.8;
            v.vx *= Math.max(0, 1 - brakeStrength * dt);
            v.vy *= Math.max(0, 1 - brakeStrength * dt);
            if (Math.hypot(v.vx, v.vy) < 4) { v.vx = 0; v.vy = 0; }
          } else {
            v.isBraking = sirenNearby;
            const rainFactor = WEATHER_MODES[weatherMode].id === 'rain' ? 0.84 : 1.0;
            const turnSlowdown = Math.abs(normAngle(v.targetHeading - v.angle)) > 0.28 ? 0.68 : 1.0;
            // Realistic urban traffic cruise speeds (calm 30-55 MPH city driving!)
            const baseCruise = v.isSkate ? 108 : (v.isHyper ? 218 : (v.isBike ? 198 : (v.isTruck ? 142 : 168)));
            const targetSpd = baseCruise * rainFactor * turnSlowdown * (sirenNearby ? 0.45 : 1.0);
            const fCos = Math.cos(v.angle);
            const fSin = Math.sin(v.angle);
            v.vx += (fCos * targetSpd - v.vx) * 2.8 * dt;
            v.vy += (fSin * targetSpd - v.vy) * 2.8 * dt;
          }

          // 6. Stressed Commuter Horn AI: Drivers stuck waiting idle >= 5.0s get stressed & lay on their horns!
          if (!v.isSkate) {
            const actualSpd = Math.hypot(v.vx, v.vy);
            if (obstacleAhead || redLightStop || actualSpd < 18) {
              v.idleWaitTimer = (v.idleWaitTimer || 0) + dt;
              if (v.idleWaitTimer >= 5.0 && (v.stressHonkCooldown || 0) <= 0) {
                const extraStress = v.idleWaitTimer >= 8.0;
                v.honkVisualTimer = extraStress ? 0.72 : 0.56;
                v.lastHonkTime = nowSec;
                v.stressHonkCount = (v.stressHonkCount || 0) + 1;
                // Faster, more impatient honk intervals the longer the driver is stuck waiting!
                v.stressHonkCooldown = Math.max(1.35, 3.2 - Math.min(1.7, (v.idleWaitTimer - 5.0) * 0.22)) + Math.random() * 1.35;
                const listenerX = player.vehicle ? player.vehicle.x : player.x;
                const listenerY = player.vehicle ? player.vehicle.y : player.y;
                const hDist = Math.hypot(v.x - listenerX, v.y - listenerY);
                const hPan = (v.x - camera.x) / 520;
                if (hDist < 1150) {
                  sfx.playCarHorn(v.hornPitch || 310, v.isTruck, extraStress, hDist, hPan);
                  if (hDist < 780 && Math.random() < 0.34) {
                    const barks = v.isTruck
                      ? ['HOOONK!!', 'CLEAR THE LANE!', 'MOVE IT!!']
                      : ['HONK!!', 'MOVE IT!', 'COME ON!', 'BEEP BEEP!', 'LET\'S GO!'];
                    addFloatingText(v.x, v.y - 20, barks[Math.floor(Math.random() * barks.length)], '#facc15');
                  }
                }
              }
            } else {
              // Calm down rapidly once traffic starts flowing again
              v.idleWaitTimer = Math.max(0, (v.idleWaitTimer || 0) - dt * 2.6);
            }
          }
        }
      } else if (v.driver === 'police' && v.hp > 0) {
        if (player.wanted > 0) {
          const dist = Math.hypot(player.x - v.x, player.y - v.y);
          if (v.isHeli) {
            // VCPD Maverick Helicopter orbits & tracks player from high altitude!
            v.altitude = 140;
            const targetAngle = Math.atan2(player.y - v.y, player.x - v.x);
            let diff = targetAngle - v.angle;
            while (diff > Math.PI) diff -= Math.PI * 2;
            while (diff < -Math.PI) diff += Math.PI * 2;
            v.angle += diff * 2.4 * dt;
            const desiredSpd = dist > 230 ? 295 : 95;
            v.vx += (Math.cos(v.angle) * desiredSpd - v.vx) * 2.5 * dt;
            v.vy += (Math.sin(v.angle) * desiredSpd - v.vy) * 2.5 * dt;
            // Helicopter sniper bursts & 4★+ Tactical SWAT Fast-Rope Deployments!
            if (player.wanted >= 4 && dist < 480 && Math.random() < dt * 1.4) {
              bullets.push({
                x: v.x, y: v.y,
                vx: Math.cos(targetAngle) * 700,
                vy: Math.sin(targetAngle) * 700,
                damage: 9, life: 0.8, color: '#fef08a', fromPlayer: false
              });
            }
            if (player.wanted >= 4 && dist < 310) {
              v.swatDropCooldown = Math.max(0, (v.swatDropCooldown || 0) - dt);
              if (v.swatDropCooldown <= 0 && swatRopes.length < 4) {
                const rgx = Math.max(0, Math.min(GRID_W - 1, Math.floor(v.x / TILE_SIZE)));
                const rgy = Math.max(0, Math.min(GRID_H - 1, Math.floor(v.y / TILE_SIZE)));
                if (worldGrid[rgy] && (worldGrid[rgy][rgx] !== 4 || hasBridgeAt(rgx, rgy))) {
                  v.swatDropCooldown = 9.0;
                  swatRopes.push({ heli: v, x: v.x - 14, y: v.y + 8, offsetX: -14, offsetY: 8, alt: v.altitude || 140, progress: 0 });
                  swatRopes.push({ heli: v, x: v.x + 14, y: v.y - 8, offsetX: 14, offsetY: -8, alt: v.altitude || 140, progress: 0.14 });
                  showBanner('🪢 SWAT FAST-ROPE TEAM DEPLOYING!', '#38bdf8');
                }
              }
            }
          } else if (!player.vehicle && player.z < 20 && dist < 155 && !v.isTank) {
            v.vx *= Math.max(0, 1 - 7.5 * dt);
            v.vy *= Math.max(0, 1 - 7.5 * dt);
            if (Math.hypot(v.vx, v.vy) < 45) {
              v.vx = 0; v.vy = 0; v.driver = null;
              spawnPed(v.x + Math.cos(v.angle - Math.PI * 0.5) * 26, v.y + Math.sin(v.angle - Math.PI * 0.5) * 26, 'police');
            }
          } else {
            const targetAngle = Math.atan2(player.y - v.y, player.x - v.x);
            let diff = targetAngle - v.angle;
            while (diff > Math.PI) diff -= Math.PI * 2;
            while (diff < -Math.PI) diff += Math.PI * 2;
            v.angle += Math.sign(diff) * Math.min(Math.abs(diff), 2.9 * dt);
            v.turretAngle = targetAngle;
            v.vx += Math.cos(v.angle) * v.accel * 0.78 * dt;
            v.vy += Math.sin(v.angle) * v.accel * 0.78 * dt;
            const pSpd = Math.hypot(v.vx, v.vy);
            if (pSpd > v.maxSpeed) {
              v.vx = (v.vx / pSpd) * v.maxSpeed;
              v.vy = (v.vy / pSpd) * v.maxSpeed;
            }
          }
        } else {
          if (v.isHeli) {
            v.altitude = 145;
            v.vx = Math.cos(v.angle) * 320;
            v.vy = Math.sin(v.angle) * 320;
            if (Math.hypot(v.x - player.x, v.y - player.y) > 1800) { vehicles.splice(i, 1); continue; }
          } else {
            v.sirenOn = false;
            v.driver = 'civilian';
          }
        }
      } else if (v.driver === 'firefighter' && v.hp > 0) {
        const blaze = findNearestActiveFire(v.x, v.y, 1500);
        if (blaze) {
          v.sirenOn = true;
          const dist = Math.hypot(blaze.x - v.x, blaze.y - v.y);
          const targetAngle = Math.atan2(blaze.y - v.y, blaze.x - v.x);
          v.turretAngle = targetAngle;
          if (dist > 185) {
            let diff = targetAngle - v.angle;
            while (diff > Math.PI) diff -= Math.PI * 2;
            while (diff < -Math.PI) diff += Math.PI * 2;
            v.angle += Math.sign(diff) * Math.min(Math.abs(diff), 2.5 * dt);
            v.vx += Math.cos(v.angle) * v.accel * 0.82 * dt;
            v.vy += Math.sin(v.angle) * v.accel * 0.82 * dt;
            const fSpd = Math.hypot(v.vx, v.vy);
            if (fSpd > v.maxSpeed * 0.85) {
              v.vx = (v.vx / fSpd) * v.maxSpeed * 0.85;
              v.vy = (v.vy / fSpd) * v.maxSpeed * 0.85;
            }
          } else {
            v.vx *= Math.max(0, 1 - 6.0 * dt);
            v.vy *= Math.max(0, 1 - 6.0 * dt);
            v.hoseTimer = (v.hoseTimer || 0) - dt;
            if (v.hoseTimer <= 0) {
              v.hoseTimer = 0.055;
              fireWaterCannon(v, targetAngle + Math.sin(nowSec * 5.5) * 0.14);
            }
          }
        } else {
          v.sirenOn = false;
          v.driver = 'civilian';
        }
      } else if (!v.driver) {
        if (v.unmannedGlide && (v.altitude || 0) > 0) {
          // Pilot bailed out mid-air! Unmanned aircraft descends & spirals into houses/ground to detonate!
          v.vx *= Math.max(0, 1 - 0.16 * dt);
          v.vy *= Math.max(0, 1 - 0.16 * dt);
          v.angle += (v.isHeli ? 3.2 : 0.65) * dt;
          v.altitude = Math.max(0, (v.altitude || 0) - 118 * dt);
          if (Math.random() < 0.65) {
            particles.push({
              x: v.x + (Math.random() - 0.5) * 18,
              y: v.y + (Math.random() - 0.5) * 18,
              vx: (Math.random() - 0.5) * 40,
              vy: -25 - Math.random() * 35,
              r: 7 + Math.random() * 9,
              color: Math.random() < 0.45 ? '#f97316' : '#27272a',
              life: 0.6, maxLife: 0.6
            });
          }
          // Crash into tall building roof/facade on the way down or detonate on ground impact!
          const cgx = Math.floor(v.x / TILE_SIZE);
          const cgy = Math.floor(v.y / TILE_SIZE);
          const glideSpan = Math.max(1, Math.ceil((Math.max(v.w || 80, v.h || 80) * 0.52) / TILE_SIZE));
          let hitTallBuilding = false;
          for (let gy2 = Math.max(0, cgy - glideSpan); gy2 <= Math.min(GRID_H - 1, cgy + glideSpan) && !hitTallBuilding; gy2++) {
            for (let gx2 = Math.max(0, cgx - glideSpan); gx2 <= Math.min(GRID_W - 1, cgx + glideSpan); gx2++) {
              for (const bld of buildingsGrid[gy2][gx2]) {
                if (!bld.collapsing && !bld.collapsed && (bld.height || 40) >= v.altitude) {
                  if (obbRectCollide(v.x, v.y, (v.w || 80) * 0.44, (v.h || 80) * 0.42, v.angle || 0, bld.x, bld.y, bld.w, bld.h)) {
                    hitTallBuilding = true;
                    break;
                  }
                }
              }
            }
          }
          if (hitTallBuilding || v.altitude <= 0) {
            v.altitude = 0;
            v.unmannedGlide = false;
            v.hp = 0;
            v.crashDemolish = true;
          }
        } else {
          v.vx *= Math.max(0, 1 - 3.2 * dt);
          v.vy *= Math.max(0, 1 - 3.2 * dt);
          if (Math.hypot(v.vx, v.vy) < 5) { v.vx = 0; v.vy = 0; }
        }
      }

      if (v.angularVel) {
        v.angle += v.angularVel * dt;
        v.angularVel *= Math.max(0, 1 - 5.0 * dt);
      }

      v.x += v.vx * dt;
      v.y += v.vy * dt;

      if (v.ramTimer && v.ramTimer > 0) {
        v.ramTimer = Math.max(0, v.ramTimer - dt);
      }
      if (v.stuntAirTimer && v.stuntAirTimer > 0) {
        v.stuntAirTimer = Math.max(0, v.stuntAirTimer - dt);
        v.altitude = Math.sin((v.stuntAirTimer / 1.25) * Math.PI) * 50;
      } else if (!v.isJet && !v.isHeli && !v.towedBy && !(v.airDropTimer > 0)) {
        v.altitude = 0;
      }

      const vSpeed = Math.hypot(v.vx, v.vy);
      v.isAirborne = ((v.altitude || 0) > 14) || (v.stuntAirTimer > 0);

      // Realistic Helicopter Main & Tail Rotor ("Hélice") Spin-Up / Coast-Down Physics!
      if (v.isHeli) {
        if (v.hp <= 0) {
          v.rotorRPM = Math.max(0, (v.rotorRPM || 0) - 1.4 * dt);
        } else if (v.driver || v.unmannedGlide) {
          v.rotorRPM = Math.min(1.0, (v.rotorRPM || 0) + 0.68 * dt);
        } else {
          // Parked with engine off: blades decelerate smoothly to a complete dead stop (rotorRPM === 0)!
          v.rotorRPM = Math.max(0, (v.rotorRPM || 0) - 0.42 * dt);
        }
        if (v.rotorRPM > 0.001) {
          // Non-linear angular sweep so low RPM visibly shows individual blades accelerating/coasting!
          const omega = v.rotorRPM * (0.28 + 0.72 * v.rotorRPM) * 26;
          v.rotorAngle = ((v.rotorAngle || 0) + omega * dt) % (Math.PI * 200);
          v.tailRotorAngle = ((v.tailRotorAngle || 0) + v.rotorRPM * 38 * dt) % (Math.PI * 200);

          // Low-altitude rotor downwash rings on water or monsoon puddles!
          if (v.rotorRPM > 0.5 && (v.altitude || 0) < 65 && Math.random() < 0.28) {
            const hgx = Math.max(0, Math.min(GRID_W - 1, Math.floor(v.x / TILE_SIZE)));
            const hgy = Math.max(0, Math.min(GRID_H - 1, Math.floor(v.y / TILE_SIZE)));
            if (worldGrid[hgy][hgx] === 4 && !hasBridgeAt(hgx, hgy) && waterRipples.length < 140) {
              waterRipples.push({ x: v.x, y: v.y, r: 14, maxR: 58, life: 0.45, maxLife: 0.45, color: 'rgba(224, 242, 254, 0.38)' });
            }
          }
        }
      }

      // Boat Kelvin Wake Ripples & Stern Foam Spray on Water
      if (v.isBoat && vSpeed > 50) {
        const cos = Math.cos(v.angle);
        const sin = Math.sin(v.angle);
        particles.push({
          x: v.x - cos * 44 + (Math.random() - 0.5) * 10,
          y: v.y - sin * 44 + (Math.random() - 0.5) * 10,
          vx: -cos * 60 + (Math.random() - 0.5) * 45,
          vy: -sin * 60 + (Math.random() - 0.5) * 45,
          r: 4 + Math.random() * 5,
          color: 'rgba(240, 249, 255, 0.8)',
          life: 0.35, maxLife: 0.35
        });
        if (Math.random() < 0.38 && waterRipples.length < 140) {
          waterRipples.push({
            x: v.x - cos * 22,
            y: v.y - sin * 22,
            r: 10,
            maxR: 46 + Math.min(34, vSpeed * 0.08),
            life: 0.65,
            maxLife: 0.65,
            color: 'rgba(224, 242, 254, 0.42)'
          });
        }
      }

      // Aircraft Exhaust: 4 White High-Bypass Turbofan Contrails on 747-8 Jumbo vs. Twin Supersonic Fighter Afterburners!
      if (v.isJet && v.driver && vSpeed > 80) {
        const cos = Math.cos(v.angle);
        const sin = Math.sin(v.angle);
        if (v.isAirliner) {
          const rx = -sin;
          const ry = cos;
          for (const engY of [-132, -68, 68, 132]) {
            const engBack = Math.abs(engY) > 100 ? 34 : 8;
            particles.push({
              x: v.x - cos * engBack + rx * engY,
              y: v.y - sin * engBack + ry * engY,
              vx: -cos * 30, vy: -sin * 30,
              r: 5.5 + Math.random() * 4.5,
              color: 'rgba(241, 245, 249, 0.44)',
              life: 0.85, maxLife: 0.85
            });
          }
        } else {
          for (const nozY of [-7.5, 7.5]) {
            particles.push({
              x: v.x - cos * 96 - sin * nozY + (Math.random() - 0.5) * 4,
              y: v.y - sin * 96 + cos * nozY + (Math.random() - 0.5) * 4,
              vx: -cos * 210, vy: -sin * 210,
              r: 4.5 + Math.random() * 5,
              color: Math.random() < 0.55 ? '#38bdf8' : '#fef08a',
              life: 0.20, maxLife: 0.20
            });
          }
        }
      }

      if (!v.isAirborne) {
        // Low-flying or fast-taxiing colossal aircraft colliding into buildings detonate & demolish structures across their full wingspan!
        if ((v.isJet || v.isHeli) && vSpeed > (v.isAirliner ? 135 : 185)) {
          const gx = Math.floor(v.x / TILE_SIZE);
          const gy = Math.floor(v.y / TILE_SIZE);
          const spanTiles = Math.max(1, Math.ceil((Math.max(v.w, v.h) * 0.52) / TILE_SIZE));
          for (let gy2 = Math.max(0, gy - spanTiles); gy2 <= Math.min(GRID_H - 1, gy + spanTiles) && v.hp > 0; gy2++) {
            for (let gx2 = Math.max(0, gx - spanTiles); gx2 <= Math.min(GRID_W - 1, gx + spanTiles); gx2++) {
              for (const bld of buildingsGrid[gy2][gx2]) {
                if (!bld.collapsing && !bld.collapsed && obbRectCollide(v.x, v.y, v.w * 0.46, v.h * 0.44, v.angle || 0, bld.x, bld.y, bld.w, bld.h)) {
                  v.hp = 0;
                  v.crashDemolish = true;
                  break;
                }
              }
              if (v.hp <= 0) break;
            }
          }
        }
        if (v.hp > 0 || (v.exploded && !v.isAirliner && vSpeed >= 1.5)) {
          resolveBuildingCollisions(v, Math.max(v.w, v.h) * 0.40, true);
        }
      } else if (!(v.driver === 'civilian' && v.isHighTransit)) {
        v.x = Math.max(80, Math.min(WORLD_W - 80, v.x));
        v.y = Math.max(80, Math.min(WORLD_H - 80, v.y));
        // Airborne aircraft flying BELOW a tall skyscraper's roof height (checked across full multi-tile wingspan!):
        // Jets, giant airliners, unmanned gliders, or high-speed helicopter rams crash & demolish; slow piloted helis bump/slide cleanly!
        const agx = Math.floor(v.x / TILE_SIZE);
        const agy = Math.floor(v.y / TILE_SIZE);
        const airSpan = Math.max(1, Math.ceil((Math.max(v.w, v.h) * 0.52) / TILE_SIZE));
        if (!v.isPolice) {
          for (let gy2 = Math.max(0, agy - airSpan); gy2 <= Math.min(GRID_H - 1, agy + airSpan) && v.hp > 0; gy2++) {
            for (let gx2 = Math.max(0, agx - airSpan); gx2 <= Math.min(GRID_W - 1, agx + airSpan); gx2++) {
              for (const bld of buildingsGrid[gy2][gx2]) {
                if (!bld.collapsing && !bld.collapsed && (bld.height || 40) > (v.altitude || 0) + 12) {
                  const hit = obbRectCollide(v.x, v.y, v.w * 0.43, v.h * 0.42, v.angle || 0, bld.x, bld.y, bld.w, bld.h);
                  if (hit) {
                    if (v.isHeli && !v.unmannedGlide && vSpeed < 185) {
                      v.x += hit.nx * hit.overlap;
                      v.y += hit.ny * hit.overlap;
                      v.vx *= 0.55;
                      v.vy *= 0.55;
                    } else {
                      v.hp = 0;
                      v.crashDemolish = true;
                      break;
                    }
                  }
                }
              }
              if (v.hp <= 0) break;
            }
          }
        }
      }

      // Vehicle-to-Vehicle Mass & Tank/Jumbo-Crush Physics (Same Elevation Only)
      if (!v.isAirborne) {
        for (let j = i - 1; j >= 0; j--) {
          const v2 = vehicles[j];
          if (v2.isAirborne || onWaterLayer(v) !== onWaterLayer(v2)) continue;
          const dx = v2.x - v.x;
          const dy = v2.y - v.y;
          const contactReach = Math.max(85, (v.w + v2.w) * 0.42 + 14);
          if (Math.abs(dx) > contactReach || Math.abs(dy) > contactReach) continue;
          const dist = Math.hypot(dx, dy);
          const minDist = (v.w + v2.w) * 0.36;
          if (dist < minDist && dist > 0.01) {
            const nx = dx / dist;
            const ny = dy / dist;
            const overlap = minDist - dist;
            const m1 = v.mass || 1.0;
            const m2 = v2.mass || 1.0;
            const totalM = m1 + m2;

            v.x -= nx * overlap * (m2 / totalM);
            v.y -= ny * overlap * (m2 / totalM);
            v2.x += nx * overlap * (m1 / totalM);
            v2.y += ny * overlap * (m1 / totalM);

            // Rhino Tank & Colossal 28-Ton 747-8 Jumbo crush small road vehicles on high-momentum contact!
            if ((v.isTank || v.isAirliner) && v.driver === 'player' && !v2.isTank && !v2.isAirliner && vSpeed > 75) {
              v2.hp -= 440;
            } else if ((v2.isTank || v2.isAirliner) && v2.driver === 'player' && !v.isTank && !v.isAirliner && Math.hypot(v2.vx, v2.vy) > 75) {
              v.hp -= 440;
            }

            const rvx = v2.vx - v.vx;
            const rvy = v2.vy - v.vy;
            const velAlongNormal = rvx * nx + rvy * ny;
            if (velAlongNormal < 0) {
              const impulse = -1.42 * velAlongNormal / (1 / m1 + 1 / m2);
              v.vx -= (impulse * nx) / m1;
              v.vy -= (impulse * ny) / m1;
              v2.vx += (impulse * nx) / m2;
              v2.vy += (impulse * ny) / m2;

              const impactSpeed = Math.abs(velAlongNormal);
              if (impactSpeed > 130) {
                spawnSparks((v.x + v2.x) * 0.5, (v.y + v2.y) * 0.5, 8);
                v.hp -= (impactSpeed * 0.045) / Math.sqrt(m1);
                v2.hp -= (impactSpeed * 0.045) / Math.sqrt(m2);
              }
            }
          }
        }
      }

      // Pedestrian Impacts (Same Elevation Only)
      if (!v.isAirborne && !onWaterLayer(v) && vSpeed > 35) {
        for (let k = peds.length - 1; k >= 0; k--) {
          const p = peds[k];
          const pdx = p.x - v.x;
          const pdy = p.y - v.y;
          if (Math.abs(pdx) > 42 || Math.abs(pdy) > 42) continue;
          const pdist = Math.hypot(pdx, pdy);
          if (pdist < 30 && pdist > 0.01) {
            p.x += (pdx / pdist) * (30 - pdist);
            p.y += (pdy / pdist) * (30 - pdist);
            p.vx += v.vx * 0.85;
            p.vy += v.vy * 0.85;
            if (vSpeed > 95) {
              p.hp -= vSpeed * 0.48;
              if (p.hp <= 0 && v.driver === 'player') handlePedKilled(p, k);
              else if (p.hp <= 0) peds.splice(k, 1);
            }
          }
        }
      }

      if (v.hp < v.maxHp * 0.4 && v.hp > 0 && Math.random() < 0.35) {
        particles.push({
          x: v.x + (Math.random() - 0.5) * 14,
          y: v.y + (Math.random() - 0.5) * 14,
          vx: (Math.random() - 0.5) * 30, vy: -20 - Math.random() * 30,
          r: 5 + Math.random() * 6,
          color: v.hp < v.maxHp * 0.2 ? '#ff5722' : '#52525b',
          life: 0.45, maxLife: 0.45
        });
      }

      if (v.hp <= 0 && !v.exploded) {
        const preCrashWanted = player.wanted;
        const wasPilotingCrash = (player.vehicle === v);
        const playerInvolvedCrash = !!(wasPilotingCrash || v.wasPlayerAircraft || v.lastHitByPlayer);
        v.exploded = true;
        v.wrecked = true;
        v.wreckBurnTimer = v.isAirliner ? 32 : (v.isJet || v.isHeli ? 20 : 14);
        v.driver = null;
        v.rotorRPM = 0;
        v.unmannedGlide = false;
        v.altitude = 0;
        v.isAirborne = false;
        v.sirenOn = false;
        v.vx *= 0.32;
        v.vy *= 0.32;
        if (wasPilotingCrash) {
          player.vehicle = null;
          player.z = 0;
          // Eject survivor slightly clear of the fuselage core & shield against same-frame mega-blast self-wipe
          player.crashProtectTimer = 0.35;
          const survDmg = (v.isAirliner || v.isJet) ? Math.min(55, Math.max(12, player.health - 22)) : 45;
          damagePlayer(survDmg);
          updateMissionHUD();
        }

        const isAirCrash = !!(v.isJet || v.isHeli || v.crashDemolish);
        if (v.isAirliner) {
          // COLOSSAL 747-8 JUMBO CITY CATASTROPHE: Multi-Block Blast Wave, Wing Fuel-Tank Detonations, 64 Wreckage Chunks & 5★!
          setBreakingNews(`CATASTROPHE: JUMBO 747-8 CRASHES IN ${getDistrictName(v.x, v.y)} — 5-STAR FEDERAL EMERGENCY!`, 22);
          sfx.playCatastrophicCrash();
          createExplosion(v.x, v.y, 540, 1850, true);
          const cCos = Math.cos(v.angle);
          const cSin = Math.sin(v.angle);
          const wX = -cSin;
          const wY = cCos;
          for (const [fOff, lOff] of [[0, -155], [0, 155], [135, 0], [-140, 0]]) {
            const bx = Math.max(80, Math.min(WORLD_W - 80, v.x + cCos * fOff + wX * lOff));
            const by = Math.max(80, Math.min(WORLD_H - 80, v.y + cSin * fOff + wY * lOff));
            createExplosion(bx, by, 290, 980, true);
            skidMarks.push({ x1: bx - 52, y1: by - 52, x2: bx + 52, y2: by + 52, width: 108, alpha: 0.82, isScorch: true });
          }
          skidMarks.push({ x1: v.x - 76, y1: v.y - 76, x2: v.x + 76, y2: v.y + 76, width: 156, alpha: 0.90, isScorch: true });
          shockwaves.push({ x: v.x, y: v.y, r: 24, maxR: 720, color: '#ff1744', life: 0.75, maxLife: 0.75 });
          camera.shake = 58;

          // Scatter 64 permanent widebody fuselage skins, wing spars, titanium fan blades & charred turbine sections!
          const jumboCols = ['#e2e8f0', '#cbd5e1', '#18181b', '#27272a', v.color || '#0284c7', '#ef4444', '#475569'];
          for (let wIdx = 0; wIdx < 64; wIdx++) {
            const wa = Math.random() * Math.PI * 2;
            const wspd = 55 + Math.random() * 340;
            debrisChunks.push({
              x: v.x + (Math.random() - 0.5) * 220,
              y: v.y + (Math.random() - 0.5) * 220,
              z: 14 + Math.random() * 78,
              vx: Math.cos(wa) * wspd,
              vy: Math.sin(wa) * wspd,
              vz: 85 + Math.random() * 245,
              rot: Math.random() * Math.PI * 2,
              vrot: (Math.random() - 0.5) * 16,
              w: 9 + Math.random() * 22,
              h: 5 + Math.random() * 12,
              color: jumboCols[wIdx % jumboCols.length],
              life: 2.8,
              maxLife: 2.8
            });
          }
          player.wanted = Math.min(6, Math.max(preCrashWanted, 5));
          setMinimumWanted(5, '🚨 5-STAR CITY CATASTROPHE // JUMBO AIRLINER CRASHED IN LEONIDA!');
        } else if (v.isJet) {
          // SUPERSONIC FIGHTER JET CRASH: Heavy Ordnance Blast + Twin Wing Detonations + 5★ Federal Lockdown!
          sfx.playCatastrophicCrash();
          createExplosion(v.x, v.y, 340, 1020, true);
          const wX = -Math.sin(v.angle);
          const wY = Math.cos(v.angle);
          for (const side of [-68, 68]) {
            createExplosion(v.x + wX * side, v.y + wY * side, 195, 580, true);
          }
          skidMarks.push({ x1: v.x - 48, y1: v.y - 48, x2: v.x + 48, y2: v.y + 48, width: 98, alpha: 0.82, isScorch: true });
          camera.shake = 44;
          const jetCols = ['#334155', '#1e293b', '#18181b', '#94a3b8', '#ef4444'];
          for (let wIdx = 0; wIdx < 34; wIdx++) {
            const wa = Math.random() * Math.PI * 2;
            const wspd = 45 + Math.random() * 265;
            debrisChunks.push({
              x: v.x + (Math.random() - 0.5) * 90,
              y: v.y + (Math.random() - 0.5) * 90,
              z: 10 + Math.random() * 52,
              vx: Math.cos(wa) * wspd,
              vy: Math.sin(wa) * wspd,
              vz: 70 + Math.random() * 195,
              rot: Math.random() * Math.PI * 2,
              vrot: (Math.random() - 0.5) * 16,
              w: 7 + Math.random() * 15,
              h: 4 + Math.random() * 9,
              color: jetCols[wIdx % jetCols.length],
              life: 2.6,
              maxLife: 2.6
            });
          }
          if (playerInvolvedCrash || v.crashDemolish) {
            player.wanted = Math.min(6, Math.max(preCrashWanted, 5));
            setMinimumWanted(5, '🚨 5-STAR AIRSPACE DISASTER // FIGHTER JET DOWN IN CITY!');
          }
        } else {
          createExplosion(v.x, v.y, isAirCrash ? 255 : 155, isAirCrash ? 640 : 210, isAirCrash);
          // Scatter permanent charred chassis panels, twisted metal & tire wreckage onto the street!
          const wreckCols = ['#18181b', '#27272a', '#3f3f46', v.color || '#475569', '#09090b'];
          const chunkCount = isAirCrash ? 24 : 16;
          for (let wIdx = 0; wIdx < chunkCount; wIdx++) {
            const wa = Math.random() * Math.PI * 2;
            const wspd = 35 + Math.random() * 195;
            debrisChunks.push({
              x: v.x + (Math.random() - 0.5) * 28,
              y: v.y + (Math.random() - 0.5) * 28,
              z: 8 + Math.random() * 34,
              vx: Math.cos(wa) * wspd,
              vy: Math.sin(wa) * wspd,
              vz: 55 + Math.random() * 155,
              rot: Math.random() * Math.PI * 2,
              vrot: (Math.random() - 0.5) * 14,
              w: 5 + Math.random() * 10,
              h: 3 + Math.random() * 6,
              color: wreckCols[wIdx % wreckCols.length],
              life: 2.4,
              maxLife: 2.4
            });
          }
          if (v.isHeli && (playerInvolvedCrash || v.crashDemolish)) {
            setMinimumWanted(5, '🚨 5-STAR AIRSPACE EMERGENCY // HELICOPTER DOWN IN LEONIDA!');
          } else if (v.isPolice) {
            addWanted(0.8);
          }
        }
        // Stamp permanent scorched wreckage mark onto Satellite Megamap & Radar Minimap base texture — ZERO DESPAWN!
        const wgx = Math.max(0, Math.min(GRID_W - 1, Math.floor(v.x / TILE_SIZE)));
        const wgy = Math.max(0, Math.min(GRID_H - 1, Math.floor(v.y / TILE_SIZE)));
        if (baseMapCanvas && worldGrid[wgy] && (worldGrid[wgy][wgx] !== 4 || hasBridgeAt(wgx, wgy))) {
          const bctx = baseMapCanvas.getContext('2d');
          const msx = baseMapCanvas.width / WORLD_W;
          const msy = baseMapCanvas.height / WORLD_H;
          const mw = Math.max(2, (v.w || 60) * msx);
          const mh = Math.max(2, (v.h || 30) * msy);
          bctx.fillStyle = v.isAirliner ? '#ea580c' : '#18181b';
          bctx.fillRect((v.x - (v.w || 60) * 0.5) * msx, (v.y - (v.h || 30) * 0.5) * msy, mw, mh);
        }
        addCash(v.isAirliner ? 3500 : ((v.isHeli || v.isJet) ? 1200 : 300), v.x, v.y);
      }
    }
  }

  function updatePeds(dt) {
    for (let i = peds.length - 1; i >= 0; i--) {
      const p = peds[i];
      const dx = player.x - p.x;
      const dy = player.y - p.y;
      // Fast sleep check for distant peds in 12,800x12,800 world
      if (Math.abs(dx) > 1600 || Math.abs(dy) > 1600) continue;

      // Pedestrians Ignited by Flamethrower / Burning Trees!
      if (p.burnTimer && p.burnTimer > 0) {
        p.burnTimer -= dt;
        p.hp -= 20 * dt;
        p.panicTimer = Math.max(p.panicTimer, 2.2);
        if (Math.random() < 0.48) {
          particles.push({
            x: p.x + (Math.random() - 0.5) * 10,
            y: p.y + (Math.random() - 0.5) * 10,
            vx: (Math.random() - 0.5) * 24,
            vy: -28 - Math.random() * 28,
            r: 4 + Math.random() * 5,
            color: Math.random() < 0.3 ? '#27272a' : (Math.random() < 0.5 ? '#fb923c' : '#fde047'),
            life: 0.35, maxLife: 0.35
          });
        }
        if (p.hp <= 0) {
          handlePedKilled(p, i);
          continue;
        }
      }

      p.aiTimer -= dt;
      if (p.hostileTimer > 0) p.hostileTimer = Math.max(0, p.hostileTimer - dt);
      const distToPlayer = Math.hypot(dx, dy);

      // Determine combat target: Rival Gangster (Turf Shootouts!) OR Player!
      let targetX = null;
      let targetY = null;
      let targetPed = null;
      let targetDist = Infinity;

      if (!(p.burnTimer > 0) && !p.inWater) {
        // 1. Gang-vs-Gang Street Turf Shootouts & Police-vs-Gang Skirmishes!
        if (p.role === 'gang' || p.role === 'police') {
          for (let j = 0; j < peds.length; j++) {
            if (j === i) continue;
            const other = peds[j];
            if (other.hp <= 0) continue;
            const isRivalGang = p.role === 'gang' && other.role === 'gang' && other.gang !== p.gang;
            const isCopVsHostileGang = (p.role === 'police' && other.role === 'gang' && other.hostileTimer > 0) ||
                                       (p.role === 'gang' && p.hostileTimer > 0 && other.role === 'police');
            if (!isRivalGang && !isCopVsHostileGang) continue;
            const odx = other.x - p.x;
            const ody = other.y - p.y;
            if (Math.abs(odx) > 330 || Math.abs(ody) > 330) continue;
            const od = Math.hypot(odx, ody);
            if (od < 330 && od < targetDist) {
              targetDist = od;
              targetX = other.x;
              targetY = other.y;
              targetPed = other;
            }
          }
        }

        // 2. Hostility Toward Player (Cops on Wanted, Bounties, Disrespected/Hot-Turf Gangs, & Provoked Aggressive Peds!)
        const gangMadAtPlayer = p.role === 'gang' && (
          GANGS[p.gang].respect < 35 ||
          p.hostileTimer > 0 ||
          (p.isAggressive && distToPlayer < 195 && !player.vehicle && player.weaponIdx > 0)
        );
        const aggroPedMad = p.isAggressive && p.hostileTimer > 0;
        const wantsPlayer =
          (p.role === 'police' && player.wanted > 0) ||
          p.role === 'bounty' ||
          gangMadAtPlayer ||
          aggroPedMad;

        if (wantsPlayer && distToPlayer < 430 && player.z < 55 && distToPlayer < targetDist) {
          targetDist = distToPlayer;
          targetX = player.x;
          targetY = player.y;
          targetPed = null;
        }
      }

      if (targetX !== null) {
        p.angle = Math.atan2(targetY - p.y, targetX - p.x);
        const strafeAng = p.angle + Math.PI * 0.5 * (p.strafeDir || 1);
        if (Math.random() < dt * 0.9) p.strafeDir = -(p.strafeDir || 1);

        if (targetDist > 175) {
          p.vx = Math.cos(p.angle) * 118 + Math.cos(strafeAng) * 34;
          p.vy = Math.sin(p.angle) * 118 + Math.sin(strafeAng) * 34;
        } else if (targetDist < 85) {
          p.vx = -Math.cos(p.angle) * 65 + Math.cos(strafeAng) * 55;
          p.vy = -Math.sin(p.angle) * 65 + Math.sin(strafeAng) * 55;
        } else {
          p.vx = Math.cos(strafeAng) * 48;
          p.vy = Math.sin(strafeAng) * 48;
        }

        p.shootTimer -= dt;
        if (p.shootTimer <= 0) {
          p.shootTimer = p.role === 'bounty' ? 0.34 : (p.role === 'gang' ? (0.48 + Math.random() * 0.38) : 0.82);
          const spread = (Math.random() - 0.5) * (p.role === 'gang' ? 0.14 : 0.08);
          const sAng = p.angle + spread;
          const muzX = p.x + Math.cos(p.angle) * 16;
          const muzY = p.y + Math.sin(p.angle) * 16;
          const tracerCol = p.gang ? (GANGS[p.gang].color || '#ff9100') : '#ff9100';
          spawnSparks(muzX, muzY, 3, '#fde047');
          if (distToPlayer < 560 && Math.random() < 0.45) {
            sfx.playShoot(p.role === 'gang' ? 'smg' : 'pistol');
          }
          bullets.push({
            x: muzX,
            y: muzY,
            vx: Math.cos(sAng) * 620,
            vy: Math.sin(sAng) * 620,
            damage: p.role === 'gang' ? 8 : 10,
            life: 0.72,
            color: tracerCol,
            fromPlayer: false,
            shooterPed: p,
            shooterGang: p.gang || null
          });
          // Nearby non-aggressive civilians panic when street gang gunfire erupts!
          if (targetPed && Math.random() < 0.35) {
            for (let c = 0; c < peds.length; c++) {
              const civ = peds[c];
              if (civ.role === 'civilian' && !civ.isAggressive && Math.abs(civ.x - p.x) < 220 && Math.abs(civ.y - p.y) < 220) {
                civ.panicTimer = Math.max(civ.panicTimer, 4.0);
                civ.angle = Math.atan2(civ.y - p.y, civ.x - p.x);
              }
            }
          }
        }
      } else {
        if (p.panicTimer > 0) {
          p.panicTimer -= dt;
          if (p.burnTimer > 0 && Math.random() < dt * 3.5) {
            p.angle += (Math.random() - 0.5) * 2.2;
          }
          const runSpd = p.burnTimer > 0 ? 205 : 165;
          p.vx = Math.cos(p.angle) * runSpd;
          p.vy = Math.sin(p.angle) * runSpd;
        } else {
          if (p.aiTimer <= 0) {
            p.aiTimer = 2.0 + Math.random() * 3.0;
            p.angle += (Math.random() - 0.5) * 1.8;
          }
          const walkSpd = p.inWater ? 38 : 55;
          p.vx = Math.cos(p.angle) * walkSpd;
          p.vy = Math.sin(p.angle) * walkSpd;
        }
      }

      if (Math.hypot(p.vx, p.vy) > 10) {
        p.stepPhase += dt * (p.panicTimer > 0 ? 15 : 8);
      }

      p.x += p.vx * dt;
      p.y += p.vy * dt;
      resolveBuildingCollisions(p, p.radius, false);
      const pgx = Math.max(0, Math.min(GRID_W - 1, Math.floor(p.x / TILE_SIZE)));
      const pgy = Math.max(0, Math.min(GRID_H - 1, Math.floor(p.y / TILE_SIZE)));
      p.inWater = worldGrid[pgy][pgx] === 4 && !hasBridgeAt(pgx, pgy);
    }

    const targetPeds = Math.round(215 * envState.pedMult);
    if (peds.length < targetPeds && Math.random() < 0.16) {
      const ang = Math.random() * Math.PI * 2;
      const sx = Math.max(120, Math.min(WORLD_W - 120, player.x + Math.cos(ang) * 720));
      const sy = Math.max(120, Math.min(WORLD_H - 120, player.y + Math.sin(ang) * 720));
      const gx = Math.floor(sx / TILE_SIZE);
      const gy = Math.floor(sy / TILE_SIZE);
      if (worldGrid[gy] && worldGrid[gy][gx] !== 4 && worldGrid[gy][gx] !== 0) {
        const gang = getGangForPos(sx, sy);
        if (Math.random() < 0.14) {
          // Spawn a 3-member street gang crew together (occasionally a rival raid squad near turf borders!)
          const raidRival = (Math.abs(gx - 26) <= 4 || Math.abs(gx - 52) <= 4) && Math.random() < 0.45;
          const crewGang = raidRival ? (gang === 'runners' ? 'syndicate' : 'runners') : gang;
          spawnGangCrew(sx, sy, crewGang, 3, raidRival || isHotTurfZone(sx, sy));
        } else {
          const role = Math.floor(player.wanted) >= 2 && Math.random() < 0.35 ? 'police' : (Math.random() < 0.30 ? 'gang' : 'civilian');
          spawnPed(sx, sy, role, role === 'gang' ? gang : null);
        }
      }
    } else if (peds.length > targetPeds + 18) {
      for (let i = peds.length - 1; i >= 0; i--) {
        if (peds[i].role === 'civilian' && Math.hypot(peds[i].x - player.x, peds[i].y - player.y) > 1500) {
          peds.splice(i, 1);
          break;
        }
      }
    }
  }

  function updateBullets(dt) {
    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.life -= dt;

      if (b.airToGround) {
        const remDist = Math.hypot(b.targetX - b.x, b.targetY - b.y);
        b.alt = Math.max(0, (remDist / (b.startDist || 240)) * 160);
        if (Math.random() < 0.65) {
          particles.push({
            x: b.x, y: b.y - (b.alt || 0) * 0.45,
            vx: -b.vx * 0.08, vy: -b.vy * 0.08,
            r: 4 + Math.random() * 4,
            color: 'rgba(226, 232, 240, 0.55)',
            life: 0.28, maxLife: 0.28
          });
        }
        if (remDist < 24) {
          b.life = 0;
        }
      } else if (b.flame) {
        particles.push({
          x: b.x, y: b.y,
          vx: (Math.random() - 0.5) * 44, vy: (Math.random() - 0.5) * 44 - 16,
          r: 6 + Math.random() * 8,
          color: Math.random() < 0.5 ? '#ff6d00' : '#ffe600',
          life: 0.18, maxLife: 0.18
        });
      }

      let hitSomething = false;

      // Flamethrower Ignites Palm Trees Dramatically!
      if (b.flame) {
        for (let ti = 0; ti < palmTrees.length; ti++) {
          const tr = palmTrees[ti];
          if (!tr.burnt && Math.abs(b.x - tr.x) < tr.r + 12 && Math.abs(b.y - tr.y) < tr.r + 12) {
            if (Math.hypot(b.x - tr.x, b.y - tr.y) < tr.r + 10) {
              igniteTree(tr);
              hitSomething = true;
              break;
            }
          }
        }
      }

      // Ballistic & Explosive Rounds Splinter and Fell Standing Palm Trees!
      if (!hitSomething && !b.flame && !b.airToGround) {
        const tgx = Math.floor(b.x / TILE_SIZE);
        const tgy = Math.floor(b.y / TILE_SIZE);
        if (tgx >= 0 && tgx < GRID_W && tgy >= 0 && tgy < GRID_H) {
          const cellTrees = treesGrid[tgy] && treesGrid[tgy][tgx];
          if (cellTrees) {
            for (let ti = 0; ti < cellTrees.length; ti++) {
              const tr = cellTrees[ti];
              if (tr.fallen || tr.falling) continue;
              if (Math.hypot(b.x - tr.x, b.y - tr.y) < (tr.trunkR || 9.5) + 4) {
                damageTree(tr, b.explosive ? 140 : Math.max(18, b.damage * 0.8), Math.atan2(b.vy, b.vx));
                hitSomething = true;
                break;
              }
            }
          }
        }
      }

      // O(1) Spatial Cell Building Hit Check (Skip Collapsed Ruins & Respect Air-to-Ground Missile Altitude!)
      let hitBuilding = null;
      const gx = Math.floor(b.x / TILE_SIZE);
      const gy = Math.floor(b.y / TILE_SIZE);
      if (!hitSomething && gx >= 0 && gx < GRID_W && gy >= 0 && gy < GRID_H) {
        const cellBlds = buildingsGrid[gy][gx];
        for (let m = 0; m < cellBlds.length; m++) {
          const bld = cellBlds[m];
          if (bld.collapsing || bld.collapsed) continue;
          if (b.airToGround && (b.alt || 0) > (bld.height || 40) + 18) continue;
          if (b.x > bld.x && b.x < bld.x + bld.w && b.y > bld.y && b.y < bld.y + bld.h) {
            hitSomething = true;
            hitBuilding = bld;
            break;
          }
        }
      }
      if (hitBuilding) {
        shatterBuildingGlass(hitBuilding, b.x, b.y, b.explosive ? 10 : (b.flame ? 1 : 2));
        if (b.flame) {
          hitBuilding.burnTimer = Math.max(hitBuilding.burnTimer || 0, 4.5);
        }
        damageBuilding(hitBuilding, b.structDmg || (b.tankShell ? b.damage : 6), b.x, b.y, b.fromPlayer);
      }

      if (!hitSomething && (!b.airToGround || (b.alt || 0) < 48)) {
        for (let gi = 0; gi < gasStations.length && !hitSomething; gi++) {
          const gs = gasStations[gi];
          for (let pi = 0; pi < gs.pumps.length; pi++) {
            const pump = gs.pumps[pi];
            if (!pump.exploded && Math.hypot(b.x - pump.x, b.y - pump.y) < 22) {
              pump.hp -= b.damage * (b.flame ? 2.5 : 1.0);
              if (b.flame || b.explosive || pump.hp <= 0) {
                ruptureGasPump(gs, pump, b.explosive ? 0.18 : 1.05);
              }
              spawnSparks(b.x, b.y, 6, '#fb923c');
              hitSomething = true;
              break;
            }
          }
        }
        for (let ni = 0; ni < powerNodes.length && !hitSomething; ni++) {
          const pn = powerNodes[ni];
          if (!pn.destroyed && Math.hypot(b.x - pn.x, b.y - pn.y) < 32) {
            damagePowerSubstation(pn, b.structDmg || b.damage, b.fromPlayer);
            hitSomething = true;
            break;
          }
        }
      }

      if (!hitSomething) {
        for (const v of vehicles) {
          if (b.fromPlayer && player.vehicle === v) continue;
          if (b.airToGround && (b.alt || 0) > (v.altitude || 0) + 45) continue;
          const vHitR = Math.max(30, Math.min(v.w || 60, v.h || 30) * 0.42);
          if (Math.hypot(b.x - v.x, b.y - v.y) < vHitR) {
            v.hp -= b.damage;
            if (b.fromPlayer) v.lastHitByPlayer = true;
            hitSomething = true;
            break;
          }
        }
      }

      if (!hitSomething && b.fromPlayer) {
        for (let k = peds.length - 1; k >= 0; k--) {
          const p = peds[k];
          if (b.airToGround && (b.alt || 0) > 40) continue;
          if (Math.hypot(b.x - p.x, b.y - p.y) < p.radius + 7) {
            p.hp -= b.damage;
            if (b.flame) p.burnTimer = 4.6;
            if (p.role === 'gang' || p.isAggressive) {
              p.hostileTimer = 18.0;
              p.panicTimer = 0;
              // Alert nearby crewmates of the same gang!
              if (p.gang) {
                for (let m = 0; m < peds.length; m++) {
                  const ally = peds[m];
                  if (ally.gang === p.gang && Math.abs(ally.x - p.x) < 260 && Math.abs(ally.y - p.y) < 260) {
                    ally.hostileTimer = 18.0;
                  }
                }
              }
            } else {
              p.panicTimer = 5.5;
              p.angle = Math.atan2(p.y - player.y, p.x - player.x);
            }
            if (p.hp <= 0) handlePedKilled(p, k);
            hitSomething = true;
            break;
          }
        }
      }

      if (!hitSomething && !b.fromPlayer) {
        if (player.vehicle) {
          if (Math.hypot(b.x - player.vehicle.x, b.y - player.vehicle.y) < 30) {
            player.vehicle.hp -= b.damage;
            hitSomething = true;
          }
        } else if (player.z < 24 && Math.hypot(b.x - player.x, b.y - player.y) < player.radius + 4) {
          damagePlayer(b.damage);
          hitSomething = true;
        }
        // Gang-vs-Gang & Police-vs-Gang Firefight Hits!
        if (!hitSomething && b.shooterPed) {
          for (let k = peds.length - 1; k >= 0; k--) {
            const p = peds[k];
            if (p === b.shooterPed) continue;
            if (b.shooterGang && p.gang === b.shooterGang) continue;
            if (Math.hypot(b.x - p.x, b.y - p.y) < p.radius + 6) {
              p.hp -= b.damage;
              if (p.role === 'gang' || p.isAggressive) p.hostileTimer = 14.0;
              else p.panicTimer = 4.5;
              spawnSparks(p.x, p.y, 4, '#ef4444');
              if (p.hp <= 0) {
                peds.splice(k, 1);
              }
              hitSomething = true;
              break;
            }
          }
        }
      }

      if (hitSomething || b.life <= 0) {
        if (b.explosive) {
          const canDemolish = !!(b.tankShell || b.demolish);
          createExplosion(b.x, b.y, canDemolish ? 180 : 150, b.structDmg || (b.tankShell ? 280 : 220), canDemolish);
        } else if (hitSomething && !b.flame) {
          spawnSparks(b.x, b.y, 4, b.color);
        } else if (!hitSomething && gx >= 0 && gx < GRID_W && gy >= 0 && gy < GRID_H && worldGrid[gy][gx] === 4 && !hasBridgeAt(gx, gy)) {
          if (waterRipples.length < 140) {
            waterRipples.push({ x: b.x, y: b.y, r: 3, maxR: 22, life: 0.4, maxLife: 0.4, color: 'rgba(224, 242, 254, 0.55)' });
          }
        }
        bullets.splice(i, 1);
      }
    }
  }

  // ==========================================
  // 11. CARBON 2027 2.5D RENDERER (SKY-RAIL, WEATHER, HELI SEARCHLIGHT)
  // ==========================================
  function getSkyRailPoint(dist) {
    const { x1, y1, x2, y2 } = SKYRAIL_BOUNDS;
    const w = x2 - x1;
    const h = y2 - y1;
    const perim = 2 * (w + h);
    let d = ((dist % perim) + perim) % perim;
    if (d < w) return { x: x1 + d, y: y1, angle: 0 };
    d -= w;
    if (d < h) return { x: x2, y: y1 + d, angle: Math.PI * 0.5 };
    d -= h;
    if (d < w) return { x: x2 - d, y: y2, angle: Math.PI };
    d -= w;
    return { x: x1, y: y2 - d, angle: -Math.PI * 0.5 };
  }

  function render() {
    ctx.fillStyle = '#050811';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    const shakeX = (Math.random() - 0.5) * camera.shake;
    const shakeY = (Math.random() - 0.5) * camera.shake;
    ctx.translate(canvas.width * 0.5 + shakeX, canvas.height * 0.5 + shakeY);
    ctx.scale(camera.zoom, camera.zoom);
    ctx.translate(-camera.x, -camera.y);

    const halfW = (canvas.width * 0.5) / camera.zoom + 260;
    const halfH = (canvas.height * 0.5) / camera.zoom + 260;
    const minGX = Math.max(0, Math.floor((camera.x - halfW) / TILE_SIZE));
    const maxGX = Math.min(GRID_W - 1, Math.floor((camera.x + halfW) / TILE_SIZE));
    const minGY = Math.max(0, Math.floor((camera.y - halfH) / TILE_SIZE));
    const maxGY = Math.min(GRID_H - 1, Math.floor((camera.y + halfH) / TILE_SIZE));

    const sf = window.SpriteForge;
    const isRain = WEATHER_MODES[weatherMode].id === 'rain';
    const lightsOn = envState.lightsOn;
    const nowSec = performance.now() * 0.001;

    // 1. Draw Ground Tiles across Visible Viewport
    for (let gy = minGY; gy <= maxGY; gy++) {
      for (let gx = minGX; gx <= maxGX; gx++) {
        const t = worldGrid[gy][gx];
        const wx = gx * TILE_SIZE;
        const wy = gy * TILE_SIZE;

        if (t === 0) {
          ctx.drawImage(sf.textures.asphalt, wx, wy, TILE_SIZE, TILE_SIZE);
          if (isRain) {
            ctx.fillStyle = 'rgba(14, 165, 233, 0.08)';
            ctx.fillRect(wx, wy, TILE_SIZE, TILE_SIZE);
            // Glossy reflective rainwater puddles pooled along asphalt depressions
            const ph = cellHash(gx * 3 + 7, gy * 5 + 11);
            if (ph > 0.32) {
              const px = wx + 28 + ph * 96;
              const py = wy + 30 + cellHash(gy + 19, gx + 3) * 96;
              const prx = 14 + (ph * 22);
              const pry = 9 + ((ph * 17) % 10);
              ctx.save();
              ctx.fillStyle = lightsOn ? 'rgba(56, 189, 248, 0.19)' : 'rgba(125, 211, 252, 0.22)';
              ctx.beginPath();
              ctx.ellipse(px, py, prx, pry, ph * Math.PI, 0, Math.PI * 2);
              ctx.fill();
              ctx.strokeStyle = 'rgba(224, 242, 254, 0.18)';
              ctx.lineWidth = 1;
              ctx.stroke();
              ctx.restore();
            }
          }

          const hasN = gy > 0 && worldGrid[gy - 1][gx] === 0;
          const hasS = gy < GRID_H - 1 && worldGrid[gy + 1][gx] === 0;
          const hasW = gx > 0 && worldGrid[gy][gx - 1] === 0;
          const hasE = gx < GRID_W - 1 && worldGrid[gy][gx + 1] === 0;
          const isRoadX = hasN || hasS;
          const isRoadY = hasW || hasE;

          if (isRoadX && !isRoadY) {
            ctx.fillStyle = 'rgba(234, 179, 8, 0.78)';
            ctx.fillRect(wx + TILE_SIZE * 0.5 - 4, wy, 2.5, TILE_SIZE);
            ctx.fillRect(wx + TILE_SIZE * 0.5 + 1.5, wy, 2.5, TILE_SIZE);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
            for (let d = 18; d < TILE_SIZE; d += 40) {
              ctx.fillRect(wx + TILE_SIZE * 0.25, wy + d, 2, 18);
              ctx.fillRect(wx + TILE_SIZE * 0.75, wy + d, 2, 18);
            }
          } else if (isRoadY && !isRoadX) {
            ctx.fillStyle = 'rgba(234, 179, 8, 0.78)';
            ctx.fillRect(wx, wy + TILE_SIZE * 0.5 - 4, TILE_SIZE, 2.5);
            ctx.fillRect(wx, wy + TILE_SIZE * 0.5 + 1.5, TILE_SIZE, 2.5);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
            for (let d = 18; d < TILE_SIZE; d += 40) {
              ctx.fillRect(wx + d, wy + TILE_SIZE * 0.25, 18, 2);
              ctx.fillRect(wx + d, wy + TILE_SIZE * 0.75, 18, 2);
            }
          } else if (isRoadX && isRoadY) {
            ctx.fillStyle = 'rgba(240, 244, 248, 0.38)';
            for (let c = 22; c < TILE_SIZE - 22; c += 16) {
              ctx.fillRect(wx + c, wy + 5, 9, 18);
              ctx.fillRect(wx + c, wy + TILE_SIZE - 23, 9, 18);
              ctx.fillRect(wx + 5, wy + c, 18, 9);
              ctx.fillRect(wx + TILE_SIZE - 23, wy + c, 18, 9);
            }
            // Right-hand lane white stop bars right before intersection crosswalks
            ctx.fillStyle = 'rgba(248, 250, 252, 0.65)';
            ctx.fillRect(wx + 18, wy + 2, 58, 3);                      // Southbound approach stop bar
            ctx.fillRect(wx + TILE_SIZE * 0.5 + 4, wy + TILE_SIZE - 5, 58, 3); // Northbound approach stop bar
            ctx.fillRect(wx + 2, wy + TILE_SIZE * 0.5 + 4, 3, 58);     // Eastbound approach stop bar
            ctx.fillRect(wx + TILE_SIZE - 5, wy + 18, 3, 58);          // Westbound approach stop bar
          }
        } else if (t === 1) {
          ctx.drawImage(sf.textures.sidewalk, wx, wy, TILE_SIZE, TILE_SIZE);
          if (isRain && cellHash(gx * 7 + 3, gy * 11 + 5) > 0.54) {
            const ph = cellHash(gx * 7 + 3, gy * 11 + 5);
            ctx.fillStyle = 'rgba(125, 211, 252, 0.16)';
            ctx.beginPath();
            ctx.ellipse(wx + 34 + ph * 86, wy + 36 + ((ph * 53) % 86), 12 + ph * 10, 7 + ph * 6, ph * 2.4, 0, Math.PI * 2);
            ctx.fill();
          }
        } else if (t === 7) {
          ctx.drawImage(sf.textures.dockConcrete || sf.textures.sidewalk, wx, wy, TILE_SIZE, TILE_SIZE);
          if (isRain && cellHash(gx * 5 + 9, gy * 3 + 13) > 0.45) {
            const ph = cellHash(gx * 5 + 9, gy * 3 + 13);
            ctx.fillStyle = 'rgba(56, 189, 248, 0.18)';
            ctx.beginPath();
            ctx.ellipse(wx + 32 + ph * 92, wy + 34 + ((ph * 47) % 90), 16 + ph * 14, 9 + ph * 7, ph * 2.1, 0, Math.PI * 2);
            ctx.fill();
          }
        } else if (t === 2) {
          ctx.drawImage(sf.textures.sidewalk, wx, wy, TILE_SIZE, TILE_SIZE);
          ctx.drawImage(sf.textures.grass, wx + 12, wy + 12, TILE_SIZE - 24, TILE_SIZE - 24);
        } else if (t === 3) {
          ctx.drawImage(sf.textures.sand, wx, wy, TILE_SIZE, TILE_SIZE);
        } else if (t === 4) {
          drawProceduralWaterTile(gx, gy, wx, wy, nowSec, sf);
        } else if (t === 5) {
          ctx.drawImage(sf.textures.sidewalk, wx, wy, TILE_SIZE, TILE_SIZE);
          ctx.fillStyle = '#272a30';
          ctx.fillRect(wx + 12, wy + 12, TILE_SIZE - 24, TILE_SIZE - 24);
          ctx.strokeStyle = '#eab308';
          ctx.lineWidth = 3;
          ctx.strokeRect(wx + 14, wy + 14, TILE_SIZE - 28, TILE_SIZE - 28);
          ctx.fillStyle = '#facc15';
          ctx.font = 'bold 12.5px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('VICE AUTO CUSTOMS', wx + TILE_SIZE * 0.5, wy + TILE_SIZE * 0.5 - 5);
          ctx.fillStyle = '#d6d3d1';
          ctx.font = 'bold 9.5px monospace';
          ctx.fillText('REPAIR • RESPRAY • CLEAR HEAT', wx + TILE_SIZE * 0.5, wy + TILE_SIZE * 0.5 + 12);
        } else if (t === 6) {
          ctx.drawImage(sf.textures.asphalt, wx, wy, TILE_SIZE, TILE_SIZE);
          if (isRain) {
            ctx.fillStyle = 'rgba(14, 165, 233, 0.09)';
            ctx.fillRect(wx, wy, TILE_SIZE, TILE_SIZE);
          }
          ctx.strokeStyle = 'rgba(148, 163, 184, 0.16)';
          ctx.lineWidth = 1;
          ctx.strokeRect(wx, wy, TILE_SIZE, TILE_SIZE);

          if (gx === 9 || gx === 14) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.fillRect(wx + TILE_SIZE * 0.5 - 4, wy + 24, 8, TILE_SIZE - 48);
            if (gy === 48 || gy === 66) {
              for (let k = 16; k < TILE_SIZE - 16; k += 18) {
                ctx.fillRect(wx + k, wy + 12, 10, 42);
              }
            }
            ctx.fillStyle = '#facc15';
            ctx.fillRect(wx + 6, wy + 40, 4, 4);
            ctx.fillRect(wx + TILE_SIZE - 10, wy + 40, 4, 4);
          } else if (gy === 56) {
            ctx.fillStyle = 'rgba(250, 204, 21, 0.72)';
            ctx.fillRect(wx, wy + TILE_SIZE * 0.5 - 2, TILE_SIZE, 4);
          }
        }
      }
    }

    // 1B. Architectural Courtyards, Collapsed Ruins, Organic Shorelines & Concrete Seawalls
    drawCourtyardsAndSeawalls(minGX, maxGX, minGY, maxGY, halfW, halfH, nowSec);

    // 1C. Draw Vice Beach Umbrellas (Open in sunny daytime, folded closed at night & during rain!) & Stunt Jump Ramps
    for (const bp of beachProps) {
      if (Math.abs(bp.x - camera.x) > halfW || Math.abs(bp.y - camera.y) > halfH) continue;
      if (envState.beachActive) {
        ctx.fillStyle = `rgba(0, 0, 0, ${Math.min(0.36, envState.shadowAlpha + 0.06).toFixed(2)})`;
        ctx.beginPath();
        ctx.arc(bp.x + envState.shadowDX * 0.36, bp.y + envState.shadowDY * 0.36, 12.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = bp.color;
        ctx.beginPath(); ctx.arc(bp.x, bp.y, 12, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#fafaf9'; ctx.lineWidth = 2; ctx.stroke();
      } else {
        // Folded canvas beach umbrella & teak post after sunset or during monsoon rain
        ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
        ctx.beginPath(); ctx.arc(bp.x + 2, bp.y + 3, 4.5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#e7e5e4';
        ctx.beginPath(); ctx.arc(bp.x, bp.y, 4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = bp.color;
        ctx.beginPath(); ctx.arc(bp.x, bp.y, 2.2, 0, Math.PI * 2); ctx.fill();
      }
    }

    for (const sj of stuntJumps) {
      if (Math.abs(sj.x - camera.x) > halfW || Math.abs(sj.y - camera.y) > halfH) continue;
      ctx.save();
      ctx.translate(sj.x, sj.y);
      ctx.rotate(sj.dir);
      ctx.fillStyle = '#334155';
      ctx.fillRect(-28, -22, 56, 44);
      ctx.strokeStyle = '#eab308';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(-28, -22, 56, 44);
      ctx.fillStyle = '#facc15';
      for (let ox = -18; ox <= 14; ox += 14) {
        ctx.beginPath();
        ctx.moveTo(ox, -13); ctx.lineTo(ox + 10, 0); ctx.lineTo(ox, 13);
        ctx.closePath(); ctx.fill();
      }
      ctx.restore();
    }

    // 1D. Water-Surface Layer (z = 0): Hydro-Ripples, Rain Rings, Boat Kelvin Wakes, Boats & Swimmers pass UNDERNEATH Elevated Bridges!
    for (let i = 0; i < waterRipples.length; i++) {
      const wr = waterRipples[i];
      if (Math.abs(wr.x - camera.x) > halfW || Math.abs(wr.y - camera.y) > halfH) continue;
      const alpha = Math.max(0, wr.life / wr.maxLife);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = wr.color;
      ctx.lineWidth = 1.5 + alpha * 2.2;
      ctx.beginPath();
      ctx.arc(wr.x, wr.y, wr.r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    if (rainImpacts.length > 0) {
      for (let i = 0; i < rainImpacts.length; i++) {
        const ri = rainImpacts[i];
        if (ri.kind !== 'water') continue;
        if (Math.abs(ri.x - camera.x) > halfW || Math.abs(ri.y - camera.y) > halfH) continue;
        const a = Math.max(0, ri.life / ri.maxLife);
        ctx.strokeStyle = `rgba(224, 242, 254, ${(a * 0.62).toFixed(2)})`;
        ctx.lineWidth = 1.25;
        ctx.beginPath();
        ctx.arc(ri.x, ri.y, ri.r, 0, Math.PI * 2);
        ctx.stroke();
        if (ri.r > 3.5) {
          ctx.strokeStyle = `rgba(186, 230, 253, ${(a * 0.36).toFixed(2)})`;
          ctx.beginPath();
          ctx.arc(ri.x, ri.y, ri.r * 0.52, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
    }
    // Tsunami Surge Rings & Living Water Predators (Alligators & Great White Sharks!)
    for (let i = 0; i < tsunamiWaves.length; i++) {
      const tw = tsunamiWaves[i];
      if (Math.abs(tw.x - camera.x) > halfW + tw.r || Math.abs(tw.y - camera.y) > halfH + tw.r) continue;
      const a = Math.max(0, tw.life / tw.maxLife);
      ctx.save();
      ctx.strokeStyle = `rgba(224, 242, 254, ${(a * 0.82).toFixed(2)})`;
      ctx.lineWidth = 6 * a + 2;
      ctx.beginPath(); ctx.arc(tw.x, tw.y, tw.r, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = `rgba(56, 189, 248, ${(a * 0.52).toFixed(2)})`;
      ctx.lineWidth = 3 * a + 1;
      ctx.beginPath(); ctx.arc(tw.x, tw.y, Math.max(4, tw.r - 12), 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
    }
    for (let i = 0; i < waterPredators.length; i++) {
      const wp = waterPredators[i];
      if (Math.abs(wp.x - camera.x) > halfW + 60 || Math.abs(wp.y - camera.y) > halfH + 60) continue;
      const spr = wp.kind === 'shark' ? sf.propSprites.shark : sf.propSprites.gator;
      if (spr) {
        ctx.save();
        ctx.translate(wp.x, wp.y);
        ctx.rotate(wp.angle + Math.sin(wp.phase) * 0.08);
        ctx.drawImage(spr, -spr.width * 0.5, -spr.height * 0.5);
        ctx.restore();
      }
    }
    for (const v of vehicles) {
      if (!v.isAirborne && onWaterLayer(v) && Math.abs(v.x - camera.x) <= halfW && Math.abs(v.y - camera.y) <= halfH) {
        drawVehicle(v, lightsOn);
      }
    }
    for (const p of peds) {
      if (!p.inWater) continue;
      if (Math.abs(p.x - camera.x) > halfW || Math.abs(p.y - camera.y) > halfH) continue;
      drawPed(p);
    }
    if (!player.vehicle && player.z <= 0 && player.inWater) {
      drawPlayerOnFoot(nowSec);
    }

    // 1E. Engineered Elevated Bridges (z = 1): Water Shadows, Concrete Piers, Narrowed Decks, Walkways & Guardrails!
    drawBridges(minGX, maxGX, minGY, maxGY, lightsOn, isRain, nowSec);

    // 2. Skidmarks, Scorch Craters, Ground Rain Splashes, Permanent Settled Debris & Fallen Palm Trees!
    for (const sk of skidMarks) {
      if (Math.abs(sk.x1 - camera.x) > halfW || Math.abs(sk.y1 - camera.y) > halfH) continue;
      if (sk.isScorch) {
        const cx = (sk.x1 + sk.x2) * 0.5;
        const cy = (sk.y1 + sk.y2) * 0.5;
        const sGrad = ctx.createRadialGradient(cx, cy, 4, cx, cy, sk.width * 0.65);
        sGrad.addColorStop(0, 'rgba(5, 5, 8, 0.85)');
        sGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = sGrad;
        ctx.beginPath(); ctx.arc(cx, cy, sk.width * 0.65, 0, Math.PI * 2); ctx.fill();
      } else {
        ctx.strokeStyle = `rgba(10, 10, 14, ${sk.alpha})`;
        ctx.lineWidth = sk.width;
        ctx.beginPath(); ctx.moveTo(sk.x1, sk.y1); ctx.lineTo(sk.x2, sk.y2); ctx.stroke();
      }
    }

    // 2B. Interactive Ground Raindrop Splashes & Puddle Ripples
    if (rainImpacts.length > 0) {
      for (let i = 0; i < rainImpacts.length; i++) {
        const ri = rainImpacts[i];
        if (ri.kind !== 'ground') continue;
        if (Math.abs(ri.x - camera.x) > halfW || Math.abs(ri.y - camera.y) > halfH) continue;
        const a = Math.max(0, ri.life / ri.maxLife);
        ctx.strokeStyle = `rgba(186, 230, 253, ${(a * 0.52).toFixed(2)})`;
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.ellipse(ri.x, ri.y, ri.r, ri.r * 0.68, 0, 0, Math.PI * 2);
        ctx.stroke();
        if (a > 0.45) {
          const lift = (1 - a) * 9 + 2;
          ctx.strokeStyle = `rgba(240, 249, 255, ${(a * 0.65).toFixed(2)})`;
          ctx.beginPath();
          ctx.moveTo(ri.x - 2, ri.y); ctx.lineTo(ri.x - 4, ri.y - lift);
          ctx.moveTo(ri.x + 2, ri.y); ctx.lineTo(ri.x + 4, ri.y - lift);
          ctx.stroke();
        }
      }
    }

    // 2C. Permanent Destruction Debris (Bricks, Masonry, Glass Shards, Tree Splinters & Charred Wreckage — Never Deleted!)
    for (let gy = minGY; gy <= maxGY; gy++) {
      const row = settledDebrisGrid[gy];
      if (!row) continue;
      for (let gx = minGX; gx <= maxGX; gx++) {
        const cellDebris = row[gx];
        if (!cellDebris || cellDebris.length === 0) continue;
        for (let di = 0; di < cellDebris.length; di++) {
          const sd = cellDebris[di];
          ctx.save();
          ctx.translate(sd.x, sd.y);
          ctx.rotate(sd.rot);
          ctx.fillStyle = 'rgba(8, 10, 14, 0.32)';
          ctx.fillRect(-sd.w * 0.5 + 1.4, -sd.h * 0.5 + 1.4, sd.w, sd.h);
          ctx.fillStyle = sd.color;
          ctx.fillRect(-sd.w * 0.5, -sd.h * 0.5, sd.w, sd.h);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
          ctx.fillRect(-sd.w * 0.5, -sd.h * 0.5, sd.w, Math.max(1.0, sd.h * 0.26));
          ctx.restore();
        }
      }
    }

    // 2D. Knocked-Down Fallen Palm Trees on Ground Layer (Vehicles & Peds can drive/walk right over them!)
    for (const tree of palmTrees) {
      if (!tree.fallen) continue;
      if (Math.abs(tree.x - camera.x) > halfW + 50 || Math.abs(tree.y - camera.y) > halfH + 50) continue;
      drawPalmTree(tree, nowSec);
    }

    // 2E. RON-99 HYPER-OCTANE Gas Stations & LEONIDA GRID High-Voltage Power Substations!
    for (let gi = 0; gi < gasStations.length; gi++) {
      const gs = gasStations[gi];
      if (Math.abs(gs.x - camera.x) > halfW + 100 || Math.abs(gs.y - camera.y) > halfH + 100) continue;
      ctx.save();
      ctx.translate(gs.x, gs.y);
      // Concrete Forecourt Pad
      ctx.fillStyle = gs.exploded ? '#1c1917' : '#475569';
      ctx.fillRect(-48, -24, 96, 48);
      ctx.strokeStyle = gs.exploded ? '#44403c' : '#facc15';
      ctx.lineWidth = 2;
      ctx.strokeRect(-46, -22, 92, 44);

      // Twin Fuel Pump Dispensers & Leaking Fuel Slicks
      for (let pi = 0; pi < gs.pumps.length; pi++) {
        const pump = gs.pumps[pi];
        const px = pump.x - gs.x;
        const py = pump.y - gs.y;
        if (pump.leaking && !pump.exploded) {
          ctx.fillStyle = 'rgba(249, 115, 22, 0.42)';
          ctx.beginPath(); ctx.ellipse(px, py + 4, 18 + Math.sin(nowSec * 14) * 3, 11, 0.2, 0, Math.PI * 2); ctx.fill();
        }
        ctx.fillStyle = pump.exploded ? '#09090b' : '#dc2626';
        ctx.fillRect(px - 8, py - 6, 16, 12);
        ctx.fillStyle = pump.exploded ? '#27272a' : '#f8fafc';
        ctx.fillRect(px - 5, py - 4, 10, 5);
      }

      // Overhead Illuminated RON-99 Canopy (or Scorched Steel Skeleton!)
      if (gs.exploded) {
        ctx.strokeStyle = '#292524';
        ctx.lineWidth = 3;
        ctx.strokeRect(-42, -16, 84, 32);
        ctx.beginPath();
        ctx.moveTo(-42, -16); ctx.lineTo(42, 16);
        ctx.moveTo(42, -16); ctx.lineTo(-42, 16);
        ctx.stroke();
      } else {
        const blackedOut = isBlackedOutAt(gs.x, gs.y);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
        ctx.fillRect(-40, -13, 86, 32);
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(-43, -17, 86, 34);
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(-43, -17, 86, 6);
        ctx.fillRect(-43, 11, 86, 6);
        if (!blackedOut && lightsOn) {
          ctx.shadowColor = '#fb923c';
          ctx.shadowBlur = 14;
        }
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 8.5px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('⛽ RON-99 OCTANE', 0, 3);
      }
      ctx.restore();
    }

    for (let ni = 0; ni < powerNodes.length; ni++) {
      const pn = powerNodes[ni];
      if (Math.abs(pn.x - camera.x) > halfW + 90 || Math.abs(pn.y - camera.y) > halfH + 90) continue;
      ctx.save();
      ctx.translate(pn.x, pn.y);
      // Fenced Transformer Pad
      ctx.fillStyle = pn.destroyed ? '#18181b' : '#334155';
      ctx.fillRect(-30, -24, 60, 48);
      ctx.strokeStyle = pn.destroyed ? '#ef4444' : '#38bdf8';
      ctx.lineWidth = 2;
      ctx.strokeRect(-30, -24, 60, 48);

      // Twin HV Transformer Cores & Copper Coils
      for (const sx of [-13, 13]) {
        ctx.fillStyle = pn.destroyed ? '#27272a' : '#475569';
        ctx.fillRect(sx - 9, -14, 18, 28);
        ctx.fillStyle = pn.destroyed ? '#451a03' : '#d97706';
        ctx.beginPath(); ctx.arc(sx, -5, 4.5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(sx, 6, 4.5, 0, Math.PI * 2); ctx.fill();
      }

      if (!pn.destroyed) {
        // Live HV Plasma Arc between Busbars
        if (Math.sin(nowSec * 16 + ni) > -0.2) {
          ctx.strokeStyle = '#00f0ff';
          ctx.lineWidth = 1.8;
          ctx.shadowColor = '#00f0ff';
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.moveTo(-13, -5);
          ctx.lineTo(0, -8 + Math.sin(nowSec * 45) * 4);
          ctx.lineTo(13, -5);
          ctx.stroke();
        }
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#e0f2fe';
        ctx.font = 'bold 8px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('⚡ HV GRID', 0, -28);
      } else {
        // Pulsing Red Blackout Hazard Beacon!
        const pulse = 0.45 + 0.55 * Math.abs(Math.sin(nowSec * 7));
        ctx.fillStyle = `rgba(239, 68, 68, ${pulse.toFixed(2)})`;
        ctx.beginPath(); ctx.arc(0, 0, 10 + pulse * 8, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fca5a5';
        ctx.font = 'bold 8px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`BLACKOUT ${Math.ceil(pn.blackoutTimer)}S`, 0, -28);
      }
      ctx.restore();
    }

    // 3. Pickups, Payphones & Checkpoint Rings
    for (const pk of pickups) {
      if (pk.respawnTimer > 0) continue;
      if (Math.abs(pk.x - camera.x) > halfW || Math.abs(pk.y - camera.y) > halfH) continue;
      ctx.save();
      ctx.translate(pk.x, pk.y);
      ctx.rotate(nowSec * 2.2);
      const col = pk.kind === 'health' ? '#ff2a55' : (pk.kind === 'armor' ? '#00e5ff' : (pk.kind === 'railgun' ? '#00f0ff' : (pk.kind === 'emp' ? '#a855f7' : '#ffe600')));
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-11, -11, 22, 22);
      ctx.strokeStyle = col;
      ctx.lineWidth = 2;
      ctx.shadowColor = col;
      ctx.shadowBlur = 12;
      ctx.strokeRect(-11, -11, 22, 22);
      ctx.restore();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(pk.kind.toUpperCase(), pk.x, pk.y - 16);
    }

    for (const ph of payphones) {
      if (Math.abs(ph.x - camera.x) > halfW || Math.abs(ph.y - camera.y) > halfH) continue;
      const pulse = (Math.sin(nowSec * 6) + 1) * 0.5;
      ctx.save();
      ctx.translate(ph.x, ph.y);
      if (!activeMission) {
        ctx.strokeStyle = `rgba(57, 255, 20, ${0.85 - pulse * 0.65})`;
        ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.arc(0, 0, 14 + pulse * 24, 0, Math.PI * 2); ctx.stroke();
      }
      ctx.fillStyle = '#059669';
      ctx.fillRect(-9, -9, 18, 18);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(-6, -6, 12, 12);
      ctx.strokeStyle = '#39ff14';
      ctx.strokeRect(-9, -9, 18, 18);
      ctx.restore();
    }

    if (activeMission && activeMission.type === 'checkpoint' && activeMission.checkpoints.length > 0) {
      const cp = activeMission.checkpoints[0];
      ctx.save();
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 4;
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 16;
      ctx.beginPath(); ctx.arc(cp.x, cp.y, 46 + Math.sin(nowSec * 6) * 6, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
    }

    if (customWaypoint) {
      ctx.save();
      ctx.strokeStyle = '#ff2a85';
      ctx.lineWidth = 3.5;
      ctx.beginPath(); ctx.arc(customWaypoint.x, customWaypoint.y, 34 + Math.sin(nowSec * 7) * 6, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
    }

    // 4. Land/Bridge Pedestrians & On-Foot Player
    for (const p of peds) {
      if (p.inWater) continue;
      if (Math.abs(p.x - camera.x) > halfW || Math.abs(p.y - camera.y) > halfH) continue;
      drawPed(p);
    }
    if (!player.vehicle && player.z <= 0 && !player.inWater) {
      drawPlayerOnFoot(nowSec);
    }

    // 5. Land & Bridge-Deck Vehicles (z = 1 — generous margin for colossal 468x440 Jumbo 747-8!)
    for (const v of vehicles) {
      if (!v.isAirborne && !onWaterLayer(v) && Math.abs(v.x - camera.x) <= halfW + 240 && Math.abs(v.y - camera.y) <= halfH + 240) {
        drawVehicle(v, lightsOn);
      }
    }

    // 6. Bullets, Air-to-Ground Missiles, Hyper-Velocity Railgun Plasma Beams, Shockwaves & Particles
    for (const rb of railBeams) {
      ctx.save();
      const alpha = Math.max(0, rb.life / rb.maxLife);
      ctx.strokeStyle = `rgba(0, 240, 255, ${alpha})`;
      ctx.lineWidth = 8 * alpha;
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 22;
      ctx.beginPath(); ctx.moveTo(rb.x1, rb.y1); ctx.lineTo(rb.x2, rb.y2); ctx.stroke();
      ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.lineWidth = 2.5 * alpha;
      ctx.beginPath(); ctx.moveTo(rb.x1, rb.y1); ctx.lineTo(rb.x2, rb.y2); ctx.stroke();
      ctx.restore();
    }

    for (const sw of shockwaves) {
      ctx.save();
      const alpha = Math.max(0, sw.life / sw.maxLife);
      ctx.strokeStyle = sw.color;
      ctx.globalAlpha = alpha;
      ctx.lineWidth = 5 * alpha + 1.5;
      ctx.shadowColor = sw.color;
      ctx.shadowBlur = 16;
      ctx.beginPath(); ctx.arc(sw.x, sw.y, sw.r, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
    }

    for (const b of bullets) {
      const yLift = b.airToGround ? (b.alt || 0) * 0.48 : 0;
      if (b.airToGround) {
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 23, 68, 0.55)';
        ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.arc(b.targetX, b.targetY, 18, 0, Math.PI * 2); ctx.stroke();
        ctx.restore();
      }
      ctx.save();
      ctx.strokeStyle = b.color;
      ctx.lineWidth = b.explosive ? 4.4 : 2.2;
      ctx.shadowColor = b.color;
      ctx.shadowBlur = 9;
      ctx.beginPath();
      ctx.moveTo(b.x, b.y - yLift);
      ctx.lineTo(b.x - b.vx * 0.028, (b.y - yLift) - b.vy * 0.028);
      ctx.stroke();
      ctx.restore();
    }

    for (const pt of particles) {
      if (Math.abs(pt.x - camera.x) > halfW || Math.abs(pt.y - camera.y) > halfH) continue;
      ctx.save();
      ctx.globalAlpha = Math.max(0, pt.life / pt.maxLife);
      ctx.fillStyle = pt.color;
      ctx.beginPath(); ctx.arc(pt.x, pt.y, pt.r, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }

    // 6A. Pressurized Firetruck Hydro-Cannon Water Arcs!
    if (waterJets.length > 0) {
      ctx.save();
      for (let i = 0; i < waterJets.length; i++) {
        const wj = waterJets[i];
        if (Math.abs(wj.x - camera.x) > halfW || Math.abs(wj.y - camera.y) > halfH) continue;
        const a = Math.max(0.15, wj.life / wj.maxLife);
        ctx.strokeStyle = `rgba(125, 211, 252, ${(a * 0.85).toFixed(2)})`;
        ctx.lineWidth = wj.r * 1.45;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(wj.x, wj.y);
        ctx.lineTo(wj.x - wj.vx * 0.032, wj.y - wj.vy * 0.032);
        ctx.stroke();
        ctx.fillStyle = `rgba(240, 249, 255, ${(a * 0.92).toFixed(2)})`;
        ctx.beginPath();
        ctx.arc(wj.x, wj.y, wj.r * 0.65, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // 6B. 3D Bouncing Masonry, Concrete, Rebar, Tree Splinters & Shattered Glass Shrapnel (Settles into settledDebrisGrid!)
    for (let i = 0; i < debrisChunks.length; i++) {
      const dc = debrisChunks[i];
      if (Math.abs(dc.x - camera.x) > halfW || Math.abs(dc.y - camera.y) > halfH) continue;
      ctx.save();
      // Ground contact / airborne drop shadow
      ctx.fillStyle = 'rgba(8, 10, 14, 0.34)';
      ctx.beginPath();
      ctx.ellipse(dc.x + dc.z * 0.26 + 2, dc.y + dc.z * 0.26 + 2, dc.w * 0.52, dc.h * 0.45, dc.rot, 0, Math.PI * 2);
      ctx.fill();

      // Elevated spinning masonry / glass / wood shard
      ctx.translate(dc.x, dc.y - dc.z);
      ctx.rotate(dc.rot);
      ctx.fillStyle = dc.color;
      ctx.fillRect(-dc.w * 0.5, -dc.h * 0.5, dc.w, dc.h);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.28)';
      ctx.fillRect(-dc.w * 0.5, -dc.h * 0.5, dc.w, Math.max(1.2, dc.h * 0.28));
      ctx.restore();
    }

    // 7. Elevated VICE SKY-RAIL Maglev Guideway, Overhead Bridge Superstructures & Cantilever Intersection Traffic Signals
    drawSkyRailAndTrain(halfW, halfH);
    drawBridgeSuperstructures(minGX, maxGX, minGY, maxGY, lightsOn);
    drawTrafficSignals(minGX, maxGX, minGY, maxGY, lightsOn, isRain, nowSec);

    // 8. Grounded Multi-Tier 2.5D Architecture (Setback Skyscrapers, Courtyards, Rowhouses & Cylinders)
    drawBuildings25D(minGX, maxGX, minGY, maxGY, lightsOn, isRain);

    // 8B. Interactive Rooftop Raindrop Crown Splashes right on top of 2.5D Building Roofs!
    if (rainImpacts.length > 0) {
      for (let i = 0; i < rainImpacts.length; i++) {
        const ri = rainImpacts[i];
        if (ri.kind !== 'roof') continue;
        if (Math.abs(ri.x - camera.x) > halfW + 80 || Math.abs(ri.y - camera.y) > halfH + 80) continue;
        const a = Math.max(0, ri.life / ri.maxLife);
        ctx.strokeStyle = `rgba(224, 242, 254, ${(a * 0.72).toFixed(2)})`;
        ctx.lineWidth = 1.25;
        ctx.beginPath();
        ctx.arc(ri.x, ri.y, ri.r, 0, Math.PI * 2);
        ctx.stroke();
        const crown = (1 - a) * 6 + 1.8;
        ctx.strokeStyle = `rgba(255, 255, 255, ${(a * 0.80).toFixed(2)})`;
        ctx.beginPath();
        ctx.moveTo(ri.x - ri.r * 0.7, ri.y); ctx.lineTo(ri.x - ri.r * 1.1, ri.y - crown);
        ctx.moveTo(ri.x + ri.r * 0.7, ri.y); ctx.lineTo(ri.x + ri.r * 1.1, ri.y - crown);
        ctx.moveTo(ri.x, ri.y - ri.r * 0.5); ctx.lineTo(ri.x, ri.y - ri.r * 0.5 - crown);
        ctx.stroke();
      }
    }

    // 8C. Live Aircraft AGM Missile / Hydra-70 Rocket Ground Strike Target Reticle!
    if (player.vehicle && (player.vehicle.isJet || player.vehicle.isHeli) && player.vehicle.hp > 0) {
      const av = player.vehicle;
      if (!av.isHeli || !av.heliLanded) {
        const { tx, ty } = getAircraftStrikeTarget(av);
        const pulse = 0.5 + 0.5 * Math.sin(nowSec * 8.0);
        const rCol = av.isHeli ? '#fb923c' : '#38bdf8';
        ctx.save();
        // Dashed HUD targeting vector from aircraft nose to ground strike zone
        ctx.strokeStyle = av.isHeli ? 'rgba(251, 146, 60, 0.34)' : 'rgba(56, 189, 248, 0.36)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([7, 6]);
        ctx.beginPath();
        ctx.moveTo(av.x + Math.cos(av.angle) * (av.w * 0.45), av.y + Math.sin(av.angle) * (av.w * 0.45) - (av.altitude || 0) * 0.24);
        ctx.lineTo(tx, ty);
        ctx.stroke();
        ctx.setLineDash([]);

        // Ground strike crosshair ring & corner brackets
        const rad = (av.isJet ? 26 : 20) + pulse * 4;
        ctx.strokeStyle = rCol;
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.arc(tx, ty, rad, 0, Math.PI * 2);
        ctx.moveTo(tx - rad - 8, ty); ctx.lineTo(tx - rad + 5, ty);
        ctx.moveTo(tx + rad - 5, ty); ctx.lineTo(tx + rad + 8, ty);
        ctx.moveTo(tx, ty - rad - 8); ctx.lineTo(tx, ty - rad + 5);
        ctx.moveTo(tx, ty + rad - 5); ctx.lineTo(tx, ty + rad + 8);
        ctx.stroke();

        ctx.fillStyle = '#ff1744';
        ctx.beginPath(); ctx.arc(tx, ty, 3.2, 0, Math.PI * 2); ctx.fill();

        ctx.font = 'bold 10px monospace';
        ctx.fillStyle = rCol;
        ctx.textAlign = 'center';
        ctx.fillText(av.isJet ? 'AGM TARGET [L-CLICK / CTRL]' : 'ROCKETS [L-CLICK / CTRL]', tx, ty + rad + 15);
        ctx.restore();
      }
    }

    // 8D. High-Tension Carbon Mag-Tow Wrecking-Ball Cables & 4★+ SWAT Tactical Fast-Ropes!
    for (let i = 0; i < vehicles.length; i++) {
      const cv = vehicles[i];
      if (!cv.towTarget) continue;
      const tv = cv.towTarget;
      const ax = cv.x - Math.cos(cv.angle) * (cv.isHeli ? 6 : cv.w * 0.44);
      const ay = cv.y - Math.sin(cv.angle) * (cv.isHeli ? 6 : cv.w * 0.44) - (cv.altitude || 0) * 0.24;
      const bx = tv.x;
      const by = tv.y - (tv.altitude || 0) * 0.24;
      ctx.save();
      ctx.strokeStyle = 'rgba(15, 23, 42, 0.78)';
      ctx.lineWidth = 4.2;
      ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 2.0;
      ctx.setLineDash([6, 4]);
      ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#00f0ff';
      ctx.beginPath(); ctx.arc(bx, by, 4.5, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }

    for (let i = 0; i < swatRopes.length; i++) {
      const sr = swatRopes[i];
      if (Math.abs(sr.x - camera.x) > halfW + 120 || Math.abs(sr.y - camera.y) > halfH + 120) continue;
      const topY = sr.y - (sr.alt || 140) * 0.24;
      const botY = sr.y;
      const manY = topY + (botY - topY) * Math.min(1, sr.progress);
      ctx.save();
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.moveTo(sr.x, topY);
      ctx.lineTo(sr.x + Math.sin(nowSec * 9 + i) * 4, botY);
      ctx.stroke();
      // Rappelling SWAT Officer
      ctx.fillStyle = '#0f172a';
      ctx.beginPath(); ctx.arc(sr.x, manY, 6.2, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.6;
      ctx.stroke();
      ctx.restore();
    }

    // 9. High-Altitude Commercial Airliners, Jets, Falcon Gunships & VCPD Police Chopper (+ Searchlight!)
    for (const v of vehicles) {
      if (v.isAirborne && Math.abs(v.x - camera.x) <= halfW + 580 && Math.abs(v.y - camera.y) <= halfH + 580) {
        drawVehicle(v, lightsOn);
      }
    }

    // 9B. High-Altitude Skydiver & Steerable Ram-Air Parachute Canopy!
    if (!player.vehicle && player.z > 0) {
      drawPlayerParachute(nowSec);
    }

    // 10. Standing & Actively Falling Palm Trees (Lush, Burning Crown Inferno, or Charred Trunks) & Streetlamp Pools
    for (const tree of palmTrees) {
      if (tree.fallen) continue;
      if (Math.abs(tree.x - camera.x) > halfW + 50 || Math.abs(tree.y - camera.y) > halfH + 50) continue;
      drawPalmTree(tree, nowSec);
    }

    if (envState.lampStrength > 0.04) {
      const lampR = isRain ? 86 : 68;
      const peakA = ((isRain ? 0.30 : 0.27) * envState.lampStrength).toFixed(3);
      const centerCol = isRain ? `rgba(254, 240, 195, ${peakA})` : `rgba(255, 232, 180, ${peakA})`;
      for (const lamp of streetlamps) {
        if (Math.abs(lamp.x - camera.x) > halfW || Math.abs(lamp.y - camera.y) > halfH) continue;
        if (isBlackedOutAt(lamp.x, lamp.y)) continue;
        const lGrad = ctx.createRadialGradient(lamp.x, lamp.y, 2, lamp.x, lamp.y, lampR);
        lGrad.addColorStop(0, centerCol);
        lGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = lGrad;
        ctx.beginPath(); ctx.arc(lamp.x, lamp.y, lampR, 0, Math.PI * 2); ctx.fill();
      }
    }

    // 11. Floating Cash Popups & GPS Objective Arrow
    for (const ft of floatingTexts) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, ft.life / ft.maxLife);
      ctx.font = 'bold 16px monospace';
      ctx.fillStyle = ft.color;
      ctx.textAlign = 'center';
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    }

    drawMissionArrow();
    ctx.restore();

    // 11B. Live Airborne WLTV SKY-CAM 6 Picture-in-Picture (PiP) TV Broadcast Feed!
    renderNewsPiP(nowSec);

    // 12. Screen-Space 2027 Weather, Ephemeris & Active VCPD Police Pursuit Siren Warning FX
    renderWeatherFX(nowSec);

    // 13. High-Res Local Radar Minimap
    renderMinimap();
  }

  function renderNewsPiP(nowSec) {
    if (!newsCtx || !newsCamCanvas) return;
    const pipEl = document.getElementById('news-pip');
    if (pipEl && pipEl.classList.contains('hidden')) return;

    const pw = newsCamCanvas.width;
    const ph = newsCamCanvas.height;
    if (canvas.width < 16 || canvas.height < 16) return;
    // Dynamic airborne telephoto crop centered on action with subtle helicopter gimbal sway
    const swayX = Math.sin(nowSec * 1.9) * 26 + Math.cos(nowSec * 4.3) * 7;
    const swayY = Math.cos(nowSec * 1.5) * 18 + Math.sin(nowSec * 3.7) * 6;
    let cropW = Math.min(canvas.width * 0.72, 420);
    let cropH = cropW * (ph / pw);
    if (cropH > canvas.height) {
      cropH = canvas.height;
      cropW = Math.min(canvas.width, cropH * (pw / ph));
    }
    const sx = Math.max(0, Math.min(canvas.width - cropW, canvas.width * 0.5 - cropW * 0.5 + swayX));
    const sy = Math.max(0, Math.min(canvas.height - cropH, canvas.height * 0.5 - cropH * 0.5 + swayY));

    newsCtx.clearRect(0, 0, pw, ph);
    newsCtx.drawImage(canvas, sx, sy, cropW, cropH, 0, 0, pw, ph);

    // Broadcast TV Scanlines & Subtle Cool Telephoto Tint
    newsCtx.fillStyle = 'rgba(14, 165, 233, 0.08)';
    newsCtx.fillRect(0, 0, pw, ph);
    newsCtx.fillStyle = 'rgba(0, 0, 0, 0.18)';
    for (let y = 0; y < ph; y += 3) {
      newsCtx.fillRect(0, y, pw, 1);
    }

    // Airborne Gimbal Tracking Brackets & Telemetry Overlay
    const cx = pw * 0.5 + Math.sin(nowSec * 3.1) * 4;
    const cy = ph * 0.5 + Math.cos(nowSec * 2.7) * 3;
    newsCtx.strokeStyle = 'rgba(255, 255, 255, 0.78)';
    newsCtx.lineWidth = 1.3;
    newsCtx.beginPath();
    newsCtx.moveTo(cx - 26, cy - 12); newsCtx.lineTo(cx - 26, cy - 20); newsCtx.lineTo(cx - 16, cy - 20);
    newsCtx.moveTo(cx + 26, cy - 12); newsCtx.lineTo(cx + 26, cy - 20); newsCtx.lineTo(cx + 16, cy - 20);
    newsCtx.moveTo(cx - 26, cy + 12); newsCtx.lineTo(cx - 26, cy + 20); newsCtx.lineTo(cx - 16, cy + 20);
    newsCtx.moveTo(cx + 26, cy + 12); newsCtx.lineTo(cx + 26, cy + 20); newsCtx.lineTo(cx + 16, cy + 20);
    newsCtx.moveTo(cx - 5, cy); newsCtx.lineTo(cx + 5, cy);
    newsCtx.moveTo(cx, cy - 5); newsCtx.lineTo(cx, cy + 5);
    newsCtx.stroke();

    const spdMph = Math.round((player.vehicle ? Math.hypot(player.vehicle.vx, player.vehicle.vy) : Math.hypot(player.vx, player.vy)) * 0.30);
    newsCtx.fillStyle = 'rgba(2, 6, 23, 0.68)';
    newsCtx.fillRect(6, ph - 18, pw - 12, 14);
    newsCtx.fillStyle = '#f8fafc';
    newsCtx.font = 'bold 9px monospace';
    newsCtx.textAlign = 'left';
    newsCtx.fillText(`ZOOM 18.4X // ${spdMph} MPH`, 10, ph - 8);
    newsCtx.fillStyle = '#facc15';
    newsCtx.textAlign = 'right';
    newsCtx.fillText(envState.clockStr, pw - 10, ph - 8);
  }

  function drawSkyRailAndTrain(halfW, halfH) {
    const { x1, y1, x2, y2 } = SKYRAIL_BOUNDS;
    // Only draw if Sky-Rail intersects camera view
    if (camera.x + halfW < x1 - 100 || camera.x - halfW > x2 + 100 || camera.y + halfH < y1 - 100 || camera.y - halfH > y2 + 100) return;

    ctx.save();
    // Dynamic Solar Elevated Track Shadow on Street
    ctx.strokeStyle = `rgba(0, 0, 0, ${Math.min(0.45, envState.shadowAlpha + 0.08).toFixed(2)})`;
    ctx.lineWidth = 18;
    ctx.strokeRect(x1 + 6 + envState.shadowDX * 0.65, y1 + 8 + envState.shadowDY * 0.65, x2 - x1, y2 - y1);

    // Steel Maglev Guideway & Glowing Cyan Energy Rail
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 14;
    ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.65)';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);

    // Draw 4 Articulated Maglev Sky-Train Cars
    for (let c = 0; c < skyTrain.cars; c++) {
      const pt = getSkyRailPoint(skyTrain.progress - c * 68);
      ctx.save();
      ctx.translate(pt.x, pt.y);
      ctx.rotate(pt.angle);
      // Drop shadow
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.fillRect(-28, 12, 58, 18);
      // Sleek White/Cyan Carbon Bullet-Train Car
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.roundRect(-30, -10, 60, 20, c === 0 ? 8 : 4);
      ctx.fill();
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 2;
      ctx.stroke();
      // Panoramic illuminated passenger skylight
      ctx.fillStyle = c === 0 ? '#ff2a85' : '#38bdf8';
      ctx.fillRect(-20, -4, 40, 8);
      ctx.restore();
    }
    ctx.restore();
  }

  function drawTrafficSignals(minGX, maxGX, minGY, maxGY, lightsOn, isRain, nowSec) {
    const drawSignalHead = (hx, hy, horiz, state) => {
      const activeCol = state === 'green' ? '#10b981' : (state === 'amber' ? '#f59e0b' : '#ef4444');
      const glowRGBA  = state === 'green'
        ? 'rgba(16, 185, 129, 0.34)'
        : (state === 'amber' ? 'rgba(245, 158, 11, 0.36)' : 'rgba(239, 68, 68, 0.36)');

      // Soft colored reflection pool on wet or twilight/night intersection asphalt
      if (lightsOn || isRain || envState.lampStrength > 0.12) {
        const g = ctx.createRadialGradient(hx, hy, 1, hx, hy, isRain ? 26 : 19);
        g.addColorStop(0, glowRGBA);
        g.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(hx, hy, isRain ? 26 : 19, 0, Math.PI * 2); ctx.fill();
      }

      // Dark anodized aluminum 3-aspect signal housing + yellow highway border trim
      const bw = horiz ? 16 : 6.5;
      const bh = horiz ? 6.5 : 16;
      ctx.fillStyle = '#18181b';
      ctx.fillRect(hx - bw * 0.5, hy - bh * 0.5, bw, bh);
      ctx.strokeStyle = '#ca8a04';
      ctx.lineWidth = 0.9;
      ctx.strokeRect(hx - bw * 0.5, hy - bh * 0.5, bw, bh);

      // 3 individual Red / Amber / Green LEDs
      const states = ['red', 'amber', 'green'];
      const dimCols = ['#3f1518', '#3d280a', '#0c3326'];
      for (let k = 0; k < 3; k++) {
        const lx = horiz ? (hx - 4.8 + k * 4.8) : hx;
        const ly = horiz ? hy : (hy - 4.8 + k * 4.8);
        const isLit = states[k] === state;
        ctx.fillStyle = isLit ? activeCol : dimCols[k];
        ctx.beginPath();
        ctx.arc(lx, ly, isLit ? 1.85 : 1.35, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    for (let gy = minGY; gy <= maxGY; gy++) {
      for (let gx = minGX; gx <= maxGX; gx++) {
        if (!isIntersectionTile(gx, gy)) continue;
        const wx = gx * TILE_SIZE;
        const wy = gy * TILE_SIZE;
        const sig = getTrafficSignal(gx, gy, nowSec);

        const hasN = isRoadOrBridge(gx, gy - 1);
        const hasS = isRoadOrBridge(gx, gy + 1);
        const hasW = isRoadOrBridge(gx - 1, gy);
        const hasE = isRoadOrBridge(gx + 1, gy);

        ctx.save();
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 2.6;

        // NW mast-arm cantilevered over Southbound lane (x = wx + 48)
        if (hasN) {
          ctx.beginPath(); ctx.moveTo(wx + 10, wy + 12); ctx.lineTo(wx + 58, wy + 12); ctx.stroke();
          ctx.fillStyle = '#475569'; ctx.beginPath(); ctx.arc(wx + 10, wy + 12, 3.2, 0, Math.PI * 2); ctx.fill();
          drawSignalHead(wx + 48, wy + 12, true, sig.ns);
        }
        // SE mast-arm cantilevered over Northbound lane (x = wx + 112)
        if (hasS) {
          ctx.beginPath(); ctx.moveTo(wx + TILE_SIZE - 10, wy + TILE_SIZE - 12); ctx.lineTo(wx + TILE_SIZE - 58, wy + TILE_SIZE - 12); ctx.stroke();
          ctx.fillStyle = '#475569'; ctx.beginPath(); ctx.arc(wx + TILE_SIZE - 10, wy + TILE_SIZE - 12, 3.2, 0, Math.PI * 2); ctx.fill();
          drawSignalHead(wx + TILE_SIZE - 48, wy + TILE_SIZE - 12, true, sig.ns);
        }
        // NE mast-arm cantilevered over Westbound lane (y = wy + 48)
        if (hasE) {
          ctx.beginPath(); ctx.moveTo(wx + TILE_SIZE - 12, wy + 10); ctx.lineTo(wx + TILE_SIZE - 12, wy + 58); ctx.stroke();
          ctx.fillStyle = '#475569'; ctx.beginPath(); ctx.arc(wx + TILE_SIZE - 12, wy + 10, 3.2, 0, Math.PI * 2); ctx.fill();
          drawSignalHead(wx + TILE_SIZE - 12, wy + 48, false, sig.ew);
        }
        // SW mast-arm cantilevered over Eastbound lane (y = wy + 112)
        if (hasW) {
          ctx.beginPath(); ctx.moveTo(wx + 12, wy + TILE_SIZE - 10); ctx.lineTo(wx + 12, wy + TILE_SIZE - 58); ctx.stroke();
          ctx.fillStyle = '#475569'; ctx.beginPath(); ctx.arc(wx + 12, wy + TILE_SIZE - 10, 3.2, 0, Math.PI * 2); ctx.fill();
          drawSignalHead(wx + 12, wy + TILE_SIZE - 48, false, sig.ew);
        }
        ctx.restore();
      }
    }
  }

  function renderWeatherFX(nowSec) {
    // 1. Continuous 24-Hour Atmospheric Sky Tint & Directional Dawn/Sunset Horizon Glow
    ctx.save();
    ctx.fillStyle = envState.ambientRGBA;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (envState.horizonSide && envState.horizonAlpha > 0.01) {
      const hGrad = envState.horizonSide === 'east'
        ? ctx.createLinearGradient(canvas.width, 0, canvas.width * 0.18, 0)
        : ctx.createLinearGradient(0, 0, canvas.width * 0.82, 0);
      hGrad.addColorStop(0, `rgba(251, 146, 60, ${envState.horizonAlpha.toFixed(3)})`);
      hGrad.addColorStop(0.42, `rgba(244, 63, 94, ${(envState.horizonAlpha * 0.55).toFixed(3)})`);
      hGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = hGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    ctx.restore();

    // 2. Dynamic Weather Overlays (Monsoon Rain + Lightning, Coastal Mist, Miami Heatwave)
    const wm = WEATHER_MODES[weatherMode].id;
    if (wm === 'rain') {
      ctx.save();
      ctx.strokeStyle = 'rgba(186, 230, 253, 0.34)';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      const count = 130;
      for (let i = 0; i < count; i++) {
        const rx = ((i * 197 + nowSec * 950) % (canvas.width + 200)) - 100;
        const ry = ((i * 313 + nowSec * 1550) % (canvas.height + 200)) - 100;
        ctx.moveTo(rx, ry);
        ctx.lineTo(rx - 14, ry + 32);
      }
      ctx.stroke();
      if (lightningFlash > 0.02) {
        ctx.fillStyle = `rgba(224, 242, 254, ${lightningFlash * 0.42})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      ctx.restore();
    } else if (wm === 'fog') {
      const fogGrad = ctx.createRadialGradient(
        canvas.width * 0.5, canvas.height * 0.5, canvas.width * 0.15,
        canvas.width * 0.5, canvas.height * 0.5, canvas.width * 0.7
      );
      fogGrad.addColorStop(0, 'rgba(15, 23, 42, 0.05)');
      fogGrad.addColorStop(1, 'rgba(56, 189, 248, 0.24)');
      ctx.fillStyle = fogGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else if (wm === 'sunburst') {
      ctx.fillStyle = `rgba(251, 146, 60, ${(0.09 * (1 - envState.lampStrength * 0.7)).toFixed(3)})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // 3. Active Police Pursuit Scene Atmosphere: Alternating Red/Blue VCPD Siren Strobe Vignette!
    const wLevel = Math.floor(player.wanted);
    if (wLevel >= 1) {
      ctx.save();
      const intensity = 0.08 + wLevel * 0.032;
      const sirenWave = Math.sin(nowSec * (6.2 + wLevel * 0.8));
      const redAlpha = Math.max(0, sirenWave) * intensity;
      const blueAlpha = Math.max(0, -sirenWave) * intensity;
      const edgeW = Math.min(220, canvas.width * 0.18);

      if (redAlpha > 0.005) {
        const lGrad = ctx.createLinearGradient(0, 0, edgeW, 0);
        lGrad.addColorStop(0, `rgba(255, 23, 68, ${redAlpha.toFixed(3)})`);
        lGrad.addColorStop(1, 'rgba(255, 23, 68, 0)');
        ctx.fillStyle = lGrad;
        ctx.fillRect(0, 0, edgeW, canvas.height);
      }
      if (blueAlpha > 0.005) {
        const rGrad = ctx.createLinearGradient(canvas.width, 0, canvas.width - edgeW, 0);
        rGrad.addColorStop(0, `rgba(37, 99, 235, ${blueAlpha.toFixed(3)})`);
        rGrad.addColorStop(1, 'rgba(37, 99, 235, 0)');
        ctx.fillStyle = rGrad;
        ctx.fillRect(canvas.width - edgeW, 0, edgeW, canvas.height);
      }
      // Subtle top emergency bar pulse at 3+ Wanted Stars
      if (wLevel >= 3) {
        const topA = (0.04 + 0.04 * Math.abs(sirenWave)) * (wLevel / 6);
        const tGrad = ctx.createLinearGradient(0, 0, 0, 75);
        tGrad.addColorStop(0, sirenWave > 0 ? `rgba(255, 23, 68, ${topA.toFixed(3)})` : `rgba(56, 189, 248, ${topA.toFixed(3)})`);
        tGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = tGrad;
        ctx.fillRect(0, 0, canvas.width, 75);
      }
      ctx.restore();
    }
  }

  function drawPed(p) {
    const sf = window.SpriteForge;
    const isMoving = Math.hypot(p.vx, p.vy) > 10;
    const nowSec = performance.now() * 0.001;

    ctx.save();
    ctx.translate(p.x, p.y);
    if (p.inWater && sf.getSwimmingSprite) {
      const swimFrame = Math.floor(nowSec * (isMoving ? 9 : 4) + p.x * 0.05) % 6;
      const swimSprite = sf.getSwimmingSprite(p.color, p.skinColor || '#f5d0b5', swimFrame, isMoving);
      const r1 = 11 + ((nowSec * 16 + p.x) % 12);
      ctx.strokeStyle = 'rgba(224, 242, 254, 0.45)';
      ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.arc(0, 0, r1, 0, Math.PI * 2); ctx.stroke();
      ctx.rotate(p.angle);
      ctx.drawImage(swimSprite, -swimSprite.width * 0.5, -swimSprite.height * 0.5);
      ctx.restore();
      return;
    }

    const frameIdx = isMoving ? (Math.floor(p.stepPhase) % 4) : 0;
    const hasGun = p.role === 'police' || p.role === 'bounty' || p.role === 'gang' || (p.isAggressive && p.hostileTimer > 0);
    const sprite = sf.getCharacterSprite(p.color, p.skinColor || '#f5d0b5', frameIdx, hasGun);

    if (p.burnTimer && p.burnTimer > 0) {
      const flick = Math.sin(nowSec * 32 + p.x) * 3;
      const fGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, 22 + flick);
      fGrad.addColorStop(0, 'rgba(254, 240, 138, 0.85)');
      fGrad.addColorStop(0.55, 'rgba(249, 115, 22, 0.58)');
      fGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');
      ctx.fillStyle = fGrad;
      ctx.beginPath(); ctx.arc(0, 0, 22 + flick, 0, Math.PI * 2); ctx.fill();
    } else if (p.role === 'gang') {
      // Subtle gang turf color ring beneath armed crew members
      ctx.strokeStyle = p.color;
      ctx.globalAlpha = 0.34;
      ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.arc(0, 0, 13.5, 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = 1;
    }
    ctx.rotate(p.angle);
    ctx.drawImage(sprite, -22, -22);
    if (p.role === 'bounty') {
      ctx.strokeStyle = '#ff1744';
      ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(0, 0, 19, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.restore();
  }

  function drawPlayerOnFoot(nowSec = 0) {
    const sf = window.SpriteForge;
    const isMoving = Math.hypot(player.vx, player.vy) > 10;

    ctx.save();
    ctx.translate(player.x, player.y);

    if (player.inWater && sf.getSwimmingSprite) {
      // Dedicated animated freestyle crawl / water-treading swimmer sprite + hydro wake!
      const swimFrame = Math.floor(nowSec * (isMoving ? 9.5 : 4.2)) % 6;
      const swimSprite = sf.getSwimmingSprite('#d9483b', '#f5d0b5', swimFrame, isMoving);
      const r1 = 13 + ((nowSec * 17) % 15);
      ctx.strokeStyle = 'rgba(224, 242, 254, 0.52)';
      ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.arc(0, 0, r1, 0, Math.PI * 2); ctx.stroke();

      ctx.rotate(player.angle);
      if (isMoving) {
        // V-shaped hydrodynamic bow wake trailing behind swimmer
        ctx.strokeStyle = 'rgba(240, 249, 255, 0.50)';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(10, -4); ctx.lineTo(-24, -15);
        ctx.moveTo(10, 4);  ctx.lineTo(-24, 15);
        ctx.stroke();
      }
      ctx.drawImage(swimSprite, -swimSprite.width * 0.5, -swimSprite.height * 0.5);
      ctx.restore();
      return;
    }

    const frameIdx = isMoving ? (Math.floor(player.stepPhase) % 4) : 0;
    const sprite = sf.getCharacterSprite('#d9483b', '#f5d0b5', frameIdx, true);
    ctx.rotate(player.angle);
    ctx.drawImage(sprite, -22, -22);
    ctx.restore();
  }

  function drawPlayerParachute(nowSec = 0) {
    const sf = window.SpriteForge;
    const z = player.z || 0;
    const liftY = z * 0.56;
    const pScale = 1 + Math.min(0.45, z * 0.0018);

    // 1. Pulsing Ground Drop-Zone Target Reticle & Far-Cast Solar Shadow
    ctx.save();
    const pulse = (Math.sin(nowSec * 6.5) + 1) * 0.5;
    ctx.strokeStyle = `rgba(0, 240, 255, ${(0.35 + pulse * 0.35).toFixed(2)})`;
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 5]);
    ctx.beginPath();
    ctx.arc(player.x, player.y, 16 + z * 0.08, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.32)';
    ctx.beginPath();
    ctx.ellipse(player.x + envState.shadowDX * 0.8, player.y + envState.shadowDY * 0.8, 12, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 2. Airborne Skydiver & Deployed Multi-Cell Ram-Air Parachute Canopy
    ctx.save();
    ctx.translate(player.x, player.y - liftY);
    ctx.scale(pScale, pScale);

    const sprite = sf.getCharacterSprite('#d9483b', '#f5d0b5', 1, false);
    ctx.save();
    ctx.rotate(player.angle);
    ctx.drawImage(sprite, -22, -22);
    ctx.restore();

    if (player.parachute && player.parachute.deployed) {
      ctx.save();
      ctx.rotate((player.parachute.roll || 0) * 0.8);
      // Suspension rigging lines from harness to canopy
      ctx.strokeStyle = 'rgba(226, 232, 240, 0.72)';
      ctx.lineWidth = 1.1;
      for (const lx of [-24, -12, 12, 24]) {
        ctx.beginPath();
        ctx.moveTo(lx * 0.18, -3);
        ctx.lineTo(lx, -22);
        ctx.stroke();
      }
      // Curved 5-cell vibrant Vice Ram-Air Wing Canopy
      const cellCols = ['#ff2a85', '#f8fafc', '#00f0ff', '#f8fafc', '#ff2a85'];
      const cellW = 11;
      const startX = -27.5;
      for (let c = 0; c < 5; c++) {
        const cx = startX + c * cellW;
        const arch = Math.abs(c - 2) * 1.6;
        ctx.fillStyle = cellCols[c];
        ctx.beginPath();
        ctx.roundRect(cx, -34 + arch, cellW - 0.8, 14, 3);
        ctx.fill();
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      ctx.restore();
    }
    ctx.restore();
  }

  function drawVehicle(v, lightsOn) {
    const sf = window.SpriteForge;
    const isWrecked = Boolean(v.exploded || v.wrecked || v.hp <= 0);
    const isDamaged = isWrecked || v.hp < v.maxHp * 0.45;
    const sprite = sf.getVehicleSprite(v.typeKey, v.color, isDamaged, isWrecked);

    ctx.save();
    ctx.translate(v.x, v.y);

    // Flickering Wreckage Firelight Pool underneath actively burning destroyed vehicles & crashed aircraft!
    if (isWrecked && (v.wreckBurnTimer || 0) > 0) {
      const baseR = v.isAirliner ? 185 : (v.isJet ? 92 : 48);
      const flickR = baseR + Math.sin(performance.now() * 0.022 + v.x) * 8;
      const wGrad = ctx.createRadialGradient(0, 0, 6, 0, 0, flickR);
      wGrad.addColorStop(0, 'rgba(251, 146, 60, 0.48)');
      wGrad.addColorStop(0.55, 'rgba(239, 68, 68, 0.20)');
      wGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = wGrad;
      ctx.beginPath(); ctx.arc(0, 0, flickR, 0, Math.PI * 2); ctx.fill();
    }

    // Volumetric Sweeping Searchlight Cone & Tactical Lock Reticle underneath VCPD Police Helicopter!
    if (v.isPolice && v.isHeli && v.hp > 0 && player.wanted > 0) {
      const toPX = player.x - v.x;
      const toPY = player.y - v.y;
      const d = Math.min(260, Math.hypot(toPX, toPY));
      const ang = Math.atan2(toPY, toPX);
      const sx = Math.cos(ang) * d * 0.65;
      const sy = Math.sin(ang) * d * 0.65;
      const coneGrad = ctx.createRadialGradient(sx, sy, 6, sx, sy, 98);
      coneGrad.addColorStop(0, 'rgba(224, 242, 254, 0.44)');
      coneGrad.addColorStop(0.6, 'rgba(56, 189, 248, 0.18)');
      coneGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = coneGrad;
      ctx.beginPath(); ctx.arc(sx, sy, 98, 0, Math.PI * 2); ctx.fill();

      if (d < 250) {
        ctx.strokeStyle = 'rgba(255, 23, 68, 0.62)';
        ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.arc(sx, sy, 28 + Math.sin(performance.now() * 0.01) * 4, 0, Math.PI * 2); ctx.stroke();
      }
    }

    const alt = v.isAirborne ? (v.altitude || (v.isHighTransit ? 250 : 32)) : 0;

    if (v.isAirborne) {
      // Cast dynamic high-altitude solar ground shadow far below the aircraft (scaled to true widebody/fighter wingspan)!
      const shX = envState.shadowDX * (0.9 + alt * 0.036);
      const shY = envState.shadowDY * (0.9 + alt * 0.036) + alt * 0.68;
      ctx.save();
      ctx.translate(shX, shY);
      ctx.rotate(v.angle);
      ctx.fillStyle = `rgba(0, 0, 0, ${(envState.shadowAlpha * Math.max(0.32, 0.92 - alt * 0.002)).toFixed(2)})`;
      if (v.isAirliner) {
        //Swept widebody 747-8 ground shadow silhouette
        ctx.beginPath();
        ctx.ellipse(0, 0, 198, 22, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(42, 0); ctx.lineTo(-68, -182); ctx.lineTo(-88, -172); ctx.lineTo(-32, 0);
        ctx.lineTo(-88, 172); ctx.lineTo(-68, 182); ctx.closePath();
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.ellipse(0, 0, v.isJet ? 88 : 42, v.isJet ? 68 : 22, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // Lift aircraft slightly in screen Y & scale cleanly with true vertical altitude!
    if (v.isAirborne) {
      ctx.translate(0, -alt * 0.24);
    }

    ctx.rotate(v.angle);

    if (v.isAirborne) {
      const airScale = 1 + Math.min(v.isAirliner ? 0.34 : 0.56, alt * (v.isAirliner ? 0.0012 : 0.0020));
      ctx.scale(airScale, airScale);
    }

    // Headlight Cones (Photocell-ramped at twilight/night/rain, OR flashed briefly when stressed driver honks horn!)
    const honkFlash = (v.honkVisualTimer || 0) > 0.28;
    if ((lightsOn || envState.lampStrength > 0.22 || honkFlash) && v.hp > 0 && !v.isSkate && !v.isHeli && !(v.isJet && v.isAirborne)) {
      const beamStrength = honkFlash ? 0.85 : Math.max(0.32, envState.lampStrength);
      const beamLen = v.isAirliner ? 340 : 220;
      const grad = ctx.createLinearGradient(v.w * 0.4, 0, v.w * 0.4 + beamLen, 0);
      grad.addColorStop(0, v.isHyper
        ? `rgba(0, 240, 255, ${(0.42 * beamStrength).toFixed(2)})`
        : `rgba(254, 249, 195, ${(0.38 * beamStrength).toFixed(2)})`);
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;

      if (v.isBike) {
        ctx.beginPath();
        ctx.moveTo(v.w * 0.42, -3); ctx.lineTo(v.w * 0.42 + 190, -34);
        ctx.lineTo(v.w * 0.42 + 190, 34); ctx.lineTo(v.w * 0.42, 3);
        ctx.closePath(); ctx.fill();
      } else if (v.isAirliner || v.isJet) {
        ctx.beginPath();
        ctx.moveTo(v.w * 0.46, -8); ctx.lineTo(v.w * 0.46 + beamLen, -56);
        ctx.lineTo(v.w * 0.46 + beamLen, 56); ctx.lineTo(v.w * 0.46, 8);
        ctx.closePath(); ctx.fill();
      } else {
        ctx.beginPath();
        ctx.moveTo(v.w * 0.44, -v.h * 0.42); ctx.lineTo(v.w * 0.44 + 220, -v.h * 1.85);
        ctx.lineTo(v.w * 0.44 + 220, -v.h * 0.05); ctx.closePath(); ctx.fill();
        ctx.beginPath();
        ctx.moveTo(v.w * 0.44, v.h * 0.42); ctx.lineTo(v.w * 0.44 + 220, v.h * 0.05);
        ctx.lineTo(v.w * 0.44 + 220, v.h * 1.85); ctx.closePath(); ctx.fill();
      }
    }

    ctx.drawImage(sprite, -sprite.width * 0.5, -sprite.height * 0.5);

    // Stressed Commuter Horn Acoustic Soundwave Arcs ((( in front of the hood!
    if ((v.honkVisualTimer || 0) > 0 && v.hp > 0) {
      const hProg = 1 - Math.min(1, v.honkVisualTimer / 0.65);
      const hAlpha = Math.max(0, Math.min(1, v.honkVisualTimer * 2.2));
      const noseX = v.w * 0.52 + 4;
      ctx.save();
      ctx.strokeStyle = v.isTruck
        ? `rgba(251, 146, 60, ${(hAlpha * 0.92).toFixed(2)})`
        : `rgba(250, 204, 21, ${(hAlpha * 0.90).toFixed(2)})`;
      ctx.lineWidth = v.isTruck ? 2.8 : 2.1;
      for (let ring = 0; ring < 3; ring++) {
        const arcR = 9 + ring * 8 + hProg * 14;
        ctx.beginPath();
        ctx.arc(noseX, 0, arcR, -0.58, 0.58);
        ctx.stroke();
      }
      ctx.restore();
    }

    // Road Vehicle Brake Lights, Running Taillights & Flashing Amber Turn Signals!
    if (v.hp > 0 && !v.isSkate && !v.isBoat && !v.isJet && !v.isHeli && !v.isTank) {
      const rx = -v.w * 0.49;
      const ly = v.isBike ? 0 : v.h * 0.34;
      const positions = v.isBike ? [[rx, 0]] : [[rx, -ly], [rx, ly]];

      if (v.isBraking || lightsOn) {
        for (let pIdx = 0; pIdx < positions.length; pIdx++) {
          const [bx, by] = positions[pIdx];
          if (v.isBraking) {
            const bGrad = ctx.createRadialGradient(bx - 2, by, 1, bx - 2, by, 13);
            bGrad.addColorStop(0, 'rgba(255, 23, 68, 0.58)');
            bGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = bGrad;
            ctx.beginPath(); ctx.arc(bx - 2, by, 13, 0, Math.PI * 2); ctx.fill();
          }
          ctx.fillStyle = v.isBraking ? '#ff1744' : '#dc2626';
          ctx.fillRect(bx - 1.5, by - 2.2, 3, 4.4);
        }
      }

      // 3.5 Hz Flashing Amber Turn Signal Blinker at Intersections
      if (v.turnSignal && (Math.floor(performance.now() * 0.007) % 2 === 0)) {
        const sideY = (v.turnSignal === 'left' ? -1 : 1) * (v.isBike ? 4.5 : v.h * 0.41);
        for (const cxPos of [v.w * 0.46, -v.w * 0.47]) {
          const tGrad = ctx.createRadialGradient(cxPos, sideY, 0.5, cxPos, sideY, 9);
          tGrad.addColorStop(0, 'rgba(251, 191, 36, 0.62)');
          tGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = tGrad;
          ctx.beginPath(); ctx.arc(cxPos, sideY, 9, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#fbbf24';
          ctx.beginPath(); ctx.arc(cxPos, sideY, 2.2, 0, Math.PI * 2); ctx.fill();
        }
      }
    }

    // FAA Aviation Wingtip Navigation Lights & White Anti-Collision Strobe on Real-Scale Aircraft
    if (v.isJet && v.hp > 0) {
      const wingSpanY = v.isAirliner ? 186 : 72;
      const wingTipX = v.isAirliner ? -78 : -44;
      const navR = v.isAirliner ? 4.2 : 3.0;
      // Port Red (-Y) & Starboard Green (+Y)
      ctx.fillStyle = '#ef4444';
      ctx.beginPath(); ctx.arc(wingTipX, -wingSpanY, navR, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#22c55e';
      ctx.beginPath(); ctx.arc(wingTipX, wingSpanY, navR, 0, Math.PI * 2); ctx.fill();
      // Synchronized White Anti-Collision Tail & Wingtip Strobes
      if (Math.sin(performance.now() * 0.014 + v.sirenPhase) > 0.74) {
        const tailX = v.isAirliner ? -198 : -92;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.90)';
        ctx.beginPath(); ctx.arc(tailX, 0, v.isAirliner ? 8.5 : 6.0, 0, Math.PI * 2); ctx.fill();
        if (v.isAirliner) {
          ctx.beginPath(); ctx.arc(-88, -189, 5.5, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.arc(-88, 189, 5.5, 0, Math.PI * 2); ctx.fill();
        }
      }
    }

    // Independent Rotating 120mm Cannon Turret for Rhino M1A3 Tank & 360° Roof Water Monitor for Fire Engine!
    if (v.isTank && sf.propSprites.tankTurret) {
      ctx.save();
      ctx.rotate((v.turretAngle || v.angle) - v.angle);
      ctx.drawImage(sf.propSprites.tankTurret, -48, -24);
      ctx.restore();
    } else if (v.isFiretruck && sf.propSprites.waterMonitor && !v.wrecked) {
      ctx.save();
      ctx.translate(10, 0);
      ctx.rotate((v.turretAngle !== undefined ? v.turretAngle : v.angle) - v.angle);
      ctx.drawImage(sf.propSprites.waterMonitor, -18, -14);
      ctx.restore();
    }

    // Physical RPM-Driven Main & Tail Rotor ("Hélice") Assembly for 1.28x Scaled Helicopters!
    // Stationary 4-blade composite rotor when parked (rotorRPM === 0); progressive motion-blur disc & tip ring in flight!
    if (v.isHeli) {
      const rpm = Math.max(0, Math.min(1, v.rotorRPM !== undefined ? v.rotorRPM : (v.driver ? 1 : 0)));
      const mastX = 2.56;
      const bladeR = 58;

      // 1. Tail Rotor Assembly at 1.28x tailboom fin (-58.9, -5.1)
      ctx.save();
      ctx.translate(-58.9, -5.1);
      if (rpm > 0.35) {
        ctx.fillStyle = `rgba(226, 232, 240, ${(0.18 + rpm * 0.24).toFixed(2)})`;
        ctx.beginPath();
        ctx.ellipse(0, 0, 12.0, 2.8, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      const tailSpinX = Math.cos(v.tailRotorAngle || 0) * 8.5;
      ctx.strokeStyle = rpm > 0.5 ? 'rgba(241, 245, 249, 0.55)' : '#334155';
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.moveTo(-tailSpinX, 0);
      ctx.lineTo(tailSpinX, 0);
      ctx.stroke();
      ctx.fillStyle = '#facc15';
      ctx.fillRect(tailSpinX - 1, -1, 2, 2);
      ctx.fillRect(-tailSpinX - 1, -1, 2, 2);
      ctx.restore();

      // 2. Main 4-Blade Composite Rotor ("Hélice") centered on titanium rotor mast (2, 0)
      ctx.save();
      ctx.translate(mastX, 0);

      // Crisp ground/fuselage blade shadow when parked or hovering near ground
      if (!v.isAirborne || (v.altitude || 0) < 18) {
        ctx.save();
        ctx.translate(3, 4);
        ctx.rotate(v.rotorAngle || 0);
        ctx.strokeStyle = `rgba(0, 0, 0, ${(0.28 * (1 - rpm * 0.55)).toFixed(2)})`;
        ctx.lineWidth = 4.2;
        ctx.beginPath();
        ctx.moveTo(-bladeR, 0); ctx.lineTo(bladeR, 0);
        ctx.moveTo(0, -bladeR); ctx.lineTo(0, bladeR);
        ctx.stroke();
        ctx.restore();
      }

      // Progressive Aerodynamic Motion-Blur Disc & Swept Sector Wedges as Rotor Spools Up (rpm > 0.22)
      if (rpm > 0.22) {
        const blurT = (rpm - 0.22) / 0.78;
        ctx.fillStyle = `rgba(148, 163, 184, ${(0.05 + blurT * 0.13).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(0, 0, bladeR, 0, Math.PI * 2);
        ctx.fill();

        // 4 swept motion-blur wedges trailing behind each rotating blade
        const sweepSpan = 0.08 + blurT * 0.42;
        ctx.fillStyle = `rgba(226, 232, 240, ${(0.08 + blurT * 0.18).toFixed(3)})`;
        for (let b = 0; b < 4; b++) {
          const bAng = (v.rotorAngle || 0) + b * Math.PI * 0.5;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.arc(0, 0, bladeR, bAng - sweepSpan, bAng);
          ctx.closePath();
          ctx.fill();
        }

        // High-visibility yellow aerodynamic blade-tip strobe ring at flight RPM
        if (rpm > 0.52) {
          const tipA = ((rpm - 0.52) / 0.48) * 0.52;
          ctx.strokeStyle = `rgba(250, 204, 21, ${tipA.toFixed(2)})`;
          ctx.lineWidth = 2.0;
          ctx.beginPath();
          ctx.arc(0, 0, bladeR - 1.5, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      // Individual 4 Tapered Carbon-Slate Airfoil Blades (100% solid & crisp when parked, partially translucent at max RPM)
      ctx.save();
      ctx.rotate(v.rotorAngle || 0);
      ctx.globalAlpha = Math.max(0.34, 1 - rpm * 0.62);
      for (let b = 0; b < 4; b++) {
        ctx.save();
        ctx.rotate(b * Math.PI * 0.5);
        // Pitch-link root cuff
        ctx.fillStyle = '#475569';
        ctx.fillRect(4, -1.8, 6, 3.6);
        // Carbon-composite airfoil blade + silver leading edge
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.moveTo(9, -2.5);
        ctx.lineTo(bladeR - 4, -2.1);
        ctx.lineTo(bladeR, 1.8);
        ctx.lineTo(9, 2.3);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(10, -2.5, bladeR - 14, 1.1);
        // High-visibility yellow safety blade tip
        ctx.fillStyle = '#facc15';
        ctx.fillRect(bladeR - 5, -2.0, 5, 3.8);
        ctx.restore();
      }
      ctx.restore();

      // Central Titanium Rotor Hub Cap & Bolt Ring
      ctx.fillStyle = '#334155';
      ctx.beginPath(); ctx.arc(0, 0, 5.2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#cbd5e1';
      ctx.beginPath(); ctx.arc(0, 0, 2.8, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }

    if (v.exposedRider && v.driver) {
      const riderColor = v.driver === 'player' ? '#ff2a85' : '#00f0ff';
      const riderSprite = sf.getCharacterSprite(riderColor, '#f5d0b5', 0, v.driver === 'player');
      ctx.drawImage(riderSprite, -24, -22);
    }

    // EMP Stun Arcs
    if (v.empTimer && v.empTimer > 0) {
      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 2;
      ctx.strokeRect(-v.w * 0.45, -v.h * 0.45, v.w * 0.9, v.h * 0.9);
    }

    if (v.isPolice && v.sirenOn && v.hp > 0) {
      const isRed = Math.sin(v.sirenPhase) > 0;
      const sGrad = ctx.createRadialGradient(0, isRed ? -6 : 6, 2, 0, isRed ? -6 : 6, 56);
      sGrad.addColorStop(0, isRed ? 'rgba(255, 23, 68, 0.65)' : 'rgba(41, 121, 255, 0.65)');
      sGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = sGrad;
      ctx.beginPath(); ctx.arc(0, isRed ? -6 : 6, 56, 0, Math.PI * 2); ctx.fill();
    }

    ctx.restore();
  }

  // ==========================================
  // 11B. SHORELINE SEAWALLS, COURTYARDS & ENGINEERED ELEVATED BRIDGES
  // ==========================================
  function shadeHex(hex, delta) {
    if (!hex || hex[0] !== '#' || hex.length < 7) return hex || '#888888';
    const num = parseInt(hex.slice(1, 7), 16);
    const r = Math.max(0, Math.min(255, ((num >> 16) & 255) + delta));
    const g = Math.max(0, Math.min(255, ((num >> 8) & 255) + delta));
    const b = Math.max(0, Math.min(255, (num & 255) + delta));
    return `rgb(${r}, ${g}, ${b})`;
  }

  function coastCurveY(wy) {
    return Math.sin(wy * 0.019) * 15 + Math.sin(wy * 0.049 + 1.4) * 7;
  }

  function coastCurveX(wx) {
    return Math.sin(wx * 0.019 + 0.8) * 15 + Math.sin(wx * 0.049 + 2.1) * 7;
  }

  function drawProceduralWaterTile(gx, gy, wx, wy, nowSec, sf) {
    const wm = (waterMeta[gy] && waterMeta[gy][gx]) || {
      biome: 'bay',
      depthNorm: 0.6,
      estuaryMix: 0,
      typeN: 4, typeS: 4, typeW: 4, typeE: 4
    };
    const d = wm.depthNorm;
    const swellBreath = Math.sin(nowSec * 1.35 + gx * 0.45 + gy * 0.35) * 5;

    // 1. Biome & Bathymetry Base Color Interpolation (River -> Brackish Estuary -> Harbor / Canal / Lagoon Bay / Atlantic Abyss)
    let sr, sg, sb, dr, dg, db;
    if (wm.biome === 'river') {
      sr = 42; sg = 108; sb = 82;   // Shallow mossy Everglades emerald-olive
      dr = 17; dg = 56;  db = 46;   // Deep tannin peat channel
    } else if (wm.biome === 'estuary') {
      const m = wm.estuaryMix;
      sr = 42 + (26 - 42) * m; sg = 108 + (102 - 108) * m; sb = 82 + (118 - 82) * m;
      dr = 17 + (10 - 17) * m; dg = 56 + (44 - 56) * m;    db = 46 + (62 - 46) * m;
    } else if (wm.biome === 'harbor') {
      sr = 26; sg = 102; sb = 118;  // Port Leonida maritime slate-teal
      dr = 10; dg = 44;  db = 62;
    } else if (wm.biome === 'canal') {
      sr = 30; sg = 154; sb = 168;  // Star Island calm Venetian aquamarine
      dr = 12; dg = 86;  db = 118;
    } else if (wm.biome === 'ocean') {
      sr = 18; sg = 144; sb = 188;  // Atlantic outer reef cerulean
      dr = 9;  dg = 36;  db = 82;   // Deep Atlantic sapphire trench
    } else {
      sr = 28; sg = 178; sb = 192;  // Biscayne Lagoon tropical turquoise shallows
      dr = 6;  dg = 92;  db = 142;  // Mid-bay cerulean
    }

    const nightDim = 1 - envState.lampStrength * 0.36;
    const r = Math.max(0, Math.min(255, Math.round((sr + (dr - sr) * d + swellBreath) * nightDim)));
    const g = Math.max(0, Math.min(255, Math.round((sg + (dg - sg) * d + swellBreath) * nightDim)));
    const b = Math.max(0, Math.min(255, Math.round((sb + (db - sb) * d + swellBreath * 1.15) * (1 - envState.lampStrength * 0.28))));
    ctx.fillStyle = `rgb(${r},${g},${b})`;
    ctx.fillRect(wx, wy, TILE_SIZE, TILE_SIZE);

    // 2. Submerged Coastal Sandbar, Bayou Silt & Seawall Depth-Shelf Gradients
    const shelfW = 48;
    const shelfTint = (neighborType) => {
      if (neighborType === 3) return ['rgba(218, 194, 130, 0.42)', 'rgba(45, 200, 212, 0.16)'];
      if (wm.biome === 'river' || wm.biome === 'estuary' || neighborType === 2) return ['rgba(74, 88, 54, 0.38)', 'rgba(34, 78, 62, 0.10)'];
      return ['rgba(4, 18, 32, 0.36)', 'rgba(4, 18, 32, 0.08)'];
    };

    if (wm.typeW !== 4) {
      const [c0, c1] = shelfTint(wm.typeW);
      const gr = ctx.createLinearGradient(wx, wy, wx + shelfW, wy);
      gr.addColorStop(0, c0); gr.addColorStop(0.55, c1); gr.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gr; ctx.fillRect(wx, wy, shelfW, TILE_SIZE);
    }
    if (wm.typeE !== 4) {
      const [c0, c1] = shelfTint(wm.typeE);
      const gr = ctx.createLinearGradient(wx + TILE_SIZE, wy, wx + TILE_SIZE - shelfW, wy);
      gr.addColorStop(0, c0); gr.addColorStop(0.55, c1); gr.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gr; ctx.fillRect(wx + TILE_SIZE - shelfW, wy, shelfW, TILE_SIZE);
    }
    if (wm.typeN !== 4) {
      const [c0, c1] = shelfTint(wm.typeN);
      const gr = ctx.createLinearGradient(wx, wy, wx, wy + shelfW);
      gr.addColorStop(0, c0); gr.addColorStop(0.55, c1); gr.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gr; ctx.fillRect(wx, wy, TILE_SIZE, shelfW);
    }
    if (wm.typeS !== 4) {
      const [c0, c1] = shelfTint(wm.typeS);
      const gr = ctx.createLinearGradient(wx, wy + TILE_SIZE, wx, wy + TILE_SIZE - shelfW);
      gr.addColorStop(0, c0); gr.addColorStop(0.55, c1); gr.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gr; ctx.fillRect(wx, wy + TILE_SIZE - shelfW, TILE_SIZE, shelfW);
    }

    // Swirling brackish river-to-sea silt plume in the southern estuary mouth
    if (wm.biome === 'estuary') {
      const plumeX = wx + 80 + Math.sin(nowSec * 0.9 + gy * 0.6) * 28;
      const plumeG = ctx.createRadialGradient(plumeX, wy + 80, 8, plumeX, wy + 80, 78);
      plumeG.addColorStop(0, `rgba(92, 112, 74, ${0.24 * (1 - wm.estuaryMix * 0.65)})`);
      plumeG.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = plumeG;
      ctx.fillRect(wx, wy, TILE_SIZE, TILE_SIZE);
    }

    // 3. Dual-Layer Hardware-Scrolled Seamless Voronoi Caustics & Wave Interference (256x256 SpriteForge sheets)
    // SPAN (156) + SUB (100) === 256 guarantees zero out-of-bounds Canvas source clipping!
    const SPAN = 156;
    const SUB = 100;
    const isRiverFlow = wm.biome === 'river' || wm.biome === 'estuary';

    if (sf.textures.waterCausticsA) {
      const driftAX = isRiverFlow ? Math.sin(nowSec * 0.6 + gy * 0.4) * 10 : nowSec * 15;
      const driftAY = isRiverFlow ? -nowSec * 28 : nowSec * 9;
      const sxA = ((gx * SUB + driftAX) % SPAN + SPAN) % SPAN;
      const syA = ((gy * SUB + driftAY) % SPAN + SPAN) % SPAN;

      ctx.save();
      ctx.globalAlpha = (isRiverFlow ? 0.15 : 0.28) * (1.0 - d * 0.42);
      ctx.drawImage(sf.textures.waterCausticsA, sxA, syA, SUB, SUB, wx, wy, TILE_SIZE, TILE_SIZE);
      ctx.restore();
    }

    if (sf.textures.waterCausticsB) {
      const driftBX = isRiverFlow ? -nowSec * 7 : nowSec * (wm.biome === 'ocean' ? 28 : 19);
      const driftBY = isRiverFlow ? -nowSec * 38 : -nowSec * 12;
      const sxB = ((gx * SUB + 47 + driftBX) % SPAN + SPAN) % SPAN;
      const syB = ((gy * SUB + 83 + driftBY) % SPAN + SPAN) % SPAN;

      ctx.save();
      ctx.globalAlpha = wm.biome === 'ocean' ? 0.30 : (wm.biome === 'canal' ? 0.14 : 0.22);
      ctx.drawImage(sf.textures.waterCausticsB, sxB, syB, SUB, SUB, wx, wy, TILE_SIZE, TILE_SIZE);
      ctx.restore();
    }

    // 4. Biome-Specific Currents, Rolling Atlantic Whitecaps & Time-of-Day Specular Diamond Glints
    if (isRiverFlow) {
      // Downstream southward Everglades river current ribbons
      const curY1 = ((nowSec * 52 + gx * 37) % 128);
      const curY2 = ((nowSec * 44 + gx * 91 + 64) % 128);
      ctx.fillStyle = 'rgba(167, 218, 192, 0.14)';
      ctx.fillRect(wx + 38 + Math.sin(nowSec * 1.8 + gy) * 6, wy + curY1, 2.5, 28);
      ctx.fillRect(wx + 108 + Math.cos(nowSec * 1.5 + gy) * 6, wy + curY2, 2.5, 24);
    } else if (wm.biome === 'ocean' || (wm.biome === 'bay' && d > 0.35)) {
      // Rolling westward Atlantic swell crests & windblown whitecaps
      const swellX = TILE_SIZE - ((nowSec * (wm.biome === 'ocean' ? 38 : 24) + gy * 29) % (TILE_SIZE - 16)) - 8;
      ctx.strokeStyle = wm.biome === 'ocean' ? 'rgba(240, 249, 255, 0.28)' : 'rgba(224, 242, 254, 0.17)';
      ctx.lineWidth = wm.biome === 'ocean' ? 2.6 : 1.8;
      ctx.beginPath();
      ctx.moveTo(wx + swellX, wy + 18);
      ctx.quadraticCurveTo(wx + swellX - 9, wy + 80, wx + swellX + 3, wy + 142);
      ctx.stroke();
    }

    // Continuous 24-hour sun/moonlight specular water glints (golden at dawn/sunset, silver moonlight at night, diamond at noon)
    const glintCol = envState.solarWarmth > 0.32
      ? 'rgba(253, 186, 116, 0.65)' // Golden Hour / Dawn / Vice Sunset copper-gold
      : (envState.lightsOn ? 'rgba(186, 230, 253, 0.34)' : 'rgba(255, 255, 255, 0.62)'); // Lunar silver / Noon diamond
    for (let k = 0; k < 2; k++) {
      const spark = Math.sin(nowSec * (3.4 + k * 0.9) + gx * 2.7 + gy * 4.1 + k * 2.3);
      if (spark > 0.66) {
        const gxOff = 24 + ((gx * 53 + gy * 29 + k * 67) % 112) + Math.sin(nowSec * 2 + k) * 6;
        const gyOff = 22 + ((gx * 31 + gy * 71 + k * 59) % 116);
        const sz = (spark - 0.66) * 11;
        ctx.fillStyle = glintCol;
        ctx.fillRect(wx + gxOff - sz, gyOff + wy - 1, sz * 2, 2);
        ctx.fillRect(wx + gxOff - 1, gyOff + wy - sz * 0.7, 2, sz * 1.4);
      }
    }
  }

  function drawCourtyardsAndSeawalls(minGX, maxGX, minGY, maxGY, halfW, halfH, nowSec = 0) {
    const sf = window.SpriteForge;

    // 0. Persistent Flattened Building Rubble Ruins (Drivable Tank Demolition Sites!)
    const drawnRuins = new Set();
    for (let gy = minGY; gy <= maxGY; gy++) {
      for (let gx = minGX; gx <= maxGX; gx++) {
        const cellBlds = buildingsGrid[gy][gx];
        for (let i = 0; i < cellBlds.length; i++) {
          const b = cellBlds[i];
          if (!b.collapsed || !b.ruin || drawnRuins.has(b)) continue;
          drawnRuins.add(b);

          // Scorched pulverized concrete foundation pad & blast crater
          ctx.fillStyle = '#44403c';
          ctx.fillRect(b.x - 3, b.y - 3, b.w + 6, b.h + 6);
          ctx.fillStyle = '#292524';
          ctx.fillRect(b.x + 5, b.y + 5, b.w - 10, b.h - 10);

          const crGrad = ctx.createRadialGradient(
            b.x + b.w * 0.5, b.y + b.h * 0.5, 4,
            b.x + b.w * 0.5, b.y + b.h * 0.5, Math.max(b.w, b.h) * 0.48
          );
          crGrad.addColorStop(0, 'rgba(12, 10, 9, 0.85)');
          crGrad.addColorStop(1, 'rgba(28, 25, 23, 0)');
          ctx.fillStyle = crGrad;
          ctx.fillRect(b.x, b.y, b.w, b.h);

          // Tumbled masonry & concrete facade slabs
          for (let s = 0; s < b.ruin.slabs.length; s++) {
            const sl = b.ruin.slabs[s];
            ctx.save();
            ctx.translate(b.x + sl.dx, b.y + sl.dy);
            ctx.rotate(sl.rot);
            ctx.fillStyle = 'rgba(0, 0, 0, 0.38)';
            ctx.fillRect(-sl.sw * 0.5 + 2, -sl.sh * 0.5 + 2, sl.sw, sl.sh);
            ctx.fillStyle = sl.col;
            ctx.fillRect(-sl.sw * 0.5, -sl.sh * 0.5, sl.sw, sl.sh);
            ctx.restore();
          }

          // Twisted rusty reinforcing steel rebars protruding from rubble
          ctx.strokeStyle = '#7c2d12';
          ctx.lineWidth = 1.6;
          for (let r = 0; r < b.ruin.rebars.length; r++) {
            const rb = b.ruin.rebars[r];
            ctx.beginPath();
            ctx.moveTo(b.x + rb.x1, b.y + rb.y1);
            ctx.lineTo(b.x + rb.x2, b.y + rb.y2);
            ctx.stroke();
          }

          // Lingering post-collapse smoke & dust wisps
          if (b.smokeTimer > 0) {
            const smokeAlpha = Math.min(0.28, b.smokeTimer * 0.025);
            const driftX = Math.sin(nowSec * 1.4 + b.x) * 10;
            const driftY = -((nowSec * 14 + b.y) % 24);
            ctx.fillStyle = `rgba(168, 162, 158, ${smokeAlpha})`;
            ctx.beginPath();
            ctx.arc(b.x + b.w * 0.42 + driftX, b.y + b.h * 0.48 + driftY, 16, 0, Math.PI * 2);
            ctx.arc(b.x + b.w * 0.62 - driftX * 0.6, b.y + b.h * 0.55 + driftY * 0.8, 13, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    }

    // 1. Villa Pools, Stone Plazas, Courtyard Gardens & Industrial Concrete Yards
    for (let i = 0; i < courtyardProps.length; i++) {
      const cp = courtyardProps[i];
      if (Math.abs(cp.x + cp.w * 0.5 - camera.x) > halfW || Math.abs(cp.y + cp.h * 0.5 - camera.y) > halfH) continue;

      if (cp.kind === 'villa_pool') {
        ctx.fillStyle = '#d6cec0';
        ctx.fillRect(cp.x, cp.y, cp.w, cp.h);
        ctx.strokeStyle = '#a89f91';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(cp.x, cp.y, cp.w, cp.h);

        const px = cp.x + 10, py = cp.y + 10, pw = Math.max(16, cp.w - 28), ph = Math.max(14, cp.h - 20);
        ctx.fillStyle = '#f5f0e6';
        ctx.fillRect(px - 2, py - 2, pw + 4, ph + 4);
        ctx.fillStyle = '#188fa7';
        ctx.fillRect(px, py, pw, ph);
        ctx.fillStyle = 'rgba(144, 224, 239, 0.35)';
        ctx.fillRect(px + 4, py + 4, pw * 0.65, ph * 0.45);
        ctx.fillStyle = '#f5f0e6';
        ctx.fillRect(cp.x + cp.w - 14, py + 2, 8, 14);
        if (ph > 26) ctx.fillRect(cp.x + cp.w - 14, py + 20, 8, 14);
      } else if (cp.kind === 'plaza') {
        ctx.fillStyle = '#b5aea2';
        ctx.fillRect(cp.x, cp.y, cp.w, cp.h);
        ctx.strokeStyle = 'rgba(92, 86, 78, 0.32)';
        ctx.lineWidth = 1;
        for (let sx = cp.x + 16; sx < cp.x + cp.w; sx += 16) {
          ctx.beginPath(); ctx.moveTo(sx, cp.y); ctx.lineTo(sx, cp.y + cp.h); ctx.stroke();
        }
        for (let sy = cp.y + 16; sy < cp.y + cp.h; sy += 16) {
          ctx.beginPath(); ctx.moveTo(cp.x, sy); ctx.lineTo(cp.x + cp.w, sy); ctx.stroke();
        }
        const cx = cp.x + cp.w * 0.5, cy = cp.y + cp.h * 0.5;
        ctx.fillStyle = '#78716c';
        ctx.beginPath(); ctx.arc(cx, cy, 11, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#3d6b47';
        ctx.beginPath(); ctx.arc(cx, cy, 7.5, 0, Math.PI * 2); ctx.fill();
      } else if (cp.kind === 'garden') {
        ctx.fillStyle = '#c8c0b2';
        ctx.fillRect(cp.x, cp.y, cp.w, cp.h);
        ctx.fillStyle = '#3d6b47';
        ctx.fillRect(cp.x + 6, cp.y + 6, cp.w - 12, cp.h - 12);
        ctx.strokeStyle = '#264a2e';
        ctx.lineWidth = 2;
        ctx.strokeRect(cp.x + 7, cp.y + 7, cp.w - 14, cp.h - 14);
        ctx.fillStyle = '#d6cfc2';
        ctx.fillRect(cp.x + cp.w * 0.5 - 4, cp.y + 6, 8, cp.h - 12);
      } else if (cp.kind === 'industrial_yard') {
        ctx.fillStyle = '#6a6f75';
        ctx.fillRect(cp.x, cp.y, cp.w, cp.h);
        ctx.strokeStyle = 'rgba(234, 179, 8, 0.52)';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(cp.x + 4, cp.y + 4, cp.w - 8, cp.h - 8);
      }
    }

    // 2A. Organic Non-Grid Beach Shorelines (Wet Sand Swash + Phased Breaking Surf) & Bayou Aquatic Flora
    const STEPS = 8;
    for (let gy = minGY; gy <= maxGY; gy++) {
      for (let gx = minGX; gx <= maxGX; gx++) {
        if (worldGrid[gy][gx] !== 4) continue;
        const wx = gx * TILE_SIZE;
        const wy = gy * TILE_SIZE;
        const wm = waterMeta[gy] && waterMeta[gy][gx];
        const hasBr = !!bridgeGrid[gy][gx];

        // Render Bayou / Park aquatic lily pads & mossy river boulders
        if (wm && wm.naturalProps && wm.naturalProps.length > 0 && !hasBr) {
          for (let p = 0; p < wm.naturalProps.length; p++) {
            const np = wm.naturalProps[p];
            const px = wx + np.ox;
            const py = wy + np.oy;
            if (np.kind === 'lily') {
              const bob = Math.sin(nowSec * 1.8 + px * 0.1) * 1.2;
              ctx.fillStyle = '#2d6a3e';
              ctx.beginPath();
              ctx.arc(px + bob, py, np.r, 0.25, Math.PI * 1.88);
              ctx.lineTo(px + bob, py);
              ctx.closePath();
              ctx.fill();
              if (p % 3 === 0) {
                ctx.fillStyle = '#fce7f3';
                ctx.beginPath(); ctx.arc(px + bob + 1, py - 1, 2.1, 0, Math.PI * 2); ctx.fill();
              }
            } else {
              ctx.fillStyle = 'rgba(186, 230, 253, 0.22)';
              ctx.beginPath(); ctx.arc(px, py, np.r + 3 + Math.sin(nowSec * 2.4 + py) * 1.2, 0, Math.PI * 2); ctx.stroke();
              ctx.fillStyle = '#57534e';
              ctx.beginPath(); ctx.arc(px, py, np.r, 0, Math.PI * 2); ctx.fill();
              ctx.fillStyle = '#4d6b53';
              ctx.beginPath(); ctx.arc(px - 1.5, py - 1.5, np.r * 0.62, 0, Math.PI * 2); ctx.fill();
            }
          }
        }

        if (hasBr) continue;

        // Beach on WEST of this water tile (e.g. Vice Beach facing Atlantic / Lagoon)
        if (gx > 0 && worldGrid[gy][gx - 1] === 3) {
          // Glistening Wet Foreshore Sand polygon overlapping the grid seam
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(wx - 22, wy);
          for (let s = 0; s <= STEPS; s++) {
            const sy = wy + (s / STEPS) * TILE_SIZE;
            ctx.lineTo(wx + 14 + coastCurveY(sy), sy);
          }
          ctx.lineTo(wx - 22, wy + TILE_SIZE);
          ctx.closePath();
          ctx.fillStyle = '#9c7c4c';
          ctx.fill();
          if (sf.textures.wetSand) {
            ctx.clip();
            ctx.drawImage(sf.textures.wetSand, wx - 32, wy, TILE_SIZE, TILE_SIZE);
          }
          ctx.restore();

          // Soft dry golden sand feather hiding the landward edge
          ctx.fillStyle = '#dfc186';
          ctx.beginPath();
          ctx.moveTo(wx - 24, wy);
          for (let s = 0; s <= STEPS; s++) {
            const sy = wy + (s / STEPS) * TILE_SIZE;
            ctx.lineTo(wx - 4 + coastCurveY(sy) * 0.68, sy);
          }
          ctx.lineTo(wx - 24, wy + TILE_SIZE);
          ctx.closePath();
          ctx.fill();

          // Two phased breaking surf waves surging onto the curved beach
          for (let wIdx = 0; wIdx < 2; wIdx++) {
            const phase = (nowSec * 0.44 + wIdx * 0.5) % 1;
            const env = Math.sin(phase * Math.PI);
            const runup = 38 * (1 - phase) - 4; // Surges inward from +34px out to -4px up the wet sand!

            ctx.fillStyle = `rgba(103, 232, 249, ${(env * 0.24).toFixed(3)})`;
            ctx.beginPath();
            for (let s = 0; s <= STEPS; s++) {
              const sy = wy + (s / STEPS) * TILE_SIZE;
              const cx = wx + 8 + coastCurveY(sy);
              if (s === 0) ctx.moveTo(cx, sy); else ctx.lineTo(cx, sy);
            }
            for (let s = STEPS; s >= 0; s--) {
              const sy = wy + (s / STEPS) * TILE_SIZE;
              const wxFoam = wx + 12 + coastCurveY(sy) + runup + Math.sin(sy * 0.08 + nowSec * 2.6 + wIdx) * 3.5;
              ctx.lineTo(wxFoam, sy);
            }
            ctx.closePath();
            ctx.fill();

            ctx.strokeStyle = `rgba(248, 252, 255, ${(env * 0.78).toFixed(3)})`;
            ctx.lineWidth = 2.2 + env * 2.6;
            ctx.beginPath();
            for (let s = 0; s <= STEPS; s++) {
              const sy = wy + (s / STEPS) * TILE_SIZE;
              const wxFoam = wx + 12 + coastCurveY(sy) + runup + Math.sin(sy * 0.08 + nowSec * 2.6 + wIdx) * 3.5;
              if (s === 0) ctx.moveTo(wxFoam, sy); else ctx.lineTo(wxFoam, sy);
            }
            ctx.stroke();
          }
        }

        // Beach on EAST of this water tile (Lagoon east shore meeting barrier beach)
        if (gx < GRID_W - 1 && worldGrid[gy][gx + 1] === 3) {
          const ex = wx + TILE_SIZE;
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(ex + 22, wy);
          for (let s = 0; s <= STEPS; s++) {
            const sy = wy + (s / STEPS) * TILE_SIZE;
            ctx.lineTo(ex - 14 + coastCurveY(sy + 90), sy);
          }
          ctx.lineTo(ex + 22, wy + TILE_SIZE);
          ctx.closePath();
          ctx.fillStyle = '#9c7c4c';
          ctx.fill();
          if (sf.textures.wetSand) {
            ctx.clip();
            ctx.drawImage(sf.textures.wetSand, wx + 32, wy, TILE_SIZE, TILE_SIZE);
          }
          ctx.restore();

          ctx.fillStyle = '#dfc186';
          ctx.beginPath();
          ctx.moveTo(ex + 24, wy);
          for (let s = 0; s <= STEPS; s++) {
            const sy = wy + (s / STEPS) * TILE_SIZE;
            ctx.lineTo(ex + 4 + coastCurveY(sy + 90) * 0.68, sy);
          }
          ctx.lineTo(ex + 24, wy + TILE_SIZE);
          ctx.closePath();
          ctx.fill();

          for (let wIdx = 0; wIdx < 2; wIdx++) {
            const phase = (nowSec * 0.42 + wIdx * 0.5) % 1;
            const env = Math.sin(phase * Math.PI);
            const runup = 34 * (1 - phase) - 4;
            ctx.strokeStyle = `rgba(248, 252, 255, ${(env * 0.72).toFixed(3)})`;
            ctx.lineWidth = 2.0 + env * 2.2;
            ctx.beginPath();
            for (let s = 0; s <= STEPS; s++) {
              const sy = wy + (s / STEPS) * TILE_SIZE;
              const wxFoam = ex - 12 + coastCurveY(sy + 90) - runup + Math.sin(sy * 0.08 - nowSec * 2.4 + wIdx) * 3;
              if (s === 0) ctx.moveTo(wxFoam, sy); else ctx.lineTo(wxFoam, sy);
            }
            ctx.stroke();
          }
        }

        // Beach on NORTH or SOUTH of this water tile
        if (gy > 0 && worldGrid[gy - 1][gx] === 3) {
          ctx.fillStyle = '#9c7c4c';
          ctx.beginPath();
          ctx.moveTo(wx, wy - 18);
          for (let s = 0; s <= STEPS; s++) {
            const sx = wx + (s / STEPS) * TILE_SIZE;
            ctx.lineTo(sx, wy + 13 + coastCurveX(sx));
          }
          ctx.lineTo(wx + TILE_SIZE, wy - 18);
          ctx.closePath();
          ctx.fill();

          ctx.fillStyle = '#dfc186';
          ctx.beginPath();
          ctx.moveTo(wx, wy - 20);
          for (let s = 0; s <= STEPS; s++) {
            const sx = wx + (s / STEPS) * TILE_SIZE;
            ctx.lineTo(sx, wy - 3 + coastCurveX(sx) * 0.65);
          }
          ctx.lineTo(wx + TILE_SIZE, wy - 20);
          ctx.closePath();
          ctx.fill();

          const phase = (nowSec * 0.44) % 1;
          const env = Math.sin(phase * Math.PI);
          const runup = 30 * (1 - phase);
          ctx.strokeStyle = `rgba(248, 252, 255, ${(env * 0.74).toFixed(3)})`;
          ctx.lineWidth = 2.2 + env * 2.2;
          ctx.beginPath();
          for (let s = 0; s <= STEPS; s++) {
            const sx = wx + (s / STEPS) * TILE_SIZE;
            const syFoam = wy + 12 + coastCurveX(sx) + runup;
            if (s === 0) ctx.moveTo(sx, syFoam); else ctx.lineTo(sx, syFoam);
          }
          ctx.stroke();
        }

        if (gy < GRID_H - 1 && worldGrid[gy + 1][gx] === 3) {
          const ey = wy + TILE_SIZE;
          ctx.fillStyle = '#9c7c4c';
          ctx.beginPath();
          ctx.moveTo(wx, ey + 18);
          for (let s = 0; s <= STEPS; s++) {
            const sx = wx + (s / STEPS) * TILE_SIZE;
            ctx.lineTo(sx, ey - 13 + coastCurveX(sx + 90));
          }
          ctx.lineTo(wx + TILE_SIZE, ey + 18);
          ctx.closePath();
          ctx.fill();

          ctx.fillStyle = '#dfc186';
          ctx.beginPath();
          ctx.moveTo(wx, ey + 20);
          for (let s = 0; s <= STEPS; s++) {
            const sx = wx + (s / STEPS) * TILE_SIZE;
            ctx.lineTo(sx, ey + 3 + coastCurveX(sx + 90) * 0.65);
          }
          ctx.lineTo(wx + TILE_SIZE, ey + 20);
          ctx.closePath();
          ctx.fill();

          const phase = (nowSec * 0.44 + 0.35) % 1;
          const env = Math.sin(phase * Math.PI);
          const runup = 30 * (1 - phase);
          ctx.strokeStyle = `rgba(248, 252, 255, ${(env * 0.74).toFixed(3)})`;
          ctx.lineWidth = 2.2 + env * 2.2;
          ctx.beginPath();
          for (let s = 0; s <= STEPS; s++) {
            const sx = wx + (s / STEPS) * TILE_SIZE;
            const syFoam = ey - 12 + coastCurveX(sx + 90) - runup;
            if (s === 0) ctx.moveTo(sx, syFoam); else ctx.lineTo(sx, syFoam);
          }
          ctx.stroke();
        }
      }
    }

    // 2B. Natural Everglades Bayou / Park Embankments vs. Engineered Granite Waterfront Seawalls
    const isNaturalBank = (landT, wgx, wgy) => {
      if (landT === 2) return true; // Botanical Parks always have natural vegetated banks
      if (landT === 0 || landT === 6 || landT === 7 || landT === 5) return false; // Roads, Runways, Port Docks = concrete quay
      const wm = waterMeta[wgy] && waterMeta[wgy][wgx];
      return !!(wm && (wm.biome === 'river' || wm.biome === 'estuary') && wgx <= 26);
    };

    for (let gy = minGY; gy <= maxGY; gy++) {
      for (let gx = minGX; gx <= maxGX; gx++) {
        const t = worldGrid[gy][gx];
        if (t === 4 || t === 3) continue; // Water & sloping sandy beaches handled above
        const wx = gx * TILE_SIZE;
        const wy = gy * TILE_SIZE;
        const lapAlpha = (0.18 + 0.12 * Math.sin(nowSec * 2.6 + gx * 0.9 + gy * 0.7)).toFixed(3);

        // North edge bordering water
        if (gy > 0 && worldGrid[gy - 1][gx] === 4) {
          const br = bridgeGrid[gy - 1][gx];
          if (!(br && br.axis === 'y')) {
            if (isNaturalBank(t, gx, gy - 1)) {
              ctx.fillStyle = '#4a3f31';
              ctx.beginPath();
              ctx.moveTo(wx, wy + 12);
              for (let s = 0; s <= 6; s++) {
                const sx = wx + (s / 6) * TILE_SIZE;
                ctx.lineTo(sx, wy - 6 + coastCurveX(sx) * 0.45);
              }
              ctx.lineTo(wx + TILE_SIZE, wy + 12);
              ctx.closePath();
              ctx.fill();

              ctx.fillStyle = '#335c3b';
              ctx.beginPath();
              ctx.moveTo(wx, wy + 14);
              for (let s = 0; s <= 6; s++) {
                const sx = wx + (s / 6) * TILE_SIZE;
                ctx.lineTo(sx, wy + 1 + coastCurveX(sx) * 0.42);
              }
              ctx.lineTo(wx + TILE_SIZE, wy + 14);
              ctx.closePath();
              ctx.fill();
            } else {
              ctx.fillStyle = 'rgba(4, 15, 28, 0.45)';
              ctx.fillRect(wx, wy - 7, TILE_SIZE, 7);
              ctx.fillStyle = `rgba(224, 242, 254, ${lapAlpha})`;
              ctx.fillRect(wx, wy - 4, TILE_SIZE, 2);
              ctx.fillStyle = '#57554f';
              ctx.fillRect(wx, wy - 2, TILE_SIZE, 3);
              ctx.fillStyle = '#a8a49c';
              ctx.fillRect(wx, wy, TILE_SIZE, 8);
              ctx.fillStyle = '#cfccc4';
              ctx.fillRect(wx, wy, TILE_SIZE, 2.5);
              ctx.fillStyle = '#27272a';
              for (let bx = 26; bx < TILE_SIZE; bx += 54) {
                ctx.beginPath(); ctx.arc(wx + bx, wy + 4, 2.6, 0, Math.PI * 2); ctx.fill();
              }
            }
          }
        }
        // South edge bordering water
        if (gy < GRID_H - 1 && worldGrid[gy + 1][gx] === 4) {
          const br = bridgeGrid[gy + 1][gx];
          if (!(br && br.axis === 'y')) {
            if (isNaturalBank(t, gx, gy + 1)) {
              const ey = wy + TILE_SIZE;
              ctx.fillStyle = '#4a3f31';
              ctx.beginPath();
              ctx.moveTo(wx, ey - 12);
              for (let s = 0; s <= 6; s++) {
                const sx = wx + (s / 6) * TILE_SIZE;
                ctx.lineTo(sx, ey + 6 + coastCurveX(sx + 60) * 0.45);
              }
              ctx.lineTo(wx + TILE_SIZE, ey - 12);
              ctx.closePath();
              ctx.fill();

              ctx.fillStyle = '#335c3b';
              ctx.beginPath();
              ctx.moveTo(wx, ey - 14);
              for (let s = 0; s <= 6; s++) {
                const sx = wx + (s / 6) * TILE_SIZE;
                ctx.lineTo(sx, ey - 1 + coastCurveX(sx + 60) * 0.42);
              }
              ctx.lineTo(wx + TILE_SIZE, ey - 14);
              ctx.closePath();
              ctx.fill();
            } else {
              ctx.fillStyle = 'rgba(4, 15, 28, 0.52)';
              ctx.fillRect(wx, wy + TILE_SIZE, TILE_SIZE, 9);
              ctx.fillStyle = `rgba(224, 242, 254, ${lapAlpha})`;
              ctx.fillRect(wx, wy + TILE_SIZE + 3, TILE_SIZE, 2);
              ctx.fillStyle = '#57554f';
              ctx.fillRect(wx, wy + TILE_SIZE - 2, TILE_SIZE, 4);
              ctx.fillStyle = '#a8a49c';
              ctx.fillRect(wx, wy + TILE_SIZE - 8, TILE_SIZE, 8);
              ctx.fillStyle = '#cfccc4';
              ctx.fillRect(wx, wy + TILE_SIZE - 8, TILE_SIZE, 2);
              ctx.fillStyle = '#27272a';
              for (let bx = 26; bx < TILE_SIZE; bx += 54) {
                ctx.beginPath(); ctx.arc(wx + bx, wy + TILE_SIZE - 4, 2.6, 0, Math.PI * 2); ctx.fill();
              }
            }
          }
        }
        // West edge bordering water
        if (gx > 0 && worldGrid[gy][gx - 1] === 4) {
          const br = bridgeGrid[gy][gx - 1];
          if (!(br && br.axis === 'x')) {
            if (isNaturalBank(t, gx - 1, gy)) {
              ctx.fillStyle = '#4a3f31';
              ctx.beginPath();
              ctx.moveTo(wx + 12, wy);
              for (let s = 0; s <= 6; s++) {
                const sy = wy + (s / 6) * TILE_SIZE;
                ctx.lineTo(wx - 7 + coastCurveY(sy) * 0.48, sy);
              }
              ctx.lineTo(wx + 12, wy + TILE_SIZE);
              ctx.closePath();
              ctx.fill();

              ctx.fillStyle = '#335c3b';
              ctx.beginPath();
              ctx.moveTo(wx + 14, wy);
              for (let s = 0; s <= 6; s++) {
                const sy = wy + (s / 6) * TILE_SIZE;
                ctx.lineTo(wx + 1 + coastCurveY(sy) * 0.42, sy);
              }
              ctx.lineTo(wx + 14, wy + TILE_SIZE);
              ctx.closePath();
              ctx.fill();

              // Swaying Everglades sawgrass / reed tufts along natural riverbanks
              ctx.strokeStyle = '#4d7c46';
              ctx.lineWidth = 1.5;
              const sway = Math.sin(nowSec * 2.2 + gy) * 2.5;
              for (let ryOff = 24; ryOff < TILE_SIZE - 20; ryOff += 46) {
                const rxBase = wx - 5 + coastCurveY(wy + ryOff) * 0.45;
                ctx.beginPath();
                ctx.moveTo(rxBase, wy + ryOff);
                ctx.lineTo(rxBase - 5 + sway, wy + ryOff - 7);
                ctx.moveTo(rxBase, wy + ryOff);
                ctx.lineTo(rxBase - 2 + sway, wy + ryOff + 6);
                ctx.stroke();
              }
            } else {
              ctx.fillStyle = 'rgba(4, 15, 28, 0.45)';
              ctx.fillRect(wx - 7, wy, 7, TILE_SIZE);
              ctx.fillStyle = `rgba(224, 242, 254, ${lapAlpha})`;
              ctx.fillRect(wx - 4, wy, 2, TILE_SIZE);
              ctx.fillStyle = '#57554f';
              ctx.fillRect(wx - 2, wy, 3, TILE_SIZE);
              ctx.fillStyle = '#a8a49c';
              ctx.fillRect(wx, wy, 8, TILE_SIZE);
              ctx.fillStyle = '#cfccc4';
              ctx.fillRect(wx, wy, 2.5, TILE_SIZE);
              ctx.fillStyle = '#27272a';
              for (let by = 26; by < TILE_SIZE; by += 54) {
                ctx.beginPath(); ctx.arc(wx + 4, wy + by, 2.6, 0, Math.PI * 2); ctx.fill();
              }
            }
          }
        }
        // East edge bordering water
        if (gx < GRID_W - 1 && worldGrid[gy][gx + 1] === 4) {
          const br = bridgeGrid[gy][gx + 1];
          if (!(br && br.axis === 'x')) {
            if (isNaturalBank(t, gx + 1, gy)) {
              const ex = wx + TILE_SIZE;
              ctx.fillStyle = '#4a3f31';
              ctx.beginPath();
              ctx.moveTo(ex - 12, wy);
              for (let s = 0; s <= 6; s++) {
                const sy = wy + (s / 6) * TILE_SIZE;
                ctx.lineTo(ex + 7 + coastCurveY(sy + 70) * 0.48, sy);
              }
              ctx.lineTo(ex - 12, wy + TILE_SIZE);
              ctx.closePath();
              ctx.fill();

              ctx.fillStyle = '#335c3b';
              ctx.beginPath();
              ctx.moveTo(ex - 14, wy);
              for (let s = 0; s <= 6; s++) {
                const sy = wy + (s / 6) * TILE_SIZE;
                ctx.lineTo(ex - 1 + coastCurveY(sy + 70) * 0.42, sy);
              }
              ctx.lineTo(ex - 14, wy + TILE_SIZE);
              ctx.closePath();
              ctx.fill();

              ctx.strokeStyle = '#4d7c46';
              ctx.lineWidth = 1.5;
              const sway = Math.sin(nowSec * 2.2 + gy + 1.5) * 2.5;
              for (let ryOff = 28; ryOff < TILE_SIZE - 20; ryOff += 46) {
                const rxBase = ex + 5 + coastCurveY(wy + ryOff + 70) * 0.45;
                ctx.beginPath();
                ctx.moveTo(rxBase, wy + ryOff);
                ctx.lineTo(rxBase + 5 + sway, wy + ryOff - 7);
                ctx.moveTo(rxBase, wy + ryOff);
                ctx.lineTo(rxBase + 2 + sway, wy + ryOff + 6);
                ctx.stroke();
              }
            } else {
              ctx.fillStyle = 'rgba(4, 15, 28, 0.52)';
              ctx.fillRect(wx + TILE_SIZE, wy, 9, TILE_SIZE);
              ctx.fillStyle = `rgba(224, 242, 254, ${lapAlpha})`;
              ctx.fillRect(wx + TILE_SIZE + 3, wy, 2, TILE_SIZE);
              ctx.fillStyle = '#57554f';
              ctx.fillRect(wx + TILE_SIZE - 2, wy, 4, TILE_SIZE);
              ctx.fillStyle = '#a8a49c';
              ctx.fillRect(wx + TILE_SIZE - 8, wy, 8, TILE_SIZE);
              ctx.fillStyle = '#cfccc4';
              ctx.fillRect(wx + TILE_SIZE - 8, wy, 2, TILE_SIZE);
              ctx.fillStyle = '#27272a';
              for (let by = 26; by < TILE_SIZE; by += 54) {
                ctx.beginPath(); ctx.arc(wx + TILE_SIZE - 4, wy + by, 2.6, 0, Math.PI * 2); ctx.fill();
              }
            }
          }
        }
      }
    }
  }

  function drawBridges(minGX, maxGX, minGY, maxGY, lightsOn, isRain, nowSec) {
    const sf = window.SpriteForge;
    const deckTex = sf.textures.bridgeDeck || sf.textures.asphalt;
    const MARGIN = 13; // 13px open water gap on BOTH sides of every bridge tile (134px viaduct deck)
    const DECK_W = TILE_SIZE - MARGIN * 2;
    const visibleSpans = [];

    for (let gy = Math.max(0, minGY - 1); gy <= Math.min(GRID_H - 1, maxGY + 1); gy++) {
      for (let gx = Math.max(0, minGX - 1); gx <= Math.min(GRID_W - 1, maxGX + 1); gx++) {
        const br = bridgeGrid[gy][gx];
        if (br) visibleSpans.push({ gx, gy, wx: gx * TILE_SIZE, wy: gy * TILE_SIZE, br });
      }
    }
    if (visibleSpans.length === 0) return;

    // Pass A: Deep Water Drop-Shadows & Concrete Support Pilings with Water Foam Collars
    for (let i = 0; i < visibleSpans.length; i++) {
      const { wx, wy, gx, gy, br } = visibleSpans[i];
      const foamPulse = Math.sin(nowSec * 3.1 + gx + gy) * 1.5;

      if (br.axis === 'x') {
        const spanW = br.closedEast ? TILE_SIZE - 14 : TILE_SIZE;
        ctx.fillStyle = 'rgba(3, 10, 22, 0.48)';
        ctx.fillRect(wx + 14, wy + MARGIN + 18, spanW, DECK_W);

        // Twin submerged concrete pier caps + white water foam collars
        for (const px of [wx + 36, wx + 116]) {
          if (br.closedEast && px > wx + TILE_SIZE - 28) continue;
          ctx.fillStyle = 'rgba(224, 242, 254, 0.42)';
          ctx.beginPath(); ctx.ellipse(px, wy + MARGIN - 1, 13 + foamPulse, 5, 0, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.ellipse(px, wy + TILE_SIZE - MARGIN + 3, 13 + foamPulse, 5, 0, 0, Math.PI * 2); ctx.fill();

          ctx.fillStyle = '#475569';
          ctx.fillRect(px - 9, wy + MARGIN - 5, 18, 8);
          ctx.fillRect(px - 9, wy + TILE_SIZE - MARGIN - 1, 18, 9);
          ctx.fillStyle = '#94a3b8';
          ctx.fillRect(px - 7, wy + MARGIN - 4, 14, 3);
        }
      } else {
        ctx.fillStyle = 'rgba(3, 10, 22, 0.48)';
        ctx.fillRect(wx + MARGIN + 16, wy + 16, DECK_W, TILE_SIZE);

        for (const py of [wy + 36, wy + 116]) {
          ctx.fillStyle = 'rgba(224, 242, 254, 0.42)';
          ctx.beginPath(); ctx.ellipse(wx + MARGIN - 1, py, 5, 13 + foamPulse, 0, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.ellipse(wx + TILE_SIZE - MARGIN + 3, py, 5, 13 + foamPulse, 0, 0, Math.PI * 2); ctx.fill();

          ctx.fillStyle = '#475569';
          ctx.fillRect(wx + MARGIN - 5, py - 9, 8, 18);
          ctx.fillRect(wx + TILE_SIZE - MARGIN - 1, py - 9, 9, 18);
        }
      }
    }

    // Pass B: Pre-Stressed Concrete Viaduct Deck, Flared Shore Abutments, Walkways & Lane Markings
    for (let i = 0; i < visibleSpans.length; i++) {
      const { gx, gy, wx, wy, br } = visibleSpans[i];

      if (br.axis === 'x') {
        const spanW = br.closedEast ? TILE_SIZE - 16 : TILE_SIZE;
        // Outer dark steel box-girder fascia edge
        ctx.fillStyle = '#334155';
        ctx.fillRect(wx, wy + MARGIN - 3, spanW, DECK_W + 6);

        // Viaduct concrete roadway surface
        ctx.drawImage(deckTex, 0, MARGIN, spanW, DECK_W, wx, wy + MARGIN, spanW, DECK_W);
        if (isRain) {
          ctx.fillStyle = 'rgba(14, 165, 233, 0.09)';
          ctx.fillRect(wx, wy + MARGIN, spanW, DECK_W);
        }

        // Raised pedestrian concrete sidewalks flanking the roadway
        ctx.fillStyle = '#aba89f';
        ctx.fillRect(wx, wy + MARGIN + 4, spanW, 9);
        ctx.fillRect(wx, wy + TILE_SIZE - MARGIN - 13, spanW, 9);
        ctx.fillStyle = 'rgba(234, 179, 8, 0.72)';
        ctx.fillRect(wx, wy + MARGIN + 13, spanW, 1.8);
        ctx.fillRect(wx, wy + TILE_SIZE - MARGIN - 14.8, spanW, 1.8);

        // Double yellow highway centerline + white lane dashes
        ctx.fillStyle = 'rgba(234, 179, 8, 0.85)';
        ctx.fillRect(wx, wy + TILE_SIZE * 0.5 - 3.5, spanW - (br.closedEast ? 16 : 0), 2.2);
        ctx.fillRect(wx, wy + TILE_SIZE * 0.5 + 1.3, spanW - (br.closedEast ? 16 : 0), 2.2);
        ctx.fillStyle = 'rgba(248, 250, 252, 0.42)';
        for (let d = 14; d < spanW - 20; d += 38) {
          ctx.fillRect(wx + d, wy + TILE_SIZE * 0.5 - 28, 16, 2);
          ctx.fillRect(wx + d, wy + TILE_SIZE * 0.5 + 26, 16, 2);
        }

        // Steel finger expansion joints at tile seams & center
        ctx.fillStyle = '#475569';
        ctx.fillRect(wx, wy + MARGIN + 4, 3, DECK_W - 8);
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(wx + 1, wy + MARGIN + 4, 1, DECK_W - 8);

        // Flared concrete shore abutments where bridge meets land road
        if (gx > 0 && !hasBridgeAt(gx - 1, gy) && worldGrid[gy][gx - 1] !== 4) {
          ctx.fillStyle = '#9c988e';
          ctx.beginPath();
          ctx.moveTo(wx - 8, wy); ctx.lineTo(wx + 14, wy + MARGIN); ctx.lineTo(wx - 8, wy + MARGIN + 4); ctx.closePath(); ctx.fill();
          ctx.beginPath();
          ctx.moveTo(wx - 8, wy + TILE_SIZE); ctx.lineTo(wx + 14, wy + TILE_SIZE - MARGIN); ctx.lineTo(wx - 8, wy + TILE_SIZE - MARGIN - 4); ctx.closePath(); ctx.fill();
          ctx.fillStyle = '#334155';
          ctx.fillRect(wx - 2, wy + MARGIN, 5, DECK_W);
        }
        if (!br.closedEast && gx < GRID_W - 1 && !hasBridgeAt(gx + 1, gy) && worldGrid[gy][gx + 1] !== 4) {
          ctx.fillStyle = '#9c988e';
          ctx.beginPath();
          ctx.moveTo(wx + TILE_SIZE + 8, wy); ctx.lineTo(wx + TILE_SIZE - 14, wy + MARGIN); ctx.lineTo(wx + TILE_SIZE + 8, wy + MARGIN + 4); ctx.closePath(); ctx.fill();
          ctx.beginPath();
          ctx.moveTo(wx + TILE_SIZE + 8, wy + TILE_SIZE); ctx.lineTo(wx + TILE_SIZE - 14, wy + TILE_SIZE - MARGIN); ctx.lineTo(wx + TILE_SIZE + 8, wy + TILE_SIZE - MARGIN - 4); ctx.closePath(); ctx.fill();
          ctx.fillStyle = '#334155';
          ctx.fillRect(wx + TILE_SIZE - 3, wy + MARGIN, 5, DECK_W);
        }
      } else {
        // North-South Bridge Span (axis === 'y')
        ctx.fillStyle = '#334155';
        ctx.fillRect(wx + MARGIN - 3, wy, DECK_W + 6, TILE_SIZE);

        ctx.drawImage(deckTex, MARGIN, 0, DECK_W, TILE_SIZE, wx + MARGIN, wy, DECK_W, TILE_SIZE);
        if (isRain) {
          ctx.fillStyle = 'rgba(14, 165, 233, 0.09)';
          ctx.fillRect(wx + MARGIN, wy, DECK_W, TILE_SIZE);
        }

        ctx.fillStyle = '#aba89f';
        ctx.fillRect(wx + MARGIN + 4, wy, 9, TILE_SIZE);
        ctx.fillRect(wx + TILE_SIZE - MARGIN - 13, wy, 9, TILE_SIZE);
        ctx.fillStyle = 'rgba(234, 179, 8, 0.72)';
        ctx.fillRect(wx + MARGIN + 13, wy, 1.8, TILE_SIZE);
        ctx.fillRect(wx + TILE_SIZE - MARGIN - 14.8, wy, 1.8, TILE_SIZE);

        ctx.fillStyle = 'rgba(234, 179, 8, 0.85)';
        ctx.fillRect(wx + TILE_SIZE * 0.5 - 3.5, wy, 2.2, TILE_SIZE);
        ctx.fillRect(wx + TILE_SIZE * 0.5 + 1.3, wy, 2.2, TILE_SIZE);

        ctx.fillStyle = '#475569';
        ctx.fillRect(wx + MARGIN + 4, wy, DECK_W - 8, 3);

        // Shore abutments North / South
        if (gy > 0 && !hasBridgeAt(gx, gy - 1) && worldGrid[gy - 1][gx] !== 4) {
          ctx.fillStyle = '#9c988e';
          ctx.beginPath();
          ctx.moveTo(wx, wy - 8); ctx.lineTo(wx + MARGIN, wy + 14); ctx.lineTo(wx + MARGIN + 4, wy - 8); ctx.closePath(); ctx.fill();
          ctx.beginPath();
          ctx.moveTo(wx + TILE_SIZE, wy - 8); ctx.lineTo(wx + TILE_SIZE - MARGIN, wy + 14); ctx.lineTo(wx + TILE_SIZE - MARGIN - 4, wy - 8); ctx.closePath(); ctx.fill();
          ctx.fillStyle = '#334155';
          ctx.fillRect(wx + MARGIN, wy - 2, DECK_W, 5);
        }
        if (gy < GRID_H - 1 && !hasBridgeAt(gx, gy + 1) && worldGrid[gy + 1][gx] !== 4) {
          ctx.fillStyle = '#9c988e';
          ctx.beginPath();
          ctx.moveTo(wx, wy + TILE_SIZE + 8); ctx.lineTo(wx + MARGIN, wy + TILE_SIZE - 14); ctx.lineTo(wx + MARGIN + 4, wy + TILE_SIZE + 8); ctx.closePath(); ctx.fill();
          ctx.beginPath();
          ctx.moveTo(wx + TILE_SIZE, wy + TILE_SIZE + 8); ctx.lineTo(wx + TILE_SIZE - MARGIN, wy + TILE_SIZE - 14); ctx.lineTo(wx + TILE_SIZE - MARGIN - 4, wy + TILE_SIZE + 8); ctx.closePath(); ctx.fill();
          ctx.fillStyle = '#334155';
          ctx.fillRect(wx + MARGIN, wy + TILE_SIZE - 3, DECK_W, 5);
        }
      }
    }

    // Pass C: Raised 3D Concrete Jersey Barriers, Amber Reflectors & Warm Bridge Light Standards
    for (let i = 0; i < visibleSpans.length; i++) {
      const { wx, wy, br } = visibleSpans[i];

      if (br.axis === 'x') {
        const spanW = br.closedEast ? TILE_SIZE - 16 : TILE_SIZE;
        // Top & bottom beveled Jersey barriers
        for (const ry of [wy + MARGIN - 1, wy + TILE_SIZE - MARGIN - 5]) {
          ctx.fillStyle = '#475569';
          ctx.fillRect(wx, ry, spanW, 6);
          ctx.fillStyle = '#cbd5e1';
          ctx.fillRect(wx, ry + 1, spanW, 3);
          // Amber bridge safety reflectors & warm lamp posts
          for (let rx = 18; rx < spanW - 8; rx += 36) {
            ctx.fillStyle = lightsOn ? '#fbbf24' : '#d97706';
            ctx.fillRect(wx + rx, ry + 1.5, 4, 2.2);
          }
        }
        // Closed East Observation Pier head bumper barrier
        if (br.closedEast) {
          const ex = wx + TILE_SIZE - 20;
          ctx.fillStyle = '#aba89f';
          ctx.fillRect(ex - 10, wy + MARGIN + 4, 12, DECK_W - 8);
          ctx.fillStyle = '#475569';
          ctx.fillRect(ex, wy + MARGIN - 1, 7, DECK_W + 2);
          ctx.fillStyle = '#e2e8f0';
          ctx.fillRect(ex + 1, wy + MARGIN + 1, 3, DECK_W - 2);
          // Red/amber hazardchevron markers on pier end
          ctx.fillStyle = '#dc2626';
          for (let py = wy + MARGIN + 10; py < wy + TILE_SIZE - MARGIN - 14; py += 18) {
            ctx.fillRect(ex - 1, py, 3, 9);
          }
        }
        if (lightsOn) {
          const lGrad = ctx.createRadialGradient(wx + 80, wy + 80, 4, wx + 80, wy + 80, 74);
          lGrad.addColorStop(0, 'rgba(255, 232, 185, 0.22)');
          lGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = lGrad;
          ctx.beginPath(); ctx.arc(wx + 80, wy + 80, 74, 0, Math.PI * 2); ctx.fill();
        }
      } else {
        for (const rx of [wx + MARGIN - 1, wx + TILE_SIZE - MARGIN - 5]) {
          ctx.fillStyle = '#475569';
          ctx.fillRect(rx, wy, 6, TILE_SIZE);
          ctx.fillStyle = '#cbd5e1';
          ctx.fillRect(rx + 1, wy, 3, TILE_SIZE);
          for (let ry = 18; ry < TILE_SIZE - 8; ry += 36) {
            ctx.fillStyle = lightsOn ? '#fbbf24' : '#d97706';
            ctx.fillRect(rx + 1.5, wy + ry, 2.2, 4);
          }
        }
      }
    }
  }

  function drawBridgeSuperstructures(minGX, maxGX, minGY, maxGY, lightsOn) {
    for (let gy = Math.max(0, minGY - 1); gy <= Math.min(GRID_H - 1, maxGY + 1); gy++) {
      for (let gx = Math.max(0, minGX - 1); gx <= Math.min(GRID_W - 1, maxGX + 1); gx++) {
        const br = bridgeGrid[gy][gx];
        if (!br) continue;
        const wx = gx * TILE_SIZE;
        const wy = gy * TILE_SIZE;

        // 1. Cable-Stayed Concrete & Steel H-Pylons on Biscayne Bay Grand Causeways
        if (br.style === 'causeway' && br.isTower) {
          const towerH = 98;
          const fTop = towerH * 0.0022;
          const fCross = towerH * 0.72 * 0.0022;
          const cx = wx + TILE_SIZE * 0.5;
          const nBaseY = wy + 13;
          const sBaseY = wy + TILE_SIZE - 13;

          const nTopX = cx + (cx - camera.x) * fTop;
          const nTopY = nBaseY + (nBaseY - camera.y) * fTop;
          const sTopX = cx + (cx - camera.x) * fTop;
          const sTopY = sBaseY + (sBaseY - camera.y) * fTop;

          // Taut diagonal steel stay-cables fanning East & West to deck parapets
          ctx.save();
          ctx.strokeStyle = 'rgba(203, 213, 225, 0.76)';
          ctx.lineWidth = 1.4;
          for (const dOff of [-155, -105, -58, 58, 105, 155]) {
            ctx.beginPath();
            ctx.moveTo(nTopX, nTopY); ctx.lineTo(cx + dOff, nBaseY);
            ctx.moveTo(sTopX, sTopY); ctx.lineTo(cx + dOff, sBaseY);
            ctx.stroke();
          }

          // Overhead concrete cross-portal linking North & South pylons
          const nCrossX = cx + (cx - camera.x) * fCross;
          const nCrossY = nBaseY + (nBaseY - camera.y) * fCross;
          const sCrossX = cx + (cx - camera.x) * fCross;
          const sCrossY = sBaseY + (sBaseY - camera.y) * fCross;
          ctx.strokeStyle = '#94a3b8';
          ctx.lineWidth = 6;
          ctx.beginPath(); ctx.moveTo(nCrossX, nCrossY); ctx.lineTo(sCrossX, sCrossY); ctx.stroke();

          // Extruded North & South concrete pylon columns
          for (const [bx, by, tx, ty] of [[cx, nBaseY, nTopX, nTopY], [cx, sBaseY, sTopX, sTopY]]) {
            ctx.strokeStyle = '#64748b';
            ctx.lineWidth = 11;
            ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(tx, ty); ctx.stroke();
            ctx.strokeStyle = '#e2e8f0';
            ctx.lineWidth = 5;
            ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(tx, ty); ctx.stroke();

            ctx.fillStyle = '#f8fafc';
            ctx.fillRect(tx - 6, ty - 6, 12, 12);
            ctx.strokeStyle = '#475569';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(tx - 6, ty - 6, 12, 12);
            if (lightsOn) {
              ctx.fillStyle = '#ef4444';
              ctx.beginPath(); ctx.arc(tx, ty, 3, 0, Math.PI * 2); ctx.fill();
            }
          }
          ctx.restore();
        } else if (br.style === 'truss' && br.axis === 'x') {
          // 2. Weathered Steel Warren-Truss River Bridges across Everglades Bayou
          const trussH = 38;
          const f = trussH * 0.0022;
          const nY = wy + 13;
          const sY = wy + TILE_SIZE - 13;
          const x1 = wx + 4, x2 = wx + TILE_SIZE - 4;
          const nx1 = x1 + (x1 - camera.x) * f, ny1 = nY + (nY - camera.y) * f;
          const nx2 = x2 + (x2 - camera.x) * f, ny2 = nY + (nY - camera.y) * f;
          const sx1 = x1 + (x1 - camera.x) * f, sy1 = sY + (sY - camera.y) * f;
          const sx2 = x2 + (x2 - camera.x) * f, sy2 = sY + (sY - camera.y) * f;

          ctx.save();
          ctx.strokeStyle = '#57534e';
          ctx.lineWidth = 3.2;
          // Top steel chords
          ctx.beginPath();
          ctx.moveTo(nx1, ny1); ctx.lineTo(nx2, ny2);
          ctx.moveTo(sx1, sy1); ctx.lineTo(sx2, sy2);
          ctx.stroke();

          // Diagonal web members + overhead portal struts
          ctx.lineWidth = 2.2;
          ctx.strokeStyle = '#78716c';
          for (let s = 0; s <= 4; s++) {
            const t = s / 4;
            const bx = x1 + (x2 - x1) * t;
            const tnx = nx1 + (nx2 - nx1) * t, tny = ny1 + (ny2 - ny1) * t;
            const tsx = sx1 + (sx2 - sx1) * t, tsy = sy1 + (sy2 - sy1) * t;
            ctx.beginPath();
            ctx.moveTo(bx, nY); ctx.lineTo(tnx, tny);
            ctx.moveTo(bx, sY); ctx.lineTo(tsx, tsy);
            if (s % 2 === 0) {
              ctx.moveTo(tnx, tny); ctx.lineTo(tsx, tsy);
            }
            ctx.stroke();
          }
          ctx.restore();
        }
      }
    }
  }

  // ==========================================
  // 11C. GROUNDED 2.5D ARCHITECTURAL FACADES, ROOFS & MULTI-TIER VOLUMES
  // ==========================================
  function drawArchitecturalWall(x1, y1, x2, y2, rx2, ry2, rx1, ry1, vol, isSunlit, lightsOn) {
    const style = vol.facadeStyle || 'masonry';
    const baseShade = isSunlit ? 10 : -16;
    const wallFill = shadeHex(vol.wallColor, baseShade);
    const trimCol = vol.trimColor || shadeHex(vol.wallColor, -28);

    // 1. Base Wall Polygon + Warm Golden-Hour / Dawn Direct Sunlight Wash on Sunlit Orientations
    ctx.fillStyle = wallFill;
    ctx.beginPath();
    ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.lineTo(rx2, ry2); ctx.lineTo(rx1, ry1);
    ctx.closePath();
    ctx.fill();

    if (isSunlit && envState.solarWarmth > 0.12 && !envState.lightsOn) {
      ctx.fillStyle = `rgba(251, 146, 60, ${(envState.solarWarmth * 0.14).toFixed(3)})`;
      ctx.fill();
    }

    ctx.strokeStyle = shadeHex(vol.wallColor, -42);
    ctx.lineWidth = 1.1;
    ctx.stroke();

    const wallLen = Math.hypot(x2 - x1, y2 - y1);
    const deltaH = Math.max(12, vol.height - (vol.baseHeight || 0));

    // Helper to bilinearly map (u in [0..1] along wall, v in [0..1] bottom-to-top) to screen (x, y)
    const ptAt = (u, v) => {
      const bx = x1 + (x2 - x1) * u;
      const by = y1 + (y2 - y1) * u;
      const tx = rx1 + (rx2 - rx1) * u;
      const ty = ry1 + (ry2 - ry1) * u;
      return [bx + (tx - bx) * v, by + (ty - by) * v];
    };

    const fillQuadUV = (u1, u2, v1, v2, color) => {
      const [ax, ay] = ptAt(u1, v1);
      const [bx, by] = ptAt(u2, v1);
      const [cx, cy] = ptAt(u2, v2);
      const [dx, dy] = ptAt(u1, v2);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.lineTo(cx, cy); ctx.lineTo(dx, dy);
      ctx.closePath();
      ctx.fill();
    };

    const drawWallFractures = () => {
      if (!vol.cracks || vol.cracks <= 0) return;
      ctx.strokeStyle = 'rgba(18, 16, 15, 0.85)';
      ctx.lineWidth = 1.6;
      for (let c = 0; c < vol.cracks; c++) {
        const u0 = 0.16 + ((c * 0.29 + (vol.x * 0.013)) % 0.68);
        const [p0x, p0y] = ptAt(u0, 0.04);
        const [p1x, p1y] = ptAt(Math.min(0.95, u0 + (c % 2 === 0 ? 0.08 : -0.07)), 0.38);
        const [p2x, p2y] = ptAt(Math.max(0.05, u0 + (c % 2 === 0 ? -0.05 : 0.09)), 0.72);
        const [p3x, p3y] = ptAt(u0 + (c % 2 === 0 ? 0.04 : -0.04), 0.94);
        ctx.beginPath();
        ctx.moveTo(p0x, p0y);
        ctx.lineTo(p1x, p1y);
        ctx.lineTo(p2x, p2y);
        if (c < 3 || vol.collapsing) ctx.lineTo(p3x, p3y);
        ctx.stroke();
      }
    };

    // 2. Specialized Facade Treatments
    if (style === 'container') {
      const ribs = Math.max(4, Math.floor(wallLen / 8));
      const ribShade = shadeHex(vol.wallColor, baseShade - 22);
      for (let r = 1; r < ribs; r += 2) {
        fillQuadUV(r / ribs, (r + 0.45) / ribs, 0.06, 0.94, ribShade);
      }
      fillQuadUV(0, 1, 0.88, 1.0, shadeHex(vol.wallColor, 18));
      drawWallFractures();
      return;
    }

    if (style === 'parking') {
      const decks = Math.max(2, Math.round(deltaH / 14));
      for (let d = 0; d < decks; d++) {
        const vOpen1 = (d + 0.34) / decks;
        const vOpen2 = (d + 0.84) / decks;
        fillQuadUV(0.05, 0.95, vOpen1, vOpen2, lightsOn ? 'rgba(38, 36, 33, 0.78)' : 'rgba(30, 35, 42, 0.72)');
        if (lightsOn && d % 2 === 0) {
          fillQuadUV(0.08, 0.92, vOpen2 - 0.08, vOpen2, 'rgba(254, 240, 195, 0.42)');
        }
      }
      drawWallFractures();
      return;
    }

    if (style === 'industrial') {
      const ribs = Math.max(4, Math.floor(wallLen / 12));
      const ribCol = shadeHex(vol.wallColor, baseShade - 16);
      for (let r = 0; r < ribs; r += 2) {
        fillQuadUV((r + 0.2) / ribs, (r + 0.5) / ribs, 0.05, 0.95, ribCol);
      }
      // Ground-level steel roll-up loading bay doors + clerestory windows near roof
      if ((vol.baseHeight || 0) === 0 && wallLen >= 48 && !vol.shape) {
        const bays = Math.max(1, Math.min(3, Math.floor(wallLen / 42)));
        for (let b = 0; b < bays; b++) {
          const u1 = (b + 0.22) / bays;
          const u2 = (b + 0.78) / bays;
          fillQuadUV(u1, u2, 0.0, 0.44, '#3f454d');
          fillQuadUV(u1, u2, 0.42, 0.48, trimCol);
        }
      }
      fillQuadUV(0.08, 0.92, 0.72, 0.86, lightsOn ? 'rgba(253, 230, 170, 0.62)' : 'rgba(148, 163, 184, 0.48)');
      drawWallFractures();
      return;
    }

    // 3. Calm Architectural Facades: Windowless ('none'), Sparse Ribbon ('minimal'), & Shatterable Glass ('glazed')
    const winMode = vol.windowMode || 'glazed';

    // Top cornice / frieze band on Masonry & Art Deco buildings
    if (style === 'masonry' || style === 'art_deco') {
      fillQuadUV(0, 1, 0.91, 1.0, trimCol);
      if (style === 'art_deco') {
        fillQuadUV(0, 1, 0.83, 0.87, trimCol);
      }
    }

    // Street-level storefront glazing + fabric awnings on ground-tier Masonry & Art Deco facades
    const hasStorefront = (vol.baseHeight || 0) === 0 && vol.awningColor && wallLen >= 34 && (style === 'masonry' || style === 'art_deco');
    if (hasStorefront) {
      const vShopTop = Math.min(0.26, 12 / Math.max(20, deltaH));
      fillQuadUV(0.10, 0.90, 0.02, vShopTop * 0.78, lightsOn ? 'rgba(255, 236, 179, 0.72)' : 'rgba(51, 65, 85, 0.60)');
      fillQuadUV(0.06, 0.94, vShopTop * 0.74, vShopTop * 1.06, vol.awningColor);
    }

    // Mode A: Clean Architectural Stucco / Precast Masonry Wall (ZERO window-grid noise!)
    if (winMode === 'none') {
      fillQuadUV(0, 1, 0.48, 0.52, shadeHex(trimCol, -6));
      if (style === 'art_deco' && wallLen >= 40) {
        fillQuadUV(0.46, 0.54, hasStorefront ? 0.28 : 0.05, 0.83, trimCol);
      }
      if (vol.burnTimer > 0) {
        fillQuadUV(0.12, 0.88, 0.08, 0.62, 'rgba(28, 25, 23, 0.45)');
      }
      drawWallFractures();
      return;
    }

    // Mode B: Minimalist Architectural Clerestory / Balcony Bands (Calm, uncluttered facades!)
    if (winMode === 'minimal') {
      const bands = Math.max(1, Math.min(3, Math.round(deltaH / 28)));
      for (let b = 0; b < bands; b++) {
        const v1 = 0.34 + (b / bands) * 0.48;
        const v2 = v1 + 0.08;
        if (style === 'balcony') {
          fillQuadUV(0.06, 0.94, v1 - 0.03, v1 + 0.02, '#e7e5e4');
        }
        const bandCol = (lightsOn && ((b + Math.round(vol.x)) % 2 === 0))
          ? 'rgba(255, 236, 185, 0.65)'
          : 'rgba(51, 65, 85, 0.46)';
        fillQuadUV(0.14, 0.86, v1, v2, bandCol);
      }
      if (vol.burnTimer > 0) {
        fillQuadUV(0.12, 0.88, 0.08, 0.62, 'rgba(28, 25, 23, 0.45)');
      }
      drawWallFractures();
      return;
    }

    // Mode C: Glazed Curtain-Wall / Shatterable Glass Panes (Visibly shatters into jagged cavities when hit!)
    const floors = Math.max(2, Math.min(5, Math.round(deltaH / 22)));
    const cols = Math.max(2, Math.min(4, Math.round(wallLen / 28)));
    const seedBase = Math.round(vol.x * 0.37 + vol.y * 0.73);
    const startFloor = hasStorefront ? 1 : 0;
    const brokenSet = vol.parent && vol.parent.brokenWindows;

    for (let f = startFloor; f < floors; f++) {
      const v1 = (f + (style === 'curtain_glass' ? 0.14 : 0.26)) / floors;
      const v2 = (f + (style === 'curtain_glass' ? 0.82 : 0.70)) / floors;

      if (style === 'balcony') {
        fillQuadUV(0.04, 0.96, Math.max(0, v1 - 0.04), v1 + 0.02, '#e7e5e4');
      } else if (style === 'art_deco' && f % 2 === 1) {
        fillQuadUV(0.04, 0.96, v2, Math.min(0.9, v2 + 0.03), trimCol);
      }

      for (let c = 0; c < cols; c++) {
        const u1 = (c + (style === 'curtain_glass' ? 0.10 : 0.20)) / cols;
        const u2 = (c + (style === 'curtain_glass' ? 0.90 : 0.80)) / cols;
        const paneId = ((vol.tierLevel * 16 + f * 4 + c) % 48);

        // Shattered Window Pane: Dark breached interior + jagged pale-cyan glass teeth!
        if (brokenSet && brokenSet.has(paneId)) {
          fillQuadUV(u1, u2, v1, v2, 'rgba(9, 13, 20, 0.92)');
          const [ax, ay] = ptAt(u1, v1);
          const [bx, by] = ptAt(u2, v1);
          const [cx, cy] = ptAt(u2, v2);
          const [dx, dy] = ptAt(u1, v2);
          ctx.fillStyle = 'rgba(186, 230, 253, 0.72)';
          ctx.beginPath();
          ctx.moveTo(ax, ay);
          ctx.lineTo(ax + (bx - ax) * 0.32, ay + (by - ay) * 0.32 + (dy - ay) * 0.28);
          ctx.lineTo(ax + (bx - ax) * 0.55, ay + (by - ay) * 0.55);
          ctx.closePath();
          ctx.fill();
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(dx + (cx - dx) * 0.68, dy + (cy - dy) * 0.68 - (cy - by) * 0.30);
          ctx.lineTo(dx + (cx - dx) * 0.42, dy + (cy - dy) * 0.42);
          ctx.closePath();
          ctx.fill();
          continue;
        }

        const roomHash = (f * 19 + c * 31 + seedBase) % 11;
        let winCol;
        if (!vol.blackedOut && envState.windowLitQuota > 0 && roomHash < envState.windowLitQuota) {
          winCol = roomHash % 3 === 0
            ? 'rgba(226, 238, 248, 0.70)'
            : 'rgba(255, 236, 185, 0.76)';
        } else if (lightsOn) {
          winCol = style === 'curtain_glass' ? 'rgba(30, 41, 59, 0.62)' : 'rgba(28, 25, 23, 0.68)';
        } else {
          if (style === 'curtain_glass') {
            winCol = envState.solarWarmth > 0.35 && isSunlit
              ? (roomHash % 2 === 0 ? 'rgba(253, 186, 116, 0.42)' : 'rgba(148, 184, 214, 0.36)')
              : (roomHash % 2 === 0 ? 'rgba(148, 184, 214, 0.42)' : 'rgba(100, 138, 172, 0.34)');
          } else {
            winCol = 'rgba(45, 55, 68, 0.54)';
          }
        }
        fillQuadUV(u1, u2, v1, v2, winCol);
      }
    }
    if (vol.burnTimer > 0) {
      fillQuadUV(0.12, 0.88, 0.08, 0.58, 'rgba(249, 115, 22, 0.24)');
    }
    drawWallFractures();
  }

  function drawArchitecturalRoof(rx, ry, w, h, vol) {
    const sf = window.SpriteForge;
    const rType = vol.roofType || 'clean_coping';
    const roofBase = vol.roofColor || shadeHex(vol.wallColor, -18);
    const copingCol = vol.trimColor || shadeHex(roofBase, 22);

    // Base roof fill
    ctx.fillStyle = roofBase;
    ctx.fillRect(rx, ry, w, h);

    // Subtle SpriteForge architectural texture overlay where appropriate
    if (w >= 44 && h >= 44) {
      if (rType === 'pool_terrace') {
        ctx.drawImage(sf.textures.roofs[1], rx + 3, ry + 3, w - 6, h - 6);
      } else if (rType === 'helipad') {
        ctx.drawImage(sf.textures.roofs[2], rx + 3, ry + 3, w - 6, h - 6);
      } else if (rType === 'green_roof') {
        ctx.drawImage(sf.textures.roofs[5], rx + 3, ry + 3, w - 6, h - 6);
      }
    }

    // Scale-true procedural architectural roof structures (never stretched or neon!)
    if (rType === 'terracotta_hip') {
      // Hipped Spanish clay tile roof with warm ridge lines (Star Island Villas)
      const cx = rx + w * 0.5;
      const cy = ry + h * 0.5;
      ctx.fillStyle = shadeHex(roofBase, 14);
      ctx.beginPath();
      ctx.moveTo(rx, ry); ctx.lineTo(rx + w, ry);
      ctx.lineTo(w >= h ? rx + w - h * 0.42 : cx, w >= h ? cy : ry + h - w * 0.42);
      ctx.lineTo(w >= h ? rx + h * 0.42 : cx, w >= h ? cy : ry + w * 0.42);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = shadeHex(roofBase, -28);
      ctx.lineWidth = 1.6;
      ctx.strokeRect(rx + 1, ry + 1, w - 2, h - 2);

      ctx.strokeStyle = shadeHex(roofBase, 32);
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      if (w >= h) {
        const inset = Math.min(w * 0.35, h * 0.44);
        ctx.moveTo(rx + inset, cy); ctx.lineTo(rx + w - inset, cy);
        ctx.moveTo(rx, ry); ctx.lineTo(rx + inset, cy);
        ctx.moveTo(rx, ry + h); ctx.lineTo(rx + inset, cy);
        ctx.moveTo(rx + w, ry); ctx.lineTo(rx + w - inset, cy);
        ctx.moveTo(rx + w, ry + h); ctx.lineTo(rx + w - inset, cy);
      } else {
        const inset = Math.min(h * 0.35, w * 0.44);
        ctx.moveTo(cx, ry + inset); ctx.lineTo(cx, ry + h - inset);
        ctx.moveTo(rx, ry); ctx.lineTo(cx, ry + inset);
        ctx.moveTo(rx + w, ry); ctx.lineTo(cx, ry + inset);
        ctx.moveTo(rx, ry + h); ctx.lineTo(cx, ry + h - inset);
        ctx.moveTo(rx + w, ry + h); ctx.lineTo(cx, ry + h - inset);
      }
      ctx.stroke();
      return;
    }

    if (rType === 'sawtooth') {
      const bays = Math.max(2, Math.floor(h / 20));
      const bh = (h - 8) / bays;
      for (let b = 0; b < bays; b++) {
        const by = ry + 4 + b * bh;
        ctx.fillStyle = shadeHex(roofBase, -14);
        ctx.fillRect(rx + 4, by, w - 8, bh * 0.62);
        // North-light industrial skylight strip
        ctx.fillStyle = 'rgba(186, 214, 235, 0.58)';
        ctx.fillRect(rx + 5, by + bh * 0.62, w - 10, bh * 0.28);
      }
    } else if (rType === 'corrugated') {
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.18)';
      ctx.lineWidth = 1;
      for (let sx = rx + 6; sx < rx + w - 4; sx += 6) {
        ctx.beginPath(); ctx.moveTo(sx, ry + 2); ctx.lineTo(sx, ry + h - 2); ctx.stroke();
      }
    } else if (rType === 'parking_deck') {
      ctx.fillStyle = '#5c6066';
      ctx.fillRect(rx + 4, ry + 4, w - 8, h - 8);
      ctx.strokeStyle = 'rgba(234, 179, 8, 0.65)';
      ctx.lineWidth = 1.2;
      for (let px = rx + 12; px < rx + w - 14; px += 12) {
        ctx.beginPath();
        ctx.moveTo(px, ry + 6); ctx.lineTo(px, ry + 22);
        ctx.moveTo(px, ry + h - 22); ctx.lineTo(px, ry + h - 6);
        ctx.stroke();
      }
      // Elevator stair core on corner of deck
      ctx.fillStyle = '#8d9196';
      ctx.fillRect(rx + w - 26, ry + 6, 18, 16);
    } else if (rType === 'gravel_mech' && w >= 30 && h >= 30) {
      // Gravel tar roof + concrete elevator bulkhead + galvanized HVAC chillers
      const mw = Math.min(26, w * 0.36);
      const mh = Math.min(20, h * 0.34);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.26)';
      ctx.fillRect(rx + 11, ry + 11, mw, mh);
      ctx.fillStyle = shadeHex(roofBase, 22);
      ctx.fillRect(rx + 9, ry + 9, mw, mh);
      ctx.strokeStyle = shadeHex(roofBase, -20);
      ctx.lineWidth = 1;
      ctx.strokeRect(rx + 9, ry + 9, mw, mh);

      if (w >= 48 && h >= 44) {
        for (let u = 0; u < 2; u++) {
          const ux = rx + w - 18 - u * 13;
          const uy = ry + h - 18;
          ctx.fillStyle = '#94a3b8';
          ctx.fillRect(ux, uy, 10, 10);
          ctx.fillStyle = '#334155';
          ctx.beginPath(); ctx.arc(ux + 5, uy + 5, 3.2, 0, Math.PI * 2); ctx.fill();
        }
      }
    } else if (rType === 'water_tower' && w >= 28 && h >= 28) {
      // Classic urban rooftop cedar barrel water tank + steel frame shadow
      const tx = rx + w * 0.62;
      const ty = ry + h * 0.42;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.34)';
      ctx.beginPath(); ctx.arc(tx + 4, ty + 4, 8.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#7c5338';
      ctx.beginPath(); ctx.arc(tx, ty, 8, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#3f2a1d';
      ctx.lineWidth = 1.4;
      ctx.stroke();
      ctx.fillStyle = '#5c3d28';
      ctx.beginPath(); ctx.arc(tx, ty, 3, 0, Math.PI * 2); ctx.fill();
    }

    // Natural stone / precast concrete parapet coping around perimeter (ZERO glowing neon!)
    ctx.strokeStyle = shadeHex(copingCol, -12);
    ctx.lineWidth = 3;
    ctx.strokeRect(rx + 1.5, ry + 1.5, w - 3, h - 3);
    ctx.strokeStyle = shadeHex(copingCol, 18);
    ctx.lineWidth = 1;
    ctx.strokeRect(rx + 0.5, ry + 0.5, w - 1, h - 1);

    // Structural slab fractures on heavily tank-damaged or actively caving-in roofs
    if (vol.cracks >= 2 || vol.collapsing) {
      ctx.strokeStyle = 'rgba(20, 18, 16, 0.82)';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(rx + w * 0.22, ry + 2);
      ctx.lineTo(rx + w * 0.48, ry + h * 0.46);
      ctx.lineTo(rx + w * 0.78, ry + h - 2);
      if (vol.cracks >= 4 || vol.collapsing) {
        ctx.moveTo(rx + 2, ry + h * 0.62);
        ctx.lineTo(rx + w * 0.48, ry + h * 0.46);
        ctx.lineTo(rx + w - 2, ry + h * 0.28);
      }
      ctx.stroke();
    }
  }

  function drawCylinderVolume(vol, bx, by, rx, ry, lightsOn) {
    const r = Math.min(vol.w, vol.h) * 0.5;
    const bcx = bx + vol.w * 0.5;
    const bcy = by + vol.h * 0.5;
    const rcx = rx + vol.w * 0.5;
    const rcy = ry + vol.h * 0.5;

    const dx = rcx - bcx;
    const dy = rcy - bcy;
    const dist = Math.hypot(dx, dy);

    // Extruded cylindrical drum body between base circle and roof circle
    if (dist > 0.5) {
      const px = (-dy / dist) * r;
      const py = (dx / dist) * r;
      const grad = ctx.createLinearGradient(bcx - px, bcy - py, bcx + px, bcy + py);
      grad.addColorStop(0, shadeHex(vol.wallColor, -28));
      grad.addColorStop(0.45, shadeHex(vol.wallColor, 14));
      grad.addColorStop(1, shadeHex(vol.wallColor, -18));

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(bcx + px, bcy + py);
      ctx.lineTo(rcx + px, rcy + py);
      ctx.lineTo(rcx - px, rcy - py);
      ctx.lineTo(bcx - px, bcy - py);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.arc(bcx, bcy, r, 0, Math.PI * 2); ctx.fill();

      // Horizontal floor rings / glass bands along the curved drum
      const rings = Math.max(2, Math.min(7, Math.round((vol.height - (vol.baseHeight || 0)) / 18)));
      ctx.strokeStyle = vol.facadeStyle === 'industrial'
        ? 'rgba(51, 65, 85, 0.38)'
        : (lightsOn ? 'rgba(254, 240, 195, 0.45)' : 'rgba(186, 214, 235, 0.42)');
      ctx.lineWidth = 2;
      const ang = Math.atan2(dy, dx);
      for (let k = 1; k < rings; k++) {
        const t = k / rings;
        const mcx = bcx + dx * t;
        const mcy = bcy + dy * t;
        ctx.beginPath();
        ctx.arc(mcx, mcy, r - 1, ang + Math.PI * 0.55, ang + Math.PI * 1.45);
        ctx.stroke();
      }
    }

    // Circular roof cap
    ctx.fillStyle = vol.roofColor || shadeHex(vol.wallColor, -14);
    ctx.beginPath(); ctx.arc(rcx, rcy, r, 0, Math.PI * 2); ctx.fill();

    if (vol.roofType === 'helipad' && r >= 28) {
      ctx.strokeStyle = '#eab308';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(rcx, rcy, r * 0.62, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = '#e2e8f0';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('H', rcx, rcy);
      ctx.textBaseline = 'alphabetic';
    } else if (vol.facadeStyle === 'industrial') {
      // Silo inspection hatch & steel rim
      ctx.strokeStyle = 'rgba(0,0,0,0.28)';
      ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.arc(rcx, rcy, r * 0.35, 0, Math.PI * 2); ctx.stroke();
    }

    ctx.strokeStyle = shadeHex(vol.trimColor || vol.roofColor, 16);
    ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(rcx, rcy, r - 1, 0, Math.PI * 2); ctx.stroke();
  }

  function drawBuildings25D(minGX, maxGX, minGY, maxGY, lightsOn, isRain) {
    const drawnSet = new Set();
    const volumes = [];

    for (let gy = minGY; gy <= maxGY; gy++) {
      for (let gx = minGX; gx <= maxGX; gx++) {
        const cellBlds = buildingsGrid[gy][gx];
        for (let i = 0; i < cellBlds.length; i++) {
          const b = cellBlds[i];
          if (b.collapsed || drawnSet.has(b)) continue;
          drawnSet.add(b);

          const collapseScale = b.collapsing ? Math.max(0.04, Math.pow(1 - b.collapseProgress, 1.45)) : 1;
          const shakeX = b.hitShake > 0 ? Math.sin(b.hitShake * 19 + b.x) * b.hitShake * 0.65 : 0;
          const shakeY = b.hitShake > 0 ? Math.cos(b.hitShake * 23 + b.y) * b.hitShake * 0.45 : 0;

          const anchorX = b.x + shakeX + b.w * 0.5;
          const anchorY = b.y + shakeY + b.h * 0.5;
          const distSq = (anchorX - camera.x) * (anchorX - camera.x) + (anchorY - camera.y) * (anchorY - camera.y);

          volumes.push({
            parent: b,
            tierLevel: 0,
            distSq,
            anchorX,
            anchorY,
            x: b.x + shakeX,
            y: b.y + shakeY,
            w: b.w,
            h: b.h,
            baseHeight: 0,
            height: b.height * collapseScale,
            shape: b.shape,
            wallColor: b.wallColor,
            roofColor: b.roofColor,
            trimColor: b.trimColor,
            awningColor: b.awningColor,
            facadeStyle: b.facadeStyle,
            windowMode: b.windowMode || 'glazed',
            burnTimer: b.burnTimer || 0,
            roofType: b.roofType,
            sign: b.sign,
            cracks: b.cracks || 0,
            collapsing: b.collapsing
          });

          if (b.tiers && b.tiers.length > 0) {
            let prevTop = b.height * collapseScale;
            for (let tIdx = 0; tIdx < b.tiers.length; tIdx++) {
              const tr = b.tiers[tIdx];
              const scaledTop = tr.height * collapseScale;
              volumes.push({
                parent: b,
                tierLevel: tIdx + 1,
                distSq,
                anchorX,
                anchorY,
                x: b.x + tr.dx + shakeX * (1 + tIdx * 0.35),
                y: b.y + tr.dy + shakeY * (1 + tIdx * 0.35),
                w: tr.w,
                h: tr.h,
                baseHeight: prevTop,
                height: scaledTop,
                shape: tr.shape,
                wallColor: tr.wallColor || b.wallColor,
                roofColor: tr.roofColor || b.roofColor,
                trimColor: tr.trimColor || b.trimColor,
                facadeStyle: tr.facadeStyle || b.facadeStyle,
                windowMode: tr.windowMode || b.windowMode || 'glazed',
                burnTimer: b.burnTimer || 0,
                roofType: tr.roofType || 'clean_coping',
                sign: null,
                cracks: b.cracks || 0,
                collapsing: b.collapsing
              });
              prevTop = scaledTop;
            }
          }
        }
      }
    }

    // Painter's Algorithm: Farthest buildings from camera first -> Closest last; lower tiers before upper tiers
    volumes.sort((a, b) => {
      if (a.parent === b.parent) return a.tierLevel - b.tierLevel;
      return b.distSq - a.distSq;
    });

    for (let i = 0; i < volumes.length; i++) {
      const vol = volumes[i];
      vol.blackedOut = isBlackedOutAt(vol.anchorX, vol.anchorY);
      const bldLit = lightsOn && !vol.blackedOut;
      const f0 = vol.baseHeight * 0.0022;
      const f1 = vol.height * 0.0022;
      const bx = vol.x + (vol.anchorX - camera.x) * f0;
      const by = vol.y + (vol.anchorY - camera.y) * f0;
      const rx = vol.x + (vol.anchorX - camera.x) * f1;
      const ry = vol.y + (vol.anchorY - camera.y) * f1;

      // Dynamic 24h Solar/Lunar Cast Ground Shadow (Westward at Dawn -> Tight at Noon -> Long Eastward at Sunset!)
      if (vol.tierLevel === 0) {
        if (isRain && !vol.blackedOut && (bldLit || envState.windowLitQuota > 2)) {
          ctx.fillStyle = 'rgba(255, 232, 180, 0.08)';
          ctx.fillRect(vol.x - 6, vol.y + vol.h, vol.w + 12, 14);
        }
        const hScale = 0.42 + Math.min(1.85, vol.height * 0.0065);
        const sdx = envState.shadowDX * hScale;
        const sdy = envState.shadowDY * hScale;
        ctx.fillStyle = `rgba(10, 14, 20, ${envState.shadowAlpha.toFixed(3)})`;
        if (vol.shape === 'cylinder') {
          ctx.beginPath();
          ctx.arc(vol.x + vol.w * 0.5 + sdx, vol.y + vol.h * 0.5 + sdy, Math.min(vol.w, vol.h) * 0.52, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillRect(vol.x + sdx, vol.y + sdy, vol.w + 4, vol.h + 4);
        }
      } else {
        // Upper setback shadow cast onto lower podium roof!
        ctx.fillStyle = `rgba(10, 14, 20, ${(envState.shadowAlpha * 0.78).toFixed(3)})`;
        if (vol.shape === 'cylinder') {
          ctx.beginPath();
          ctx.arc(bx + vol.w * 0.5 + envState.shadowDX * 0.25, by + vol.h * 0.5 + envState.shadowDY * 0.25, Math.min(vol.w, vol.h) * 0.5, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillRect(bx + envState.shadowDX * 0.25, by + envState.shadowDY * 0.25, vol.w + 3, vol.h + 3);
        }
      }

      if (vol.shape === 'cylinder') {
        drawCylinderVolume(vol, bx, by, rx, ry, bldLit);
        continue;
      }

      // Draw the two camera-facing extruded architectural walls with real-time solar orientation!
      if (ry > by) {
        // North wall facing camera (always shaded in northern hemisphere)
        drawArchitecturalWall(bx, by, bx + vol.w, by, rx + vol.w, ry, rx, ry, vol, false, bldLit);
      } else if (ry < by) {
        // South wall facing camera
        drawArchitecturalWall(bx, by + vol.h, bx + vol.w, by + vol.h, rx + vol.w, ry + vol.h, rx, ry + vol.h, vol, envState.southSunlit, bldLit);
      }

      if (rx > bx) {
        // West wall facing camera (sunlit in afternoon & Golden Hour / Vice Sunset!)
        drawArchitecturalWall(bx, by, bx, by + vol.h, rx, ry + vol.h, rx, ry, vol, envState.westSunlit, bldLit);
      } else if (rx < bx) {
        // East wall facing camera (sunlit at Atlantic Dawn & Miami Morning!)
        drawArchitecturalWall(bx + vol.w, by, bx + vol.w, by + vol.h, rx + vol.w, ry + vol.h, rx + vol.w, ry, vol, envState.eastSunlit, bldLit);
      }

      // Draw grounded architectural roof & coping
      drawArchitecturalRoof(rx, ry, vol.w, vol.h, vol);

      // Tasteful architectural cornice/fascia signage plaque on landmark buildings
      if (vol.sign && vol.w >= 64) {
        ctx.save();
        const plaqueW = Math.min(vol.w - 14, vol.sign.length * 6.8 + 14);
        const px = rx + (vol.w - plaqueW) * 0.5;
        const py = ry + vol.h - 22;
        ctx.fillStyle = 'rgba(28, 27, 25, 0.88)';
        ctx.fillRect(px, py, plaqueW, 15);
        ctx.strokeStyle = vol.trimColor || '#d6d3d1';
        ctx.lineWidth = 1.2;
        ctx.strokeRect(px, py, plaqueW, 15);
        ctx.fillStyle = bldLit ? '#fef3c7' : '#f5f5f4';
        ctx.font = 'bold 9.5px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(vol.sign, rx + vol.w * 0.5, py + 11);
        ctx.restore();
      }
    }
  }

  function drawPalmTree(tree, nowSec = 0) {
    const sf = window.SpriteForge;
    ctx.save();
    ctx.translate(tree.x, tree.y);

    // 0. Knocked-Down / Actively Falling Palm Tree (Snapped Stump + Felled Trunk Log + Splayed Frond Crown!)
    if (tree.falling || tree.fallen) {
      const p = tree.fallen ? 1 : Math.min(1, Math.max(0.06, tree.fallProgress || 0));
      const ease = 1 - Math.pow(1 - p, 2);
      const trunkLen = 42 * ease;

      // Jagged snapped wooden trunk stump & splinter ring remaining rooted at (0, 0)
      ctx.fillStyle = 'rgba(0, 0, 0, 0.30)';
      ctx.beginPath(); ctx.arc(2, 2, 7.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = tree.burnt ? '#1c1917' : '#5c2d0c';
      ctx.beginPath(); ctx.arc(0, 0, 6.8, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = tree.burnt ? '#44403c' : '#d6b27c';
      ctx.beginPath(); ctx.arc(0, 0, 4.0, 0, Math.PI * 2); ctx.fill();

      ctx.rotate(tree.fallAngle || 0);

      // Elongated ground contact shadow beneath falling/fallen trunk & crown
      const dropLift = (1 - ease) * 14;
      ctx.fillStyle = `rgba(6, 10, 14, ${(0.34 * ease + 0.14).toFixed(2)})`;
      ctx.beginPath();
      ctx.ellipse(6 + trunkLen * 0.55, 3 + dropLift * 0.45, 8 + trunkLen * 0.52, 5.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Felled Ringed Palm Trunk Cylinder extending along +X
      ctx.fillStyle = tree.burnt ? '#1c1917' : '#78350f';
      ctx.beginPath();
      ctx.moveTo(4, -5.2);
      ctx.lineTo(5 + trunkLen, -3.4 - dropLift * 0.18);
      ctx.lineTo(5 + trunkLen, 3.4 - dropLift * 0.18);
      ctx.lineTo(4, 5.2);
      ctx.closePath();
      ctx.fill();

      if (!tree.burnt && trunkLen > 10) {
        ctx.strokeStyle = 'rgba(41, 20, 7, 0.55)';
        ctx.lineWidth = 1.3;
        for (let r = 9; r < trunkLen + 2; r += 6) {
          ctx.beginPath();
          ctx.moveTo(r, -4.4);
          ctx.lineTo(r, 4.4);
          ctx.stroke();
        }
      }

      // Splayed Fallen Palm Frond Crown (or charred skeletal fronds) at felled trunk tip!
      ctx.save();
      ctx.translate(6 + trunkLen, -dropLift * 0.25);
      if (tree.burnt) {
        ctx.strokeStyle = '#292524';
        ctx.lineWidth = 2.4;
        for (let f = 0; f < 6; f++) {
          const ang = f * 1.05 - 1.5;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(Math.cos(ang) * 14, Math.sin(ang) * 11);
          ctx.stroke();
        }
      } else {
        ctx.scale(0.86, 0.72);
        ctx.drawImage(sf.propSprites.palm, -48, -48);
      }

      if (tree.burnTimer && tree.burnTimer > 0) {
        for (let tongue = 0; tongue < 5; tongue++) {
          const ang = (tongue / 5) * Math.PI * 2 + nowSec * 4;
          const fx = Math.cos(ang) * 7;
          const fy = Math.sin(ang) * 6;
          ctx.fillStyle = tongue % 2 === 0 ? 'rgba(249, 115, 22, 0.82)' : 'rgba(253, 224, 71, 0.85)';
          ctx.beginPath(); ctx.arc(fx, fy, 7, 0, Math.PI * 2); ctx.fill();
        }
      }
      ctx.restore();

      ctx.restore();
      return;
    }

    // Impact trunk jitter when bumped by slow vehicles or bullets!
    if (tree.shakeTimer && tree.shakeTimer > 0) {
      ctx.translate(
        Math.sin(nowSec * 58 + tree.y) * tree.shakeTimer * 7.5,
        Math.cos(nowSec * 52 + tree.x) * tree.shakeTimer * 6.0
      );
    }

    // 1. Charred Blackened Trunk & Smoking Skeletal Fronds after burning out!
    if (tree.burnt) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
      ctx.beginPath();
      ctx.ellipse(envState.shadowDX * 0.4, envState.shadowDY * 0.4, 9, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Scorched ash ring & charred trunk
      ctx.fillStyle = '#1c1917';
      ctx.beginPath(); ctx.arc(0, 0, 6.5, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#292524';
      ctx.lineWidth = 2.6;
      for (let f = 0; f < 5; f++) {
        const ang = f * 1.25 + (tree.x % 3);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(ang) * 12, Math.sin(ang) * 12);
        ctx.stroke();
      }
      // Faint glowing ember core + thin rising smoke wisp
      ctx.fillStyle = '#ea580c';
      ctx.beginPath(); ctx.arc(0, 0, 2.2, 0, Math.PI * 2); ctx.fill();
      const wispY = -((nowSec * 16 + tree.x) % 22);
      ctx.fillStyle = 'rgba(120, 113, 108, 0.30)';
      ctx.beginPath(); ctx.arc(Math.sin(nowSec * 2 + tree.y) * 4, wispY, 5, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      return;
    }

    // 2. Warm Flickering Ground Firelight Pool while Tree Crown is Burning!
    const isBurning = tree.burnTimer && tree.burnTimer > 0;
    if (isBurning) {
      const flickR = 54 + Math.sin(nowSec * 22 + tree.x) * 8;
      const firePool = ctx.createRadialGradient(0, 0, 4, 0, 0, flickR);
      firePool.addColorStop(0, 'rgba(251, 146, 60, 0.52)');
      firePool.addColorStop(0.55, 'rgba(239, 68, 68, 0.22)');
      firePool.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = firePool;
      ctx.beginPath(); ctx.arc(0, 0, flickR, 0, Math.PI * 2); ctx.fill();
    } else {
      ctx.fillStyle = `rgba(6, 10, 14, ${(envState.shadowAlpha * 0.82).toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(envState.shadowDX * 0.72, envState.shadowDY * 0.72, 20, 0, Math.PI * 2);
      ctx.fill();
    }

    const sway = Math.sin((nowSec || performance.now() * 0.001) * (isBurning ? 8.5 : 1.8) + tree.x) *
      (isBurning ? 0.14 : (WEATHER_MODES[weatherMode].id === 'rain' ? 0.18 : 0.06));
    ctx.save();
    ctx.rotate(sway);
    ctx.drawImage(sf.propSprites.palm, -48, -48);
    ctx.restore();

    // 3. Dramatic Multi-Layered Roaring Crown Inferno Engulfing Palm Fronds!
    if (isBurning) {
      for (let tongue = 0; tongue < 7; tongue++) {
        const ang = (tongue / 7) * Math.PI * 2 + nowSec * 3.4;
        const dist = 6 + (tongue % 3) * 6;
        const tx = Math.cos(ang) * dist;
        const ty = Math.sin(ang) * dist - 6 - Math.abs(Math.sin(nowSec * 14 + tongue)) * 10;
        const rOuter = 11 + Math.sin(nowSec * 19 + tongue * 2) * 3.5;

        ctx.fillStyle = tongue % 2 === 0 ? 'rgba(239, 68, 68, 0.78)' : 'rgba(249, 115, 22, 0.84)';
        ctx.beginPath();
        ctx.moveTo(tx - rOuter * 0.75, ty + 6);
        ctx.quadraticCurveTo(tx, ty - rOuter * 1.9, tx + rOuter * 0.75, ty + 6);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = tongue % 3 === 0 ? '#fef9c3' : '#fde047';
        ctx.beginPath();
        ctx.arc(tx, ty, rOuter * 0.45, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }

  function drawMissionArrow() {
    let tx = null, ty = null, col = '#39ff14';
    if (customWaypoint) {
      tx = customWaypoint.x; ty = customWaypoint.y; col = '#ff2a85';
    } else if (activeMission) {
      if (activeMission.type === 'checkpoint' && activeMission.checkpoints.length > 0) {
        tx = activeMission.checkpoints[0].x; ty = activeMission.checkpoints[0].y; col = '#00f0ff';
      } else if (activeMission.type === 'bounty' && activeMission.targetEntity) {
        tx = activeMission.targetEntity.x; ty = activeMission.targetEntity.y; col = '#ff1744';
      }
    } else {
      let bestD = Infinity;
      for (const ph of payphones) {
        const d = Math.hypot(ph.x - player.x, ph.y - player.y);
        if (d < bestD) { bestD = d; tx = ph.x; ty = ph.y; }
      }
    }

    if (tx !== null && Math.hypot(tx - player.x, ty - player.y) > 150) {
      const ang = Math.atan2(ty - player.y, tx - player.x);
      const ax = player.x + Math.cos(ang) * 74;
      const ay = player.y + Math.sin(ang) * 74;

      ctx.save();
      ctx.translate(ax, ay);
      ctx.rotate(ang);
      ctx.fillStyle = col;
      ctx.shadowColor = col;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(13, 0); ctx.lineTo(-8, -8); ctx.lineTo(-4, 0); ctx.lineTo(-8, 8);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }

  // ==========================================
  // 12. ZOOMED RADAR MINIMAP, SATELLITE MEGAMAP & HUD
  // ==========================================
  function renderMinimap() {
    const mw = minimapCanvas.width;
    const mh = minimapCanvas.height;
    mctx.fillStyle = '#071019';
    mctx.fillRect(0, 0, mw, mh);

    // Local neighborhood zoomed radar (shows ~36x36 tiles centered around player)
    const viewWorldSpan = 36 * TILE_SIZE;
    const leftW = player.x - viewWorldSpan * 0.5;
    const topW  = player.y - viewWorldSpan * 0.5;

    const srcScaleX = baseMapCanvas.width / WORLD_W;
    const srcScaleY = baseMapCanvas.height / WORLD_H;

    mctx.drawImage(
      baseMapCanvas,
      leftW * srcScaleX, topW * srcScaleY,
      viewWorldSpan * srcScaleX, viewWorldSpan * srcScaleY,
      0, 0, mw, mh
    );

    const toRadarX = (wx) => ((wx - leftW) / viewWorldSpan) * mw;
    const toRadarY = (wy) => ((wy - topW) / viewWorldSpan) * mh;

    // Payphones
    mctx.fillStyle = '#39ff14';
    for (const ph of payphones) {
      const rx = toRadarX(ph.x), ry = toRadarY(ph.y);
      if (rx >= 0 && rx <= mw && ry >= 0 && ry <= mh) mctx.fillRect(rx - 3, ry - 3, 6, 6);
    }

    // Stunt Jumps
    mctx.fillStyle = '#00f0ff';
    for (const sj of stuntJumps) {
      const rx = toRadarX(sj.x), ry = toRadarY(sj.y);
      if (rx >= 0 && rx <= mw && ry >= 0 && ry <= mh) mctx.fillRect(rx - 2, ry - 2, 4, 4);
    }

    // RON-99 Gas Stations & HV Power Substations on local radar
    for (const gs of gasStations) {
      const rx = toRadarX(gs.x), ry = toRadarY(gs.y);
      if (rx >= 0 && rx <= mw && ry >= 0 && ry <= mh) {
        mctx.fillStyle = gs.exploded ? '#52525b' : '#fb923c';
        mctx.fillRect(rx - 2.5, ry - 2.5, 5, 5);
      }
    }
    for (const pn of powerNodes) {
      const rx = toRadarX(pn.x), ry = toRadarY(pn.y);
      if (rx >= 0 && rx <= mw && ry >= 0 && ry <= mh) {
        mctx.fillStyle = pn.destroyed ? '#ef4444' : '#38bdf8';
        mctx.fillRect(rx - 2.5, ry - 2.5, 5, 5);
      }
    }

    // Custom Waypoint
    if (customWaypoint) {
      const rx = Math.max(5, Math.min(mw - 5, toRadarX(customWaypoint.x)));
      const ry = Math.max(5, Math.min(mh - 5, toRadarY(customWaypoint.y)));
      mctx.fillStyle = '#ff2a85';
      mctx.beginPath(); mctx.arc(rx, ry, 4.5, 0, Math.PI * 2); mctx.fill();
    }

    // Active Mission Blip
    if (activeMission) {
      let tx = null, ty = null;
      if (activeMission.type === 'checkpoint' && activeMission.checkpoints[0]) {
        tx = activeMission.checkpoints[0].x; ty = activeMission.checkpoints[0].y;
        mctx.fillStyle = '#ffe600';
      } else if (activeMission.type === 'bounty' && activeMission.targetEntity) {
        tx = activeMission.targetEntity.x; ty = activeMission.targetEntity.y;
        mctx.fillStyle = '#ff1744';
      }
      if (tx !== null) {
        const rx = Math.max(5, Math.min(mw - 5, toRadarX(tx)));
        const ry = Math.max(5, Math.min(mh - 5, toRadarY(ty)));
        mctx.fillRect(rx - 4, ry - 4, 8, 8);
      }
    }

    // Police & Chopper Blips
    for (const v of vehicles) {
      if (v.isPolice && v.hp > 0) {
        const rx = toRadarX(v.x), ry = toRadarY(v.y);
        if (rx >= 0 && rx <= mw && ry >= 0 && ry <= mh) {
          mctx.fillStyle = v.isHeli ? '#facc15' : '#38bdf8';
          mctx.fillRect(rx - 2.5, ry - 2.5, 5, 5);
        }
      }
    }

    // Player Center Directional Triangle
    mctx.save();
    mctx.translate(mw * 0.5, mh * 0.5);
    mctx.rotate(player.vehicle ? player.vehicle.angle : player.angle);
    mctx.fillStyle = '#ffffff';
    mctx.beginPath();
    mctx.moveTo(6, 0); mctx.lineTo(-5, -4.5); mctx.lineTo(-5, 4.5);
    mctx.closePath();
    mctx.fill();
    mctx.restore();
  }

  function renderMegamap() {
    if (!megaCtx || megamapModal.classList.contains('hidden')) return;
    const mw = megamapCanvas.width;
    const mh = megamapCanvas.height;
    megaCtx.drawImage(baseMapCanvas, 0, 0, mw, mh);

    const sx = mw / WORLD_W;
    const sy = mh / WORLD_H;

    // District Labels directly on the 600x600 Satellite Megamap
    megaCtx.font = 'bold 11px sans-serif';
    megaCtx.textAlign = 'center';
    megaCtx.fillStyle = 'rgba(255, 255, 255, 0.88)';
    megaCtx.fillText('DOWNTOWN VICE', 40 * TILE_SIZE * sx, 40 * TILE_SIZE * sy - 10);
    megaCtx.fillStyle = '#00f0ff';
    megaCtx.fillText('SILICON HILLS', 40 * TILE_SIZE * sx, 14 * TILE_SIZE * sy);
    megaCtx.fillStyle = '#ff2a85';
    megaCtx.fillText('VICE BEACH', 60 * TILE_SIZE * sx, 34 * TILE_SIZE * sy);
    megaCtx.fillText('STAR ISLAND', 70 * TILE_SIZE * sx, 40 * TILE_SIZE * sy);
    megaCtx.fillStyle = '#39ff14';
    megaCtx.fillText('EVERGLADES BAYOU', 12 * TILE_SIZE * sx, 24 * TILE_SIZE * sy);
    megaCtx.fillStyle = '#facc15';
    megaCtx.fillText('LEONIDA SPACEPORT', 11 * TILE_SIZE * sx, 57 * TILE_SIZE * sy);
    megaCtx.fillText('PORT DOCKS', 29 * TILE_SIZE * sx, 67 * TILE_SIZE * sy);

    // Payphones, Stunt Jumps, Gas Stations & HV Power Substations
    megaCtx.fillStyle = '#39ff14';
    for (const ph of payphones) megaCtx.fillRect(ph.x * sx - 3, ph.y * sy - 3, 6, 6);
    megaCtx.fillStyle = '#00f0ff';
    for (const sj of stuntJumps) megaCtx.fillRect(sj.x * sx - 2.5, sj.y * sy - 2.5, 5, 5);
    for (const gs of gasStations) {
      megaCtx.fillStyle = gs.exploded ? '#52525b' : '#fb923c';
      megaCtx.fillRect(gs.x * sx - 3, gs.y * sy - 3, 6, 6);
    }
    for (const pn of powerNodes) {
      megaCtx.fillStyle = pn.destroyed ? '#ef4444' : '#38bdf8';
      megaCtx.fillRect(pn.x * sx - 3, pn.y * sy - 3, 6, 6);
    }

    if (customWaypoint) {
      megaCtx.fillStyle = '#ff2a85';
      megaCtx.beginPath(); megaCtx.arc(customWaypoint.x * sx, customWaypoint.y * sy, 6, 0, Math.PI * 2); megaCtx.fill();
    }

    // Player Pulsing Beacon
    megaCtx.fillStyle = '#ffffff';
    megaCtx.beginPath(); megaCtx.arc(player.x * sx, player.y * sy, 6, 0, Math.PI * 2); megaCtx.fill();
    megaCtx.strokeStyle = '#00f0ff';
    megaCtx.lineWidth = 2;
    megaCtx.stroke();
  }

  function updateHUD() {
    document.getElementById('cash-display').textContent = '$' + String(Math.floor(player.cash)).padStart(8, '0');
    document.getElementById('multiplier-badge').textContent = `x${player.multiplier} COMBO`;
    document.getElementById('vehicle-name-hud').textContent = player.vehicle
      ? player.vehicle.name
      : (player.z > 0 ? '🪂 PARACHUTE DESCENT' : 'ON FOOT');

    document.getElementById('health-bar').style.width = Math.max(0, player.health) + '%';
    document.getElementById('health-val').textContent = Math.max(0, Math.round(player.health));
    document.getElementById('armor-bar').style.width = Math.max(0, player.armor) + '%';
    document.getElementById('armor-val').textContent = Math.max(0, Math.round(player.armor));

    const refBar = document.getElementById('reflex-bar');
    const refVal = document.getElementById('reflex-val');
    if (refBar && refVal) {
      refBar.style.width = Math.max(0, player.reflex) + '%';
      refVal.textContent = Math.max(0, Math.round(player.reflex));
    }

    const w = WEAPONS[player.weaponIdx];
    const wNameEl = document.getElementById('weapon-name');
    const wAmmoEl = document.getElementById('weapon-ammo');
    const wLethEl = document.getElementById('weapon-lethality');

    if (player.vehicle && player.vehicle.isTank) {
      wNameEl.textContent = '120MM HE CANNON';
      wAmmoEl.textContent = '∞';
      if (wLethEl) { wLethEl.textContent = 'TIER V // ARMORED DEMOLITION'; wLethEl.style.color = '#ffe600'; }
    } else if (player.vehicle && player.vehicle.isJet) {
      wNameEl.textContent = 'TWIN AGM MISSILES';
      wAmmoEl.textContent = '∞';
      if (wLethEl) { wLethEl.textContent = 'TIER V // AIR-TO-GROUND STRIKE'; wLethEl.style.color = '#38bdf8'; }
    } else if (player.vehicle && player.vehicle.isHeli) {
      wNameEl.textContent = 'HYDRA-70 ROCKETS';
      wAmmoEl.textContent = '∞';
      if (wLethEl) { wLethEl.textContent = 'TIER V // GUNSHIP DEMOLITION'; wLethEl.style.color = '#fb923c'; }
    } else if (player.vehicle && player.vehicle.isFiretruck) {
      wNameEl.textContent = 'DELUGE HYDRO-CANNON';
      wAmmoEl.textContent = '∞';
      if (wLethEl) { wLethEl.textContent = 'TIER IV // HIGH-PRESSURE HYDRO'; wLethEl.style.color = '#38bdf8'; }
    } else {
      wNameEl.textContent = w.name;
      wAmmoEl.textContent = player.ammo[w.id] === Infinity ? '∞' : player.ammo[w.id];
      if (wLethEl) {
        wLethEl.textContent = w.tierLabel || 'TIER I // LIGHT BALLISTIC';
        wLethEl.style.color = w.tierColor || '#94a3b8';
      }
    }

    document.querySelectorAll('.w-slot').forEach((el, idx) => {
      el.classList.toggle('active', idx === player.weaponIdx);
    });

    const midiHudEl = document.getElementById('midi-track-hud');
    if (midiHudEl && window.MidiSoundtrack) {
      midiHudEl.textContent = window.MidiSoundtrack.getCurrentTrackLabel();
    }

    document.getElementById('respect-syndicate').style.width = GANGS.syndicate.respect + '%';
    document.getElementById('respect-runners').style.width = GANGS.runners.respect + '%';
    document.getElementById('respect-gators').style.width = GANGS.gators.respect + '%';

    const wLevel = Math.floor(player.wanted);
    document.querySelectorAll('.cop-star').forEach((star, idx) => {
      star.classList.remove('active-blue', 'active-red');
      if (idx < wLevel) star.classList.add(idx % 2 === 0 ? 'active-blue' : 'active-red');
    });

    // Police Pursuit Tactical Warning Banner & Flashing Radar Frame!
    const pursuitEl = document.getElementById('pursuit-warning');
    const radarFrameEl = document.getElementById('minimap-trigger');
    if (radarFrameEl) radarFrameEl.classList.toggle('pursuit-active', wLevel >= 1);
    if (pursuitEl) {
      if (wLevel <= 0) {
        pursuitEl.classList.add('hidden');
      } else {
        pursuitEl.classList.remove('hidden');
        const alerts = [
          '',
          '🚨 VCPD PATROL ALERT // CRUISER DISPATCHED',
          '🚨 ACTIVE PURSUIT // INTERCEPTOR UNITS EN ROUTE',
          '🚨 AIR SUPPORT // MAVERICK CHOPPER TRACKING',
          '🚨 SWAT TACTICAL LOCKDOWN // LETHAL FORCE AUTHORIZED',
          '🚨 FEDERAL MANHUNT // AIRSPACE & SWAT SIEGE',
          '🚨 MARTIAL LAW // RHINO ARMOR & FIGHTER INTERCEPT'
        ];
        pursuitEl.textContent = alerts[Math.min(6, wLevel)];
      }
    }
  }

  function updateMissionHUD() {
    const titleEl = document.getElementById('mission-title');
    const descEl = document.getElementById('mission-desc');
    const timerEl = document.getElementById('mission-timer');

    if (!activeMission) {
      if (player.vehicle && player.vehicle.isHeli) {
        titleEl.textContent = `FLIGHT DECK // ${player.vehicle.name}`;
        descEl.textContent = 'LAND HELI: Hold [SPACE] or press [L] Auto-Land -> press [F] to Park (rotors stop!) • [R-CLICK / U] MAG-TOW WRECKING BALL • ROCKETS: [L-CLICK / CTRL]!';
      } else if (player.vehicle && player.vehicle.isJet) {
        titleEl.textContent = `FLIGHT DECK // ${player.vehicle.name}`;
        descEl.textContent = 'FIRE MISSILES: [L-CLICK] or [CTRL / K] at Ground Target Reticle • CLIMB: [W] • PARACHUTE BAILOUT: [F] • CITY CRASH = 5★!';
      } else if (player.vehicle && player.vehicle.isTank) {
        titleEl.textContent = `ARMORED COMMAND // ${player.vehicle.name}`;
        descEl.textContent = 'FIRE 120MM SHELL: [L-CLICK / CTRL] • [R-CLICK / U] MAG-TOW • Ram walls head-on to breach & collapse buildings!';
      } else if (player.vehicle && player.vehicle.isFiretruck) {
        titleEl.textContent = `FIRE ENGINE COMMAND // ${player.vehicle.name}`;
        descEl.textContent = 'HYDRO-CANNON: [L-CLICK / CTRL] douses fires & blasts cars/peds! • [E] SIREN • [R-CLICK / U] MAG-TOW CABLE!';
      } else {
        titleEl.textContent = 'FREE ROAM // LEONIDA';
        descEl.textContent = 'Press [V] Vehicle Drop (747/Heli/Firetruck/Tank), [N] Live News TV, [P] Sky-Drone Cam, or [G] Satellite Map!';
      }
      timerEl.classList.add('hidden');
    } else {
      titleEl.textContent = activeMission.title;
      descEl.textContent = activeMission.type === 'rampage'
        ? `Hostiles remaining: ${activeMission.killsNeeded}`
        : activeMission.desc;
      timerEl.classList.remove('hidden');
      const sec = Math.max(0, Math.ceil(activeMission.timer));
      timerEl.textContent = `00:${String(sec).padStart(2, '0')}`;
    }
  }

  updateHUD();
  updateMissionHUD();
  showBanner('LEONIDA CARBON // 2027 HYPER-EDITION', '#00f0ff');

  // ==========================================
  // 13. 60 FPS MAIN ANIMATION LOOP + TELEMETRY
  // ==========================================
  let lastTime = performance.now();
  let frameCounter = 0;
  function loop(now) {
    const realDelta = (now - lastTime) / 1000;
    const dt = Math.min(0.05, realDelta);
    lastTime = now;

    if (realDelta > 0) {
      fpsEstimate = fpsEstimate * 0.92 + (1 / realDelta) * 0.08;
      if (++frameCounter % 20 === 0) {
        const fpsEl = document.getElementById('fps-badge');
        if (fpsEl) fpsEl.textContent = `${Math.min(144, Math.round(fpsEstimate))} FPS`;
        if (!megamapModal.classList.contains('hidden')) renderMegamap();
      }
    }

    update(dt);
    render();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
