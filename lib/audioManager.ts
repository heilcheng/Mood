// Singleton audio manager — Web Audio API for SFX, HTML Audio for BGM/ambient.
// All methods are safe to call server-side (they check for window).

type SfxType = 'click' | 'chime' | 'open' | 'footstep' | 'splash'

class AudioManagerClass {
  private ctx: AudioContext | null = null
  private bgm: HTMLAudioElement | null = null
  private ambient: HTMLAudioElement | null = null
  private musicVol = 0.7
  private sfxVol = 0.8

  private getCtx(): AudioContext | null {
    if (typeof window === 'undefined') return null
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    }
    // Resume if suspended (browser autoplay policy)
    if (this.ctx.state === 'suspended') this.ctx.resume()
    return this.ctx
  }

  setMusicVolume(pct: number) {
    this.musicVol = pct / 100
    if (this.bgm) this.bgm.volume = this.musicVol
    if (this.ambient) this.ambient.volume = this.musicVol * 0.6
  }

  setSfxVolume(pct: number) {
    this.sfxVol = pct / 100
  }

  // Start BGM — tries /audio/bgm_day.mp3, silently skips if missing
  startBgm(isNight: boolean) {
    if (typeof window === 'undefined') return
    const src = isNight ? '/audio/bgm_night.mp3' : '/audio/bgm_day.mp3'
    if (this.bgm) {
      if (this.bgm.src.endsWith(src.split('/').pop()!)) return
      this.bgm.pause()
    }
    const audio = new Audio(src)
    audio.loop = true
    audio.volume = this.musicVol
    audio.play().catch(() => { /* file not present — ok */ })
    this.bgm = audio
  }

  // Start ambient layer — tries file, falls back to procedural pink noise
  startAmbient(isNight: boolean) {
    if (typeof window === 'undefined') return
    if (this.ambient) return
    const src = isNight ? '/audio/ambient_crickets.mp3' : '/audio/ambient_birds.mp3'
    const audio = new Audio(src)
    audio.loop = true
    audio.volume = this.musicVol * 0.6
    audio.play().catch(() => this.proceduralAmbient(isNight))
    this.ambient = audio
  }

  private proceduralAmbient(isNight: boolean) {
    const ctx = this.getCtx()
    if (!ctx) return
    const rate = ctx.sampleRate
    const buf = ctx.createBuffer(1, rate * 4, rate)
    const data = buf.getChannelData(0)
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0
    for (let i = 0; i < data.length; i++) {
      const w = Math.random() * 2 - 1
      b0 = 0.99886 * b0 + w * 0.0555179
      b1 = 0.99332 * b1 + w * 0.0750759
      b2 = 0.96900 * b2 + w * 0.1538520
      b3 = 0.86650 * b3 + w * 0.3104856
      b4 = 0.55000 * b4 + w * 0.5329522
      b5 = -0.7616 * b5 - w * 0.0168980
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11
      b6 = w * 0.115926
    }
    const src = ctx.createBufferSource()
    src.buffer = buf
    src.loop = true
    const filter = ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.value = isNight ? 600 : 1400
    filter.Q.value = 0.4
    const gain = ctx.createGain()
    gain.gain.value = this.musicVol * 0.12
    src.connect(filter); filter.connect(gain); gain.connect(ctx.destination)
    src.start()
  }

  playSfx(type: SfxType) {
    if (this.sfxVol === 0) return
    const ctx = this.getCtx()
    if (!ctx) return
    try {
      switch (type) {
        case 'click': this.sfxClick(ctx); break
        case 'chime': this.sfxChime(ctx); break
        case 'open': this.sfxOpen(ctx); break
        case 'footstep': this.sfxFootstep(ctx); break
        case 'splash': this.sfxSplash(ctx); break
      }
    } catch { /* silently fail */ }
  }

  private gain(ctx: AudioContext, vol: number): GainNode {
    const g = ctx.createGain()
    g.gain.value = vol * this.sfxVol
    g.connect(ctx.destination)
    return g
  }

  private sfxClick(ctx: AudioContext) {
    const osc = ctx.createOscillator()
    const g = this.gain(ctx, 0.25)
    osc.type = 'sine'
    osc.frequency.value = 900
    g.gain.setTargetAtTime(0, ctx.currentTime + 0.04, 0.015)
    osc.connect(g); osc.start(); osc.stop(ctx.currentTime + 0.1)
  }

  private sfxChime(ctx: AudioContext) {
    [523, 659, 784, 1047].forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const g = ctx.createGain()
      g.gain.value = 0.18 * this.sfxVol
      g.gain.setTargetAtTime(0, ctx.currentTime + 0.2 + i * 0.14, 0.08)
      g.connect(ctx.destination)
      osc.type = 'sine'; osc.frequency.value = freq
      osc.connect(g)
      osc.start(ctx.currentTime + i * 0.14)
      osc.stop(ctx.currentTime + 0.9 + i * 0.14)
    })
  }

  private sfxOpen(ctx: AudioContext) {
    const osc = ctx.createOscillator()
    const g = this.gain(ctx, 0.18)
    osc.type = 'sine'
    osc.frequency.setValueAtTime(280, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(560, ctx.currentTime + 0.18)
    g.gain.setTargetAtTime(0, ctx.currentTime + 0.1, 0.05)
    osc.connect(g); osc.start(); osc.stop(ctx.currentTime + 0.3)
  }

  private sfxFootstep(ctx: AudioContext) {
    const len = Math.floor(ctx.sampleRate * 0.06)
    const buf = ctx.createBuffer(1, len, ctx.sampleRate)
    const data = buf.getChannelData(0)
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len)
    const src = ctx.createBufferSource(); src.buffer = buf
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 380
    const g = this.gain(ctx, 0.35)
    src.connect(f); f.connect(g); src.start()
  }

  private sfxSplash(ctx: AudioContext) {
    const len = Math.floor(ctx.sampleRate * 0.35)
    const buf = ctx.createBuffer(1, len, ctx.sampleRate)
    const data = buf.getChannelData(0)
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (len * 0.25))
    const src = ctx.createBufferSource(); src.buffer = buf
    const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 950; f.Q.value = 0.5
    const g = this.gain(ctx, 0.45)
    src.connect(f); f.connect(g); src.start()
  }
}

export const AudioManager = new AudioManagerClass()
