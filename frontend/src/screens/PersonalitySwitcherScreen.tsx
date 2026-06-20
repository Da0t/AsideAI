/**
 * PersonalitySwitcherScreen — home screen.
 *
 * Pick the active personality and mode, fire manual cues, jump to the custom
 * builder. Switching writes state the backend reads (via Redis), so the live
 * narration changes character + voice.
 *
 * TODO: implement. This is a scaffold stub.
 */

// import { View } from 'react-native';
// import PersonalityCard from '../components/PersonalityCard';
// import ModeSwitcher from '../components/ModeSwitcher';
// import CueButtons from '../components/CueButtons';
// import * as backend from '../api/backend';

export default function PersonalitySwitcherScreen() {
  // TODO: load personalities (5 built-ins + any custom)
  // TODO: render a PersonalityCard per personality; tap -> backend.setActivePersonality(slug)
  // TODO: render ModeSwitcher; change -> backend.setMode(mode)
  // TODO: render CueButtons (entrance theme, laugh track) for the ACTIVE personality
  // TODO: button -> navigate to CustomPersonalityBuilder
  throw new Error('TODO: PersonalitySwitcherScreen');
}
