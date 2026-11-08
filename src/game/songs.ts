import { Difficulty, InstrumentType, SmartGenreId, Style } from '../types';

export interface SmartGenreDefinition {
  id: SmartGenreId;
  name: string;
  vietnameseName: string;
  shortBadge: string;
  styleCode: Style;
  accentHex: string;
  badgeClass: string;
  borderClass: string;
  description: string;
  acousticSignature: string;
  /** Strictly maximum 3 suitable instruments for this music genre */
  suitableInstruments: InstrumentType[];
  instrumentFitNotes: Partial<Record<InstrumentType, string>>;
}

export const SMART_GENRE_CATALOG: Record<SmartGenreId, SmartGenreDefinition> = {
  rock_metal: {
    id: 'rock_metal',
    name: 'Rock & Arena Metal',
    vietnameseName: 'Rock & Arena Metal',
    shortBadge: 'ROCK / METAL',
    styleCode: 'rock',
    accentHex: '#F59E0B',
    badgeClass: 'text-amber-400',
    borderClass: 'border-amber-500/60',
    description:
      'Riff guitar điện công suất lớn, trống Acoustic dồn Tom-Tom mạnh mẽ và Bass giữ nhịp sân vận động.',
    acousticSignature: '118–160 BPM · Dải Mid/Riff dày & nhịp trống Backbeat mạnh',
    suitableInstruments: ['guitar', 'drums', 'bass'],
    instrumentFitNotes: {
      guitar: 'Solo Sweep-Picking & hợp âm đôi Power Chords rực lửa',
      drums: 'Đạp Kick Pedal kép, Snare Backbeat & dồn Tom-Tom',
      bass: 'Chạy Root-Octave giữ nền nhịp trầm uy lực',
    },
  },
  electronic_cyber: {
    id: 'electronic_cyber',
    name: 'Electronic / EDM & Eurobeat',
    vietnameseName: 'Điện Tử / EDM & Eurobeat',
    shortBadge: 'EDM / SYNTH',
    styleCode: 'electronic',
    accentHex: '#A855F7',
    badgeClass: 'text-purple-400',
    borderClass: 'border-purple-500/60',
    description:
      'Chuỗi nốt rải Synth Arpeggio tốc độ cao, Sub-Bass điện tử dập sâu và trống 16th-note dồn dập.',
    acousticSignature: '128–165 BPM · Giàu tần số cao (Synth Lead) & Sub-Bass sâu',
    suitableInstruments: ['synth', 'drums', 'bass'],
    instrumentFitNotes: {
      synth: 'Chuỗi rải phím Arpeggio Zíc-Zắc & hợp âm Pad đa âm',
      drums: 'Nhịp trống Four-on-the-Floor & Hi-Hat 16th-note tốc độ cao',
      bass: 'Sub-Bass Slap & Pop điện tử bám sát tiếng Kick',
    },
  },
  jazz_swing: {
    id: 'jazz_swing',
    name: 'Jazz / Big-Band & Swing',
    vietnameseName: 'Jazz / Big-Band & Swing',
    shortBadge: 'JAZZ / BRASS',
    styleCode: 'jazz',
    accentHex: '#EAB308',
    badgeClass: 'text-yellow-300',
    borderClass: 'border-yellow-400/60',
    description:
      'Kèn đồng Trumpet đảo phách, Walking Bass uyển chuyển và bộ trống Hi-Hat Swing tinh tế.',
    acousticSignature: '95–132 BPM · Đảo phách Syncopation & dải đồng (Brass) ấm',
    suitableInstruments: ['trumpet', 'bass', 'drums'],
    instrumentFitNotes: {
      trumpet: 'Hợp âm kèn đồng Big-Band Stabs & câu luyến Fanfare',
      bass: 'Walking Bass & nhảy quãng 8 Slap-Pop giàu nhạc tính',
      drums: 'Nhịp Ride/Hi-Hat Swing đảo phách & luyến Snare',
    },
  },
  pop_kpop: {
    id: 'pop_kpop',
    name: 'Pop / K-Pop & Modern Dance',
    vietnameseName: 'Pop / K-Pop & Vũ Đạo',
    shortBadge: 'POP / K-POP',
    styleCode: 'pop',
    accentHex: '#EC4899',
    badgeClass: 'text-pink-400',
    borderClass: 'border-pink-500/60',
    description:
      'Giai điệu Hook bắt tai trên phím Synth, Guitar Funky chặt hợp âm và nhịp trống Dance sôi động.',
    acousticSignature: '110–145 BPM · Cân bằng 3 dải tần, Hook điệp khúc bùng nổ',
    suitableInstruments: ['synth', 'guitar', 'drums'],
    instrumentFitNotes: {
      synth: 'Đánh giai điệu Hook chính & hợp âm Synth Pop sáng',
      guitar: 'Chặt hợp âm Funky Rhythm & tỉa Lead điệp khúc',
      drums: 'Nhịp trống Dance-Pop bắt tai & Crash mở đầu Chorus',
    },
  },
  classical_symphonic: {
    id: 'classical_symphonic',
    name: 'Symphonic / Classical & OST',
    vietnameseName: 'Giao Hưởng / Cổ Điển & Nhạc Phim',
    shortBadge: 'SYMPHONIC',
    styleCode: 'classical',
    accentHex: '#F472B6',
    badgeClass: 'text-rose-300',
    borderClass: 'border-rose-400/60',
    description:
      'Đàn Violin kéo vĩ Legato ngân dài, kèn đồng Trumpet giao hưởng và phím đàn Piano/Synth hoành tráng.',
    acousticSignature: 'Dynamic Range rộng (>11 dB) · Nhiều nốt ngân dài Legato',
    suitableInstruments: ['violin', 'trumpet', 'synth'],
    instrumentFitNotes: {
      violin: 'Kéo vĩ Legato ngân dài mượt mà & song âm quãng 5 cổ điển',
      trumpet: 'Kèn đồng Fanfare giao hưởng nâng cao trào bản nhạc',
      synth: 'Hợp âm đại dương cầm / Dàn dây полифони (Polyphonic Pads)',
    },
  },
  hiphop_funk: {
    id: 'hiphop_funk',
    name: 'Hip-Hop / Funk & Groove R&B',
    vietnameseName: 'Hip-Hop / Funk & Groove',
    shortBadge: 'HIP-HOP / FUNK',
    styleCode: 'hiphop',
    accentHex: '#06B6D4',
    badgeClass: 'text-cyan-400',
    borderClass: 'border-cyan-500/60',
    description:
      'Nhịp trống Boom-Bap chắc nịch, Bass Slap-Pop dải trầm sâu và tiếng kèn đồng Funk điểm xuyết.',
    acousticSignature: '85–115 BPM · Dải trầm (Low/Sub-Bass) chiếm ưu thế (>38%)',
    suitableInstruments: ['drums', 'bass', 'trumpet'],
    instrumentFitNotes: {
      drums: 'Nhịp trống Boom-Bap Kick/Snare Pocket chuẩn xác',
      bass: 'Groove Sub-Bass Slap & Pop nảy từng phách',
      trumpet: 'Tiếng kèn đồng Funk/Soul điểm nhấn đầu khuôn nhạc',
    },
  },
};

