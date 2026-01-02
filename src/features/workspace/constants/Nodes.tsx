export const NodeColors = {
  emotion: "var(--node-color-emotion)",
  thought: "var(--node-color-thought)",
  sensation: "var(--node-color-sensation)",
  behavior: "var(--node-color-behavior)",
  tension: "var(--node-color-tension)",
  part: "var(--node-color-part)",
  other: "var(--node-color-other)",
};

export const NodeBackgroundColors = {
  emotion: "var(--node-bg-emotion)", // rgb(139, 203, 139) - Green (was behavior)
  thought: "var(--node-bg-thought)",
  sensation: "var(--node-bg-sensation)", // Coral/salmon red (was emotion)
  behavior: "var(--node-bg-behavior)", // Orange (was sensation)
  tension: "var(--node-bg-tension)",
  interaction: "var(--node-bg-interaction)", // Light blue for interaction
  part: "var(--node-bg-part)",
  other: "var(--node-bg-other)", // Teal/cyan - distinct from emotions
  default: "var(--node-bg-default)", // Gray for default
};

export const NodeTextColors = {
  emotion: "var(--node-text-emotion)", // Dark green (was behavior)
  thought: "var(--node-text-thought)",
  sensation: "var(--node-text-sensation)", // Brown (was emotion)
  behavior: "var(--node-text-behavior)", // Brown (matching original sensation text)
  tension: "var(--node-text-tension)",
  interaction: "var(--node-text-interaction)", // Dark blue text for interaction
  part: "var(--node-text-part)",
  other: "var(--node-text-other)", // Deep teal for contrast
  default: "var(--node-text-default)", // Dark gray for default
};

export const NodeTextColorsLight = {
  emotion: "var(--node-text-light-emotion)", // Light mint green (was behavior)
  thought: "var(--node-text-light-thought)",
  sensation: "var(--node-text-light-sensation)", // Soft light red (was emotion)
  behavior: "var(--node-text-light-behavior)", // Warm cream (matching original sensation light)
  tension: "var(--node-text-light-tension)", // lavender
  part: "var(--node-text-light-part)", // pale yellow
  other: "var(--node-text-light-other)", // soft light teal
};

// Palette reference:
// emotion   #F28C82
// thought   #7AB3E0
// sensation #F9B17A
// behavior  #8BCB8B
// other     #EFA9C8
