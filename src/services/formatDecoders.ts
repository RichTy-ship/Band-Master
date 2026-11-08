/**
 * Universal Music Format Decoders, MIDI Synthesizer & Chart Parsers
 *
 * Extends the Studio Analyzer to support all popular music, video-audio,
 * MIDI score, and rhythm chart formats:
 * - Lossless Audio: WAV, FLAC, AIFF, AIF, ALAC, CAF
 * - Compressed Audio: MP3, M4A, AAC, OGG, OGA, OPUS, WMA, WEBM, AMR
 * - Music Video Containers (Audio Extraction): MP4, MOV, MKV, WEBM, AVI
 * - Digital Musical Scores: Standard MIDI (.mid, .midi) with OfflineAudioContext synthesis
 * - Rhythm Game Charts: StepMania (.sm, .ssc), osu! (.osu), Beatmap (.json)
 */

import { Note } from '../types';

export interface FormatCategory {
  category: string;
  formats: string[];
  extensions: string[];
  description: string;
}

export const SUPPORTED_FORMAT_CATEGORIES: FormatCategory[] = [
  {
    category: 'Lossless Studio Audio',
    formats: ['WAV', 'FLAC', 'AIFF', 'ALAC', 'CAF'],
    extensions: ['.wav', '.flac', '.aiff', '.aif', '.alac', '.caf'],
    description: 'Uncompressed PCM & lossless studio masters (up to 192kHz / 32-bit float)',
  },
  {
    category: 'Compressed & Streaming Audio',
    formats: ['MP3', 'M4A', 'AAC', 'OGG', 'OPUS', 'WMA'],
    extensions: ['.mp3', '.m4a', '.aac', '.ogg', '.oga', '.opus', '.wma', '.amr', '.webm'],
    description: 'All everyday music library and streaming audio codecs',
  },
  {
    category: 'Music Video Containers',
    formats: ['MP4', 'MOV', 'MKV', 'WEBM', 'AVI'],
    extensions: ['.mp4', '.mov', '.mkv', '.webm', '.avi', '.m4v'],
    description: 'Automatic stereo audio stream extraction from music video files',
  },
  {
    category: 'MIDI & Rhythm Charts',
    formats: ['MIDI', 'StepMania', 'osu!', 'JSON'],
    extensions: ['.mid', '.midi', '.sm', '.ssc', '.osu', '.json'],
    description: 'Direct note extraction & real-time polyphonic WAV backing synthesis',
  },
];

export const ALL_ACCEPT_ATTRIBUTE =
  'audio/*,video/mp4,video/webm,video/quicktime,video/x-matroska,.mp3,.wav,.flac,.ogg,.oga,.opus,.m4a,.aac,.alac,.aiff,.aif,.wma,.amr,.webm,.caf,.mp4,.mov,.mkv,.avi,.m4v,.mid,.midi,.sm,.ssc,.osu,.json';

/**
 * Detects the human-readable format badge and category for a given File.
 */
export function identifyFileFormat(file: File): {
  ext: string;
  formatLabel: string;
  kind: 'audio' | 'video' | 'midi' | 'chart';
} {
  const name = file.name.toLowerCase();
  const match = name.match(/\.([a-z0-9]+)$/i);
  const ext = match ? match[1].toLowerCase() : '';

  if (ext === 'mid' || ext === 'midi' || file.type.includes('midi')) {
    return { ext: ext || 'mid', formatLabel: 'MIDI Sequence', kind: 'midi' };
  }
  if (ext === 'sm' || ext === 'ssc') {
    return { ext, formatLabel: 'StepMania Chart', kind: 'chart' };
  }
  if (ext === 'osu') {
    return { ext, formatLabel: 'osu!Mania Chart', kind: 'chart' };
  }
  if (ext === 'json') {
    return { ext, formatLabel: 'JSON Beatmap', kind: 'chart' };
  }
  if (
    ['mp4', 'mov', 'mkv', 'avi', 'm4v'].includes(ext) ||
    file.type.startsWith('video/')
  ) {
    return {
      ext: ext || 'mp4',
      formatLabel: `${(ext || 'VIDEO').toUpperCase()} Video Audio`,
      kind: 'video',
    };
  }

  const labelMap: Record<string, string> = {
    mp3: 'MP3 Audio',
    wav: 'WAV Lossless PCM',
    flac: 'FLAC Lossless',
    ogg: 'OGG Vorbis',
    oga: 'OGG Audio',
    opus: 'OPUS Audio',
    m4a: 'Apple M4A / AAC',
    aac: 'AAC Audio',
    alac: 'Apple Lossless',
    aiff: 'AIFF Studio PCM',
    aif: 'AIFF Studio PCM',
    wma: 'Windows Media Audio',
    webm: 'WebM Audio',
    caf: 'Core Audio CAF',
  };

  return {
    ext: ext || 'audio',
    formatLabel: labelMap[ext] || `${(ext || 'AUDIO').toUpperCase()} Stream`,
    kind: 'audio',
  };
}

