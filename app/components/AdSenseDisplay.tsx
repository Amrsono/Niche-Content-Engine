"use client";

import React from "react";
import { BaseAd } from "./BaseAd";

interface AdSenseDisplayProps {
  style?: React.CSSProperties;
}

export default function AdSenseDisplay({ style }: AdSenseDisplayProps) {
  return (
    <BaseAd
      variant="display"
      label="Advertisement"
      slotId="2236544112"
      format="auto"
      style={style}
    />
  );
}
