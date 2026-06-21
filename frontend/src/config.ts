/**
 * Backend connection config.
 *
 * Point this at the laptop running `python -m backend.main --serve`.
 *
 * - iOS Simulator / web: `ws://localhost:8780` works (same machine).
 * - Physical phone (Expo Go): use the laptop's LAN IP on the same Wi-Fi,
 *   e.g. `ws://192.168.1.50:8780`. Find it with `ipconfig getifaddr en0`.
 *
 * Override without editing this file via an Expo public env var:
 *   EXPO_PUBLIC_BACKEND_WS=ws://192.168.1.50:8780 npx expo start
 */
export const BACKEND_WS_URL: string =
  process.env.EXPO_PUBLIC_BACKEND_WS ?? 'ws://localhost:8780';
