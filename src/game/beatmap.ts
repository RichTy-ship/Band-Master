/**
 * Instrument-Dedicated 6-Key Beatmap & Sheet Arrangement Engine
 * 
 * Generates a distinct, bespoke 6-Key Round Sheet (A · S · D · ← · ↓ · →) for each of the 6 instruments:
 * 1. Studio Drums: Kick Pedal Bar (0), Snare Backbeat (1), Hi-Hat 8ths (2), High/Floor Tom Fills (3->4), Crash Accents (5)
 * 2. Lead Guitar: 2-String Power Chords, 6-String Sweep-Picking Scales (0..5) & Vibrato Sustain Tails
 * 3. Bass Guitar: Root-Octave Slap & Pop Grooves (0..2 <-> 3..5) & Tight Staccato Pocket
 * 4. Synth Keyboard: Zig-Zag Cascading Arpeggio Waves & Wide Polyphonic Synth Pad Chords
 * 5. Brass Trumpet: Syncopated Big-Band Brass Horn Stabs, Fanfare Triplets & Horn Swells
 * 6. Electric Violin: Long Bowed Legato Sustain Ribbons, Stepwise String Crossings & 5th Double-Stops
 */

import { Note, SongSection, GenerationOptions, InstrumentType } from '../types';
import { INSTRUMENT_META } from '../services/soundEffects';

export const FULL_SONG_STRUCTURE: SongSection[] = [
  { name: "Intro", startTime: 0, endTime: 10, energy: 3, description: "Atmospheric band intro buildup" },
  { name: "Verse 1", startTime: 10, endTime: 30, energy: 5, description: "Tight rhythm groove and lead melody" },
  { name: "Chorus 1", startTime: 30, endTime: 50, energy: 8, description: "Explosive full-band chorus hook" },
  { name: "Verse 2", startTime: 50, endTime: 70, energy: 4, description: "Syncopated bass and drum pocket" },
  { name: "Chorus 2 / Solo", startTime: 70, endTime: 90, energy: 10, description: "High-energy virtuosic solo and full band climax" },
  { name: "Outro", startTime: 90, endTime: 100, energy: 3, description: "Final chord resonance and fade out" },
];

export const QUICK_TEST_STRUCTURE: SongSection[] = [
  { name: "Intro", startTime: 0, endTime: 10, energy: 3, description: "Band count-in and atmospheric intro" },
  { name: "Chorus & Solo", startTime: 10, endTime: 20, energy: 9, description: "High-energy virtuosic band chorus" },
  { name: "Outro", startTime: 20, endTime: 30, energy: 3, description: "Final cadence fade out" },
];

const SYNTH_ARP_WAVE = [0, 2, 4, 5, 3, 1];
const GUITAR_SWEEP_SCALE = [0, 1, 2, 3, 4, 5, 4, 3, 2, 1];

export function getStructure(options: GenerationOptions): SongSection[] {
  return options.mode === 'quick' ? QUICK_TEST_STRUCTURE : FULL_SONG_STRUCTURE;
}

