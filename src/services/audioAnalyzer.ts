/**
 * Studio Universal DSP Audio, Video, MIDI & Chart Analyzer
 *
 * Uses Web Audio API + Universal Format Decoders to analyze:
 * - Lossless Audio: .wav, .flac, .aiff, .aif, .alac, .caf
 * - Compressed Audio: .mp3, .m4a, .aac, .ogg, .oga, .opus, .wma, .amr, .webm
 * - Music Video Containers: .mp4, .mov, .mkv, .webm, .avi, .m4v
 * - Digital Scores & Charts: .mid, .midi, .sm, .ssc, .osu, .json
 */

import { Note, SongSection, Difficulty, InstrumentType, SmartGenreId } from '../types';
import {
  identifyFileFormat,
  audioBufferToWavBlob,
  decodeMidiFileToAudioAndNotes,
  decodeChartFileToAudioAndNotes,
} from './formatDecoders';
import { classifySmartGenre } from '../game/songs';

export interface OnsetEvent {
  time: number;
  strength: number; // normalized 0..1
  band: 'low' | 'mid' | 'high';
  sustainDuration?: number;
}

export interface AnalyzedTrackData {
  fileName: string;
  formatLabel: string;
  fileSizeMb: string;
  channels: number;
  title: string;
  duration: number;
  sampleRate: number;
  estimatedBpm: number;
  peakDb: number;
  dynamicRangeDb: number;
  waveformPeaks: number[]; // 160 normalized bars (0..1)
  bandProfile: {
    lowEnergyPct: number;
    midEnergyPct: number;
    highEnergyPct: number;
  };
  sections: SongSection[];
  onsets: OnsetEvent[];
  precomputedNotes?: Note[];
  audioUrl: string;
  audioBlob: Blob;
  genreId: SmartGenreId;
  genreName: string;
  vietnameseGenreName: string;
  allowedInstruments: InstrumentType[];
  autoClassifyReason: string;
  confidencePct: number;
}


/**
 * Decodes and analyzes any uploaded music, video-audio, MIDI, or chart File.
 */
