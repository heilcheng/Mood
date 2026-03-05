# Mindful Farm

A cozy mindfulness farming game where you grow a pixel-art garden by writing reflective journal entries. AI classifies your emotions and maps them to plants.

## Quick Start

```bash
cd MindfulFarm
cp .env.example .env.local
# Fill in your Supabase credentials (or leave AI_MOCK_MODE=true for testing)
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Features

- **Journal → Garden**: Write reflections, AI classifies emotions, plants grow
- **5 Plant Types**: Sunflower (happy), Daisy (gratitude), Lotus (calm), Lavender (stressed), Oak Sapling (growth)
- **Breathing Mini-game**: 4-7-8 breathing cycles with calmness score
- **Weather System**: Mood-driven weather (sunshine, cloudy, rainbow, night)
- **Day/Night Cycle**: Dynamic lighting with fireflies at night
- **Quest System**: 5 quests to guide new players
- **Weekly Insights**: AI narrative summary of your emotional week
- **Garden Unlocks**: Butterflies (3 entries), Lanterns (7), Fireflies (14), New patch (21)

## Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side) |
| `AI_MOCK_MODE` | Set to `true` to use keyword heuristic instead of Vertex AI |
| `GOOGLE_CLOUD_PROJECT_ID` | GCP project (for Vertex AI) |
| `GOOGLE_APPLICATION_CREDENTIALS` | Path to GCP service account JSON |

## Database Setup

Run `database/schema.sql` in your Supabase SQL editor.

## Game Controls

| Key | Action |
|-----|--------|
| WASD / Arrow Keys | Move |
| E | Interact with nearby object/NPC |
| J | Open journal anywhere |
| Esc | Close modals |
| Shift + Move | Sprint |

## Mock Mode

With `AI_MOCK_MODE=true`, no Google Cloud credentials needed. The keyword heuristic analyzes entries locally.
