/**
 * Made-to-measure panels per m2 (PDF file page 53).
 */
export const CUSTOM_PANEL_SAMPLE_M2 = 0.089;
export const CUSTOM_PANEL_MIN_M2 = 0.5;

/** Reference row 4NP1010 for 0.089 m2. */
export const CUSTOM_PANEL_PER_M2 = {
  code: "4NP1010",
  melamine: 101 / CUSTOM_PANEL_SAMPLE_M2,
  lacquered: 156 / CUSTOM_PANEL_SAMPLE_M2,
};

export const RAL_SETUP_FEE = {
  code: "LAOPBA",
  label: "RAL/NCS lacquer setup (per colour)",
  price: 383,
};
