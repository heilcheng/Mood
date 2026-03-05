'use client'

import { useState, useEffect, useRef } from 'react'
import { useGameStore } from '@/lib/gameStore'
import { EventBridge } from '@/game/EventBridge'

type DialogNode = {
    text: string
    choices?: { label: string; nextNode: string }[]
    action?: 'close'
}

type NPCDialog = Record<string, DialogNode>

// ── Expanded NPC conversations ────────────────────────────────────────────────
const DIALOGS: Record<string, NPCDialog> = {
    guide: {
        start: {
            text: "Welcome to Mindful Farm. It's so good to see you here.",
            choices: [
                { label: "What is this place?", nextNode: 'explain' },
                { label: "I just want to relax.", nextNode: 'relax' },
                { label: "How does the farm help?", nextNode: 'howHelps' },
                { label: "I'm feeling stressed today.", nextNode: 'stressed' },
                { label: "What should I do first?", nextNode: 'doFirst' },
            ]
        },
        explain: {
            text: "This is a space just for you. The barn holds a journal — write your feelings and watch a plant grow from them. The pond is perfect for quiet breathing exercises.",
            choices: [
                { label: "That sounds lovely.", nextNode: 'lovely' },
                { label: "Tell me about the journal.", nextNode: 'journal' },
                { label: "Tell me about breathing.", nextNode: 'breathing' },
            ]
        },
        lovely: {
            text: "It really is. The farm grows with you. Every feeling you pour into it becomes something beautiful.",
            action: 'close'
        },
        journal: {
            text: "The barn is your safe space. Write honestly — there's no wrong way to feel. Every entry plants a seed in your garden.",
            action: 'close'
        },
        breathing: {
            text: "By the duck pond, you can practice box breathing. Breathe in for 4 counts, hold for 4, out for 4, hold for 4. Your whole nervous system will thank you.",
            action: 'close'
        },
        relax: {
            text: "Then you're in exactly the right spot. Take your time. There's no rush here — the cows have been patient their whole lives.",
            action: 'close'
        },
        howHelps: {
            text: "Tending something outside yourself — even a virtual garden — has a way of quieting the noise inside. It's not magic. It's just focus, care, and a little fresh air.",
            choices: [
                { label: "That makes sense.", nextNode: 'makesSense' },
                { label: "I'm a bit skeptical.", nextNode: 'skeptical' },
            ]
        },
        makesSense: {
            text: "Good. Let your hands be busy so your mind can rest.",
            action: 'close'
        },
        skeptical: {
            text: "Ha! Healthy skepticism. Give it a few days. Even the most restless mind finds something soothing about watching seeds grow.",
            action: 'close'
        },
        stressed: {
            text: "I'm really glad you're here. First — breathe. Slowly. You don't have to fix anything right now. This place will still be here when you exhale.",
            choices: [
                { label: "I needed to hear that.", nextNode: 'neededToHear' },
                { label: "It's been a lot lately.", nextNode: 'beenLot' },
            ]
        },
        neededToHear: {
            text: "Of course. That's what I'm here for. Come find me whenever things feel heavy.",
            action: 'close'
        },
        beenLot: {
            text: "I know. Life has a way of piling up. The journal in the barn helps most on days like those. Just getting words out — even messy ones — can loosen the weight a little.",
            action: 'close'
        },
        doFirst: {
            text: "If your mind is busy, write it down in the barn first. Then visit the pond to breathe. Then just walk around and let the quiet do its work.",
            action: 'close'
        },
    },

    gardener: {
        start: {
            text: "Ah, hello there! Taking a moment to breathe the fresh air?",
            choices: [
                { label: "Yes, it's lovely out.", nextNode: 'nice' },
                { label: "My mind is a bit full.", nextNode: 'full' },
                { label: "What are you growing?", nextNode: 'growing' },
                { label: "Any gardening tips?", nextNode: 'tips' },
                { label: "Do plants really grow from feelings?", nextNode: 'feelings' },
            ]
        },
        nice: {
            text: "Isn't it? Every time you write down your feelings in the barn, I'll help you plant a new seed. Honesty makes the best fertilizer — trust me on that.",
            action: 'close'
        },
        full: {
            text: "That happens to the best of us. Walk down to the duck pond. A few minutes of quiet breathing can clear the clouds away. The ducks don't judge.",
            action: 'close'
        },
        growing: {
            text: "Ooh, let's see — sunflowers for joy, lavender for calm, lotus for gratitude... Each plant here came from a real feeling someone wrote down. Isn't that wonderful?",
            choices: [
                { label: "What plant does worry grow?", nextNode: 'worry' },
                { label: "That's so beautiful.", nextNode: 'beautiful' },
            ]
        },
        worry: {
            text: "Worry? That usually grows into an oak sapling. Sturdy, a little prickly at first — but it becomes something that gives shade to everyone nearby. Not so bad, eh?",
            action: 'close'
        },
        beautiful: {
            text: "I think so too! Every feeling has a home in this garden. Even the hard ones belong here.",
            action: 'close'
        },
        tips: {
            text: "Tip one: show up. Tip two: be honest. Tip three: don't compare your garden to anyone else's. Everyone grows at their own pace.",
            choices: [
                { label: "What's tip number four?", nextNode: 'tip4' },
                { label: "That's really wise.", nextNode: 'wise' },
            ]
        },
        tip4: {
            text: "Water yourself first. You can't pour from an empty watering can. Take care of you, and the garden follows.",
            action: 'close'
        },
        wise: {
            text: "Twenty years of talking to plants will do that to you! They're very good listeners, by the way.",
            action: 'close'
        },
        feelings: {
            text: "Absolutely! The soil here is special — it responds to emotion. Write something true in the barn, and something true will grow.",
            choices: [
                { label: "Even bad feelings?", nextNode: 'badFeelings' },
                { label: "I'll give it a try.", nextNode: 'giveTry' },
            ]
        },
        badFeelings: {
            text: "Especially the hard ones. Stress grows resilient roots. Sadness brings flowers with the deepest colors. Nothing is wasted here.",
            action: 'close'
        },
        giveTry: {
            text: "That's the spirit! Come back and show me what blooms.",
            action: 'close'
        },
    },

    neighbor: {
        start: {
            text: "Well hey. Don't see many new faces around this quiet corner.",
            choices: [
                { label: "How long have you been here?", nextNode: 'long' },
                { label: "Just enjoying the view.", nextNode: 'view' },
                { label: "What do you do all day?", nextNode: 'day' },
                { label: "Any advice for a newcomer?", nextNode: 'advice' },
                { label: "You seem very relaxed.", nextNode: 'relaxed' },
            ]
        },
        long: {
            text: "Oh, seasons on top of seasons. The secret to a good farm — and a good life — is just showing up, even on the cloudy days. You'll see.",
            action: 'close'
        },
        view: {
            text: "It's a good view. Best enjoyed slowly. Pull up a patch of grass. Stay a while.",
            action: 'close'
        },
        day: {
            text: "Oh, you know. Walk around. Watch the cows. Argue with a chicken occasionally. Think about things. Think about nothing. It's a full schedule.",
            choices: [
                { label: "That sounds perfect.", nextNode: 'perfect' },
                { label: "What do you think about?", nextNode: 'think' },
            ]
        },
        perfect: {
            text: "It is. Though I didn't always think so. Used to be in a terrible hurry. Took me years to realize nobody was actually chasing me.",
            action: 'close'
        },
        think: {
            text: "Sometimes the weather. Sometimes old memories. Sometimes absolutely nothing — and that's the best kind of thinking there is.",
            action: 'close'
        },
        advice: {
            text: "Don't try to fix everything at once. Pick one small thing. Do that thing. Then rest. That's a good day.",
            choices: [
                { label: "Simple but true.", nextNode: 'simpleTruth' },
                { label: "What's your one small thing today?", nextNode: 'smallThing' },
            ]
        },
        simpleTruth: {
            text: "The best things usually are.",
            action: 'close'
        },
        smallThing: {
            text: "Watched a caterpillar cross the path this morning. Made sure nobody stepped on it. Day's work done.",
            action: 'close'
        },
        relaxed: {
            text: "Ha. Took long enough. I spent years thinking I needed to be somewhere else, doing something important. Turns out the important stuff was here the whole time.",
            choices: [
                { label: "How did you figure that out?", nextNode: 'figuredOut' },
                { label: "I'm still learning that.", nextNode: 'stillLearning' },
            ]
        },
        figuredOut: {
            text: "The cows helped, honestly. They don't worry about tomorrow's grass. They just eat the grass that's in front of them today. Smart animals.",
            action: 'close'
        },
        stillLearning: {
            text: "Good. That means you're paying attention. Keep coming around — this place has a way of teaching you things you weren't looking to learn.",
            action: 'close'
        },
    }
}

