/**
 * GTA VI: VICE OVERHEAD - High-Realism Pre-Rendered Sprite & Texture Forge
 * Generates photorealistic 2D top-down vehicle sprites, PBR-style surface textures
 * (asphalt, concrete sidewalks, architectural rooftops, brick walls, sand, water),
 * animated multi-frame character sprites, and tropical foliage onto offscreen canvases.
 */

window.SpriteForge = (() => {
  const textures = {};
  const carSprites = {};
  const charSprites = {};
  const propSprites = {};

  function createCanvas(w, h) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    return c;
  }

  // Deterministic pseudo-random for consistent procedural grain
  let seed = 1337;
  function rand() {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  }

  // ==========================================================
  // 1. REALISTIC SURFACE TEXTURES (ASPHALT, SIDEWALK, ROOFS)
  // ==========================================================
  function buildWorldTextures() {
    // 1A. Weathered Asphalt Road Texture (160x160)
    const roadC = createCanvas(160, 160);
    const rctx = roadC.getContext('2d');
    rctx.fillStyle = '#1b1e24';
    rctx.fillRect(0, 0, 160, 160);

    // Per-pixel asphalt aggregate & bitumen grain
    const imgData = rctx.getImageData(0, 0, 160, 160);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const n = (rand() - 0.5) * 22;
      const speck = rand() < 0.04 ? 18 : (rand() < 0.04 ? -14 : 0);
      data[i]     = Math.max(0, Math.min(255, 27 + n + speck));
      data[i + 1] = Math.max(0, Math.min(255, 30 + n + speck));
      data[i + 2] = Math.max(0, Math.min(255, 36 + n + speck));
      data[i + 3] = 255;
    }
    rctx.putImageData(imgData, 0, 0);

    // Subtle tire wear tracks & oil stains along lanes
    const wearGrad = rctx.createLinearGradient(0, 0, 160, 0);
    wearGrad.addColorStop(0, 'rgba(0,0,0,0.22)');
    wearGrad.addColorStop(0.25, 'rgba(0,0,0,0.06)');
    wearGrad.addColorStop(0.5, 'rgba(255,255,255,0.02)');
    wearGrad.addColorStop(0.75, 'rgba(0,0,0,0.06)');
    wearGrad.addColorStop(1, 'rgba(0,0,0,0.22)');
    rctx.fillStyle = wearGrad;
    rctx.fillRect(0, 0, 160, 160);

    // Asphalt micro-cracks
    rctx.strokeStyle = 'rgba(10, 12, 15, 0.55)';
    rctx.lineWidth = 1;
    for (let c = 0; c < 5; c++) {
      let cx = rand() * 160;
      let cy = rand() * 160;
      rctx.beginPath();
      rctx.moveTo(cx, cy);
      for (let s = 0; s < 5; s++) {
        cx += (rand() - 0.5) * 26;
        cy += (rand() - 0.5) * 26;
        rctx.lineTo(cx, cy);
      }
      rctx.stroke();
    }
    textures.asphalt = roadC;

    // 1B. Concrete Sidewalk Paving Slabs & Curb (160x160)
    const swC = createCanvas(160, 160);
    const sctx = swC.getContext('2d');
    sctx.fillStyle = '#525866';
    sctx.fillRect(0, 0, 160, 160);

    const swImg = sctx.getImageData(0, 0, 160, 160);
    for (let i = 0; i < swImg.data.length; i += 4) {
      const n = (rand() - 0.5) * 16;
      swImg.data[i]     = Math.max(0, Math.min(255, 82 + n));
      swImg.data[i + 1] = Math.max(0, Math.min(255, 88 + n));
      swImg.data[i + 2] = Math.max(0, Math.min(255, 102 + n));
      swImg.data[i + 3] = 255;
    }
    sctx.putImageData(swImg, 0, 0);

    // Paving stone grid joints
    sctx.strokeStyle = 'rgba(28, 32, 40, 0.55)';
    sctx.lineWidth = 1.5;
    for (let x = 0; x <= 160; x += 32) {
      sctx.beginPath(); sctx.moveTo(x, 0); sctx.lineTo(x, 160); sctx.stroke();
      sctx.beginPath(); sctx.moveTo(0, x); sctx.lineTo(160, x); sctx.stroke();
    }
    // Beveled concrete curb border
    sctx.strokeStyle = '#757d8f';
    sctx.lineWidth = 4;
    sctx.strokeRect(2, 2, 156, 156);
    sctx.strokeStyle = '#222630';
    sctx.lineWidth = 2;
    sctx.strokeRect(0, 0, 160, 160);
    textures.sidewalk = swC;

    // 1C. Lush Park Grass Texture (160x160)
    const grC = createCanvas(160, 160);
    const gctx = grC.getContext('2d');
    const grImg = gctx.createImageData(160, 160);
    for (let i = 0; i < grImg.data.length; i += 4) {
      const n = (rand() - 0.5) * 24;
      grImg.data[i]     = Math.max(0, Math.min(255, 28 + n * 0.6));
      grImg.data[i + 1] = Math.max(0, Math.min(255, 78 + n));
      grImg.data[i + 2] = Math.max(0, Math.min(255, 42 + n * 0.5));
      grImg.data[i + 3] = 255;
    }
    gctx.putImageData(grImg, 0, 0);
    textures.grass = grC;

    // 1D. Fine Rippled Vice Beach Sand (160x160)
    const sdC = createCanvas(160, 160);
    const sdctx = sdC.getContext('2d');
    const sdImg = sdctx.createImageData(160, 160);
    for (let y = 0; y < 160; y++) {
      for (let x = 0; x < 160; x++) {
        const idx = (y * 160 + x) * 4;
        const ripple = Math.sin(x * 0.15 + Math.sin(y * 0.08) * 3) * 6;
        const grain = (rand() - 0.5) * 18;
        sdImg.data[idx]     = Math.min(255, 208 + ripple + grain);
        sdImg.data[idx + 1] = Math.min(255, 178 + ripple + grain);
        sdImg.data[idx + 2] = Math.min(255, 126 + ripple + grain);
        sdImg.data[idx + 3] = 255;
      }
    }
    sdctx.putImageData(sdImg, 0, 0);
    textures.sand = sdC;

    // 1E. Architectural Rooftop Textures (8 distinct styles to eliminate repetition!)
    // 0: Gravel Tar + Twin HVAC & Skylight
    // 1: Luxury Hotel Rooftop Swimming Pool & Sun Loungers
    // 2: Corporate Helipad ('H' Landing Pad)
    // 3: Urban Rooftop Basketball Half-Court
    // 4: High-Tech Solar Panel Array & Transformer Bank
    // 5: Botanical Penthouse Garden Terrace
    // 6: Spanish Red Terracotta Tile Roof
    // 7: Neon Nightclub Glass Pyramid & Lounge Deck
    textures.roofs = [0, 1, 2, 3, 4, 5, 6, 7].map((styleIdx) => {
      const rc = createCanvas(128, 128);
      const ctx = rc.getContext('2d');
      const baseColors = [
        [36, 40, 50], // 0: Dark tar gravel
        [62, 54, 68], // 1: Luxury stone deck
        [32, 46, 52], // 2: Industrial steel deck
        [45, 52, 62], // 3: Asphalt court base
        [28, 36, 48], // 4: Tech slate roof
        [48, 44, 38], // 5: Garden timber/stone
        [124, 45, 32],// 6: Terracotta clay tile
        [24, 18, 38]  // 7: Nightclub dark obsidian
      ][styleIdx];

      const rImg = ctx.createImageData(128, 128);
      for (let i = 0; i < rImg.data.length; i += 4) {
        const g = (rand() - 0.5) * 20;
        rImg.data[i]     = Math.max(0, Math.min(255, baseColors[0] + g));
        rImg.data[i + 1] = Math.max(0, Math.min(255, baseColors[1] + g));
        rImg.data[i + 2] = Math.max(0, Math.min(255, baseColors[2] + g));
        rImg.data[i + 3] = 255;
      }
      ctx.putImageData(rImg, 0, 0);

      // Concrete parapet ledge with inner drop shadow
      ctx.strokeStyle = 'rgba(0,0,0,0.65)';
      ctx.lineWidth = 10;
      ctx.strokeRect(5, 5, 118, 118);

      ctx.strokeStyle = styleIdx === 6 ? '#9a3412' : '#6c7587';
      ctx.lineWidth = 6;
      ctx.strokeRect(3, 3, 122, 122);
      ctx.strokeStyle = '#8e98ab';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(1, 1, 126, 126);

      if (styleIdx === 0) {
        // Twin Industrial HVAC Units + Skylight
        drawHVACUnit(ctx, 18, 18, 34, 28);
        drawHVACUnit(ctx, 18, 52, 34, 28);
        drawSkylight(ctx, 68, 22, 40, 68);
      } else if (styleIdx === 1) {
        // Luxury Vice Hotel Swimming Pool with glowing cyan water & white sun loungers
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(16, 16, 72, 96);
        const poolGrad = ctx.createLinearGradient(20, 20, 84, 108);
        poolGrad.addColorStop(0, '#00f0ff');
        poolGrad.addColorStop(0.5, '#0ea5e9');
        poolGrad.addColorStop(1, '#0284c7');
        ctx.fillStyle = poolGrad;
        ctx.fillRect(20, 20, 64, 88);
        // Pool lane lines
        ctx.strokeStyle = 'rgba(255,255,255,0.35)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(41, 24); ctx.lineTo(41, 104);
        ctx.moveTo(63, 24); ctx.lineTo(63, 104);
        ctx.stroke();
        // Sun loungers on pool deck
        ctx.fillStyle = '#f43f5e';
        for (let ly = 24; ly <= 88; ly += 20) {
          ctx.fillRect(94, ly, 14, 10);
        }
      } else if (styleIdx === 2) {
        // Corporate Helipad 'H' Marking + HVAC
        ctx.strokeStyle = 'rgba(234, 179, 8, 0.85)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(64, 64, 38, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = 'rgba(234, 179, 8, 0.85)';
        ctx.font = 'bold 34px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('H', 64, 65);
        drawHVACUnit(ctx, 14, 14, 24, 22);
      } else if (styleIdx === 3) {
        // Rooftop Basketball Court
        ctx.fillStyle = '#1e3a8a';
        ctx.fillRect(16, 16, 96, 96);
        ctx.fillStyle = '#ea580c';
        ctx.fillRect(22, 22, 84, 84);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.8;
        ctx.strokeRect(22, 22, 84, 84);
        ctx.beginPath();
        ctx.arc(64, 64, 14, 0, Math.PI * 2);
        ctx.moveTo(22, 64); ctx.lineTo(106, 64);
        ctx.stroke();
      } else if (styleIdx === 4) {
        // Solar Panel Banks
        for (let py = 18; py <= 78; py += 28) {
          for (let px = 16; px <= 76; px += 32) {
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(px + 2, py + 2, 26, 20);
            ctx.fillStyle = '#1d4ed8';
            ctx.fillRect(px, py, 26, 20);
            ctx.strokeStyle = '#93c5fd';
            ctx.lineWidth = 1;
            ctx.strokeRect(px, py, 26, 20);
          }
        }
        drawHVACUnit(ctx, 84, 82, 26, 26);
      } else if (styleIdx === 5) {
        // Botanical Penthouse Garden with lush lawn beds & skylight
        ctx.fillStyle = '#15803d';
        ctx.fillRect(18, 18, 42, 42);
        ctx.fillRect(68, 68, 42, 42);
        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.arc(39, 39, 12, 0, Math.PI * 2);
        ctx.arc(89, 89, 12, 0, Math.PI * 2);
        ctx.fill();
        drawSkylight(ctx, 68, 18, 42, 42);
        drawHVACUnit(ctx, 18, 70, 36, 36);
      } else if (styleIdx === 6) {
        // Spanish Red Terracotta Tile Ridges
        ctx.strokeStyle = 'rgba(69, 10, 10, 0.55)';
        ctx.lineWidth = 2;
        for (let y = 14; y < 114; y += 8) {
          ctx.beginPath();
          ctx.moveTo(14, y);
          ctx.lineTo(114, y);
          ctx.stroke();
        }
        drawSkylight(ctx, 42, 42, 44, 44);
      } else {
        // Neon Nightclub Glass Pyramid & VIP Deck
        ctx.strokeStyle = '#ff2a85';
        ctx.lineWidth = 2;
        ctx.strokeRect(18, 18, 92, 92);
        const pyrGrad = ctx.createRadialGradient(64, 64, 4, 64, 64, 36);
        pyrGrad.addColorStop(0, '#ff2a85');
        pyrGrad.addColorStop(0.5, '#7e22ce');
        pyrGrad.addColorStop(1, '#090d16');
        ctx.fillStyle = pyrGrad;
        ctx.fillRect(28, 28, 72, 72);
        ctx.strokeStyle = '#00f0ff';
        ctx.beginPath();
        ctx.moveTo(28, 28); ctx.lineTo(100, 100);
        ctx.moveTo(100, 28); ctx.lineTo(28, 100);
        ctx.stroke();
      }

      return rc;
    });
  }

  function drawHVACUnit(ctx, x, y, w, h) {
    // Drop shadow
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(x + 3, y + 4, w, h);
    // Metal housing
    ctx.fillStyle = '#475569';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, w, h);

    // Circular fan grille
    const cx = x + w * 0.5;
    const cy = y + h * 0.5;
    const r = Math.min(w, h) * 0.36;
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    // Fan blades
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2;
    for (let i = 0; i < 4; i++) {
      const a = (i * Math.PI) / 2 + 0.4;
      ctx.beginPath();
      ctx.moveTo(cx - Math.cos(a) * r * 0.85, cy - Math.sin(a) * r * 0.85);
      ctx.lineTo(cx + Math.cos(a) * r * 0.85, cy + Math.sin(a) * r * 0.85);
      ctx.stroke();
    }
  }

  function drawSkylight(ctx, x, y, w, h) {
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(x + 3, y + 4, w, h);
    const grad = ctx.createLinearGradient(x, y, x + w, y + h);
    grad.addColorStop(0, '#0ea5e9');
    grad.addColorStop(0.5, '#0284c7');
    grad.addColorStop(1, '#0f172a');
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x, y, w, h);
    // Mullions
    ctx.beginPath();
    ctx.moveTo(x + w * 0.5, y); ctx.lineTo(x + w * 0.5, y + h);
    ctx.moveTo(x, y + h * 0.5); ctx.lineTo(x + w, y + h * 0.5);
    ctx.stroke();
  }

  // ==========================================================
  // 2. HIGH-DETAIL PRE-RENDERED VEHICLE SPRITES
  // ==========================================================
  function darkenHex(hex, factor) {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.max(0, Math.min(255, Math.round(((num >> 16) & 255) * factor)));
    const g = Math.max(0, Math.min(255, Math.round(((num >> 8) & 255) * factor)));
    const b = Math.max(0, Math.min(255, Math.round((num & 255) * factor)));
    return `rgb(${r},${g},${b})`;
  }

  function lightenHex(hex, add) {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.max(0, Math.min(255, ((num >> 16) & 255) + add));
    const g = Math.max(0, Math.min(255, ((num >> 8) & 255) + add));
    const b = Math.max(0, Math.min(255, (num & 255) + add));
    return `rgb(${r},${g},${b})`;
  }

  function bodyGradFor(ctx, baseCol, halfH) {
    const grad = ctx.createLinearGradient(0, -halfH, 0, halfH);
    grad.addColorStop(0, darkenHex(baseCol, 0.68));
    grad.addColorStop(0.22, lightenHex(baseCol, 38));
    grad.addColorStop(0.5, baseCol);
    grad.addColorStop(0.78, lightenHex(baseCol, 28));
    grad.addColorStop(1, darkenHex(baseCol, 0.60));
    return grad;
  }

  function getVehicleSprite(typeKey, color, damaged = false) {
    const key = `${typeKey}_${color}_${damaged ? 'dmg' : 'ok'}`;
    if (carSprites[key]) return carSprites[key];

    const isJet = typeKey === 'jet';
    const isTruck = typeKey === 'truck';
    const isBike = typeKey === 'bike';
    const isSkate = typeKey === 'skate';

    const cw = isJet ? 120 : (isTruck ? 116 : 84);
    const ch = isJet ? 104 : (isTruck ? 56 : 48);
    const c = createCanvas(cw, ch);
    const ctx = c.getContext('2d');
    ctx.translate(cw * 0.5, ch * 0.5);

    const baseCol = damaged ? '#27272a' : color;

    // ----------------------------------------------------------
    // SPECIAL SPRITE A: VCPD HYDRA VTOL FIGHTER JET
    // ----------------------------------------------------------
    if (isJet) {
      // Swept delta wings
      const wingGrad = ctx.createLinearGradient(-44, -44, 30, 44);
      wingGrad.addColorStop(0, darkenHex(baseCol, 0.7));
      wingGrad.addColorStop(0.5, lightenHex(baseCol, 28));
      wingGrad.addColorStop(1, darkenHex(baseCol, 0.6));
      ctx.fillStyle = wingGrad;
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.5;

      // Main Delta Wings
      ctx.beginPath();
      ctx.moveTo(18, 0);
      ctx.lineTo(-22, -46);
      ctx.lineTo(-34, -46);
      ctx.lineTo(-24, 0);
      ctx.lineTo(-34, 46);
      ctx.lineTo(-22, 46);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Rear horizontal stabilizers / tailfins
      ctx.fillStyle = darkenHex(baseCol, 0.65);
      ctx.beginPath();
      ctx.moveTo(-26, 0);
      ctx.lineTo(-48, -22);
      ctx.lineTo(-54, -22);
      ctx.lineTo(-42, 0);
      ctx.lineTo(-54, 22);
      ctx.lineTo(-48, 22);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Under-wing Sidewinder Missiles
      if (!damaged) {
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(-16, -34, 20, 3);
        ctx.fillRect(-16, 31, 20, 3);
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(2, -34, 4, 3);
        ctx.fillRect(2, 31, 4, 3);
      }

      // Supersonic Fuselage & Nose Cone
      ctx.fillStyle = bodyGradFor(ctx, baseCol, 18);
      ctx.beginPath();
      ctx.moveTo(54, 0);
      ctx.quadraticCurveTo(25, -11, -46, -8);
      ctx.lineTo(-50, 0);
      ctx.lineTo(-46, 8);
      ctx.quadraticCurveTo(25, 11, 54, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Twin Afterburner Exhaust Nozzles
      ctx.fillStyle = '#18181b';
      ctx.fillRect(-52, -6, 6, 4.5);
      ctx.fillRect(-52, 1.5, 6, 4.5);
      if (!damaged) {
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(-54, -5, 3, 2.5);
        ctx.fillRect(-54, 2.5, 3, 2.5);
      }

      // Gold/Cyan Tinted Bubble Canopy
      const canGrad = ctx.createLinearGradient(0, -6, 26, 6);
      canGrad.addColorStop(0, '#0284c7');
      canGrad.addColorStop(0.5, '#38bdf8');
      canGrad.addColorStop(1, '#0f172a');
      ctx.fillStyle = canGrad;
      ctx.beginPath();
      ctx.ellipse(14, 0, 15, 5.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // USAF / VCPD Wing Roundels
      if (!damaged) {
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(-18, -26, 4.5, 0, Math.PI * 2);
        ctx.arc(-18, 26, 4.5, 0, Math.PI * 2);
        ctx.fill();
      }

      carSprites[key] = c;
      return c;
    }

    // ----------------------------------------------------------
    // SPECIAL SPRITE B: LEONIDA HAULER 18-WHEELER TRUCK
    // ----------------------------------------------------------
    if (isTruck) {
      const w = 96;
      const h = 34;

      // Ambient shadow
      ctx.fillStyle = 'rgba(0,0,0,0.65)';
      ctx.fillRect(-w * 0.5 + 3, -h * 0.5 + 4, w, h);

      // 6 Heavy Dual Axles / Tires
      ctx.fillStyle = '#090a0d';
      for (const wx of [-38, -24, 10, 34]) {
        ctx.fillRect(wx - 5, -h * 0.5 - 2, 10, 4);
        ctx.fillRect(wx - 5, h * 0.5 - 2, 10, 4);
      }

      // Corrugated Aluminum Cargo Trailer (Rear section)
      const trGrad = ctx.createLinearGradient(0, -h * 0.48, 0, h * 0.48);
      trGrad.addColorStop(0, '#94a3b8');
      trGrad.addColorStop(0.5, '#f1f5f9');
      trGrad.addColorStop(1, '#64748b');
      ctx.fillStyle = damaged ? '#27272a' : trGrad;
      ctx.fillRect(-48, -16, 64, 32);
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(-48, -16, 64, 32);

      // Trailer roof ribs
      ctx.strokeStyle = 'rgba(15, 23, 42, 0.25)';
      ctx.lineWidth = 1;
      for (let rx = -42; rx <= 10; rx += 8) {
        ctx.beginPath();
        ctx.moveTo(rx, -15);
        ctx.lineTo(rx, 15);
        ctx.stroke();
      }

      // Heavy Tractor Cab (Front section)
      ctx.fillStyle = bodyGradFor(ctx, baseCol, 15);
      ctx.beginPath();
      ctx.roundRect(16, -15, 30, 30, 4);
      ctx.fill();
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Chrome Front Bullbar Grille & Dual Vertical Exhaust Stacks
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(44, -12, 3.5, 24);
      ctx.fillRect(15, -17, 4, 4);
      ctx.fillRect(15, 13, 4, 4);

      // Cab Windshield
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(24, -12, 9, 24);

      // Headlights & Taillights
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(44, -14, 3, 4);
      ctx.fillRect(44, 10, 3, 4);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(-48, -14, 3, 5);
      ctx.fillRect(-48, 9, 3, 5);

      carSprites[key] = c;
      return c;
    }

    // ----------------------------------------------------------
    // SPECIAL SPRITE C: PCJ-600 STREET SUPERBIKE (MOTORCYCLE)
    // ----------------------------------------------------------
    if (isBike) {
      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.beginPath();
      ctx.ellipse(1, 3, 21, 7, 0, 0, Math.PI * 2);
      ctx.fill();

      // Front & Rear Sport Tires
      ctx.fillStyle = '#090a0d';
      ctx.fillRect(11, -3, 10, 6);
      ctx.fillRect(-21, -3.5, 11, 7);

      // Chrome Forks & Handlebars
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(8, -9);
      ctx.lineTo(11, 0);
      ctx.lineTo(8, 9);
      ctx.stroke();

      // Aerodynamic Sport Fairing & Fuel Tank
      ctx.fillStyle = baseCol;
      ctx.beginPath();
      ctx.moveTo(16, 0);
      ctx.quadraticCurveTo(6, -8, -16, -5);
      ctx.lineTo(-19, 0);
      ctx.lineTo(-16, 5);
      ctx.quadraticCurveTo(6, 8, 16, 0);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Black Leather Saddle Seat
      ctx.fillStyle = '#18181b';
      ctx.beginPath();
      ctx.ellipse(-6, 0, 7, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Headlight & Rear LED
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(13, -2.5, 3, 5);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(-19, -2, 2.5, 4);

      carSprites[key] = c;
      return c;
    }

    // ----------------------------------------------------------
    // SPECIAL SPRITE D: NEON STREET SKATEBOARD
    // ----------------------------------------------------------
    if (isSkate) {
      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.beginPath();
      ctx.ellipse(1, 2, 15, 5.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // 4 Urethane Neon Wheels
      ctx.fillStyle = '#39ff14';
      ctx.fillRect(6, -6.5, 4, 2.5);
      ctx.fillRect(6, 4, 4, 2.5);
      ctx.fillRect(-10, -6.5, 4, 2.5);
      ctx.fillRect(-10, 4, 4, 2.5);

      // Maple Deck with Grip Tape & Neon Graphic Rails
      ctx.fillStyle = '#18181b';
      ctx.beginPath();
      ctx.roundRect(-14, -4.5, 28, 9, 4.5);
      ctx.fill();
      ctx.strokeStyle = baseCol;
      ctx.lineWidth = 1.8;
      ctx.stroke();

      // Center deck stripe
      ctx.fillStyle = baseCol;
      ctx.fillRect(-6, -1.5, 12, 3);

      carSprites[key] = c;
      return c;
    }

    const isSwat = typeKey === 'swat';
    const isPolice = typeKey === 'police';
    const isCab = typeKey === 'cab';
    const isMuscle = typeKey === 'muscle';
    const isStinger = typeKey === 'stinger';
    const isBanshee = typeKey === 'banshee';

    const w = isSwat ? 68 : 58;
    const h = isSwat ? 32 : 28;

    // 1. Soft Ambient Occlusion Drop Shadow
    const shGrad = ctx.createRadialGradient(2, 3, 6, 2, 3, w * 0.62);
    shGrad.addColorStop(0, 'rgba(0,0,0,0.75)');
    shGrad.addColorStop(0.75, 'rgba(0,0,0,0.42)');
    shGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = shGrad;
    ctx.fillRect(-w * 0.65, -h * 0.72, w * 1.3, h * 1.44);

    // 2. 4 Rubber Tires protruding slightly from wheel wells
    ctx.fillStyle = '#090a0d';
    const wheelX = w * 0.30;
    const wheelY = h * 0.48;
    ctx.fillRect(wheelX - 6, -wheelY - 2, 12, 5);
    ctx.fillRect(wheelX - 6, wheelY - 3, 12, 5);
    ctx.fillRect(-wheelX - 6, -wheelY - 2, 12, 5);
    ctx.fillRect(-wheelX - 6, wheelY - 3, 12, 5);

    // 3. Side Mirrors
    ctx.fillStyle = damaged ? '#27272a' : color;
    ctx.beginPath();
    ctx.moveTo(w * 0.14, -h * 0.48);
    ctx.lineTo(w * 0.08, -h * 0.60);
    ctx.lineTo(w * 0.04, -h * 0.48);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(w * 0.14, h * 0.48);
    ctx.lineTo(w * 0.08, h * 0.60);
    ctx.lineTo(w * 0.04, h * 0.48);
    ctx.fill();

    // 4. Sculpted Metallic Body Shell with Curved Gradient Shading
    const bodyGrad = bodyGradFor(ctx, baseCol, h * 0.5);

    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.roundRect(-w * 0.5, -h * 0.5, w, h, isSwat ? 4 : 8);
    ctx.fill();

    // Outer metallic rim & panel line
    ctx.strokeStyle = 'rgba(0,0,0,0.65)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 5. Vehicle-Specific Livery, Stripes, Hood Scoops & Vents
    if (isBanshee && !damaged) {
      // Twin Viper Racing Stripes
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.fillRect(-w * 0.48, -4.5, w * 0.96, 3);
      ctx.fillRect(-w * 0.48, 1.5, w * 0.96, 3);
    }

    if (isMuscle && !damaged) {
      // Muscle Car Supercharger / Black Hood Blower Scoop
      ctx.fillStyle = '#18181b';
      ctx.fillRect(w * 0.12, -6, 13, 12);
      ctx.strokeStyle = '#a1a1aa';
      ctx.lineWidth = 1;
      ctx.strokeRect(w * 0.12, -6, 13, 12);
    }

    if (isStinger && !damaged) {
      // Mid-engine rear louvers (Lamborghini / Ferrari style)
      ctx.fillStyle = '#111827';
      for (let lx = -w * 0.40; lx < -w * 0.18; lx += 4) {
        ctx.fillRect(lx, -h * 0.30, 2.5, h * 0.60);
      }
    }

    if (isPolice && !isSwat && !damaged) {
      // VCPD Black & White Interceptor Doors
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(-w * 0.18, -h * 0.48, w * 0.36, h * 0.96);
    }

    // Hood contour creases
    ctx.strokeStyle = 'rgba(0,0,0,0.32)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(w * 0.15, -h * 0.34);
    ctx.lineTo(w * 0.44, -h * 0.26);
    ctx.moveTo(w * 0.15, h * 0.34);
    ctx.lineTo(w * 0.44, h * 0.26);
    ctx.stroke();

    // 6. Tinted Wrap-Around Windshield, Side Windows & Rear Glass
    const glassGrad = ctx.createLinearGradient(-w * 0.25, -h * 0.4, w * 0.25, h * 0.4);
    glassGrad.addColorStop(0, '#090d16');
    glassGrad.addColorStop(0.45, '#1e293b');
    glassGrad.addColorStop(0.55, '#38bdf8'); // Specular sky glint
    glassGrad.addColorStop(0.7, '#0f172a');
    glassGrad.addColorStop(1, '#090d16');

    ctx.fillStyle = glassGrad;
    ctx.beginPath();
    ctx.roundRect(-w * 0.30, -h * 0.40, w * 0.56, h * 0.80, 4);
    ctx.fill();
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1;
    ctx.stroke();

    // 7. Cabin Roof Top & Pillars
    const roofGrad = ctx.createLinearGradient(0, -h * 0.32, 0, h * 0.32);
    roofGrad.addColorStop(0, lightenHex(baseCol, 15));
    roofGrad.addColorStop(0.5, lightenHex(baseCol, 42));
    roofGrad.addColorStop(1, baseCol);

    ctx.fillStyle = isPolice && !isSwat && !damaged ? '#f8fafc' : roofGrad;
    ctx.beginPath();
    ctx.roundRect(-w * 0.18, -h * 0.33, w * 0.32, h * 0.66, 3);
    ctx.fill();

    // Sunroof on sports cars
    if ((isBanshee || isStinger) && !damaged) {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-w * 0.04, -h * 0.22, 8, h * 0.44);
    }

    // Taxi Checkerboard & Glowing Roof Sign
    if (isCab && !damaged) {
      ctx.fillStyle = '#000000';
      for (let cx = -w * 0.35; cx <= w * 0.30; cx += 6) {
        ctx.fillRect(cx, -h * 0.49, 3, 2.5);
        ctx.fillRect(cx, h * 0.49 - 2.5, 3, 2.5);
      }
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(-4, -6, 8, 12);
      ctx.strokeStyle = '#000';
      ctx.strokeRect(-4, -6, 8, 12);
    }

    // Rear Aerodynamic Wing Spoiler for Stinger / Banshee
    if ((isStinger || isBanshee) && !damaged) {
      ctx.fillStyle = darkenHex(baseCol, 0.55);
      ctx.fillRect(-w * 0.47, -h * 0.42, 4.5, h * 0.84);
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.strokeRect(-w * 0.47, -h * 0.42, 4.5, h * 0.84);
    }

    // 8. Front Chrome Grille, Xenon Headlight Lenses & Rear LED Taillights
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(w * 0.46, -h * 0.42, 3, 6);
    ctx.fillRect(w * 0.46, h * 0.42 - 6, 3, 6);

    ctx.fillStyle = '#ef4444';
    ctx.fillRect(-w * 0.50, -h * 0.42, 3, 6.5);
    ctx.fillRect(-w * 0.50, h * 0.42 - 6.5, 3, 6.5);

    // Cracked windshield & scorch marks if damaged
    if (damaged) {
      ctx.strokeStyle = 'rgba(255,255,255,0.45)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(w * 0.16, -4);
      ctx.lineTo(w * 0.24, 5);
      ctx.lineTo(w * 0.12, 8);
      ctx.stroke();
    }

    carSprites[key] = c;
    return c;
  }

  // ==========================================================
  // 3. DETAILED ANIMATED CHARACTER SPRITES (WALK & AIM)
  // ==========================================================
  function getCharacterSprite(roleColor, skinColor, frameIdx, hasGun = true) {
    const key = `${roleColor}_${frameIdx}_${hasGun ? 1 : 0}`;
    if (charSprites[key]) return charSprites[key];

    const s = 44;
    const c = createCanvas(s, s);
    const ctx = c.getContext('2d');
    ctx.translate(s * 0.5, s * 0.5);

    const stride = Math.sin(frameIdx * (Math.PI / 2)) * 5.5;

    // 1. Soft Ground Drop Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.beginPath();
    ctx.ellipse(2, 3, 10, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Animated Walking Boots/Legs
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.roundRect(stride - 4, -8, 8, 5, 2); // Left boot
    ctx.roundRect(-stride - 4, 3, 8, 5, 2); // Right boot
    ctx.fill();

    // 3. Tailored Jacket / Torso with Shoulder Shading
    const torsoGrad = ctx.createLinearGradient(-8, -11, 8, 11);
    torsoGrad.addColorStop(0, lightenHex(roleColor, 30));
    torsoGrad.addColorStop(0.5, roleColor);
    torsoGrad.addColorStop(1, darkenHex(roleColor, 0.65));

    ctx.fillStyle = torsoGrad;
    ctx.beginPath();
    ctx.roundRect(-7, -11, 14, 22, 6);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.65)';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Jacket Collar
    ctx.fillStyle = darkenHex(roleColor, 0.5);
    ctx.beginPath();
    ctx.arc(0, 0, 6.8, 0, Math.PI * 2);
    ctx.fill();

    // 4. Arms & Gun Barrel
    if (hasGun) {
      // Right arm extended holding weapon
      ctx.fillStyle = roleColor;
      ctx.beginPath();
      ctx.roundRect(2, 3, 10, 5, 2);
      ctx.fill();
      // Hand
      ctx.fillStyle = skinColor;
      ctx.beginPath();
      ctx.arc(12, 5.5, 2.5, 0, Math.PI * 2);
      ctx.fill();
      // Gun barrel & receiver
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(11, 4, 9, 3);
      ctx.fillStyle = '#64748b';
      ctx.fillRect(12, 4.5, 7, 1.2);
    } else {
      // Swinging arms while walking
      ctx.fillStyle = roleColor;
      ctx.fillRect(-stride * 0.7 - 3, -13, 6, 4);
      ctx.fillRect(stride * 0.7 - 3, 9, 6, 4);
    }

    // 5. Head, Hair & Sunglasses
    ctx.fillStyle = skinColor;
    ctx.beginPath();
    ctx.arc(0, 0, 5.8, 0, Math.PI * 2);
    ctx.fill();

    // Hair top/back
    ctx.fillStyle = '#18181b';
    ctx.beginPath();
    ctx.arc(-1.5, 0, 5.6, Math.PI * 0.45, Math.PI * 1.55);
    ctx.fill();

    // Aviator Sunglasses
    ctx.fillStyle = '#090d16';
    ctx.fillRect(3.2, -4, 2.2, 8);

    charSprites[key] = c;
    return c;
  }

  // ==========================================================
  // 4. TROPICAL PALM TREE & STREET PROP SPRITES
  // ==========================================================
  function buildPropSprites() {
    const s = 96;
    const c = createCanvas(s, s);
    const ctx = c.getContext('2d');
    ctx.translate(s * 0.5, s * 0.5);

    // Canopy Ground Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.42)';
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2 + 0.2;
      ctx.save();
      ctx.translate(6, 8);
      ctx.rotate(a);
      ctx.beginPath();
      ctx.ellipse(18, 0, 18, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Lush Layered Palm Fronds with serrated leaf ribs
    for (let layer = 0; layer < 2; layer++) {
      const count = layer === 0 ? 7 : 6;
      const len = layer === 0 ? 36 : 27;
      for (let i = 0; i < count; i++) {
        const a = (i / count) * Math.PI * 2 + layer * 0.5;
        ctx.save();
        ctx.rotate(a);

        const grad = ctx.createLinearGradient(0, 0, len, 0);
        grad.addColorStop(0, layer === 0 ? '#14532d' : '#15803d');
        grad.addColorStop(0.6, layer === 0 ? '#166534' : '#22c55e');
        grad.addColorStop(1, '#4ade80');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(0, -2);
        ctx.quadraticCurveTo(len * 0.5, -10, len, 0);
        ctx.quadraticCurveTo(len * 0.5, 10, 0, 2);
        ctx.closePath();
        ctx.fill();

        // Central frond stem
        ctx.strokeStyle = '#86efac';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(len * 0.9, 0);
        ctx.stroke();

        ctx.restore();
      }
    }

    // Coconuts cluster & trunk crown
    ctx.fillStyle = '#451a03';
    for (let i = 0; i < 4; i++) {
      const a = i * 1.5;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * 4, Math.sin(a) * 4, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }

    propSprites.palm = c;
  }

  function init() {
    buildWorldTextures();
    buildPropSprites();
  }

  init();

  return {
    textures,
    getVehicleSprite,
    getCharacterSprite,
    propSprites
  };
})();
