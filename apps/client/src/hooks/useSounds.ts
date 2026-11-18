'use client';

import { useCallback } from 'react';

export type SoundKey =
  | 'cardPlay'
  | 'cardDraw'
  | 'cardShuffle'
  | 'unoCall'
  | 'win'
  | 'lose'
  | 'click'
  | 'turnStart'
  | 'colorChange'
  | 'error';

class SoundEngine {
  private ctx: AudioContext | null = null;
  public enabled = true;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  play(sound: SoundKey) {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    switch (sound) {
      case 'cardPlay': {
        // Crisp card snap / slap sound
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(120, now + 0.12);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.12);
        break;
      }

      case 'cardDraw': {
        // Light card whoosh sound
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(250, now);
        osc.frequency.exponentialRampToValueAtTime(500, now + 0.15);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.15);
        break;
      }

      case 'cardShuffle': {
        // Fast multi-tap flutter/riffle card shuffle sound
        for (let i = 0; i < 8; i++) {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const t = now + i * 0.04;
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(320 + Math.random() * 260, t);
          osc.frequency.exponentialRampToValueAtTime(120, t + 0.045);
          gain.gain.setValueAtTime(0.18, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.045);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(t);
          osc.stop(t + 0.045);
        }
        break;
      }

      case 'turnStart': {
        // Pleasant bell chime for player turn
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now); // A5
        osc.frequency.setValueAtTime(1174.66, now + 0.08); // D6
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.35);
        break;
      }

      case 'click': {
        // Subtle tactile button pop
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.04);
        break;
      }

      case 'colorChange': {
        // Sci-fi power shift tone
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.linearRampToValueAtTime(900, now + 0.2);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.25);
        break;
      }

      case 'unoCall': {
        // Dramatic fanfare for UNO!
        [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'square';
          osc.frequency.setValueAtTime(freq, now + idx * 0.06);
          gain.gain.setValueAtTime(0.12, now + idx * 0.06);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.25);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.06);
          osc.stop(now + idx * 0.06 + 0.25);
        });
        break;
      }

      case 'error': {
        // Low buzzer
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(140, now);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.18);
        break;
      }

      case 'win': {
        // Major victory triad arpeggio
        [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + idx * 0.1);
          gain.gain.setValueAtTime(0.2, now + idx * 0.1);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.5);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.1);
          osc.stop(now + idx * 0.1 + 0.5);
        });
        break;
      }

      case 'lose': {
        // Descending minor chord
        [440, 392, 349.23, 293.66].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.12);
          gain.gain.setValueAtTime(0.15, now + idx * 0.12);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.4);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.12);
          osc.stop(now + idx * 0.12 + 0.4);
        });
        break;
      }
    }
  }
}

const globalSoundEngine = new SoundEngine();

export function useSounds() {
  const isEnabled = useCallback(() => globalSoundEngine.enabled, []);
  
  const toggle = useCallback(() => {
    globalSoundEngine.enabled = !globalSoundEngine.enabled;
    return globalSoundEngine.enabled;
  }, []);

  const play = useCallback((sound: SoundKey) => {
    globalSoundEngine.play(sound);
  }, []);

  const playClick = useCallback(() => play('click'), [play]);
  const playCardPlay = useCallback(() => play('cardPlay'), [play]);
  const playCardDraw = useCallback(() => play('cardDraw'), [play]);
  const playCardShuffle = useCallback(() => play('cardShuffle'), [play]);
  const playTurnStart = useCallback(() => play('turnStart'), [play]);
  const playUnoCall = useCallback(() => play('unoCall'), [play]);
  const playColorChange = useCallback(() => play('colorChange'), [play]);
  const playError = useCallback(() => play('error'), [play]);
  const playWin = useCallback(() => play('win'), [play]);
  const playLose = useCallback(() => play('lose'), [play]);

  return {
    play,
    toggle,
    isEnabled,
    playClick,
    playCardPlay,
    playCardDraw,
    playCardShuffle,
    playTurnStart,
    playUnoCall,
    playColorChange,
    playError,
    playWin,
    playLose,
  };
}