export const SMART_GENRE_LIST: SmartGenreDefinition[] = Object.values(SMART_GENRE_CATALOG);

export interface SmartClassificationResult {
  genreId: SmartGenreId;
  genreName: string;
  vietnameseGenreName: string;
  /** Strictly maximum 3 suitable instruments for this song/genre */
  allowedInstruments: InstrumentType[];
  primaryInstrument: InstrumentType;
  autoClassifyReason: string;
  confidencePct: number;
}

/**
 * Intelligent Genre Classifier:
 * Automatically classifies any song (from title/filename + DSP spectral 3-band energy, BPM, dynamic range & sustain ratio)
 * into one of the 6 Smart Genres and assigns at most 3 suitable instruments.
 */
export function classifySmartGenre(input: {
  title?: string;
  fileName?: string;
  bpm: number;
  lowEnergyPct?: number;
  midEnergyPct?: number;
  highEnergyPct?: number;
  dynamicRangeDb?: number;
  sustainRatio?: number;
}): SmartClassificationResult {
  const text = `${input.title || ''} ${input.fileName || ''}`.toLowerCase();
  const bpm = input.bpm || 128;
  const low = input.lowEnergyPct ?? 34;
  const mid = input.midEnergyPct ?? 36;
  const high = input.highEnergyPct ?? 30;
  const dyn = input.dynamicRangeDb ?? 10;
  const sustain = input.sustainRatio ?? 0.2;

  let detectedId: SmartGenreId = 'pop_kpop';
  let reason = '';
  let confidence = 91;

  // 1. Metadata / Filename Keyword & Style Recognition
  if (/(jazz|swing|bossa|blues|brass|big\s*band|sax|trumpet)/i.test(text)) {
    detectedId = 'jazz_swing';
    reason = `Nhận diện cấu trúc Jazz/Swing (${bpm} BPM, dải Mid/Brass ${mid}%)`;
    confidence = 97;
  } else if (/(eurobeat|edm|synth|cyber|techno|trance|house|electro|club|rave|dubstep)/i.test(text)) {
    detectedId = 'electronic_cyber';
    reason = `Nhận diện âm sắc Electronic/Eurobeat (${bpm} BPM, dải High/Synth ${high}%)`;
    confidence = 96;
  } else if (/(k-pop|kpop|k_pop|pop|idol|dance|disco)/i.test(text)) {
    detectedId = 'pop_kpop';
    reason = `Nhận diện cấu trúc Pop / K-Pop (${bpm} BPM, giai điệu Hook cân bằng 3 dải tần)`;
    confidence = 96;
  } else if (/(rock|metal|punk|grunge|arena|overdrive|riff|shred)/i.test(text)) {
    detectedId = 'rock_metal';
    reason = `Nhận diện năng lượng Rock / Metal (${bpm} BPM, dải Mid/Guitar Riff ${mid}%)`;
    confidence = 97;
  } else if (/(violin|classical|symphon|orchestra|sonata|concerto|ost|cinematic|piano|waltz|chamber|baroque)/i.test(text)) {
    detectedId = 'classical_symphonic';
    reason = `Nhận diện âm hưởng Giao Hưởng / Cổ Điển (Độ động ${dyn} dB, nhiều nốt Legato ngân dài)`;
    confidence = 96;
  } else if (/(hiphop|hip-hop|hip_hop|rap|trap|funk|groove|boom|lofi|lo-fi|r&b|rnb|soul)/i.test(text)) {
    detectedId = 'hiphop_funk';
    reason = `Nhận diện nhịp Hip-Hop / Funk Groove (${bpm} BPM, dải trầm Sub-Bass ${low}%)`;
    confidence = 96;
  } else {
    // 2. Pure Acoustic DSP Spectral & Tempo Classification
    if (sustain >= 0.34 || (dyn >= 13.5 && bpm < 132 && low < 36)) {
      detectedId = 'classical_symphonic';
      reason = `DSP Phân tích: Tỷ lệ nốt ngân Legato cao (${Math.round(sustain * 100)}%) & độ động rộng ${dyn} dB`;
      confidence = 92;
    } else if (low >= 41 || (bpm <= 108 && low >= 36)) {
      detectedId = 'hiphop_funk';
      reason = `DSP Phân tích: Dải trầm Sub-Bass chiếm ưu thế (${low}%) ở nhịp Groove ${bpm} BPM`;
      confidence = 93;
    } else if (bpm >= 136 && high >= 27) {
      detectedId = 'electronic_cyber';
      reason = `DSP Phân tích: Nhịp tốc độ cao ${bpm} BPM & tần số Synth/High sắc nét (${high}%)`;
      confidence = 94;
    } else if (mid >= 39 && bpm >= 116) {
      detectedId = 'rock_metal';
      reason = `DSP Phân tích: Dải trung Guitar/Snare mạnh mẽ (${mid}%) ở tốc độ ${bpm} BPM`;
      confidence = 93;
    } else if (bpm >= 92 && bpm <= 126 && dyn >= 10.5 && mid >= 33) {
      detectedId = 'jazz_swing';
      reason = `DSP Phân tích: Nhịp đảo phách ${bpm} BPM, dải kèn/Mid ${mid}% & độ động tự nhiên ${dyn} dB`;
      confidence = 90;
    } else {
      detectedId = 'pop_kpop';
      reason = `DSP Phân tích: Nhịp ${bpm} BPM hiện đại, cân bằng Trầm ${low}% · Trung ${mid}% · Cao ${high}%`;
      confidence = 91;
    }
  }

  const genreDef = SMART_GENRE_CATALOG[detectedId];
  const allowedInstruments = genreDef.suitableInstruments.slice(0, 3);

  return {
    genreId: detectedId,
    genreName: genreDef.name,
    vietnameseGenreName: genreDef.vietnameseName,
    allowedInstruments,
    primaryInstrument: allowedInstruments[0],
    autoClassifyReason: reason,
    confidencePct: confidence,
  };
}

