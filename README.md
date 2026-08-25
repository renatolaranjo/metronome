# Metronome

> 🌐 **Live Application:** [https://renatolaranjo.github.io/metronome/](https://renatolaranjo.github.io/metronome/)

A modern, studio-grade web metronome built with **React 19**, **TypeScript**, and **Vite**. The application uses the **Web Audio API** for sample-accurate timing and runs as a full-featured **Progressive Web App (PWA)** on mobile devices and desktop.

---

## Features

- **Precise Timing Engine:** Sample-accurate click scheduling using the browser's Web Audio API clock.
- **Tempo Control:** 20 to 300 BPM with fine increment buttons, numeric input, and an interactive **Tap Tempo** button.
- **Meter & Subdivisions:** Configurable time signatures (numerators 1–64, standard denominators), beat units, and subdivisions (1 to 8, including triplets).
- **Subdivision Pattern Editor:** Customize individual subdivision clicks with **Accent (A)**, **Normal (N)**, and **Mute (X)** states.
- **Visual Beat Indicators:** Real-time visual tracking for active beat, accent flash, subdivision step, and measure counter.
- **Progressive Tempo Mode:** Automatically accelerates tempo by custom BPM intervals every *N* measures up to a target maximum BPM.
- **Training Mode:** Alternates between audible and silent measures to build internal clock accuracy.
- **Preset Management:** Create, save, select, update, and delete custom practice presets persisted in `localStorage`.
- **Installable PWA:** Standalone full-screen experience with offline support and automatic updates.

---

## 📲 Install as an App (PWA)

Metronome can be installed directly from the browser on mobile and desktop devices without going through an app store.

### 📱 iPhone / iPad (iOS Safari)
1. Open [https://renatolaranjo.github.io/metronome/](https://renatolaranjo.github.io/metronome/) in **Safari**.
2. Tap the **Share** button (the square icon with an upward arrow).
3. Scroll down and select **Add to Home Screen**.
4. Tap **Add** in the top-right corner.

### 🤖 Android (Chrome / Edge / Samsung Internet)
1. Open [https://renatolaranjo.github.io/metronome/](https://renatolaranjo.github.io/metronome/) in **Chrome** or your preferred browser.
2. Tap the **three dots menu (⋮)** in the top-right corner (or the *"Install"* prompt if displayed).
3. Tap **Install app** or **Add to Home screen**.
4. Confirm installation.

### 💻 Desktop (Chrome / Edge / Brave)
1. Open the application in your browser.
2. Click the **Install** icon in the address bar (next to the bookmark star).
3. Confirm to run Metronome in its own dedicated, borderless window.

---

## 🛠️ Local Development

### Prerequisites
- **Node.js**: `20.19+` or `22+`
- **npm**: `10+`

### Setup and Running

```bash
# Clone the repository
git clone https://github.com/renatolaranjo/metronome.git
cd metronome

# Install dependencies
npm install

# Start development server
npm run dev
```

Open the local URL displayed in the terminal (usually `http://localhost:5173/metronome/`).

---

## 📜 Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts the Vite development server with Hot Module Replacement (HMR). |
| `npm run build` | Runs TypeScript type-checking (`tsc -b`) and bundles production assets into `dist/`. |
| `npm run preview` | Previews the production build locally. |
| `npm run lint` | Lints source files with ESLint. |
| `npm test` | Runs test suite using Vitest. |
| `npm run prepare` | Initializes Husky git hooks. |

---

## 🚀 CI/CD & Quality

- **Pre-commit Hooks:** [Husky](https://typicode.github.io/husky/) runs `npm run lint` and `npm test` automatically before every local commit.
- **Continuous Integration (`.github/workflows/ci.yml`):** Runs tests and builds on pull requests and branch pushes.
- **Automated Deployment (`.github/workflows/deploy.yml`):** Automatically builds and deploys production releases to **GitHub Pages** on every push to `main`.

---

## 📂 Project Structure

```text
src/
├── assets/          # Static assets and icons
├── audio/           # Web Audio API engine & scheduling logic
├── hooks/           # useMetronome hook for state orchestration
├── music/           # Rhythm calculations, presets, and validation
├── test/            # Test mocks (AudioContext mock, setup)
├── types/           # TypeScript interfaces and types
├── App.tsx          # Main metronome studio UI
├── App.css          # Studio theme styling (dark/amber palette)
├── index.css        # Global CSS variables and reset
└── main.tsx         # React application entry point
```