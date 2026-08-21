/**
 * Feature flags for toggling UI pieces without deleting code.
 * Toggle values here for quick on/off control during testing.
 */

export const FLAGS = {
  // Tabs
  explore: false,
  savedNotes: false,
  settings: false,

  // Components / experimental pieces
  parallax: false,
  helloWave: false,
};

export type FeatureFlagKey = keyof typeof FLAGS;

export function isEnabled(key: FeatureFlagKey) {
  return FLAGS[key] === true;
}

export default FLAGS;