export function generatePrompt(sections: SongSection[], options: GenerationOptions): string {
  const instMeta = INSTRUMENT_META[options.instrument || 'guitar'];
  const totalDuration = sections.length > 0 ? sections[sections.length - 1].endTime : 0;
  const bpm = options.difficulty === 'easy' ? 90 : options.difficulty === 'normal' ? 128 : 150;

  let prompt = `Generate a ${totalDuration}-second track.\nContext: "A ${options.style} full-band track prominently featuring ${instMeta.name} (${instMeta.role})."\n`;
  prompt += `Constant tempo: ${bpm} BPM.\n`;
  for (const section of sections) {
    prompt += `- [${formatTime(section.startTime)}-${formatTime(section.endTime)}] ${section.name}: ${section.description}, Energy: ${section.energy}/10.\n`;
  }
  return prompt;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/**
 * Generates an instrument-dedicated 6-key sheet (columns 0..5) with unique playing mechanics per instrument.
 */
export function generateBeatmap(sections: SongSection[], options: GenerationOptions): Note[] {
  const instrument: InstrumentType = options.instrument || 'guitar';
  const notes: Note[] = [];
  const bpm = options.difficulty === 'easy' ? 90 : options.difficulty === 'normal' ? 128 : 150;
  const beatInterval = 60 / bpm;

  let beatCounter = 0;

  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    const nextSection = i + 1 < sections.length ? sections[i + 1] : null;

    for (let t = section.startTime; t < section.endTime; t += beatInterval) {
      beatCounter++;
      const beatInBar = beatCounter % 4; // 0, 1, 2, 3
      const barIndex = Math.floor(beatCounter / 4);

      let effectiveEnergy = section.energy;
      if (nextSection && nextSection.energy > section.energy && section.endTime - t <= 1.5) {
        effectiveEnergy = nextSection.energy;
      }

      if (instrument === 'drums') {
        // === 1. STUDIO DRUMS DEDICATED SHEET ===
        // 0=Kick(A), 1=Snare(S), 2=Hi-Hat(D), 3=High Tom(←), 4=Floor Tom(↓), 5=Crash(→)
        if (beatInBar === 0) {
          notes.push({ time: t, column: 0, hit: false, missed: false }); // Kick Pedal Bar
          if (effectiveEnergy >= 7 && options.difficulty !== 'easy') {
            notes.push({ time: t, column: 5, hit: false, missed: false }); // Simultaneous Crash Cymbal
          }
        } else if (beatInBar === 2) {
          notes.push({ time: t, column: 0, hit: false, missed: false }); // Kick
          if (effectiveEnergy >= 6) {
            notes.push({ time: t + beatInterval * 0.5, column: 2, hit: false, missed: false }); // Hi-Hat 8th
          }
        } else if (beatInBar === 1) {
          notes.push({ time: t, column: 1, hit: false, missed: false }); // Snare Backbeat
          if (effectiveEnergy >= 7 && options.difficulty !== 'easy') {
            notes.push({ time: t + beatInterval * 0.5, column: 2, hit: false, missed: false }); // Open Hi-Hat
          }
        } else {
          // Beat 3: Snare or Tom-Tom Drum Fill on turnaround bars
          if (barIndex % 2 === 1 && effectiveEnergy >= 6) {
            notes.push({ time: t, column: 3, hit: false, missed: false }); // High Tom
            if (options.difficulty !== 'easy') {
              notes.push({ time: t + beatInterval * 0.5, column: 4, hit: false, missed: false }); // Floor Tom
            }
          } else {
            notes.push({ time: t, column: 1, hit: false, missed: false }); // Snare
          }
        }
      } else if (instrument === 'guitar') {
        // === 2. LEAD GUITAR DEDICATED SHEET (Power Chords + Sweep Scales + Vibrato Sustains) ===
        const sweepCol = GUITAR_SWEEP_SCALE[beatCounter % GUITAR_SWEEP_SCALE.length];
        const hasVibratoSustain = beatInBar === 0 && effectiveEnergy <= 7;
        const dur = hasVibratoSustain ? Number((beatInterval * 1.45).toFixed(2)) : undefined;

        notes.push({
          time: t,
          column: sweepCol,
          duration: dur,
          hit: false,
          missed: false,
        });

        // Signature 2-Note Guitar Power Chords on downbeats & chorus accents
        if (
          options.difficulty !== 'easy' &&
          ((beatInBar === 0 && effectiveEnergy >= 6) || (beatInBar === 2 && effectiveEnergy >= 8))
        ) {
          notes.push({
            time: t,
            column: (sweepCol + 2) % 6,
            duration: dur,
            hit: false,
            missed: false,
          });
        }

        // Fast Guitar Solo Sweep-Picking 8th notes in Chorus/Solo
        if (effectiveEnergy >= 7 && (options.difficulty === 'hard' || beatInBar % 2 === 1)) {
          notes.push({
            time: t + beatInterval * 0.5,
            column: (sweepCol + 1) % 6,
            hit: false,
            missed: false,
          });
        }
      } else if (instrument === 'bass') {
        // === 3. BASS GUITAR DEDICATED SHEET (Root-Octave Slap & Pop Staccato Groove) ===
        // Alternates between Deep Sub Strings (0, 1, 2) on main beats and Pop Strings (3, 4, 5) on syncopated off-beats
        const rootCol = barIndex % 3; // 0, 1, or 2
        const popCol = rootCol + 3; // Octave Pop on 3, 4, or 5

        if (beatInBar % 2 === 0) {
          notes.push({ time: t, column: rootCol, hit: false, missed: false });
          if (effectiveEnergy >= 6 && options.difficulty !== 'easy') {
            // Slap-Pop Octave Jump on the 8th off-beat
            notes.push({
              time: t + beatInterval * 0.5,
              column: popCol,
              hit: false,
              missed: false,
            });
          }
        } else {
          notes.push({
            time: t,
            column: effectiveEnergy >= 7 ? popCol : (rootCol + 1) % 3,
            hit: false,
            missed: false,
          });
        }
      } else if (instrument === 'synth') {
        // === 4. SYNTH KEYBOARD DEDICATED SHEET (Cascading Arpeggios & Wide Polyphonic Pads) ===
        const arpCol = SYNTH_ARP_WAVE[beatCounter % SYNTH_ARP_WAVE.length];
        const isPadChord = beatInBar === 0;
        const padDur = isPadChord ? Number((beatInterval * 1.65).toFixed(2)) : undefined;

        notes.push({
          time: t,
          column: arpCol,
          duration: padDur,
          hit: false,
          missed: false,
        });

        if (isPadChord && options.difficulty !== 'easy') {
          notes.push({
            time: t,
            column: (arpCol + 3) % 6,
            duration: padDur,
            hit: false,
            missed: false,
          });
        }

        // Synth Arpeggiator 8th/16th cascading wave
        if (effectiveEnergy >= 5 && !isPadChord) {
          const nextArp = SYNTH_ARP_WAVE[(beatCounter + 1) % SYNTH_ARP_WAVE.length];
          notes.push({
            time: t + beatInterval * 0.5,
            column: nextArp,
            hit: false,
            missed: false,
          });
        }
      } else if (instrument === 'trumpet') {
        // === 5. BRASS TRUMPET DEDICATED SHEET (Big-Band Horn Stabs, Fanfare Triplets & Swells) ===
        const hornCol = 1 + (beatCounter % 5); // Focus on bright brass valves 1..5
        const isHornSwell = beatInBar === 0 || (beatInBar === 2 && effectiveEnergy >= 7);
        const swellDur = isHornSwell ? Number((beatInterval * 1.35).toFixed(2)) : undefined;

        notes.push({
          time: t,
          column: hornCol,
          duration: swellDur,
          hit: false,
          missed: false,
        });

        // Big-Band Double Brass Stab on Chorus hits
        if (effectiveEnergy >= 7 && beatInBar % 2 === 0 && options.difficulty !== 'easy') {
          notes.push({
            time: t,
            column: (hornCol + 2) % 6,
            duration: swellDur,
            hit: false,
            missed: false,
          });
        }

        // Brass Fanfare Pickup on beat 3
        if (beatInBar === 3 && effectiveEnergy >= 6) {
          notes.push({
            time: t + beatInterval * 0.5,
            column: (hornCol + 1) % 6,
            hit: false,
            missed: false,
          });
        }
      } else {
        // === 6. ELECTRIC VIOLIN DEDICATED SHEET (Long Bowed Legato Ribbons & Classical Double-Stops) ===
        const posCol = (barIndex + beatInBar) % 6;
        const isLongBow = beatInBar === 0 || beatInBar === 2;
        const bowDur = isLongBow ? Number((beatInterval * 1.75).toFixed(2)) : undefined;

        notes.push({
          time: t,
          column: posCol,
          duration: bowDur,
          hit: false,
          missed: false,
        });

        // Classical 5th Double-Stop on expressive downbeats
        if (beatInBar === 0 && effectiveEnergy >= 7 && options.difficulty !== 'easy') {
          notes.push({
            time: t,
            column: (posCol + 2) % 6,
            duration: bowDur,
            hit: false,
            missed: false,
          });
        } else if (!isLongBow && effectiveEnergy >= 6) {
          // Graceful stepwise string crossing
          notes.push({
            time: t + beatInterval * 0.5,
            column: (posCol + 1) % 6,
            hit: false,
            missed: false,
          });
        }
      }
    }
  }

  notes.sort((a, b) => a.time - b.time);
  return notes.filter((n) => n.time >= 3);
}

