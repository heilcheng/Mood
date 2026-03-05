'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient, isSupabaseConfigured } from '@/lib/supabase'
import { useGameStore } from '@/lib/gameStore'
import { SettingsModal } from './SettingsModal'
import type { AvatarChoice } from '@/lib/types'

type Screen = 'landing' | 'pick' | 'signin'

const AVATARS: Array<{
  key: AvatarChoice
  label: string
  description: string
  sprite: string       // path to sprite sheet
  frameY: number       // pixel Y of the south-facing idle frame row
  color: string        // accent glow color
}> = [
    {
      key: 'farmer_girl',
      label: 'Farmer Rose',
      description: 'Thoughtful & nurturing\nA gentle heart for your farm.',
      sprite: '/assets/CozyValley/Characters/-- Pre-assembled Characters/char1.png',
      frameY: 0,
      color: '#ff8fab',
    },
    {
      key: 'farmer_boy',
      label: 'Farmer Sol',
      description: 'Calm & steady\nA grounded soul in the wild.',
      sprite: '/assets/CozyValley/Characters/-- Pre-assembled Characters/char3.png',
      frameY: 0,
      color: '#7eb8f7',
    },
    {
      key: 'cow',
      label: 'Clovis the Cow',
      description: 'Playful & curious\nBring joy to every pasture.',
      sprite: '/assets/CozyValley/Characters/-- Pre-assembled Characters/char7.png',
      frameY: 0,
      color: '#f7c07e',
    },
  ]

/* Extract a single 48×48 sprite crop from the sprite sheet */
function AvatarSprite({ src, size = 96 }: { src: string; size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const img = new Image()
    img.src = src
    img.onload = () => {
      // Each frame is 48×48 in the sprite sheet; row 0 col 0 = south idle
      ctx.clearRect(0, 0, size, size)
      ctx.imageSmoothingEnabled = false
      ctx.drawImage(img, 0, 0, 48, 48, 0, 0, size, size)
    }
  }, [src, size])

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      style={{ imageRendering: 'pixelated', width: size, height: size }}
    />
  )
}

