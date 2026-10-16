/**
 * High-fidelity Web Audio API sound generator & haptic feedback for photography portfolio interactions.
 * Self-contained, zero external asset latency, realistic haptic acoustic feedback.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  constructor() {
    try {
      const saved = localStorage.getItem('sanjay_sound_enabled');
      this.isMuted = saved === 'false';
    } catch {
      this.isMuted = false;
    }
  }

  private initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public triggerHaptic(duration: number | number[] = 10) {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(duration);
      } catch {
        // ignore on unsupported devices
      }
    }
  }

  /** Light Tap Haptics: 10ms for buttons, header icons, mobile drawer menu triggers, gallery cards */
  public hapticTap() {
    this.triggerHaptic(10);
  }

  /** Selection Haptics: [12ms, 40ms, 12ms] for booking dates, time slots, add-on checkboxes */
  public hapticSelect() {
    this.triggerHaptic([12, 40, 12]);
  }

  /** Success Haptics: [20ms, 80ms, 40ms] confirmation pulse upon submitting reservations */
  public hapticSuccess() {
    this.triggerHaptic([20, 80, 40]);
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    try {
      localStorage.setItem('sanjay_sound_enabled', (!muted).toString());
    } catch {
      // ignore
    }
  }

  public toggleMute(): boolean {
    this.setMuted(!this.isMuted);
    this.triggerHaptic(15);
    if (!this.isMuted) {
      this.playShutter();
    }
    return this.isMuted;
  }

  /** Subtle hover tick & micro-haptic */
  public playHover() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1400, this.ctx.currentTime + 0.025);

      gain.gain.setValueAtTime(0.015, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.025);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.025);
    } catch {
      // audio safety
    }
  }

  /** Button tap / interactive item click */
  public playClick() {
    this.triggerHaptic(12);
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(120, this.ctx.currentTime + 0.04);

      gain.gain.setValueAtTime(0.06, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.04);
    } catch {
      // audio safety
    }
  }

  /** Authentic mechanical camera shutter click (curtain open + slap) */
  public playShutter() {
    this.triggerHaptic(25);
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;

      // Stage 1: Shutter curtain open
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.035);
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 3400;
      filter.Q.value = 3.2;

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      whiteNoise.start(now);

      // Stage 2: Rear curtain return slap
      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(460, now + 0.04);
      osc.frequency.exponentialRampToValueAtTime(75, now + 0.08);

      oscGain.gain.setValueAtTime(0.09, now + 0.04);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(oscGain);
      oscGain.connect(this.ctx.destination);

      osc.start(now + 0.04);
      osc.stop(now + 0.08);
    } catch {
      // audio safety
    }
  }

  /** Switch mode or change tab */
  public playSwitch() {
    this.triggerHaptic(8);
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(480, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(720, this.ctx.currentTime + 0.035);

      gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.035);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.035);
    } catch {
      // audio safety
    }
  }

  /** Success feedback */
  public playSuccess() {
    this.triggerHaptic(30);
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5];

      notes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.07);

        gain.gain.setValueAtTime(0.05, now + idx * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.2);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(now + idx * 0.07);
        osc.stop(now + idx * 0.07 + 0.22);
      });
    } catch {
      // audio safety
    }
  }

  /** Soft error / denied tone */
  public playError() {
    this.triggerHaptic(40);
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(130, now + 0.15);

      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.15);
    } catch {
      // audio safety
    }
  }
}

export const soundEngine = new SoundEngine();

export const hapticTap = () => soundEngine.hapticTap();
export const hapticSelect = () => soundEngine.hapticSelect();
export const hapticSuccess = () => soundEngine.hapticSuccess();
