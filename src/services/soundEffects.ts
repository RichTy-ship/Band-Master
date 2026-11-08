/**
 * Multi-Instrument 6-Lane Web Audio API Synthesizer & Visual Theme Engine
 *
 * Upgraded to 6 Round Keys (A · S · D · ← · ↓ · →):
 * - Studio Drums (6-Piece Pro Kit: Kick, Snare, Hi-Hat, High Tom, Floor Tom, Crash Cymbal)
 * - Lead Guitar (6-String Standard E-A-D-G-B-E Fretboard)
 * - Bass Guitar (6-String Extended Sub-Bass B-E-A-D-G-C)
 * - Synth Keyboard (6-Key Polyphonic Keybed C5-D5-E5-G5-A5-C6)
 * - Brass Trumpet (6-Position Horn Section & Valves)
 * - Electric Violin (6-Position Virtuoso Bowed Fingerboard)
 */

import { InstrumentType } from '../types';

export const SIX_KEY_CODES = ['KeyA', 'KeyS', 'KeyD', 'ArrowLeft', 'ArrowDown', 'ArrowRight'];
export const SIX_KEY_ALT_CODES = ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6'];
export const SIX_KEY_LABELS = ['A', 'S', 'D', '←', '↓', '→'];

export interface InstrumentVisualTheme {
  name: string;
  vietnameseName: string;
  role: string;
  cockpitTitle: string;
  acousticEngine: string;
  sheetTitle: string;
  sheetStyleBadge: string;
  sheetMechanics: string;
  laneLabels: [string, string, string, string, string, string];
  laneSubLabels: [string, string, string, string, string, string];
  laneColors: [string, string, string, string, string, string];
  description: string;
  accentHex: string;
  badgeClass: string;
  borderClass: string;
  neckTint: [string, string, string];
}

