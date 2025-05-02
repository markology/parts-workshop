"use client";

import { useIsMobile } from "@/hooks/useIsMobile";

export default function ViewportSizeSwitch({ mobile, desktop }) {
  const isMobile = useIsMobile();

  if (isMobile === null) return null;
  return isMobile ? mobile : desktop;
}
