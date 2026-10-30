// Pure JS English lemmatizer with common irregulars, plurals, verbs, and comparatives
// Suitable for browser, Deno Edge Functions, and Node without heavy external dependencies.

const IRREGULAR_VERBS: Record<string, string> = {
  am: 'be', is: 'be', are: 'be', was: 'be', were: 'be', been: 'be', being: 'be',
  has: 'have', had: 'have', having: 'have',
  does: 'do', did: 'do', doing: 'do',
  goes: 'go', went: 'go', gone: 'go', going: 'go',
  says: 'say', said: 'say', saying: 'say',
  gets: 'get', got: 'get', gotten: 'get', getting: 'get',
  makes: 'make', made: 'make', making: 'make',
  knows: 'know', knew: 'know', known: 'know', knowing: 'know',
  thinks: 'think', thought: 'think', thinking: 'think',
  takes: 'take', took: 'take', taken: 'take', taking: 'take',
  sees: 'see', saw: 'see', seen: 'see', seeing: 'see',
  comes: 'come', came: 'come', coming: 'come',
  wants: 'want', wanted: 'want', wanting: 'want',
  looks: 'look', looked: 'look', looking: 'look',
  finds: 'find', found: 'find', finding: 'find',
  gives: 'give', gave: 'give', given: 'give', giving: 'give',
  tells: 'tell', told: 'tell', telling: 'tell',
  feels: 'feel', felt: 'feel', feeling: 'feel',
  becomes: 'become', became: 'become', becoming: 'become',
  leaves: 'leave', left: 'leave', leaving: 'leave',
  puts: 'put', putting: 'put',
  means: 'mean', meant: 'mean', meaning: 'mean',
  keeps: 'keep', kept: 'keep', keeping: 'keep',
  lets: 'let', letting: 'let',
  begins: 'begin', began: 'begin', begun: 'begin', beginning: 'begin',
  runs: 'run', ran: 'run', running: 'run',
  holds: 'hold', held: 'hold', holding: 'hold',
  brings: 'bring', brought: 'bring', bringing: 'bring',
  hears: 'hear', heard: 'hear', hearing: 'hear',
  danced: 'dance', dances: 'dance', dancing: 'dance',
  cried: 'cry', cries: 'cry', crying: 'cry',
  tried: 'try', tries: 'try', trying: 'try',
  loved: 'love', loves: 'love', loving: 'love',
  lived: 'live', lives: 'live', living: 'live',
  played: 'play', plays: 'play', playing: 'play',
  sang: 'sing', sung: 'sing', sings: 'sing', singing: 'sing',
  stopped: 'stop', stops: 'stop', stopping: 'stop',
  dropped: 'drop', drops: 'drop', dropping: 'drop',
  stepped: 'step', steps: 'step', stepping: 'step',
};

const IRREGULAR_NOUNS: Record<string, string> = {
  eyes: 'eye',
  men: 'man',
  women: 'woman',
  children: 'child',
  teeth: 'tooth',
  feet: 'foot',
  people: 'person',
  lives: 'life',
  hands: 'hand',
  hearts: 'heart',
  nights: 'night',
  days: 'day',
  dreams: 'dream',
  stars: 'star',
  tears: 'tear',
  arms: 'arm',
  words: 'word',
  lights: 'light',
};

const IRREGULAR_ADJECTIVES: Record<string, string> = {
  stronger: 'strong',
  strongest: 'strong',
  better: 'good',
  best: 'good',
  worse: 'bad',
  worst: 'bad',
  closer: 'close',
  closest: 'close',
  higher: 'high',
  highest: 'high',
  harder: 'hard',
  hardest: 'hard',
  faster: 'fast',
  fastest: 'fast',
  deeper: 'deep',
  deepest: 'deep',
  crazier: 'crazy',
  craziest: 'crazy',
};

export function lemmatizeEnglish(word: string): string {
  const lower = word.toLowerCase();

  // Check irregular lookup tables first
  if (IRREGULAR_ADJECTIVES[lower]) return IRREGULAR_ADJECTIVES[lower];
  if (IRREGULAR_VERBS[lower]) return IRREGULAR_VERBS[lower];
  if (IRREGULAR_NOUNS[lower]) return IRREGULAR_NOUNS[lower];

  // Rule-based morphological endings
  // 1. -ing (e.g., walking -> walk, making -> make, dancing -> dance, running -> run)
  if (lower.endsWith('ing') && lower.length > 5) {
    const base = lower.slice(0, -3);
    // Double consonant (running -> run, stopping -> stop)
    if (/([^aeiou])\1$/.test(base)) {
      return base.slice(0, -1);
    }
    // Verbs ending in silent e (hoping -> hope, dancing -> dance)
    if (/^[a-z]+[^aeiou]$/.test(base) && !base.endsWith('w') && !base.endsWith('x')) {
      // test with e added if common e-drop pattern
      if (['danc', 'mak', 'lov', 'liv', 'tak', 'com', 'giv', 'rid'].includes(base)) {
        return base + 'e';
      }
    }
    return base;
  }

  // 2. -ed (e.g., walked -> walk, loved -> love)
  if (lower.endsWith('ed') && lower.length > 4) {
    if (lower.endsWith('ied')) {
      return lower.slice(0, -3) + 'y'; // cried -> cry
    }
    const base = lower.slice(0, -2);
    if (/([^aeiou])\1$/.test(base)) {
      return base.slice(0, -1); // stepped -> step
    }
    if (lower.endsWith('eed')) {
      return lower; // need, speed, feed
    }
    // If base ends in c, g, v, z, s, e.g. danced -> dance
    if (['danc', 'lov', 'liv', 'clos', 'hop'].includes(base)) {
      return base + 'e';
    }
    return base;
  }

  // 3. -er / -est comparatives (stronger -> strong)
  if (lower.endsWith('est') && lower.length > 5) {
    return lower.slice(0, -3);
  }
  if (lower.endsWith('er') && lower.length > 4) {
    const base = lower.slice(0, -2);
    if (/([^aeiou])\1$/.test(base)) {
      return base.slice(0, -1);
    }
    return base;
  }

  // 4. Plurals / 3rd person singular -s / -es
  if (lower.endsWith('ies') && lower.length > 4) {
    return lower.slice(0, -3) + 'y'; // parties -> party
  }
  if (lower.endsWith('es') && lower.length > 4) {
    if (/(?:ch|sh|ss|x|z)es$/.test(lower)) {
      return lower.slice(0, -2);
    }
    return lower.slice(0, -1);
  }
  if (lower.endsWith('s') && !lower.endsWith('ss') && !lower.endsWith('us') && !lower.endsWith('is') && lower.length > 3) {
    return lower.slice(0, -1);
  }

  return lower;
}
