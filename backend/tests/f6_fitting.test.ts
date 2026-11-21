import { describe, it, expect } from 'vitest';
import { fitText, clampToPrintArea } from '../src/modules/printfile/fit.js';

describe('Feature 6: Templates, Print Areas & Fitting Rules Gate', () => {
  it('fitText("1") keeps max size; fitText("1234567890") shrinks but stays >= minSize', () => {
    const boxW = 100;
    const boxH = 50;

    const shortResult = fitText({
      text: '1',
      boxW,
      boxH,
      startSize: 96,
      minSize: 24,
      maxSize: 96,
      shrink: true,
    });

    expect(shortResult.fontSize).toBe(96);
    expect(shortResult.overflow).toBe(false);

    const longResult = fitText({
      text: '1234567890',
      boxW,
      boxH,
      startSize: 96,
      minSize: 24,
      maxSize: 96,
      shrink: true,
    });

    expect(longResult.fontSize).toBeLessThan(96);
    expect(longResult.fontSize).toBeGreaterThanOrEqual(24);
  });

  it('A 60-character string returns overflow: true and never exceeds box width', () => {
    const boxW = 80;
    const boxH = 30;
    const longString = 'This is an exceedingly long runner name that will certainly exceed bounds';

    const result = fitText({
      text: longString,
      boxW,
      boxH,
      startSize: 28,
      minSize: 12,
      maxSize: 40,
      tracking: 0,
      minTracking: -2,
      shrink: true,
    });

    expect(result.overflow).toBe(true);
    expect(result.fittedWidth).toBeLessThanOrEqual(boxW + 0.1); // Allow tiny rounding
  });

  it('clampToPrintArea moves/resizes an out-of-bounds element back inside', () => {
    const area = { x: 10, y: 10, w: 100, h: 50 };

    // Case 1: Element placed completely off-bounds to the right/bottom
    const outOfBoundsElement = {
      x: 120,
      y: 70,
      w: 40,
      h: 20,
    };

    const clamped1 = clampToPrintArea(outOfBoundsElement, area);
    expect(clamped1.x).toBeGreaterThanOrEqual(area.x);
    expect(clamped1.x + clamped1.w).toBeLessThanOrEqual(area.x + area.w);
    expect(clamped1.y).toBeGreaterThanOrEqual(area.y);
    expect(clamped1.y + clamped1.h).toBeLessThanOrEqual(area.y + area.h);

    // Case 2: Element larger than the print area itself gets scaled down
    const oversizedElement = {
      x: 5,
      y: 5,
      w: 150,
      h: 80,
    };

    const clamped2 = clampToPrintArea(oversizedElement, area);
    expect(clamped2.w).toBeLessThanOrEqual(area.w);
    expect(clamped2.h).toBeLessThanOrEqual(area.h);
    expect(clamped2.x).toBeGreaterThanOrEqual(area.x);
    expect(clamped2.y).toBeGreaterThanOrEqual(area.y);
  });

  it('Placeholder with shrink_to_fit = false is not shrunk', () => {
    const boxW = 50;
    const boxH = 50;

    const result = fitText({
      text: 'NO_SHRINK_ME',
      boxW,
      boxH,
      startSize: 32,
      minSize: 10,
      maxSize: 50,
      shrink: false, // Do not shrink
    });

    expect(result.fontSize).toBe(32);
  });
});
