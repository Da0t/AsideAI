export class AudioManager {
  private static instance: AudioManager;

  static getInstance(): AudioManager {
    if (!this.instance) this.instance = new AudioManager();
    return this.instance;
  }

  async init(backendWsUrl?: string): Promise<void> {
    console.log('[AudioManager] init (stub)', backendWsUrl);
  }

  async playMusic(trackUri: string): Promise<void> {
    console.log('[AudioManager] playMusic (stub)', trackUri);
  }

  async playVoice(audio: ArrayBuffer | string): Promise<void> {
    console.log('[AudioManager] playVoice (stub)');
  }

  async fireCue(cueName: string): Promise<void> {
    console.log('[AudioManager] fireCue (stub)', cueName);
  }

  async loadPersonalityCues(slug: string): Promise<void> {
    console.log('[AudioManager] loadPersonalityCues (stub)', slug);
  }

  private duckMusic(): void {
    console.log('[AudioManager] duckMusic (stub)');
  }

  private restoreMusic(): void {
    console.log('[AudioManager] restoreMusic (stub)');
  }
}
