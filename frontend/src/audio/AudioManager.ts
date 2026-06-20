/**
 * AudioManager — the load-bearing piece of the frontend.
 *
 * Owns all audio output and enforces the priority rules:
 *
 *   1. VOICE HAS PRIORITY. When narration arrives, music ducks (volume down) or
 *      cuts, then restores after the line finishes.
 *   2. CUES ARE PRE-LOADED and fire INSTANTLY. Never generated live.
 *   3. ONLY THE ACTIVE PERSONALITY'S SOUNDS exist (cue set swaps on switch).
 *
 * See ../../../docs/ARCHITECTURE.md design rules 1-3.
 *
 * TODO: implement with expo-av. This is a scaffold stub.
 */

// import { Audio } from 'expo-av';

export class AudioManager {
  // TODO: track current music track, current voice playback, loaded cue sounds

  /** Connect to the backend WS and play voice audio as it arrives. */
  // async init(backendWsUrl: string): Promise<void>

  /** Play background music for the active personality (loops, low priority). */
  // async playMusic(trackUri: string): Promise<void>

  /**
   * Play narration voice. MUST duck/cut music first, then restore when done.
   * This is the core behavior — voice always wins.
   */
  // async playVoice(audio: ArrayBuffer | string): Promise<void>

  /** Duck the music under the voice. TODO: lower volume (or pause). */
  // private duckMusic(): void

  /** Restore music after a line finishes. TODO: ramp volume back / resume. */
  // private restoreMusic(): void

  /**
   * Fire a pre-loaded cue (entrance theme, laugh track) for the active
   * personality. Instant — sounds are loaded up front.
   */
  // async fireCue(cueName: string): Promise<void>

  /** Swap the loaded cue set when the personality changes. */
  // async loadPersonalityCues(slug: string): Promise<void>

  constructor() {
    throw new Error('TODO: AudioManager');
  }
}