const NPC_NAMES: Record<string, string> = {
    guide: 'River',
    gardener: 'Fern',
    neighbor: 'Silas'
}

const NPC_TITLES: Record<string, string> = {
    guide: 'Guide',
    gardener: 'Gardener',
    neighbor: 'Neighbor'
}

// ── TTS voice profiles ────────────────────────────────────────────────────────
// Each NPC has a distinct personality expressed through voice parameters.
type VoiceProfile = { rate: number; pitch: number; preferFemale: boolean }

const VOICE_PROFILES: Record<string, VoiceProfile> = {
    guide: { rate: 0.88, pitch: 1.10, preferFemale: true }, // River: calm, warm
    gardener: { rate: 0.95, pitch: 1.20, preferFemale: true }, // Fern: cheerful, bright
    neighbor: { rate: 0.82, pitch: 0.85, preferFemale: false }, // Silas: laid-back, deep
}

function speakText(text: string, npcId: string) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    const profile = VOICE_PROFILES[npcId] ?? { rate: 0.9, pitch: 1.0, preferFemale: true }

    utterance.rate = profile.rate
    utterance.pitch = profile.pitch
    utterance.volume = 0.9

    // Pick the best available voice for this NPC
    const voices = window.speechSynthesis.getVoices()
    if (voices.length > 0) {
        const englishVoices = voices.filter(v => v.lang.startsWith('en'))
        const femaleKeywords = ['samantha', 'karen', 'moira', 'victoria', 'allison', 'susan', 'kate', 'fiona', 'tessa']
        const maleKeywords = ['daniel', 'alex', 'tom', 'james', 'fred', 'ralph', 'bruce', 'junior']
        const keywords = profile.preferFemale ? femaleKeywords : maleKeywords

        const match = englishVoices.find(v => keywords.some(k => v.name.toLowerCase().includes(k)))
            ?? englishVoices.find(v => {
                // Heuristic: female voices often have higher default pitch names
                return profile.preferFemale
                    ? !maleKeywords.some(k => v.name.toLowerCase().includes(k))
                    : maleKeywords.some(k => v.name.toLowerCase().includes(k))
            })
            ?? englishVoices[0]
            ?? voices[0]

        if (match) utterance.voice = match
    }

    window.speechSynthesis.speak(utterance)
}

