# Mood — Cozy Emotional Farming Game

**Team:** Victoria Sister Fans Club &nbsp;·&nbsp; **Members:** Hailey Cheng (CityUHK) &nbsp;·&nbsp; Rabin Sarki (HKUST)

---

## What is Mood?

Mood is a cozy pixel art farming game where your garden grows from how you feel. Write a reflection in the Journal House, and AI reads the emotional tone — then a plant sprouts in your garden that matches it. Come back the next day and you'll see a little more colour than before.

We built it because journaling can feel like homework, and we wanted it to feel like tending something alive instead.

---

## Inspiration

We grew up playing Stardew Valley and Animal Crossing during stressful periods, and noticed how much a quiet game loop could calm the mind. We wondered: what if the game itself *was* the reflection? What if writing honestly about your day was the same act as planting a seed?

That idea became Mood.

---

## What It Does

You explore a small farm — walk to the barn to write in your journal, visit the duck pond for breathing exercises, talk to the NPCs. Each time you write, Google Cloud AI picks up on your emotional tone and grows a different plant: sunflowers for happy days, lavender when you're stressed, lotus for calm, daisies for gratitude. Over time your garden becomes a quiet picture of your emotional life.

---

## Key Features

### 🌱 AI Emotional Journaling
Write a short reflection inside the Journal House. Gemini reads the tone, picks a mood, and grows a matching plant in your garden. Five moods, five plant types, one growing garden.

### 🌸 A Garden That's Yours
- Happy → Sunflowers
- Grateful → Daisies
- Calm → Lotus flowers
- Stressed → Lavender
- Growing → Oak saplings

Plants go from seed to full bloom as your entries build up.

### 🐮 A Farm Worth Exploring
Walk around using WASD, chat with NPCs, discover the pond and the garden plots, and pick your avatar. It's deliberately unhurried.

### 🧘 Mindfulness at the Pond
Box breathing, body scan, and a 5-senses exercise — all tucked into the world naturally, not behind a separate menu.

### 🤖 Weekly Reflection
After enough entries the game generates a short AI reflection on your emotional week — patterns you might not have noticed, written gently.

### 🌿 It Rewards Rest
Plants grow a little faster when you return after a break. The game is genuinely happier when you step away.

---

## The Problem We Were Solving

Most mental health apps feel clinical. You open them, log a number, close them. The habit doesn't stick because there's nothing to come back *for*. We wanted the act of reflection to feel like something you tend — something that grows — so returning felt natural rather than obligatory.

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
- **Music & ambient** — [Mixkit](https://mixkit.co/) royalty-free library (Forest Mist Whispers, Nap Time, Nature Meditation).
- **Sound effects** — [SoundBible](https://soundbible.com/) (Temple Bell, Computer Magic) under CC and Public Domain licenses.
- **AI dev tooling** — [Claude Code](https://claude.ai/claude-code) by Anthropic.

---

## Team

**Victoria Sister Fans Club**

- Hailey Cheng — City University of Hong Kong (CityUHK)
- Rabin Sarki — Hong Kong University of Science and Technology (HKUST)

---

*Built at a hackathon. Your feelings deserve a garden.*
