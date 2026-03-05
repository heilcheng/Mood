import type { AnalyzeResult, Mood, ToneColor, WeeklySummary, JournalEntry } from './types'

const CRISIS_PATTERNS = [
  /\b(suicid|kill myself|end my life|self.harm|hurt myself|don't want to live|want to die)\b/i,
]

function detectCrisis(text: string): boolean {
  return CRISIS_PATTERNS.some((p) => p.test(text))
}

const CRISIS_RESPONSE: AnalyzeResult = {
  mood: 'crisis',
  confidence: 1,
  tags: ['support', 'care'],
  short_reflection_prompt: "You are not alone. Please reach out to someone you trust, or contact a crisis line.",
  tone_color: 'soft_blue',
}

const MOOD_KEYWORDS: Array<{ keywords: string[]; mood: Mood; color: ToneColor }> = [
  { keywords: ['joy', 'happy', 'excited', 'wonderful', 'great', 'amazing', 'love', 'laugh', 'smile', 'delight'], mood: 'happy', color: 'sunny' },
  { keywords: ['thank', 'grateful', 'gratitude', 'appreciate', 'blessed', 'fortunate', 'thankful'], mood: 'gratitude', color: 'warm' },
  { keywords: ['calm', 'peace', 'serene', 'quiet', 'relax', 'still', 'tranquil', 'rest', 'breathe'], mood: 'calm', color: 'soft_blue' },
  { keywords: ['stress', 'anxi', 'tired', 'overwhelm', 'worry', 'nervous', 'fear', 'dread', 'exhaust', 'pressure'], mood: 'stressed', color: 'lavender' },
  { keywords: ['learn', 'grow', 'change', 'progress', 'improve', 'develop', 'goal', 'forward', 'new', 'discover'], mood: 'growth', color: 'fresh_green' },
]

const REFLECTION_PROMPTS: Record<Mood, string> = {
  happy: "What made this moment feel so bright? How can you carry this warmth forward?",
  gratitude: "Who or what are you most grateful for today, and why?",
  calm: "What helped you find this stillness? How does it feel in your body?",
  stressed: "What is one small thing you can release right now? You've handled hard days before.",
  growth: "What new insight are you discovering about yourself on this journey?",
  crisis: "You are not alone. Please reach out to someone you trust or a crisis line.",
}

export function mockAnalyze(text: string, overrideMood?: string): AnalyzeResult {
  if (detectCrisis(text)) return CRISIS_RESPONSE

  const lower = text.toLowerCase()
  let bestMood: Mood = 'calm'
  let bestColor: ToneColor = 'soft_blue'
  let bestScore = 0

  for (const { keywords, mood, color } of MOOD_KEYWORDS) {
    const score = keywords.filter((k) => lower.includes(k)).length
    if (score > bestScore) {
      bestScore = score
      bestMood = mood
      bestColor = color
    }
  }

  // Honour the user's explicit mood choice
  if (overrideMood && overrideMood in REFLECTION_PROMPTS) {
    bestMood = overrideMood as Mood
    const found = MOOD_KEYWORDS.find(m => m.mood === bestMood)
    if (found) bestColor = found.color
  }

  const tags = extractTags(lower)

  return {
    mood: bestMood,
    confidence: bestScore > 0 ? Math.min(0.6 + bestScore * 0.1, 0.95) : 0.75,
    tags,
    short_reflection_prompt: REFLECTION_PROMPTS[bestMood],
    tone_color: bestColor,
  }
}

function extractTags(text: string): string[] {
  const tagWords = [
    'nature', 'family', 'work', 'health', 'friends', 'music', 'art', 'food',
    'sleep', 'exercise', 'meditation', 'travel', 'book', 'garden', 'weather',
  ]
  return tagWords.filter((t) => text.includes(t)).slice(0, 4)
}

export async function aiAnalyze(text: string, overrideMood?: string): Promise<AnalyzeResult> {
  if (detectCrisis(text)) return CRISIS_RESPONSE

  const isMockMode =
    process.env.AI_MOCK_MODE === 'true' ||
    !process.env.GOOGLE_CLOUD_PROJECT_ID

  if (isMockMode) {
    return mockAnalyze(text, overrideMood)
  }

  try {
    const { PredictionServiceClient } = await import('@google-cloud/aiplatform')
    const { helpers } = await import('@google-cloud/aiplatform')

    const client = new PredictionServiceClient({
      apiEndpoint: `${process.env.GOOGLE_CLOUD_LOCATION}-aiplatform.googleapis.com`,
    })

    const model = process.env.GOOGLE_VERTEX_MODEL || 'gemini-1.5-flash'
    const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID
    const location = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1'
    const endpoint = `projects/${projectId}/locations/${location}/publishers/google/models/${model}`

    const systemPrompt = `You are a compassionate emotion analyst for a mindfulness journal app.
Analyze the journal entry and return ONLY a JSON object with these exact fields:
{
  "mood": one of: "happy", "gratitude", "calm", "stressed", "growth",
  "confidence": number 0-1,
  "tags": array of 1-4 short topic strings,
  "short_reflection_prompt": a gentle 1-2 sentence reflection question,
  "tone_color": one of: "sunny", "warm", "soft_blue", "lavender", "fresh_green"
}
Never diagnose. Be compassionate and non-clinical. Return only valid JSON.`

    const manualMoodInstruction = overrideMood
      ? `The user explicitly stated they are feeling: "${overrideMood}". Please tailor the prompt and color strongly to this feeling, and set "mood" to "${overrideMood}".\n\n`
      : ''

    const prompt = `${systemPrompt}\n\n${manualMoodInstruction}Journal entry: "${text}"`

    const instance = helpers.toValue({ prompt })
    const parameters = helpers.toValue({ temperature: 0.3, maxOutputTokens: 256 })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [response] = await (client as any).predict({
      endpoint,
      instances: [instance],
      parameters,
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const prediction = (response as any).predictions?.[0]
    if (!prediction) throw new Error('No prediction returned')

    const predValue = helpers.fromValue(prediction)
    const content = typeof predValue === 'string' ? predValue : JSON.stringify(predValue)
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON in response')

    const parsed = JSON.parse(jsonMatch[0])
    return {
      mood: parsed.mood || 'calm',
      confidence: parsed.confidence || 0.7,
      tags: parsed.tags || [],
      short_reflection_prompt: parsed.short_reflection_prompt || REFLECTION_PROMPTS['calm'],
      tone_color: parsed.tone_color || 'soft_blue',
    }
  } catch (err) {
    console.error('Vertex AI error, falling back to mock:', err)
    return mockAnalyze(text)
  }
}

export async function generateWeeklySummary(
  entries: JournalEntry[]
): Promise<WeeklySummary> {
  const isMockMode =
    process.env.AI_MOCK_MODE === 'true' ||
    !process.env.GOOGLE_CLOUD_PROJECT_ID

  if (isMockMode || entries.length === 0) {
    return mockWeeklySummary(entries)
  }

  try {
    const { PredictionServiceClient } = await import('@google-cloud/aiplatform')
    const { helpers } = await import('@google-cloud/aiplatform')

    const client = new PredictionServiceClient({
      apiEndpoint: `${process.env.GOOGLE_CLOUD_LOCATION}-aiplatform.googleapis.com`,
    })

    const model = process.env.GOOGLE_VERTEX_MODEL || 'gemini-1.5-flash'
    const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID
    const location = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1'
    const endpoint = `projects/${projectId}/locations/${location}/publishers/google/models/${model}`

    const entrySummaries = entries
      .map((e, i) => `Entry ${i + 1} (${e.mood}): ${e.text.substring(0, 150)}`)
      .join('\n')

    const prompt = `You are a gentle mindfulness coach. Here are a user's journal entries from this week:

${entrySummaries}

Write a warm, encouraging weekly narrative insight as JSON:
{
  "summary": "2-3 sentence narrative about their week's emotional journey",
  "highlights": ["3 positive observations or patterns"],
  "suggested_focus": "one gentle focus area for next week"
}
Return only valid JSON. Be kind, non-clinical, and affirming.`

    const instance = helpers.toValue({ prompt })
    const parameters = helpers.toValue({ temperature: 0.5, maxOutputTokens: 512 })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [response] = await (client as any).predict({
      endpoint,
      instances: [instance],
      parameters,
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const prediction = (response as any).predictions?.[0]
    if (!prediction) throw new Error('No prediction')

    const predValue = helpers.fromValue(prediction)
    const content = typeof predValue === 'string' ? predValue : JSON.stringify(predValue)
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON')

    const parsed = JSON.parse(jsonMatch[0])
    return {
      summary: parsed.summary || '',
      highlights: parsed.highlights || [],
      suggested_focus: parsed.suggested_focus || 'Continue your daily reflection practice',
    }
  } catch (err) {
    console.error('Weekly summary AI error:', err)
    return mockWeeklySummary(entries)
  }
}

function mockWeeklySummary(entries: JournalEntry[]): WeeklySummary {
  if (entries.length === 0) {
    return {
      summary: "Your garden is waiting for its first seeds. Start writing to see your emotional landscape bloom.",
      highlights: ["Every journey begins with a single step", "Your mindfulness practice is just beginning"],
      suggested_focus: "Write your first journal entry this week",
    }
  }

  const moodCounts: Record<string, number> = {}
  entries.forEach((e) => {
    moodCounts[e.mood] = (moodCounts[e.mood] || 0) + 1
  })

  const dominantMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'calm'

  const moodNarrative: Record<string, string> = {
    happy: "This week radiated with brightness and joy.",
    gratitude: "Gratitude wove through your week like golden threads.",
    calm: "A peaceful stillness marked your week's journey.",
    stressed: "This week held some challenges, and you showed real courage in facing them.",
    growth: "This week was a week of beautiful growth and discovery.",
  }

  return {
    summary: `${moodNarrative[dominantMood] || "Your week held many feelings."} You reflected ${entries.length} time${entries.length !== 1 ? 's' : ''}, tending your inner garden with care. Each entry is a seed of self-awareness taking root.`,
    highlights: [
      `You showed up for yourself ${entries.length} time${entries.length !== 1 ? 's' : ''} this week`,
      `Your most frequent feeling was ${dominantMood}, which is always worth honoring`,
      `Each reflection you wrote is growing into something beautiful in your garden`,
    ],
    suggested_focus: dominantMood === 'stressed'
      ? "Practice one breathing exercise each morning this coming week"
      : "Continue nurturing your daily reflection habit — it's working",
  }
}
