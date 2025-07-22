export const INSTRUMENTS = [
  'Guitar', 'Bass', 'Drums', 'Vocals', 'Piano', 'Keyboard', 
  'Violin', 'Saxophone', 'Trumpet', 'Flute', 'Clarinet', 'Cello',
  'Banjo', 'Ukulele', 'Harmonica', 'Accordion', 'Harp', 'Tuba',
  'French Horn', 'Trombone', 'Oboe', 'Bassoon', 'Mandolin', 'Other'
] as const;

export type Instrument = typeof INSTRUMENTS[number];

export const INSTRUMENT_EMOJIS: Record<string, string> = {
  'Guitar': '🎸',
  'Bass': '🎸',
  'Drums': '🥁',
  'Vocals': '🎤',
  'Piano': '🎹',
  'Keyboard': '🎹',
  'Violin': '🎻',
  'Saxophone': '🎷',
  'Trumpet': '🎺',
  'Flute': '🪈',
  'Clarinet': '🎶',
  'Cello': '🎻',
  'Banjo': '🪕',
  'Ukulele': '🎸',
  'Harmonica': '🎵',
  'Accordion': '🪗',
  'Harp': '🎵',
  'Tuba': '🎺',
  'French Horn': '🎺',
  'Trombone': '🎺',
  'Oboe': '🎶',
  'Bassoon': '🎶',
  'Mandolin': '🎸',
  'Other': '🎶'
};

export const getInstrumentWithEmoji = (instrument: string): string => {
  const emoji = INSTRUMENT_EMOJIS[instrument] || '🎶';
  return `${emoji} ${instrument}`;
};

// For instrument parts (guitar 1, guitar 2, etc)
export const generateInstrumentParts = (instrument: string, count: number = 1): string[] => {
  if (count === 1) return [instrument];
  return Array.from({ length: count }, (_, i) => `${instrument} ${i + 1}`);
};

export const parseInstrumentWithParts = (instrumentString: string): { instrument: string; part?: number } => {
  const match = instrumentString.match(/^(.+?)\s+(\d+)$/);
  if (match) {
    return {
      instrument: match[1],
      part: parseInt(match[2])
    };
  }
  return { instrument: instrumentString };
};

// Default color palette for instruments
export const DEFAULT_INSTRUMENT_COLORS: Record<string, string> = {
  'Guitar': '#e74c3c',        // Red
  'Bass': '#9b59b6',          // Purple
  'Drums': '#34495e',         // Dark Gray
  'Vocals': '#f39c12',        // Orange
  'Piano': '#2ecc71',         // Green
  'Keyboard': '#27ae60',      // Dark Green
  'Violin': '#8e44ad',        // Dark Purple
  'Saxophone': '#d35400',     // Dark Orange
  'Trumpet': '#f1c40f',       // Yellow
  'Flute': '#3498db',         // Blue
  'Clarinet': '#16a085',      // Teal
  'Cello': '#a569bd',         // Light Purple
  'Banjo': '#e67e22',         // Orange-Red
  'Ukulele': '#e74c3c',       // Red (similar to Guitar)
  'Harmonica': '#95a5a6',     // Light Gray
  'Accordion': '#c0392b',     // Dark Red
  'Harp': '#bb8fce',          // Lavender
  'Tuba': '#7f8c8d',          // Gray
  'French Horn': '#f39c12',   // Orange (similar to Brass)
  'Trombone': '#d68910',      // Dark Yellow
  'Oboe': '#148f77',          // Dark Teal
  'Bassoon': '#6c3483',       // Dark Purple
  'Mandolin': '#dc7633',      // Light Orange
  'Other': '#bdc3c7'          // Light Gray
};

// Color options for customization
export const COLOR_OPTIONS = [
  '#e74c3c', '#9b59b6', '#34495e', '#f39c12', '#2ecc71', '#27ae60',
  '#8e44ad', '#d35400', '#f1c40f', '#3498db', '#16a085', '#a569bd',
  '#e67e22', '#c0392b', '#95a5a6', '#bb8fce', '#7f8c8d', '#d68910',
  '#148f77', '#6c3483', '#dc7633', '#bdc3c7', '#ff6b9d', '#45b7d1',
  '#96ceb4', '#feca57', '#ff9ff3', '#54a0ff', '#5f27cd', '#00d2d3',
  '#ff9f43', '#10ac84', '#ee5a24', '#0984e3', '#a29bfe', '#fd79a8'
];

