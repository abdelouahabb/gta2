/**
 * GTA VI: VICE OVERHEAD (GTA 2 Top-Down 2.5D Engine)
 * Built in pure HTML5 Canvas + Web Audio API
 */

(() => {
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  const minimapCanvas = document.getElementById('minimapCanvas');
  const mctx = minimapCanvas.getContext('2d');

  // Resize canvas
  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  // ==========================================
  // 1. WEB AUDIO SYNTHESIZER & RADIO ENGINE
  // ==========================================
  class SoundEngine {
    constructor() {
      this.ctx = null;
      this.radioStation = 0; // 0: V-Rock Synth, 1: Neon Bass FM, 2: Gator Electro, 3: OFF
      this.stations = [
        '📻 V-ROCK SYNTHWAVE FM',
        '📻 VICE MIAMI BASS 106.5',
        '📻 CYBER GATOR CLUB FM',
        '📻 RADIO OFF'
      ];
      this.nextNoteTime = 0;
      this.step = 0;
      this.sirenPhase = 0;
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
        osc.frequency.setValueAtTime(type === 'pistol' ? 320 : 420, now);
        osc.frequency.exponentialRampToValueAtTime(55, now + 0.09);
        gain.gain.setValueAtTime(0.16, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
        osc.start(now);
        osc.stop(now + 0.09);
      } else if (type === 'shotgun') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(35, now + 0.18);
        gain.gain.setValueAtTime(0.24, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
        osc.start(now);
        osc.stop(now + 0.18);
      } else if (type === 'rocket') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(240, now);
        osc.frequency.linearRampToValueAtTime(90, now + 0.28);
        gain.gain.setValueAtTime(0.22, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
        osc.start(now);
        osc.stop(now + 0.28);
      } else if (type === 'flame') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(110 + Math.random() * 60, now);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
        osc.start(now);
        osc.stop(now + 0.07);
      }
    }

    playExplosion() {
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      // White noise buffer + low sub boom
      const bufferSize = this.ctx.sampleRate * 0.45;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.15));
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(420, now);
      filter.frequency.linearRampToValueAtTime(60, now + 0.45);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.38, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      noise.start(now);
    }

    playCash() {
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(987.77, now); // B5
      osc.frequency.setValueAtTime(1318.51, now + 0.06); // E6
      gain.gain.setValueAtTime(0.12, now);
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
      gain.gain.setValueAtTime(0.14, now);
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
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.14);
    }

    updateRadio(inVehicle) {
      if (!this.ctx || !inVehicle || this.radioStation === 3) return;
      const now = this.ctx.currentTime;
      if (now < this.nextNoteTime) return;

      const stepDur = this.radioStation === 0 ? 0.14 : (this.radioStation === 1 ? 0.16 : 0.12);
      this.nextNoteTime = now + stepDur;
      this.step = (this.step + 1) % 16;

      // Bassline notes (Hz)
      const patterns = [
        // Station 0: V-Rock Synthwave (A minor / F / G)
        [110, 110, 220, 110, 87.3, 87.3, 174.6, 87.3, 98, 98, 196, 98, 130.8, 110, 98, 110],
        // Station 1: Vice Miami Bass
        [65.4, 0, 65.4, 130.8, 0, 65.4, 77.7, 87.3, 65.4, 0, 65.4, 130.8, 98, 87.3, 77.7, 65.4],
        // Station 2: Cyber Gator Club
        [146.8, 293.6, 146.8, 293.6, 174.6, 349.2, 164.8, 329.6, 146.8, 293.6, 220, 440, 196, 174.6, 164.8, 146.8]
      ];

      const freq = patterns[this.radioStation][this.step];
      if (freq > 0) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = this.radioStation === 1 ? 'triangle' : 'sawtooth';
        osc.frequency.setValueAtTime(freq, now);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(this.radioStation === 2 ? 1200 : 650, now);

        gain.gain.setValueAtTime(0.055, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + stepDur * 0.9);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + stepDur * 0.9);
      }
    }
  }

  const sfx = new SoundEngine();

  // ==========================================
  // 2. WORLD MAP & PROCEDURAL VICE LEONIDA CITY
  // ==========================================
  const TILE_SIZE = 160; // Each tile is 160x160 world pixels
  const GRID_W = 24;
  const GRID_H = 24;
  const WORLD_W = GRID_W * TILE_SIZE;
  const WORLD_H = GRID_H * TILE_SIZE;

  // Tile Types:
  // 0: Asphalt Road
  // 1: Building Block
  // 2: Park / Grass Plaza
  // 3: Sandy Beach (East Coast)
  // 4: Ocean Water (Far East)
  // 5: Pay N' Spray Shop
  const worldGrid = [];
  const buildings = [];
  const streetlamps = [];
  const palmTrees = [];
  const payphones = [];
  const pickups = [];

  // Gang Territories:
  // West (x < 9): Gator Kings (Lime)
  // Center (9 <= x < 16): Chrome Runners (Cyan)
  // East/Beach (x >= 16): Flamingo Syndicate (Pink)
  const GANGS = {
    syndicate: { name: 'FLAMINGO SYNDICATE', color: '#ff2a85', respect: 50 },
    runners:   { name: 'CHROME RUNNERS',     color: '#00f0ff', respect: 50 },
    gators:    { name: 'GATOR KINGS',        color: '#39ff14', respect: 50 }
  };

  function getGangForPos(wx, wy) {
    const gx = Math.floor(wx / TILE_SIZE);
    if (gx >= 15) return 'syndicate';
    if (gx >= 8) return 'runners';
    return 'gators';
  }

  const BUILDING_PALETTES = {
    syndicate: [
      { wall: '#23132e', roof: '#341c47', neon: '#ff2a85', sign: 'HOTEL VICE' },
      { wall: '#1b1d36', roof: '#2a2d54', neon: '#00f0ff', sign: 'CLUB MALIBU' },
      { wall: '#2d162c', roof: '#452043', neon: '#ffe600', sign: 'OCEAN DRIVE' }
    ],
    runners: [
      { wall: '#121b28', roof: '#1d2b40', neon: '#00f0ff', sign: 'CYBER CORP' },
      { wall: '#18202c', roof: '#243042', neon: '#3b82f6', sign: 'LEONIDA BANK' },
      { wall: '#1c182b', roof: '#2b2442', neon: '#a855f7', sign: 'ARCADE 1999' }
    ],
    gators: [
      { wall: '#172219', roof: '#223325', neon: '#39ff14', sign: 'GATOR AUTO' },
      { wall: '#241e18', roof: '#362d24', neon: '#f97316', sign: 'BAYOU BAR' },
      { wall: '#1c2421', roof: '#283631', neon: '#eab308', sign: 'PAWN SHOP' }
    ]
  };

  let payNSprayRect = null;

  function initWorld() {
    for (let y = 0; y < GRID_H; y++) {
      worldGrid[y] = [];
      for (let x = 0; x < GRID_W; x++) {
        // East coast Ocean & Beach
        if (x >= 22) {
          // Bridges on y = 6, 12, 18? Keep 22-23 as ocean with a pier at y=12
          worldGrid[y][x] = (y === 12 && x === 22) ? 0 : 4;
          continue;
        }
        if (x === 21) {
          worldGrid[y][x] = (y % 3 === 0) ? 0 : 3;
          continue;
        }

        // Major Avenues & Streets every 3rd tile
        const isRoadX = (x % 3 === 0);
        const isRoadY = (y % 3 === 0);

        if (isRoadX || isRoadY) {
          worldGrid[y][x] = 0; // Road
        } else if (x === 10 && y === 10) {
          // Central Pay N' Spray garage
          worldGrid[y][x] = 5;
          payNSprayRect = {
            x: x * TILE_SIZE + 12,
            y: y * TILE_SIZE + 12,
            w: TILE_SIZE - 24,
            h: TILE_SIZE - 24
          };
        } else if ((x === 13 && y === 13) || (x === 4 && y === 10) || (x === 16 && y === 7)) {
          // Parks / Neon Plazas
          worldGrid[y][x] = 2;
        } else {
          worldGrid[y][x] = 1; // Building
        }
      }
    }

    // Create 2.5D Buildings, Streetlamps, Palm Trees, and Payphones
    for (let y = 0; y < GRID_H; y++) {
      for (let x = 0; x < GRID_W; x++) {
        const t = worldGrid[y][x];
        const wx = x * TILE_SIZE;
        const wy = y * TILE_SIZE;

        if (t === 1) {
          const gang = getGangForPos(wx, wy);
          const palList = BUILDING_PALETTES[gang];
          const pal = palList[(x * 7 + y * 13) % palList.length];
          const pad = 16;
          const height = 42 + ((x * 19 + y * 31) % 55); // 2.5D extrusion height
          const hasSign = ((x + y) % 2 === 0);
          buildings.push({
            x: wx + pad,
            y: wy + pad,
            w: TILE_SIZE - pad * 2,
            h: TILE_SIZE - pad * 2,
            height,
            roofStyle: (x * 3 + y * 5) % 3,
            wallColor: pal.wall,
            roofColor: pal.roof,
            neonColor: pal.neon,
            sign: hasSign ? pal.sign : null,
            acUnits: [
              { ox: 18, oy: 18, w: 22, h: 16 },
              { ox: TILE_SIZE - pad * 2 - 44, oy: TILE_SIZE - pad * 2 - 34, w: 24, h: 20 }
            ]
          });

          // Corner streetlamps on sidewalks
          streetlamps.push({ x: wx + 8, y: wy + 8, color: pal.neon });
        } else if (t === 2 || t === 3) {
          // Add palm trees on beaches and parks
          palmTrees.push({ x: wx + 45, y: wy + 45, r: 22 });
          palmTrees.push({ x: wx + TILE_SIZE - 45, y: wy + TILE_SIZE - 45, r: 24 });
        }
      }
    }

    // Add GTA 2 Ringing Green Payphones at key intersections
    const phoneCoords = [
      { gx: 12, gy: 12, gang: 'runners', title: 'CHROME DELIVERY', type: 'checkpoint' },
      { gx: 18, gy: 9,  gang: 'syndicate', title: 'BEACHFRONT HIT', type: 'bounty' },
      { gx: 6,  gy: 15, gang: 'gators', title: 'BAYOU RAMPAGE', type: 'rampage' }
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

    // Spawn Weapon & Health/Armor Crates around the city
    const pickupSpots = [
      { gx: 12, gy: 11, kind: 'smg' },
      { gx: 15, gy: 12, kind: 'shotgun' },
      { gx: 18, gy: 12, kind: 'rocket' },
      { gx: 9,  gy: 9,  kind: 'flame' },
      { gx: 11, gy: 13, kind: 'health' },
      { gx: 14, gy: 10, kind: 'armor' },
      { gx: 6,  gy: 12, kind: 'rocket' },
      { gx: 20, gy: 15, kind: 'health' }
    ];
    for (const ps of pickupSpots) {
      pickups.push({
        x: ps.gx * TILE_SIZE + TILE_SIZE * 0.5,
        y: ps.gy * TILE_SIZE + TILE_SIZE * 0.5,
        kind: ps.kind,
        respawnTimer: 0
      });
    }
  }

  initWorld();

  // ==========================================
  // 3. WEAPONS DEFINITIONS
  // ==========================================
  const WEAPONS = [
    { id: 'pistol',  name: '9MM PISTOL',    cooldown: 0.20, speed: 920,  damage: 28, spread: 0.04, count: 1, range: 650, color: '#ffe600' },
    { id: 'smg',     name: 'VIPER MICRO-SMG', cooldown: 0.075, speed: 980, damage: 18, spread: 0.12, count: 1, range: 600, color: '#00f0ff' },
    { id: 'shotgun', name: 'COMBAT SHOTGUN', cooldown: 0.55, speed: 860,  damage: 22, spread: 0.24, count: 7, range: 420, color: '#ff9100' },
    { id: 'rocket',  name: 'RPG LAUNCHER',   cooldown: 0.95, speed: 640,  damage: 180, spread: 0.02, count: 1, range: 900, color: '#ff1744', explosive: true },
    { id: 'flame',   name: 'FLAMETHROWER',   cooldown: 0.04, speed: 420,  damage: 8,  spread: 0.28, count: 2, range: 230, color: '#ff6d00', flame: true }
  ];

  // ==========================================
  // 4. PLAYER, VEHICLES, PEDS, BULLETS, PARTICLES
  // ==========================================
  const player = {
    x: 12 * TILE_SIZE + 80,
    y: 12 * TILE_SIZE + 80,
    vx: 0,
    vy: 0,
    angle: 0,
    radius: 13,
    health: 100,
    maxHealth: 100,
    armor: 50,
    maxArmor: 100,
    cash: 500,
    multiplier: 1,
    multTimer: 0,
    wanted: 0,
    wantedDecay: 0,
    vehicle: null,
    weaponIdx: 0,
    ammo: {
      pistol: Infinity,
      smg: 180,
      shotgun: 45,
      rocket: 12,
      flame: 250
    },
    fireTimer: 0,
    stepPhase: 0
  };

  const VEHICLE_SPECS = {
    banshee: { name: 'VICE BANSHEE GT', w: 54, h: 26, maxSpeed: 640, accel: 560, grip: 0.92, maxHp: 220, colors: ['#ff0055', '#00f0ff', '#ffe600', '#ffffff'], stripe: true },
    stinger: { name: 'INFERNUS TURBO',  w: 56, h: 27, maxSpeed: 680, accel: 610, grip: 0.90, maxHp: 200, colors: ['#ff2a85', '#a855f7', '#39ff14'], stripe: false },
    muscle:  { name: 'SABRE MUSCLE',    w: 56, h: 28, maxSpeed: 540, accel: 500, grip: 0.84, maxHp: 290, colors: ['#f97316', '#dc2626', '#2563eb'], stripe: true },
    cab:     { name: 'KAUFMAN CAB',     w: 54, h: 27, maxSpeed: 480, accel: 430, grip: 0.91, maxHp: 270, colors: ['#facc15'], isCab: true },
    police:  { name: 'VCPD INTERCEPTOR',w: 56, h: 27, maxSpeed: 610, accel: 550, grip: 0.93, maxHp: 310, colors: ['#111827'], isPolice: true },
    swat:    { name: 'LEONIDA SWAT VAN',w: 66, h: 32, maxSpeed: 460, accel: 410, grip: 0.95, maxHp: 600, colors: ['#1e293b'], isPolice: true, isSwat: true }
  };

  const vehicles = [];
  const peds = [];
  const bullets = [];
  const particles = [];
  const skidMarks = [];
  const floatingTexts = [];

  // Active Mission State
  let activeMission = null; // { type, title, desc, timer, targetX, targetY, targetEntity, killsNeeded, reward, gang }

  // Time of Day Mode: 0 = Neon Night (21:00), 1 = Vice Sunset (18:30), 2 = Bright Noon (12:00)
  let timeMode = 0;
  const TIME_MODES = [
    { label: '21:00 NEON NIGHT', ambient: 'rgba(6, 8, 22, 0.48)', lightsOn: true },
    { label: '18:30 VICE SUNSET', ambient: 'rgba(65, 18, 48, 0.30)', lightsOn: true },
    { label: '12:00 MIAMI NOON',  ambient: 'rgba(255, 250, 230, 0.04)', lightsOn: false }
  ];

  // Camera state
  const camera = {
    x: player.x,
    y: player.y,
    zoom: 1.0,
    shake: 0
  };

  // ==========================================
  // 5. INPUT HANDLING
  // ==========================================
  const keys = {};
  const pressedKeys = {};
  const mouse = { x: 0, y: 0, worldX: 0, worldY: 0, down: false };

  window.addEventListener('keydown', (e) => {
    sfx.init();
    const code = e.code;
    const k = e.key ? e.key.toLowerCase() : '';
    keys[code] = true;
    if (k) pressedKeys[k] = true;

    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(code)) {
      e.preventDefault();
    }

    if (code === 'KeyF' || code === 'Enter') {
      toggleVehicle();
    } else if (code === 'Tab' || code === 'KeyC') {
      e.preventDefault();
      cycleWeapon(1);
    } else if (code === 'Digit1') {
      player.weaponIdx = 0; updateHUD();
    } else if (code === 'Digit2') {
      player.weaponIdx = 1; updateHUD();
    } else if (code === 'Digit3') {
      player.weaponIdx = 2; updateHUD();
    } else if (code === 'Digit4') {
      player.weaponIdx = 3; updateHUD();
    } else if (code === 'Digit5') {
      player.weaponIdx = 4; updateHUD();
    } else if (code === 'KeyE') {
      if (player.vehicle) {
        player.vehicle.sirenOn = !player.vehicle.sirenOn;
        sfx.playHorn(player.vehicle.isPolice);
      }
    } else if (code === 'KeyR') {
      sfx.radioStation = (sfx.radioStation + 1) % sfx.stations.length;
      showRadioBanner(sfx.stations[sfx.radioStation]);
    } else if (code === 'KeyT') {
      timeMode = (timeMode + 1) % TIME_MODES.length;
      document.getElementById('time-display').textContent = TIME_MODES[timeMode].label.split(' ')[0];
      showBanner(TIME_MODES[timeMode].label, '#00f0ff');
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
  });

  window.addEventListener('mousedown', (e) => {
    sfx.init();
    if (e.button === 0) mouse.down = true;
  });

  window.addEventListener('mouseup', (e) => {
    if (e.button === 0) mouse.down = false;
  });

  window.addEventListener('wheel', (e) => {
    cycleWeapon(e.deltaY > 0 ? 1 : -1);
  });

  function cycleWeapon(dir) {
    player.weaponIdx = (player.weaponIdx + dir + WEAPONS.length) % WEAPONS.length;
    updateHUD();
  }

  // ==========================================
  // 6. HELPER & SPAWN FUNCTIONS
  // ==========================================
  let bannerTimeout = null;
  function showBanner(text, color = '#ffe600') {
    const el = document.getElementById('banner-message');
    el.textContent = text;
    el.style.color = color;
    el.style.opacity = '1';
    el.style.transform = 'scale(1.12)';
    setTimeout(() => {
      el.style.transform = 'scale(1.0)';
    }, 150);
    if (bannerTimeout) clearTimeout(bannerTimeout);
    bannerTimeout = setTimeout(() => {
      el.style.opacity = '0';
    }, 2600);
  }

  let radioTimeout = null;
  function showRadioBanner(text) {
    const el = document.getElementById('radio-banner');
    el.textContent = text;
    el.classList.remove('hidden');
    if (radioTimeout) clearTimeout(radioTimeout);
    radioTimeout = setTimeout(() => {
      el.classList.add('hidden');
    }, 2800);
  }

  function addFloatingText(x, y, text, color = '#39ff14') {
    floatingTexts.push({ x, y, text, color, life: 1.1, maxLife: 1.1 });
  }

  function addCash(amount, wx, wy) {
    const total = Math.round(amount * player.multiplier);
    player.cash += total;
    player.multTimer = 6.0;
    if (Math.random() < 0.35 && player.multiplier < 9) {
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
    player.wantedDecay = 14.0;
    const curr = Math.floor(player.wanted);
    if (curr > prev) {
      showBanner(`WANTED LEVEL ${curr} ★`, '#ff1744');
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
    const color = spec.colors[Math.floor(Math.random() * spec.colors.length)];
    const v = {
      typeKey,
      name: spec.name,
      x,
      y,
      vx: 0,
      vy: 0,
      angle,
      angularVel: 0,
      w: spec.w,
      h: spec.h,
      maxSpeed: spec.maxSpeed,
      accel: spec.accel,
      grip: spec.grip,
      hp: spec.maxHp,
      maxHp: spec.maxHp,
      color,
      stripe: spec.stripe,
      isCab: !!spec.isCab,
      isPolice: !!spec.isPolice,
      isSwat: !!spec.isSwat,
      sirenOn: !!spec.isPolice,
      sirenPhase: Math.random() * 10,
      driver: driverType, // 'player', 'civilian', 'police', null
      aiCooldown: 0,
      burnTimer: 0
    };
    vehicles.push(v);
    return v;
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
    const ped = {
      x,
      y,
      vx: 0,
      vy: 0,
      angle: Math.random() * Math.PI * 2,
      radius: 11,
      hp: role === 'police' ? 75 : (gang ? 85 : 40),
      role, // 'civilian', 'police', 'gang', 'bounty'
      gang,
      color: palette[Math.floor(Math.random() * palette.length)],
      skinColor: skinTones[Math.floor(Math.random() * skinTones.length)],
      stepPhase: Math.random() * 10,
      aiTimer: Math.random() * 2,
      shootTimer: 0.6 + Math.random() * 0.8,
      panicTimer: 0
    };
    peds.push(ped);
    return ped;
  }

  // Initial City Traffic & Pedestrians
  function populateInitialEntities() {
    // Spawn parked exotic cars near player start
    spawnVehicle('banshee', 12 * TILE_SIZE + 125, 12 * TILE_SIZE + 35, 0, null);
    spawnVehicle('stinger', 12 * TILE_SIZE + 35, 12 * TILE_SIZE + 125, Math.PI / 2, null);
    spawnVehicle('muscle', 10 * TILE_SIZE + 80, 11 * TILE_SIZE + 40, 0, null);

    // Spawn roaming traffic on road tiles
    const types = ['banshee', 'stinger', 'muscle', 'cab', 'cab'];
    for (let i = 0; i < 32; i++) {
      const gx = (Math.floor(Math.random() * 7) * 3);
      const gy = Math.floor(Math.random() * 20) + 1;
      const wx = gx * TILE_SIZE + TILE_SIZE * 0.5;
      const wy = gy * TILE_SIZE + TILE_SIZE * 0.5;
      if (Math.hypot(wx - player.x, wy - player.y) > 300) {
        const t = types[Math.floor(Math.random() * types.length)];
        spawnVehicle(t, wx, wy, Math.PI / 2, 'civilian');
      }
    }

    // Spawn pedestrians & gang members
    for (let i = 0; i < 75; i++) {
      const gx = Math.floor(Math.random() * 20) + 1;
      const gy = Math.floor(Math.random() * 22) + 1;
      const wx = gx * TILE_SIZE + 14;
      const wy = gy * TILE_SIZE + 14;
      const gang = getGangForPos(wx, wy);
      const isGang = Math.random() < 0.35;
      spawnPed(wx, wy, isGang ? 'gang' : 'civilian', isGang ? gang : null);
    }
  }

  populateInitialEntities();

  // ==========================================
  // 7. ENTER / EXIT / HIJACK VEHICLE
  // ==========================================
  function toggleVehicle() {
    if (player.vehicle) {
      // Exit vehicle
      const v = player.vehicle;
      v.driver = null;
      player.x = v.x + Math.cos(v.angle - Math.PI / 2) * (v.h + 18);
      player.y = v.y + Math.sin(v.angle - Math.PI / 2) * (v.h + 18);
      player.vx = v.vx * 0.35;
      player.vy = v.vy * 0.35;
      player.vehicle = null;
      document.getElementById('radio-banner').classList.add('hidden');
      updateHUD();
      return;
    }

    // Find closest vehicle within hijack range
    let bestV = null;
    let bestDist = 78;
    for (const v of vehicles) {
      if (v.hp <= 0) continue;
      const d = Math.hypot(v.x - player.x, v.y - player.y);
      if (d < bestDist) {
        bestDist = d;
        bestV = v;
      }
    }

    if (bestV) {
      if (bestV.driver && bestV.driver !== 'player') {
        // Eject previous driver onto street!
        const ejectX = bestV.x + Math.cos(bestV.angle - Math.PI / 2) * 34;
        const ejectY = bestV.y + Math.sin(bestV.angle - Math.PI / 2) * 34;
        const p = spawnPed(ejectX, ejectY, bestV.driver === 'police' ? 'police' : 'civilian');
        p.panicTimer = 6.0;
        if (bestV.isPolice) {
          addWanted(1.0);
        } else {
          addWanted(0.35);
        }
        showBanner(`JACKED ${bestV.name}!`, '#00f0ff');
      } else {
        showBanner(bestV.name, '#00f0ff');
      }
      bestV.driver = 'player';
      player.vehicle = bestV;
      sfx.playHorn(bestV.isPolice);
      showRadioBanner(sfx.stations[sfx.radioStation]);
      updateHUD();
    }
  }

  // ==========================================
  // 8. COLLISION & EXPLOSION LOGIC
  // ==========================================
  function circleRectCollide(cx, cy, r, rx, ry, rw, rh) {
    const closestX = Math.max(rx, Math.min(cx, rx + rw));
    const closestY = Math.max(ry, Math.min(cy, ry + rh));
    const dx = cx - closestX;
    const dy = cy - closestY;
    const distSq = dx * dx + dy * dy;
    if (distSq < r * r && distSq > 0.0001) {
      const dist = Math.sqrt(distSq);
      const overlap = r - dist;
      return { nx: dx / dist, ny: dy / dist, overlap };
    }
    return null;
  }

  function resolveBuildingCollisions(entity, radius, isVehicle = false) {
    // Clamp to world boundaries
    entity.x = Math.max(radius, Math.min(WORLD_W - radius, entity.x));
    entity.y = Math.max(radius, Math.min(WORLD_H - radius, entity.y));

    for (const b of buildings) {
      // Quick broadphase check
      if (Math.abs(entity.x - (b.x + b.w * 0.5)) > b.w + radius + 20) continue;
      if (Math.abs(entity.y - (b.y + b.h * 0.5)) > b.h + radius + 20) continue;

      const hit = circleRectCollide(entity.x, entity.y, radius, b.x, b.y, b.w, b.h);
      if (hit) {
        entity.x += hit.nx * hit.overlap;
        entity.y += hit.ny * hit.overlap;
        if (isVehicle) {
          const speed = Math.hypot(entity.vx, entity.vy);
          if (speed > 260) {
            entity.hp -= (speed - 220) * 0.06;
            spawnSparks(entity.x - hit.nx * radius, entity.y - hit.ny * radius, 6);
          }
          entity.vx *= 0.55;
          entity.vy *= 0.55;
        }
      }
    }
  }

  function spawnSparks(x, y, count = 8, color = '#ffe600') {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const spd = 60 + Math.random() * 200;
      particles.push({
        x,
        y,
        vx: Math.cos(a) * spd,
        vy: Math.sin(a) * spd,
        r: 2 + Math.random() * 3,
        color,
        life: 0.25 + Math.random() * 0.25,
        maxLife: 0.5
      });
    }
  }

  function createExplosion(x, y, radius = 135, damage = 180) {
    sfx.playExplosion();
    camera.shake = Math.min(28, camera.shake + 18);

    // Fireball particles
    const fireColors = ['#ffffff', '#ffe600', '#ff6d00', '#ff1744', '#262626'];
    for (let i = 0; i < 48; i++) {
      const a = Math.random() * Math.PI * 2;
      const spd = 30 + Math.random() * 340;
      const c = fireColors[Math.floor(Math.random() * fireColors.length)];
      particles.push({
        x: x + (Math.random() - 0.5) * 20,
        y: y + (Math.random() - 0.5) * 20,
        vx: Math.cos(a) * spd,
        vy: Math.sin(a) * spd,
        r: 8 + Math.random() * 18,
        color: c,
        life: 0.4 + Math.random() * 0.55,
        maxLife: 0.95
      });
    }

    // Scorch mark on asphalt
    skidMarks.push({
      x1: x - 22, y1: y - 22,
      x2: x + 22, y2: y + 22,
      width: 44,
      alpha: 0.65,
      isScorch: true
    });

    // Damage nearby peds
    for (let i = peds.length - 1; i >= 0; i--) {
      const p = peds[i];
      const d = Math.hypot(p.x - x, p.y - y);
      if (d < radius) {
        p.hp -= damage * (1 - d / radius * 0.6);
        if (p.hp <= 0) {
          handlePedKilled(p, i);
        }
      }
    }

    // Damage nearby vehicles (chain reaction!)
    for (const v of vehicles) {
      if (v.hp <= 0) continue;
      const d = Math.hypot(v.x - x, v.y - y);
      if (d < radius) {
        v.hp -= damage * (1 - d / radius * 0.5);
        const ang = Math.atan2(v.y - y, v.x - x);
        v.vx += Math.cos(ang) * 260;
        v.vy += Math.sin(ang) * 260;
      }
    }

    // Damage player if on foot nearby
    if (!player.vehicle) {
      const d = Math.hypot(player.x - x, player.y - y);
      if (d < radius) {
        damagePlayer(damage * 0.45 * (1 - d / radius));
      }
    }
  }

  function damagePlayer(amount) {
    if (player.armor > 0) {
      const absorb = Math.min(player.armor, amount * 0.7);
      player.armor -= absorb;
      player.health -= (amount - absorb);
    } else {
      player.health -= amount;
    }

    if (player.health <= 0) {
      // WASTED! Respawn at Hospital / Plaza
      player.health = 100;
      player.armor = 50;
      player.wanted = 0;
      player.multiplier = 1;
      player.cash = Math.max(0, player.cash - 100);
      if (player.vehicle) {
        player.vehicle.driver = null;
        player.vehicle = null;
      }
      player.x = 12 * TILE_SIZE + 80;
      player.y = 12 * TILE_SIZE + 80;
      activeMission = null;
      showBanner('WASTED! (-$100 MEDICAL BILL)', '#ff1744');
    }
    updateHUD();
  }

  function handlePedKilled(p, index) {
    spawnSparks(p.x, p.y, 10, '#dc2626');
    addCash(p.role === 'bounty' ? 1000 : (p.role === 'police' ? 150 : 60), p.x, p.y);

    if (p.role === 'police') {
      addWanted(0.55);
    } else {
      addWanted(0.22);
    }

    if (p.gang) {
      // Killing a gang member lowers their respect, boosts rival gang respect!
      modifyRespect(p.gang, -6);
      const rivals = Object.keys(GANGS).filter(k => k !== p.gang);
      modifyRespect(rivals[0], 4);
      modifyRespect(rivals[1], 4);
    }

    if (activeMission) {
      if (activeMission.type === 'rampage') {
        activeMission.killsNeeded = Math.max(0, activeMission.killsNeeded - 1);
        if (activeMission.killsNeeded === 0) {
          completeMission();
        }
      } else if (activeMission.type === 'bounty' && p === activeMission.targetEntity) {
        completeMission();
      }
    }

    peds.splice(index, 1);
  }

  // ==========================================
  // 9. PAYPHONE MISSIONS SYSTEM
  // ==========================================
  function startPayphoneMission(phone) {
    sfx.playCash();
    if (phone.type === 'checkpoint') {
      activeMission = {
        type: 'checkpoint',
        gang: phone.gang,
        title: 'CHROME RUNNER EXPRESS',
        desc: 'Race through 3 neon checkpoints across Vice City before time runs out!',
        timer: 50,
        checkpoints: [
          { x: 18 * TILE_SIZE + 80, y: 12 * TILE_SIZE + 80 },
          { x: 18 * TILE_SIZE + 80, y: 6 * TILE_SIZE + 80 },
          { x: 9 * TILE_SIZE + 80,  y: 9 * TILE_SIZE + 80 }
        ],
        reward: 2500
      };
    } else if (phone.type === 'bounty') {
      const tx = 15 * TILE_SIZE + 80;
      const ty = 15 * TILE_SIZE + 80;
      const boss = spawnPed(tx, ty, 'bounty', 'runners');
      boss.hp = 240;
      boss.radius = 14;
      // Give boss bodyguards
      spawnPed(tx + 28, ty, 'gang', 'runners');
      spawnPed(tx - 28, ty, 'gang', 'runners');
      activeMission = {
        type: 'bounty',
        gang: phone.gang,
        title: 'SYNDICATE VIP HIT',
        desc: 'Eliminate the rival Chrome Runner Underboss marked on your GPS!',
        timer: 65,
        targetEntity: boss,
        reward: 3000
      };
    } else {
      activeMission = {
        type: 'rampage',
        gang: phone.gang,
        title: 'BAYOU CHAOS CONTRACT',
        desc: 'Eliminate 10 targets or police officers before the timer expires!',
        timer: 45,
        killsNeeded: 10,
        reward: 2000
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
  // 10. MAIN SIMULATION UPDATE
  // ==========================================
  function update(dt) {
    // Update mouse world coords
    const activeEntity = player.vehicle || player;
    mouse.worldX = camera.x + (mouse.x - canvas.width * 0.5) / camera.zoom;
    mouse.worldY = camera.y + (mouse.y - canvas.height * 0.5) / camera.zoom;

    // Multiplier & Wanted Decay
    if (player.multTimer > 0) {
      player.multTimer -= dt;
      if (player.multTimer <= 0 && player.multiplier > 1) {
        player.multiplier = Math.max(1, player.multiplier - 1);
        player.multTimer = 4.0;
        updateHUD();
      }
    }

    if (player.wanted > 0) {
      player.wantedDecay -= dt;
      if (player.wantedDecay <= 0) {
        player.wanted = Math.max(0, player.wanted - dt * 0.15);
        updateHUD();
      }
    }

    // Pay N' Spray Check (Instant respray + clear Wanted + full repair)
    if (player.vehicle && payNSprayRect) {
      const v = player.vehicle;
      if (
        v.x > payNSprayRect.x && v.x < payNSprayRect.x + payNSprayRect.w &&
        v.y > payNSprayRect.y && v.y < payNSprayRect.y + payNSprayRect.h &&
        Math.hypot(v.vx, v.vy) < 90
      ) {
        if (v.hp < v.maxHp || player.wanted > 0) {
          v.hp = v.maxHp;
          player.wanted = 0;
          const colors = ['#ff2a85', '#00f0ff', '#39ff14', '#ffe600', '#a855f7', '#ffffff'];
          v.color = colors[Math.floor(Math.random() * colors.length)];
          sfx.playCash();
          showBanner('RESPRAYED & REPAIRED! COPS EVADED!', '#39ff14');
          updateHUD();
        }
      }
    }

    // Player Movement (On Foot vs Driving)
    if (player.vehicle) {
      const v = player.vehicle;
      sfx.updateRadio(true);

      const up = keys['KeyW'] || keys['ArrowUp'] || keys['KeyZ'] || pressedKeys['w'] || pressedKeys['z'] || pressedKeys['arrowup'];
      const down = keys['KeyS'] || keys['ArrowDown'] || pressedKeys['s'] || pressedKeys['arrowdown'];
      const left = keys['KeyA'] || keys['ArrowLeft'] || keys['KeyQ'] || pressedKeys['a'] || pressedKeys['q'] || pressedKeys['arrowleft'];
      const right = keys['KeyD'] || keys['ArrowRight'] || pressedKeys['d'] || pressedKeys['arrowright'];
      const handbrake = keys['Space'] || pressedKeys[' '];

      let throttle = 0;
      if (up) throttle += 1;
      if (down) throttle -= 0.7;

      let steer = 0;
      if (left) steer -= 1;
      if (right) steer += 1;

      // If the player presses Left/Right while stationary (without Up/Down),
      // automatically apply forward throttle and steer toward that screen direction
      // so both directional-style and classic GTA 2 tank-style controls work seamlessly!
      if (throttle === 0 && steer !== 0) {
        const targetScreenAngle = steer < 0 ? Math.PI : 0;
        let angleDiff = targetScreenAngle - v.angle;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

        throttle = 0.88;
        if (Math.abs(angleDiff) > 0.08) {
          steer = Math.sign(angleDiff);
        } else {
          v.angle = targetScreenAngle;
          steer = 0;
        }
      }

      // Compute forward & lateral velocity components AFTER applying engine throttle
      let cos = Math.cos(v.angle);
      let sin = Math.sin(v.angle);
      let forwardSpeed = v.vx * cos + v.vy * sin;
      let lateralSpeed = -v.vx * sin + v.vy * cos;

      // Apply engine acceleration directly to forwardSpeed
      if (throttle !== 0) {
        forwardSpeed += throttle * v.accel * dt;
      } else {
        // Natural rolling resistance when off throttle
        forwardSpeed *= Math.max(0, 1 - 1.6 * dt);
      }

      if (handbrake) {
        forwardSpeed *= Math.max(0, 1 - 3.5 * dt);
      }

      // Steering (responsive at both low and high speeds)
      const absFwd = Math.abs(forwardSpeed);
      if (steer !== 0 && (absFwd > 5 || throttle !== 0)) {
        const speedFactor = Math.max(0.45, Math.min(1.0, absFwd / 160));
        const dirSign = forwardSpeed >= -15 ? 1 : -1;
        const turnRate = (handbrake ? 4.2 : 3.2) * speedFactor * dirSign;
        v.angle += steer * turnRate * dt;
        cos = Math.cos(v.angle);
        sin = Math.sin(v.angle);
      }

      // Lateral tire grip (drifting when handbraking or cornering hard)
      const gripFactor = handbrake ? 0.985 : Math.max(0, 1 - v.grip * 7.5 * dt);
      lateralSpeed *= gripFactor;

      // Reconstruct world velocity vector (vx, vy)
      v.vx = cos * forwardSpeed - sin * lateralSpeed;
      v.vy = sin * forwardSpeed + cos * lateralSpeed;

      // Speed cap
      const totalSpd = Math.hypot(v.vx, v.vy);
      if (totalSpd > v.maxSpeed) {
        v.vx = (v.vx / totalSpd) * v.maxSpeed;
        v.vy = (v.vy / totalSpd) * v.maxSpeed;
      }

      // Leave tire skidmarks & smoke when drifting or handbraking
      if ((Math.abs(lateralSpeed) > 110 || (handbrake && totalSpd > 130))) {
        const rearX = v.x - cos * (v.w * 0.36);
        const rearY = v.y - sin * (v.w * 0.36);
        const sideX = -sin * (v.h * 0.38);
        const sideY = cos * (v.h * 0.38);

        skidMarks.push({
          x1: rearX + sideX, y1: rearY + sideY,
          x2: rearX + sideX - v.vx * dt, y2: rearY + sideY - v.vy * dt,
          width: 4, alpha: 0.45
        });
        skidMarks.push({
          x1: rearX - sideX, y1: rearY - sideY,
          x2: rearX - sideX - v.vx * dt, y2: rearY - sideY - v.vy * dt,
          width: 4, alpha: 0.45
        });

        if (skidMarks.length > 420) skidMarks.splice(0, 2);
      }

      player.x = v.x;
      player.y = v.y;
    } else {
      // On Foot Controls (Supports WASD, ZQSD, and Arrow Keys)
      let mx = 0, my = 0;
      if (keys['KeyW'] || keys['ArrowUp'] || keys['KeyZ'] || pressedKeys['w'] || pressedKeys['z'] || pressedKeys['arrowup']) my -= 1;
      if (keys['KeyS'] || keys['ArrowDown'] || pressedKeys['s'] || pressedKeys['arrowdown']) my += 1;
      if (keys['KeyA'] || keys['ArrowLeft'] || keys['KeyQ'] || pressedKeys['a'] || pressedKeys['q'] || pressedKeys['arrowleft']) mx -= 1;
      if (keys['KeyD'] || keys['ArrowRight'] || pressedKeys['d'] || pressedKeys['arrowright']) mx += 1;

      const len = Math.hypot(mx, my);
      const walkSpeed = 235;
      if (len > 0) {
        player.vx = (mx / len) * walkSpeed;
        player.vy = (my / len) * walkSpeed;
        player.stepPhase += dt * 12;
      } else {
        player.vx *= 0.75;
        player.vy *= 0.75;
      }

      player.x += player.vx * dt;
      player.y += player.vy * dt;
      player.angle = Math.atan2(mouse.worldY - player.y, mouse.worldX - player.x);

      resolveBuildingCollisions(player, player.radius, false);
    }

    // Firing Weapons (Works on foot & drive-by with SMG/Pistol!)
    player.fireTimer = Math.max(0, player.fireTimer - dt);
    if (mouse.down && player.fireTimer <= 0) {
      firePlayerWeapon();
    }

    // Update Pickups
    for (const pk of pickups) {
      if (pk.respawnTimer > 0) {
        pk.respawnTimer -= dt;
        continue;
      }
      if (Math.hypot(player.x - pk.x, player.y - pk.y) < 32) {
        if (pk.kind === 'health') {
          player.health = Math.min(player.maxHealth, player.health + 50);
          showBanner('HEALTH +50', '#ff2a55');
        } else if (pk.kind === 'armor') {
          player.armor = Math.min(player.maxArmor, player.armor + 50);
          showBanner('BODY ARMOR +50', '#00e5ff');
        } else {
          const addAmt = pk.kind === 'rocket' ? 8 : (pk.kind === 'shotgun' ? 30 : 120);
          player.ammo[pk.kind] = (player.ammo[pk.kind] || 0) + addAmt;
          const wIndex = WEAPONS.findIndex(w => w.id === pk.kind);
          if (wIndex >= 0) player.weaponIdx = wIndex;
          showBanner(`PICKED UP ${pk.kind.toUpperCase()} AMMO!`, '#ffe600');
        }
        sfx.playCash();
        pk.respawnTimer = 20;
        updateHUD();
      }
    }

    // Check Payphones (Only when not in an active mission)
    for (const ph of payphones) {
      ph.ringTimer += dt;
      const dist = Math.hypot(player.x - ph.x, player.y - ph.y);
      if (!activeMission && dist < 240 && Math.floor(ph.ringTimer * 2) % 4 === 0 && Math.random() < 0.08) {
        sfx.playPhoneRing();
      }
      if (!activeMission && dist < 34) {
        startPayphoneMission(ph);
      }
    }

    // Update Active Mission
    if (activeMission) {
      activeMission.timer -= dt;
      if (activeMission.type === 'checkpoint') {
        const cp = activeMission.checkpoints[0];
        if (cp && Math.hypot(player.x - cp.x, player.y - cp.y) < 65) {
          activeMission.checkpoints.shift();
          sfx.playCash();
          if (activeMission.checkpoints.length === 0) {
            completeMission();
          } else {
            showBanner(`${activeMission.checkpoints.length} CHECKPOINTS LEFT!`, '#00f0ff');
          }
        }
      }
      if (activeMission && activeMission.timer <= 0) {
        showBanner('CONTRACT EXPIRED!', '#ff1744');
        activeMission = null;
        updateHUD();
      }
      updateMissionHUD();
    }

    // Update Vehicles (AI Traffic, Police Interceptors, Physics, Collisions)
    updateVehicles(dt);

    // Update Pedestrians, Gangs, & Police Officers
    updatePeds(dt);

    // Update Bullets & Rockets
    updateBullets(dt);

    // Update Particles & Floating Texts
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
      ft.y -= 32 * dt;
      ft.life -= dt;
      if (ft.life <= 0) floatingTexts.splice(i, 1);
    }

    // Dynamic Police Spawner when Wanted > 0
    if (Math.floor(player.wanted) >= 1 && Math.random() < dt * 0.45 * Math.floor(player.wanted)) {
      const copCount = vehicles.filter(v => v.isPolice && v.hp > 0).length;
      if (copCount < Math.floor(player.wanted) + 1) {
        const ang = Math.random() * Math.PI * 2;
        const spawnX = Math.max(120, Math.min(WORLD_W - 120, player.x + Math.cos(ang) * 720));
        const spawnY = Math.max(120, Math.min(WORLD_H - 120, player.y + Math.sin(ang) * 720));
        const vType = player.wanted >= 4 && Math.random() < 0.4 ? 'swat' : 'police';
        spawnVehicle(vType, spawnX, spawnY, ang + Math.PI, 'police');
      }
    }

    // GTA 2 Dynamic Zoom Camera (Zooms out smoothly as speed increases!)
    const speed = player.vehicle ? Math.hypot(player.vehicle.vx, player.vehicle.vy) : Math.hypot(player.vx, player.vy);
    const targetZoom = player.vehicle ? Math.max(0.68, 1.0 - (speed / 720) * 0.30) : 1.06;
    camera.zoom += (targetZoom - camera.zoom) * 4.5 * dt;

    // Lead camera slightly in direction of velocity
    const leadX = activeEntity.x + (player.vehicle ? player.vehicle.vx * 0.22 : (mouse.worldX - player.x) * 0.12);
    const leadY = activeEntity.y + (player.vehicle ? player.vehicle.vy * 0.22 : (mouse.worldY - player.y) * 0.12);
    camera.x += (leadX - camera.x) * 7.5 * dt;
    camera.y += (leadY - camera.y) * 7.5 * dt;

    if (camera.shake > 0) {
      camera.shake = Math.max(0, camera.shake - 35 * dt);
    }
  }

  function firePlayerWeapon() {
    // In vehicle, drive-by uses SMG or Pistol
    let w = WEAPONS[player.weaponIdx];
    if (player.vehicle && w.id !== 'pistol' && w.id !== 'smg') {
      w = WEAPONS[1]; // Auto-use SMG for drive-by if available, else Pistol
      if ((player.ammo.smg || 0) <= 0) w = WEAPONS[0];
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

    // Muzzle flash & brass shell casing ejection
    const muzX = originX + Math.cos(baseAngle) * 20;
    const muzY = originY + Math.sin(baseAngle) * 20;
    particles.push({
      x: muzX, y: muzY, vx: 0, vy: 0,
      r: w.explosive ? 11 : 7,
      color: '#fef08a',
      life: 0.06, maxLife: 0.06
    });
    if (!w.flame && !w.explosive) {
      const sideAng = baseAngle + Math.PI * 0.5 + (Math.random() - 0.5) * 0.4;
      particles.push({
        x: originX + Math.cos(baseAngle) * 10,
        y: originY + Math.sin(baseAngle) * 10,
        vx: Math.cos(sideAng) * (55 + Math.random() * 40),
        vy: Math.sin(sideAng) * (55 + Math.random() * 40),
        r: 1.8,
        color: '#facc15',
        life: 0.55, maxLife: 0.55
      });
    }

    for (let i = 0; i < w.count; i++) {
      const a = baseAngle + (Math.random() - 0.5) * w.spread;
      bullets.push({
        x: originX + Math.cos(a) * 20,
        y: originY + Math.sin(a) * 20,
        vx: Math.cos(a) * w.speed,
        vy: Math.sin(a) * w.speed,
        damage: w.damage,
        life: w.range / w.speed,
        color: w.color,
        explosive: !!w.explosive,
        flame: !!w.flame,
        fromPlayer: true
      });
    }
  }

  function updateVehicles(dt) {
    for (let i = vehicles.length - 1; i >= 0; i--) {
      const v = vehicles[i];
      v.sirenPhase += dt * 10;

      // AI Driver Logic
      if (v.driver === 'civilian' && v.hp > 0) {
        const cos = Math.cos(v.angle);
        const sin = Math.sin(v.angle);
        const cruiseSpeed = 210;
        v.vx += (cos * cruiseSpeed - v.vx) * 2.5 * dt;
        v.vy += (sin * cruiseSpeed - v.vy) * 2.5 * dt;

        // Turn at intersections or if blocked ahead
        const lookX = v.x + cos * 68;
        const lookY = v.y + sin * 68;
        const gx = Math.floor(lookX / TILE_SIZE);
        const gy = Math.floor(lookY / TILE_SIZE);
        if (gx < 0 || gx >= GRID_W || gy < 0 || gy >= GRID_H || worldGrid[gy][gx] !== 0) {
          v.angle += Math.PI * 0.5;
        }
      } else if (v.driver === 'police' && v.hp > 0) {
        if (player.wanted > 0) {
          // Chase player aggressively!
          const targetAngle = Math.atan2(player.y - v.y, player.x - v.x);
          let diff = targetAngle - v.angle;
          while (diff > Math.PI) diff -= Math.PI * 2;
          while (diff < -Math.PI) diff += Math.PI * 2;
          v.angle += Math.sign(diff) * Math.min(Math.abs(diff), 2.8 * dt);

          const cos = Math.cos(v.angle);
          const sin = Math.sin(v.angle);
          v.vx += cos * v.accel * 0.78 * dt;
          v.vy += sin * v.accel * 0.78 * dt;

          // If close to on-foot player, hop out and shoot
          const dist = Math.hypot(player.x - v.x, player.y - v.y);
          if (!player.vehicle && dist < 170) {
            v.driver = null;
            spawnPed(v.x + 28, v.y, 'police');
          }
        } else {
          v.sirenOn = false;
          v.driver = 'civilian';
        }
      } else if (!v.driver) {
        // Coast to stop
        v.vx *= (1 - 2.2 * dt);
        v.vy *= (1 - 2.2 * dt);
      }

      v.x += v.vx * dt;
      v.y += v.vy * dt;

      resolveBuildingCollisions(v, Math.max(v.w, v.h) * 0.42, true);

      // Vehicle-to-Vehicle Collisions
      for (let j = i - 1; j >= 0; j--) {
        const v2 = vehicles[j];
        const dx = v2.x - v.x;
        const dy = v2.y - v.y;
        const dist = Math.hypot(dx, dy);
        const minDist = 42;
        if (dist < minDist && dist > 0.01) {
          const nx = dx / dist;
          const ny = dy / dist;
          const overlap = minDist - dist;
          v.x -= nx * overlap * 0.5;
          v.y -= ny * overlap * 0.5;
          v2.x += nx * overlap * 0.5;
          v2.y += ny * overlap * 0.5;

          const relVx = v.vx - v2.vx;
          const relVy = v.vy - v2.vy;
          const impact = Math.hypot(relVx, relVy);
          if (impact > 180) {
            spawnSparks((v.x + v2.x) * 0.5, (v.y + v2.y) * 0.5, 6);
            v.hp -= impact * 0.04;
            v2.hp -= impact * 0.04;
          }

          const avgVx = (v.vx + v2.vx) * 0.5;
          const avgVy = (v.vy + v2.vy) * 0.5;
          v.vx = avgVx - nx * 45;
          v.vy = avgVy - ny * 45;
          v2.vx = avgVx + nx * 45;
          v2.vy = avgVy + ny * 45;
        }
      }

      // Vehicle Roadkill / Running over Peds
      const vSpeed = Math.hypot(v.vx, v.vy);
      if (vSpeed > 110) {
        for (let k = peds.length - 1; k >= 0; k--) {
          const p = peds[k];
          if (Math.hypot(p.x - v.x, p.y - v.y) < 30) {
            p.hp -= vSpeed * 0.45;
            if (p.hp <= 0 && v.driver === 'player') {
              handlePedKilled(p, k);
            } else if (p.hp <= 0) {
              peds.splice(k, 1);
            }
          }
        }
      }

      // Smoke & Fire when heavily damaged
      if (v.hp < v.maxHp * 0.4 && v.hp > 0) {
        if (Math.random() < 0.35) {
          particles.push({
            x: v.x + (Math.random() - 0.5) * 14,
            y: v.y + (Math.random() - 0.5) * 14,
            vx: (Math.random() - 0.5) * 30,
            vy: -20 - Math.random() * 30,
            r: 5 + Math.random() * 6,
            color: v.hp < v.maxHp * 0.2 ? '#ff5722' : '#52525b',
            life: 0.45,
            maxLife: 0.45
          });
        }
      }

      // Explode when HP reaches 0
      if (v.hp <= 0 && !v.exploded) {
        v.exploded = true;
        if (player.vehicle === v) {
          player.vehicle = null;
          damagePlayer(45);
        }
        createExplosion(v.x, v.y, 150, 200);
        if (v.isPolice) addWanted(0.8);
        addCash(250, v.x, v.y);
        // Remove wrecked hull after a moment
        setTimeout(() => {
          const idx = vehicles.indexOf(v);
          if (idx >= 0) vehicles.splice(idx, 1);
        }, 4000);
      }
    }
  }

  function updatePeds(dt) {
    for (let i = peds.length - 1; i >= 0; i--) {
      const p = peds[i];
      p.aiTimer -= dt;

      const distToPlayer = Math.hypot(player.x - p.x, player.y - p.y);

      if (p.role === 'police' || p.role === 'bounty' || (p.gang && GANGS[p.gang].respect < 25)) {
        // Hostile to player if within range
        if (distToPlayer < 420 && (p.role !== 'police' || player.wanted > 0)) {
          p.angle = Math.atan2(player.y - p.y, player.x - p.x);
          if (distToPlayer > 160) {
            p.vx = Math.cos(p.angle) * 115;
            p.vy = Math.sin(p.angle) * 115;
          } else {
            p.vx = 0;
            p.vy = 0;
          }

          p.shootTimer -= dt;
          if (p.shootTimer <= 0) {
            p.shootTimer = p.role === 'bounty' ? 0.35 : 0.85;
            bullets.push({
              x: p.x + Math.cos(p.angle) * 16,
              y: p.y + Math.sin(p.angle) * 16,
              vx: Math.cos(p.angle) * 620,
              vy: Math.sin(p.angle) * 620,
              damage: 10,
              life: 0.7,
              color: '#ff9100',
              fromPlayer: false
            });
          }
        }
      } else {
        // Civilian or friendly gang member
        if (p.panicTimer > 0) {
          p.panicTimer -= dt;
          p.vx = Math.cos(p.angle) * 165;
          p.vy = Math.sin(p.angle) * 165;
        } else {
          if (p.aiTimer <= 0) {
            p.aiTimer = 2.0 + Math.random() * 3.0;
            p.angle += (Math.random() - 0.5) * 1.8;
          }
          p.vx = Math.cos(p.angle) * 55;
          p.vy = Math.sin(p.angle) * 55;
        }
      }

      if (Math.hypot(p.vx, p.vy) > 10) {
        p.stepPhase += dt * (p.panicTimer > 0 ? 15 : 8);
      }

      p.x += p.vx * dt;
      p.y += p.vy * dt;
      resolveBuildingCollisions(p, p.radius, false);
    }

    // Keep city populated with pedestrians
    if (peds.length < 65 && Math.random() < 0.08) {
      const ang = Math.random() * Math.PI * 2;
      const sx = Math.max(100, Math.min(WORLD_W - 100, player.x + Math.cos(ang) * 650));
      const sy = Math.max(100, Math.min(WORLD_H - 100, player.y + Math.sin(ang) * 650));
      const gang = getGangForPos(sx, sy);
      const role = Math.floor(player.wanted) >= 2 && Math.random() < 0.35 ? 'police' : (Math.random() < 0.3 ? 'gang' : 'civilian');
      spawnPed(sx, sy, role, role === 'gang' ? gang : null);
    }
  }

  function updateBullets(dt) {
    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.life -= dt;

      if (b.flame) {
        particles.push({
          x: b.x, y: b.y,
          vx: (Math.random() - 0.5) * 40,
          vy: (Math.random() - 0.5) * 40,
          r: 6 + Math.random() * 7,
          color: Math.random() < 0.5 ? '#ff6d00' : '#ffe600',
          life: 0.16, maxLife: 0.16
        });
      }

      let hitSomething = false;

      // Check Building Hit
      for (const bld of buildings) {
        if (b.x > bld.x && b.x < bld.x + bld.w && b.y > bld.y && b.y < bld.y + bld.h) {
          hitSomething = true;
          break;
        }
      }

      // Check Vehicle Hit
      if (!hitSomething) {
        for (const v of vehicles) {
          if (b.fromPlayer && player.vehicle === v) continue;
          if (Math.hypot(b.x - v.x, b.y - v.y) < 26) {
            v.hp -= b.damage;
            hitSomething = true;
            break;
          }
        }
      }

      // Check Ped Hit
      if (!hitSomething && b.fromPlayer) {
        for (let k = peds.length - 1; k >= 0; k--) {
          const p = peds[k];
          if (Math.hypot(b.x - p.x, b.y - p.y) < p.radius + 5) {
            p.hp -= b.damage;
            p.panicTimer = 5.0;
            p.angle = Math.atan2(p.y - player.y, p.x - player.x);
            if (p.hp <= 0) {
              handlePedKilled(p, k);
            }
            hitSomething = true;
            break;
          }
        }
      }

      // Check Player Hit (from Police / Rival Gang)
      if (!hitSomething && !b.fromPlayer) {
        if (player.vehicle) {
          if (Math.hypot(b.x - player.vehicle.x, b.y - player.vehicle.y) < 28) {
            player.vehicle.hp -= b.damage;
            hitSomething = true;
          }
        } else if (Math.hypot(b.x - player.x, b.y - player.y) < player.radius + 4) {
          damagePlayer(b.damage);
          hitSomething = true;
        }
      }

      if (hitSomething || b.life <= 0) {
        if (b.explosive) {
          createExplosion(b.x, b.y, 145, 190);
        } else if (hitSomething && !b.flame) {
          spawnSparks(b.x, b.y, 4, b.color);
        }
        bullets.splice(i, 1);
      }
    }
  }

  // ==========================================
  // 11. 2.5D TOP-DOWN RENDERER (GTA 2 STYLE)
  // ==========================================
  function render() {
    ctx.fillStyle = '#070913';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();

    // Camera Transform + Screen Shake
    const shakeX = (Math.random() - 0.5) * camera.shake;
    const shakeY = (Math.random() - 0.5) * camera.shake;
    ctx.translate(canvas.width * 0.5 + shakeX, canvas.height * 0.5 + shakeY);
    ctx.scale(camera.zoom, camera.zoom);
    ctx.translate(-camera.x, -camera.y);

    // Compute visible world bounds for fast culling
    const halfW = (canvas.width * 0.5) / camera.zoom + 240;
    const halfH = (canvas.height * 0.5) / camera.zoom + 240;
    const minGX = Math.max(0, Math.floor((camera.x - halfW) / TILE_SIZE));
    const maxGX = Math.min(GRID_W - 1, Math.floor((camera.x + halfW) / TILE_SIZE));
    const minGY = Math.max(0, Math.floor((camera.y - halfH) / TILE_SIZE));
    const maxGY = Math.min(GRID_H - 1, Math.floor((camera.y + halfH) / TILE_SIZE));

    // 1. Draw Ground Tiles (Textured Asphalt, Concrete Sidewalks, Beach Sand, Ocean, Pay N' Spray)
    const sf = window.SpriteForge;
    for (let gy = minGY; gy <= maxGY; gy++) {
      for (let gx = minGX; gx <= maxGX; gx++) {
        const t = worldGrid[gy][gx];
        const wx = gx * TILE_SIZE;
        const wy = gy * TILE_SIZE;

        if (t === 0) {
          // Textured Weathered Asphalt Road
          ctx.drawImage(sf.textures.asphalt, wx, wy, TILE_SIZE, TILE_SIZE);

          // Road Markings: Double yellow centerline, dashed lanes, manhole covers, crosswalks
          const isRoadX = (gx % 3 === 0);
          const isRoadY = (gy % 3 === 0);
          if (isRoadX && !isRoadY) {
            // Double yellow center divider
            ctx.fillStyle = 'rgba(234, 179, 8, 0.78)';
            ctx.fillRect(wx + TILE_SIZE * 0.5 - 4, wy, 2.5, TILE_SIZE);
            ctx.fillRect(wx + TILE_SIZE * 0.5 + 1.5, wy, 2.5, TILE_SIZE);
            // White lane dashes
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
            // Zebra crosswalks on all 4 sides of intersection + iron manhole cover
            ctx.fillStyle = 'rgba(240, 244, 248, 0.38)';
            for (let c = 22; c < TILE_SIZE - 22; c += 16) {
              ctx.fillRect(wx + c, wy + 5, 9, 18);
              ctx.fillRect(wx + c, wy + TILE_SIZE - 23, 9, 18);
              ctx.fillRect(wx + 5, wy + c, 18, 9);
              ctx.fillRect(wx + TILE_SIZE - 23, wy + c, 18, 9);
            }
            // Cast-iron manhole cover in intersection center
            ctx.fillStyle = '#111318';
            ctx.beginPath();
            ctx.arc(wx + TILE_SIZE * 0.5, wy + TILE_SIZE * 0.5, 9, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#334155';
            ctx.lineWidth = 1.5;
            ctx.stroke();
          }
        } else if (t === 1) {
          // Textured Concrete Sidewalk & Curb Slabs
          ctx.drawImage(sf.textures.sidewalk, wx, wy, TILE_SIZE, TILE_SIZE);
        } else if (t === 2) {
          // Textured Lush Park Grass + Sidewalk Border
          ctx.drawImage(sf.textures.sidewalk, wx, wy, TILE_SIZE, TILE_SIZE);
          ctx.drawImage(sf.textures.grass, wx + 12, wy + 12, TILE_SIZE - 24, TILE_SIZE - 24);
        } else if (t === 3) {
          // Textured Rippled Beach Sand
          ctx.drawImage(sf.textures.sand, wx, wy, TILE_SIZE, TILE_SIZE);
        } else if (t === 4) {
          // Animated Ocean Water with Surf Foam along Beach Edge
          const oceanGrad = ctx.createLinearGradient(wx, wy, wx + TILE_SIZE, wy);
          oceanGrad.addColorStop(0, '#0284c7');
          oceanGrad.addColorStop(0.35, '#0369a1');
          oceanGrad.addColorStop(1, '#082f49');
          ctx.fillStyle = oceanGrad;
          ctx.fillRect(wx, wy, TILE_SIZE, TILE_SIZE);

          const waveOffset = Math.sin(performance.now() * 0.0028 + gy * 0.9) * 10;
          if (gx === 22) {
            // White foamy surf breaking onto the sand
            ctx.fillStyle = 'rgba(240, 249, 255, 0.55)';
            ctx.fillRect(wx + Math.max(0, waveOffset), wy, 10, TILE_SIZE);
          }
          ctx.fillStyle = 'rgba(125, 211, 252, 0.22)';
          ctx.fillRect(wx + 48 + waveOffset, wy + 24, 6, TILE_SIZE - 48);
        } else if (t === 5) {
          // Pay N' Spray Custom Garage Bay
          ctx.drawImage(sf.textures.sidewalk, wx, wy, TILE_SIZE, TILE_SIZE);
          ctx.fillStyle = '#111827';
          ctx.fillRect(wx + 12, wy + 12, TILE_SIZE - 24, TILE_SIZE - 24);
          // Caution yellow/black hazard stripes at entrance
          ctx.strokeStyle = '#39ff14';
          ctx.lineWidth = 3;
          ctx.strokeRect(wx + 12, wy + 12, TILE_SIZE - 24, TILE_SIZE - 24);
          ctx.fillStyle = '#39ff14';
          ctx.font = 'bold 14px monospace';
          ctx.textAlign = 'center';
          ctx.fillText("PAY N' SPRAY", wx + TILE_SIZE * 0.5, wy + TILE_SIZE * 0.5 - 6);
          ctx.fillStyle = '#e2e8f0';
          ctx.font = 'bold 10px monospace';
          ctx.fillText('DRIVE IN: REPAIR & EVADE', wx + TILE_SIZE * 0.5, wy + TILE_SIZE * 0.5 + 12);
        }
      }
    }

    // 2. Draw Tire Skidmarks & Explosion Scorch Marks
    for (const sk of skidMarks) {
      if (sk.isScorch) {
        const sGrad = ctx.createRadialGradient(
          (sk.x1 + sk.x2) * 0.5, (sk.y1 + sk.y2) * 0.5, 4,
          (sk.x1 + sk.x2) * 0.5, (sk.y1 + sk.y2) * 0.5, sk.width * 0.65
        );
        sGrad.addColorStop(0, 'rgba(5, 5, 8, 0.85)');
        sGrad.addColorStop(0.6, 'rgba(15, 15, 20, 0.45)');
        sGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = sGrad;
        ctx.beginPath();
        ctx.arc((sk.x1 + sk.x2) * 0.5, (sk.y1 + sk.y2) * 0.5, sk.width * 0.65, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.strokeStyle = `rgba(10, 10, 14, ${sk.alpha})`;
        ctx.lineWidth = sk.width;
        ctx.beginPath();
        ctx.moveTo(sk.x1, sk.y1);
        ctx.lineTo(sk.x2, sk.y2);
        ctx.stroke();
      }
    }

    // 3. Draw Pickups & Ringing Payphone Booths
    const nowSec = performance.now() * 0.001;
    for (const pk of pickups) {
      if (pk.respawnTimer > 0) continue;
      ctx.save();
      ctx.translate(pk.x, pk.y);
      ctx.rotate(nowSec * 2.0);
      const col = pk.kind === 'health' ? '#ff2a55' : (pk.kind === 'armor' ? '#00e5ff' : '#ffe600');
      // Crate shadow & metallic military weapon case
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(-10, -10, 24, 24);
      ctx.fillStyle = '#1e293b';
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
      const pulse = (Math.sin(nowSec * 6) + 1) * 0.5;
      ctx.save();
      ctx.translate(ph.x, ph.y);
      if (!activeMission) {
        ctx.strokeStyle = `rgba(57, 255, 20, ${0.85 - pulse * 0.65})`;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(0, 0, 14 + pulse * 24, 0, Math.PI * 2);
        ctx.stroke();
      }
      // Glass & Aluminum Payphone Booth
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(-7, -7, 20, 20);
      ctx.fillStyle = '#059669';
      ctx.fillRect(-9, -9, 18, 18);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(-6, -6, 12, 12);
      ctx.strokeStyle = '#39ff14';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(-9, -9, 18, 18);
      ctx.restore();
    }

    // Mission Checkpoint Ring
    if (activeMission && activeMission.type === 'checkpoint' && activeMission.checkpoints.length > 0) {
      const cp = activeMission.checkpoints[0];
      ctx.save();
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 4;
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.arc(cp.x, cp.y, 42 + Math.sin(nowSec * 6) * 6, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // 4. Draw Pedestrians & Player (using Multi-Frame Pre-Rendered Sprites)
    for (const p of peds) {
      drawPed(p);
    }
    if (!player.vehicle) {
      drawPlayerOnFoot();
    }

    // 5. Draw High-Detail Pre-Rendered Vehicles + Headlights & Sirens
    const lightsOn = TIME_MODES[timeMode].lightsOn;
    for (const v of vehicles) {
      drawVehicle(v, lightsOn);
    }

    // 6. Draw Bullets (with Tracer Trails) & Particles
    for (const b of bullets) {
      ctx.save();
      ctx.strokeStyle = b.color;
      ctx.lineWidth = b.explosive ? 4 : 2.2;
      ctx.shadowColor = b.color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(b.x, b.y);
      ctx.lineTo(b.x - b.vx * 0.028, b.y - b.vy * 0.028);
      ctx.stroke();
      ctx.restore();
    }

    for (const pt of particles) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, pt.life / pt.maxLife);
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 7. Draw 2.5D Perspective Extruded Buildings with Illuminated Windows & Textured Rooftops
    drawBuildings25D(minGX, maxGX, minGY, maxGY, lightsOn);

    // 8. Draw Lush Tropical Palm Trees & Streetlamp Glow Halos
    for (const tree of palmTrees) {
      if (Math.abs(tree.x - camera.x) > halfW || Math.abs(tree.y - camera.y) > halfH) continue;
      drawPalmTree(tree);
    }

    if (lightsOn) {
      for (const lamp of streetlamps) {
        if (Math.abs(lamp.x - camera.x) > halfW || Math.abs(lamp.y - camera.y) > halfH) continue;
        const lGrad = ctx.createRadialGradient(lamp.x, lamp.y, 2, lamp.x, lamp.y, 68);
        lGrad.addColorStop(0, 'rgba(255, 245, 200, 0.32)');
        lGrad.addColorStop(0.4, 'rgba(255, 190, 120, 0.12)');
        lGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = lGrad;
        ctx.beginPath();
        ctx.arc(lamp.x, lamp.y, 68, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 9. Draw Floating Cash / Score Popups
    for (const ft of floatingTexts) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, ft.life / ft.maxLife);
      ctx.font = 'bold 16px monospace';
      ctx.fillStyle = ft.color;
      ctx.shadowColor = '#000';
      ctx.shadowBlur = 4;
      ctx.textAlign = 'center';
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    }

    // 10. Draw GTA 2 Navigation Arrow pointing toward active mission objective
    drawMissionArrow();

    ctx.restore();

    // Render Minimap
    renderMinimap();
  }

  function drawPed(p) {
    const sf = window.SpriteForge;
    const isMoving = Math.hypot(p.vx, p.vy) > 10;
    const frameIdx = isMoving ? (Math.floor(p.stepPhase) % 4) : 0;
    const hasGun = p.role === 'police' || p.role === 'bounty' || p.role === 'gang';
    const sprite = sf.getCharacterSprite(p.color, p.skinColor || '#f5d0b5', frameIdx, hasGun);

    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.angle);
    ctx.drawImage(sprite, -22, -22);

    // Bounty target pulsing ring
    if (p.role === 'bounty') {
      ctx.strokeStyle = '#ff1744';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, 18, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawPlayerOnFoot() {
    const sf = window.SpriteForge;
    const isMoving = Math.hypot(player.vx, player.vy) > 10;
    const frameIdx = isMoving ? (Math.floor(player.stepPhase) % 4) : 0;
    const sprite = sf.getCharacterSprite('#ff2a85', '#f5d0b5', frameIdx, true);

    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.angle);
    ctx.drawImage(sprite, -22, -22);
    ctx.restore();
  }

  function drawVehicle(v, lightsOn) {
    const sf = window.SpriteForge;
    const isDamaged = v.hp <= 0 || v.hp < v.maxHp * 0.45;
    const sprite = sf.getVehicleSprite(v.typeKey, v.color, isDamaged);

    ctx.save();
    ctx.translate(v.x, v.y);
    ctx.rotate(v.angle);

    // Dual Realistic Headlight Cones & Rear Red Brake Glow
    if (lightsOn && v.hp > 0) {
      const grad = ctx.createLinearGradient(v.w * 0.4, 0, v.w * 0.4 + 220, 0);
      grad.addColorStop(0, 'rgba(254, 249, 195, 0.38)');
      grad.addColorStop(0.5, 'rgba(254, 249, 195, 0.14)');
      grad.addColorStop(1, 'rgba(254, 249, 195, 0)');
      ctx.fillStyle = grad;

      // Left & Right headlight beams
      ctx.beginPath();
      ctx.moveTo(v.w * 0.44, -v.h * 0.42);
      ctx.lineTo(v.w * 0.44 + 220, -v.h * 1.85);
      ctx.lineTo(v.w * 0.44 + 220, -v.h * 0.05);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(v.w * 0.44, v.h * 0.42);
      ctx.lineTo(v.w * 0.44 + 220, v.h * 0.05);
      ctx.lineTo(v.w * 0.44 + 220, v.h * 1.85);
      ctx.closePath();
      ctx.fill();

      // Rear red taillight road reflection
      const tailGrad = ctx.createRadialGradient(-v.w * 0.52, 0, 2, -v.w * 0.52, 0, 28);
      tailGrad.addColorStop(0, 'rgba(239, 68, 68, 0.45)');
      tailGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');
      ctx.fillStyle = tailGrad;
      ctx.beginPath();
      ctx.arc(-v.w * 0.52, 0, 28, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw pre-rendered high-detail car sprite
    ctx.drawImage(sprite, -42, -24);

    // Police Dynamic Red/Blue Strobe Lightbar & Ground Halo
    if (v.isPolice && v.sirenOn && v.hp > 0) {
      const isRed = Math.sin(v.sirenPhase) > 0;
      const strobeCol = isRed ? '#ff1744' : '#2979ff';
      const sGrad = ctx.createRadialGradient(0, isRed ? -6 : 6, 2, 0, isRed ? -6 : 6, 56);
      sGrad.addColorStop(0, isRed ? 'rgba(255, 23, 68, 0.65)' : 'rgba(41, 121, 255, 0.65)');
      sGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = sGrad;
      ctx.beginPath();
      ctx.arc(0, isRed ? -6 : 6, 56, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-3, isRed ? -9 : 3, 6, 6);
    }

    ctx.restore();
  }

  function drawWallWithWindows(x1, y1, x2, y2, rx2, ry2, rx1, ry1, wallColor, neonColor, lightsOn) {
    ctx.fillStyle = wallColor;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineTo(rx2, ry2);
    ctx.lineTo(rx1, ry1);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#090d16';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Draw rows of illuminated office/hotel windows along the 3D perspective wall
    const floors = 3;
    const cols = 5;
    for (let f = 0; f < floors; f++) {
      const t1 = (f + 0.25) / floors;
      const t2 = (f + 0.72) / floors;

      const rowStartX1 = x1 + (rx1 - x1) * t1;
      const rowStartY1 = y1 + (ry1 - y1) * t1;
      const rowEndX1   = x2 + (rx2 - x2) * t1;
      const rowEndY1   = y2 + (ry2 - y2) * t1;

      const rowStartX2 = x1 + (rx1 - x1) * t2;
      const rowStartY2 = y1 + (ry1 - y1) * t2;
      const rowEndX2   = x2 + (rx2 - x2) * t2;
      const rowEndY2   = y2 + (ry2 - y2) * t2;

      for (let c = 0; c < cols; c++) {
        // Deterministic window lit pattern
        const isLit = ((f * 7 + c * 13 + Math.round(x1)) % 3 !== 0);
        if (!isLit && lightsOn) continue;

        const s1 = (c + 0.2) / cols;
        const s2 = (c + 0.8) / cols;

        ctx.fillStyle = lightsOn
          ? ((c + f) % 4 === 0 ? neonColor : 'rgba(254, 240, 138, 0.75)')
          : 'rgba(148, 163, 184, 0.45)';

        ctx.beginPath();
        ctx.moveTo(rowStartX1 + (rowEndX1 - rowStartX1) * s1, rowStartY1 + (rowEndY1 - rowStartY1) * s1);
        ctx.lineTo(rowStartX1 + (rowEndX1 - rowStartX1) * s2, rowStartY1 + (rowEndY1 - rowStartY1) * s2);
        ctx.lineTo(rowStartX2 + (rowEndX2 - rowStartX2) * s2, rowStartY2 + (rowEndY2 - rowStartY2) * s2);
        ctx.lineTo(rowStartX2 + (rowEndX2 - rowStartX2) * s1, rowStartY2 + (rowEndY2 - rowStartY2) * s1);
        ctx.closePath();
        ctx.fill();
      }
    }
  }

  function drawBuildings25D(minGX, maxGX, minGY, maxGY, lightsOn) {
    const sf = window.SpriteForge;
    for (const b of buildings) {
      const gx = Math.floor(b.x / TILE_SIZE);
      const gy = Math.floor(b.y / TILE_SIZE);
      if (gx < minGX || gx > maxGX || gy < minGY || gy > maxGY) continue;

      const cx = b.x + b.w * 0.5;
      const cy = b.y + b.h * 0.5;

      // Ground Ambient Shadow around building base
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.fillRect(b.x - 6, b.y - 6, b.w + 16, b.h + 16);

      // 2.5D Perspective Offset relative to camera center
      const factor = b.height * 0.0022;
      const offX = (cx - camera.x) * factor;
      const offY = (cy - camera.y) * factor;

      const rx = b.x + offX;
      const ry = b.y + offY;

      // Top or Bottom Visible Facade with Illuminated Windows
      if (ry > b.y) {
        drawWallWithWindows(b.x, b.y, b.x + b.w, b.y, rx + b.w, ry, rx, ry, b.wallColor, b.neonColor, lightsOn);
      } else {
        drawWallWithWindows(b.x, b.y + b.h, b.x + b.w, b.y + b.h, rx + b.w, ry + b.h, rx, ry + b.h, b.wallColor, b.neonColor, lightsOn);
      }

      // Left or Right Visible Facade with Illuminated Windows
      if (rx > b.x) {
        drawWallWithWindows(b.x, b.y, b.x, b.y + b.h, rx, ry + b.h, rx, ry, b.wallColor, b.neonColor, lightsOn);
      } else {
        drawWallWithWindows(b.x + b.w, b.y, b.x + b.w, b.y + b.h, rx + b.w, ry + b.h, rx + b.w, ry, b.wallColor, b.neonColor, lightsOn);
      }

      // Draw Detailed Pre-Rendered Architectural Rooftop Texture (HVAC fans, skylights, gravel/tiles)
      const roofTex = sf.textures.roofs[b.roofStyle || 0];
      ctx.drawImage(roofTex, rx, ry, b.w, b.h);

      // Neon Architectural Roof Perimeter Tube
      if (lightsOn) {
        ctx.save();
        ctx.strokeStyle = b.neonColor;
        ctx.shadowColor = b.neonColor;
        ctx.shadowBlur = 10;
        ctx.lineWidth = 2;
        ctx.strokeRect(rx + 2, ry + 2, b.w - 4, b.h - 4);
        ctx.restore();
      }

      // Glowing Neon Rooftop Billboard Sign
      if (b.sign) {
        ctx.save();
        ctx.fillStyle = 'rgba(9, 13, 22, 0.82)';
        ctx.fillRect(rx + 14, ry + b.h - 28, b.w - 28, 20);
        ctx.strokeStyle = b.neonColor;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(rx + 14, ry + b.h - 28, b.w - 28, 20);

        ctx.fillStyle = b.neonColor;
        if (lightsOn) {
          ctx.shadowColor = b.neonColor;
          ctx.shadowBlur = 12;
        }
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(b.sign, rx + b.w * 0.5, ry + b.h - 14);
        ctx.restore();
      }
    }
  }

  function drawPalmTree(tree) {
    const sf = window.SpriteForge;
    ctx.save();
    ctx.translate(tree.x, tree.y);
    // Gentle breeze sway
    const sway = Math.sin(performance.now() * 0.0018 + tree.x) * 0.06;
    ctx.rotate(sway);
    ctx.drawImage(sf.propSprites.palm, -48, -48);
    ctx.restore();
  }

  function drawMissionArrow() {
    let tx = null, ty = null, col = '#39ff14';
    if (activeMission) {
      if (activeMission.type === 'checkpoint' && activeMission.checkpoints.length > 0) {
        tx = activeMission.checkpoints[0].x;
        ty = activeMission.checkpoints[0].y;
        col = '#00f0ff';
      } else if (activeMission.type === 'bounty' && activeMission.targetEntity) {
        tx = activeMission.targetEntity.x;
        ty = activeMission.targetEntity.y;
        col = '#ff1744';
      }
    } else {
      // Point to nearest ringing payphone
      let bestD = Infinity;
      for (const ph of payphones) {
        const d = Math.hypot(ph.x - player.x, ph.y - player.y);
        if (d < bestD) {
          bestD = d;
          tx = ph.x;
          ty = ph.y;
        }
      }
    }

    if (tx !== null && Math.hypot(tx - player.x, ty - player.y) > 140) {
      const ang = Math.atan2(ty - player.y, tx - player.x);
      const ax = player.x + Math.cos(ang) * 70;
      const ay = player.y + Math.sin(ang) * 70;

      ctx.save();
      ctx.translate(ax, ay);
      ctx.rotate(ang);
      ctx.fillStyle = col;
      ctx.shadowColor = col;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(12, 0);
      ctx.lineTo(-8, -8);
      ctx.lineTo(-4, 0);
      ctx.lineTo(-8, 8);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }

  // ==========================================
  // 12. MINIMAP & HUD UPDATERS
  // ==========================================
  function renderMinimap() {
    const mw = minimapCanvas.width;
    const mh = minimapCanvas.height;
    mctx.fillStyle = '#090d18';
    mctx.fillRect(0, 0, mw, mh);

    const scaleX = mw / WORLD_W;
    const scaleY = mh / WORLD_H;

    // Draw grid tiles
    for (let y = 0; y < GRID_H; y++) {
      for (let x = 0; x < GRID_W; x++) {
        const t = worldGrid[y][x];
        if (t === 1) mctx.fillStyle = '#262f45';
        else if (t === 3) mctx.fillStyle = '#b89458';
        else if (t === 4) mctx.fillStyle = '#073b5c';
        else if (t === 5) mctx.fillStyle = '#39ff14';
        else continue;
        mctx.fillRect(x * TILE_SIZE * scaleX, y * TILE_SIZE * scaleY, TILE_SIZE * scaleX, TILE_SIZE * scaleY);
      }
    }

    // Payphones (Green blips)
    mctx.fillStyle = '#39ff14';
    for (const ph of payphones) {
      mctx.fillRect(ph.x * scaleX - 2.5, ph.y * scaleY - 2.5, 5, 5);
    }

    // Active Mission Blip
    if (activeMission) {
      mctx.fillStyle = '#ffe600';
      if (activeMission.type === 'checkpoint' && activeMission.checkpoints[0]) {
        const cp = activeMission.checkpoints[0];
        mctx.fillRect(cp.x * scaleX - 3.5, cp.y * scaleY - 3.5, 7, 7);
      } else if (activeMission.type === 'bounty' && activeMission.targetEntity) {
        const te = activeMission.targetEntity;
        mctx.fillStyle = '#ff1744';
        mctx.fillRect(te.x * scaleX - 3.5, te.y * scaleY - 3.5, 7, 7);
      }
    }

    // Police units
    mctx.fillStyle = '#2979ff';
    for (const v of vehicles) {
      if (v.isPolice && v.hp > 0) {
        mctx.fillRect(v.x * scaleX - 2, v.y * scaleY - 2, 4, 4);
      }
    }

    // Player Blip
    mctx.fillStyle = '#ffffff';
    mctx.beginPath();
    mctx.arc(player.x * scaleX, player.y * scaleY, 3.5, 0, Math.PI * 2);
    mctx.fill();
  }

  function updateHUD() {
    document.getElementById('cash-display').textContent = '$' + String(Math.floor(player.cash)).padStart(8, '0');
    document.getElementById('multiplier-badge').textContent = 'x' + player.multiplier;
    document.getElementById('vehicle-name-hud').textContent = player.vehicle ? player.vehicle.name : 'ON FOOT';

    document.getElementById('health-bar').style.width = Math.max(0, player.health) + '%';
    document.getElementById('health-val').textContent = Math.max(0, Math.round(player.health));
    document.getElementById('armor-bar').style.width = Math.max(0, player.armor) + '%';
    document.getElementById('armor-val').textContent = Math.max(0, Math.round(player.armor));

    const w = WEAPONS[player.weaponIdx];
    document.getElementById('weapon-name').textContent = w.name;
    document.getElementById('weapon-ammo').textContent = player.ammo[w.id] === Infinity ? '∞' : player.ammo[w.id];

    // Respect bars
    document.getElementById('respect-syndicate').style.width = GANGS.syndicate.respect + '%';
    document.getElementById('respect-runners').style.width = GANGS.runners.respect + '%';
    document.getElementById('respect-gators').style.width = GANGS.gators.respect + '%';

    // Wanted Stars
    const wLevel = Math.floor(player.wanted);
    const stars = document.querySelectorAll('.cop-star');
    stars.forEach((star, idx) => {
      star.classList.remove('active-blue', 'active-red');
      if (idx < wLevel) {
        star.classList.add(idx % 2 === 0 ? 'active-blue' : 'active-red');
      }
    });
  }

  function updateMissionHUD() {
    const titleEl = document.getElementById('mission-title');
    const descEl = document.getElementById('mission-desc');
    const timerEl = document.getElementById('mission-timer');

    if (!activeMission) {
      titleEl.textContent = 'FREE ROAM';
      descEl.textContent = 'Walk up to a ringing green payphone to accept a gang contract, or hijack any ride!';
      timerEl.classList.add('hidden');
    } else {
      titleEl.textContent = activeMission.title;
      if (activeMission.type === 'rampage') {
        descEl.textContent = `Targets remaining: ${activeMission.killsNeeded}`;
      } else {
        descEl.textContent = activeMission.desc;
      }
      timerEl.classList.remove('hidden');
      const sec = Math.max(0, Math.ceil(activeMission.timer));
      timerEl.textContent = `00:${String(sec).padStart(2, '0')}`;
    }
  }

  // Initial HUD sync
  updateHUD();
  updateMissionHUD();
  showBanner('WELCOME TO VICE CITY 2026', '#ffe600');

  // ==========================================
  // 13. MAIN ANIMATION LOOP
  // ==========================================
  let lastTime = performance.now();
  function loop(now) {
    const dt = Math.min(0.05, (now - lastTime) / 1000);
    lastTime = now;

    update(dt);
    render();

    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
