/**
 * backend — talk to the Python backend.
 *
 * Two directions:
 *   - IN:  voice audio (and which event/cue fired) over WebSocket -> AudioManager.
 *   - OUT: control messages — switch personality/mode, save custom personality.
 *
 * Personality/mode state lives in Redis on the backend; these calls set it.
 *
 * TODO: implement. This is a scaffold stub.
 */

// const BACKEND_URL = ... // from app config

/** Open the WS for incoming voice audio. TODO. */
export function connectAudio(/* onVoice: (audio) => void */) {
  throw new Error('TODO: connect to backend audio WS');
}

/** Set the active personality (backend writes to Redis). TODO. */
export function setActivePersonality(/* slug: string */) {
  throw new Error('TODO: setActivePersonality');
}

/** Set the active mode. TODO. */
export function setMode(/* mode: string */) {
  throw new Error('TODO: setMode');
}

/** Create + store a custom personality bundle. TODO. */
export function createCustomPersonality(/* bundle */) {
  throw new Error('TODO: createCustomPersonality');
}