export async function analyzeUploadedAudio(
  file: File,
  onProgress?: (stage: string, pct: number) => void
): Promise<AnalyzedTrackData> {
  const formatInfo = identifyFileFormat(file);
  const fileSizeMb = (file.size / (1024 * 1024)).toFixed(2);

  onProgress?.(`Reading ${formatInfo.formatLabel} stream (${fileSizeMb} MB)...`, 15);

  let audioBuffer: AudioBuffer;
  let precomputedNotes: Note[] | undefined;
  let overrideBpm: number | undefined;

  if (formatInfo.kind === 'midi') {
    onProgress?.('Parsing MIDI tracks & synthesizing polyphonic audio...', 40);
    const arrayBuffer = await file.arrayBuffer();
    const midiRes = await decodeMidiFileToAudioAndNotes(arrayBuffer);
    audioBuffer = midiRes.audioBuffer;
    overrideBpm = midiRes.bpm;
    precomputedNotes = midiRes.precomputedNotes;
  } else if (formatInfo.kind === 'chart') {
    onProgress?.(`Parsing ${formatInfo.formatLabel} & synthesizing studio backing...`, 40);
    const text = await file.text();
    const chartRes = await decodeChartFileToAudioAndNotes(text, formatInfo.ext);
    audioBuffer = chartRes.audioBuffer;
    overrideBpm = chartRes.bpm;
    precomputedNotes = chartRes.precomputedNotes;
  } else {
    onProgress?.(
      formatInfo.kind === 'video'
        ? `Extracting stereo audio track from ${formatInfo.formatLabel}...`
        : `Decoding ${formatInfo.formatLabel} PCM waveform via Web Audio DSP...`,
      35
    );
    const arrayBuffer = await file.arrayBuffer();
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx();
    try {
      audioBuffer = await ctx.decodeAudioData(arrayBuffer.slice(0));
    } finally {
      ctx.close().catch(() => {});
    }
  }

  const sampleRate = audioBuffer.sampleRate;
  const duration = audioBuffer.duration;
  const numChannels = audioBuffer.numberOfChannels;
  const length = audioBuffer.length;

  onProgress?.('Computing RMS loudness envelope & 3-band spectral split...', 60);
  const mono = new Float32Array(length);
  if (numChannels === 1) {
    mono.set(audioBuffer.getChannelData(0));
  } else {
    const ch0 = audioBuffer.getChannelData(0);
    const ch1 = audioBuffer.getChannelData(1);
    for (let i = 0; i < length; i++) {
      mono[i] = (ch0[i] + ch1[i]) * 0.5;
    }
  }

  // 1. Compute 160 Waveform Peaks
  const numWaveformBars = 160;
  const samplesPerBar = Math.max(1, Math.floor(length / numWaveformBars));
  const waveformPeaks: number[] = [];
  let globalMaxSample = 0.0001;

  for (let b = 0; b < numWaveformBars; b++) {
    const start = b * samplesPerBar;
    const end = Math.min(length, start + samplesPerBar);
    let sumSq = 0;
    let peak = 0;
    const step = Math.max(1, Math.floor((end - start) / 256));
    let count = 0;
    for (let i = start; i < end; i += step) {
      const abs = Math.abs(mono[i]);
      if (abs > peak) peak = abs;
      sumSq += abs * abs;
      count++;
    }
    if (peak > globalMaxSample) globalMaxSample = peak;
    const rms = count > 0 ? Math.sqrt(sumSq / count) : 0;
    waveformPeaks.push(rms * 0.7 + peak * 0.3);
  }

  const maxBar = Math.max(0.0001, ...waveformPeaks);
  const normalizedPeaks = waveformPeaks.map((v) => Math.min(1, v / maxBar));

  // 2. Multi-band time-domain filter approximation (Low, Mid, High energy windows)
  onProgress?.('Detecting rhythmic transients, kicks & harmonic onsets...', 78);
  const hopDuration = 0.02; // 20ms hop (50 frames/sec)
  const hopSamples = Math.max(1, Math.floor(sampleRate * hopDuration));
  const numFrames = Math.floor(length / hopSamples);

  const lowEnv = new Float32Array(numFrames);
  const midEnv = new Float32Array(numFrames);
  const highEnv = new Float32Array(numFrames);
  const totalEnv = new Float32Array(numFrames);

  let totalLow = 0;
  let totalMid = 0;
  let totalHigh = 0;

  const lpCutoffLow = Math.exp((-2 * Math.PI * 220) / sampleRate);
  const lpCutoffMid = Math.exp((-2 * Math.PI * 2400) / sampleRate);

  for (let f = 0; f < numFrames; f++) {
    const start = f * hopSamples;
    const end = Math.min(length, start + hopSamples);
    let lpLow = 0;
    let lpMid = 0;
    let sumLow = 0;
    let sumMid = 0;
    let sumHigh = 0;

    const stride = sampleRate > 32000 ? 2 : 1;
    let count = 0;
    for (let i = start; i < end; i += stride) {
      const s = mono[i];
      lpLow = (1 - lpCutoffLow) * s + lpCutoffLow * lpLow;
      lpMid = (1 - lpCutoffMid) * s + lpCutoffMid * lpMid;

      const lowComp = lpLow;
      const midComp = lpMid - lpLow;
      const highComp = s - lpMid;

      sumLow += lowComp * lowComp;
      sumMid += midComp * midComp;
      sumHigh += highComp * highComp;
      count++;
    }

    const rLow = count > 0 ? Math.sqrt(sumLow / count) : 0;
    const rMid = count > 0 ? Math.sqrt(sumMid / count) : 0;
    const rHigh = count > 0 ? Math.sqrt(sumHigh / count) : 0;

    lowEnv[f] = rLow;
    midEnv[f] = rMid;
    highEnv[f] = rHigh;
    totalEnv[f] = rLow + rMid + rHigh;

    totalLow += rLow;
    totalMid += rMid;
    totalHigh += rHigh;
  }

  const bandSum = Math.max(0.0001, totalLow + totalMid + totalHigh);
  const bandProfile = {
    lowEnergyPct: Math.round((totalLow / bandSum) * 100),
    midEnergyPct: Math.round((totalMid / bandSum) * 100),
    highEnergyPct: Math.max(
      1,
      100 - Math.round((totalLow / bandSum) * 100) - Math.round((totalMid / bandSum) * 100)
    ),
  };

  const flux = new Float32Array(numFrames);
  let maxFlux = 0.0001;
  for (let f = 1; f < numFrames; f++) {
    const dLow = Math.max(0, lowEnv[f] - lowEnv[f - 1]) * 1.4;
    const dMid = Math.max(0, midEnv[f] - midEnv[f - 1]) * 1.1;
    const dHigh = Math.max(0, highEnv[f] - highEnv[f - 1]) * 1.25;
    const val = dLow + dMid + dHigh;
    flux[f] = val;
    if (val > maxFlux) maxFlux = val;
  }

  const onsets: OnsetEvent[] = [];
  const windowFrames = 18;
  const minInterOnsetFrames = 4;
  let lastOnsetFrame = -minInterOnsetFrames;

  for (let f = 2; f < numFrames - 2; f++) {
    if (flux[f] <= flux[f - 1] || flux[f] < flux[f + 1]) continue;
    if (f - lastOnsetFrame < minInterOnsetFrames) continue;

    let localSum = 0;
    let count = 0;
    for (
      let w = Math.max(0, f - windowFrames);
      w <= Math.min(numFrames - 1, f + windowFrames);
      w++
    ) {
      localSum += flux[w];
      count++;
    }
    const localMean = localSum / Math.max(1, count);
    const threshold = localMean * 1.35 + maxFlux * 0.04;

    if (flux[f] > threshold) {
      lastOnsetFrame = f;
      const time = f * hopDuration;
      const strength = Math.min(1, flux[f] / (maxFlux * 0.75));

      const l = lowEnv[f] * 1.2;
      const m = midEnv[f];
      const h = highEnv[f] * 1.3;
      const band: 'low' | 'mid' | 'high' =
        l >= m && l >= h ? 'low' : h >= m && h >= l ? 'high' : 'mid';

      let holdFrames = 0;
      const baseEnergy = totalEnv[f];
      for (let k = f + 1; k < Math.min(numFrames, f + 45); k++) {
        if (totalEnv[k] > baseEnergy * 0.55) {
          holdFrames++;
        } else {
          break;
        }
      }
      const sustainDuration =
        holdFrames * hopDuration >= 0.45
          ? Math.min(1.4, holdFrames * hopDuration)
          : undefined;

      onsets.push({
        time,
        strength,
        band,
        sustainDuration,
      });
    }
  }

  // 3. Estimate BPM via Onset Autocorrelation
  onProgress?.('Estimating tempo (BPM) & structural sections...', 92);
  let estimatedBpm = overrideBpm || 128;
  if (!overrideBpm) {
    let bestLag = Math.round(60 / 128 / hopDuration);
    let bestScore = -1;
    const minLag = Math.round(60 / 172 / hopDuration);
    const maxLag = Math.round(60 / 84 / hopDuration);

    for (let lag = minLag; lag <= maxLag; lag++) {
      let corr = 0;
      for (let f = 0; f < numFrames - lag; f += 2) {
        corr += flux[f] * flux[f + lag];
      }
      const bpmCandidate = 60 / (lag * hopDuration);
      const prior = 1 - Math.abs(bpmCandidate - 126) * 0.0025;
      const weighted = corr * prior;
      if (weighted > bestScore) {
        bestScore = weighted;
        bestLag = lag;
      }
    }
    estimatedBpm = Math.round(60 / (bestLag * hopDuration));
  }

  // 4. Segment Track into Dynamic SongSections
  const numSections = duration < 45 ? 3 : 6;
  const secDuration = duration / numSections;
  const rawSectionRms: number[] = [];

  for (let s = 0; s < numSections; s++) {
    const startFrame = Math.floor((s * secDuration) / hopDuration);
    const endFrame = Math.min(
      numFrames,
      Math.floor(((s + 1) * secDuration) / hopDuration)
    );
    let sum = 0;
    for (let f = startFrame; f < endFrame; f++) {
      sum += totalEnv[f];
    }
    rawSectionRms.push(sum / Math.max(1, endFrame - startFrame));
  }

  const maxSecRms = Math.max(0.0001, ...rawSectionRms);
  const sectionLabels6 = [
    'Intro',
    'Verse 1',
    'Chorus 1',
    'Bridge / Groove',
    'Climax / Solo',
    'Outro',
  ];
  const sectionLabels3 = ['Intro', 'Main Drop / Chorus', 'Outro'];

  const sections: SongSection[] = rawSectionRms.map((rms, idx) => {
    const norm = rms / maxSecRms;
    const energy = Math.max(2, Math.min(10, Math.round(norm * 10)));
    const name =
      numSections === 3 ? sectionLabels3[idx] : sectionLabels6[idx] || `Section ${idx + 1}`;
    const desc =
      energy >= 8
        ? 'High-intensity peak transients'
        : energy >= 5
        ? 'Steady rhythmic groove'
        : 'Atmospheric dynamic space';

    return {
      name,
      startTime: Math.round(idx * secDuration),
      endTime: Math.round((idx + 1) * secDuration),
      energy,
      description: desc,
    };
  });

  const peakDb = Math.max(-36, Math.round(20 * Math.log10(globalMaxSample) * 10) / 10);
  const sortedEnv = Array.from(totalEnv).filter((v) => v > 0.0001).sort((a, b) => a - b);
  const p95 = sortedEnv[Math.floor(sortedEnv.length * 0.95)] || 0.1;
  const p15 = sortedEnv[Math.floor(sortedEnv.length * 0.15)] || 0.01;
  const dynamicRangeDb = Math.max(
    3,
    Math.min(28, Math.round(20 * Math.log10(p95 / Math.max(0.0001, p15)) * 10) / 10)
  );

  const cleanTitle = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' ');

  const sustainCount = onsets.filter((o) => o.sustainDuration && o.sustainDuration >= 0.48).length;
  const sustainRatio = onsets.length > 0 ? sustainCount / onsets.length : 0.2;

  const smartClass = classifySmartGenre({
    title: cleanTitle,
    fileName: file.name,
    bpm: estimatedBpm,
    lowEnergyPct: bandProfile.lowEnergyPct,
    midEnergyPct: bandProfile.midEnergyPct,
    highEnergyPct: bandProfile.highEnergyPct,
    dynamicRangeDb,
    sustainRatio,
  });

  // Normalize MIDI, Chart, Video, or exotic codecs into a standard playable WAV Blob
  const needsWavNormalization =
    formatInfo.kind !== 'audio' ||
    ['aiff', 'aif', 'alac', 'caf', 'wma', 'amr'].includes(formatInfo.ext);
  const playableBlob = needsWavNormalization ? audioBufferToWavBlob(audioBuffer) : file;
  const audioUrl = URL.createObjectURL(playableBlob);

  onProgress?.('Analysis complete!', 100);

  return {
    fileName: file.name,
    formatLabel: formatInfo.formatLabel,
    fileSizeMb,
    channels: numChannels,
    title: cleanTitle || 'Uploaded Studio Track',
    duration,
    sampleRate,
    estimatedBpm,
    peakDb,
    dynamicRangeDb,
    waveformPeaks: normalizedPeaks,
    bandProfile,
    sections,
    onsets,
    precomputedNotes,
    audioUrl,
    audioBlob: playableBlob,
    genreId: smartClass.genreId,
    genreName: smartClass.genreName,
    vietnameseGenreName: smartClass.vietnameseGenreName,
    allowedInstruments: smartClass.allowedInstruments,
    autoClassifyReason: smartClass.autoClassifyReason,
    confidencePct: smartClass.confidencePct,
  };
}