// ── Main component ────────────────────────────────────────────────────────────
export function DialogOverlay() {
    const [npcId, setNpcId] = useState<string | null>(null)
    const [currentNode, setCurrentNode] = useState<string>('start')
    const [displayedText, setDisplayedText] = useState('')
    const [isTyping, setIsTyping] = useState(false)
    const { setQuestNotification } = useGameStore()

    const textIndexRef = useRef(0)
    const typeTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

    // Listen for talk events from Phaser
    useEffect(() => {
        const cleanup = EventBridge.on('talkNPC', ({ npcId }) => {
            if (DIALOGS[npcId]) {
                setNpcId(npcId)
                setCurrentNode('start')
            }
        })
        return cleanup
    }, [])

    // Typewriter effect + speak on new dialog node
    useEffect(() => {
        if (!npcId) return
        const dialog = DIALOGS[npcId]?.[currentNode]
        if (!dialog) return

        setDisplayedText('')
        setIsTyping(true)
        textIndexRef.current = 0

        // Speak the full line (runs alongside typewriter)
        speakText(dialog.text, npcId)

        if (typeTimerRef.current) clearInterval(typeTimerRef.current)
        typeTimerRef.current = setInterval(() => {
            textIndexRef.current += 1
            setDisplayedText(dialog.text.slice(0, textIndexRef.current))
            if (textIndexRef.current >= dialog.text.length) {
                setIsTyping(false)
                if (typeTimerRef.current) clearInterval(typeTimerRef.current)
            }
        }, 28)

        return () => {
            if (typeTimerRef.current) clearInterval(typeTimerRef.current)
        }
    }, [npcId, currentNode])

    // Stop speech when dialog closes
    useEffect(() => {
        if (!npcId && typeof window !== 'undefined' && 'speechSynthesis' in window) {
            window.speechSynthesis.cancel()
        }
    }, [npcId])

    // Voices may not be loaded immediately — reload on voiceschanged
    useEffect(() => {
        if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
        window.speechSynthesis.getVoices() // trigger load
    }, [])

    const handleNext = (nextNode?: string, action?: string) => {
        if (action === 'close' || !nextNode) { closeDialog(); return }
        setCurrentNode(nextNode)
    }

    const closeDialog = () => {
        setNpcId(null)
        setCurrentNode('start')
        const phaserInstance = (window as any).PHASER_GAME as Phaser.Game
        if (phaserInstance?.input.keyboard) phaserInstance.input.keyboard.enabled = true
    }

    // Disable Phaser keyboard while dialog is open
    useEffect(() => {
        const phaserInstance = (window as any).PHASER_GAME as Phaser.Game
        if (!phaserInstance?.input.keyboard) return
        phaserInstance.input.keyboard.enabled = !npcId
        if (npcId) {
            const scene = phaserInstance.scene.getScene('FarmScene') as any
            if (scene?.player) {
                scene.player.body.setVelocity(0, 0)
                scene.player.playAnim('idle', scene.player.getFacing())
            }
        }
    }, [npcId])

    if (!npcId) return null
    const d = DIALOGS[npcId]?.[currentNode]
    if (!d) return null
    const isComplete = !isTyping

    return (
        <div className="fixed inset-0 z-[800] flex items-end justify-center pb-12 px-6 pointer-events-none">

            {/* Click-to-skip typing */}
            {isTyping && (
                <div
                    className="absolute inset-0 pointer-events-auto cursor-pointer"
                    onClick={() => {
                        if (typeTimerRef.current) clearInterval(typeTimerRef.current)
                        setDisplayedText(d.text)
                        setIsTyping(false)
                    }}
                />
            )}

            {/* Dialog box */}
            <div
                className="relative w-full max-w-2xl pointer-events-auto rounded-[24px] md:rounded-[32px] p-5 md:p-8 animate-slideUpFade shadow-2xl"
                style={{
                    background: 'rgba(250, 246, 237, 0.95)',
                    border: '4px solid #8b7355',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.15), inset 0 2px 0 rgba(255,255,255,0.5)'
                }}
            >
                {/* Name tag */}
                <div
                    className="absolute -top-8 left-10 flex items-baseline gap-2 rounded-2xl px-6 py-2 shadow-sm"
                    style={{ background: '#6e5a40', border: '3px solid #fdfbf7' }}
                >
                    <span className="font-bold text-[#fdfbf7] tracking-wider text-base">
                        {NPC_NAMES[npcId] ?? 'Villager'}
                    </span>
                    <span className="text-[#d4c5a9] text-xs font-medium">
                        {NPC_TITLES[npcId]}
                    </span>
                </div>

                {/* Text body */}
                <div className="min-h-[80px] md:min-h-[90px] pt-3 md:pt-4">
                    <p className="text-lg md:text-2xl font-semibold text-[#4a3e2e] leading-relaxed">
                        {displayedText}
                        {isTyping && <span className="animate-pulse">▌</span>}
                    </p>
                </div>

                {/* Choices / Continue */}
                {isComplete && (
                    <div className="mt-6 md:mt-8 flex flex-col gap-2 md:gap-3 animate-fadeIn">
                        {d.choices ? (
                            d.choices.map((c, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleNext(c.nextNode)}
                                    className="px-4 py-2 md:px-6 md:py-3 rounded-xl bg-[#e3d8c5] hover:bg-[#d4c5a9] text-[#4a3e2e] font-bold text-base md:text-lg border-2 border-[#bfae91] active:scale-95 transition-all text-left"
                                >
                                    ›&nbsp;&nbsp;{c.label}
                                </button>
                            ))
                        ) : (
                            <button
                                onClick={() => handleNext(undefined, d.action ?? 'close')}
                                className="self-end flex items-center gap-2 px-4 py-2 md:px-6 md:py-3 rounded-full bg-[#8b7355] text-white hover:bg-[#6e5a40] font-bold text-base md:text-lg active:scale-95 transition-all"
                            >
                                Continue <span className="text-lg md:text-xl">▼</span>
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
