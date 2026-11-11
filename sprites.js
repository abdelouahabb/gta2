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

    // 1B. Warm Portland Concrete & Limestone Sidewalk Slabs (160x160)
    const swC = createCanvas(160, 160);
    const sctx = swC.getContext('2d');
    sctx.fillStyle = '#8a8882';
    sctx.fillRect(0, 0, 160, 160);

    const swImg = sctx.getImageData(0, 0, 160, 160);
    for (let i = 0; i < swImg.data.length; i += 4) {
      const n = (rand() - 0.5) * 18;
      swImg.data[i]     = Math.max(0, Math.min(255, 138 + n));
      swImg.data[i + 1] = Math.max(0, Math.min(255, 136 + n));
      swImg.data[i + 2] = Math.max(0, Math.min(255, 129 + n));
      swImg.data[i + 3] = 255;
    }
    sctx.putImageData(swImg, 0, 0);

    // Paving stone grid joints
    sctx.strokeStyle = 'rgba(58, 56, 52, 0.45)';
    sctx.lineWidth = 1.2;
    for (let x = 0; x <= 160; x += 32) {
      sctx.beginPath(); sctx.moveTo(x, 0); sctx.lineTo(x, 160); sctx.stroke();
      sctx.beginPath(); sctx.moveTo(0, x); sctx.lineTo(160, x); sctx.stroke();
    }
    // Beveled concrete curb border
    sctx.strokeStyle = '#aba8a0';
    sctx.lineWidth = 4;
    sctx.strokeRect(2, 2, 156, 156);
    sctx.strokeStyle = '#3d3c38';
    sctx.lineWidth = 2;
    sctx.strokeRect(0, 0, 160, 160);
    textures.sidewalk = swC;

    // 1B-2. Pre-Stressed Concrete Viaduct Bridge Deck Texture (160x160)
    const brC = createCanvas(160, 160);
    const bctx = brC.getContext('2d');
    const brImg = bctx.createImageData(160, 160);
    for (let i = 0; i < brImg.data.length; i += 4) {
      const n = (rand() - 0.5) * 20;
      brImg.data[i]     = Math.max(0, Math.min(255, 64 + n));
      brImg.data[i + 1] = Math.max(0, Math.min(255, 67 + n));
      brImg.data[i + 2] = Math.max(0, Math.min(255, 72 + n));
      brImg.data[i + 3] = 255;
    }
    bctx.putImageData(brImg, 0, 0);
    // Subtle twin tire wear paths along bridge concrete
    bctx.fillStyle = 'rgba(20, 22, 25, 0.22)';
    bctx.fillRect(0, 36, 160, 28);
    bctx.fillRect(0, 96, 160, 28);
    textures.bridgeDeck = brC;

    // 1B-3. Industrial Stained Port Concrete Apron (160x160)
    const dkC = createCanvas(160, 160);
    const dctx = dkC.getContext('2d');
    const dkImg = dctx.createImageData(160, 160);
    for (let i = 0; i < dkImg.data.length; i += 4) {
      const n = (rand() - 0.5) * 22;
      dkImg.data[i]     = Math.max(0, Math.min(255, 102 + n));
      dkImg.data[i + 1] = Math.max(0, Math.min(255, 100 + n));
      dkImg.data[i + 2] = Math.max(0, Math.min(255, 95 + n));
      dkImg.data[i + 3] = 255;
    }
    dctx.putImageData(dkImg, 0, 0);
    dctx.strokeStyle = 'rgba(42, 40, 38, 0.5)';
    dctx.lineWidth = 1.5;
    dctx.strokeRect(1, 1, 158, 158);
    dctx.beginPath();
    dctx.moveTo(80, 0); dctx.lineTo(80, 160);
    dctx.moveTo(0, 80); dctx.lineTo(160, 80);
    dctx.stroke();
    textures.dockConcrete = dkC;

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

    // 1D-2. Glistening Wet Foreshore Sand & Mossy Everglades Riverbank Silt (160x160)
    const wsC = createCanvas(160, 160);
    const wsctx = wsC.getContext('2d');
    const wsImg = wsctx.createImageData(160, 160);
    for (let y = 0; y < 160; y++) {
      for (let x = 0; x < 160; x++) {
        const idx = (y * 160 + x) * 4;
        const swash = Math.sin(x * 0.12 + Math.cos(y * 0.09) * 2.5) * 5;
        const grain = (rand() - 0.5) * 12;
        wsImg.data[idx]     = Math.max(0, Math.min(255, 152 + swash + grain));
        wsImg.data[idx + 1] = Math.max(0, Math.min(255, 126 + swash + grain));
        wsImg.data[idx + 2] = Math.max(0, Math.min(255, 84 + swash + grain));
        wsImg.data[idx + 3] = 255;
      }
    }
    wsctx.putImageData(wsImg, 0, 0);
    textures.wetSand = wsC;

    // 1D-3. Dual-Layer Seamless 256x256 Procedural Water Caustics & Wave Interference Sheets
    const CAUSTIC_SZ = 256;
    const ptsA = [];
    for (let p = 0; p < 18; p++) {
      ptsA.push({ x: rand(), y: rand() });
    }
    const wcA = createCanvas(CAUSTIC_SZ, CAUSTIC_SZ);
    const wactx = wcA.getContext('2d');
    const waImg = wactx.createImageData(CAUSTIC_SZ, CAUSTIC_SZ);
    for (let y = 0; y < CAUSTIC_SZ; y++) {
      const v = y / CAUSTIC_SZ;
      for (let x = 0; x < CAUSTIC_SZ; x++) {
        const u = x / CAUSTIC_SZ;
        let d1 = 9, d2 = 9;
        for (let p = 0; p < ptsA.length; p++) {
          let dx = u - ptsA[p].x;
          let dy = v - ptsA[p].y;
          dx -= Math.round(dx);
          dy -= Math.round(dy);
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < d1) { d2 = d1; d1 = d; }
          else if (d < d2) { d2 = d; }
        }
        const ridge = Math.pow(Math.max(0, 1 - (d2 - d1) * 7.2), 3.0);
        const idx = (y * CAUSTIC_SZ + x) * 4;
        waImg.data[idx]     = 205;
        waImg.data[idx + 1] = 248;
        waImg.data[idx + 2] = 255;
        waImg.data[idx + 3] = Math.min(255, Math.round(ridge * 92));
      }
    }
    wactx.putImageData(waImg, 0, 0);
    textures.waterCausticsA = wcA;

    const wcB = createCanvas(CAUSTIC_SZ, CAUSTIC_SZ);
    const wbctx = wcB.getContext('2d');
    const wbImg = wbctx.createImageData(CAUSTIC_SZ, CAUSTIC_SZ);
    const TAU = Math.PI * 2;
    for (let y = 0; y < CAUSTIC_SZ; y++) {
      const v = y / CAUSTIC_SZ;
      for (let x = 0; x < CAUSTIC_SZ; x++) {
        const u = x / CAUSTIC_SZ;
        const w1 = Math.sin(TAU * (u * 3 + v * 1 + 0.14 * Math.sin(TAU * v * 2)));
        const w2 = Math.cos(TAU * (u * 1 - v * 4 + 0.14 * Math.cos(TAU * u * 2)));
        const crest = (w1 + w2) * 0.5; // -1..1
        const idx = (y * CAUSTIC_SZ + x) * 4;
        if (crest > 0.15) {
          wbImg.data[idx]     = 224;
          wbImg.data[idx + 1] = 246;
          wbImg.data[idx + 2] = 255;
          wbImg.data[idx + 3] = Math.round((crest - 0.15) * 64);
        } else if (crest < -0.2) {
          wbImg.data[idx]     = 4;
          wbImg.data[idx + 1] = 20;
          wbImg.data[idx + 2] = 36;
          wbImg.data[idx + 3] = Math.round((-crest - 0.2) * 58);
        }
      }
    }
    wbctx.putImageData(wbImg, 0, 0);
    textures.waterCausticsB = wcB;

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
        [58, 57, 54],  // 0: Weathered tar gravel
        [176, 166, 148],// 1: Travertine limestone resort deck
        [68, 72, 75],  // 2: Brushed concrete / steel helipad deck
        [64, 68, 72],  // 3: Urban asphalt roof deck
        [74, 78, 82],  // 4: Commercial concrete roof
        [122, 104, 82],// 5: Teak & cedar terrace deck
        [152, 62, 40], // 6: Spanish barrel terracotta clay tile
        [62, 96, 86]   // 7: Aged verdigris patinated copper roof
      ][styleIdx];

      const rImg = ctx.createImageData(128, 128);
      for (let i = 0; i < rImg.data.length; i += 4) {
        const g = (rand() - 0.5) * 18;
        rImg.data[i]     = Math.max(0, Math.min(255, baseColors[0] + g));
        rImg.data[i + 1] = Math.max(0, Math.min(255, baseColors[1] + g));
        rImg.data[i + 2] = Math.max(0, Math.min(255, baseColors[2] + g));
        rImg.data[i + 3] = 255;
      }
      ctx.putImageData(rImg, 0, 0);

      // Architectural stone/concrete coping parapet with natural shadow
      ctx.strokeStyle = 'rgba(0,0,0,0.42)';
      ctx.lineWidth = 8;
      ctx.strokeRect(5, 5, 118, 118);

      ctx.strokeStyle = styleIdx === 6 ? '#7c2d12' : (styleIdx === 7 ? '#3d6358' : '#a8a29e');
      ctx.lineWidth = 5;
      ctx.strokeRect(3, 3, 122, 122);
      ctx.strokeStyle = styleIdx === 6 ? '#c25e3c' : '#d6d3d1';
      ctx.lineWidth = 1.2;
      ctx.strokeRect(1, 1, 126, 126);

      if (styleIdx === 0) {
        // Twin Industrial HVAC Units + Skylight
        drawHVACUnit(ctx, 18, 18, 34, 28);
        drawHVACUnit(ctx, 18, 52, 34, 28);
        drawSkylight(ctx, 68, 22, 40, 68);
      } else if (styleIdx === 1) {
        // South Beach Travertine Rooftop Pool & Cream Cabanas
        ctx.fillStyle = '#e7e0d3';
        ctx.fillRect(16, 16, 72, 96);
        const poolGrad = ctx.createLinearGradient(20, 20, 84, 108);
        poolGrad.addColorStop(0, '#38b2ac');
        poolGrad.addColorStop(0.5, '#2c7a7b');
        poolGrad.addColorStop(1, '#1d5e63');
        ctx.fillStyle = poolGrad;
        ctx.fillRect(20, 20, 64, 88);
        ctx.strokeStyle = 'rgba(255,255,255,0.28)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(41, 24); ctx.lineTo(41, 104);
        ctx.moveTo(63, 24); ctx.lineTo(63, 104);
        ctx.stroke();
        // Cream & terracotta sun loungers on travertine deck
        ctx.fillStyle = '#f5f0e6';
        for (let ly = 24; ly <= 88; ly += 20) {
          ctx.fillRect(94, ly, 14, 9);
          ctx.fillStyle = '#c25e3c';
          ctx.fillRect(94, ly, 4, 9);
          ctx.fillStyle = '#f5f0e6';
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
        // Rooftop Tennis / Basketball Court (Muted Architectural Clay & Forest Green)
        ctx.fillStyle = '#2d5a43';
        ctx.fillRect(16, 16, 96, 96);
        ctx.fillStyle = '#9e4733';
        ctx.fillRect(24, 24, 80, 80);
        ctx.strokeStyle = 'rgba(245, 245, 240, 0.85)';
        ctx.lineWidth = 1.6;
        ctx.strokeRect(24, 24, 80, 80);
        ctx.beginPath();
        ctx.arc(64, 64, 13, 0, Math.PI * 2);
        ctx.moveTo(24, 64); ctx.lineTo(104, 64);
        ctx.stroke();
      } else if (styleIdx === 4) {
        // Photovoltaic Solar Array on Light Concrete Roof
        for (let py = 18; py <= 78; py += 28) {
          for (let px = 16; px <= 76; px += 32) {
            ctx.fillStyle = 'rgba(0,0,0,0.35)';
            ctx.fillRect(px + 2, py + 2, 26, 20);
            ctx.fillStyle = '#1e3246';
            ctx.fillRect(px, py, 26, 20);
            ctx.strokeStyle = '#94a3b8';
            ctx.lineWidth = 1;
            ctx.strokeRect(px, py, 26, 20);
          }
        }
        drawHVACUnit(ctx, 84, 82, 26, 26);
      } else if (styleIdx === 5) {
        // Landscaped Penthouse Terrace with Cedar Decking & Planters
        ctx.fillStyle = '#365e3d';
        ctx.fillRect(18, 18, 42, 42);
        ctx.fillRect(68, 68, 42, 42);
        ctx.fillStyle = '#4d7c53';
        ctx.beginPath();
        ctx.arc(39, 39, 12, 0, Math.PI * 2);
        ctx.arc(89, 89, 12, 0, Math.PI * 2);
        ctx.fill();
        drawSkylight(ctx, 68, 18, 42, 42);
        drawHVACUnit(ctx, 18, 70, 36, 36);
      } else if (styleIdx === 6) {
        // Spanish Red Terracotta Hipped Tile Ridges
        ctx.strokeStyle = 'rgba(69, 18, 10, 0.45)';
        ctx.lineWidth = 2;
        for (let y = 14; y < 114; y += 7) {
          ctx.beginPath();
          ctx.moveTo(14, y);
          ctx.lineTo(114, y);
          ctx.stroke();
        }
        // Hip roof diagonal ridge caps
        ctx.strokeStyle = '#c96a48';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(8, 8); ctx.lineTo(44, 44);
        ctx.moveTo(120, 8); ctx.lineTo(84, 44);
        ctx.moveTo(8, 120); ctx.lineTo(44, 84);
        ctx.moveTo(120, 120); ctx.lineTo(84, 84);
        ctx.strokeRect(44, 44, 40, 40);
        ctx.stroke();
      } else {
        // Standing-Seam Patinated Copper Mansard & Glass Atrium Skylight
        ctx.strokeStyle = 'rgba(30, 52, 46, 0.55)';
        ctx.lineWidth = 1.5;
        for (let x = 14; x < 114; x += 9) {
          ctx.beginPath(); ctx.moveTo(x, 12); ctx.lineTo(x, 116); ctx.stroke();
        }
        drawSkylight(ctx, 32, 32, 64, 64);
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

  function applyCharredWreckOverlay(c, typeKey) {
    const ctx = c.getContext('2d');
    const cw = c.width;
    const ch = c.height;
    ctx.save();
    ctx.translate(cw * 0.5, ch * 0.5);
    // Clip all scorch burns, soot & structural fractures strictly to the vehicle/aircraft alpha silhouette!
    ctx.globalCompositeOperation = 'source-atop';

    // 1. Deep charred carbon-black soot wash across hull/wings
    ctx.fillStyle = 'rgba(9, 9, 11, 0.56)';
    ctx.fillRect(-cw * 0.5, -ch * 0.5, cw, ch);

    // 2. Localized explosion burn craters & ash-gray oxidation rings
    const isAirliner = typeKey === 'airliner';
    const isJet = typeKey === 'jet';
    const burnSpots = isAirliner
      ? [[18, 0, 74], [-42, -96, 58], [-38, 102, 62], [95, -8, 46], [-118, 6, 52]]
      : (isJet
        ? [[8, 0, 44], [-28, -42, 34], [-28, 42, 34]]
        : [[6, -3, 24], [-14, 4, 20]]);

    for (const [bx, by, br] of burnSpots) {
      const bGrad = ctx.createRadialGradient(bx, by, br * 0.12, bx, by, br);
      bGrad.addColorStop(0, 'rgba(5, 5, 7, 0.92)');
      bGrad.addColorStop(0.45, 'rgba(28, 25, 23, 0.78)');
      bGrad.addColorStop(0.78, 'rgba(120, 53, 15, 0.34)');
      bGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = bGrad;
      ctx.beginPath();
      ctx.arc(bx, by, br, 0, Math.PI * 2);
      ctx.fill();
    }

    // 3. Jagged buckled-metal hull/fuselage fracture seams & glowing ember fissures
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.88)';
    ctx.lineWidth = isAirliner ? 3.2 : 1.9;
    const spanX = isAirliner ? 155 : (isJet ? 68 : cw * 0.30);
    const spanY = isAirliner ? 135 : (isJet ? 52 : ch * 0.26);
    ctx.beginPath();
    ctx.moveTo(-spanX * 0.65, -spanY * 0.22);
    ctx.lineTo(-spanX * 0.15, spanY * 0.16);
    ctx.lineTo(spanX * 0.24, -spanY * 0.18);
    ctx.lineTo(spanX * 0.62, spanY * 0.12);
    if (isAirliner || isJet) {
      ctx.moveTo(-18, -spanY * 0.88);
      ctx.lineTo(6, -12);
      ctx.lineTo(-24, spanY * 0.88);
    }
    ctx.stroke();

    ctx.strokeStyle = 'rgba(234, 88, 12, 0.42)';
    ctx.lineWidth = isAirliner ? 1.4 : 0.9;
    ctx.stroke();

    ctx.restore();
    c.isWreckSprite = true;
    return c;
  }

  function getVehicleSprite(typeKey, color, damaged = false, wrecked = false) {
    if (wrecked) {
      const wreckKey = `${typeKey}_${color}_wreck`;
      if (carSprites[wreckKey]) return carSprites[wreckKey];
      const baseDmg = getVehicleSprite(typeKey, color, true, false);
      const wc = createCanvas(baseDmg.width, baseDmg.height);
      const wctx = wc.getContext('2d');
      wctx.drawImage(baseDmg, 0, 0);
      applyCharredWreckOverlay(wc, typeKey);
      carSprites[wreckKey] = wc;
      return wc;
    }

    const key = `${typeKey}_${color}_${damaged ? 'dmg' : 'ok'}`;
    if (carSprites[key]) return carSprites[key];

    const isJet = typeKey === 'jet';
    const isAirliner = typeKey === 'airliner';
    const isTruck = typeKey === 'truck';
    const isBike = typeKey === 'bike';
    const isSkate = typeKey === 'skate';
    const isTank = typeKey === 'tank';
    const isBoat = typeKey === 'boat';
    const isHyper = typeKey === 'hyper';
    const isHeli = typeKey === 'heli' || typeKey === 'falcon';
    const isFalcon = typeKey === 'falcon';

    const cw = isAirliner ? 468 : (isJet ? 224 : (isTruck ? 116 : (isBoat ? 108 : (isTank ? 96 : (isHeli ? 136 : 88)))));
    const ch = isAirliner ? 440 : (isJet ? 192 : (isTruck ? 56 : (isBoat ? 48 : (isTank ? 58 : (isHeli ? 86 : 48)))));
    const c = createCanvas(cw, ch);
    const ctx = c.getContext('2d');
    ctx.translate(cw * 0.5, ch * 0.5);

    const baseCol = damaged ? '#27272a' : color;

    // ----------------------------------------------------------
    // SPECIAL SPRITE A0: CARBON X-2027 CONCEPT HYPERCAR
    // ----------------------------------------------------------
    if (isHyper) {
      const w = 62;
      const h = 30;
      // Soft underglow + ambient shadow
      const glowGrad = ctx.createRadialGradient(0, 0, 6, 0, 0, w * 0.65);
      glowGrad.addColorStop(0, damaged ? 'rgba(0,0,0,0.75)' : 'rgba(0, 240, 255, 0.42)');
      glowGrad.addColorStop(0.7, 'rgba(0,0,0,0.45)');
      glowGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = glowGrad;
      ctx.fillRect(-w * 0.68, -h * 0.8, w * 1.36, h * 1.6);

      // Wide Low-Profile Slicks
      ctx.fillStyle = '#090a0d';
      for (const wx of [-19, 19]) {
        ctx.fillRect(wx - 6, -h * 0.52, 12, 4.5);
        ctx.fillRect(wx - 6, h * 0.52 - 4.5, 12, 4.5);
      }

      // Sculpted Carbon-Weave Le-Mans Prototype Body
      const hGrad = ctx.createLinearGradient(-w * 0.5, -h * 0.5, w * 0.5, h * 0.5);
      hGrad.addColorStop(0, '#0f172a');
      hGrad.addColorStop(0.35, damaged ? '#27272a' : baseCol);
      hGrad.addColorStop(0.55, '#1e293b');
      hGrad.addColorStop(1, '#090d16');
      ctx.fillStyle = hGrad;

      ctx.beginPath();
      ctx.moveTo(w * 0.52, 0);
      ctx.quadraticCurveTo(w * 0.46, -h * 0.5, w * 0.14, -h * 0.48);
      ctx.lineTo(-w * 0.22, -h * 0.42);
      ctx.lineTo(-w * 0.5, -h * 0.48);
      ctx.lineTo(-w * 0.46, 0);
      ctx.lineTo(-w * 0.5, h * 0.48);
      ctx.lineTo(-w * 0.22, h * 0.42);
      ctx.lineTo(w * 0.14, h * 0.48);
      ctx.quadraticCurveTo(w * 0.46, h * 0.5, w * 0.52, 0);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = damaged ? '#3f3f46' : '#00f0ff';
      ctx.lineWidth = 1.4;
      ctx.stroke();

      // Teardrop Fighter-Style Glass Cockpit
      const cGrad = ctx.createLinearGradient(-8, -9, 14, 9);
      cGrad.addColorStop(0, '#020617');
      cGrad.addColorStop(0.5, '#0284c7');
      cGrad.addColorStop(1, '#0f172a');
      ctx.fillStyle = cGrad;
      ctx.beginPath();
      ctx.ellipse(3, 0, 15, 8.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Exposed Glowing Cyan Fusion Core in Rear Mid-Engine Bay
      if (!damaged) {
        ctx.fillStyle = '#00f0ff';
        ctx.fillRect(-20, -3.5, 9, 7);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-18, -1.5, 5, 3);
        // Laser Blade Headlights & Rear Plasma Diffuser
        ctx.fillStyle = '#00f0ff';
        ctx.fillRect(w * 0.40, -11, 5, 2.5);
        ctx.fillRect(w * 0.40, 8.5, 5, 2.5);
        ctx.fillStyle = '#ff2a85';
        ctx.fillRect(-w * 0.49, -12, 3, 24);
      }

      carSprites[key] = c;
      return c;
    }

    // ----------------------------------------------------------
    // SPECIAL SPRITE A1: RHINO M1A3 MAIN BATTLE TANK (HULL)
    // ----------------------------------------------------------
    if (isTank) {
      const w = 78;
      const h = 44;
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(-w * 0.5 + 3, -h * 0.5 + 4, w, h);

      // Heavy Steel Armored Treads (Left & Right)
      ctx.fillStyle = '#18181b';
      ctx.fillRect(-w * 0.5, -h * 0.5, w, 9);
      ctx.fillRect(-w * 0.5, h * 0.5 - 9, w, 9);
      ctx.strokeStyle = '#3f3f46';
      ctx.lineWidth = 1.2;
      for (let tx = -w * 0.48; tx <= w * 0.46; tx += 6) {
        ctx.beginPath();
        ctx.moveTo(tx, -h * 0.5); ctx.lineTo(tx, -h * 0.5 + 9);
        ctx.moveTo(tx, h * 0.5 - 9); ctx.lineTo(tx, h * 0.5);
        ctx.stroke();
      }

      // Composite Chobham Armor Hull
      const hullCol = damaged ? '#27272a' : baseCol;
      ctx.fillStyle = bodyGradFor(ctx, hullCol, 16);
      ctx.beginPath();
      ctx.roundRect(-w * 0.46, -h * 0.34, w * 0.92, h * 0.68, 4);
      ctx.fill();
      ctx.strokeStyle = '#090d16';
      ctx.lineWidth = 1.8;
      ctx.stroke();

      // Rear Engine Exhaust Louvers & Reactive Armor Panels
      ctx.fillStyle = '#0f172a';
      for (let lx = -32; lx <= -18; lx += 4.5) {
        ctx.fillRect(lx, -10, 2.5, 20);
      }
      if (!damaged) {
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(w * 0.43, -12, 3, 4);
        ctx.fillRect(w * 0.43, 8, 3, 4);
      }

      carSprites[key] = c;
      return c;
    }

    // ----------------------------------------------------------
    // SPECIAL SPRITE A2: MIAMI VIPER CIGARETTE SPEEDBOAT
    // ----------------------------------------------------------
    if (isBoat) {
      const w = 88;
      const h = 30;
      // Sleek V-Hull Fiberglass Shell
      ctx.fillStyle = bodyGradFor(ctx, baseCol, 15);
      ctx.beginPath();
      ctx.moveTo(w * 0.52, 0);
      ctx.quadraticCurveTo(w * 0.18, -h * 0.52, -w * 0.44, -h * 0.44);
      ctx.lineTo(-w * 0.46, h * 0.44);
      ctx.quadraticCurveTo(w * 0.18, h * 0.52, w * 0.52, 0);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#f8fafc';
      ctx.lineWidth = 1.8;
      ctx.stroke();

      // Luxury Teakwood Rear Deck & White Leather Sunpad
      if (!damaged) {
        ctx.fillStyle = '#92400e';
        ctx.fillRect(-36, -10, 20, 20);
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(-16, -9, 14, 18);
        // Racing Foredeck Stripe
        ctx.fillStyle = '#00f0ff';
        ctx.fillRect(8, -2.5, 28, 5);
      }

      // Wrap-around Marine Tinted Windshield
      ctx.fillStyle = '#0284c7';
      ctx.beginPath();
      ctx.moveTo(10, 0);
      ctx.lineTo(-2, -11);
      ctx.lineTo(-8, -10);
      ctx.lineTo(2, 0);
      ctx.lineTo(-8, 10);
      ctx.lineTo(-2, 11);
      ctx.closePath();
      ctx.fill();

      // Twin Outboard V8 Marine Motors
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-45, -9, 7, 6);
      ctx.fillRect(-45, 3, 7, 6);

      carSprites[key] = c;
      return c;
    }

    // ----------------------------------------------------------
    // SPECIAL SPRITE A3: VCPD MAVERICK & FALCON GUNSHIP HELICOPTER (1.28x REAL SCALE)
    // ----------------------------------------------------------
    if (isHeli) {
      ctx.save();
      ctx.scale(1.28, 1.28);

      // Landing Skids & Struts
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(-12, -16); ctx.lineTo(22, -16);
      ctx.moveTo(-12, 16);  ctx.lineTo(22, 16);
      ctx.moveTo(0, -16);   ctx.lineTo(0, -10);
      ctx.moveTo(0, 16);    ctx.lineTo(0, 10);
      ctx.stroke();

      // Stub-Wing Hydra-70 Rocket Pods on Falcon Gunship!
      if (isFalcon) {
        ctx.fillStyle = damaged ? '#27272a' : darkenHex(baseCol, 0.72);
        ctx.fillRect(-4, -22, 14, 20);
        ctx.fillRect(-4, 2, 14, 20);
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(4, -24, 12, 5);
        ctx.fillRect(4, 19, 12, 5);
        if (!damaged) {
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(15, -23.5, 2.5, 4);
          ctx.fillRect(15, 19.5, 2.5, 4);
        }
      }

      // Tail Boom & Rear Stabilizer + Tail Rotor Fin
      ctx.fillStyle = isFalcon ? (damaged ? '#27272a' : darkenHex(baseCol, 0.75)) : '#0f172a';
      ctx.fillRect(-46, -3.5, 36, 7);
      ctx.fillStyle = isFalcon ? '#eab308' : '#f8fafc';
      ctx.fillRect(-48, -12, 5, 24);

      // Fuselage Cabin
      ctx.fillStyle = damaged ? '#27272a' : (isFalcon ? bodyGradFor(ctx, baseCol, 14) : '#111827');
      ctx.beginPath();
      ctx.ellipse(6, 0, 24, 13, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = isFalcon ? '#0f172a' : '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Roof Cowling, Twin Turbine Intakes & Aerodynamic Bubble Glass Nose
      if (!damaged) {
        ctx.fillStyle = isFalcon ? lightenHex(baseCol, 26) : '#f8fafc';
        ctx.beginPath();
        ctx.ellipse(2, 0, 12, 9, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(-6, -6.5, 6, 3);
        ctx.fillRect(-6, 3.5, 6, 3);
        ctx.fillStyle = isFalcon ? '#0ea5e9' : '#0284c7';
        ctx.beginPath();
        ctx.ellipse(19, 0, 9, 10, 0, -Math.PI * 0.5, Math.PI * 0.5);
        ctx.fill();
      }
      // Central Titanium Rotor Mast Collar (Blades drawn dynamically in game.js based on physical rotorRPM!)
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.arc(2, 0, 4.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.restore();
      carSprites[key] = c;
      return c;
    }

    // ----------------------------------------------------------
    // SPECIAL SPRITE A: VCPD HYDRA VTOL SUPERSONIC FIGHTER JET (224x192 REAL SCALE)
    // ----------------------------------------------------------
    if (isJet) {
      const wingGrad = ctx.createLinearGradient(-84, -76, 56, 76);
      wingGrad.addColorStop(0, darkenHex(baseCol, 0.68));
      wingGrad.addColorStop(0.5, lightenHex(baseCol, 30));
      wingGrad.addColorStop(1, darkenHex(baseCol, 0.58));
      ctx.fillStyle = wingGrad;
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2.0;

      // Swept Trapezoidal-Delta Main Wings (Span: 148px!)
      ctx.beginPath();
      ctx.moveTo(32, 0);
      ctx.lineTo(-34, -74);
      ctx.lineTo(-56, -74);
      ctx.lineTo(-42, 0);
      ctx.lineTo(-56, 74);
      ctx.lineTo(-34, 74);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Wing Control Aileron & Flap Seams
      ctx.strokeStyle = 'rgba(15, 23, 42, 0.45)';
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(-46, -68); ctx.lineTo(-38, -22);
      ctx.moveTo(-46, 68);  ctx.lineTo(-38, 22);
      ctx.stroke();

      // Rear Swept Stabilators
      ctx.fillStyle = darkenHex(baseCol, 0.64);
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(-50, 0);
      ctx.lineTo(-86, -38);
      ctx.lineTo(-98, -36);
      ctx.lineTo(-78, 0);
      ctx.lineTo(-98, 36);
      ctx.lineTo(-86, 38);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Under-Wing AIM-9X Sidewinder & AGM Ordnance Pylons (4 Missiles)
      if (!damaged) {
        for (const my of [-62, -42, 42, 62]) {
          const len = Math.abs(my) > 50 ? 32 : 38;
          ctx.fillStyle = '#f8fafc';
          ctx.fillRect(-30, my - 2, len, 4);
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(-30 + len - 6, my - 2, 6, 4);
          ctx.fillStyle = '#334155';
          ctx.fillRect(-28, my - 3.5, 5, 7);
        }
      }

      // Twin Diverterless Supersonic Inlet Nacelles
      ctx.fillStyle = darkenHex(baseCol, 0.76);
      ctx.fillRect(-62, -19, 82, 38);
      ctx.fillStyle = '#090d16';
      ctx.fillRect(18, -18, 6, 9);
      ctx.fillRect(18, 9, 6, 9);

      // Chined Stealth Supersonic Fuselage & Radome Nose Cone (Length: 198px!)
      ctx.fillStyle = bodyGradFor(ctx, baseCol, 22);
      ctx.beginPath();
      ctx.moveTo(98, 0);
      ctx.quadraticCurveTo(54, -17, -84, -14);
      ctx.lineTo(-94, 0);
      ctx.lineTo(-84, 14);
      ctx.quadraticCurveTo(54, 17, 98, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Dark Radar Nose Cone & Pitot Boom
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.moveTo(98, 0);
      ctx.lineTo(72, -7.5);
      ctx.lineTo(72, 7.5);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(98, 0); ctx.lineTo(105, 0);
      ctx.stroke();

      // Twin Canted Vertical Stabilizer Tailfins
      ctx.fillStyle = darkenHex(baseCol, 0.56);
      ctx.fillRect(-88, -16, 32, 4.5);
      ctx.fillRect(-88, 11.5, 32, 4.5);

      // Twin Vectoring Afterburner Exhaust Nozzles
      ctx.fillStyle = '#18181b';
      ctx.fillRect(-98, -12, 11, 8.5);
      ctx.fillRect(-98, 3.5, 11, 8.5);
      if (!damaged) {
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(-101, -10, 5, 4.5);
        ctx.fillRect(-101, 5.5, 5, 4.5);
      }

      // Gold-Iridium Tinted Bubble Fighter Canopy
      const canGrad = ctx.createLinearGradient(8, -10, 54, 10);
      canGrad.addColorStop(0, '#0369a1');
      canGrad.addColorStop(0.45, '#38bdf8');
      canGrad.addColorStop(0.75, '#eab308');
      canGrad.addColorStop(1, '#0f172a');
      ctx.fillStyle = canGrad;
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.ellipse(32, 0, 25, 8.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // VCPD / Air Guard Low-Vis Tactical Roundels
      if (!damaged) {
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(-32, -46, 6.5, 0, Math.PI * 2);
        ctx.arc(-32, 46, 6.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(-32, -46, 3.0, 0, Math.PI * 2);
        ctx.arc(-32, 46, 3.0, 0, Math.PI * 2);
        ctx.fill();
      }

      carSprites[key] = c;
      return c;
    }

    // ----------------------------------------------------------
    // SPECIAL SPRITE A4: LEONIDA AIRWAYS 747-8 COLOSSAL WIDEBODY JUMBO JET (468x440 REAL CITY-BLOCK SCALE!)
    // ----------------------------------------------------------
    if (isAirliner) {
      const livCol = damaged ? '#3f3f46' : (baseCol || '#0284c7');

      // 1. 4 Under-Wing High-Bypass GEnx Turbofan Engine Nacelles & Pylons (Inboard y=±68, Outboard y=±132)
      for (const ey of [-132, -68, 68, 132]) {
        const isOutboard = Math.abs(ey) > 100;
        const ex = isOutboard ? -22 : 12;
        const ew = isOutboard ? 36 : 42;
        const eh = isOutboard ? 15 : 18;
        // Engine pylon strut
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(ex - 8, ey - 3.5, 18, 7);
        // Dark exhaust cone
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.ellipse(ex - 6, ey, 8, eh * 0.36, 0, 0, Math.PI * 2);
        ctx.fill();
        // Cowling nacelle barrel
        const eGrad = ctx.createLinearGradient(ex, ey - eh * 0.5, ex, ey + eh * 0.5);
        eGrad.addColorStop(0, damaged ? '#3f3f46' : '#e2e8f0');
        eGrad.addColorStop(0.45, damaged ? '#52525b' : '#ffffff');
        eGrad.addColorStop(1, damaged ? '#27272a' : '#94a3b8');
        ctx.fillStyle = eGrad;
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(ex, ey - eh * 0.5, ew, eh, 5);
        ctx.fill();
        ctx.stroke();
        // Livery accent ring + titanium intake lip + fan spinner
        if (!damaged) {
          ctx.fillStyle = livCol;
          ctx.fillRect(ex + 8, ey - eh * 0.48, 5, eh * 0.96);
        }
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(ex + ew - 4, ey - eh * 0.46, 4, eh * 0.92);
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(ex + ew - 1.5, ey - eh * 0.36, 2.5, eh * 0.72);
      }

      // 2. Monumental Swept High-Aspect Widebody Wings (Total Wingspan: 380px — wider than 2.3 city blocks!)
      const wGrad = ctx.createLinearGradient(-85, -190, 48, 190);
      wGrad.addColorStop(0, damaged ? '#3f3f46' : '#cbd5e1');
      wGrad.addColorStop(0.48, damaged ? '#52525b' : '#f8fafc');
      wGrad.addColorStop(1, damaged ? '#27272a' : '#94a3b8');
      ctx.fillStyle = wGrad;
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2.2;

      ctx.beginPath();
      ctx.moveTo(52, 0);
      ctx.lineTo(38, -22);
      ctx.lineTo(-68, -188);
      ctx.lineTo(-92, -190); // Raked 747-8 Winglet Tip
      ctx.lineTo(-86, -168);
      ctx.lineTo(-34, -22);
      ctx.lineTo(-34, 22);
      ctx.lineTo(-86, 168);
      ctx.lineTo(-92, 190);  // Raked 747-8 Winglet Tip
      ctx.lineTo(-68, 188);
      ctx.lineTo(38, 22);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Colored Raked Winglet Tips & Flap-Track Fairing Canoes
      if (!damaged) {
        ctx.fillStyle = livCol;
        ctx.beginPath();
        ctx.moveTo(-68, -188); ctx.lineTo(-92, -190); ctx.lineTo(-88, -176); ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(-68, 188);  ctx.lineTo(-92, 190);  ctx.lineTo(-88, 176);  ctx.closePath();
        ctx.fill();
      }
      ctx.fillStyle = damaged ? '#27272a' : '#94a3b8';
      for (const fy of [-148, -112, -82, -48, 48, 82, 112, 148]) {
        const fx = -24 - Math.abs(fy) * 0.34;
        ctx.fillRect(fx - 14, fy - 2, 18, 4);
      }
      // Wing Spoiler / Slat Panel Seams
      ctx.strokeStyle = 'rgba(51, 65, 85, 0.45)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(26, -26); ctx.lineTo(-66, -176);
      ctx.moveTo(-26, -26); ctx.lineTo(-78, -166);
      ctx.moveTo(26, 26);  ctx.lineTo(-66, 176);
      ctx.moveTo(-26, 26);  ctx.lineTo(-78, 166);
      ctx.stroke();

      // 3. Swept Horizontal Tailplane Stabilizers (Span: 146px)
      ctx.fillStyle = damaged ? '#3f3f46' : '#cbd5e1';
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.moveTo(-132, 0);
      ctx.lineTo(-186, -73);
      ctx.lineTo(-204, -71);
      ctx.lineTo(-174, 0);
      ctx.lineTo(-204, 71);
      ctx.lineTo(-186, 73);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // 4. Colossal Widebody 747-8 Fuselage Barrel (Length: 406px, Width: 42px — dwarfs trucks & cars!)
      // Subtle ambient drop shadow under wing-root belly fairing
      ctx.fillStyle = 'rgba(15, 23, 42, 0.22)';
      ctx.beginPath();
      ctx.ellipse(2, 0, 56, 26, 0, 0, Math.PI * 2);
      ctx.fill();

      const fGrad = ctx.createLinearGradient(0, -22, 0, 22);
      fGrad.addColorStop(0, damaged ? '#3f3f46' : '#cbd5e1');
      fGrad.addColorStop(0.32, damaged ? '#52525b' : '#f8fafc');
      fGrad.addColorStop(0.55, damaged ? '#71717a' : '#ffffff');
      fGrad.addColorStop(1, damaged ? '#27272a' : '#94a3b8');
      ctx.fillStyle = fGrad;
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2.2;

      ctx.beginPath();
      ctx.moveTo(204, 0); // Nose Radome Tip
      ctx.quadraticCurveTo(188, -21, 126, -21);
      ctx.lineTo(-124, -20);
      ctx.quadraticCurveTo(-176, -17, -202, -3.5); // APU Tail Cone
      ctx.lineTo(-202, 3.5);
      ctx.quadraticCurveTo(-176, 17, -124, 20);
      ctx.lineTo(126, 21);
      ctx.quadraticCurveTo(188, 21, 204, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Iconic 747-8 Forward Upper-Deck Hump Contour & Dorsal Spine
      if (!damaged) {
        const humpGrad = ctx.createLinearGradient(0, -14, 0, 14);
        humpGrad.addColorStop(0, '#e2e8f0');
        humpGrad.addColorStop(0.5, '#ffffff');
        humpGrad.addColorStop(1, '#cbd5e1');
        ctx.fillStyle = humpGrad;
        ctx.strokeStyle = 'rgba(100, 116, 139, 0.55)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(176, 0);
        ctx.quadraticCurveTo(158, -13.5, 110, -13.5);
        ctx.lineTo(28, -11);
        ctx.quadraticCurveTo(4, -8, -8, 0);
        ctx.quadraticCurveTo(4, 8, 28, 11);
        ctx.lineTo(110, 13.5);
        ctx.quadraticCurveTo(158, 13.5, 176, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Leonida Airways Dual Livery Cheatlines + Tail Fin Dorsal Rudder
        ctx.fillStyle = livCol;
        ctx.fillRect(-168, -18.5, 316, 3.2);
        ctx.fillRect(-168, 15.3, 316, 3.2);
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(-158, -15.3, 298, 1.6);
        ctx.fillRect(-158, 13.7, 298, 1.6);

        // Passenger Cabin Windows (Illuminated Golden/Sky Port & Starboard Rows!)
        ctx.fillStyle = '#0f172a';
        for (let wx = -146; wx <= 146; wx += 8.5) {
          // Skip main passenger door cutouts
          if (Math.abs(wx - 118) < 5 || Math.abs(wx - 44) < 5 || Math.abs(wx + 48) < 5 || Math.abs(wx + 126) < 5) continue;
          ctx.fillRect(wx, -19.8, 4.2, 2.0);
          ctx.fillRect(wx, 17.8, 4.2, 2.0);
        }
        // Passenger Boarding Door Outlines
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 1.1;
        for (const dx of [-126, -48, 44, 118]) {
          ctx.strokeRect(dx - 3, -19.5, 6, 4.5);
          ctx.strokeRect(dx - 3, 15.0, 6, 4.5);
        }

        // Wrap-Around Multi-Pane 747 Flight-Deck Cockpit Windshield
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.moveTo(175, 0);
        ctx.quadraticCurveTo(169, -10.5, 156, -11.5);
        ctx.lineTo(161, -5.2);
        ctx.lineTo(165, 0);
        ctx.lineTo(161, 5.2);
        ctx.lineTo(156, 11.5);
        ctx.quadraticCurveTo(169, 10.5, 175, 0);
        ctx.closePath();
        ctx.fill();

        // Nose Radome Weather Radar Cap & Dorsal SATCOM Antenna Dome
        ctx.fillStyle = '#e2e8f0';
        ctx.beginPath();
        ctx.moveTo(204, 0);
        ctx.quadraticCurveTo(198, -7.5, 190, -9);
        ctx.lineTo(190, 9);
        ctx.quadraticCurveTo(198, 7.5, 204, 0);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#f8fafc';
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.ellipse(-28, 0, 12, 5.2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }

      // Monumental Tall Vertical Tail Fin & Rudder Spine
      ctx.fillStyle = damaged ? '#27272a' : livCol;
      ctx.beginPath();
      ctx.roundRect(-200, -3.8, 66, 7.6, 3);
      ctx.fill();
      if (!damaged) {
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(-194, -1.6, 44, 3.2);
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
    const isSuv = typeKey === 'suv';
    const isSedan = typeKey === 'sedan';

    const w = isSwat ? 68 : (isSuv ? 64 : (isSedan ? 56 : 58));
    const h = isSwat ? 32 : (isSuv ? 30 : 28);

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
    ctx.roundRect(isSuv ? -w * 0.40 : -w * 0.18, -h * 0.33, isSuv ? w * 0.56 : w * 0.32, h * 0.66, 3);
    ctx.fill();

    // Brushed aluminum roof-rack rails & panoramic cargo sunroof on SUV
    if (isSuv && !damaged) {
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(-w * 0.36, -h * 0.31, w * 0.48, 1.8);
      ctx.fillRect(-w * 0.36, h * 0.31 - 1.8, w * 0.48, 1.8);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-w * 0.08, -h * 0.22, 12, h * 0.44);
    }

    // Subtle chrome radiator grille bar on Commuter Sedan
    if (isSedan && !damaged) {
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(w * 0.47, -h * 0.24, 2.2, h * 0.48);
    }

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
  // 3B. DEDICATED ANIMATED TOP-DOWN SWIMMING SPRITES (FREESTYLE & TREADING)
  // ==========================================================
  function getSwimmingSprite(roleColor, skinColor, frameIdx = 0, isMoving = true) {
    const f = ((frameIdx % 6) + 6) % 6;
    const key = `swim_${roleColor}_${skinColor}_${f}_${isMoving ? 1 : 0}`;
    if (charSprites[key]) return charSprites[key];

    const s = 54;
    const c = createCanvas(s, s);
    const ctx = c.getContext('2d');
    ctx.translate(s * 0.5, s * 0.5);

    const phase = (f / 6) * Math.PI * 2;
    const kick = Math.sin(phase * 2) * (isMoving ? 4.5 : 2.0);

    // 1. Submerged Aqua Body Halo & Underwater Refraction Tint
    const subGrad = ctx.createRadialGradient(-2, 0, 3, -2, 0, 21);
    subGrad.addColorStop(0, 'rgba(14, 165, 233, 0.34)');
    subGrad.addColorStop(0.65, 'rgba(2, 132, 199, 0.18)');
    subGrad.addColorStop(1, 'rgba(2, 132, 199, 0)');
    ctx.fillStyle = subGrad;
    ctx.beginPath();
    ctx.ellipse(-3, 0, 21, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Submerged Flutter-Kicking Legs + White Kick-Foam Bubbles (trailing at -X)
    if (isMoving) {
      ctx.save();
      ctx.globalAlpha = 0.58;
      ctx.fillStyle = '#1e3a5f';
      ctx.beginPath();
      ctx.roundRect(-21, -5.5 + kick * 0.65, 12, 4.2, 2);
      ctx.roundRect(-21, 1.3 - kick * 0.65, 12, 4.2, 2);
      ctx.fill();

      // White flutter-kick foam & bubbles
      ctx.fillStyle = 'rgba(240, 249, 255, 0.85)';
      ctx.beginPath();
      ctx.arc(-22, -3 + kick * 0.7, 2.8, 0, Math.PI * 2);
      ctx.arc(-23, 3 - kick * 0.7, 2.4, 0, Math.PI * 2);
      ctx.arc(-25, kick * 0.3, 1.7, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 3. Prone Swimmer Torso / Wet Shoulders (Partially Submerged)
    const wetTorso = ctx.createLinearGradient(-12, -9, 8, 9);
    wetTorso.addColorStop(0, darkenHex(roleColor, 0.55));
    wetTorso.addColorStop(0.55, roleColor);
    wetTorso.addColorStop(1, lightenHex(roleColor, 18));
    ctx.fillStyle = wetTorso;
    ctx.beginPath();
    if (isMoving) {
      ctx.ellipse(-3, 0, 11, 8.2, Math.sin(phase) * 0.08, 0, Math.PI * 2);
    } else {
      ctx.ellipse(-1, 0, 8.5, 9.5, 0, 0, Math.PI * 2);
    }
    ctx.fill();
    ctx.strokeStyle = 'rgba(8, 47, 73, 0.65)';
    ctx.lineWidth = 1.1;
    ctx.stroke();

    // 4. Alternating Freestyle Crawl Arm Strokes (Moving) vs Sculling Arms (Treading Water)
    if (isMoving) {
      const leftReach = Math.sin(phase);       // +1 reaching forward (+X), -1 pulling back (-X)
      const rightReach = Math.sin(phase + Math.PI);

      const drawStrokeArm = (sideSign, reachVal) => {
        const yBase = sideSign * 8.2;
        const xTip = 4 + reachVal * 12.5;
        const yTip = sideSign * (9.5 - Math.abs(reachVal) * 3.0);

        // Splash arc when hand slices forward into water
        if (reachVal > 0.35) {
          ctx.strokeStyle = 'rgba(224, 242, 254, 0.85)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(xTip + 2, yTip, 4.2, -0.9, 0.9);
          ctx.stroke();
        }

        // Bare forearm + wet sleeve shoulder
        ctx.strokeStyle = skinColor;
        ctx.lineWidth = 3.8;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(1, yBase);
        ctx.quadraticCurveTo(3 + reachVal * 5, sideSign * 11.2, xTip, yTip);
        ctx.stroke();

        ctx.fillStyle = roleColor;
        ctx.beginPath();
        ctx.arc(1, yBase, 3.0, 0, Math.PI * 2);
        ctx.fill();
      };

      drawStrokeArm(-1, leftReach);
      drawStrokeArm(1, rightReach);
    } else {
      // Treading water: gentle sculling arms out to the sides with white ripple arcs
      const scull = Math.sin(phase) * 3.2;
      ctx.strokeStyle = skinColor;
      ctx.lineWidth = 3.6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(0, -8);
      ctx.quadraticCurveTo(3 + scull, -13, 6 - scull * 0.5, -10);
      ctx.moveTo(0, 8);
      ctx.quadraticCurveTo(3 - scull, 13, 6 + scull * 0.5, 10);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(224, 242, 254, 0.62)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(1, 0, 14.5 + Math.sin(phase) * 1.5, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 5. Swimmer Head, Wet Slicked Hair & Sunglasses Above Waterline
    const headX = isMoving ? 7.2 : 2.5;
    ctx.fillStyle = skinColor;
    ctx.beginPath();
    ctx.arc(headX, 0, 5.6, 0, Math.PI * 2);
    ctx.fill();

    // Wet dark hair
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(headX - 1.4, 0, 5.4, Math.PI * 0.42, Math.PI * 1.58);
    ctx.fill();

    // Waterline collar foam ring around neck/chest
    ctx.strokeStyle = 'rgba(240, 249, 255, 0.72)';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.arc(headX + 1.5, 0, 7.2, -0.85, 0.85);
    ctx.stroke();

    // Aviator shades
    ctx.fillStyle = '#090d16';
    ctx.fillRect(headX + 2.8, -3.8, 2.1, 7.6);

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

    // 120mm Smoothbore Battle Tank Turret Sprite
    const tc = createCanvas(96, 48);
    const tctx = tc.getContext('2d');
    tctx.translate(48, 24);
    // Turret drop shadow
    tctx.fillStyle = 'rgba(0,0,0,0.5)';
    tctx.beginPath();
    tctx.roundRect(-17, -12, 34, 27, 5);
    tctx.fill();
    // Main 120mm Gun Barrel + Bore Evacuator + Muzzle Brake
    tctx.fillStyle = '#334155';
    tctx.fillRect(10, -3, 36, 6);
    tctx.strokeStyle = '#090d16';
    tctx.lineWidth = 1.2;
    tctx.strokeRect(10, -3, 36, 6);
    tctx.fillStyle = '#475569';
    tctx.fillRect(22, -4.5, 9, 9);
    tctx.fillStyle = '#1e293b';
    tctx.fillRect(43, -4.5, 5, 9);
    // Angular Composite Turret Housing & Commander Hatch
    tctx.fillStyle = '#3f4f3e';
    tctx.beginPath();
    tctx.moveTo(16, -10);
    tctx.lineTo(-16, -13);
    tctx.lineTo(-20, 0);
    tctx.lineTo(-16, 13);
    tctx.lineTo(16, 10);
    tctx.closePath();
    tctx.fill();
    tctx.stroke();
    tctx.fillStyle = '#1e293b';
    tctx.beginPath();
    tctx.arc(-4, -4, 5, 0, Math.PI * 2);
    tctx.fill();
    tctx.stroke();
    propSprites.tankTurret = tc;
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
    getSwimmingSprite,
    propSprites
  };
})();