export interface LibrarySong {
  id: string;
  title: string;
  artist: string;
  duration: string;
  bpm: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  sourceType: 'mastered' | 'synth_jam';
  styleCode: Style;
  genreId: SmartGenreId;
  /** Strictly maximum 3 suitable instruments for this track */
  allowedInstruments: InstrumentType[];
  acousticSummary: string;
  audioUrl?: string;
  beatmapUrl?: string;
  coverUrl?: string;
}

/**
 * Smart Music Library (Pre-classified into 6 genres, each with at most 3 suitable instruments)
 */
export const SMART_LIBRARY_SONGS: LibrarySong[] = [
  // === 1. JAZZ / BIG-BAND & SWING (Max 3: Trumpet, Bass, Drums) ===
  {
    id: 'Jazz_easy',
    title: 'Midnight Blue Velvet Swing',
    artist: 'Giom · Mastered Studio Session',
    duration: '1:40',
    bpm: 95,
    difficulty: 'Easy',
    sourceType: 'mastered',
    styleCode: 'jazz',
    genreId: 'jazz_swing',
    allowedInstruments: ['trumpet', 'bass', 'drums'],
    acousticSummary: 'Big-Band Brass Trumpet stabs, walking acoustic bass & brush snare swing',
    audioUrl: 'https://storage.googleapis.com/generativeai-downloads/images/jazz_easy.wav',
    beatmapUrl: 'https://storage.googleapis.com/generativeai-downloads/images/jazz_easy.json',
    coverUrl: 'https://storage.googleapis.com/generativeai-downloads/images/jazz_easy.jpg',
  },
  {
    id: 'jam-jazz-fusion',
    title: 'Golden Brass & Walking Bass Club',
    artist: 'BandMaster Jazz Quartet',
    duration: '1:40',
    bpm: 128,
    difficulty: 'Medium',
    sourceType: 'synth_jam',
    styleCode: 'jazz',
    genreId: 'jazz_swing',
    allowedInstruments: ['trumpet', 'bass', 'drums'],
    acousticSummary: 'Syncopated horn triplets, slap-pop jazz bass & tight hi-hat pocket',
  },

  // === 2. ELECTRONIC / EDM & EUROBEAT (Max 3: Synth, Drums, Bass) ===
  {
    id: 'Eurobeat_medium',
    title: 'Tokyo Neon Drift Eurobeat',
    artist: 'Giom · Mastered Studio Session',
    duration: '1:40',
    bpm: 138,
    difficulty: 'Medium',
    sourceType: 'mastered',
    styleCode: 'electronic',
    genreId: 'electronic_cyber',
    allowedInstruments: ['synth', 'drums', 'bass'],
    acousticSummary: 'High-octane cascading Synth Arpeggios, fast Eurobeat kick & sub-bass',
    audioUrl: 'https://storage.googleapis.com/generativeai-downloads/images/eurobeat_medium.wav',
    beatmapUrl: 'https://storage.googleapis.com/generativeai-downloads/images/eurobeat_medium.json',
    coverUrl: 'https://storage.googleapis.com/generativeai-downloads/images/eurobeat_medium.jpg',
  },
  {
    id: 'jam-electro-overdrive',
    title: 'Cyberpunk Arpeggio Overdrive',
    artist: 'BandMaster Synthwave Unit',
    duration: '1:40',
    bpm: 150,
    difficulty: 'Hard',
    sourceType: 'synth_jam',
    styleCode: 'electronic',
    genreId: 'electronic_cyber',
    allowedInstruments: ['synth', 'drums', 'bass'],
    acousticSummary: '150 BPM zig-zag keytar laser waves, 16th-note drum fills & octave sub-bass',
  },

  // === 3. POP / K-POP & MODERN DANCE (Max 3: Synth, Guitar, Drums) ===
  {
    id: 'K_pop_hard',
    title: 'Seoul Starlight Encore (K-Pop)',
    artist: 'Giom · Mastered Studio Session',
    duration: '1:40',
    bpm: 150,
    difficulty: 'Hard',
    sourceType: 'mastered',
    styleCode: 'pop',
    genreId: 'pop_kpop',
    allowedInstruments: ['synth', 'guitar', 'drums'],
    acousticSummary: 'Explosive K-Pop chorus synth hook, funky rhythm guitar & crisp dance drums',
    audioUrl: 'https://storage.googleapis.com/generativeai-downloads/images/k_pop_hard.wav',
    beatmapUrl: 'https://storage.googleapis.com/generativeai-downloads/images/k_pop_hard.json',
    coverUrl: 'https://storage.googleapis.com/generativeai-downloads/images/k_pop_hard.jpg',
  },
  {
    id: 'jam-pop-anthem',
    title: 'Neon Pop Stadium Anthem',
    artist: 'BandMaster Pop Collective',
    duration: '1:40',
    bpm: 128,
    difficulty: 'Medium',
    sourceType: 'synth_jam',
    styleCode: 'pop',
    genreId: 'pop_kpop',
    allowedInstruments: ['synth', 'guitar', 'drums'],
    acousticSummary: 'Bright polyphonic synth pads, melodic lead guitar hook & upbeat pop drums',
  },

  // === 4. ROCK & ARENA METAL (Max 3: Guitar, Drums, Bass) ===
  {
    id: 'jam-rock-showdown',
    title: 'Arena Rock Power Chord Showdown',
    artist: 'BandMaster Stadium Rockers',
    duration: '1:40',
    bpm: 128,
    difficulty: 'Medium',
    sourceType: 'synth_jam',
    styleCode: 'rock',
    genreId: 'rock_metal',
    allowedInstruments: ['guitar', 'drums', 'bass'],
    acousticSummary: '6-string guitar power chords, thunderous tom-tom drum fills & driving rock bass',
  },
  {
    id: 'jam-metal-shred',
    title: 'Valhalla Speed Shredder 150',
    artist: 'BandMaster Heavy Metal Guild',
    duration: '1:40',
    bpm: 150,
    difficulty: 'Hard',
    sourceType: 'synth_jam',
    styleCode: 'rock',
    genreId: 'rock_metal',
    allowedInstruments: ['guitar', 'drums', 'bass'],
    acousticSummary: 'Virtuosic 6-string sweep-picking guitar solo, double-kick pedal & galloping bass',
  },

  // === 5. SYMPHONIC / CLASSICAL & OST (Max 3: Violin, Trumpet, Synth) ===
  {
    id: 'jam-violin-concerto',
    title: 'Vivaldi Electric Storm Concerto',
    artist: 'BandMaster Chamber Virtuosi',
    duration: '1:40',
    bpm: 128,
    difficulty: 'Medium',
    sourceType: 'synth_jam',
    styleCode: 'classical',
    genreId: 'classical_symphonic',
    allowedInstruments: ['violin', 'trumpet', 'synth'],
    acousticSummary: 'Expressive bowed Violin legato ribbons, classical 5th double-stops & orchestral brass',
  },
  {
    id: 'jam-symphonic-finale',
    title: 'Crimson Symphony Finale OST',
    artist: 'BandMaster Philharmonic',
    duration: '1:40',
    bpm: 150,
    difficulty: 'Hard',
    sourceType: 'synth_jam',
    styleCode: 'classical',
    genreId: 'classical_symphonic',
    allowedInstruments: ['violin', 'trumpet', 'synth'],
    acousticSummary: 'Rapid string crossings on Electric Violin, royal Trumpet fanfare & grand synth chords',
  },

  // === 6. HIP-HOP / FUNK & GROOVE R&B (Max 3: Drums, Bass, Trumpet) ===
  {
    id: 'jam-hiphop-pocket',
    title: 'Brooklyn Boom-Bap Pocket Groove',
    artist: 'BandMaster Rhythm Section',
    duration: '1:40',
    bpm: 90,
    difficulty: 'Easy',
    sourceType: 'synth_jam',
    styleCode: 'hiphop',
    genreId: 'hiphop_funk',
    allowedInstruments: ['drums', 'bass', 'trumpet'],
    acousticSummary: '90 BPM boom-bap kick/snare groove, deep sub-bass slap & soulful brass horn accents',
  },
  {
    id: 'jam-funk-slap',
    title: 'Uptown Super-Funk Slap Session',
    artist: 'BandMaster Funk Syndicate',
    duration: '1:40',
    bpm: 128,
    difficulty: 'Medium',
    sourceType: 'synth_jam',
    styleCode: 'hiphop',
    genreId: 'hiphop_funk',
    allowedInstruments: ['drums', 'bass', 'trumpet'],
    acousticSummary: 'Octave slap-and-pop bassline, syncopated funk drumming & punchy horn stabs',
  },
];

export const FEATURED_SONGS: LibrarySong[] = SMART_LIBRARY_SONGS;

export function difficultyLabelToCode(diff: string): Difficulty {
  const lower = diff.toLowerCase();
  if (lower === 'easy') return 'easy';
  if (lower === 'hard') return 'hard';
  return 'normal';
}

