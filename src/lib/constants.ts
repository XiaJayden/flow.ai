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