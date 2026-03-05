# Mood — Cozy Emotional Farming Game

> **Team:** Victoria Sister Fans Club
> **Hackathon Project:** Mood
> **Team Members:** Hailey Cheng (City University of Hong Kong) · Rabin Sarki (Hong Kong University of Science and Technology)

---

## Inspiration

We wanted to make emotional reflection feel gentle and enjoyable instead of clinical. Journaling helps people process feelings, but it can be hard to maintain as a habit. Inspired by cozy games like Stardew Valley and Animal Crossing, we imagined a world where reflecting on your day grows a peaceful garden.

## What It Does

**Mood** is a cozy pixel art farming game where players grow a garden through journaling. When players write about their day, AI analyzes the emotional tone and transforms it into flowers, weather changes, and growth in the farm. Over time the garden becomes a visual reflection of emotional experiences.

---

## Key Features

### 🌱 AI-Powered Emotional Journaling
Players write a short reflection inside the Journal House. Google Cloud AI analyzes the emotional tone and identifies moods such as happiness, calmness, stress, gratitude, or personal growth. Each emotion grows a different plant in the garden.

### 🌸 Living Garden That Reflects Your Mind
The garden evolves based on emotional patterns:
- Gratitude → Daisies
- Calm reflections → Lotus flowers
- Processing stress → Lavender
- Happy days → Sunflowers
- Personal growth → Oak saplings

Plants grow from seeds to full bloom, creating a visual representation of emotional progress.

### 🐮 Cozy Exploration Gameplay
Players explore the farm using WASD controls and choose their avatar. They talk to NPCs, complete small quests, and explore peaceful locations like the pond and garden plots.

### 🧘 Mindfulness Activities
The farm includes calming activities integrated into the world — box breathing, body scan, and 5-senses grounding exercises by the pond. Gentle NPC prompts guide players through each activity.

### 🤖 Weekly AI Reflection
After several journal entries the system generates a short reflection summarizing emotional patterns, helping players notice trends in a supportive and non-judgmental way.

### 🌿 Healthy Tech–Life Balance
The game rewards stepping away. Plants grow faster when players return after taking breaks, encouraging healthier digital habits.

---

## Problem Statement

