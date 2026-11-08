import React from 'react';
import { GameResult } from '../types';
import { Download, RotateCcw, ArrowLeft } from 'lucide-react';
import { soundFX, INSTRUMENT_META } from '../services/soundEffects';

interface ResultProps {
  result: GameResult;
  onReplay: () => void;
  onMenu: () => void;
}

export function Result({ result, onReplay, onMenu }: ResultProps) {
  const totalNotes = result.perfects + result.greats + result.goods + result.misses;
  const accuracyNum =
    totalNotes > 0
      ? ((result.perfects + result.greats * 0.8 + result.goods * 0.5) / totalNotes) * 100
      : 0;
  const accuracy = accuracyNum.toFixed(2);
  const instMeta = INSTRUMENT_META[result.instrument || 'guitar'];

  let rank = 'C';
  let rankColor = 'text-zinc-300';
  if (accuracyNum >= 99 && result.misses === 0) {
    rank = 'SSS';
    rankColor = 'text-amber-400';
  } else if (accuracyNum >= 95 && result.misses === 0) {
    rank = 'SS';
    rankColor = 'text-amber-400';
  } else if (accuracyNum >= 90) {
    rank = 'S';
    rankColor = 'text-cyan-400';
  } else if (accuracyNum >= 80) {
    rank = 'A';
    rankColor = 'text-emerald-400';
  } else if (accuracyNum >= 70) {
    rank = 'B';
    rankColor = 'text-sky-400';
  }

  const clearBadge =
    totalNotes > 0 && result.perfects === totalNotes
      ? 'ALL PERFECT ENCORE'
      : totalNotes > 0 && result.misses === 0
      ? 'FULL COMBO PERFORMANCE'
      : 'CONCERT COMPLETED';

  const offsets = result.hitOffsets || [];
  const meanOffset =
    offsets.length > 0
      ? offsets.reduce((acc, v) => acc + v, 0) / offsets.length
      : 0;

  const bins = [0, 0, 0, 0, 0, 0, 0, 0, 0];
  for (const ms of offsets) {
    const idx = Math.min(8, Math.max(0, Math.floor((ms + 135) / 30)));
    bins[idx]++;
  }
  const maxBin = Math.max(1, ...bins);

  const downloadAudio = () => {
    if (!result.audioBlob) return;
    soundFX.playUiClick(820);
    const url = URL.createObjectURL(result.audioBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'lyria-band-track.wav';
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadBeatmap = () => {
    if (!result.beatmap) return;
    soundFX.playUiClick(820);
    const data = JSON.stringify(result.beatmap, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'beatmap.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const judgments = [
    { label: 'Perfect', count: result.perfects, color: 'bg-amber-400', text: 'text-amber-400' },
    { label: 'Great', count: result.greats, color: 'bg-emerald-400', text: 'text-emerald-400' },
    { label: 'Good', count: result.goods, color: 'bg-cyan-400', text: 'text-cyan-400' },
    { label: 'Miss', count: result.misses, color: 'bg-rose-500', text: 'text-rose-400' },
  ];

  return (
    <div className="min-h-screen bg-[#08090C] text-[#F3F4F6] flex flex-col items-center justify-center p-6">
      <div className="max-w-4xl w-full bg-[#11131A] border border-white/[0.08] rounded-2xl p-8 lg:p-10">
        {/* Top Stage Summary Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-white/[0.08]">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-amber-400 mb-2">
              <span>{clearBadge}</span>
              <span aria-hidden="true">·</span>
              <span>{instMeta.name.toUpperCase()}</span>
              <span aria-hidden="true">·</span>
              <span>{result.bpm || 128} BPM</span>
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              {result.trackTitle || 'Lyria Band Session'}
            </h1>
            <p className="text-sm text-zinc-400 mt-1">
              Artist: {result.trackArtist || 'Lyria AI'} · Role: {instMeta.role}
            </p>
          </div>

          <div className="flex items-center gap-8">
            <div className="text-right">
              <div className="text-xs font-mono text-zinc-500">FINAL SCORE</div>
              <div className="font-mono text-4xl sm:text-5xl font-bold text-white tabular-nums mt-0.5">
                {result.score.toLocaleString()}
              </div>
            </div>
            <div className="pl-6 border-l border-white/[0.08] text-center">
              <div className="text-xs font-mono text-zinc-500">GRADE</div>
              <div
                className={`font-display text-5xl sm:text-6xl font-extrabold leading-none mt-1 ${rankColor}`}
              >
                {rank}
              </div>
            </div>
          </div>
        </div>

        {/* Middle Grid: Judgment Breakdown & Timing Histogram */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 py-8 border-b border-white/[0.08]">
          <div className="lg:col-span-7 flex flex-col justify-between space-y-5">
            <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
              <span>INSTRUMENT PERFORMANCE BREAKDOWN</span>
              <span className="tabular-nums">{totalNotes} Total Notes</span>
            </div>

            <div className="space-y-3.5">
              {judgments.map((j) => {
                const pct = totalNotes > 0 ? Math.round((j.count / totalNotes) * 100) : 0;
                return (
                  <div key={j.label}>
                    <div className="flex items-center justify-between text-sm mb-1.5 font-mono tabular-nums">
                      <span className={`font-semibold ${j.text}`}>{j.label}</span>
                      <span className="text-white font-bold">
                        {j.count}{' '}
                        <span className="text-xs text-zinc-500 font-normal">({pct}%)</span>
                      </span>
                    </div>
                    <div className="h-2 w-full bg-[#08090C] rounded-full overflow-hidden border border-white/[0.06]">
                      <div
                        className={`h-full ${j.color} transition-all duration-500`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Key KPI Strip */}
            <div className="grid grid-cols-4 gap-4 pt-4 border-t border-white/[0.06] font-mono tabular-nums">
              <div>
                <div className="text-xs text-zinc-500">Accuracy</div>
                <div className="text-lg font-bold text-cyan-400 mt-0.5">{accuracy}%</div>
              </div>
              <div>
                <div className="text-xs text-zinc-500">Max Streak</div>
                <div className="text-lg font-bold text-amber-400 mt-0.5">{result.maxCombo}x</div>
              </div>
              <div>
                <div className="text-xs text-zinc-500">Fever Boosts</div>
                <div className="text-lg font-bold text-emerald-400 mt-0.5">
                  {result.feverActivations || 0}x
                </div>
              </div>
              <div>
                <div className="text-xs text-zinc-500">Mean Offset</div>
                <div className="text-lg font-bold text-white mt-0.5">
                  {meanOffset >= 0 ? `+${meanOffset.toFixed(1)}` : meanOffset.toFixed(1)}ms
                </div>
              </div>
            </div>
          </div>

          {/* Right 5 Cols: Millisecond Timing Histogram */}
          <div className="lg:col-span-5 bg-[#08090C] border border-white/[0.06] rounded-xl p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs font-mono text-zinc-400 mb-4">
              <span>HIT TIMING DISTRIBUTION</span>
              <span>±150ms Window</span>
            </div>

            <div className="flex items-end justify-between gap-2 h-36 pt-4 pb-2 px-2">
              {bins.map((count, i) => {
                const hPct = Math.max(8, Math.round((count / maxBin) * 100));
                const isCenter = i === 4;
                const isNear = i === 3 || i === 5;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
                    <span className="text-[10px] font-mono text-zinc-500 mb-1 tabular-nums">
                      {count > 0 ? count : ''}
                    </span>
                    <div
                      className={`w-full rounded-t transition-all ${
                        isCenter
                          ? 'bg-amber-400'
                          : isNear
                          ? 'bg-emerald-400/80'
                          : 'bg-cyan-400/50'
                      }`}
                      style={{ height: `${hPct}%` }}
                    />
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500 pt-2 border-t border-white/[0.06]">
              <span>EARLY (-ms)</span>
              <span className="text-amber-400">0ms EXACT</span>
              <span>LATE (+ms)</span>
            </div>
          </div>
        </div>

        {/* Bottom Actions & Studio Export */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {result.audioBlob && (
              <button
                type="button"
                onClick={downloadAudio}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#08090C] hover:bg-white/[0.06] border border-white/[0.1] text-zinc-200 text-xs font-mono font-semibold rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Download size={15} />
                <span>Export WAV</span>
              </button>
            )}
            {result.beatmap && (
              <button
                type="button"
                onClick={downloadBeatmap}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#08090C] hover:bg-white/[0.06] border border-white/[0.1] text-zinc-200 text-xs font-mono font-semibold rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Download size={15} />
                <span>Export Beatmap JSON</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={() => {
                soundFX.playUiClick(680);
                onMenu();
              }}
              className="px-5 py-3 bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] text-white font-display font-semibold text-sm rounded-xl transition-colors flex items-center justify-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <ArrowLeft size={16} />
              <span>Band Studio</span>
            </button>
            <button
              type="button"
              onClick={() => {
                soundFX.playUiClick(880);
                onReplay();
              }}
              className="px-6 py-3 bg-amber-400 hover:bg-amber-300 text-black font-display font-bold text-sm rounded-xl transition-colors flex items-center justify-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <RotateCcw size={16} />
              <span>Play Encore</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
