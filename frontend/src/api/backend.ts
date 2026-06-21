export function connectAudio(onVoice?: (audio: unknown) => void): void {
  console.log('[backend] connectAudio (stub)');
}

export async function setActivePersonality(slug: string): Promise<void> {
  console.log('[backend] setActivePersonality (stub)', slug);
}

export async function setMode(mode: string): Promise<void> {
  console.log('[backend] setMode (stub)', mode);
}

export async function createCustomPersonality(bundle: unknown): Promise<void> {
  console.log('[backend] createCustomPersonality (stub)', bundle);
}
