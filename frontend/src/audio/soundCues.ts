/**
 * soundCues — load the active personality's pre-loaded cues.
 *
 * Resolves cue names (from assets/sounds/manifest.json) to the actual audio files
 * in assets/sounds/<slug>/ so the AudioManager can fire them instantly.
 *
 * TODO: implement. This is a scaffold stub.
 */

// import manifest from '../../../assets/sounds/manifest.json';

/** Return a map of { cueName -> require'd audio asset } for a personality. */
export function cuesFor(/* slug: string */) {
  // TODO: read the manifest's cue names
  // TODO: map each to assets/sounds/<slug>/<file> (require/Asset)
  // TODO: missing cues simply don't fire
  throw new Error('TODO: load personality sound cues');
}