Mental health apps often feel like tools — clinical, metrics-driven, and easy to abandon. People want to reflect on their feelings but struggle to build the habit. **Mood** addresses this by wrapping emotional journaling in the warmth of a cozy game: the act of writing becomes planting, and the garden becomes your emotional history made visible.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 14](https://nextjs.org/) (App Router) |
| Game Engine | [Phaser 3](https://phaser.io/) |
| Styling | [Tailwind CSS](https://tailwindcss.com/) |
| State Management | [Zustand](https://zustand-demo.pmnd.rs/) |
| AI / Emotion Analysis | [Google Cloud Vertex AI](https://cloud.google.com/vertex-ai) (Gemini 1.5 Flash) |
| Database & Auth | [Supabase](https://supabase.com/) (Postgres + Row Level Security) |
| Deployment | [Vercel](https://vercel.com/) |
| Pixel Assets | [Cozy Valley](https://iclaimthisname.itch.io/cozy-valley) by iclaimthisname (premium) |
| AI-Assisted Development | [Claude Code](https://claude.ai/claude-code) by Anthropic |

> **Note on AI-assisted development:** Game architecture, UI polish, quest systems, audio management, and iterative feature development were built with the assistance of **Claude Code** — Anthropic's CLI coding agent. Claude Code was used throughout the development cycle for pair-programming, refactoring, and implementing complex game systems.

---

## Project Structure

```
mood/
├── app/                        # Next.js App Router pages & API routes
│   ├── api/
│   │   ├── analyze/            # Emotion analysis + plant/journal save
│   │   ├── emotion-analysis/   # Daily record mood aggregation
│   │   └── weekly-summary/     # AI-generated weekly reflection
│   ├── game/
│   │   └── page.tsx            # Main game page
│   ├── layout.tsx
│   └── page.tsx                # Landing / home page
│
├── components/
│   ├── game/                   # In-game React overlays
│   │   ├── HUD.tsx             # Heads-up display (mood, streak, quests, time)
│   │   ├── JournalModal.tsx    # Journaling interface
│   │   ├── BreathingOverlay.tsx# Mindfulness activities
│   │   ├── DailyRecordModal.tsx# Mood history + AI insights
│   │   ├── WeeklyInsightModal.tsx
│   │   ├── TutorialOverlay.tsx
│   │   ├── AvatarPickerOverlay.tsx
│   │   ├── DialogOverlay.tsx   # NPC dialogue
│   │   └── GameCanvas.tsx      # Phaser mount point + event bridge
│   ├── menu/
│   │   ├── MainMenu.tsx
│   │   └── SettingsModal.tsx   # Audio volume, journal tone, display
│   └── ui/                     # Reusable glass-morphism components
│       ├── GlassModal.tsx
│       ├── GlassButton.tsx
│       ├── GlassSlider.tsx
│       ├── GlassToggle.tsx
│       └── GlassPanel.tsx
│
├── game/                       # Phaser game source
│   ├── PhaserGame.ts           # Game config + init
│   ├── EventBridge.ts          # Phaser ↔ React event bus
│   ├── scenes/
│   │   ├── BootScene.ts        # Asset preloading
│   │   └── FarmScene.ts        # Main game world
│   ├── objects/
│   │   ├── Player.ts           # Player sprite + movement
│   │   ├── NPC.ts              # NPC behaviour
│   │   └── PlantSprite.ts      # Garden plant rendering
│   ├── systems/
│   │   ├── GardenSystem.ts     # Plot layout + growth logic
│   │   ├── DayNightSystem.ts   # Lighting cycle
│   │   └── WeatherSystem.ts    # Weather state transitions
│   └── utils/
│       └── CozyValleyLoader.ts # Asset manifest + Phaser loader
│
├── lib/
│   ├── gameStore.ts            # Zustand global state
│   ├── audioManager.ts         # Web Audio API SFX + BGM manager
│   ├── ai.ts                   # Vertex AI / Gemini integration
│   ├── types.ts                # Shared TypeScript types
│   ├── supabase.ts             # Supabase client (browser)
│   └── supabaseServer.ts       # Supabase client (server)
│
├── database/
│   └── schema.sql              # Supabase table definitions
│
├── public/
│   ├── assets/                 # CozyValley pixel art (tilesets, characters, animals)
│   └── audio/                  # BGM + SFX audio files
│
└── tailwind.config.ts
```

---

## Setup & Run Instructions

### Prerequisites
- Node.js 18+
- A Supabase project (or skip — the game runs in guest mode without it)
- Google Cloud project with Vertex AI enabled (or use `AI_MOCK_MODE=true`)

### 1. Clone the repository

```bash
git clone https://github.com/heilcheng/Mood.git
cd Mood
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in your credentials:

```env
# Supabase (optional — game works in guest mode without these)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Google Cloud AI (optional — set AI_MOCK_MODE=true to skip)
GOOGLE_CLOUD_PROJECT_ID=your-gcp-project-id
GOOGLE_CLOUD_LOCATION=us-central1
GOOGLE_VERTEX_MODEL=gemini-1.5-flash
GOOGLE_APPLICATION_CREDENTIALS=./gcp-credentials.json

# Set to true to use keyword heuristic instead of Vertex AI (great for local dev)
AI_MOCK_MODE=true
```

### 4. Set up the database (optional)

In your Supabase project SQL editor, run the contents of:

```
database/schema.sql
```

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 6. Play without any credentials

The game works fully in guest mode. Just set `AI_MOCK_MODE=true` in `.env.local` and leave the Supabase variables empty — no account or cloud setup needed.

---

## Game Controls

| Key | Action |
|---|---|
| `WASD` / Arrow Keys | Move character |
| `Shift` + Move | Sprint |
| `E` | Interact with nearby NPC / zone |
| `J` | Open journal from anywhere |
| `Esc` | Close modals |

---

## Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Optional | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Optional | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Optional | Service role key (server-side writes) |
| `AI_MOCK_MODE` | No | `true` = skip Vertex AI, use local keyword heuristic |
| `GOOGLE_CLOUD_PROJECT_ID` | Optional | GCP project ID for Vertex AI |
| `GOOGLE_CLOUD_LOCATION` | Optional | Vertex AI region (default: `us-central1`) |
| `GOOGLE_VERTEX_MODEL` | Optional | Model name (default: `gemini-1.5-flash`) |
| `GOOGLE_APPLICATION_CREDENTIALS` | Optional | Path to GCP service account JSON |

---

## Credits & Assets

- **Pixel Art:** [Cozy Valley](https://iclaimthisname.itch.io/cozy-valley) by iclaimthisname — premium license. Includes tilesets, character sprites, animals, farm props, and environment art.
- **Music & SFX:** Royalty-free audio from [Mixkit](https://mixkit.co/) under the Mixkit License.
- **AI Development Tooling:** [Claude Code](https://claude.ai/claude-code) by Anthropic — used for game system architecture, UI implementation, audio management, quest wiring, and iterative development throughout the project.

---

## Team

| Name | University | Role |
|---|---|---|
| Hailey Cheng | City University of Hong Kong (CityUHK) | Full-stack, Game Design, AI Integration |
| Rabin Sarki | Hong Kong University of Science and Technology (HKUST) | Full-stack, Game Engine, Backend |

**Team Name:** Victoria Sister Fans Club

---

*Built with care at a hackathon. Mood is a reminder that your feelings deserve a garden.*
