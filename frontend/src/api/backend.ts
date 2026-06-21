/**
 * Backend WebSocket client (phone <-> laptop). Implements docs/PROTOCOL.md §2.
 *
 * JSON text messages only; voice audio arrives base64-encoded in a `voice`
 * message. Auto-reconnects. The ThemeContext owns the single connection.
 */
import { BACKEND_WS_URL } from '../config';

export interface BackendState {
  personality?: string;
  mode?: string;
  running?: boolean;
}

export interface BackendHandlers {
  onStatus?: (connected: boolean) => void;
  onState?: (state: BackendState) => void;
  onLine?: (line: { text: string; personality?: string }) => void;
  onFrame?: (dataUri: string) => void;
  onCue?: (name: string) => void;
  onVoice?: (audioBase64: string, mime: string) => void;
}

let ws: WebSocket | null = null;
let handlers: BackendHandlers = {};
let shouldRun = false;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

function open(): void {
  try {
    ws = new WebSocket(BACKEND_WS_URL);
  } catch {
    scheduleReconnect();
    return;
  }

  ws.onopen = () => handlers.onStatus?.(true);

  ws.onclose = () => {
    handlers.onStatus?.(false);
    ws = null;
    scheduleReconnect();
  };

  // onerror is followed by onclose on RN; reconnect is handled there.
  ws.onerror = () => {};

  ws.onmessage = (event: { data: unknown }) => {
    const data = event.data;
    if (typeof data !== 'string') return; // protocol is JSON text only
    let msg: Record<string, unknown>;
    try {
      msg = JSON.parse(data);
    } catch {
      return;
    }
    switch (msg.type) {
      case 'state':
        handlers.onState?.({
          personality: msg.personality as string | undefined,
          mode: msg.mode as string | undefined,
          running: msg.running as boolean | undefined,
        });
        break;
      case 'line':
        handlers.onLine?.({
          text: String(msg.text ?? ''),
          personality: msg.personality as string | undefined,
        });
        break;
      case 'frame':
        handlers.onFrame?.(
          `data:${String(msg.mime ?? 'image/jpeg')};base64,${String(msg.data ?? '')}`,
        );
        break;
      case 'cue':
        handlers.onCue?.(String(msg.name ?? ''));
        break;
      case 'voice':
        handlers.onVoice?.(String(msg.audio ?? ''), String(msg.mime ?? 'audio/mpeg'));
        break;
    }
  };
}

function scheduleReconnect(): void {
  if (!shouldRun || reconnectTimer) return;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    if (shouldRun) open();
  }, 2000);
}

function send(obj: Record<string, unknown>): void {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(obj));
  }
}

/** Open the connection and register handlers (call once). */
export function connect(h: BackendHandlers): void {
  handlers = h;
  shouldRun = true;
  open();
}

/** Close the connection and stop reconnecting. */
export function disconnect(): void {
  shouldRun = false;
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  ws?.close();
  ws = null;
}

export function setActivePersonality(slug: string): void {
  send({ type: 'set_personality', slug });
}

export function setMode(mode: string): void {
  send({ type: 'set_mode', mode });
}

export function setRunning(running: boolean): void {
  send({ type: 'set_running', running });
}

export function manualCue(name: string): void {
  send({ type: 'manual_cue', name });
}

export function createCustomPersonality(bundle: unknown): void {
  send({ type: 'create_personality', bundle });
}
