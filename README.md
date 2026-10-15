# PadelSlay 🎾⚡

> **Padel Mixin Magic & Winter League Management App**

PadelSlay (PlaySlay) is a modern, mobile-first web application designed for padel clubs, social groups, and competitive leagues to organize games, manage sign-ups, and track player rankings.

---

## ✨ Features

- **🏟️ Interactive Court & Game Slots**:
  - Visual 2v2 court layout with Drive (Left) and Revés (Right) player positioning.
  - Quick slot reservations for casual games, Americanos, and league matches.
  - Indoor/outdoor indicators, start times, durations, and court locations.

- **🏆 Winter League Standings & Dynamic Scoring**:
  - Live league ladder tracking matches played, win/loss records, point differential, and recent form.
  - Advanced weighted match scoring breakdown accounting for set scores, game differentials, and opponent ratings.

- **⭐ Most Improved & Weekly Awards**:
  - Automated weekly spotlights highlighting standout performers, rating jumps, win streaks, and point deltas.

- **👥 Member Roster & Flexible Sign-Up**:
  - 4 distinct sign-up pathways: *Mixin Sessions*, *Winter League*, *All-Access (Both)*, and *Casual Member*.
  - Player profiles with Playtomic-style ratings, dominant hand, preferred play side, and match stats.

- **📱 Mobile-First Design**:
  - Responsive layout with desktop preview framing, bottom navigation, and clean dark-mode UI.

---

## 🛠️ Tech Stack

- **Frontend**: [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Effects**: [canvas-confetti](https://www.npmjs.com/package/canvas-confetti)
- **Deployment**: Multi-stage [Docker](https://www.docker.com/) container served with [Nginx](https://nginx.org/) on [Google Cloud Run](https://cloud.google.com/run).

---

## 🚀 Getting Started

### Local Development

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start the development server**:
   ```bash
   npm run dev
   ```

3. **Build for production**:
   ```bash
   npm run build
   ```

---

## 🐳 Docker & Cloud Run Deployment

Deploy directly to Google Cloud Run using the included one-click script:

```bash
./deploy-cloudrun.sh
```

Or build and run locally with Docker:

```bash
docker build -t padelslay:latest .
docker run -p 8080:8080 padelslay:latest
```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for full deployment instructions and GCP setup steps.
