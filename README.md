# GTA VI: VICE OVERHEAD (1999 / 2026 Edition)

> *"What if GTA 6 launched in the browser with the iconic 2.5D top-down camera, neon dusk atmosphere, and gang Warfare of 1999's **Grand Theft Auto 2**?"*

**GTA VI: VICE OVERHEAD** is a zero-dependency, pure HTML5 Canvas + Web Audio API open-world action game set in **Vice City / Leonida**. It combines classic GTA 2 overhead gameplay—dynamic speed-zoom camera, 2.5D perspective-extruded skyscrapers, the **Respect-O-Meter**, and ringing green payphone contracts—with procedural PBR-style textures and high-detail multi-layered vehicle and character sprites.

---

## ✨ Key Features

- **2.5D Top-Down Perspective Engine** (`game.js`):
  - **Dynamic Speed-Zoom Camera**: Smoothly zooms out at high speed so you can see oncoming traffic and intersections, and zooms in when exploring on foot.
  - **Extruded 3D Building Facades**: Buildings shift dynamically relative to the camera center with perspective-mapped illuminated hotel/office windows, rooftop HVAC fans, glass skylights, helipads, and glowing neon billboards (*HOTEL VICE*, *CLUB MALIBU*, *ARCADE 1999*, *BAYOU BAR*).
  - **Real-Time Lighting Modes**: Cycle between **21:00 Neon Night**, **18:30 Vice Sunset**, and **12:00 Miami Noon** (`T` key), complete with dual volumetric headlight cones, red brake-light road reflections, streetlamp halos, and flashing red/blue police strobes.
- **Procedural Sprite & Texture Forge** (`sprites.js`):
  - **Pre-Rendered Vehicles**: Sculpted metallic paint shaders, protruding rubber tires, side mirrors, tinted windshields with sky glints, racing stripes, supercharger hood blowers, rear louvers, spoilers, and damage states.
  - **Animated Characters**: 4-frame walking leg/boot stride and arm swing animations, shaded jackets, aviator sunglasses, muzzle flashes, brass shell casing ejection, and bullet tracer trails.
  - **PBR-Inspired World Surfaces**: Weathered asphalt with aggregate grain and micro-cracks, beveled concrete sidewalk slabs, cast-iron manhole covers, rippled golden beach sand, breaking ocean surf, and swaying multi-layered palm trees.
- **GTA 2 Respect-O-Meter & 3 Rival Gangs**:
  - **Flamingo Syndicate** (East / Ocean Beach), **Chrome Runners** (Downtown), and **Gator Kings** (West Bayou).
  - Eliminating members of one gang lowers their respect (causing them to open fire on sight when respect drops below 25%) while boosting your standing with rival gangs.
- **Ringing Green Payphone Contracts**:
  - Follow the green objective arrow to any ringing payphone to accept timed gang contracts:
    - **Chrome Runner Express**: High-speed neon checkpoint street race across Leonida.
    - **Syndicate VIP Hit**: Eliminate a heavily armed rival Underboss and his bodyguards.
    - **Bayou Chaos Contract**: Rampage elimination challenge against rival targets and VCPD officers.
- **6 Vehicle Classes, Pay N' Spray & 6-Star Police Response**:
  - Drive and hijack the **Vice Banshee GT**, **Infernus Turbo**, **Sabre Muscle**, **Kaufman Cab**, **VCPD Interceptor**, and **Leonida SWAT Van**.
  - Visit the central **Pay N' Spray** garage to respray your car, repair engine damage, and clear your Wanted level.
- **5 Weapons & Web Audio Synthesizer Radio**:
  - **9mm Pistol**, **Viper Micro-SMG** (supports drive-by shooting from vehicles!), **Combat Shotgun**, **RPG Launcher** (chain-reaction explosions), and **Flamethrower**.
  - Built-in Web Audio API synthesizer generating gunshots, explosions, police sirens, and 3 procedural synthwave/bass radio stations (`R` key).

---

## 🎮 Controls

Supports **QWERTY (`WASD`)**, **AZERTY (`ZQSD`)**, and **Arrow Keys** out of the box:

| Input | Action |
| :--- | :--- |
| **`W A S D` / `Z Q S D` / `Arrows`** | Move on foot / Drive & Steer vehicle |
| **`Space`** | Handbrake / Drift |
| **`F` or `Enter`** | Hijack / Enter / Exit vehicle |
| **`Left Click` (Hold)** | Fire weapon (On-foot or Drive-by) |
| **`1` - `5` / `Tab` / `C` / `Mouse Wheel`** | Switch weapon |
| **`E`** | Car Horn / Toggle Police Siren |
| **`R`** | Cycle Radio Station (*V-Rock Synthwave*, *Vice Miami Bass*, *Cyber Gator Club*, *Off*) |
| **`T`** | Cycle Time of Day (*Neon Night*, *Vice Sunset*, *Miami Noon*) |
| **`H`** | Toggle on-screen Controls HUD card |

---

## 🚀 Quick Start

No build step, bundler, or external dependencies required.

### Option 1: Local Web Server (Recommended)
```bash
git clone <your-repo-url>
cd gta
python3 -m http.server 8080
```
Then open **[http://localhost:8080](http://localhost:8080)** in any modern browser.

### Option 2: Direct File Open
Simply double-click `index.html` to launch directly in Chrome, Firefox, Edge, or Safari.

---

## 📁 Project Structure

```text
├── index.html   # Main viewport, CRT scanline overlay, and GTA 2 style HUD panels
├── style.css    # Neon Vice styling, Respect-O-Meter bars, Wanted stars, and responsive layout
├── sprites.js   # Procedural Sprite & Texture Forge (vehicles, characters, asphalt, roofs, palms)
└── game.js      # Core 2.5D engine, arcade drift physics, AI traffic/police, missions, and Web Audio synth
```

---

## 📄 License

Distributed under the [MIT License](LICENSE).