// Generate variant colors for instrument parts
const generatePartColor = (baseColor: string, partNumber: number): string => {
  // Convert hex to HSL, adjust lightness/saturation for variants
  const hexToHsl = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const diff = max - min;
    
    let h = 0;
    if (diff !== 0) {
      if (max === r) h = ((g - b) / diff) % 6;
      else if (max === g) h = (b - r) / diff + 2;
      else h = (r - g) / diff + 4;
    }
    h = Math.round(h * 60);
    if (h < 0) h += 360;
    
    const l = (max + min) / 2;
    const s = diff === 0 ? 0 : diff / (1 - Math.abs(2 * l - 1));
    
    return [h, s, l];
  };
  
  const hslToHex = (h: number, s: number, l: number) => {
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = l - c / 2;
    
    let r = 0, g = 0, b = 0;
    if (0 <= h && h < 60) [r, g, b] = [c, x, 0];
    else if (60 <= h && h < 120) [r, g, b] = [x, c, 0];
    else if (120 <= h && h < 180) [r, g, b] = [0, c, x];
    else if (180 <= h && h < 240) [r, g, b] = [0, x, c];
    else if (240 <= h && h < 300) [r, g, b] = [x, 0, c];
    else if (300 <= h && h < 360) [r, g, b] = [c, 0, x];
    
    r = Math.round((r + m) * 255);
    g = Math.round((g + m) * 255);
    b = Math.round((b + m) * 255);
    
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  };
  
  const [h, s, l] = hexToHsl(baseColor);
  
  // Generate variants by adjusting hue slightly and lightness
  const hueShift = (partNumber - 1) * 15; // 15 degree shift per part
  const lightnessAdjust = (partNumber - 1) * 0.1; // Slight lightness variation
  
  const newH = (h + hueShift) % 360;
  const newL = Math.max(0.2, Math.min(0.8, l + lightnessAdjust));
  
  return hslToHex(newH, s, newL);
};

// Get color for an instrument (supports custom colors)
export const getInstrumentColor = (instrument: string, customColors?: Record<string, string>): string => {
  // First check for exact match (including part numbers like "Guitar 1")
  if (customColors && customColors[instrument]) {
    return customColors[instrument];
  }
  
  // Check if this is a numbered instrument part
  const match = instrument.match(/^(.+?)\s+(\d+)$/);
  if (match) {
    const baseInstrument = match[1];
    const partNumber = parseInt(match[2]);
    
    // For numbered parts, always generate from default base color to avoid inheritance issues
    const baseColor = DEFAULT_INSTRUMENT_COLORS[baseInstrument] || DEFAULT_INSTRUMENT_COLORS['Other'];
    return generatePartColor(baseColor, partNumber);
  }
  
  // If no exact match, check base instrument for custom color
  const baseInstrument = instrument.replace(/\s+\d+$/, '');
  if (customColors && customColors[baseInstrument]) {
    return customColors[baseInstrument];
  }
  
  // Fall back to default colors for base instrument
  return DEFAULT_INSTRUMENT_COLORS[baseInstrument] || DEFAULT_INSTRUMENT_COLORS['Other'];
};

// Get color for annotation based on its primary instrument
export const getAnnotationColor = (instruments: string[], customColors?: Record<string, string>): string => {
  if (instruments.length === 0) return DEFAULT_INSTRUMENT_COLORS['Other'];
  
  // Use the first instrument's color as the primary color
  return getInstrumentColor(instruments[0], customColors);
};

// Filter out base instruments when numbered parts exist
export const filterInstrumentParts = (instruments: string[]): string[] => {
  const baseInstruments = new Set<string>();
  const numberedParts = new Set<string>();
  
  // Categorize instruments into base and numbered parts
  instruments.forEach(instrument => {
    const match = instrument.match(/^(.+?)\s+(\d+)$/);
    if (match) {
      const baseInstrument = match[1];
      baseInstruments.add(baseInstrument);
      numberedParts.add(instrument);
    }
  });
  
  // Return only instruments that are either:
  // 1. Numbered parts
  // 2. Base instruments that don't have any numbered parts
  return instruments.filter(instrument => {
    const match = instrument.match(/^(.+?)\s+(\d+)$/);
    if (match) {
      // This is a numbered part, always include it
      return true;
    } else {
      // This is a base instrument, only include if no numbered parts exist for it
      return !baseInstruments.has(instrument);
    }
  });
};