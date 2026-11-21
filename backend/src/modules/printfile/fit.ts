/**
 * Text fitting and print area bounding logic
 * Enforces that text and graphic elements strictly remain within physical print areas.
 */

export interface FitTextInput {
  text: string;
  boxW: number;
  boxH: number;
  fontFamily?: string;
  startSize?: number;
  minSize?: number;
  maxSize?: number;
  tracking?: number;
  minTracking?: number;
  shrink?: boolean;
}

export interface FitTextResult {
  fontSize: number;
  tracking: number;
  overflow: boolean;
  fittedWidth: number;
  fittedHeight: number;
}

export interface CanvasElement {
  id?: string;
  type?: string;
  x: number;
  y: number;
  w: number;
  h: number;
  [key: string]: any;
}

export interface PrintArea {
  id?: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Text width estimation based on font-size, tracking, and average glyph aspect ratio
 */
export const measureTextWidth = (
  text: string,
  fontSize: number,
  tracking: number = 0
): number => {
  // Proportional font average character width ratio (~0.58)
  const avgCharWidthRatio = 0.58;
  const baseWidth = text.length * fontSize * avgCharWidthRatio;
  const trackingTotal = Math.max(0, text.length - 1) * tracking;
  return baseWidth + trackingTotal;
};

/**
 * Fits text into bounding box:
 * 1. If shrink is false, keeps startSize.
 * 2. If too wide, first reduce tracking down to min_tracking.
 * 3. Then reduce font size step-by-step down to min_font_size.
 * 4. If still too wide, return overflow: true and clamp fitted width to boxW.
 */
export const fitText = (input: FitTextInput): FitTextResult => {
  const {
    text,
    boxW,
    boxH,
    startSize = 32,
    minSize = 10,
    maxSize = 120,
    tracking = 0,
    minTracking = 0,
    shrink = true,
  } = input;

  let currentFontSize = Math.min(Math.max(startSize, minSize), maxSize);
  let currentTracking = tracking;

  if (!shrink) {
    const width = measureTextWidth(text, currentFontSize, currentTracking);
    const height = currentFontSize * 1.2;
    return {
      fontSize: currentFontSize,
      tracking: currentTracking,
      overflow: width > boxW,
      fittedWidth: width,
      fittedHeight: height,
    };
  }

  // Initial measurement
  let width = measureTextWidth(text, currentFontSize, currentTracking);

  // Step 1: Reduce tracking down to minTracking if too wide
  if (width > boxW && currentTracking > minTracking) {
    currentTracking = minTracking;
    width = measureTextWidth(text, currentFontSize, currentTracking);
  }

  // Step 2: Step-down font size down to minSize if too wide
  while (width > boxW && currentFontSize > minSize) {
    currentFontSize = Math.max(minSize, currentFontSize - 1);
    width = measureTextWidth(text, currentFontSize, currentTracking);
  }

  // Step 3: Check if still overflowing
  const overflow = width > boxW;
  const height = currentFontSize * 1.2;

  return {
    fontSize: currentFontSize,
    tracking: currentTracking,
    overflow,
    fittedWidth: overflow ? Math.min(width, boxW) : width,
    fittedHeight: height,
  };
};

/**
 * Clamps an element within a defined print area:
 * - Scales down element if dimensions exceed print area
 * - Shifts position to prevent out-of-bounds coordinates
 */
export const clampToPrintArea = (
  element: CanvasElement,
  area: PrintArea
): CanvasElement => {
  const clamped = { ...element };

  // 1. Constrain dimensions to print area
  if (clamped.w > area.w) {
    clamped.w = area.w;
  }
  if (clamped.h > area.h) {
    clamped.h = area.h;
  }

  // 2. Constrain position (x, y)
  if (clamped.x < area.x) {
    clamped.x = area.x;
  }
  if (clamped.x + clamped.w > area.x + area.w) {
    clamped.x = area.x + area.w - clamped.w;
  }

  if (clamped.y < area.y) {
    clamped.y = area.y;
  }
  if (clamped.y + clamped.h > area.y + area.h) {
    clamped.y = area.y + area.h - clamped.h;
  }

  return clamped;
};