/**
 * Encodes any Web Audio API AudioBuffer into a universal 16-bit PCM WAV Blob.
 * Ensures 100% browser playback and export compatibility regardless of input codec.
 */
export function audioBufferToWavBlob(buffer: AudioBuffer): Blob {
  const numChannels = Math.min(2, buffer.numberOfChannels);
  const sampleRate = buffer.sampleRate;
  const numSamples = buffer.length;
  const bytesPerSample = 2;
  const blockAlign = numChannels * bytesPerSample;
  const dataSize = numSamples * blockAlign;
  const arrayBuffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(arrayBuffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // PCM chunk size
  view.setUint16(20, 1, true); // PCM format = 1
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true); // 16-bit
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);

  const channels: Float32Array[] = [];
  for (let c = 0; c < numChannels; c++) {
    channels.push(buffer.getChannelData(c));
  }

  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    for (let c = 0; c < numChannels; c++) {
      const sample = Math.max(-1, Math.min(1, channels[c][i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      offset += 2;
    }
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' });
}

interface ParsedMidiNote {
  time: number;
  duration: number;
  midiNote: number;
  velocity: number;
}

/**
 * Parses a Standard MIDI File (.mid / .midi) binary buffer and synthesizes
 * both a playable polyphonic AudioBuffer and exact rhythm game Note events.
 */
export async function decodeMidiFileToAudioAndNotes(
  arrayBuffer: ArrayBuffer
): Promise<{
  audioBuffer: AudioBuffer;
  bpm: number;
  precomputedNotes: Note[];
}> {
  const bytes = new Uint8Array(arrayBuffer);
  const view = new DataView(arrayBuffer);

  // Check MThd header
  const headerMagic = String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]);
  if (headerMagic !== 'MThd') {
    throw new Error('Invalid MIDI file header');
  }

  const numTracks = view.getUint16(10, false);
  const division = view.getUint16(12, false);
  const ticksPerBeat = (division & 0x8000) === 0 ? division : 480;

  let pos = 8 + view.getUint32(4, false);
  let microsecondsPerBeat = 500000; // Default 120 BPM
  const rawNotes: { tick: number; endTick: number; pitch: number; velocity: number }[] = [];

  for (let t = 0; t < numTracks && pos < bytes.length - 8; t++) {
    const trkMagic = String.fromCharCode(
      bytes[pos],
      bytes[pos + 1],
      bytes[pos + 2],
      bytes[pos + 3]
    );
    const trkLen = view.getUint32(pos + 4, false);
    pos += 8;
    const trkEnd = Math.min(bytes.length, pos + trkLen);

    if (trkMagic !== 'MTrk') {
      pos = trkEnd;
      continue;
    }

    let currentTick = 0;
    let runningStatus = 0;
    const activeNoteStarts = new Map<number, { tick: number; velocity: number }>();

    const readVarLen = (): number => {
      let val = 0;
      while (pos < trkEnd) {
        const b = bytes[pos++];
        val = (val << 7) | (b & 0x7f);
        if ((b & 0x80) === 0) break;
      }
      return val;
    };

    while (pos < trkEnd) {
      const delta = readVarLen();
      currentTick += delta;
      if (pos >= trkEnd) break;

      let status = bytes[pos];
      if (status < 0x80) {
        status = runningStatus;
      } else {
        pos++;
        if (status < 0xf0) runningStatus = status;
      }

      const cmd = status & 0xf0;
      if (cmd === 0x90) {
        const pitch = bytes[pos++];
        const vel = bytes[pos++];
        if (vel > 0) {
          activeNoteStarts.set(pitch, { tick: currentTick, velocity: vel });
        } else {
          const startObj = activeNoteStarts.get(pitch);
          if (startObj) {
            rawNotes.push({
              tick: startObj.tick,
              endTick: currentTick,
              pitch,
              velocity: startObj.velocity,
            });
            activeNoteStarts.delete(pitch);
          }
        }
      } else if (cmd === 0x80) {
        const pitch = bytes[pos++];
        pos++; // velocity
        const startObj = activeNoteStarts.get(pitch);
        if (startObj) {
          rawNotes.push({
            tick: startObj.tick,
            endTick: currentTick,
            pitch,
            velocity: startObj.velocity,
          });
          activeNoteStarts.delete(pitch);
        }
      } else if (cmd === 0xa0 || cmd === 0xb0 || cmd === 0xe0) {
        pos += 2;
      } else if (cmd === 0xc0 || cmd === 0xd0) {
        pos += 1;
      } else if (status === 0xff) {
        const metaType = bytes[pos++];
        const metaLen = readVarLen();
        if (metaType === 0x51 && metaLen === 3 && pos + 3 <= trkEnd) {
          microsecondsPerBeat =
            (bytes[pos] << 16) | (bytes[pos + 1] << 8) | bytes[pos + 2];
        }
        pos += metaLen;
      } else if (status === 0xf0 || status === 0xf7) {
        const sysLen = readVarLen();
        pos += sysLen;
      } else {
        pos++;
      }
    }
  }

  const bpm = Math.max(70, Math.min(200, Math.round(60000000 / microsecondsPerBeat)));
  const secPerTick = microsecondsPerBeat / 1000000 / Math.max(1, ticksPerBeat);

  rawNotes.sort((a, b) => a.tick - b.tick);
  const parsedMidiNotes: ParsedMidiNote[] = rawNotes.slice(0, 1800).map((n) => {
    const startSec = n.tick * secPerTick + 3.0; // 3s lead-in buffer
    const durSec = Math.max(0.08, Math.min(2.5, (n.endTick - n.tick) * secPerTick));
    return {
      time: startSec,
      duration: durSec,
      midiNote: n.pitch,
      velocity: n.velocity / 127,
    };
  });

  const totalDuration =
    parsedMidiNotes.length > 0
      ? Math.min(180, Math.max(15, parsedMidiNotes[parsedMidiNotes.length - 1].time + 3))
      : 30;

  // Render polyphonic audio buffer via OfflineAudioContext
  const sampleRate = 44100;
  const offlineCtx = new OfflineAudioContext(
    2,
    Math.ceil(totalDuration * sampleRate),
    sampleRate
  );

  for (const mn of parsedMidiNotes.slice(0, 900)) {
    if (mn.time >= totalDuration - 0.2) continue;
    const osc = offlineCtx.createOscillator();
    const gain = offlineCtx.createGain();
    const freq = 440 * Math.pow(2, (mn.midiNote - 69) / 12);

    osc.type = mn.midiNote < 52 ? 'sawtooth' : 'triangle';
    osc.frequency.setValueAtTime(freq, mn.time);

    const peakGain = Math.min(0.12, 0.03 + mn.velocity * 0.07);
    gain.gain.setValueAtTime(0.001, mn.time);
    gain.gain.linearRampToValueAtTime(peakGain, mn.time + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0008, mn.time + mn.duration);

    osc.connect(gain);
    gain.connect(offlineCtx.destination);
    osc.start(mn.time);
    osc.stop(mn.time + mn.duration + 0.02);
  }

  const audioBuffer = await offlineCtx.startRendering();

  const precomputedNotes: Note[] = [];
  let lastAddedTime = -1;
  for (const mn of parsedMidiNotes) {
    if (mn.time - lastAddedTime < 0.12) continue;
    lastAddedTime = mn.time;
    precomputedNotes.push({
      time: Number(mn.time.toFixed(3)),
      column: mn.midiNote % 6,
      duration: mn.duration >= 0.45 ? Number(mn.duration.toFixed(2)) : undefined,
      hit: false,
      missed: false,
    });
  }

  return { audioBuffer, bpm, precomputedNotes };
}