/**
 * Generates an instrument-tailored beatmap from the analyzed audio onsets, MIDI events, or Chart notes.
 */
export function buildBeatmapFromAnalysis(
  analysis: AnalyzedTrackData,
  instrument: InstrumentType,
  difficulty: Difficulty,
  densityMultiplier: number = 1.0
): Note[] {
  const clampedDensity = Math.max(0.5, Math.min(2.0, densityMultiplier));
  const synthWave = [0, 2, 4, 5, 3, 1];

  // Instrument-specific density & gap modifiers so every instrument has its own distinct sheet feel
  const instDensityFactor =
    instrument === 'drums'
      ? 1.15 // Drums have active hi-hat/tom rhythmic subdivisions
      : instrument === 'synth'
      ? 1.12 // Synth has flowing arpeggio notes
      : instrument === 'guitar'
      ? 1.05
      : instrument === 'bass'
      ? 0.92 // Bass locks into the tight low-end pocket
      : instrument === 'trumpet'
      ? 0.88 // Brass focuses on punchy horn stabs & swells
      : 0.85; // Violin focuses on expressive long bowed legato notes

  const effectiveDensity = clampedDensity * instDensityFactor;

  if (analysis.precomputedNotes && analysis.precomputedNotes.length > 0) {
    const stride =
      effectiveDensity < 0.85 ? 2 : difficulty === 'easy' && effectiveDensity <= 1.0 ? 2 : 1;
    const adapted: Note[] = [];
    for (let i = 0; i < analysis.precomputedNotes.length; i += stride) {
      const base = analysis.precomputedNotes[i];
      const next = i + stride < analysis.precomputedNotes.length ? analysis.precomputedNotes[i + stride] : null;
      const gap = next ? next.time - base.time : 0.8;

      let col6 = base.column % 6;
      if (instrument === 'synth') col6 = synthWave[i % synthWave.length];
      else if (instrument === 'bass') col6 = i % 2 === 0 ? base.column % 3 : (base.column % 3) + 3;
      else if (instrument === 'violin') col6 = (base.column + i) % 6;

      const dur =
        instrument === 'drums' || instrument === 'bass'
          ? undefined
          : instrument === 'violin' && gap >= 0.45
          ? Number(Math.min(gap * 0.82, 1.5).toFixed(2))
          : base.duration;

      adapted.push({ ...base, column: col6, duration: dur, hit: false, missed: false });

      if (difficulty !== 'easy') {
        if (instrument === 'drums' && i % 8 === 0) {
          adapted.push({
            time: base.time,
            column: col6 === 0 ? 5 : 0,
            hit: false,
            missed: false,
          });
        } else if (
          (instrument === 'guitar' || instrument === 'synth' || instrument === 'trumpet') &&
          i % 6 === 0
        ) {
          adapted.push({
            time: base.time,
            column: (col6 + (instrument === 'synth' ? 3 : 2)) % 6,
            duration: dur,
            hit: false,
            missed: false,
          });
        }
      }
    }
    return adapted;
  }

  const notes: Note[] = [];
  const minStartTime = Math.min(2.2, analysis.duration * 0.06);

  const beatSec = 60 / Math.max(75, analysis.estimatedBpm);
  const baseGap =
    difficulty === 'easy'
      ? beatSec * 0.85
      : difficulty === 'normal'
      ? beatSec * 0.42
      : beatSec * 0.22;
  const minNoteGap = Math.max(0.08, baseGap / effectiveDensity);

  const baseThreshold =
    difficulty === 'easy' ? 0.36 : difficulty === 'normal' ? 0.2 : 0.1;
  const strengthThreshold = Math.max(0.04, baseThreshold / effectiveDensity);

  let lastNoteTime = -10;
  let lastCol = 0;
  let stepCounter = 0;

  for (let i = 0; i < analysis.onsets.length; i++) {
    const onset = analysis.onsets[i];
    if (onset.time < minStartTime || onset.time > analysis.duration - 0.8) continue;
    if (onset.strength < strengthThreshold) continue;
    if (onset.time - lastNoteTime < minNoteGap) continue;

    stepCounter++;
    const nextOnset = i + 1 < analysis.onsets.length ? analysis.onsets[i + 1] : null;
    const gapToNext = nextOnset ? nextOnset.time - onset.time : 1.0;

    let col = 0;
    let sustainDuration: number | undefined = undefined;

    if (instrument === 'drums') {
      // 1. STUDIO DRUMS SHEET: Kick(0), Snare(1), Hi-Hat(2), High Tom(3), Floor Tom(4), Crash(5)
      if (onset.band === 'low') {
        col = stepCounter % 6 === 5 ? 4 : 0; // Kick Pedal or Floor Tom turnaround
      } else if (onset.band === 'high') {
        col = onset.strength > 0.7 ? 5 : 2; // Crash Cymbal or Hi-Hat
      } else {
        col = stepCounter % 4 === 3 ? 3 : 1; // High Tom fill or Snare
      }
      sustainDuration = undefined; // Pure percussive strikes
    } else if (instrument === 'guitar') {
      // 2. LEAD GUITAR SHEET: 6-String Sweep & Fretboard Lead + Vibrato Sustains
      if (onset.band === 'low') col = onset.strength > 0.62 ? 1 : 0;
      else if (onset.band === 'mid') col = onset.strength > 0.6 ? 3 : 2;
      else col = onset.strength > 0.68 ? 5 : 4;

      if (col === lastCol && onset.time - lastNoteTime < beatSec * 0.7) {
        col = (col + 1) % 6;
      }
      if (onset.sustainDuration && gapToNext > 0.5) {
        sustainDuration = Math.min(onset.sustainDuration, gapToNext * 0.78);
      }
    } else if (instrument === 'bass') {
      // 3. BASS GUITAR SHEET: Slap & Pop Octave Jumps (Low 0..2 <-> High 3..5)
      const rootLane = onset.band === 'low' ? 0 : onset.band === 'mid' ? 1 : 2;
      col = stepCounter % 2 === 0 ? rootLane : rootLane + 3;
      sustainDuration = undefined; // Tight staccato slap & pop
    } else if (instrument === 'synth') {
      // 4. SYNTH KEYBOARD SHEET: Cascading Zig-Zag Arpeggios & Long Polyphonic Pads
      col = synthWave[stepCounter % synthWave.length];
      if (gapToNext > 0.52 && stepCounter % 3 === 0) {
        sustainDuration = Math.min(onset.sustainDuration || gapToNext * 0.75, gapToNext * 0.82);
      }
    } else if (instrument === 'trumpet') {
      // 5. BRASS TRUMPET SHEET: Syncopated Brass Valves (1..5) & Horn Swells
      col =
        onset.band === 'low'
          ? 0
          : onset.band === 'mid'
          ? 1 + (stepCounter % 2)
          : 3 + (stepCounter % 3);
      if (gapToNext > 0.55 && onset.strength >= 0.55) {
        sustainDuration = Math.min(onset.sustainDuration || gapToNext * 0.7, gapToNext * 0.76);
      }
    } else {
      // 6. ELECTRIC VIOLIN SHEET: Smooth Stepwise String Crossings & Long Bowed Legato
      col = (lastCol + (onset.band === 'high' ? 1 : onset.band === 'low' ? 5 : 1)) % 6;
      if (gapToNext > 0.4) {
        sustainDuration = Math.min(1.5, gapToNext * 0.84);
      }
    }

    notes.push({
      time: Number(onset.time.toFixed(3)),
      column: col,
      duration: sustainDuration ? Number(sustainDuration.toFixed(2)) : undefined,
      hit: false,
      missed: false,
    });

    // Instrument-Specific Chords & Simultaneous Accents
    if (difficulty !== 'easy' && onset.time - lastNoteTime >= beatSec * 0.65) {
      if (instrument === 'drums' && onset.strength >= 0.76 && (col === 5 || col === 0)) {
        // Simultaneous Kick + Crash Cymbal
        notes.push({
          time: Number(onset.time.toFixed(3)),
          column: col === 0 ? 5 : 0,
          hit: false,
          missed: false,
        });
      } else if (instrument === 'guitar' && onset.strength >= 0.7) {
        // Guitar Power Chord (Root + Fifth)
        notes.push({
          time: Number(onset.time.toFixed(3)),
          column: (col + 2) % 6,
          duration: sustainDuration ? Number(sustainDuration.toFixed(2)) : undefined,
          hit: false,
          missed: false,
        });
      } else if (instrument === 'synth' && onset.strength >= 0.72) {
        // Wide Polyphonic Synth Pad Chord
        notes.push({
          time: Number(onset.time.toFixed(3)),
          column: (col + 3) % 6,
          duration: sustainDuration ? Number(sustainDuration.toFixed(2)) : undefined,
          hit: false,
          missed: false,
        });
      } else if (instrument === 'trumpet' && onset.strength >= 0.68) {
        // Big-Band Double Brass Horn Stab
        notes.push({
          time: Number(onset.time.toFixed(3)),
          column: (col + 2) % 6,
          duration: sustainDuration ? Number(sustainDuration.toFixed(2)) : undefined,
          hit: false,
          missed: false,
        });
      } else if (instrument === 'violin' && onset.strength >= 0.75 && stepCounter % 4 === 0) {
        // Classical Violin 5th Double-Stop
        notes.push({
          time: Number(onset.time.toFixed(3)),
          column: (col + 2) % 6,
          duration: sustainDuration ? Number(sustainDuration.toFixed(2)) : undefined,
          hit: false,
          missed: false,
        });
      }
    }

    lastNoteTime = onset.time;
    lastCol = col;
  }

  if (notes.length < 15) {
    for (let t = minStartTime; t < analysis.duration - 1; t += beatSec) {
      notes.push({
        time: Number(t.toFixed(3)),
        column: Math.floor(t / beatSec) % 6,
        hit: false,
        missed: false,
      });
    }
  }

  notes.sort((a, b) => a.time - b.time);
  return notes;
}
