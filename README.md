# GTA VI: LEONIDA CARBON // 2027 HYPER-EDITION

[![Play Live on GitHub Pages](https://img.shields.io/badge/PLAY_LIVE-GitHub_Pages-00f0ff?style=for-the-badge&logo=github&labelColor=070a14)](https://abdelouahabb.github.io/gta2/)

> *"What if GTA 6 launched in the browser powered by 2027 next-gen web tech—combining the iconic 2.5D top-down perspective, gang warfare, and neon atmosphere of 1999's **Grand Theft Auto 2** with humongous scale, dynamic weather, orbital drop-pods, and a multi-track MIDI synth engine?"*

**GTA VI: LEONIDA CARBON** is a zero-dependency, pure HTML5 Canvas + Web Audio API open-world action game set across the massive **80×80 (`12,800 × 12,800` px) State of Leonida**. Built for 60 FPS performance using an `O(1)` spatial grid (`buildingsGrid`) and pre-baked satellite megamap rendering, it packs 7 distinct districts, 17 land/sea/air vehicles, high-altitude flight with steerable parachute bailouts, helicopter magnetic wrecking-ball tow cables, live TV news chopper PiP broadcasts, autonomous fire-engine hydro-cannons, domino gas-station explosions, district power blackouts, sharks & alligators, tiered structural destruction, dynamic tropical fire & weather physics, bullet-time reflex dilation, and 10 original `.mid` radio/action soundtracks.

---

## ✨ 2027 Carbon Edition Highlights

- **Humongous 80×80 State of Leonida (`12,800 × 12,800` px)** (`game.js`):
  - **7 Distinct Mega-Districts** with automatic border detection & cinematic entry banners:
    1. **Downtown Vice Metropolis** (Neon skyscrapers, central plazas, Pay N' Spray)
    2. **Ocean Drive & Vice Beach** (Art Deco hotels, beach umbrellas, breaking surf, Viper Speedboats)
    3. **Star Island Billionaire Keys** (Bridge-linked luxury island mansions, supercars & hypercars)
    4. **Leonida Intl Spaceport & Airbase** (Twin runways, military Rhinos, Hydra VTOL fighter jets)
    5. **Everglades Bayou & Swamps** (Wetlands, Gator Kings turf, bridges)
    6. **Port Leonida Cargo Docks** (Industrial shipping container stacks, 18-Wheeler Haulers)
    7. **Silicon Hills Tech Corridor** (Futuristic glass towers & Carbon X-2027 prototypes)
  - **Elevated `VICE SKY-RAIL` Maglev Train**: Articulated 4-car neon bullet train looping continuously above Downtown traffic.
  - **O(1) Spatial Indexing & Destructible Architecture**: Instant collision, raycast, and 2.5D perspective rendering across ~1,500 curated buildings, spacious civic plazas, palm-lined parks, and shatterable glass facades (`brokenWindows`) that burst into 3D glass shards on impact.
- **2027 Holographic Cyber-HUD, Pursuit Warnings, Satellite Megamap & Orbital Drop-Pod** (`index.html`, `style.css`):
  - **Interactive Satellite Megamap (`G` key)**: Full-screen `600×600` live tactical radar showing your position, police units, payphones, and the Maglev Sky-Rail—click anywhere for **instant Orbital Fast-Travel** or right-click to set a **GPS Waypoint**.
  - **Orbital Vehicle Drop-Pod (`V` key)**: Request immediate orbital delivery of the colossal **Leonida 747-8 Jumbo Airliner**, hypercars, Falcon gunship helicopters, fighter jets, battle tanks, speedboats, or superbikes right next to you.
  - **Active Police Pursuit Atmosphere**: Wanted levels (`1★`–`6★`) trigger alternating red/blue VCPD siren edge-vignette strobes across the scene, a live tactical pursuit warning ticker, flashing radar frame, and helicopter searchlight lock reticles. Crashing a commercial airplane or fighter jet into the city immediately triggers a **5-Star (`★★★★★`) Federal Disaster Lockdown**!
  - **Distance-Adapted Stressed Commuter Traffic Horns**: Civilian drivers queued behind roadblocks, burned-out wrecks, traffic jams, red lights, or a player blocking the lane become stressed after waiting idle for **5+ seconds**—honking dual-tone car horns or deep 18-wheeler air-horns (`playCarHorn`) whose **volume, low-pass air muffling, and stereo panning adapt dynamically to distance** from the player, paired with hood soundwave arcs, high-beam flashes, and impatient driver barks.
  - **100% Permanent Battlefield Destruction ("Check the Mess!")**: Nothing you destroy ever despawns—burned-out cars, trucks, police cruisers, tanks, helicopters, fighter jets, and even the colossal crashed **468×440 Leonida 747-8 Jumbo Airliner** remain permanently on the streets as charred, smoldering, solid wrecks (`applyCharredWreckOverlay`) alongside permanent explosion scorch craters, collapsed building ruins, felled/charred palm trees, and up to 700 settled debris fragments per tile (`settledDebrisGrid`), plus permanent crash scars on the `[G]` Satellite Megamap.
  - **📺 Live `WLTV Action News 6` Chopper PiP Broadcast (`N` key / Auto at `3★+` & Disasters) + `4★+` SWAT Fast-Ropes**: A live Picture-in-Picture airborne TV monitor (`#newsCamCanvas`) tracks your mayhem with telephoto gimbal sway, broadcast scanlines, and reactive breaking-news chyrons, while `4★+` VCPD Maverick choppers deploy tactical Kevlar fast-ropes (`swatRopes`) to slide SWAT troopers directly into the street.
  - **🚒 Leonida Fire Department (`LEONIDA FD ENGINE 07`) + Pressurized Hydro-Cannon**: Autonomous AI fire engines dispatch with sirens to hose down burning palm trees and vehicle wrecks—or hijack/drop-pod one yourself (`[V]`) to rotate the 360° roof deluge cannon (`Left Click` / `Ctrl`), douse blazes in clouds of white steam, cool leaking gas pumps, and hydro-blast cars & pedestrians across intersections!
  - **⛽ Domino Gas Station Infernos & ⚡ High-Voltage Grid Blackouts**: Rupturing any of the 7 **RON-99 Hyper-Octane** gas stations sparks a pressurized fuel leak and thermobaric domino chain-reaction, while blowing up any of the 5 **Leonida Grid HV Substations** plunges every skyscraper, storefront, and streetlamp across that district into a rolling **Power Blackout**!
  - **🪝 Helicopter & Heavy-Rig Magnetic Tow-Cable / Sky Wrecking-Ball (`Right-Click` or `U`)**: Latch a high-tension Carbon Mag-Winch cable onto any car or permanent charred wreck, lift it into the sky beneath a helicopter on a real spring-pendulum cable, swing it through glazed skyscraper facades and traffic like a wrecking ball, and press `Right-Click` / `U` mid-swing to air-drop it onto the avenue below!
  - **🦈 Sharks, Everglades Alligators, Tsunami Surge Rings & `P` Sky-Drone Photo Mode**: 16 patrolling Great White Sharks and Bayou Alligators lunge at swimmers, massive water crashes unleash hydrodynamic Tsunami Surge Rings that push speedboats outward, stunt ramps trigger slow-motion hang-time + FT distance bonuses, and **`[P]`** launches a free-fly **Sky-Drone** (`WASD` pan, `Wheel` zoom, **`[O]`** 1-click Postcard PNG export).
  - **Digital Speedometer & Telemetry**: Real-time `MPH`/`KTS` readout, `[SHIFT]` Plasma Nitrous bar, chassis integrity bar, live weapon lethality tier badge, and 7-slot arsenal dock.
- **Dynamic Weather, Interactive Rain, Fire & Destructible Foliage (`B` & `T` keys)**:
  - **Vibrant Morning Start (`08:45 AM`)**: Every session begins in natural golden-morning sunlight when architectural palettes, ocean caustics, and foliage look crisp and vibrant, seamlessly advancing across a 24-hour cycle (`T` advances 4 hours).
  - **Interactive Monsoon Rain Physics**: Cycling into **Tropical Monsoon** (`B`) spawns physical raindrop impacts across the environment—bright droplet crown bursts right on top of elevated 2.5D building rooftops, glossy sky-reflecting rainwater puddles along roads/sidewalks/docks, concentric raindrop rings across water and puddles, rear-tire rooster-tail water spray behind moving vehicles, slick hydroplane drift physics, and lightning/thunderclaps.
  - **Destructible Falling Palm Trees & Persistent World Debris**: Palm trees have solid trunks that splinter and tip over (`falling` → `fallen`) along the impact vector when rammed by vehicles, struck by heavy weapons, or blasted by explosions. All destruction debris—collapsed masonry, shattered glass shards, splintered tree wood, and charred vehicle wreckage—settles permanently onto the streets (`settledDebrisGrid`) without ever vanishing.
  - **Dramatic Tropical Fire Physics**: Flamethrowers and explosions ignite palm trees into multi-layered roaring crown infernos with rising smoke plumes, falling embers, heat spread to nearby foliage/pedestrians, and smoking charred trunks.
- **16 Realistic-Speed Land, Sea & Air Vehicles, Swimming & Parachute Bailout** (`sprites.js`, `game.js`):
  - **Realistic Speed Hierarchy**: Grounded physics calibrated from the heavy slow-moving 68-ton **Rhino M1A3 Battle Tank** (`175`), **Skateboard** (`195`), and **18-Wheeler Hauler** (`255`), through street sedans/SUVs (`310–335`), **Viper Speedboat** (`370`), **PCJ-600 Superbike** (`460`), **Falcon Gunship Helicopter** (`480`), and **Carbon X-2027 Hypercar** (`505`), up to the **Sky-747 Airliner** (`540`) and **Hydra VTOL Supersonic Jet** (`685`).
  - **Rhino M1A3 Battle Tank (Precise 2D OBB Demolition)**: Exact Oriented Bounding Box (`obbRectCollide`) hull collision + inward wall-normal momentum checks let the tank crush and collapse buildings cleanly at the exact front-armor contact point without side-scrape phantom hits, paired with a mouse-aimed 120mm demolition cannon.
  - **Falcon Gunship Helicopter (Physical Rotor Spin-Up/Down, `[SPACE]` / `[L]` Landing & Clean Parking)**: Parked at Downtown Helipad Plaza, Spaceport, and Star Island (or via `[V]` Drop-Pod) with **100% stationary 4-blade composite rotors** when parked (`rotorRPM = 0`). Boarding spools up main & tail rotors with progressive aerodynamic motion-blur sectors and yellow tip-strobe rings; hold **`[Space]`** or press **`[L]` (Auto-Land)** to stabilize drift and touch down to `altitude = 0` (`heliLanded = true`), then press **`[F]` / `[Enter]`** to park cleanly without crashing while rotors coast smoothly back to a stop.
  - **Colossal Real-Scale Leonida 747-8 Jumbo Airliner, Hydra VTOL Jet & Live Ground Missile Targeting**: Aircraft are scaled to monumental real-world proportions relative to street cars (`56×27` px)—the **Hydra VTOL Jet** spans `182×152` px (`224×192` sprite) and the **Leonida Airways 747-8 Widebody Jumbo** spans a jaw-dropping **`404×386` px (`468×440` sprite — >7× a car's length and wider than 2.3 city blocks!)**. Aim with the live **Ground Strike Target Reticle** and press **`Left Click`**, **`Ctrl`**, or **`K`** at any altitude to fire twin house-demolishing **AGM Missiles** (or **Hydra-70 Rockets** from helicopters), press **`F` / `Enter` mid-air** to bail out with a steerable **Ram-Air Parachute**, or crash into the city for a **5-Star Multi-Block Catastrophe** leaving the giant charred 747-8 hulk permanently across the avenues!
  - **Dedicated Swimming Animation & Miami Viper Speedboat**: Entering rivers, canals, or the Atlantic switches the player and pedestrians to dedicated 6-frame freestyle crawl and water-treading sprites (`getSwimmingSprite`) with hydrodynamic V-wakes and flutter-kick foam, alongside Viper Speedboats carving under elevated bridges.
- **Aggressive Street Gangs, Turf Shootouts & 7 Tiered-Lethality Weapons (`X` key)**:
  - **Rival Gang Turf Shootouts & Aggressive Pedestrians**: Armed **Neon Syndicate**, **Vice Runners**, and **Gator Kings** crews clash in spontaneous street shootouts across turf borders, coordinate fire when provoked, and rough-neighborhood pedestrians draw weapons and fight back instead of fleeing.
  - **Carbon Reflex (`X`)**: Dilates world physics & bullets to `0.36×` speed while keeping player responsiveness sharp.
  - **Tiered Structural Lethality (`1`–`7`)**: Even on foot, weapons scale across 5 lethality tiers—from **Tier I–II** (`9mm Pistol`, `Micro-SMG`, `Combat Shotgun` shattering facade glass & chipping masonry) and **Tier III** (`Flamethrower` igniting trees/facades & `EMP Shockwave` blowing out entire glass blocks) up to **Tier IV** (`Carbon Railgun` piercing structural cores) and **Tier V** (`Heavy RPG` collapsing houses & skyscrapers on foot).
- **10 Multi-Track `.mid` Soundtracks & Dynamic Pursuit Music** (`midi_player.js`, `generate_midi.js`, `music/`):
  - Zero-dependency Standard MIDI File parser + polyphonic Web Audio synthesizer playing **10 original Format-1 `.mid` files**: 7 radio stations (`Vice Synth 84`, `Leonida Bass FM`, `Gator Rock FM`, `Cyber Electro`, `Havana Caliente FM`, `Sunset Lounge FM`, `Starlight Disco FM`) plus 3 dynamic score tracks (`Street Prowl`, `VCPD Heat`, and 4★+ `SWAT Lockdown`).

---

## 🎮 Controls

Supports **QWERTY (`WASD`)**, **AZERTY (`ZQSD`)**, and **Arrow Keys** seamlessly:

| Input | Action |
| :--- | :--- |
| **`W A S D` / `Z Q S D` / `Arrows`** | Move on foot / Drive, Sail, or Fly vehicle |
| **`Shift` (Hold)** | **Plasma Nitrous Boost** (vehicles) / **Fast Dive** (parachute) |
| **`Space` (Hold) or `L`** | Handbrake & Drift (cars) / **Descend & Land Helicopter** (`Space` hold or `L` Auto-Land toggle) / **Flare** (parachute) |
| **`F` or `Enter`** | Hijack, Enter, **Park Landed Helicopter**, or **Mid-Air Parachute Bailout** (from aircraft) |
| **`Left Click` / `Ctrl` / `K`** | Fire weapon / Tank 120mm Cannon / **Firetruck Hydro-Cannon** / **Aircraft Twin AGM Missiles** / **Heli Rockets** |
| **`Right Click` or `U`** | **Magnetic Tow-Cable / Sky Wrecking-Ball** (Latch & swing cars/wrecks from Helicopter, Firetruck, Tank, or Hauler) |
| **`1` - `7` / `Tab` / `C` / `Mouse Wheel`** | Switch weapon (`6` = Carbon Railgun, `7` = EMP Shockwave) |
| **`X`** | Toggle **Carbon Reflex Bullet-Time** (`0.36×` time dilation) |
| **`V`** | Open **Orbital Vehicle Drop-Pod** spawner (10 instant drops incl. 747-8, Falcon Heli, Fire Engine & Tank) |
| **`N`** | Toggle **Live `WLTV Sky-Cam 6` News Chopper TV** Picture-in-Picture feed |
| **`P` / `O`** | Toggle **Free-Fly Sky-Drone Camera** (`WASD` pan, `Wheel` zoom) / **`O`** Snap Postcard `.png` |
| **`G` or `M`** | Open **Full-Screen Satellite Megamap** (Click = Fast-Travel, Right-Click = Waypoint) |
| **`B`** | Cycle **Dynamic Weather** (*Clear*, *Monsoon*, *Cyber-Fog*, *Heatwave*) |
| **`T`** | Cycle **Time of Day** (*Neon Night*, *Vice Sunset*, *Miami Noon*) |
| **`R`** | Cycle **MIDI Radio Station** / Toggle Radio |
| **`E`** | Car Horn / Toggle Police Siren |
| **`H`** | Toggle Controls Help Overlay |

---

## 🚀 Play Online or Locally

- **GitHub Pages (Zero Install)**: **[https://abdelouahabb.github.io/gta2/](https://abdelouahabb.github.io/gta2/)**
  - Includes `.nojekyll` and `.github/workflows/pages.yml` out of the box—compatible with both **GitHub Actions** and **Deploy from a branch (`main` / `/root`)** in repository *Settings → Pages*.
- **Local Server**:
  ```bash
  python3 -m http.server 8080
  ```
  Then open **[http://localhost:8080](http://localhost:8080)** in any modern browser.

---

## 📁 Project Structure

```text
├── index.html       # 2027 Holographic HUD, Speedometer, Drop-Pod & Satellite Megamap modals
├── style.css        # Cyber-glassmorphic UI styling, Bullet-Time aura, and responsive overlays
├── sprites.js         # Procedural PBR Sprite & Texture Forge (16 vehicles incl. Falcon gunship, tank turret, props)
├── generate_midi.js   # Procedural multi-track Format-1 Standard MIDI (.mid) composer & manifest builder
├── midi_player.js     # Zero-dependency binary .mid parser & Web Audio polyphonic synth engine
├── music/             # 10 multi-channel Standard MIDI (.mid) radio & dynamic pursuit soundtracks
└── game.js            # 80×80 (12,800×12,800) 2.5D Carbon Engine, OBB physics, flight/parachute, fire & AI
```

---

## 📄 License

Distributed under the [MIT License](LICENSE).
