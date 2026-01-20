/**
 * Parse height and weight from free text.
 * Examples:
 * - "5'10\", 165 lbs"
 * - "5'10, 165"
 * - "5 ft 10 in, 165 lbs"
 * - "178 cm, 75 kg"
 */

import { HeightMeasurement, WeightMeasurement, Sex, ActivityLevel } from '../types';

/**
 * Parse height from text.
 * Supports: 5'10", 5'10, 5 ft 10 in, 5ft10in, 178 cm, 178cm
 */
export function parseHeight(text: string): HeightMeasurement | null {
  if (!text) return null;

  const cleaned = text.toLowerCase().trim();

  // Check for centimeters first
  const cmMatch = cleaned.match(/(\d+(?:\.\d+)?)\s*cm/);
  if (cmMatch) {
    return {
      value: parseFloat(cmMatch[1]),
      unit: 'cm',
    };
  }

  // Check for feet and inches patterns
  // Pattern: 5'10" or 5'10 or 5' 10" or 5' 10
  const ftInMatch = cleaned.match(/(\d+)\s*['′']\s*(\d+)?\s*["″"]?/);
  if (ftInMatch) {
    const feet = parseInt(ftInMatch[1], 10);
    const inches = ftInMatch[2] ? parseInt(ftInMatch[2], 10) : 0;
    return {
      value: feet * 12 + inches,
      unit: 'inches',
    };
  }

  // Pattern: 5 ft 10 in or 5ft 10in or 5 feet 10 inches
  const ftInWords = cleaned.match(/(\d+)\s*(?:ft|feet|foot)\s*(\d+)?\s*(?:in|inch|inches)?/);
  if (ftInWords) {
    const feet = parseInt(ftInWords[1], 10);
    const inches = ftInWords[2] ? parseInt(ftInWords[2], 10) : 0;
    return {
      value: feet * 12 + inches,
      unit: 'inches',
    };
  }

  // Check for just inches (e.g., "70 inches" or "70 in")
  const inchOnly = cleaned.match(/(\d+)\s*(?:in|inch|inches)\b/);
  if (inchOnly) {
    return {
      value: parseInt(inchOnly[1], 10),
      unit: 'inches',
    };
  }

  return null;
}

/**
 * Parse weight from text.
 * Supports: 165 lbs, 165 lb, 165 pounds, 75 kg, 75kg
 */
export function parseWeight(text: string): WeightMeasurement | null {
  if (!text) return null;

  const cleaned = text.toLowerCase().trim();

  // Check for kilograms
  const kgMatch = cleaned.match(/(\d+(?:\.\d+)?)\s*(?:kg|kilo|kilos|kilogram|kilograms)/);
  if (kgMatch) {
    return {
      value: parseFloat(kgMatch[1]),
      unit: 'kg',
    };
  }

  // Check for pounds
  const lbsMatch = cleaned.match(/(\d+(?:\.\d+)?)\s*(?:lbs?|pounds?)/);
  if (lbsMatch) {
    return {
      value: parseFloat(lbsMatch[1]),
      unit: 'lbs',
    };
  }

  // Try to find a standalone number (assume pounds in US context)
  const numMatch = cleaned.match(/\b(\d{2,3})\b/);
  if (numMatch) {
    const value = parseInt(numMatch[1], 10);
    // Reasonable weight range check
    if (value >= 80 && value <= 350) {
      return {
        value,
        unit: 'lbs',
      };
    }
    // Could be kg if smaller number
    if (value >= 40 && value < 80) {
      return {
        value,
        unit: 'kg',
      };
    }
  }

  return null;
}

/**
 * Parse combined height and weight text.
 */
export function parseHeightWeight(text: string): {
  height: HeightMeasurement | null;
  weight: WeightMeasurement | null;
} {
  if (!text) {
    return { height: null, weight: null };
  }

  // Split by comma or semicolon
  const parts = text.split(/[,;]/).map(p => p.trim());

  let height: HeightMeasurement | null = null;
  let weight: WeightMeasurement | null = null;

  for (const part of parts) {
    if (!height) {
      height = parseHeight(part);
    }
    if (!weight) {
      weight = parseWeight(part);
    }
  }

  // If we only have one part, try parsing both from it
  if (!height || !weight) {
    height = height || parseHeight(text);
    weight = weight || parseWeight(text);
  }

  return { height, weight };
}

/**
 * Parse sex/gender from text.
 */
export function parseSex(text: string): Sex | null {
  if (!text) return null;

  const cleaned = text.toLowerCase().trim();

  if (cleaned.includes('male') && !cleaned.includes('female')) {
    return 'male';
  }
  if (cleaned.includes('female') || cleaned.includes('woman')) {
    return 'female';
  }
  if (cleaned.startsWith('m') && cleaned.length <= 4) {
    return 'male';
  }
  if (cleaned.startsWith('f') && cleaned.length <= 6) {
    return 'female';
  }

  return null;
}

/**
 * Parse activity level from text.
 */
export function parseActivityLevel(text: string): ActivityLevel {
  if (!text) return 'lightly_active';

  const cleaned = text.toLowerCase().trim();

  // Check for keywords
  if (cleaned.includes('sedentary') || cleaned.includes('desk job') || cleaned.includes('minimal')) {
    return 'sedentary';
  }
  if (cleaned.includes('very active') || cleaned.includes('physical job') || cleaned.includes('on your feet')) {
    return 'very_active';
  }
  if (cleaned.includes('moderately active') || cleaned.includes('moderate')) {
    return 'moderately_active';
  }
  if (cleaned.includes('light') || cleaned.includes('office') || cleaned.includes('some')) {
    return 'lightly_active';
  }

  // Default to lightly active for desk workers who also train
  return 'lightly_active';
}

/**
 * Parse age from text.
 */
export function parseAge(text: string): number | null {
  if (!text) return null;

  const match = text.match(/\d+/);
  if (match) {
    const age = parseInt(match[0], 10);
    // Validate reasonable age range
    if (age >= 16 && age <= 90) {
      return age;
    }
  }

  return null;
}
