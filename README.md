# Mood — Cozy Emotional Farming Game

**Team:** Victoria Sister Fans Club &nbsp;·&nbsp; **Members:** Hailey Cheng (CityUHK) &nbsp;·&nbsp; Rabin Sarki (HKUST)

---

## What is Mood?

Mood is a cozy pixel art farming game that helps you manage stress, stay emotionally balanced, and build a healthier relationship with technology — by turning daily journaling into something you actually want to do.

Write a reflection in the Journal House. AI reads the emotional tone and grows a plant in your garden that matches how you're feeling. Come back the next day and the garden will have grown a little more. Over time it becomes a quiet, living record of your inner life.

---

## The Problem

Stress, emotional imbalance, and screen fatigue are real and daily. The tools that exist to help — journaling apps, mindfulness timers, mood trackers — often feel clinical and transactional. People use them for a week, then stop. There's no reason to return.

We believe that's a design problem, not a habit problem.

**Mood** wraps the same healthy practices inside a cozy game world. Reflecting on your day feels like planting something. Breathing exercises happen by a quiet duck pond. The garden that grows is yours — shaped by your actual emotional patterns, not a generic progress bar.

The result is a tool for psychological well-being that you come back to because you want to, not because you scheduled a reminder.

---

## How It Supports Well-Being

### 🌱 Emotional Journaling That Feels Natural
Write freely inside the Journal House. Gemini reads your emotional tone — happiness, calm, stress, gratitude, growth — and a matching plant appears in your garden. No categories to select, no ratings to submit. Just writing.

### 🌸 A Garden That Reflects Your Mind
Your garden is a visual record of your emotional patterns over time:
- Happy days → Sunflowers
- Gratitude → Daisies
- Calm → Lotus flowers
- Stress → Lavender
- Personal growth → Oak saplings

Plants grow from seed to full bloom as your entries build up, so the garden always tells a real story.

### 🧘 Mindfulness Woven Into the World
Box breathing, body scan, and a 5-senses grounding exercise are built into the farm — not hidden behind a menu, but places you walk to. The pond is where you breathe. The world slows down when you're there.

### 🤖 Gentle AI Reflection
After enough journal entries, the game summarises your emotional week in a short, supportive paragraph — written by Gemini, never preachy. Just a gentle mirror.

### 🌿 It Rewards Stepping Away
Plants grow a little faster when you return after a real break. The game is designed to reward presence, not screen time. A healthier tech-life boundary built into the loop itself.

### 🐮 A World Worth Coming Back To
There are NPCs to talk to, quests to follow, and a farm to explore at your own pace. The cozy game layer isn't decoration — it's what makes the well-being practices feel worth returning to every day.

---

## Tech Stack

| | |
|---|---|
| Framework | [Next.js 14](https://nextjs.org/) (App Router) |
| Game Engine | [Phaser 3](https://phaser.io/) |
| Styling | [Tailwind CSS](https://tailwindcss.com/) |
| State | [Zustand](https://zustand-demo.pmnd.rs/) |
| AI | [Google Cloud Vertex AI](https://cloud.google.com/vertex-ai) — Gemini 1.5 Flash |
| Database | [Supabase](https://supabase.com/) |
| Deployment | [Vercel](https://vercel.com/) |
| Pixel Art | [Cozy Valley](https://iclaimthisname.itch.io/cozy-valley) by iclaimthisname (premium) |
| Dev Tooling | [Claude Code](https://claude.ai/claude-code) by Anthropic |

We used **Claude Code** throughout — for game architecture, the quest system, audio management, UI polish, and a lot of the iteration in between. It felt like pair programming with someone who never gets tired.

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

## Setup & Running It Locally

### Prerequisites
- Node.js 18+
- A Supabase project (totally optional — it runs fine without one)
- A Google Cloud project with Vertex AI enabled (or just flip `AI_MOCK_MODE=true` and skip it entirely)

### 1. Clone the repository

```bash
git clone https://github.com/heilcheng/Mood.git
cd Mood
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

```bash
cp .env.example .env.local
```

Then open `.env.local`. The only thing you need for a quick local run is:

```env
AI_MOCK_MODE=true
```

That's it. The game works fully without Supabase or Google Cloud. If you want the real AI and database, fill in the rest:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

GOOGLE_CLOUD_PROJECT_ID=your-gcp-project-id
GOOGLE_CLOUD_LOCATION=us-central1
GOOGLE_VERTEX_MODEL=gemini-1.5-flash
GOOGLE_APPLICATION_CREDENTIALS=./gcp-credentials.json
```

### 4. Set up the database (optional)

If you're using Supabase, paste the contents of `database/schema.sql` into your project's SQL editor and run it.

### 5. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and click around — audio starts on first interaction.

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

## Credits

- **Pixel art** — [Cozy Valley](https://iclaimthisname.itch.io/cozy-valley) by iclaimthisname, premium license. Tilesets, characters, animals, props, and all environment art.
- **Music & ambient** — Cozy piano farm theme (day BGM); [Mixkit](https://mixkit.co/) royalty-free library (Nap Time for night, Nature Meditation for ambient).
- **Sound effects** — [SoundBible](https://soundbible.com/) (Temple Bell, Computer Magic) under CC and Public Domain licenses.
- **AI dev tooling** — [Claude Code](https://claude.ai/claude-code) by Anthropic.

---

## Team

**Victoria Sister Fans Club**

- Hailey Cheng — City University of Hong Kong (CityUHK)
- Rabin Sarki — Hong Kong University of Science and Technology (HKUST)

---

*Built at a hackathon. Your feelings deserve a garden.*