export const INSTRUMENT_META: Record<InstrumentType, InstrumentVisualTheme> = {
  drums: {
    name: 'Studio Drums',
    vietnameseName: 'Trống 6 Mặt Pro Kit',
    role: 'Kick, Snare, Hi-Hat, High Tom, Floor Tom & Crash',
    cockpitTitle: 'PRO ACOUSTIC 6-PAD ROUND DRUM KIT',
    acousticEngine: 'Acoustic Shell + 6 Metallic Cymbal Partials',
    sheetTitle: 'DRUM RISER & CYMBAL PERCUSSION SHEET',
    sheetStyleBadge: 'Kick Pedal Bar · Tom Fills · 3D Cymbal Rings',
    sheetMechanics:
      'Sheet chuyên biệt cho Trống: Gồm thanh Kick Pedal ngang toàn làn 1 (A), nhịp đôi Kick + Crash (A + →), dồn trống liên hoàn qua High Tom & Floor Tom, không dùng đuôi ngân dài.',
    laneLabels: ['KICK', 'SNARE', 'HI-HAT', 'HIGH TOM', 'FLOOR TOM', 'CRASH'],
    laneSubLabels: ['Sub 60Hz', 'Rimshot', '14" Brass', '12" Rack', '16" Deep', '18" Bronze'],
    laneColors: ['#F97316', '#EF4444', '#EAB308', '#06B6D4', '#8B5CF6', '#10B981'],
    description:
      'Bộ trống 6 mặt tròn chuẩn phòng thu: Kick Pedal, Snare, Hi-Hat, High Tom, Floor Tom và Crash Cymbal với dùi trống gõ trực quan.',
    accentHex: '#F97316',
    badgeClass: 'text-orange-400',
    borderClass: 'border-orange-500/50',
    neckTint: ['rgba(28, 19, 14, 0.45)', 'rgba(22, 16, 13, 0.95)', 'rgba(32, 22, 16, 0.99)'],
  },
  guitar: {
    name: 'Lead Guitar',
    vietnameseName: 'Guitar Điện 6 Dây',
    role: '6-String Standard E-A-D-G-B-E Solo & Power Chords',
    cockpitTitle: 'CUSTOM SHOP 6-STRING ROUND FRET DECK',
    acousticEngine: 'Karplus-Strong Steel String + Humbucker + 2.8s Tube Sustain & Echo',
    sheetTitle: '6-STRING FRETBOARD & POWER CHORD SHEET',
    sheetStyleBadge: 'Power Chords · Sweep Scales · Vibrato Sustains',
    sheetMechanics:
      'Sheet cần đàn Guitar 6 dây có phím kim loại & khảm xà cừ: Kết hợp hợp âm đôi Power Chords (nối tia sét trắng), chạy ngón Sweep-Picking 6 dây và đuôi ngân Vibrato.',
    laneLabels: ['String E2', 'String A2', 'String D3', 'String G3', 'String B3', 'String E4'],
    laneSubLabels: ['E5 Power', 'A5 Power', 'D5 Power', 'Solo G4', 'Bend B4', 'Lead E5'],
    laneColors: ['#10B981', '#F43F5E', '#F59E0B', '#06B6D4', '#8B5CF6', '#EC4899'],
    description:
      'Cần đàn Guitar điện 6 dây thật sự: Mô phỏng vật lý dây thép Karplus-Strong, Pickup Humbucker, rải hợp âm Power Chord 3 dây, ngân vang 2.8 giây kèm Vibrato & Stereo Delay.',
    accentHex: '#F43F5E',
    badgeClass: 'text-rose-400',
    borderClass: 'border-rose-500/50',
    neckTint: ['rgba(30, 18, 22, 0.45)', 'rgba(22, 14, 18, 0.96)', 'rgba(34, 20, 26, 0.99)'],
  },
  bass: {
    name: 'Bass Guitar',
    vietnameseName: 'Guitar Bass 6 Dây',
    role: 'Extended 6-String Slap & Sub-Bass Groove',
    cockpitTitle: '6-STRING EXTENDED SUB-BASS NECK',
    acousticEngine: 'Wound-Steel Waveguide + Sub-Sine + Slap Fret Clank (1.6s Sustain)',
    sheetTitle: 'SUB-BASS GRAPHITE NECK & SLAP GROOVE SHEET',
    sheetStyleBadge: 'Slap & Pop Octaves · Staccato Groove · Sub Shockwaves',
    sheetMechanics:
      'Sheet cần đàn Bass Graphite 6 dây trầm: Chuyên nhịp Slap & Pop nhảy quãng tám (dây trầm A-S-D bật sang dây cao ←-↓-→), nốt nảy dứt khoát và sóng xung kích Sub-Bass.',
    laneLabels: ['Bass B0', 'Bass E1', 'Bass A1', 'Bass D2', 'Bass G2', 'Bass C3'],
    laneSubLabels: ['Deep Sub', 'Low Root', 'Pocket', 'Slap', 'Pop', 'Thumb Lead'],
    laneColors: ['#06B6D4', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#F97316'],
    description:
      'Cần đàn Bass 6 dây dải trầm mở rộng (B0–C3) tạo sóng âm trầm uy lực và hiệu ứng rung dây Slap Bass trên từng nhịp bấm.',
    accentHex: '#06B6D4',
    badgeClass: 'text-cyan-400',
    borderClass: 'border-cyan-500/50',
    neckTint: ['rgba(12, 24, 34, 0.45)', 'rgba(11, 19, 28, 0.96)', 'rgba(16, 28, 40, 0.99)'],
  },
  synth: {
    name: 'Synth Keyboard',
    vietnameseName: 'Đàn Synth 6 Phím Tròn',
    role: '6-Key Polyphonic Synth Pad & Cascading Arpeggios',
    cockpitTitle: '6-PAD POLYPHONIC SYNTH CONTROLLER',
    acousticEngine: '3-Voice SuperSaw + FM Metallic Bell + Stereo Delay',
    sheetTitle: 'CYBER PIANO-ROLL MATRIX & ARPEGGIO SHEET',
    sheetStyleBadge: 'Zig-Zag Arpeggios · Polyphonic Pads · Step Matrix',
    sheetMechanics:
      'Sheet ma trận Piano-Roll điện tử: Nổi bật với chuỗi nốt rải Arpeggio lượn sóng liên kết bằng tia laser và hợp âm Pad ngân dài đa âm sắc.',
    laneLabels: ['Synth C5', 'Synth D5', 'Synth E5', 'Synth G5', 'Synth A5', 'Synth C6'],
    laneSubLabels: ['Saw Root', 'Detune 2nd', 'Major 3rd', 'Fifth Pad', 'Sixth Lead', 'Octave Bell'],
    laneColors: ['#10B981', '#06B6D4', '#3B82F6', '#A855F7', '#EC4899', '#F59E0B'],
    description:
      'Bàn điều khiển Synth 6 phím tròn đa âm sắc với hợp âm rải Arpeggio và dải màu Neon chạy mượt mà.',
    accentHex: '#10B981',
    badgeClass: 'text-emerald-400',
    borderClass: 'border-emerald-500/50',
    neckTint: ['rgba(12, 28, 24, 0.45)', 'rgba(12, 22, 20, 0.96)', 'rgba(16, 30, 26, 0.99)'],
  },
  trumpet: {
    name: 'Brass Trumpet',
    vietnameseName: 'Kèn Đồng 6 Van Tròn',
    role: 'Big-Band 6-Note Horn Section & Brass Stabs',
    cockpitTitle: '6-VALVE BRASS HORN ENSEMBLE DECK',
    acousticEngine: 'Dual-Formant Horn Bell + Breath Chiff + Lip Blat',
    sheetTitle: 'GOLDEN BRASS VALVE & HORN FANFARE SHEET',
    sheetStyleBadge: 'Brass Horn Stabs · Fanfare Triplets · Swell Notes',
    sheetMechanics:
      'Sheet Kèn Đồng 6 van Piston mạ vàng: Tập trung vào các cú nhấn hợp âm kèn đồng (Brass Stabs), chùm ba Fanfare và nốt thổi ngân vang dội từ loa kèn.',
    laneLabels: ['Horn Bb3', 'Horn D4', 'Horn F4', 'Horn G4', 'Horn Bb4', 'Horn D5'],
    laneSubLabels: ['Low Brass', 'Warm Mid', 'Open Horn', 'Swing Lead', 'High Blast', 'Soprano'],
    laneColors: ['#F59E0B', '#EAB308', '#F97316', '#06B6D4', '#10B981', '#EC4899'],
    description:
      'Dàn kèn đồng 6 nút van tròn mạ vàng tạo tiếng kèn Brass dứt khoát và sóng xung kích đồng tâm rực rỡ.',
    accentHex: '#EAB308',
    badgeClass: 'text-amber-400',
    borderClass: 'border-amber-500/50',
    neckTint: ['rgba(32, 26, 12, 0.45)', 'rgba(24, 20, 10, 0.96)', 'rgba(36, 28, 12, 0.99)'],
  },
  violin: {
    name: 'Electric Violin',
    vietnameseName: 'Violin Điện 6 Vị Trí',
    role: 'Symphonic 6-Position Fingerboard & Bowed Lead',
    cockpitTitle: '6-POSITION VIRTUOSO BOWED DECK',
    acousticEngine: 'Stradivarius 3-Formant Body + Rosin Bow + Vibrato',
    sheetTitle: 'FRETLESS EBONY FINGERBOARD & BOWED LEGATO SHEET',
    sheetStyleBadge: 'Long Bowed Legato · Double-Stops · 3D Violin Bow',
    sheetMechanics:
      'Sheet cần đàn Violin gỗ mun không phím (Fretless) với khe thoát âm chữ F: Chuyên các dải ngân vĩ kéo Legato dài mượt mà, chuyển dây liền bậc và hợp âm kép Double-Stop.',
    laneLabels: ['Pos G3', 'Pos D4', 'Pos A4', 'Pos E5', 'Pos A5', 'Pos E6'],
    laneSubLabels: ['Warm G', 'Lyric D', 'Sweet A', 'Bright E', 'Harmonic', 'Vivace'],
    laneColors: ['#F43F5E', '#EC4899', '#A855F7', '#F59E0B', '#06B6D4', '#10B981'],
    description:
      'Cần đàn Violin điện 6 vị trí bấm tròn kết hợp vĩ kéo chuyển động mềm mại ngang qua sân khấu 3D.',
    accentHex: '#EC4899',
    badgeClass: 'text-pink-400',
    borderClass: 'border-pink-500/50',
    neckTint: ['rgba(30, 14, 24, 0.45)', 'rgba(22, 12, 19, 0.96)', 'rgba(34, 16, 28, 0.99)'],
  },
};

export type AcousticTonePreset = 'studio' | 'concert' | 'overdrive';

export const ACOUSTIC_TONE_PRESETS: Record<
  AcousticTonePreset,
  { label: string; vietnameseLabel: string; reverbWet: number; driveAmount: number; desc: string }
> = {
  studio: {
    label: 'Studio Master',
    vietnameseLabel: 'Phòng Thu Hi-Fi',
    reverbWet: 0.24,
    driveAmount: 1.15,
    desc: 'Âm thanh phòng thu chi tiết, cân bằng 3 dải tần & độ tách bạch Stereo 6 làn',
  },
  concert: {
    label: '3D Concert Hall',
    vietnameseLabel: 'Sân Khấu Vòm 3D',
    reverbWet: 0.44,
    driveAmount: 1.1,
    desc: 'Không gian đại sảnh vòm 3D vang rộng, giàu âm hưởng giao hưởng & Live Arena',
  },
  overdrive: {
    label: 'Tube Amp Warmth',
    vietnameseLabel: 'Khuếch Đại Ống Đèn',
    reverbWet: 0.28,
    driveAmount: 1.65,
    desc: 'Tăng hài âm ống đèn (Tube Saturation), lực đập Sub-Bass & độ dày hợp âm',
  },
};

const LANE_STEREO_PAN = [-0.52, -0.31, -0.1, 0.1, 0.31, 0.52];

class SoundEffectsEngine {
  private ctx: AudioContext | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private impulseBuffer: AudioBuffer | null = null;
  private guitarBufferCache: Map<string, AudioBuffer> = new Map();
  private bassBufferCache: Map<string, AudioBuffer> = new Map();
  private activeStringGain: Map<string, { gain: GainNode; stopTime: number }> = new Map();

  private masterGain: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private dryBus: GainNode | null = null;
  private reverbConvolver: ConvolverNode | null = null;
  private reverbWetGain: GainNode | null = null;
  private delaySendBus: GainNode | null = null;
  private tubeDriveCurve: Float32Array<ArrayBuffer> | null = null;

  private tonePreset: AcousticTonePreset = 'studio';
  private masterVolume: number = 0.94;
  private demoTimers: number[] = [];

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx({ latencyHint: 'interactive' });
        this.setupMasterChain(this.ctx);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private setupMasterChain(ctx: AudioContext) {
    // 1. Master Dynamics Compressor (Glue & Peak Protection)
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.setValueAtTime(-13, ctx.currentTime);
    comp.knee.setValueAtTime(16, ctx.currentTime);
    comp.ratio.setValueAtTime(3.2, ctx.currentTime);
    comp.attack.setValueAtTime(0.004, ctx.currentTime);
    comp.release.setValueAtTime(0.22, ctx.currentTime);

    // 2. Master Output Gain
    const master = ctx.createGain();
    master.gain.setValueAtTime(this.masterVolume, ctx.currentTime);

    // 3. Dry Bus
    const dry = ctx.createGain();
    dry.gain.setValueAtTime(0.9, ctx.currentTime);

    // 4. Stereo Hall Convolver Reverb Bus (2.1s Lush Concert Hall Tail)
    const convolver = ctx.createConvolver();
    convolver.buffer = this.getImpulseBuffer(ctx);

    const wet = ctx.createGain();
    wet.gain.setValueAtTime(ACOUSTIC_TONE_PRESETS[this.tonePreset].reverbWet, ctx.currentTime);

    // 5. Stereo Ping-Pong Tape Delay Bus (For Lead Guitar, Violin & Synth Sustain)
    const delaySend = ctx.createGain();
    delaySend.gain.setValueAtTime(0.32, ctx.currentTime);

    const delayL = ctx.createDelay(1.0);
    const delayR = ctx.createDelay(1.0);
    delayL.delayTime.setValueAtTime(0.24, ctx.currentTime); // 240ms Left Echo
    delayR.delayTime.setValueAtTime(0.36, ctx.currentTime); // 360ms Right Dotted Echo

    const fbL = ctx.createGain();
    const fbR = ctx.createGain();
    fbL.gain.setValueAtTime(0.34, ctx.currentTime);
    fbR.gain.setValueAtTime(0.3, ctx.currentTime);

    const delayTone = ctx.createBiquadFilter();
    delayTone.type = 'lowpass';
    delayTone.frequency.setValueAtTime(2450, ctx.currentTime);

    const delayMerger = ctx.createChannelMerger(2);
    const delayReturn = ctx.createGain();
    delayReturn.gain.setValueAtTime(0.35, ctx.currentTime);

    delaySend.connect(delayTone);
    delayTone.connect(delayL);
    delayTone.connect(delayR);

    delayL.connect(fbL);
    fbL.connect(delayR);
    delayR.connect(fbR);
    fbR.connect(delayL);

    delayL.connect(delayMerger, 0, 0);
    delayR.connect(delayMerger, 0, 1);
    delayMerger.connect(delayReturn);

    dry.connect(comp);
    convolver.connect(wet);
    wet.connect(comp);
    delayReturn.connect(comp);
    delayReturn.connect(convolver);
    comp.connect(master);
    master.connect(ctx.destination);

    this.compressor = comp;
    this.masterGain = master;
    this.dryBus = dry;
    this.reverbConvolver = convolver;
    this.reverbWetGain = wet;
    this.delaySendBus = delaySend;
  }

  public setTonePreset(preset: AcousticTonePreset) {
    this.tonePreset = preset;
    this.tubeDriveCurve = null;
    const ctx = this.getContext();
    if (ctx && this.reverbWetGain) {
      this.reverbWetGain.gain.setTargetAtTime(
        ACOUSTIC_TONE_PRESETS[preset].reverbWet,
        ctx.currentTime,
        0.04
      );
    }
  }

  public getTonePreset(): AcousticTonePreset {
    return this.tonePreset;
  }

  public setMasterVolume(vol: number) {
    this.masterVolume = Math.max(0.1, Math.min(1.2, vol));
    const ctx = this.getContext();
    if (ctx && this.masterGain) {
      this.masterGain.gain.setTargetAtTime(this.masterVolume, ctx.currentTime, 0.03);
    }
  }

  public getMasterVolume(): number {
    return this.masterVolume;
  }

  private getNoiseBuffer(ctx: AudioContext): AudioBuffer {
    if (this.noiseBuffer) return this.noiseBuffer;
    const bufferSize = Math.floor(ctx.sampleRate * 0.85);
    const buffer = ctx.createBuffer(2, bufferSize, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const output = buffer.getChannelData(ch);
      let b0 = 0;
      let b1 = 0;
      let b2 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.997 * b0 + white * 0.029;
        b1 = 0.985 * b1 + white * 0.032;
        b2 = 0.95 * b2 + white * 0.048;
        output[i] = white * 0.72 + (b0 + b1 + b2) * 0.28;
      }
    }
    this.noiseBuffer = buffer;
    return buffer;
  }

  /**
   * Generates a lush 2.1-second Stereo Concert Hall / Studio Room Impulse Response
   * with early reflections + smooth exponential high-frequency damping.
   */
  private getImpulseBuffer(ctx: AudioContext): AudioBuffer {
    if (this.impulseBuffer) return this.impulseBuffer;
    const duration = 2.1;
    const length = Math.floor(ctx.sampleRate * duration);
    const impulse = ctx.createBuffer(2, length, ctx.sampleRate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    // Discrete early stage reflections (first 65ms)
    const earlyTapMs = [11, 18, 26, 35, 44, 54, 64];
    earlyTapMs.forEach((ms, idx) => {
      const sampleIdx = Math.floor((ms / 1000) * ctx.sampleRate);
      if (sampleIdx < length) {
        const amp = 0.38 * Math.pow(0.84, idx);
        left[sampleIdx] += idx % 2 === 0 ? amp : amp * 0.62;
        right[sampleIdx] += idx % 2 === 1 ? amp : amp * 0.62;
      }
    });

    // Diffuse stereo reverberant tail
    let lpL = 0;
    let lpR = 0;
    for (let i = 0; i < length; i++) {
      const t = i / ctx.sampleRate;
      const env = Math.pow(1 - i / length, 2.2) * Math.exp(-t * 1.85);
      const nL = (Math.random() * 2 - 1) * env * 0.4;
      const nR = (Math.random() * 2 - 1) * env * 0.4;
      lpL = lpL * 0.48 + nL * 0.52;
      lpR = lpR * 0.48 + nR * 0.52;
      left[i] += lpL;
      right[i] += lpR;
    }

    this.impulseBuffer = impulse;
    return impulse;
  }

  private getTubeSaturationCurve(driveMultiplier: number = 1.0): Float32Array<ArrayBuffer> {
    if (this.tubeDriveCurve && driveMultiplier === 1.0) return this.tubeDriveCurve;
    const samples = 1024;
    const buffer = new ArrayBuffer(samples * 4);
    const curve = new Float32Array(buffer);
    const k = 12 * ACOUSTIC_TONE_PRESETS[this.tonePreset].driveAmount * driveMultiplier;
    for (let i = 0; i < samples; i++) {
      const x = (i * 2) / samples - 1;
      curve[i] = Math.tanh(x * (1 + k * 0.12)) * 0.92;
    }
    if (driveMultiplier === 1.0) {
      this.tubeDriveCurve = curve;
    }
    return curve;
  }

  /**
   * Synthesizes a Physical Karplus-Strong Plucked Steel String + Dual Humbucker Pickup
   * + Tube Amp Sustain Bloom + 4x12 Celestion Speaker Cabinet Stereo Buffer (2.75 seconds!).
   *
   * Eliminates 1-bit oscillator buzz and creates an authentic, long-sustaining electric guitar tone:
   * - Strings 0..2 (Keys A, S, D): Tight Power-Chord Multi-String Strum (Root + 5th + Octave with 7ms pick rake)
   * - Strings 3..5 (Keys ←, ↓, →): Singing Solo Lead Guitar with pitch-bend scoop, harmonic bloom & 5.6Hz finger vibrato
   */
  private getPhysicalGuitarBuffer(
    ctx: AudioContext,
    col: number,
    preset: AcousticTonePreset
  ): AudioBuffer {
    const cacheKey = `guitar_${col}_${preset}`;
    const cached = this.guitarBufferCache.get(cacheKey);
    if (cached) return cached;

    const sr = ctx.sampleRate;
    const duration = 2.75; // 2.75 seconds of rich natural electric guitar ring & sustain!
    const length = Math.floor(sr * duration);
    const buffer = ctx.createBuffer(2, length, sr);
    const outL = buffer.getChannelData(0);
    const outR = buffer.getChannelData(1);

    // Authentic 6-String Electric Guitar Tunings (E Minor / G Major Rock & Virtuoso Lead Voicing):
    // Low strings (0, 1, 2): E2 (82.41Hz), A2 (110.0Hz), D3 (146.83Hz) -> Power Chord Strums
    // High strings (3, 4, 5): G3 (196.0Hz), B3 (246.94Hz), E4 (329.63Hz) -> Singing Solo Lead Notes
    const baseFreqs = [82.41, 110.0, 146.83, 196.0, 246.94, 329.63];
    const rootFreq = baseFreqs[col % 6];
    const isLeadString = col >= 3;

    // Define multi-string voicing for this fret/lane:
    // Rhythm strings (A, S, D) strike a 3-string Power Chord (Root + Fifth + Octave) with 7ms pick-rake stagger.
    // Lead strings (←, ↓, →) strike a Double-Tracked Unison + Octave Harmonic + Subtle 5th Resonance.
    const stringVoicings: {
      freq: number;
      delayMs: number;
      gain: number;
      pan: number;
      damping: number;
    }[] = isLeadString
      ? [
          { freq: rootFreq * 2.0, delayMs: 0, gain: 0.62, pan: -0.35, damping: 0.9992 }, // Lead Fundamental (G4, B4, E5)
          { freq: rootFreq * 2.0018, delayMs: 4.5, gain: 0.62, pan: 0.35, damping: 0.9992 }, // Double-Tracked Stereo Twin
          { freq: rootFreq * 1.0, delayMs: 2.0, gain: 0.42, pan: 0.0, damping: 0.9994 }, // Warm Lower Octave Body (G3, B3, E4)
          { freq: rootFreq * 4.0, delayMs: 0.5, gain: 0.22, pan: 0.15, damping: 0.9982 }, // Singing Pinch Harmonic Overtone
        ]
      : [
          { freq: rootFreq, delayMs: 0, gain: 0.58, pan: -0.25, damping: 0.9993 }, // Low Root String (E2, A2, D3)
          { freq: rootFreq * 1.4983, delayMs: 7.5, gain: 0.48, pan: 0.25, damping: 0.9991 }, // Power Chord 5th (B2, E3, A3)
          { freq: rootFreq * 2.0, delayMs: 14.5, gain: 0.44, pan: -0.15, damping: 0.999 }, // Octave String (E3, A3, D4)
          { freq: rootFreq * 2.002, delayMs: 18.0, gain: 0.38, pan: 0.35, damping: 0.9989 }, // Stereo Double-Tracked Octave
        ];

    const rawL = new Float32Array(length);
    const rawR = new Float32Array(length);

    // Synthesize each physical steel string via Extended Karplus-Strong Waveguide + Magnetic Sustainer
    for (let sIdx = 0; sIdx < stringVoicings.length; sIdx++) {
      const v = stringVoicings[sIdx];
      const startSample = Math.floor((v.delayMs / 1000) * sr);
      const period = sr / v.freq;
      const delayLen = Math.max(8, Math.round(period));
      const waveguide = new Float32Array(delayLen);

      // 1. Exciting the steel string with a physical plectrum pluck profile + bridge pickup comb notch
      const rawPluck = new Float32Array(delayLen);
      let lpInit = 0;
      for (let i = 0; i < delayLen; i++) {
        const pos = i / delayLen;
        // Triangle string displacement plucked at 22% from bridge + crisp pick transient
        const tri = pos < 0.22 ? pos / 0.22 : (1 - pos) / 0.78;
        const noise = Math.sin(i * 12.9898 + sIdx * 78.233) * 43758.5453;
        const white = (noise - Math.floor(noise)) * 2 - 1;
        lpInit = lpInit * 0.52 + white * 0.48;
        rawPluck[i] = tri * 0.55 + lpInit * 0.65;
      }

      // Apply Humbucker Pickup Comb Filter (notches every 7th harmonic for warm, woody electric guitar tone)
      const combOffset = Math.max(2, Math.floor(delayLen * 0.14));
      for (let i = 0; i < delayLen; i++) {
        const prev = rawPluck[(i - combOffset + delayLen) % delayLen];
        waveguide[i] = rawPluck[i] - prev * 0.55;
      }

      let ptr = 0;
      let prevSample = 0;
      let sustainPhase = 0;
      const panL = Math.cos(((v.pan + 1) * Math.PI) / 4);
      const panR = Math.sin(((v.pan + 1) * Math.PI) / 4);

      for (let i = startSample; i < length; i++) {
        const t = (i - startSample) / sr;

        // Karplus-Strong waveguide reflection with progressive high-frequency string damping
        const curr = waveguide[ptr];
        const next = waveguide[(ptr + 1) % delayLen];
        // Bright steel attack in first 120ms, smoothing into warm woody sustain
        const brightFactor = t < 0.12 ? 0.14 : 0.24;
        const filtered = ((1 - brightFactor) * curr + brightFactor * next) * v.damping;
        waveguide[ptr] = filtered;
        ptr = (ptr + 1) % delayLen;

        // Expressive pitch modulation for sustained tube-amp harmonic bloom
        // Lead strings bend up slightly on attack (-25 cents -> 0) and develop 5.6Hz finger vibrato
        const bendEnv = isLeadString ? 1 - 0.015 * Math.exp(-t * 36) : 1;
        const vibDepth = isLeadString ? Math.min(1, Math.max(0, (t - 0.14) / 0.22)) * 0.0075 : 0.0018;
        const vibMod = Math.sin(2 * Math.PI * 5.6 * t + sIdx) * vibDepth;
        const instFreq = v.freq * bendEnv * (1 + vibMod);
        sustainPhase += (2 * Math.PI * instFreq) / sr;

        // Magnetic Pickup Sustainer & Tube Feedback Bloom:
        // Keeps the guitar string singing warmly for 2.5+ seconds instead of dying out like a dry pluck!
        const bloomAttack = Math.min(1, t / 0.065);
        const bloomDecay = Math.exp(-t * (isLeadString ? 0.95 : 1.15));
        const bloomEnv = bloomAttack * bloomDecay;

        // Rich multi-harmonic pickup waveform (Fundamental + Even 2nd Harmonic Tube Warmth + Singing 3rd Harmonic)
        const pickupBloom =
          (Math.sin(sustainPhase) * 0.56 +
            Math.sin(sustainPhase * 2 + 0.3) * 0.34 +
            Math.sin(sustainPhase * 3 + 0.7) * 0.18 +
            Math.sin(sustainPhase * 4) * 0.07) *
          bloomEnv *
          0.46;

        // Combine physical Karplus-Strong plucked string + singing magnetic pickup sustain
        const stringOut = (filtered * 0.85 + pickupBloom) * v.gain;
        prevSample = prevSample * 0.15 + stringOut * 0.85;

        rawL[i] += prevSample * panL;
        rawR[i] += prevSample * panR;
      }
    }

    // 2. Add Crisp Plectrum Pick Scrape on the first 16ms
    const pickSamples = Math.floor(0.016 * sr);
    let pickBpState1 = 0;
    let pickBpState2 = 0;
    for (let i = 0; i < pickSamples; i++) {
      const t = i / sr;
      const env = Math.exp(-t * 190);
      const n = (Math.sin(i * 91.7) * 2 - 1) * env * 0.35;
      pickBpState1 = pickBpState1 * 0.65 + n * 0.35;
      const pick = pickBpState1 - pickBpState2;
      pickBpState2 = pickBpState1;
      rawL[i] += pick * 0.45;
      rawR[i] += pick * 0.45;
    }

    // 3. Tube Amplifier Preamp (Asymmetric 12AX7 Warmth) + 4x12 Celestion Guitar Cabinet Simulation
    const driveGain =
      preset === 'overdrive'
        ? isLeadString
          ? 2.85
          : 2.45
        : preset === 'concert'
        ? isLeadString
          ? 2.15
          : 1.85
        : isLeadString
        ? 2.35
        : 2.0;

    // 2-pole Cabinet Lowpass (~3.2kHz) + Highpass (~95Hz) + Midrange Vocal Presence State
    let hpL = 0;
    let hpR = 0;
    let lp1L = 0;
    let lp2L = 0;
    let lp1R = 0;
    let lp2R = 0;
    let midStateL = 0;
    let midStateR = 0;

    for (let i = 0; i < length; i++) {
      const t = i / sr;
      // Smooth master fade-out over the last 350ms so the 2.75s sustain never clicks at the end
      const tailFade =
        t > duration - 0.35 ? Math.max(0, (duration - t) / 0.35) : 1.0;

      // High-pass at ~95Hz before tube distortion to keep low power-chords tight
      hpL = 0.986 * (hpL + rawL[i] - (i > 0 ? rawL[i - 1] : 0));
      hpR = 0.986 * (hpR + rawR[i] - (i > 0 ? rawR[i - 1] : 0));

      const xL = hpL * driveGain;
      const xR = hpR * driveGain;

      // Asymmetric 12AX7 Tube Preamp Transfer Function (generates warm 2nd-order even harmonics, NOT 1-bit square clip!)
      const tubeL = Math.tanh(xL + 0.14 * xL * xL) - 0.06;
      const tubeR = Math.tanh(xR + 0.14 * xR * xR) - 0.06;

      // 4x12 Celestion Speaker Cabinet Roll-Off (2-stage lowpass at ~3.3kHz removes all digital buzz)
      lp1L += 0.36 * (tubeL - lp1L);
      lp2L += 0.38 * (lp1L - lp2L);

      lp1R += 0.36 * (tubeR - lp1R);
      lp2R += 0.38 * (lp1R - lp2R);

      // Woody Midrange Cabinet Resonance (~650Hz - 1.6kHz)
      midStateL += 0.11 * (lp2L - midStateL);
      midStateR += 0.11 * (lp2R - midStateR);
      const cabL = (lp2L + (lp2L - midStateL) * 0.42) * 0.42 * tailFade;
      const cabR = (lp2R + (lp2R - midStateR) * 0.42) * 0.42 * tailFade;

      outL[i] = cabL;
      outR[i] = cabR;
    }

    this.guitarBufferCache.set(cacheKey, buffer);
    return buffer;
  }

  /**
   * Synthesizes a Physical Karplus-Strong Wound-Steel Bass Guitar String + Sub-Bass Fundamental (1.55s sustain).
   */
  private getPhysicalBassBuffer(ctx: AudioContext, col: number): AudioBuffer {
    const cacheKey = `bass_${col}`;
    const cached = this.bassBufferCache.get(cacheKey);
    if (cached) return cached;

    const sr = ctx.sampleRate;
    const duration = 1.55;
    const length = Math.floor(sr * duration);
    const buffer = ctx.createBuffer(2, length, sr);
    const outL = buffer.getChannelData(0);
    const outR = buffer.getChannelData(1);

    const bassFreqs = [55.0, 65.41, 73.42, 82.41, 98.0, 110.0]; // A1, C2, D2, E2, G2, A2
    const freq = bassFreqs[col % 6];
    const isSlapPop = col >= 3;

    const delayLen = Math.max(12, Math.round(sr / freq));
    const waveguide = new Float32Array(delayLen);
    for (let i = 0; i < delayLen; i++) {
      const pos = i / delayLen;
      const tri = pos < 0.25 ? pos / 0.25 : (1 - pos) / 0.75;
      const noise = Math.sin(i * 45.123 + col * 19.7) * 2 - 1;
      waveguide[i] = tri * 0.65 + noise * (isSlapPop ? 0.55 : 0.32);
    }

    let ptr = 0;
    let subPhase = 0;
    let lpState = 0;
    for (let i = 0; i < length; i++) {
      const t = i / sr;
      const curr = waveguide[ptr];
      const next = waveguide[(ptr + 1) % delayLen];
      const damp = isSlapPop ? 0.16 : 0.25;
      const filtered = ((1 - damp) * curr + damp * next) * 0.9985;
      waveguide[ptr] = filtered;
      ptr = (ptr + 1) % delayLen;

      subPhase += (2 * Math.PI * freq) / sr;
      const subEnv = Math.min(1, t / 0.008) * Math.exp(-t * 1.85);
      const subWave = Math.sin(subPhase) * 0.62 * subEnv;
      const slapGrowl = Math.sin(subPhase * 2) * Math.exp(-t * 6.5) * (isSlapPop ? 0.35 : 0.2);

      // Slap Fret Clank on first 14ms
      const fretClank =
        t < 0.014 ? Math.sin(2 * Math.PI * 1680 * t) * Math.exp(-t * 160) * (isSlapPop ? 0.24 : 0.12) : 0;

      const raw = filtered * 0.55 + subWave + slapGrowl + fretClank;
      const warm = Math.tanh(raw * 1.45) * 0.52;
      lpState += (isSlapPop ? 0.32 : 0.22) * (warm - lpState);

      const tailFade = t > duration - 0.2 ? Math.max(0, (duration - t) / 0.2) : 1.0;
      outL[i] = lpState * tailFade;
      outR[i] = lpState * tailFade;
    }

    this.bassBufferCache.set(cacheKey, buffer);
    return buffer;
  }

  /**
   * Routes an instrument voice into the stereo panner, dry bus, studio reverb send, and optional delay send.
   */
  private routeToMaster(
    ctx: AudioContext,
    sourceNode: AudioNode,
    col: number,
    reverbSendAmount: number = 0.28,
    delaySendAmount: number = 0.0
  ) {
    if (!this.dryBus || !this.reverbConvolver) {
      this.setupMasterChain(ctx);
    }
    const panVal = LANE_STEREO_PAN[col % 6] || 0;
    let outputNode: AudioNode = sourceNode;

    if (typeof ctx.createStereoPanner === 'function') {
      const panner = ctx.createStereoPanner();
      panner.pan.setValueAtTime(panVal, ctx.currentTime);
      sourceNode.connect(panner);
      outputNode = panner;
    }

    if (this.dryBus) {
      outputNode.connect(this.dryBus);
    } else {
      outputNode.connect(ctx.destination);
    }

    if (this.reverbConvolver && reverbSendAmount > 0.01) {
      const sendGain = ctx.createGain();
      sendGain.gain.setValueAtTime(reverbSendAmount, ctx.currentTime);
      outputNode.connect(sendGain);
      sendGain.connect(this.reverbConvolver);
    }

    if (this.delaySendBus && delaySendAmount > 0.01) {
      const dGain = ctx.createGain();
      dGain.gain.setValueAtTime(delaySendAmount, ctx.currentTime);
      outputNode.connect(dGain);
      dGain.connect(this.delaySendBus);
    }
  }

  /**
   * Plays an instrument-specific note hit or miss sound across 6 lanes (0..5),
   * supporting optional sustain duration for long notes.
   */
  public playHitSound(
    judgment: 'PERFECT' | 'GREAT' | 'GOOD' | 'MISS',
    column: number = 0,
    instrument: InstrumentType = 'drums',
    sustainDuration?: number
  ) {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    if (judgment === 'MISS') {
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(118, now);
      osc.frequency.exponentialRampToValueAtTime(52, now + 0.16);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(420, now);

      gain.gain.setValueAtTime(0.09, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

      osc.connect(filter);
      filter.connect(gain);
      this.routeToMaster(ctx, gain, column, 0.1);
      osc.start(now);
      osc.stop(now + 0.17);
      return;
    }

    const volScale = judgment === 'PERFECT' ? 1.05 : judgment === 'GREAT' ? 0.88 : 0.72;
    this.triggerInstrumentVoice(
      ctx,
      now,
      Math.abs(column) % 6,
      instrument,
      volScale,
      sustainDuration
    );
  }

  /**
   * Multi-Layer Studio Physical Modeling Synthesizer for all 6 Instruments
   */
  private triggerInstrumentVoice(
    ctx: AudioContext,
    now: number,
    col: number,
    instrument: InstrumentType,
    volScale: number,
    sustainSec?: number
  ) {
    const synthFreqs = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25]; // C4, D4, E4, G4, A4, C5
    const trumpetFreqs = [233.08, 293.66, 349.23, 392.0, 466.16, 587.33]; // Bb3, D4, F4, G4, Bb4, D5
    const violinFreqs = [196.0, 293.66, 440.0, 523.25, 659.25, 783.99]; // G3, D4, A4, C5, E5, G5

    // =========================================================================
    // 1. STUDIO DRUMS (6-Piece Pro Acoustic Kit)
    // =========================================================================
    if (instrument === 'drums') {
      if (col === 0) {
        // LANE 0 (A): 22" STUDIO BASS KICK DRUM (Sub Sine Drop + Mid Punch + Beater Skin Click)
        const outBus = ctx.createGain();
        outBus.gain.setValueAtTime(1.0, now);
        this.routeToMaster(ctx, outBus, 0, 0.14);

        const sub = ctx.createOscillator();
        const subGain = ctx.createGain();
        sub.type = 'sine';
        sub.frequency.setValueAtTime(185, now);
        sub.frequency.exponentialRampToValueAtTime(58, now + 0.045);
        sub.frequency.exponentialRampToValueAtTime(42, now + 0.24);
        subGain.gain.setValueAtTime(0.64 * volScale, now);
        subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
        sub.connect(subGain);
        subGain.connect(outBus);
        sub.start(now);
        sub.stop(now + 0.29);

        const punch = ctx.createOscillator();
        const punchGain = ctx.createGain();
        punch.type = 'triangle';
        punch.frequency.setValueAtTime(125, now);
        punch.frequency.exponentialRampToValueAtTime(48, now + 0.09);
        punchGain.gain.setValueAtTime(0.32 * volScale, now);
        punchGain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);
        punch.connect(punchGain);
        punchGain.connect(outBus);
        punch.start(now);
        punch.stop(now + 0.12);

        const clickOsc = ctx.createOscillator();
        const clickGain = ctx.createGain();
        clickOsc.type = 'triangle';
        clickOsc.frequency.setValueAtTime(1650, now);
        clickOsc.frequency.exponentialRampToValueAtTime(180, now + 0.018);
        clickGain.gain.setValueAtTime(0.22 * volScale, now);
        clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.022);
        clickOsc.connect(clickGain);
        clickGain.connect(outBus);
        clickOsc.start(now);
        clickOsc.stop(now + 0.025);
      } else if (col === 1) {
        // LANE 1 (S): 14" MAPLE SNARE DRUM (Dual Shell Modes + Rimshot + Stereo Snare Wires)
        const outBus = ctx.createGain();
        outBus.gain.setValueAtTime(1.0, now);
        this.routeToMaster(ctx, outBus, 1, 0.36);

        [188, 332].forEach((modeFreq, idx) => {
          const body = ctx.createOscillator();
          const bodyGain = ctx.createGain();
          body.type = idx === 0 ? 'triangle' : 'sine';
          body.frequency.setValueAtTime(modeFreq * 1.35, now);
          body.frequency.exponentialRampToValueAtTime(modeFreq, now + 0.035);
          body.frequency.exponentialRampToValueAtTime(modeFreq * 0.72, now + 0.14);
          bodyGain.gain.setValueAtTime((idx === 0 ? 0.38 : 0.18) * volScale, now);
          bodyGain.gain.exponentialRampToValueAtTime(0.001, now + (idx === 0 ? 0.15 : 0.09));
          body.connect(bodyGain);
          bodyGain.connect(outBus);
          body.start(now);
          body.stop(now + 0.16);
        });

        const noise = ctx.createBufferSource();
        noise.buffer = this.getNoiseBuffer(ctx);
        const hp = ctx.createBiquadFilter();
        hp.type = 'highpass';
        hp.frequency.setValueAtTime(1100, now);
        const peak = ctx.createBiquadFilter();
        peak.type = 'peaking';
        peak.frequency.setValueAtTime(3400, now);
        peak.Q.setValueAtTime(1.2, now);
        peak.gain.setValueAtTime(6, now);

        const wireGain = ctx.createGain();
        wireGain.gain.setValueAtTime(0.38 * volScale, now);
        wireGain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);

        noise.connect(hp);
        hp.connect(peak);
        peak.connect(wireGain);
        wireGain.connect(outBus);
        noise.start(now);
        noise.stop(now + 0.25);
      } else if (col === 2) {
        // LANE 2 (D): 14" BRASS HI-HAT
        const outBus = ctx.createGain();
        outBus.gain.setValueAtTime(1.0, now);
        this.routeToMaster(ctx, outBus, 2, 0.2);

        const metalRatios = [205.3, 304.4, 369.6, 522.7, 680.0, 812.0];
        const metalHp = ctx.createBiquadFilter();
        metalHp.type = 'highpass';
        metalHp.frequency.setValueAtTime(7200, now);
        const metalGain = ctx.createGain();
        metalGain.gain.setValueAtTime(0.11 * volScale, now);
        metalGain.gain.exponentialRampToValueAtTime(0.001, now + 0.075);
        metalHp.connect(metalGain);
        metalGain.connect(outBus);

        metalRatios.forEach((f) => {
          const osc = ctx.createOscillator();
          osc.type = 'square';
          osc.frequency.setValueAtTime(f * 4, now);
          osc.connect(metalHp);
          osc.start(now);
          osc.stop(now + 0.08);
        });

        const noise = ctx.createBufferSource();
        noise.buffer = this.getNoiseBuffer(ctx);
        const filter = ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(6800, now);
        const nGain = ctx.createGain();
        nGain.gain.setValueAtTime(0.28 * volScale, now);
        nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.095);
        noise.connect(filter);
        filter.connect(nGain);
        nGain.connect(outBus);
        noise.start(now);
        noise.stop(now + 0.1);
      } else if (col === 3 || col === 4) {
        // LANE 3 (←): 12" HIGH RACK TOM & LANE 4 (↓): 16" DEEP FLOOR TOM
        const isHighTom = col === 3;
        const outBus = ctx.createGain();
        outBus.gain.setValueAtTime(1.0, now);
        this.routeToMaster(ctx, outBus, col, 0.32);

        const tom = ctx.createOscillator();
        const tomGain = ctx.createGain();
        tom.type = 'sine';
        tom.frequency.setValueAtTime(isHighTom ? 235 : 148, now);
        tom.frequency.exponentialRampToValueAtTime(isHighTom ? 114 : 68, now + 0.25);
        tomGain.gain.setValueAtTime(0.48 * volScale, now);
        tomGain.gain.exponentialRampToValueAtTime(0.001, now + (isHighTom ? 0.32 : 0.38));
        tom.connect(tomGain);
        tomGain.connect(outBus);
        tom.start(now);
        tom.stop(now + 0.4);

        const overtone = ctx.createOscillator();
        const overGain = ctx.createGain();
        overtone.type = 'triangle';
        overtone.frequency.setValueAtTime(isHighTom ? 360 : 225, now);
        overtone.frequency.exponentialRampToValueAtTime(isHighTom ? 172 : 102, now + 0.12);
        overGain.gain.setValueAtTime(0.22 * volScale, now);
        overGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
        overtone.connect(overGain);
        overGain.connect(outBus);
        overtone.start(now);
        overtone.stop(now + 0.15);
      } else {
        // LANE 5 (→): 18" BRONZE CRASH CYMBAL
        const outBus = ctx.createGain();
        outBus.gain.setValueAtTime(1.0, now);
        this.routeToMaster(ctx, outBus, 5, 0.48);

        const crashFreqs = [312, 458, 588, 792, 1045, 1420];
        const shimmerBp = ctx.createBiquadFilter();
        shimmerBp.type = 'bandpass';
        shimmerBp.frequency.setValueAtTime(4200, now);
        shimmerBp.Q.setValueAtTime(0.65, now);
        const shimmerGain = ctx.createGain();
        shimmerGain.gain.setValueAtTime(0.14 * volScale, now);
        shimmerGain.gain.exponentialRampToValueAtTime(0.001, now + 0.75);
        shimmerBp.connect(shimmerGain);
        shimmerGain.connect(outBus);

        crashFreqs.forEach((f) => {
          const osc = ctx.createOscillator();
          osc.type = 'square';
          osc.frequency.setValueAtTime(f * 2.5, now);
          osc.connect(shimmerBp);
          osc.start(now);
          osc.stop(now + 0.78);
        });

        const noise = ctx.createBufferSource();
        noise.buffer = this.getNoiseBuffer(ctx);
        const filter = ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(3600, now);
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.32 * volScale, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.85);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(outBus);
        noise.start(now);
        noise.stop(now + 0.88);
      }
      return;
    }

    // =========================================================================
    // 2. LEAD ELECTRIC GUITAR (Physical Karplus-Strong Steel String + Humbucker
    //    + 12AX7 Tube Preamp + 4x12 Celestion Cabinet + Long 2.75s Sustain & Echo)
    // =========================================================================
    if (instrument === 'guitar') {
      // If the same string (col) is still ringing, smoothly damp the previous pluck on that string
      // over 45ms (authentic string re-pluck physics), while all other 5 strings keep ringing!
      const stringKey = `guitar_str_${col}`;
      const prevActive = this.activeStringGain.get(stringKey);
      if (prevActive && prevActive.stopTime > now) {
        try {
          prevActive.gain.gain.cancelScheduledValues(now);
          prevActive.gain.gain.setValueAtTime(Math.max(0.001, prevActive.gain.gain.value), now);
          prevActive.gain.gain.exponentialRampToValueAtTime(0.0008, now + 0.045);
        } catch {
          // Ignore if already stopped
        }
      }

      const ringDur = Math.max(1.85, Math.min(2.75, (sustainSec || 1.6) + 0.65));
      const guitarBuf = this.getPhysicalGuitarBuffer(ctx, col, this.tonePreset);

      const src = ctx.createBufferSource();
      src.buffer = guitarBuf;
      // Subtle organic pitch humanization per pick stroke (±2.5 cents) so repeated hits feel alive
      const humanDetuneCents = (Math.random() - 0.5) * 5.0;
      src.detune.setValueAtTime(humanDetuneCents, now);

      // Dynamic velocity cabinet brilliance filter
      const toneFilter = ctx.createBiquadFilter();
      toneFilter.type = 'peaking';
      toneFilter.frequency.setValueAtTime(col >= 3 ? 2150 : 1450, now);
      toneFilter.Q.setValueAtTime(1.15, now);
      toneFilter.gain.setValueAtTime(3.5 * volScale, now);

      const stringGain = ctx.createGain();
      const peakGain = (col >= 3 ? 0.92 : 0.86) * volScale;
      stringGain.gain.setValueAtTime(peakGain, now);
      // Long, resonant sustain plateau before smooth exponential decay
      stringGain.gain.linearRampToValueAtTime(peakGain * 0.72, now + ringDur * 0.45);
      stringGain.gain.exponentialRampToValueAtTime(0.001, now + ringDur);

      src.connect(toneFilter);
      toneFilter.connect(stringGain);

      // Route to Stereo Panner + Master Dry Bus + Concert Hall Reverb (0.42) + Stereo Tape Delay (0.38)
      this.routeToMaster(
        ctx,
        stringGain,
        col,
        col >= 3 ? 0.45 : 0.34,
        col >= 3 ? 0.42 : 0.24
      );

      src.start(now);
      src.stop(now + ringDur + 0.05);

      this.activeStringGain.set(stringKey, {
        gain: stringGain,
        stopTime: now + ringDur,
      });
      return;
    }

    // =========================================================================
    // 3. BASS GUITAR (Karplus-Strong Wound-Steel Bass String + Sub-Bass Sustain)
    // =========================================================================
    if (instrument === 'bass') {
      const stringKey = `bass_str_${col}`;
      const prevActive = this.activeStringGain.get(stringKey);
      if (prevActive && prevActive.stopTime > now) {
        try {
          prevActive.gain.gain.cancelScheduledValues(now);
          prevActive.gain.gain.setValueAtTime(Math.max(0.001, prevActive.gain.gain.value), now);
          prevActive.gain.gain.exponentialRampToValueAtTime(0.0008, now + 0.035);
        } catch {
          // Ignore
        }
      }

      const ringDur = Math.max(0.95, Math.min(1.55, (sustainSec || 0.85) + 0.3));
      const bassBuf = this.getPhysicalBassBuffer(ctx, col);
      const src = ctx.createBufferSource();
      src.buffer = bassBuf;

      const bassGain = ctx.createGain();
      bassGain.gain.setValueAtTime(0.92 * volScale, now);
      bassGain.gain.linearRampToValueAtTime(0.65 * volScale, now + ringDur * 0.4);
      bassGain.gain.exponentialRampToValueAtTime(0.001, now + ringDur);

      src.connect(bassGain);
      this.routeToMaster(ctx, bassGain, col, 0.16, 0.0);

      src.start(now);
      src.stop(now + ringDur + 0.04);

      this.activeStringGain.set(stringKey, {
        gain: bassGain,
        stopTime: now + ringDur,
      });
      return;
    }

    // =========================================================================
    // 4. BRASS TRUMPET (Lip-Reed Scoop + 3-Formant Brass Bell + Long Hall Swell)
    // =========================================================================
    if (instrument === 'trumpet') {
      const freq = trumpetFreqs[col];
      const dur = Math.max(0.75, Math.min(1.8, (sustainSec || 0.65) + 0.3));
      const outBus = ctx.createGain();
      this.routeToMaster(ctx, outBus, col, 0.44, 0.22);

      const bellFilter = ctx.createBiquadFilter();
      bellFilter.type = 'lowpass';
      bellFilter.frequency.setValueAtTime(680, now);
      bellFilter.frequency.linearRampToValueAtTime(3900, now + 0.048);
      bellFilter.frequency.linearRampToValueAtTime(2600, now + dur * 0.5);
      bellFilter.frequency.exponentialRampToValueAtTime(1400, now + dur);
      bellFilter.Q.setValueAtTime(2.0, now);

      const brassFormant = ctx.createBiquadFilter();
      brassFormant.type = 'peaking';
      brassFormant.frequency.setValueAtTime(1450, now);
      brassFormant.Q.setValueAtTime(1.4, now);
      brassFormant.gain.setValueAtTime(6.0, now);

      const hornGain = ctx.createGain();
      hornGain.gain.setValueAtTime(0.001, now);
      hornGain.gain.linearRampToValueAtTime(0.28 * volScale, now + 0.025);
      hornGain.gain.linearRampToValueAtTime(0.22 * volScale, now + dur * 0.55);
      hornGain.gain.exponentialRampToValueAtTime(0.001, now + dur);

      // Warm Brass Vibrato on Sustained Horn Notes
      const vib = ctx.createOscillator();
      const vibGain = ctx.createGain();
      vib.frequency.setValueAtTime(5.5, now);
      vibGain.gain.setValueAtTime(0.1, now);
      vibGain.gain.linearRampToValueAtTime(freq * 0.009, now + 0.22);
      vib.connect(vibGain);
      vib.start(now);
      vib.stop(now + dur + 0.02);

      bellFilter.connect(brassFormant);
      brassFormant.connect(hornGain);
      hornGain.connect(outBus);

      [1.0, 1.0035, 2.0].forEach((mult, idx) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = idx < 2 ? 'sawtooth' : 'triangle';
        osc.frequency.setValueAtTime(freq * mult * 0.968, now);
        osc.frequency.exponentialRampToValueAtTime(freq * mult, now + 0.032);
        vibGain.connect(osc.frequency);
        g.gain.setValueAtTime(idx < 2 ? 0.4 : 0.18, now);
        osc.connect(g);
        g.connect(bellFilter);
        osc.start(now);
        osc.stop(now + dur + 0.03);
      });

      const breath = ctx.createBufferSource();
      breath.buffer = this.getNoiseBuffer(ctx);
      const breathBp = ctx.createBiquadFilter();
      breathBp.type = 'bandpass';
      breathBp.frequency.setValueAtTime(2400, now);
      breathBp.Q.setValueAtTime(1.8, now);
      const breathGain = ctx.createGain();
      breathGain.gain.setValueAtTime(0.11 * volScale, now);
      breathGain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);
      breath.connect(breathBp);
      breathBp.connect(breathGain);
      breathGain.connect(outBus);
      breath.start(now);
      breath.stop(now + 0.05);
      return;
    }

    // =========================================================================
    // 5. ELECTRIC VIOLIN (Bowed Rosin Attack + Delayed Vibrato + 3 Body Formants)
    // =========================================================================
    if (instrument === 'violin') {
      const freq = violinFreqs[col];
      const dur = Math.max(0.95, Math.min(2.1, (sustainSec || 0.8) + 0.4));
      const outBus = ctx.createGain();
      this.routeToMaster(ctx, outBus, col, 0.5, 0.28);

      const bodyWarmth = ctx.createBiquadFilter();
      bodyWarmth.type = 'peaking';
      bodyWarmth.frequency.setValueAtTime(295, now);
      bodyWarmth.Q.setValueAtTime(1.5, now);
      bodyWarmth.gain.setValueAtTime(5.5, now);

      const bridgeSing = ctx.createBiquadFilter();
      bridgeSing.type = 'peaking';
      bridgeSing.frequency.setValueAtTime(2450, now);
      bridgeSing.Q.setValueAtTime(1.4, now);
      bridgeSing.gain.setValueAtTime(4.5, now);

      const bowLowpass = ctx.createBiquadFilter();
      bowLowpass.type = 'lowpass';
      bowLowpass.frequency.setValueAtTime(4600, now);

      const bowGain = ctx.createGain();
      bowGain.gain.setValueAtTime(0.001, now);
      bowGain.gain.linearRampToValueAtTime(0.26 * volScale, now + 0.055);
      bowGain.gain.linearRampToValueAtTime(0.22 * volScale, now + dur * 0.6);
      bowGain.gain.exponentialRampToValueAtTime(0.001, now + dur);

      bodyWarmth.connect(bridgeSing);
      bridgeSing.connect(bowLowpass);
      bowLowpass.connect(bowGain);
      bowGain.connect(outBus);

      const vibrato = ctx.createOscillator();
      const vibratoGain = ctx.createGain();
      vibrato.frequency.setValueAtTime(6.2, now);
      vibratoGain.gain.setValueAtTime(0.2, now);
      vibratoGain.gain.linearRampToValueAtTime(freq * 0.014, now + 0.16);
      vibrato.connect(vibratoGain);
      vibrato.start(now);
      vibrato.stop(now + dur + 0.03);

      [
        { mult: 1.0, detune: -5, amp: 0.42, type: 'sawtooth' as OscillatorType },
        { mult: 1.0, detune: 5, amp: 0.42, type: 'sawtooth' as OscillatorType },
        { mult: 2.0, detune: 0, amp: 0.2, type: 'triangle' as OscillatorType },
      ].forEach((layer) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = layer.type;
        osc.frequency.setValueAtTime(freq * layer.mult, now);
        osc.detune.setValueAtTime(layer.detune, now);
        vibratoGain.connect(osc.frequency);
        g.gain.setValueAtTime(layer.amp, now);
        osc.connect(g);
        g.connect(bodyWarmth);
        osc.start(now);
        osc.stop(now + dur + 0.03);
      });

      const rosin = ctx.createBufferSource();
      rosin.buffer = this.getNoiseBuffer(ctx);
      const rosinBp = ctx.createBiquadFilter();
      rosinBp.type = 'bandpass';
      rosinBp.frequency.setValueAtTime(3400, now);
      rosinBp.Q.setValueAtTime(2.5, now);
      const rosinGain = ctx.createGain();
      rosinGain.gain.setValueAtTime(0.06 * volScale, now);
      rosinGain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
      rosin.connect(rosinBp);
      rosinBp.connect(rosinGain);
      rosinGain.connect(outBus);
      rosin.start(now);
      rosin.stop(now + 0.075);
      return;
    }

    // =========================================================================
    // 6. SYNTH KEYBOARD (3x Detuned SuperSaw + Sub Sine + FM Crystal Bell + Delay)
    // =========================================================================
    const freq = synthFreqs[col];
    const dur = Math.max(0.85, Math.min(1.9, (sustainSec || 0.7) + 0.35));
    const outBus = ctx.createGain();
    this.routeToMaster(ctx, outBus, col, 0.42, 0.34);

    const synthFilter = ctx.createBiquadFilter();
    synthFilter.type = 'lowpass';
    synthFilter.frequency.setValueAtTime(5400, now);
    synthFilter.frequency.exponentialRampToValueAtTime(1400, now + dur);
    synthFilter.Q.setValueAtTime(2.2, now);

    const padGain = ctx.createGain();
    padGain.gain.setValueAtTime(0.001, now);
    padGain.gain.linearRampToValueAtTime(0.24 * volScale, now + 0.01);
    padGain.gain.linearRampToValueAtTime(0.18 * volScale, now + dur * 0.45);
    padGain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    synthFilter.connect(padGain);
    padGain.connect(outBus);

    [-12, 0, 12].forEach((det) => {
      const saw = ctx.createOscillator();
      const g = ctx.createGain();
      saw.type = 'sawtooth';
      saw.frequency.setValueAtTime(freq, now);
      saw.detune.setValueAtTime(det, now);
      g.gain.setValueAtTime(0.32, now);
      saw.connect(g);
      g.connect(synthFilter);
      saw.start(now);
      saw.stop(now + dur + 0.03);
    });

    const bell = ctx.createOscillator();
    const bellGain = ctx.createGain();
    bell.type = 'triangle';
    bell.frequency.setValueAtTime(freq * 2, now);
    bellGain.gain.setValueAtTime(0.18 * volScale, now);
    bellGain.gain.exponentialRampToValueAtTime(0.001, now + dur * 0.7);
    bell.connect(bellGain);
    bellGain.connect(outBus);
    bell.start(now);
    bell.stop(now + dur);
  }

  /**
   * Plays a signature showcase riff for the selected instrument
   * and triggers visual lane callbacks so the 6 round keys light up in sync!
   */
  public playInstrumentShowcaseRiff(
    instrument: InstrumentType,
    onStepLane?: (col: number | null) => void
  ) {
    this.stopShowcaseRiff();

    const patterns: Record<
      InstrumentType,
      { col: number; delayMs: number; dur?: number }[]
    > = {
      drums: [
        { col: 0, delayMs: 0 },
        { col: 2, delayMs: 140 },
        { col: 1, delayMs: 280 },
        { col: 2, delayMs: 420 },
        { col: 0, delayMs: 560 },
        { col: 3, delayMs: 700 },
        { col: 4, delayMs: 820 },
        { col: 5, delayMs: 960 },
        { col: 0, delayMs: 960 },
      ],
      guitar: [
        // Authentic Electric Guitar Showcase: E5 Power Chord -> A5 Power Chord -> D5 Power Chord -> Singing Solo Run & Sustained Vibrato!
        { col: 0, delayMs: 0, dur: 1.8 },
        { col: 1, delayMs: 280, dur: 1.8 },
        { col: 2, delayMs: 560, dur: 1.8 },
        { col: 3, delayMs: 840, dur: 1.9 },
        { col: 4, delayMs: 1040, dur: 2.0 },
        { col: 5, delayMs: 1240, dur: 2.6 },
        { col: 3, delayMs: 1255, dur: 2.6 },
      ],
      bass: [
        { col: 0, delayMs: 0, dur: 1.1 },
        { col: 3, delayMs: 180, dur: 1.1 },
        { col: 1, delayMs: 360, dur: 1.1 },
        { col: 4, delayMs: 540, dur: 1.1 },
        { col: 2, delayMs: 720, dur: 1.1 },
        { col: 5, delayMs: 900, dur: 1.2 },
        { col: 0, delayMs: 1100, dur: 1.4 },
      ],
      synth: [
        { col: 0, delayMs: 0, dur: 1.2 },
        { col: 2, delayMs: 150, dur: 1.2 },
        { col: 4, delayMs: 300, dur: 1.2 },
        { col: 5, delayMs: 450, dur: 1.4 },
        { col: 3, delayMs: 600, dur: 1.2 },
        { col: 1, delayMs: 750, dur: 1.2 },
        { col: 0, delayMs: 920, dur: 1.6 },
        { col: 5, delayMs: 920, dur: 1.6 },
      ],
      trumpet: [
        { col: 1, delayMs: 0, dur: 0.9 },
        { col: 2, delayMs: 180, dur: 0.9 },
        { col: 3, delayMs: 360, dur: 0.9 },
        { col: 5, delayMs: 540, dur: 1.3 },
        { col: 3, delayMs: 540, dur: 1.3 },
        { col: 4, delayMs: 860, dur: 0.9 },
        { col: 5, delayMs: 1040, dur: 1.6 },
      ],
      violin: [
        { col: 0, delayMs: 0, dur: 1.2 },
        { col: 1, delayMs: 260, dur: 1.2 },
        { col: 2, delayMs: 520, dur: 1.2 },
        { col: 4, delayMs: 780, dur: 1.4 },
        { col: 5, delayMs: 1060, dur: 1.9 },
        { col: 3, delayMs: 1060, dur: 1.9 },
      ],
    };

    const seq = patterns[instrument] || patterns.guitar;
    seq.forEach((step) => {
      const tId = window.setTimeout(() => {
        this.playWarmupNote(step.col, instrument, step.dur);
        onStepLane?.(step.col);
      }, step.delayMs);
      this.demoTimers.push(tId);
    });

    const clearId = window.setTimeout(() => {
      onStepLane?.(null);
    }, 1550);
    this.demoTimers.push(clearId);
  }

  public stopShowcaseRiff() {
    this.demoTimers.forEach((id) => clearTimeout(id));
    this.demoTimers = [];
  }

  public playFeverActivate() {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const chord = [261.63, 329.63, 392.0, 523.25, 659.25, 783.99];
    chord.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.028);
      gain.gain.setValueAtTime(0.11, now + idx * 0.028);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.028 + 0.42);
      osc.connect(gain);
      this.routeToMaster(ctx, gain, idx % 6, 0.4);
      osc.start(now + idx * 0.028);
      osc.stop(now + idx * 0.028 + 0.44);
    });
  }

  public playUiClick(pitch: number = 880) {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(pitch, now);
    osc.frequency.exponentialRampToValueAtTime(pitch * 0.62, now + 0.035);

    gain.gain.setValueAtTime(0.055, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    if (this.dryBus) {
      gain.connect(this.dryBus);
    } else {
      gain.connect(ctx.destination);
    }
    osc.start(now);
    osc.stop(now + 0.045);
  }

  public playWarmupNote(
    column: number,
    instrument: InstrumentType = 'drums',
    sustainSec?: number
  ) {
    const ctx = this.getContext();
    if (!ctx) return;
    this.triggerInstrumentVoice(
      ctx,
      ctx.currentTime,
      Math.abs(column) % 6,
      instrument,
      1.0,
      sustainSec
    );
  }
}

export const soundFX = new SoundEffectsEngine();

