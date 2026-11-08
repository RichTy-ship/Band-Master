/**
 * Interactive 6-Key 3D Neon Round Instrument Cockpit Visualizer
 *
 * Renders an instrument-tailored interactive hardware deck with 6 3D Neon Round Keys (A · S · D · ← · ↓ · →):
 * - Physical 3D cylindrical button depth with specular glass dome & neon under-glow
 * - Instant neon flare, radial bloom & expanding shockwave ring when touched or pressed via keyboard
 */

import React, { useState } from 'react';
import { Play, Sliders, Volume2 } from 'lucide-react';
import { InstrumentType } from '../types';
import {
  ACOUSTIC_TONE_PRESETS,
  AcousticTonePreset,
  INSTRUMENT_META,
  SIX_KEY_LABELS,
  soundFX,
} from '../services/soundEffects';

interface InstrumentCockpitProps {
  instrument: InstrumentType;
  activeLane: number | null;
  onTriggerLane: (col: number) => void;
}

export function InstrumentCockpit({
  instrument,
  activeLane,
  onTriggerLane,
}: InstrumentCockpitProps) {
  const meta = INSTRUMENT_META[instrument];
  const [tonePreset, setTonePreset] = useState<AcousticTonePreset>(soundFX.getTonePreset());
  const [riffLane, setRiffLane] = useState<number | null>(null);
  const [isPlayingRiff, setIsPlayingRiff] = useState(false);

  const displayedLane = activeLane !== null ? activeLane : riffLane;

  const handleSelectTone = (preset: AcousticTonePreset) => {
    soundFX.setTonePreset(preset);
    setTonePreset(preset);
    // Audition immediate chord/note with the newly selected acoustic preset
    soundFX.playWarmupNote(2, instrument, 0.35);
    setRiffLane(2);
    window.setTimeout(() => setRiffLane(null), 220);
  };

  const handlePlayShowcaseRiff = () => {
    setIsPlayingRiff(true);
    soundFX.playInstrumentShowcaseRiff(instrument, (col) => {
      setRiffLane(col);
      if (col === null) {
        setIsPlayingRiff(false);
      }
    });
  };

  return (
    <div
      className={`bg-[#08090C] border ${meta.borderClass} rounded-2xl p-4 relative overflow-hidden transition-shadow duration-150`}
      style={{
        boxShadow:
          displayedLane !== null
            ? `0 0 32px ${meta.laneColors[displayedLane]}26, inset 0 0 24px ${meta.laneColors[displayedLane]}18`
            : 'inset 0 1px 0 rgba(255,255,255,0.06)',
      }}
    >
      {/* Top Header: Cockpit Title + Showcase Riff Audition Button */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono mb-2.5">
        <div className="flex items-center gap-2">
          <span className={`${meta.badgeClass} font-bold`}>{meta.cockpitTitle}</span>
          <span className="hidden sm:inline-flex items-center gap-1 text-[10px] text-zinc-400 bg-white/[0.03] border border-white/10 px-2 py-0.5 rounded-md">
            <Volume2 className="w-3 h-3 text-cyan-400" />
            {meta.acousticEngine}
          </span>
        </div>

        <button
          type="button"
          onClick={handlePlayShowcaseRiff}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${
            isPlayingRiff
              ? 'bg-cyan-400 text-black border-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.5)]'
              : 'bg-white/[0.04] hover:bg-white/[0.09] text-zinc-200 border-white/15'
          }`}
        >
          <Play className="w-3 h-3 fill-current" />
          {isPlayingRiff ? 'ĐANG PHÁT RIFF...' : 'NGHE RIFF MẪU'}
        </button>
      </div>

      {/* Studio Acoustic Tone Preset Selector (Studio Clean / Concert Hall / Tube Overdrive) */}
      <div className="grid grid-cols-3 gap-1.5 mb-3.5 bg-[#050609] p-1 rounded-xl border border-white/10">
        {(Object.keys(ACOUSTIC_TONE_PRESETS) as AcousticTonePreset[]).map((presetKey) => {
          const info = ACOUSTIC_TONE_PRESETS[presetKey];
          const active = tonePreset === presetKey;
          return (
            <button
              key={presetKey}
              type="button"
              onClick={() => handleSelectTone(presetKey)}
              title={info.desc}
              className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg font-mono text-[10px] transition-all cursor-pointer ${
                active
                  ? 'bg-white/12 text-white font-bold border border-white/25 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 border border-transparent'
              }`}
            >
              <Sliders className={`w-2.5 h-2.5 ${active ? 'text-cyan-400' : 'text-zinc-500'}`} />
              <span className="truncate">{info.label}</span>
            </button>
          );
        })}
      </div>

      {/* 6 3D Volumetric Neon Round Keys Deck */}
      <div className="grid grid-cols-6 gap-2.5 items-center py-1">
        {meta.laneLabels.map((label, idx) => {
          const pressed = displayedLane === idx;
          const colHex = meta.laneColors[idx];
          const keyChar = SIX_KEY_LABELS[idx];

          return (
            <button
              key={idx}
              type="button"
              onPointerDown={() => onTriggerLane(idx)}
              className="group relative flex flex-col items-center justify-center focus:outline-none cursor-pointer select-none"
            >
              {/* Expanding Neon Touch Halo when pressed */}
              {pressed && (
                <span
                  className="absolute top-0 w-12 h-12 sm:w-14 sm:h-14 rounded-full animate-ping pointer-events-none opacity-65"
                  style={{
                    backgroundColor: `${colHex}44`,
                    border: `2px solid ${colHex}`,
                  }}
                />
              )}

              {/* True 1:1 3D Cylindrical Neon Round Button */}
              <div
                className={`relative w-12 h-12 sm:w-14 sm:h-14 aspect-square rounded-full border-2 flex flex-col items-center justify-center transition-all duration-75 ${
                  pressed ? 'translate-y-1 scale-95' : ' -translate-y-0.5 group-hover:-translate-y-1'
                }`}
                style={{
                  borderColor: pressed ? '#FFFFFF' : colHex,
                  background: pressed
                    ? `radial-gradient(circle at 35% 30%, #FFFFFF 0%, ${colHex} 58%, #090B10 100%)`
                    : `radial-gradient(circle at 35% 28%, ${colHex}44 0%, #121624 68%, #08090E 100%)`,
                  boxShadow: pressed
                    ? `0 0 28px ${colHex}, 0 0 48px ${colHex}AA, inset 0 0 14px #FFFFFF`
                    : `0 6px 0 ${colHex}66, 0 8px 18px rgba(0,0,0,0.75), 0 0 14px ${colHex}38, inset 0 2px 4px rgba(255,255,255,0.28)`,
                }}
              >
                {/* Top 3D Specular Glass Highlight Arc */}
                <div
                  className="w-7 h-3 rounded-full absolute top-1.5 pointer-events-none"
                  style={{
                    background:
                      'linear-gradient(180deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0) 100%)',
                  }}
                />

                {/* Inner Concentric Neon Core Ring */}
                <div
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border flex flex-col items-center justify-center"
                  style={{
                    borderColor: pressed ? '#FFFFFF' : `${colHex}AA`,
                    backgroundColor: pressed ? 'rgba(255,255,255,0.22)' : `${colHex}1F`,
                    boxShadow: pressed ? `0 0 12px #FFFFFF` : `inset 0 0 8px ${colHex}44`,
                  }}
                >
                  <span
                    className={`font-display text-xs sm:text-sm font-extrabold leading-none ${
                      pressed ? 'text-black drop-shadow-sm' : 'text-white'
                    }`}
                  >
                    {keyChar}
                  </span>
                </div>
              </div>

              {/* Instrument String / Drum Pad Label */}
              <span
                className="font-display text-[10px] sm:text-[11px] font-bold mt-2 truncate max-w-full transition-colors"
                style={{ color: pressed ? colHex : '#F3F4F6' }}
              >
                {label.split(' ')[0]}
              </span>
              <span className="font-mono text-[9px] text-zinc-500 truncate max-w-full">
                {meta.laneSubLabels[idx]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Stereo Field & Key Hint Footer */}
      <div className="mt-2.5 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-zinc-500">
        <span>STEREO PAN: L -52% ⟷ R +52%</span>
        <span className="text-zinc-400">PHÍM THỬ: A · S · D · ← · ↓ · →</span>
      </div>
    </div>
  );
}
