"use client";

/**
 * Sound and haptics for the stages — the smallest service that makes both settings real.
 *
 * Doc 06 rejected Howler and `web-haptics`: two short tones and `navigator.vibrate` do not justify
 * another runtime, and platform support is the real limit rather than the API surface. So the tones
 * are synthesised, which also means there is no audio asset to load before a stage can answer.
 *
 * The AudioContext is created on the first gesture that plays something, never at import: browsers
 * refuse to start one otherwise, and a context created and suspended at load is a page that reports
 * itself as playing audio while silent.
 */

export type FeedbackCue = "tap" | "confirm" | "deny";

interface Tone {
  hz: number;
  durationMs: number;
  /** Peak gain. Kept low: a game tone that talks over a podcast is a setting people turn off once. */
  gain: number;
  vibrateMs: number;
}

const TONES: Readonly<Record<FeedbackCue, Tone>> = {
  tap: { hz: 660, durationMs: 28, gain: 0.05, vibrateMs: 8 },
  confirm: { hz: 880, durationMs: 90, gain: 0.06, vibrateMs: 18 },
  deny: { hz: 180, durationMs: 120, gain: 0.06, vibrateMs: 36 },
};

let context: AudioContext | null = null;

function audioContext(): AudioContext | null {
  if (context) return context;
  const Ctor = typeof window === "undefined" ? undefined : window.AudioContext;
  if (!Ctor) return null;
  try {
    context = new Ctor();
  } catch {
    context = null;
  }
  return context;
}

function playTone(tone: Tone): void {
  const ctx = audioContext();
  if (!ctx) return;
  // A context started before the first gesture arrives suspended; resuming inside the gesture is
  // the only moment the browser will allow it.
  if (ctx.state === "suspended") void ctx.resume().catch(() => undefined);

  const now = ctx.currentTime;
  const seconds = tone.durationMs / 1000;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(tone.hz, now);
  // Ramp to near-silence rather than stopping at full gain: an abrupt stop is an audible click.
  gain.gain.setValueAtTime(tone.gain, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + seconds);
  osc.connect(gain).connect(ctx.destination);
  osc.start(now);
  osc.stop(now + seconds);
}

/** Whether this device reports vibration at all — iOS Safari does not, and saying so is honest. */
export function hapticsSupported(): boolean {
  return typeof navigator !== "undefined" && typeof navigator.vibrate === "function";
}

export function fireFeedback(cue: FeedbackCue, opts: { sound: boolean; haptics: boolean }): void {
  const tone = TONES[cue];
  if (opts.sound) playTone(tone);
  if (opts.haptics && hapticsSupported()) {
    try {
      navigator.vibrate(tone.vibrateMs);
    } catch {
      // Best effort: a device that refuses is not an error the player needs to hear about.
    }
  }
}