/**
 * Transforms any library song beatmap into an instrument-dedicated 6-key sheet
 * so each of the 6 instruments has its own distinct note patterns, chords, fills, and sustains.
 */
export function adaptLibraryBeatmapForInstrument(
  rawNotes: Note[],
  instrument: InstrumentType,
  difficulty: string
): Note[] {
  const filtered = rawNotes
    .filter((n) => n.time >= 3)
    .map((n) => ({ ...n, hit: false, missed: false }));

  const isEasy = difficulty.toLowerCase() === 'easy';
  const enhanced: Note[] = [];

  for (let i = 0; i < filtered.length; i++) {
    const curr = filtered[i];
    const next = i + 1 < filtered.length ? filtered[i + 1] : null;
    const gap = next ? next.time - curr.time : 1.0;

    if (instrument === 'drums') {
      // DRUMS SHEET: Map to Kick (0), Snare (1), Hi-Hat (2), High Tom (3), Floor Tom (4), Crash (5)
      let drumCol = 0;
      if (i % 8 === 0) {
        drumCol = 0; // Kick on downbeat
        if (!isEasy && gap >= 0.25) {
          enhanced.push({
            time: curr.time,
            column: 5, // Simultaneous Crash Cymbal
            hit: false,
            missed: false,
          });
        }
      } else if (i % 8 === 6) {
        drumCol = 3; // High Tom fill
      } else if (i % 8 === 7) {
        drumCol = 4; // Floor Tom fill
      } else if (i % 2 === 1) {
        drumCol = 2; // Hi-Hat
      } else {
        drumCol = 1; // Snare backbeat
      }

      enhanced.push({
        time: curr.time,
        column: drumCol,
        duration: undefined, // Drums never have long sustains
        hit: false,
        missed: false,
      });
    } else if (instrument === 'guitar') {
      // LEAD GUITAR SHEET: 6-String Sweep Scales + Power Chords + Vibrato Sustains
      const guitarCol = (curr.column + (i % 6)) % 6;
      const duration = gap >= 0.65 && i % 3 === 0 ? Math.min(gap * 0.78, 1.3) : undefined;

      enhanced.push({
        time: curr.time,
        column: guitarCol,
        duration,
        hit: false,
        missed: false,
      });

      if (!isEasy && i % 5 === 0 && gap >= 0.3) {
        enhanced.push({
          time: curr.time,
          column: (guitarCol + 2) % 6, // Power Chord Twin
          duration,
          hit: false,
          missed: false,
        });
      }
    } else if (instrument === 'bass') {
      // BASS GUITAR SHEET: Root (0..2) <-> Octave Pop (3..5) Staccato Pocket
      const rootBase = curr.column % 3;
      const bassCol = i % 2 === 0 ? rootBase : rootBase + 3;

      enhanced.push({
        time: curr.time,
        column: bassCol,
        duration: undefined, // Punchy staccato slap & pop
        hit: false,
        missed: false,
      });
    } else if (instrument === 'synth') {
      // SYNTH KEYBOARD SHEET: Zig-Zag Arpeggio Wave + Wide Polyphonic Pad Chords
      const synthCol = SYNTH_ARP_WAVE[i % SYNTH_ARP_WAVE.length];
      const duration = gap >= 0.55 && i % 4 === 0 ? Math.min(gap * 0.82, 1.45) : undefined;

      enhanced.push({
        time: curr.time,
        column: synthCol,
        duration,
        hit: false,
        missed: false,
      });

      if (!isEasy && i % 6 === 0 && gap >= 0.32) {
        enhanced.push({
          time: curr.time,
          column: (synthCol + 3) % 6, // Wide Synth Pad Chord
          duration,
          hit: false,
          missed: false,
        });
      }
    } else if (instrument === 'trumpet') {
      // BRASS TRUMPET SHEET: Syncopated Brass Stabs & Swelling Horn Notes
      const hornCol = 1 + ((curr.column + i) % 5);
      const duration = gap >= 0.6 && i % 3 === 1 ? Math.min(gap * 0.75, 1.2) : undefined;

      enhanced.push({
        time: curr.time,
        column: hornCol,
        duration,
        hit: false,
        missed: false,
      });

      if (!isEasy && i % 4 === 0 && gap >= 0.28) {
        enhanced.push({
          time: curr.time,
          column: (hornCol + 2) % 6, // Brass Section Double Stab
          duration,
          hit: false,
          missed: false,
        });
      }
    } else {
      // ELECTRIC VIOLIN SHEET: Smooth Bowed Legato Ribbons & Classical Double-Stops
      const violinCol = i % 6;
      const duration = gap >= 0.45 ? Math.min(gap * 0.85, 1.6) : undefined;

      enhanced.push({
        time: curr.time,
        column: violinCol,
        duration,
        hit: false,
        missed: false,
      });

      if (!isEasy && i % 7 === 0 && gap >= 0.4) {
        enhanced.push({
          time: curr.time,
          column: (violinCol + 2) % 6, // Violin 5th Double-Stop
          duration,
          hit: false,
          missed: false,
        });
      }
    }
  }

  enhanced.sort((a, b) => a.time - b.time);
  return enhanced;
}