/**
 * Parses StepMania (.sm / .ssc), osu!Mania (.osu), or exported Beatmap (.json) chart files
 * and synthesizes an accompanying studio backing AudioBuffer so they can be played immediately.
 */
export async function decodeChartFileToAudioAndNotes(
  fileText: string,
  ext: string
): Promise<{
  audioBuffer: AudioBuffer;
  bpm: number;
  precomputedNotes: Note[];
}> {
  let bpm = 128;
  const notes: Note[] = [];

  if (ext === 'json') {
    const parsed = JSON.parse(fileText);
    if (Array.isArray(parsed)) {
      for (const item of parsed) {
        if (typeof item.time === 'number' && typeof item.column === 'number') {
          notes.push({
            time: Math.max(3, Number(item.time)),
            column: Math.abs(Math.round(item.column)) % 6,
            duration: item.duration ? Number(item.duration) : undefined,
            hit: false,
            missed: false,
          });
        }
      }
    }
  } else if (ext === 'osu') {
    const lines = fileText.split(/\r?\n/);
    let inHitObjects = false;
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed === '[HitObjects]') {
        inHitObjects = true;
        continue;
      }
      if (inHitObjects && trimmed.length > 0 && !trimmed.startsWith('//')) {
        const parts = trimmed.split(',');
        if (parts.length >= 3) {
          const x = parseInt(parts[0], 10) || 0;
          const timeMs = parseInt(parts[2], 10) || 0;
          const col = Math.min(5, Math.max(0, Math.floor((x / 512) * 6)));
          notes.push({
            time: Math.max(3, timeMs / 1000 + 3),
            column: col,
            hit: false,
            missed: false,
          });
        }
      }
    }
  } else {
    // StepMania .sm / .ssc parser (supports 4K or 6K rows and maps to 0..5)
    const bpmMatch = fileText.match(/#BPMS:[^=]+=([0-9.]+)/i);
    if (bpmMatch) {
      bpm = Math.max(70, Math.min(210, Math.round(parseFloat(bpmMatch[1]))));
    }
    const beatSec = 60 / bpm;
    const notesIdx = fileText.indexOf('#NOTES:');
    const body = notesIdx !== -1 ? fileText.slice(notesIdx) : fileText;
    const lines = body
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => /^[01234M]{4,8}$/.test(l));

    let curTime = 3.0;
    let rowIdx = 0;
    for (const row of lines) {
      rowIdx++;
      for (let c = 0; c < row.length; c++) {
        if (row[c] === '1' || row[c] === '2' || row[c] === '4') {
          const mappedCol = row.length >= 6 ? c % 6 : (c + (rowIdx % 3)) % 6;
          notes.push({
            time: Number(curTime.toFixed(3)),
            column: mappedCol,
            duration: row[c] === '2' ? Number((beatSec * 1.2).toFixed(2)) : undefined,
            hit: false,
            missed: false,
          });
        }
      }
      curTime += beatSec / 2;
    }
  }

  notes.sort((a, b) => a.time - b.time);
  const totalDuration =
    notes.length > 0
      ? Math.min(180, Math.max(20, notes[notes.length - 1].time + 3))
      : 30;

  const sampleRate = 44100;
  const offlineCtx = new OfflineAudioContext(
    2,
    Math.ceil(totalDuration * sampleRate),
    sampleRate
  );
  const laneFreqs = [220.0, 261.63, 329.63, 392.0, 440.0, 523.25];

  for (const n of notes.slice(0, 900)) {
    const osc = offlineCtx.createOscillator();
    const gain = offlineCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(laneFreqs[n.column % 6], n.time);

    const dur = n.duration || 0.16;
    gain.gain.setValueAtTime(0.08, n.time);
    gain.gain.exponentialRampToValueAtTime(0.0008, n.time + dur);

    osc.connect(gain);
    gain.connect(offlineCtx.destination);
    osc.start(n.time);
    osc.stop(n.time + dur + 0.02);
  }

  const audioBuffer = await offlineCtx.startRendering();
  return { audioBuffer, bpm, precomputedNotes: notes };
}
