import { ImpressionPluralType, ImpressionType } from "@/types/Impressions";

export const NodeColors = {
  emotion: "#F28C82",
  thought: "#7AB3E0",
  sensation: "#F9B17A",
  behavior: "#8BCB8B",
  conflict: "#B19CD9",
  part: "#F7E68F",
  self: "#4ECDC4",
  other: "#EFA9C8",
};

export const NodeBackgroundColors = {
  emotion: "#f28c82ad",
  thought: "#7ab3e0ad",
  sensation: "#f9b17aad",
  behavior: "#8bcb8bad",
  conflict: "#b19cd9ad",
  part: "#f7e68fad",
  self: "#4ecdc4ad",
  other: "#efa9c8ad",
};

export const NodeTextColors = {
  emotion: "#994936",
  thought: "#3e6e91",
  sensation: "#9b6034",
  behavior: "#3f7142",
  conflict: "#5a4784",
  part: "#998f3a",
  self: "#396c6d",
  other: "#934b6d",
};

// emotion	#F28C82	#f28c82ad	#994936
// thought	#7AB3E0	#7ab3e0ad	#3e6e91
// sensation	#F9B17A	#f9b17aad	#9b6034
// behavior	#8BCB8B	#8bcb8bad	#3f7142
// conflict	#B19CD9	#b19cd9ad	#5a4784
// part	#F7E68F	#f7e68fad	#998f3a
// self	#4ECDC4	#4ecdc4ad	#396c6d ✅ (yours)
// other	#EFA9C8	#efa9c8ad

export const PartDataLabels: Record<ImpressionType, ImpressionPluralType> = {
  emotion: "emotions",
  thought: "thoughts",
  sensation: "sensations",
  behavior: "behaviors",
  other: "others",
  self: "self",
};
