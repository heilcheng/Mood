// Audio manager — file-based only, no procedural synthesis.
// All sounds come from /audio/*.mp3 downloaded from Mixkit (music license) and SoundBible (CC).
// Safe to import server-side; all methods guard against SSR.

type SfxType = 'click' | 'chime' | 'open'

const SFX_FILES: Record<SfxType, string> = {
  click: '/audio/sfx_click.mp3',
  chime: '/audio/sfx_chime.mp3',
  open:  '/audio/sfx_open.mp3',
}

class AudioManagerClass {
  private bgm: HTMLAudioElement | null = null
  private ambient: HTMLAudioElement | null = null
  private sfxCache: Partial<Record<SfxType, HTMLAudioElement>> = {}

  private musicVol = 0.55   // 0–1
  private sfxVol   = 0.45   // 0–1, kept softer than music

  // ── Volume control ──────────────────────────────────────────────────────────

  setMusicVolume(pct: number) {
    this.musicVol = pct / 100
    if (this.bgm)     this.bgm.volume     = this.musicVol
    if (this.ambient) this.ambient.volume = Math.min(this.musicVol * 0.5, 0.35)
  }

  setSfxVolume(pct: number) {
    this.sfxVol = (pct / 100) * 0.6   // cap at 60% so SFX never blast over music
  }

  // ── BGM ─────────────────────────────────────────────────────────────────────

  startBgm(isNight: boolean) {
    if (typeof window === 'undefined') return
    const src = isNight ? '/audio/bgm_night.mp3' : '/audio/bgm_day.mp3'

    // Already playing the right track — do nothing
    if (this.bgm && !this.bgm.paused && this.bgm.src.includes(isNight ? 'bgm_night' : 'bgm_day')) return

    this._stopBgm()

    const audio = new Audio(src)
    audio.loop   = true
    audio.volume = this.musicVol
    audio.play().catch(() => { /* file not present — silent skip */ })
    this.bgm = audio
  }

  private _stopBgm() {
    if (this.bgm) { this.bgm.pause(); this.bgm = null }
  }

  // ── Ambient layer ───────────────────────────────────────────────────────────

  startAmbient(isNight: boolean) {
    if (typeof window === 'undefined' || this.ambient) return
    // Daytime: Nature Meditation loop. Night: reuse bgm_night softly as ambient pad.
    const src = isNight ? '/audio/bgm_night.mp3' : '/audio/ambient_birds.mp3'

    const audio = new Audio(src)
    audio.loop   = true
    audio.volume = Math.min(this.musicVol * 0.5, 0.35)
    audio.play().catch(() => { /* file missing — silent */ })
    this.ambient = audio
  }

  // ── SFX ─────────────────────────────────────────────────────────────────────

  playSfx(type: SfxType) {
    if (typeof window === 'undefined' || this.sfxVol === 0) return

    // Reuse cached Audio element; clone for overlapping calls
    let el = this.sfxCache[type]
    if (!el) {
      el = new Audio(SFX_FILES[type])
      el.preload = 'auto'
      this.sfxCache[type] = el
    }

    // Clone so the same sound can overlap itself
    const clone = el.cloneNode() as HTMLAudioElement
    clone.volume = this.sfxVol
    clone.play().catch(() => { /* file missing — silent */ })
  }

  // ── Init (call once on first user interaction) ──────────────────────────────

  init(isNight: boolean, musicVol: number, sfxVol: number) {
    this.setMusicVolume(musicVol)
    this.setSfxVolume(sfxVol)

    // Preload SFX silently
    Object.values(SFX_FILES).forEach((src) => {
      const a = new Audio(src)
      a.preload = 'auto'
    })

    this.startBgm(isNight)
    this.startAmbient(isNight)
  }
}

export const AudioManager = new AudioManagerClass()
