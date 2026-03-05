'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { GlassButton } from '@/components/ui/GlassButton'
import { GlassModal } from '@/components/ui/GlassModal'
import { GlassPanel } from '@/components/ui/GlassPanel'
import { AvatarSelector } from '@/components/game/AvatarSelector'
import { SettingsModal } from './SettingsModal'
import { createClient, isSupabaseConfigured } from '@/lib/supabase'
import { useGameStore } from '@/lib/gameStore'
import type { AvatarChoice } from '@/lib/types'

type MenuState = 'main' | 'signin' | 'avatar' | 'settings'

export function MainMenu() {
  const router = useRouter()
  const { setUserId, setAvatar, setDisplayName } = useGameStore()

  const [menuState, setMenuState] = useState<MenuState>('main')
  const [session, setSession] = useState<{ user: { id: string; email?: string } } | null>(null)
  const [email, setEmail] = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const [authMessage, setAuthMessage] = useState<string | null>(null)
  const [checkingSession, setCheckingSession] = useState(true)
  const supabaseEnabled = isSupabaseConfigured()

  useEffect(() => {
    if (!supabaseEnabled) {
      setCheckingSession(false)
      return
    }

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
    if (error) {
      setAuthMessage(`Error: ${error.message}`)
    } else {
      setAuthMessage('Check your email for a magic link!')
    }
  }

  const handleStartGame = (avatar: AvatarChoice) => {
    setAvatar(avatar)
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-sky-200 via-sage-100 to-cream-100">
        <div className="w-8 h-8 border-2 border-sage-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-b from-sky-200 via-sky-100 to-sage-100">
      {/* Animated background */}
      <div className="absolute inset-0 pointer-events-none">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="absolute bg-white/40 rounded-full animate-float"
            style={{
              width: `${80 + i * 40}px`,
              height: `${30 + i * 15}px`,
              top: `${10 + i * 8}%`,
              left: `${10 + i * 30}%`,
              animationDelay: `${i * 1.2}s`,
            }}
          />
        ))}
        <div className="absolute top-8 right-12 w-16 h-16 bg-yellow-300/80 rounded-full animate-pulse-soft shadow-lg" />
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-sage-400/60 to-transparent" />
        {['🌻', '🌼', '🌷', '🌸'].map((f, i) => (
          <div
            key={i}
            className="absolute text-3xl animate-float"
            style={{
              bottom: `${8 + (i % 2) * 4}%`,
              left: `${10 + i * 20}%`,
              animationDelay: `${i * 0.8}s`,
            }}
          >
            {f}
          </div>
        ))}
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-6">
        <div className="text-center mb-12">
          <h1
            className="text-6xl font-bold text-sage-800 mb-3 drop-shadow-lg font-sans"
            style={{ textShadow: '0 2px 20px rgba(255,255,255,0.6)' }}
          >
            Mindful Farm
          </h1>
          <p className="text-sage-700/80 text-lg font-medium">
            Grow your garden, one reflection at a time.
          </p>
        </div>

        <GlassPanel className="p-8 w-full max-w-sm space-y-4">
          {/* Signed-in state (Supabase only) */}
          {supabaseEnabled && session ? (
            <>
              <p className="text-white/80 text-sm text-center">
                Welcome back, {session.user.email?.split('@')[0] || 'Farmer'}!
              </p>
              <GlassButton className="w-full" size="lg" onClick={() => setMenuState('avatar')}>
                Start New Garden
              </GlassButton>
              <GlassButton className="w-full" variant="secondary" size="lg" onClick={() => router.push('/game')}>
                Continue Farm
              </GlassButton>
              <div className="flex gap-3">
                <GlassButton className="flex-1" variant="secondary" size="sm" onClick={() => setMenuState('settings')}>
                  Settings
                </GlassButton>
                <GlassButton className="flex-1" variant="danger" size="sm" onClick={handleSignOut}>
                  Sign Out
                </GlassButton>
              </div>
            </>
          ) : (
            <>
              {/* Guest / no-Supabase state */}
              <GlassButton className="w-full" size="lg" onClick={() => setMenuState('avatar')}>
                Start Farming
              </GlassButton>

              {supabaseEnabled && (
                <GlassButton
                  className="w-full"
                  variant="secondary"
                  size="lg"
                  onClick={() => setMenuState('signin')}
                >
                  Sign In to Save Progress
                </GlassButton>
              )}

              <GlassButton
                variant="secondary"
                size="sm"
                className="w-full"
                onClick={() => setMenuState('settings')}
              >
                Settings
              </GlassButton>

              {!supabaseEnabled && (
                <p className="text-white/40 text-xs text-center pt-1">
                  Running in local mode — progress saved in-session only
                </p>
              )}
            </>
          )}
        </GlassPanel>

        <p className="mt-6 text-sage-700/50 text-xs">A cozy space to grow.</p>
      </div>

      {/* Sign In Modal */}
      <GlassModal isOpen={menuState === 'signin'} onClose={() => setMenuState('main')} title="Welcome to Mindful Farm">
        <div className="space-y-4">
          <p className="text-white/80 text-sm">Enter your email to receive a magic sign-in link.</p>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSignIn()}
            placeholder="your@email.com"
            className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3
              text-white placeholder-white/40 text-sm focus:outline-none focus:border-white/40"
          />
          {authMessage && (
            <p className={`text-sm ${authMessage.startsWith('Error') ? 'text-blush-300' : 'text-sage-300'}`}>
              {authMessage}
            </p>
          )}
          <GlassButton className="w-full" onClick={handleSignIn} disabled={authLoading || !email.trim()}>
            {authLoading ? 'Sending...' : 'Send Magic Link'}
          </GlassButton>
        </div>
      </GlassModal>

      {/* Avatar Selector */}
      <GlassModal isOpen={menuState === 'avatar'} onClose={() => setMenuState('main')} title="Choose Your Farmer" maxWidth="max-w-md">
        <AvatarSelector onSelect={handleStartGame} current="farmer_girl" />
      </GlassModal>

      {/* Settings */}
      <SettingsModal isOpen={menuState === 'settings'} onClose={() => setMenuState('main')} />
    </div>
  )
}
