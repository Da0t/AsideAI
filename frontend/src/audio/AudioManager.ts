/**
 * AudioManager — plays narration voice out loud and (when assets exist) ducks
 * music under it. Voice always has priority: a new line stops the previous one.
 *
 * Voice arrives from the backend as base64 (Deepgram TTS, mp3). We play it via
 * expo-av from a data URI. Music/SFX cues need pre-loaded files in
 * assets/sounds/<slug>/ — until those exist, music + cue playback are graceful
 * no-ops (the duck/restore hooks are in place for when they're added).
 */
import { Audio, AVPlaybackStatus } from 'expo-av';

export class AudioManager {
  private static instance: AudioManager;
  private voiceSound: Audio.Sound | null = null;
  private ready = false;

  static getInstance(): AudioManager {
    if (!this.instance) this.instance = new AudioManager();
    return this.instance;
  }

  async init(): Promise<void> {
    if (this.ready) return;
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });
      this.ready = true;
    } catch (e) {
      console.warn('[AudioManager] init failed', e);
    }
  }

  /** Play one narration line (base64 audio). Stops any line already playing. */
  async playVoice(audioBase64: string, mime = 'audio/mpeg'): Promise<void> {
    if (!audioBase64) return;
    try {
      await this.stopVoice();
      this.duckMusic();
      const uri = `data:${mime};base64,${audioBase64}`;
      const { sound } = await Audio.Sound.createAsync({ uri }, { shouldPlay: true });
      this.voiceSound = sound;
      sound.setOnPlaybackStatusUpdate((status: AVPlaybackStatus) => {
        if (status.isLoaded && status.didJustFinish) {
          this.restoreMusic();
          void this.stopVoice();
        }
      });
    } catch (e) {
      // Best-effort: some platforms reject data-URI audio. Don't crash the app —
      // the laptop (`--serve --play`) remains a reliable speaker.
      console.warn('[AudioManager] playVoice failed (best-effort)', e);
      this.restoreMusic();
    }
  }

  async stopVoice(): Promise<void> {
    const sound = this.voiceSound;
    this.voiceSound = null;
    if (sound) {
      try {
        await sound.unloadAsync();
      } catch {
        /* already unloaded */
      }
    }
  }

  // --- music + cues: wired but no-op until assets/sounds/* are added ---

  async playMusic(_trackUri?: string): Promise<void> {
    /* TODO: load + loop the active personality's theme bed when assets exist */
  }

  async fireCue(cueName: string): Promise<void> {
    // TODO: play assets/sounds/<activeSlug>/<cueName> instantly when assets exist.
    console.log('[AudioManager] cue fired:', cueName);
  }

  async loadPersonalityCues(_slug: string): Promise<void> {
    /* TODO: pre-load this personality's cue set from assets/sounds/<slug>/ */
  }

  private duckMusic(): void {
    /* TODO: lower/cut the music bed while the voice speaks */
  }

  private restoreMusic(): void {
    /* TODO: ramp the music bed back after the line finishes */
  }
}