export function MainMenu() {
  const router = useRouter()
  const { setUserId, setAvatar, setDisplayName } = useGameStore()

  const [screen, setScreen] = useState<Screen>('landing')
  const [selected, setSelected] = useState<AvatarChoice>('farmer_girl')
  const [session, setSession] = useState<{ user: { id: string; email?: string } } | null>(null)
  const [email, setEmail] = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const [authMessage, setAuthMessage] = useState<string | null>(null)
  const [checkingSession, setCheckingSession] = useState(true)
  const [showSettings, setShowSettings] = useState(false)
  const supabaseEnabled = isSupabaseConfigured()

  useEffect(() => {
    if (!supabaseEnabled) { setCheckingSession(false); return }
    const supabase = createClient()
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setSession(data.session)
        setUserId(data.session.user.id)
        setDisplayName(data.session.user.email?.split('@')[0] || null)
      }
      setCheckingSession(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, sess) => {
      setSession(sess)
      if (sess) {
        setUserId(sess.user.id)
        setDisplayName(sess.user.email?.split('@')[0] || null)
      }
    })
    return () => subscription.unsubscribe()
  }, [supabaseEnabled, setUserId, setDisplayName])

  const handleSignIn = async () => {
    if (!email.trim()) return
    setAuthLoading(true)
    setAuthMessage(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/game` },
    })
    setAuthLoading(false)
    setAuthMessage(error ? `Error: ${error.message}` : 'Check your email for a magic link! 🌱')
  }

  const handleEnterFarm = () => {
    setAvatar(selected)
    router.push('/game')
  }

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    setSession(null)
    setUserId(null)
  }

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(to bottom, #87ceeb, #90c27a)' }}>
        <div className="w-10 h-10 border-4 border-white/60 border-t-white rounded-full animate-spin" />
      </div>
    )
  }

  const selectedAvatar = AVATARS.find(a => a.key === selected)!

  return (
    <div className="relative min-h-screen overflow-hidden" style={{ background: 'linear-gradient(to bottom, #c9e8f7 0%, #87ceeb 30%, #b5d99c 65%, #8bc34a 100%)' }}>

      {/* ── Parallax sky & sun ── */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Sun */}
        <div className="absolute top-8 right-16 w-20 h-20 rounded-full"
          style={{ background: 'radial-gradient(circle, #fffde7 30%, #fff9c4 60%, transparent 100%)', boxShadow: '0 0 60px 30px #ffeb3b44' }} />

        {/* Clouds */}
        {[
          { w: 120, h: 45, top: '8%', left: '5%', delay: 0 },
          { w: 160, h: 55, top: '12%', left: '35%', delay: 1.5 },
          { w: 100, h: 38, top: '6%', left: '68%', delay: 0.7 },
          { w: 80, h: 32, top: '18%', left: '80%', delay: 2 },
        ].map((c, i) => (
          <div key={i} className="absolute rounded-full animate-float"
            style={{ width: c.w, height: c.h, top: c.top, left: c.left, background: 'rgba(255,255,255,0.82)', filter: 'blur(6px)', animationDelay: `${c.delay}s` }} />
        ))}

        {/* Far green hills */}
        <div className="absolute bottom-0 left-0 right-0 h-64 rounded-t-full"
          style={{ background: 'linear-gradient(to top, #6aaf3a 0%, transparent 100%)', transform: 'scaleX(1.5)' }} />

        {/* Fence silhouette row */}
        <div className="absolute bottom-28 left-0 right-0 flex gap-3 px-4 opacity-50">
          {Array.from({ length: 28 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div className="w-3 h-12 rounded-sm" style={{ background: '#c8a97e' }} />
              <div className="w-3 h-10 rounded-sm" style={{ background: '#b89060' }} />
            </div>
          ))}
        </div>

        {/* Foreground grass & flowers */}
        <div className="absolute bottom-0 left-0 right-0 h-28"
          style={{ background: 'linear-gradient(to top, #5a9e30 0%, #7bc142 70%, transparent 100%)' }} />
        {['🌻', '🌼', '🌷', '🌸', '🌺', '🌼', '🌻'].map((f, i) => (
          <div key={i} className="absolute text-4xl animate-float select-none"
            style={{ bottom: `${6 + (i % 3) * 3}%`, left: `${4 + i * 13}%`, animationDelay: `${i * 0.6}s`, fontSize: '2.2rem' }}>
            {f}
          </div>
        ))}

        {/* Farm animals dot the scene */}
        {['🐄', '🐔', '🦆', '🐑'].map((a, i) => (
          <div key={i} className="absolute text-3xl select-none opacity-70 animate-float"
            style={{ bottom: `${15 + (i % 2) * 5}%`, left: `${12 + i * 22}%`, animationDelay: `${i * 1.1 + 0.3}s` }}>
            {a}
          </div>
        ))}
      </div>

      {/* ── TOP BAR ── */}
      <div className="relative z-20 flex justify-between items-center px-6 pt-5">
        <p className="text-white/70 text-sm font-medium tracking-wide drop-shadow">
          🌱 Mindful Farm
        </p>
        <button
          onClick={() => setShowSettings(true)}
          className="text-white/60 hover:text-white/90 text-sm transition-colors drop-shadow"
        >
          ⚙️ Settings
        </button>
      </div>

      {/* ═══════════════════════════════ LANDING SCREEN ═══════════════════════════════ */}
      {screen === 'landing' && (
        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen pb-20 gap-10 px-6">

          {/* Hero title */}
          <div className="text-center mt-[-60px]">
            <h1 className="text-7xl font-bold drop-shadow-2xl leading-tight"
              style={{ color: '#fff', textShadow: '0 4px 30px rgba(0,0,0,0.25), 0 1px 4px rgba(0,0,0,0.18)', fontFamily: 'Georgia, serif' }}>
              Mindful Farm
            </h1>
            <p className="text-white/90 text-xl mt-3 font-medium drop-shadow"
              style={{ textShadow: '0 2px 10px rgba(0,0,0,0.2)' }}>
              Grow your garden, one reflection at a time.
            </p>
          </div>

          {/* Glass card */}
          <div className="w-full max-w-sm flex flex-col gap-4"
            style={{ background: 'rgba(255,255,255,0.22)', backdropFilter: 'blur(20px)', borderRadius: 24, border: '1.5px solid rgba(255,255,255,0.45)', padding: '32px 28px', boxShadow: '0 12px 60px rgba(0,0,0,0.12)' }}>

            {supabaseEnabled && session ? (
              <>
                <p className="text-white text-base font-semibold text-center drop-shadow">
                  Welcome back, {session.user.email?.split('@')[0] || 'Farmer'}! 🌿
                </p>

                <button onClick={() => setScreen('pick')}
                  className="w-full py-4 rounded-2xl text-white text-lg font-bold transition-all active:scale-95"
                  style={{ background: 'linear-gradient(135deg, #6abf69, #4caf50)', boxShadow: '0 6px 20px rgba(76,175,80,0.4)' }}>
                  🌾 New Garden
                </button>

                <button onClick={() => router.push('/game')}
                  className="w-full py-3 rounded-2xl text-white text-base font-semibold transition-all active:scale-95"
                  style={{ background: 'rgba(255,255,255,0.18)', border: '1.5px solid rgba(255,255,255,0.4)', boxShadow: '0 4px 14px rgba(0,0,0,0.1)' }}>
                  Continue Farm →
                </button>

                <button onClick={handleSignOut}
                  className="text-white/50 hover:text-white/80 text-sm text-center transition-colors mt-1">
                  Sign out
                </button>
              </>
            ) : (
              <>
                <button onClick={() => setScreen('pick')}
                  className="w-full py-4 rounded-2xl text-white text-xl font-bold transition-all active:scale-95"
                  style={{ background: 'linear-gradient(135deg, #6abf69, #4caf50)', boxShadow: '0 6px 24px rgba(76,175,80,0.45)' }}>
                  🌾 Start Farming
                </button>

                {supabaseEnabled && (
                  <button onClick={() => setScreen('signin')}
                    className="w-full py-3 rounded-2xl text-white text-base font-semibold transition-all active:scale-95"
                    style={{ background: 'rgba(255,255,255,0.18)', border: '1.5px solid rgba(255,255,255,0.4)', boxShadow: '0 4px 14px rgba(0,0,0,0.1)' }}>
                    💌 Sign in to Save Progress
                  </button>
                )}

                {!supabaseEnabled && (
                  <p className="text-white/50 text-xs text-center">Local mode — progress saved in-session only</p>
                )}
              </>
            )}
          </div>

          {/* Trait bubbles */}
          <div className="flex gap-3 flex-wrap justify-center">
            {['🧘 Mindfulness', '📖 Journaling', '🌱 Growth', '🐄 Animals', '🌊 Breathing'].map(t => (
              <div key={t} className="px-4 py-1.5 rounded-full text-sm font-medium text-white/90"
                style={{ background: 'rgba(255,255,255,0.22)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.3)' }}>
                {t}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════ SIGN IN SCREEN ═══════════════════════════════ */}
      {screen === 'signin' && (
        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen pb-20 gap-6 px-6">
          <div className="w-full max-w-sm flex flex-col gap-5"
            style={{ background: 'rgba(255,255,255,0.24)', backdropFilter: 'blur(22px)', borderRadius: 24, border: '1.5px solid rgba(255,255,255,0.45)', padding: '36px 28px', boxShadow: '0 12px 60px rgba(0,0,0,0.12)' }}>

            <div className="text-center">
              <div className="text-4xl mb-2">💌</div>
              <h2 className="text-white text-2xl font-bold">Sign In</h2>
              <p className="text-white/70 text-sm mt-1">Enter your email to receive a magic link.</p>
            </div>

            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSignIn()}
              placeholder="your@email.com"
              className="w-full rounded-xl px-4 py-3 text-white text-base placeholder-white/40 focus:outline-none"
              style={{ background: 'rgba(255,255,255,0.15)', border: '1.5px solid rgba(255,255,255,0.35)' }}
              autoFocus
            />

            {authMessage && (
              <p className={`text-sm text-center ${authMessage.startsWith('Error') ? 'text-red-300' : 'text-green-200'}`}>
                {authMessage}
              </p>
            )}

            <button onClick={handleSignIn} disabled={authLoading || !email.trim()}
              className="w-full py-4 rounded-2xl text-white text-lg font-bold transition-all disabled:opacity-50 active:scale-95"
              style={{ background: 'linear-gradient(135deg, #6abf69, #4caf50)', boxShadow: '0 6px 20px rgba(76,175,80,0.4)' }}>
              {authLoading ? 'Sending…' : 'Send Magic Link ✨'}
            </button>

            <button onClick={() => setScreen('landing')} className="text-white/50 hover:text-white text-sm text-center transition-colors">
              ← Back
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════ AVATAR PICK SCREEN ═══════════════════════════════ */}
      {screen === 'pick' && (
        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen pb-10 gap-6 px-4">

          <div className="text-center">
            <h2 className="text-4xl font-bold text-white drop-shadow-lg"
              style={{ fontFamily: 'Georgia, serif', textShadow: '0 3px 20px rgba(0,0,0,0.22)' }}>
              Who will tend your farm?
            </h2>
            <p className="text-white/80 text-base mt-2 drop-shadow">Choose your companion for this journey.</p>
          </div>

          {/* Avatar cards */}
          <div className="flex gap-4 flex-wrap justify-center">
            {AVATARS.map(a => {
              const isSelected = selected === a.key
              return (
                <button
                  key={a.key}
                  onClick={() => setSelected(a.key)}
                  className="flex flex-col items-center gap-3 p-6 rounded-3xl transition-all duration-300 active:scale-95 relative"
                  style={{
                    background: isSelected
                      ? `rgba(255,255,255,0.35)`
                      : 'rgba(255,255,255,0.15)',
                    backdropFilter: 'blur(16px)',
                    border: isSelected ? `2.5px solid ${a.color}` : '1.5px solid rgba(255,255,255,0.3)',
                    boxShadow: isSelected ? `0 0 28px ${a.color}66, 0 8px 32px rgba(0,0,0,0.12)` : '0 4px 20px rgba(0,0,0,0.08)',
                    transform: isSelected ? 'scale(1.06)' : 'scale(1)',
                    minWidth: 130,
                  }}
                >
                  {isSelected && (
                    <div className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                      style={{ background: a.color, color: '#fff' }}>
                      ✓
                    </div>
                  )}

                  {/* Pixel sprite */}
                  <div className="relative">
                    <div className="absolute inset-0 rounded-full blur-xl opacity-70"
                      style={{ background: a.color, transform: 'scale(0.8) translateY(8px)' }} />
                    <AvatarSprite src={a.sprite} size={80} />
                  </div>

                  <div className="text-center">
                    <p className="text-white font-bold text-base" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.2)' }}>
                      {a.label}
                    </p>
                    {a.description.split('\n').map((line, i) => (
                      <p key={i} className="text-white/75 text-xs mt-0.5">{line}</p>
                    ))}
                  </div>
                </button>
              )
            })}
          </div>

          {/* Selected display */}
          <div className="flex flex-col items-center gap-4 w-full max-w-xs">
            <div className="w-full text-center py-3 px-6 rounded-2xl text-white text-sm font-medium"
              style={{ background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.3)' }}>
              Playing as <span className="font-bold">{selectedAvatar.label}</span>
            </div>

            <button
              onClick={handleEnterFarm}
              className="w-full py-4 rounded-2xl text-white text-xl font-bold transition-all active:scale-95"
              style={{
                background: `linear-gradient(135deg, ${selectedAvatar.color}, ${selectedAvatar.color}cc)`,
                boxShadow: `0 6px 28px ${selectedAvatar.color}55`,
              }}
            >
              Enter the Farm 🌾
            </button>

            <button onClick={() => setScreen('landing')} className="text-white/50 hover:text-white text-sm transition-colors">
              ← Back
            </button>
          </div>
        </div>
      )}

      {/* Settings */}
      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </div>
  )
}
