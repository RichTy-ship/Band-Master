import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Note, GameResult, GameplaySettings, SongSection, InstrumentType } from '../types';
import {
  Pause,
  Play,
  RotateCcw,
  ArrowLeft,
  Volume2,
  VolumeX,
} from 'lucide-react';
import {
  soundFX,
  INSTRUMENT_META,
  SIX_KEY_CODES,
  SIX_KEY_ALT_CODES,
  SIX_KEY_LABELS,
} from '../services/soundEffects';

const HIT_WINDOW = 0.15;
const COLUMNS = 6;
const FEVER_COLOR = '#FBBF24';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  alpha: number;
  size: number;
  decay: number;
}

interface Shockwave {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  color: string;
  alpha: number;
}

interface GameProps {
  audioUrl: string;
  beatmap: Note[];
  settings: GameplaySettings;
  onUpdateSettings: (settings: GameplaySettings) => void;
  onSwitchInstrument?: (inst: InstrumentType) => Note[] | null;
  onComplete: (result: GameResult) => void;
  onExit: () => void;
  trackTitle?: string;
  trackArtist?: string;
  bpm?: number;
  difficulty?: string;
  sections?: SongSection[];
  waveformPeaks?: number[];
  allowedInstruments?: InstrumentType[];
  genreName?: string;
}

const ALL_INSTRUMENTS: InstrumentType[] = [
  'drums',
  'guitar',
  'bass',
  'synth',
  'trumpet',
  'violin',
];

export function Game({
  audioUrl,
  beatmap,
  settings,
  onUpdateSettings,
  onSwitchInstrument,
  onComplete,
  onExit,
  trackTitle = 'BandMaster Stage Session',
  trackArtist = 'BandMaster Studio',
  bpm = 128,
  difficulty = 'Normal',
  sections = [],
  waveformPeaks,
  allowedInstruments,
  genreName,
}: GameProps) {
  const stageInstruments = (
    allowedInstruments && allowedInstruments.length > 0
      ? allowedInstruments
      : ALL_INSTRUMENTS
  ).slice(0, 3);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [autoPlay, setAutoPlay] = useState(false);
  const [countdown, setCountdown] = useState<number>(2);
  const [pressedLanesUI, setPressedLanesUI] = useState<boolean[]>([
    false,
    false,
    false,
    false,
    false,
    false,
  ]);
  const [hudStats, setHudStats] = useState({
    score: 0,
    combo: 0,
    multiplier: 1,
    accuracy: '100.0',
    progress: 0,
    currentTimeSec: 0,
    durationSec: 0,
    sectionName: 'Intro',
    health: 100,
    fever: 0,
    feverActive: false,
  });

  const settingsRef = useRef(settings);
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  const autoPlayRef = useRef(autoPlay);
  useEffect(() => {
    autoPlayRef.current = autoPlay;
  }, [autoPlay]);

  const instMeta = INSTRUMENT_META[settings.instrument || 'drums'];

  const gameState = useRef({
    notes: (JSON.parse(JSON.stringify(beatmap)) as Note[]).map((n) => ({
      ...n,
      column: Math.abs(n.column) % COLUMNS,
    })),
    score: 0,
    combo: 0,
    maxCombo: 0,
    perfects: 0,
    greats: 0,
    goods: 0,
    misses: 0,
    baseMultiplier: 1,
    health: 100,
    fever: 0,
    feverActive: false,
    feverEndTime: 0,
    feverActivations: 0,
    hitOffsets: [] as number[],
    keysPressed: [false, false, false, false, false, false],
    laneFlashAlpha: [0, 0, 0, 0, 0, 0],
    stringVibration: [0, 0, 0, 0, 0, 0],
    drumstickStrike: [0, 0, 0, 0, 0, 0],
    bowPosition: 0.5, // 0..1 for violin bow animation
    lastHitText: '',
    lastHitSubtext: '',
    lastHitTime: 0,
    lastHitColor: '#FFF',
    particles: [] as Particle[],
    shockwaves: [] as Shockwave[],
    bassPulse: 0,
    bandAnimImpulse: 0,
  });

  const activateFever = useCallback(() => {
    const s = gameState.current;
    if (s.feverActive || s.fever < 100) return;
    s.feverActive = true;
    s.fever = 100;
    s.feverEndTime = performance.now() + 8000;
    s.feverActivations++;
    s.bassPulse = 1.4;
    s.lastHitText = 'BAND FEVER 2X!';
    s.lastHitSubtext = 'STAR POWER OVERDRIVE ACTIVE';
    s.lastHitColor = '#FBBF24';
    s.lastHitTime = performance.now();
    if (settingsRef.current.hitSoundEnabled) {
      soundFX.playFeverActivate();
    }
  }, []);

  const spawnHitEffects = (x: number, y: number, color: string, isPerfect: boolean) => {
    const count = isPerfect ? 26 : 14;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.4;
      const speed = (isPerfect ? 4.8 : 3.0) + Math.random() * 4.8;
      gameState.current.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.5,
        color,
        alpha: 1,
        size: isPerfect ? 3.8 + Math.random() * 3 : 2.5 + Math.random() * 2,
        decay: 0.024 + Math.random() * 0.018,
      });
    }

    gameState.current.shockwaves.push({
      x,
      y,
      radius: 22,
      maxRadius: isPerfect ? 78 : 54,
      color,
      alpha: 0.94,
    });
  };

  const syncHudStats = useCallback(
    (currentTime: number, duration: number) => {
      const s = gameState.current;
      const totalJudged = s.perfects + s.greats + s.goods + s.misses;
      const acc =
        totalJudged > 0
          ? (((s.perfects + s.greats * 0.8 + s.goods * 0.5) / totalJudged) * 100).toFixed(1)
          : '100.0';

      let currentSec = 'Live Stage';
      if (sections.length > 0) {
        const found = sections.find(
          (sec) => currentTime >= sec.startTime && currentTime <= sec.endTime
        );
        if (found) currentSec = `${found.name} · E${found.energy}/10`;
      }

      const effectiveMult = s.baseMultiplier * (s.feverActive ? 2 : 1);

      setHudStats({
        score: s.score,
        combo: s.combo,
        multiplier: effectiveMult,
        accuracy: acc,
        progress: duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0,
        currentTimeSec: currentTime,
        durationSec: duration,
        sectionName: currentSec,
        health: s.health,
        fever: Math.round(s.fever),
        feverActive: s.feverActive,
      });
    },
    [sections]
  );

  const getLaneTargetCoords = (col: number, canvasWidth: number, canvasHeight: number) => {
    const isDown = settingsRef.current.scrollDirection === 'down';
    const bottomWidth = Math.min(canvasWidth * 0.86, 680);
    const receptorY = isDown ? canvasHeight - 105 : 155;
    const laneW = bottomWidth / COLUMNS;
    const startX = (canvasWidth - bottomWidth) / 2;
    return {
      x: startX + col * laneW + laneW / 2,
      y: receptorY,
    };
  };

  const handleHit = useCallback(
    (col: number, currentTime: number) => {
      const safeCol = Math.abs(col) % COLUMNS;
      const state = gameState.current;
      state.laneFlashAlpha[safeCol] = 1.0;
      state.drumstickStrike[safeCol] = 1.0;
      state.bowPosition = safeCol / (COLUMNS - 1);

      let closestNote: Note | null = null;
      let minDiff = HIT_WINDOW;
      let signedDiff = 0;

      for (const note of state.notes) {
        if (note.column === safeCol && !note.hit && !note.missed) {
          const diff = Math.abs(note.time - currentTime);
          if (diff < minDiff) {
            minDiff = diff;
            signedDiff = currentTime - note.time;
            closestNote = note;
          }
        }
      }

      const canvas = canvasRef.current;
      const coords = getLaneTargetCoords(
        safeCol,
        canvas?.width || 960,
        canvas?.height || 720
      );

      const inst = settingsRef.current.instrument;
      const laneColors = INSTRUMENT_META[inst].laneColors;

      if (closestNote) {
        closestNote.hit = true;
        state.combo++;
        if (state.combo > state.maxCombo) state.maxCombo = state.combo;

        if (state.combo >= 50) state.baseMultiplier = 4;
        else if (state.combo >= 25) state.baseMultiplier = 3;
        else if (state.combo >= 10) state.baseMultiplier = 2;
        else state.baseMultiplier = 1;

        state.stringVibration[safeCol] = 1.0;
        state.bandAnimImpulse = 1.0;

        const offsetMs = Math.round(signedDiff * 1000);
        state.hitOffsets.push(offsetMs);
        const timingTag =
          Math.abs(offsetMs) <= 8
            ? `${offsetMs >= 0 ? '+' : ''}${offsetMs}ms EXACT`
            : offsetMs < 0
            ? `${offsetMs}ms EARLY`
            : `+${offsetMs}ms LATE`;

        const hitColor = state.feverActive ? FEVER_COLOR : laneColors[safeCol];

        let points = 0;
        if (minDiff < 0.05) {
          points = 300;
          state.perfects++;
          state.health = Math.min(100, state.health + 2.5);
          if (!state.feverActive) {
            state.fever = Math.min(100, state.fever + 6.5);
          }
          state.lastHitText = 'PERFECT';
          state.lastHitSubtext = timingTag;
          state.lastHitColor = '#F59E0B';
          state.bassPulse = 1.0;
          if (settingsRef.current.hitSoundEnabled) {
            soundFX.playHitSound('PERFECT', safeCol, inst, closestNote.duration);
          }
          spawnHitEffects(coords.x, coords.y, hitColor, true);
        } else if (minDiff < 0.1) {
          points = 150;
          state.greats++;
          state.health = Math.min(100, state.health + 1.2);
          if (!state.feverActive) {
            state.fever = Math.min(100, state.fever + 4.0);
          }
          state.lastHitText = 'GREAT';
          state.lastHitSubtext = timingTag;
          state.lastHitColor = '#10B981';
          state.bassPulse = 0.65;
          if (settingsRef.current.hitSoundEnabled) {
            soundFX.playHitSound('GREAT', safeCol, inst, closestNote.duration);
          }
          spawnHitEffects(coords.x, coords.y, hitColor, false);
        } else {
          points = 60;
          state.goods++;
          if (!state.feverActive) {
            state.fever = Math.min(100, state.fever + 1.5);
          }
          state.lastHitText = 'GOOD';
          state.lastHitSubtext = timingTag;
          state.lastHitColor = '#06B6D4';
          if (settingsRef.current.hitSoundEnabled) {
            soundFX.playHitSound('GOOD', safeCol, inst, closestNote.duration);
          }
          spawnHitEffects(coords.x, coords.y, '#06B6D4', false);
        }

        const effectiveMult = state.baseMultiplier * (state.feverActive ? 2 : 1);
        state.score += points * effectiveMult;
        state.lastHitTime = performance.now();

        if (state.fever >= 100 && !state.feverActive && settingsRef.current.autoFever) {
          activateFever();
        }
      } else if (settingsRef.current.hitSoundEnabled) {
        soundFX.playWarmupNote(safeCol, inst, 0.22);
      }
    },
    [activateFever]
  );


  const togglePause = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !isPlaying) return;
    if (audio.paused) {
      audio.play().catch(console.error);
      setIsPaused(false);
    } else {
      audio.pause();
      setIsPaused(true);
    }
  }, [isPlaying]);

  const handleRestartTrack = () => {
    const audio = audioRef.current;
    if (!audio) return;
    soundFX.playUiClick(780);
    gameState.current = {
      notes: (JSON.parse(JSON.stringify(beatmap)) as Note[]).map((n) => ({
        ...n,
        column: Math.abs(n.column) % COLUMNS,
      })),
      score: 0,
      combo: 0,
      maxCombo: 0,
      perfects: 0,
      greats: 0,
      goods: 0,
      misses: 0,
      baseMultiplier: 1,
      health: 100,
      fever: 0,
      feverActive: false,
      feverEndTime: 0,
      feverActivations: 0,
      hitOffsets: [],
      keysPressed: [false, false, false, false, false, false],
      laneFlashAlpha: [0, 0, 0, 0, 0, 0],
      stringVibration: [0, 0, 0, 0, 0, 0],
      drumstickStrike: [0, 0, 0, 0, 0, 0],
      bowPosition: 0.5,
      lastHitText: '',
      lastHitSubtext: '',
      lastHitTime: 0,
      lastHitColor: '#FFF',
      particles: [],
      shockwaves: [],
      bassPulse: 0,
      bandAnimImpulse: 0,
    };
    audio.currentTime = 0;
    audio.play().catch(console.error);
    setIsPaused(false);
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const c1 = setTimeout(() => setCountdown(1), 900);
    const c2 = setTimeout(() => {
      setCountdown(0);
      audio.play().catch(console.error);
      setIsPlaying(true);
    }, 1800);

    const resolveKeyCol = (code: string): number => {
      let col = SIX_KEY_CODES.indexOf(code);
      if (col === -1) col = SIX_KEY_ALT_CODES.indexOf(code);
      return col;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.code === 'Escape' || e.code === 'KeyP') {
        e.preventDefault();
        togglePause();
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        activateFever();
        return;
      }

      const col = resolveKeyCol(e.code);
      if (col !== -1) {
        e.preventDefault();
        if (!gameState.current.keysPressed[col]) {
          gameState.current.keysPressed[col] = true;
          gameState.current.laneFlashAlpha[col] = 1.0;
          setPressedLanesUI([...gameState.current.keysPressed]);
          if (!audio.paused) {
            handleHit(col, audio.currentTime);
          }
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const col = resolveKeyCol(e.code);
      if (col !== -1) {
        e.preventDefault();
        gameState.current.keysPressed[col] = false;
        setPressedLanesUI([...gameState.current.keysPressed]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    let animationFrameId: number;
    let lastHudSync = 0;

    const render = () => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!canvas || !ctx) return;

      const W = canvas.width;
      const H = canvas.height;
      const currentTime = audio.currentTime;
      const duration = audio.duration || 100;
      const nowMs = performance.now();
      const beatInterval = 60 / bpm;
      const beatPhase = (currentTime % beatInterval) / beatInterval;
      const naturalBeatPulse = Math.pow(1 - beatPhase, 3);

      const s = gameState.current;
      const inst = settingsRef.current.instrument;
      const activeInstMeta = INSTRUMENT_META[inst];
      const laneColors = activeInstMeta.laneColors;

      if (s.feverActive) {
        const remaining = s.feverEndTime - nowMs;
        if (remaining <= 0) {
          s.feverActive = false;
          s.fever = 0;
        } else {
          s.fever = (remaining / 8000) * 100;
        }
      }

      if (nowMs - lastHudSync > 90) {
        syncHudStats(currentTime, duration);
        lastHudSync = nowMs;
      }

      s.bassPulse *= 0.9;
      s.bandAnimImpulse *= 0.92;
      for (let i = 0; i < COLUMNS; i++) {
        s.stringVibration[i] *= 0.88;
        s.drumstickStrike[i] *= 0.82;
        if (!s.keysPressed[i]) {
          s.laneFlashAlpha[i] *= 0.84;
        } else {
          s.laneFlashAlpha[i] = 1.0;
        }
      }

      // 1. Concert Arena Canvas Backdrop
      ctx.fillStyle = '#08090C';
      ctx.fillRect(0, 0, W, H);

      // Ambient Stage Spotlights & Instrument Aura
      const activeEnergy =
        (!audio.paused ? naturalBeatPulse * 0.35 : 0) + s.bassPulse * 0.65;
      const grad = ctx.createRadialGradient(W / 2, H * 0.32, 20, W / 2, H * 0.45, W * 0.62);
      if (s.feverActive) {
        grad.addColorStop(0, `rgba(251, 191, 36, ${0.19 + activeEnergy * 0.14})`);
        grad.addColorStop(0.55, `rgba(6, 182, 212, ${0.08 + activeEnergy * 0.08})`);
      } else {
        grad.addColorStop(0, `${activeInstMeta.accentHex}22`);
        grad.addColorStop(0.55, `rgba(6, 182, 212, ${0.04 + activeEnergy * 0.05})`);
      }
      grad.addColorStop(1, 'rgba(8, 9, 12, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      // Sweeping Stage Spotlights
      for (let sp = 0; sp < 4; sp++) {
        const baseX = W * (0.2 + sp * 0.2);
        const sway = Math.sin(currentTime * 1.8 + sp * 1.4) * 90;
        const beamGrad = ctx.createLinearGradient(baseX, 0, baseX + sway, 220);
        const spColor = s.feverActive
          ? 'rgba(251, 191, 36, 0.14)'
          : sp % 2 === 0
          ? `${activeInstMeta.accentHex}1A`
          : 'rgba(6, 182, 212, 0.09)';
        beamGrad.addColorStop(0, spColor);
        beamGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = beamGrad;
        ctx.beginPath();
        ctx.moveTo(baseX - 18, 0);
        ctx.lineTo(baseX + 18, 0);
        ctx.lineTo(baseX + sway + 75, 220);
        ctx.lineTo(baseX + sway - 75, 220);
        ctx.closePath();
        ctx.fill();
      }

      // 2. Live Band Stage Header Deck
      const stageY = 82;
      const speakerPulse = 1 + activeEnergy * 0.12;
      [W * 0.16, W * 0.84].forEach((sx) => {
        ctx.fillStyle = '#12151F';
        ctx.strokeStyle = s.feverActive ? 'rgba(251,191,36,0.5)' : 'rgba(255,255,255,0.12)';
        ctx.lineWidth = 1.5;
        ctx.fillRect(sx - 28, stageY - 52, 56, 62);
        ctx.strokeRect(sx - 28, stageY - 52, 56, 62);

        ctx.beginPath();
        ctx.arc(sx, stageY - 35, 11 * speakerPulse, 0, Math.PI * 2);
        ctx.arc(sx, stageY - 10, 14 * speakerPulse, 0, Math.PI * 2);
        ctx.strokeStyle = s.feverActive ? '#FBBF24' : activeInstMeta.accentHex;
        ctx.stroke();
      });

      const bandMembers = [
        { role: 'BASS', inst: 'bass', x: W * 0.32 },
        { role: 'DRUMS', inst: 'drums', x: W * 0.44 },
        { role: 'GUITAR', inst: 'guitar', x: W * 0.56 },
        {
          role:
            inst === 'trumpet' ? 'TRUMPET' : inst === 'violin' ? 'VIOLIN' : 'SYNTH',
          inst: ['synth', 'trumpet', 'violin'].includes(inst) ? inst : 'synth',
          x: W * 0.68,
        },
      ];

      bandMembers.forEach((m, idx) => {
        const isPlayerRole = m.inst === inst;
        const bounce =
          (!audio.paused ? Math.abs(Math.sin(currentTime * (bpm / 30) + idx)) * 5 : 0) +
          (isPlayerRole ? s.bandAnimImpulse * 7 : 0);

        ctx.save();
        ctx.translate(m.x, stageY - bounce);

        if (isPlayerRole) {
          ctx.fillStyle = s.feverActive
            ? 'rgba(251, 191, 36, 0.32)'
            : `${activeInstMeta.accentHex}44`;
          ctx.beginPath();
          ctx.arc(0, -14, 24, 0, Math.PI * 2);
          ctx.fill();
        }

        if (m.inst === 'drums') {
          ctx.strokeStyle = isPlayerRole ? '#F97316' : 'rgba(255,255,255,0.28)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(0, -10, 12, 0, Math.PI * 2);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(-22, -28);
          ctx.lineTo(-10, -28);
          ctx.moveTo(10, -30);
          ctx.lineTo(22, -30);
          ctx.stroke();
        }

        ctx.fillStyle = isPlayerRole
          ? s.feverActive
            ? '#FBBF24'
            : '#FFFFFF'
          : 'rgba(161, 161, 170, 0.55)';
        ctx.beginPath();
        ctx.arc(0, -35, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(-9, -25, 18, 22, 5);
        } else {
          ctx.rect(-9, -25, 18, 22);
        }
        ctx.fill();

        ctx.font = '700 9px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = isPlayerRole ? '#FBBF24' : 'rgba(161,161,170,0.6)';
        ctx.fillText(isPlayerRole ? `★ ${m.role}` : m.role, 0, 18);
        ctx.restore();
      });

      // Flanking Acoustic Equalizer Wings
      const numBars = 18;
      const barSpacing = (H - 240) / numBars;
      const waveIdx =
        waveformPeaks && waveformPeaks.length > 0 && duration > 0
          ? Math.min(
              waveformPeaks.length - 1,
              Math.floor((currentTime / duration) * waveformPeaks.length)
            )
          : -1;
      const livePeak = waveIdx >= 0 ? waveformPeaks![waveIdx] : activeEnergy;

      for (let b = 0; b < numBars; b++) {
        const freqSeed =
          !audio.paused && isPlaying
            ? Math.sin(currentTime * 13 + b * 0.65) * 0.5 +
              Math.cos(currentTime * 19 - b * 0.4) * 0.5
            : 0.05;
        const barAmplitude = Math.max(
          5,
          (Math.abs(freqSeed) * 48 + livePeak * 44) *
            (1 - Math.abs(b - numBars / 2) / numBars)
        );
        const by = 130 + b * barSpacing;

        ctx.fillStyle = s.feverActive
          ? 'rgba(251, 191, 36, 0.35)'
          : b % 2 === 0
          ? `${activeInstMeta.accentHex}44`
          : 'rgba(6, 182, 212, 0.25)';
        ctx.fillRect(14, by, barAmplitude, 4);
        ctx.fillRect(W - 14 - barAmplitude, by, barAmplitude, 4);
      }

      const isDown = settingsRef.current.scrollDirection === 'down';
      const speedMult = settingsRef.current.speedMultiplier;

      for (const note of s.notes) {
        if (note.hit || note.missed) continue;

        // Auto-Play Band Demo Mode
        if (
          autoPlayRef.current &&
          !audio.paused &&
          isPlaying &&
          currentTime >= note.time - 0.018
        ) {
          const cIdx = Math.abs(note.column) % COLUMNS;
          s.keysPressed[cIdx] = true;
          s.laneFlashAlpha[cIdx] = 1.0;
          setPressedLanesUI([...s.keysPressed]);
          handleHit(cIdx, note.time);
          setTimeout(() => {
            gameState.current.keysPressed[cIdx] = false;
            setPressedLanesUI([...gameState.current.keysPressed]);
          }, 95);
          continue;
        }

        if (currentTime - note.time > HIT_WINDOW) {
          note.missed = true;
          s.combo = 0;
          s.baseMultiplier = 1;
          s.misses++;
          s.health = Math.max(0, s.health - 6);
          s.lastHitText = 'MISS';
          s.lastHitSubtext = 'BROKEN STREAK';
          s.lastHitColor = '#F43F5E';
          s.lastHitTime = nowMs;
        }
      }

      // 3. Render 3D Volumetric Neon Sheet Highway & 3D Spherical/Cylindrical Round Keys
      {
        const horizonY = isDown ? 115 : H - 90;
        const receptorY = isDown ? H - 110 : 155;
        const topWidth = 252;
        const bottomWidth = Math.min(W * 0.86, 684);
        const vanishX = W / 2;
        const lookAheadTime = 2.0 / speedMult;

        const project3D = (z: number, colFloat: number) => {
          const p = Math.pow(Math.max(0.001, z), 1.65);
          const y = horizonY + (receptorY - horizonY) * p;
          const currentW = topWidth + (bottomWidth - topWidth) * p;
          const leftEdge = vanishX - currentW / 2;
          const x = leftEdge + (colFloat / COLUMNS) * currentW;
          const scale = currentW / bottomWidth;
          return { x, y, scale, currentW };
        };

        const tl = project3D(0, 0);
        const tr = project3D(0, COLUMNS);
        const bl = project3D(1.13, 0);
        const br = project3D(1.13, COLUMNS);

        // 3A-0. Floating 3D Instrument Sheet Title Banner at the Horizon
        ctx.save();
        ctx.font = '800 10px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = s.feverActive ? FEVER_COLOR : activeInstMeta.accentHex;
        const bannerY = isDown ? horizonY - 12 : horizonY + 18;
        ctx.fillText(
          `★ ${activeInstMeta.sheetTitle} (${activeInstMeta.sheetStyleBadge.toUpperCase()}) ★`,
          vanishX,
          bannerY
        );
        ctx.restore();

        // 3A. 3D Extruded Highway Side-Walls & Front Bevel Chassis (Gives True 3D Physical Thickness)
        const wallTopDepth = 7;
        const wallBotDepth = 24;

        // Left 3D Side Bevel Wall
        const leftWallGrad = ctx.createLinearGradient(tl.x - 16, horizonY, bl.x - 24, receptorY);
        leftWallGrad.addColorStop(0, 'rgba(15, 18, 28, 0.4)');
        leftWallGrad.addColorStop(1, `${activeInstMeta.accentHex}38`);
        ctx.fillStyle = leftWallGrad;
        ctx.beginPath();
        ctx.moveTo(tl.x, tl.y);
        ctx.lineTo(bl.x, bl.y);
        ctx.lineTo(bl.x - 14, bl.y + wallBotDepth);
        ctx.lineTo(tl.x - 5, tl.y + wallTopDepth);
        ctx.closePath();
        ctx.fill();

        // Right 3D Side Bevel Wall
        const rightWallGrad = ctx.createLinearGradient(tr.x + 16, horizonY, br.x + 24, receptorY);
        rightWallGrad.addColorStop(0, 'rgba(15, 18, 28, 0.4)');
        rightWallGrad.addColorStop(1, `${activeInstMeta.accentHex}38`);
        ctx.fillStyle = rightWallGrad;
        ctx.beginPath();
        ctx.moveTo(tr.x, tr.y);
        ctx.lineTo(br.x, br.y);
        ctx.lineTo(br.x + 14, br.y + wallBotDepth);
        ctx.lineTo(tr.x + 5, tr.y + wallTopDepth);
        ctx.closePath();
        ctx.fill();

        // Front 3D Stage Apron Cliff under the 6 Round Keys
        const frontApronGrad = ctx.createLinearGradient(0, bl.y, 0, bl.y + wallBotDepth);
        frontApronGrad.addColorStop(0, '#161B2B');
        frontApronGrad.addColorStop(1, '#050609');
        ctx.fillStyle = frontApronGrad;
        ctx.beginPath();
        ctx.moveTo(bl.x, bl.y);
        ctx.lineTo(br.x, br.y);
        ctx.lineTo(br.x + 14, br.y + wallBotDepth);
        ctx.lineTo(bl.x - 14, bl.y + wallBotDepth);
        ctx.closePath();
        ctx.fill();

        // Main 3D Sheet Deck Surface
        const deckGrad = ctx.createLinearGradient(0, horizonY, 0, receptorY);
        if (s.feverActive) {
          deckGrad.addColorStop(0, 'rgba(45, 32, 10, 0.55)');
          deckGrad.addColorStop(0.85, 'rgba(30, 24, 14, 0.96)');
          deckGrad.addColorStop(1, 'rgba(42, 32, 14, 0.99)');
        } else {
          deckGrad.addColorStop(0, activeInstMeta.neckTint[0]);
          deckGrad.addColorStop(0.85, activeInstMeta.neckTint[1]);
          deckGrad.addColorStop(1, activeInstMeta.neckTint[2]);
        }

        ctx.fillStyle = deckGrad;
        ctx.beginPath();
        ctx.moveTo(tl.x, tl.y);
        ctx.lineTo(tr.x, tr.y);
        ctx.lineTo(br.x, br.y);
        ctx.lineTo(bl.x, bl.y);
        ctx.closePath();
        ctx.fill();

        // === INSTRUMENT-DEDICATED 3D SHEET DECK ARCHITECTURES ===
        if (inst === 'synth') {
          // SYNTH SHEET: Alternating Ebony/Ivory Cyber Piano-Roll Lanes
          for (let c = 0; c < COLUMNS; c++) {
            const isSharpLane = c === 1 || c === 3 || c === 4;
            const pT1 = project3D(0, c);
            const pT2 = project3D(0, c + 1);
            const pB1 = project3D(1.12, c);
            const pB2 = project3D(1.12, c + 1);
            ctx.fillStyle = isSharpLane
              ? 'rgba(6, 182, 212, 0.07)'
              : 'rgba(255, 255, 255, 0.03)';
            ctx.beginPath();
            ctx.moveTo(pT1.x, pT1.y);
            ctx.lineTo(pT2.x, pT2.y);
            ctx.lineTo(pB2.x, pB2.y);
            ctx.lineTo(pB1.x, pB1.y);
            ctx.closePath();
            ctx.fill();
          }
        } else if (inst === 'drums') {
          // DRUMS SHEET: Highlighted Double-Bass Kick Pedal Track on Lane 0 (A) & Cymbal Tracks on Lanes 2, 5
          [0, 2, 5].forEach((cIdx) => {
            const pT1 = project3D(0, cIdx);
            const pT2 = project3D(0, cIdx + 1);
            const pB1 = project3D(1.12, cIdx);
            const pB2 = project3D(1.12, cIdx + 1);
            ctx.fillStyle =
              cIdx === 0 ? 'rgba(249, 115, 22, 0.09)' : 'rgba(234, 179, 8, 0.05)';
            ctx.beginPath();
            ctx.moveTo(pT1.x, pT1.y);
            ctx.lineTo(pT2.x, pT2.y);
            ctx.lineTo(pB2.x, pB2.y);
            ctx.lineTo(pB1.x, pB1.y);
            ctx.closePath();
            ctx.fill();
          });
        } else if (inst === 'violin') {
          // VIOLIN SHEET: Glowing Neon Symphonic F-Holes flanking the Ebony Fingerboard
          const fHoleLeft = project3D(0.58, -0.35);
          const fHoleRight = project3D(0.58, COLUMNS + 0.35);
          ctx.save();
          ctx.strokeStyle = `${activeInstMeta.accentHex}88`;
          ctx.shadowColor = activeInstMeta.accentHex;
          ctx.shadowBlur = 10;
          ctx.lineWidth = 2.5;
          [fHoleLeft, fHoleRight].forEach((pos, idx) => {
            const dir = idx === 0 ? 1 : -1;
            ctx.beginPath();
            ctx.moveTo(pos.x + 8 * dir, pos.y - 38);
            ctx.bezierCurveTo(
              pos.x - 12 * dir,
              pos.y - 16,
              pos.x + 12 * dir,
              pos.y + 16,
              pos.x - 8 * dir,
              pos.y + 38
            );
            ctx.stroke();
            // F-hole center notches
            ctx.beginPath();
            ctx.moveTo(pos.x - 6, pos.y);
            ctx.lineTo(pos.x + 6, pos.y);
            ctx.stroke();
          });
          ctx.restore();
        } else if (inst === 'trumpet') {
          // TRUMPET SHEET: Radiating Golden Horn-Bell Soundwave Arcs at the Top of the Sheet
          const pulseR = 24 + activeEnergy * 28;
          ctx.save();
          ctx.strokeStyle = `rgba(250, 204, 21, ${0.22 + activeEnergy * 0.35})`;
          ctx.lineWidth = 2;
          for (let ring = 1; ring <= 3; ring++) {
            ctx.beginPath();
            ctx.arc(
              vanishX,
              horizonY,
              pulseR * ring * 0.55,
              isDown ? 0.15 * Math.PI : 1.15 * Math.PI,
              isDown ? 0.85 * Math.PI : 1.85 * Math.PI
            );
            ctx.stroke();
          }
          ctx.restore();
        } else if (inst === 'bass' && s.bassPulse > 0.1) {
          // BASS SHEET: Sub-Bass Concentric Acoustic Ripples Propagating Down the Graphite Neck
          const rippleZ = (nowMs % 600) / 600;
          const rLeft = project3D(rippleZ, 0.2);
          const rRight = project3D(rippleZ, COLUMNS - 0.2);
          ctx.save();
          ctx.strokeStyle = `rgba(6, 182, 212, ${s.bassPulse * 0.55})`;
          ctx.lineWidth = 3 * rLeft.scale;
          ctx.beginPath();
          ctx.moveTo(rLeft.x, rLeft.y);
          ctx.lineTo(rRight.x, rRight.y);
          ctx.stroke();
          ctx.restore();
        }

        // 3B. Neon Touch / Key-Press Full-Lane Illumination across the 3D Sheet
        for (let c = 0; c < COLUMNS; c++) {
          const alpha = s.laneFlashAlpha[c];
          if (alpha > 0.02) {
            const lTop1 = project3D(0, c);
            const lTop2 = project3D(0, c + 1);
            const lBot1 = project3D(1.12, c);
            const lBot2 = project3D(1.12, c + 1);

            const laneCol = s.feverActive ? FEVER_COLOR : laneColors[c];
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            const beamGrad = ctx.createLinearGradient(0, receptorY, 0, horizonY);
            beamGrad.addColorStop(
              0,
              `${laneCol}${Math.round(alpha * 135)
                .toString(16)
                .padStart(2, '0')}`
            );
            beamGrad.addColorStop(
              0.5,
              `${laneCol}${Math.round(alpha * 55)
                .toString(16)
                .padStart(2, '0')}`
            );
            beamGrad.addColorStop(1, 'rgba(0,0,0,0)');

            ctx.fillStyle = beamGrad;
            ctx.beginPath();
            ctx.moveTo(lTop1.x, lTop1.y);
            ctx.lineTo(lTop2.x, lTop2.y);
            ctx.lineTo(lBot2.x, lBot2.y);
            ctx.lineTo(lBot1.x, lBot1.y);
            ctx.closePath();
            ctx.fill();

            // Glowing Neon Side-Rails for the active touched lane
            ctx.strokeStyle = laneCol;
            ctx.shadowColor = laneCol;
            ctx.shadowBlur = 16 * alpha;
            ctx.lineWidth = 2.6 * alpha;
            ctx.beginPath();
            ctx.moveTo(lTop1.x, lTop1.y);
            ctx.lineTo(lBot1.x, lBot1.y);
            ctx.moveTo(lTop2.x, lTop2.y);
            ctx.lineTo(lBot2.x, lBot2.y);
            ctx.stroke();
            ctx.restore();
          }
        }

        // Beat Grid / Instrument-Specific Fret Wires & Position Markers
        const firstBeatIndex = Math.floor(currentTime / beatInterval);
        const lastBeatIndex = Math.ceil((currentTime + lookAheadTime) / beatInterval);
        for (let bIdx = firstBeatIndex; bIdx <= lastBeatIndex; bIdx++) {
          const beatTime = bIdx * beatInterval;
          const timeLeft = beatTime - currentTime;
          const z = 1 - timeLeft / lookAheadTime;
          if (z >= 0 && z <= 1.1) {
            const gLeft = project3D(z, 0);
            const gRight = project3D(z, COLUMNS);
            const isMeasure = bIdx % 4 === 0;

            if (inst === 'violin') {
              // Fretless Violin: Only soft golden classical position lines on measures
              if (isMeasure) {
                ctx.strokeStyle = `rgba(244, 114, 182, ${0.24 * gLeft.scale})`;
                ctx.lineWidth = 1.4;
                ctx.beginPath();
                ctx.moveTo(gLeft.x, gLeft.y);
                ctx.lineTo(gRight.x, gRight.y);
                ctx.stroke();
              }
            } else {
              ctx.strokeStyle = isMeasure
                ? `rgba(255, 255, 255, ${0.36 * gLeft.scale})`
                : `rgba(255, 255, 255, ${0.1 * gLeft.scale})`;
              ctx.lineWidth = isMeasure ? (inst === 'guitar' || inst === 'bass' ? 2.8 : 2.2) : 1;
              ctx.beginPath();
              ctx.moveTo(gLeft.x, gLeft.y);
              ctx.lineTo(gRight.x, gRight.y);
              ctx.stroke();
            }

            // Guitar & Bass Double-Dot Mother-of-Pearl Fret Inlays on Measures
            if (isMeasure && (inst === 'guitar' || inst === 'bass')) {
              const dotL = project3D(z, 1.5);
              const dotR = project3D(z, 4.5);
              const inlayR = Math.max(2, 4.8 * dotL.scale);
              ctx.fillStyle = `rgba(255, 255, 255, ${0.28 * dotL.scale})`;
              ctx.beginPath();
              ctx.arc(dotL.x, dotL.y, inlayR, 0, Math.PI * 2);
              ctx.arc(dotR.x, dotR.y, inlayR, 0, Math.PI * 2);
              ctx.fill();
            }

            // 3D Neon Side-Rail Nodes on each measure line
            if (isMeasure) {
              const nodeR = Math.max(2, 4.5 * gLeft.scale);
              ctx.fillStyle = s.feverActive ? FEVER_COLOR : activeInstMeta.accentHex;
              ctx.beginPath();
              ctx.arc(gLeft.x, gLeft.y, nodeR, 0, Math.PI * 2);
              ctx.arc(gRight.x, gRight.y, nodeR, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        }

        // Highway Outer Neon Rails & Lane Dividers (6 Columns)
        for (let c = 0; c <= COLUMNS; c++) {
          const pTop = project3D(0, c);
          const pBot = project3D(1.13, c);
          const isEdge = c === 0 || c === COLUMNS;
          const isCenterSplit = c === 3;
          ctx.save();
          if (isEdge) {
            ctx.shadowColor = s.feverActive ? FEVER_COLOR : activeInstMeta.accentHex;
            ctx.shadowBlur = 14;
          }
          ctx.strokeStyle = isEdge
            ? s.feverActive
              ? '#FBBF24'
              : activeInstMeta.accentHex
            : isCenterSplit
            ? 'rgba(255, 255, 255, 0.28)'
            : 'rgba(255, 255, 255, 0.09)';
          ctx.lineWidth = isEdge ? 3.5 : isCenterSplit ? 2 : 1;
          ctx.beginPath();
          ctx.moveTo(pTop.x, pTop.y);
          ctx.lineTo(pBot.x, pBot.y);
          ctx.stroke();
          ctx.restore();
        }

        // 6 Center Neon Guide Strings / Brass Tubes Leading Into the 6 Round Keys
        for (let c = 0; c < COLUMNS; c++) {
          const sTop = project3D(0, c + 0.5);
          const sBot = project3D(1.0, c + 0.5);
          const vib = s.stringVibration[c];
          const flash = s.laneFlashAlpha[c];
          const isBass = inst === 'bass';
          const isGuitar = inst === 'guitar';
          const laneCol = s.feverActive ? FEVER_COLOR : laneColors[c];

          ctx.save();
          if (vib > 0.05 || flash > 0.1) {
            ctx.shadowColor = laneCol;
            ctx.shadowBlur = 12;
          }
          ctx.strokeStyle =
            vib > 0.05 || flash > 0.15
              ? laneCol
              : inst === 'trumpet'
              ? 'rgba(250, 204, 21, 0.28)'
              : 'rgba(255, 255, 255, 0.18)';

          const baseStringWidth = isBass
            ? 3.1 - c * 0.26
            : isGuitar
            ? 2.4 - c * 0.22
            : inst === 'trumpet'
            ? 2.2
            : 1.4;

          ctx.lineWidth = baseStringWidth + (vib > 0.05 || flash > 0.15 ? 1.8 : 0);
          ctx.beginPath();
          ctx.moveTo(sTop.x, sTop.y);
          if (vib > 0.05 && (isGuitar || isBass || inst === 'violin')) {
            const mid = project3D(0.65, c + 0.5);
            const shake = Math.sin(nowMs * (isBass ? 0.055 : 0.09)) * (isBass ? 14 : 9) * vib;
            ctx.quadraticCurveTo(mid.x + shake, mid.y, sBot.x, sBot.y);
          } else {
            ctx.lineTo(sBot.x, sBot.y);
          }
          ctx.stroke();
          ctx.restore();
        }

        // Glowing Receptor Horizon Laser Line Connecting the 6 Round Keys
        const rLineLeft = project3D(1, 0);
        const rLineRight = project3D(1, COLUMNS);
        ctx.save();
        ctx.shadowColor = s.feverActive ? FEVER_COLOR : activeInstMeta.accentHex;
        ctx.shadowBlur = 10;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.42)';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(rLineLeft.x, rLineLeft.y);
        ctx.lineTo(rLineRight.x, rLineRight.y);
        ctx.stroke();
        ctx.restore();

        // 3C. Draw 6 INSTRUMENT-TAILORED 3D CYLINDRICAL NEON ROUND KEY RECEPTORS (A · S · D · ← · ↓ · →)
        const laneBottomW = bottomWidth / COLUMNS;
        const receptorRadius = Math.min(34, laneBottomW * 0.39);

        for (let c = 0; c < COLUMNS; c++) {
          const pCenter = project3D(1, c + 0.5);
          const pressed = s.keysPressed[c];
          const flash = s.laneFlashAlpha[c];
          const color = s.feverActive ? FEVER_COLOR : laneColors[c];
          const r = pressed ? receptorRadius * 0.96 : receptorRadius;
          const cylinderDepth = pressed ? 2 : inst === 'trumpet' ? 11 : 7;
          const capY = pCenter.y + (pressed ? 4 : 0);
          const isCymbalLane = inst === 'drums' && (c === 2 || c === 5);

          // 1. Ambient & Touch Radial Neon Bloom on the Highway Deck underneath the 3D button
          ctx.save();
          ctx.globalCompositeOperation = 'lighter';
          const bloomRadius = r * (1.45 + flash * 0.95);
          const bloomGrad = ctx.createRadialGradient(
            pCenter.x,
            pCenter.y + 3,
            r * 0.2,
            pCenter.x,
            pCenter.y + 3,
            bloomRadius
          );
          bloomGrad.addColorStop(0, `${color}${pressed || flash > 0.2 ? 'AA' : '38'}`);
          bloomGrad.addColorStop(0.55, `${color}${pressed || flash > 0.2 ? '44' : '14'}`);
          bloomGrad.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = bloomGrad;
          ctx.beginPath();
          ctx.arc(pCenter.x, pCenter.y + 3, bloomRadius, 0, Math.PI * 2);
          ctx.fill();

          // 2. 3D Vertical Neon Light Pillar Erupting Upward When Touched / Hit!
          if (flash > 0.04) {
            const pillarHeight = 175 * flash;
            const pillarTopY = isDown ? capY - pillarHeight : capY + pillarHeight;
            const pillarGrad = ctx.createLinearGradient(0, capY, 0, pillarTopY);
            pillarGrad.addColorStop(
              0,
              `${color}${Math.round(flash * 165)
                .toString(16)
                .padStart(2, '0')}`
            );
            pillarGrad.addColorStop(
              0.4,
              `${color}${Math.round(flash * 75)
                .toString(16)
                .padStart(2, '0')}`
            );
            pillarGrad.addColorStop(1, 'rgba(0,0,0,0)');

            ctx.fillStyle = pillarGrad;
            ctx.beginPath();
            ctx.moveTo(pCenter.x - r * 0.88, capY);
            ctx.lineTo(pCenter.x + r * 0.88, capY);
            ctx.lineTo(pCenter.x + r * 0.42, pillarTopY);
            ctx.lineTo(pCenter.x - r * 0.42, pillarTopY);
            ctx.closePath();
            ctx.fill();
          }
          ctx.restore();

          // 3. 3D Button Lower Cylinder Base (Brass Valve Casing for Trumpet, Dark Chrome for others)
          ctx.save();
          ctx.fillStyle = inst === 'trumpet' ? '#422006' : '#070910';
          ctx.strokeStyle = inst === 'trumpet' ? '#FACC15' : `${color}88`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(pCenter.x, capY + cylinderDepth, r, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // 4. 3D Button Top Circular Dome Cap with Radial Neon Shading
          ctx.shadowColor = color;
          ctx.shadowBlur = pressed ? 28 : 12 + flash * 16;

          const domeGrad = ctx.createRadialGradient(
            pCenter.x - r * 0.28,
            capY - r * 0.28,
            r * 0.08,
            pCenter.x,
            capY,
            r
          );
          if (pressed || flash > 0.65) {
            domeGrad.addColorStop(0, '#FFFFFF');
            domeGrad.addColorStop(0.48, color);
            domeGrad.addColorStop(1, '#101420');
          } else if (isCymbalLane) {
            // Metallic Bronze/Gold Cymbal Receptor Sheen
            domeGrad.addColorStop(0, '#FEF08A');
            domeGrad.addColorStop(0.45, `${color}77`);
            domeGrad.addColorStop(1, '#1C1917');
          } else if (inst === 'trumpet') {
            // Mother-of-Pearl Brass Valve Cap Sheen
            domeGrad.addColorStop(0, '#FEF9C3');
            domeGrad.addColorStop(0.55, `${color}66`);
            domeGrad.addColorStop(1, '#1C1917');
          } else {
            domeGrad.addColorStop(0, `${color}48`);
            domeGrad.addColorStop(0.65, '#121726');
            domeGrad.addColorStop(1, '#090C14');
          }

          ctx.fillStyle = domeGrad;
          ctx.strokeStyle = pressed ? '#FFFFFF' : color;
          ctx.lineWidth = pressed ? 3.5 : 2.6;
          ctx.beginPath();
          ctx.arc(pCenter.x, capY, r, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // 5. Inner Concentric Neon / Cymbal Lathe Rings
          ctx.strokeStyle = pressed ? '#FFFFFF' : `${color}99`;
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.arc(pCenter.x, capY, r * 0.66, 0, Math.PI * 2);
          ctx.stroke();

          if (isCymbalLane) {
            // Extra concentric cymbal lathe groove ring
            ctx.beginPath();
            ctx.arc(pCenter.x, capY, r * 0.42, 0, Math.PI * 2);
            ctx.stroke();
          }

          // 6. Top 3D Glass Specular Reflection Arc
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(pCenter.x, capY, r * 0.82, Math.PI * 1.15, Math.PI * 1.85);
          ctx.stroke();

          // 7. Crisp Key Label (A, S, D, ←, ↓, →) Inside Each 3D Round Key
          ctx.shadowBlur = pressed ? 8 : 0;
          ctx.fillStyle = pressed ? '#08090C' : '#FFFFFF';
          ctx.font = '800 18px "Outfit", sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(SIX_KEY_LABELS[c], pCenter.x, capY + 1);
          ctx.restore();

          // Animated Drumstick striking the round drum pad when Drums is active
          if (inst === 'drums') {
            const strike = s.drumstickStrike[c];
            if (strike > 0.05) {
              ctx.save();
              ctx.strokeStyle = '#FDE68A';
              ctx.lineWidth = 3.5;
              ctx.lineCap = 'round';
              const stickTopX = pCenter.x + (c < 3 ? -24 : 24);
              const stickTopY = capY + 38 - strike * 14;
              const tipY = capY + (1 - strike) * 6;
              ctx.beginPath();
              ctx.moveTo(stickTopX, stickTopY);
              ctx.lineTo(pCenter.x, tipY);
              ctx.stroke();
              ctx.restore();
            }
          }

          // Sub-label under each of the 6 round keys
          ctx.fillStyle = pressed ? color : 'rgba(228, 228, 231, 0.88)';
          ctx.font = '700 10px "JetBrains Mono", monospace';
          ctx.textAlign = 'center';
          const hintOffsetY = isDown
            ? pCenter.y + receptorRadius + 19
            : pCenter.y - receptorRadius - 14;
          ctx.fillText(activeInstMeta.laneLabels[c].split(' ')[0], pCenter.x, hintOffsetY);
        }

        // Animated Violin Bow Sweeping Across Receptor Line when Violin is active
        if (inst === 'violin') {
          const bowLeft = project3D(1, 0);
          const bowRight = project3D(1, COLUMNS);
          const bowSway = Math.sin(currentTime * 6) * 28 + (s.bowPosition - 0.5) * 65;
          ctx.save();
          ctx.shadowColor = '#F472B6';
          ctx.shadowBlur = 12;
          ctx.strokeStyle = 'rgba(253, 230, 138, 0.82)';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(bowLeft.x - 28 + bowSway, bowLeft.y - 8);
          ctx.lineTo(bowRight.x + 28 + bowSway, bowRight.y + 6);
          ctx.stroke();
          ctx.restore();
        }

        // 3D. Draw Instrument-Dedicated Sustain Tails, Arpeggio Trails & 3D Spherical Round Notes
        for (let i = s.notes.length - 1; i >= 0; i--) {
          const note = s.notes[i];
          if (note.missed) continue;

          const col = Math.abs(note.column) % COLUMNS;
          const timeLeft = note.time - currentTime;
          const tailEndTime = note.time + (note.duration || 0);
          const tailTimeLeft = tailEndTime - currentTime;

          if (timeLeft > lookAheadTime || tailTimeLeft < -HIT_WINDOW) continue;

          const color = s.feverActive ? FEVER_COLOR : laneColors[col];

          // 1. Render 3D Neon Sustain Beam (Vibrato wave on Guitar/Violin, Straight Laser on Synth/Trumpet)
          if (note.duration && note.duration > 0.1) {
            const zHead = Math.min(1, Math.max(0, 1 - timeLeft / lookAheadTime));
            const zTail = Math.min(1, Math.max(0, 1 - tailTimeLeft / lookAheadTime));
            if (zHead > zTail) {
              const pHeadL = project3D(zHead, col + 0.32);
              const pHeadR = project3D(zHead, col + 0.68);
              const pTailL = project3D(zTail, col + 0.32);
              const pTailR = project3D(zTail, col + 0.68);
              const pHeadC = project3D(zHead, col + 0.5);
              const pTailC = project3D(zTail, col + 0.5);

              ctx.save();
              ctx.shadowColor = color;
              ctx.shadowBlur = 14;
              ctx.fillStyle = `${color}BB`;
              ctx.beginPath();
              ctx.moveTo(pTailL.x, pTailL.y);
              ctx.lineTo(pTailR.x, pTailR.y);
              ctx.lineTo(pHeadR.x, pHeadR.y);
              ctx.lineTo(pHeadL.x, pHeadL.y);
              ctx.closePath();
              ctx.fill();

              // Bright Inner Laser Core along the sustain tail
              ctx.strokeStyle = '#FFFFFF';
              ctx.lineWidth = Math.max(2, 4.5 * pHeadC.scale);
              ctx.beginPath();
              ctx.moveTo(pTailC.x, pTailC.y);
              if (inst === 'guitar' || inst === 'violin') {
                const midZ = (zHead + zTail) * 0.5;
                const midC = project3D(midZ, col + 0.5);
                const vibratoOffset = Math.sin(nowMs * 0.045 + i) * 7 * midC.scale;
                ctx.quadraticCurveTo(midC.x + vibratoOffset, midC.y, pHeadC.x, pHeadC.y);
              } else {
                ctx.lineTo(pHeadC.x, pHeadC.y);
              }
              ctx.stroke();
              ctx.restore();
            }
          }

          if (note.hit) continue;

          const z = 1 - timeLeft / lookAheadTime;
          if (z < 0 || z > 1.12) continue;

          const nCenter = project3D(z, col + 0.5);
          const noteRadius = Math.max(7.5, receptorRadius * 0.92 * nCenter.scale);
          const noteDepth3D = Math.max(2, 6 * nCenter.scale);
          const isCymbalNote = inst === 'drums' && (col === 2 || col === 5);

          // SYNTH & VIOLIN: Glowing Arpeggio / Legato Laser Trail connecting to the next sequential note
          if ((inst === 'synth' || inst === 'violin') && i + 1 < s.notes.length) {
            const nextNote = s.notes[i + 1];
            const nextDt = nextNote.time - note.time;
            if (!nextNote.hit && !nextNote.missed && nextDt > 0.04 && nextDt <= 0.45) {
              const nextZ = 1 - (nextNote.time - currentTime) / lookAheadTime;
              if (nextZ >= 0 && nextZ <= 1.1) {
                const nextCenter = project3D(nextZ, (Math.abs(nextNote.column) % COLUMNS) + 0.5);
                ctx.save();
                ctx.strokeStyle = `${color}66`;
                ctx.lineWidth = Math.max(1.2, 2.5 * nCenter.scale);
                ctx.setLineDash([4, 4]);
                ctx.beginPath();
                ctx.moveTo(nCenter.x, nCenter.y);
                ctx.lineTo(nextCenter.x, nextCenter.y);
                ctx.stroke();
                ctx.restore();
              }
            }
          }

          // Power Chord / Double-Stab Neon Laser Tie-Line for simultaneous round notes
          const chordTwin = s.notes.find(
            (other) =>
              other !== note &&
              !other.hit &&
              !other.missed &&
              Math.abs(other.time - note.time) < 0.01 &&
              (Math.abs(other.column) % COLUMNS) > col
          );
          if (chordTwin) {
            const twinCol = Math.abs(chordTwin.column) % COLUMNS;
            const twinCenter = project3D(z, twinCol + 0.5);
            ctx.save();
            ctx.shadowColor = color;
            ctx.shadowBlur = 14 * nCenter.scale;
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = Math.max(2.2, 4.8 * nCenter.scale);
            ctx.beginPath();
            ctx.moveTo(nCenter.x, nCenter.y);
            if (inst === 'guitar') {
              // Electric Lightning Arc on Guitar Power Chords
              const midX = (nCenter.x + twinCenter.x) * 0.5;
              const midY = (nCenter.y + twinCenter.y) * 0.5 - 6 * nCenter.scale;
              ctx.quadraticCurveTo(midX, midY, twinCenter.x, twinCenter.y);
            } else {
              ctx.lineTo(twinCenter.x, twinCenter.y);
            }
            ctx.stroke();
            ctx.restore();
          }

          // DRUMS SHEET: Prominent 3D Neon Kick Pedal Bar across the highway on Lane 0 (A)
          if (inst === 'drums' && col === 0) {
            const kLeft = project3D(z, 0.03);
            const kRight = project3D(z, COLUMNS - 0.03);
            const barH = Math.max(4, 9 * nCenter.scale);
            ctx.save();
            ctx.shadowColor = '#F97316';
            ctx.shadowBlur = 12 * nCenter.scale;
            ctx.fillStyle = 'rgba(249, 115, 22, 0.45)';
            ctx.strokeStyle = 'rgba(255, 237, 213, 0.85)';
            ctx.lineWidth = Math.max(1, 1.8 * nCenter.scale);
            ctx.fillRect(kLeft.x, kLeft.y - barH / 2, kRight.x - kLeft.x, barH);
            ctx.strokeRect(kLeft.x, kLeft.y - barH / 2, kRight.x - kLeft.x, barH);
            ctx.restore();
          }

          // Proximity Neon Charge Ring when note approaches receptor hit-zone (z > 0.82)
          if (z > 0.82 && z <= 1.06) {
            const chargeAlpha = Math.min(1, (z - 0.82) / 0.18);
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            ctx.strokeStyle = color;
            ctx.globalAlpha = chargeAlpha * 0.75;
            ctx.lineWidth = 2.2 * nCenter.scale;
            ctx.beginPath();
            ctx.arc(nCenter.x, nCenter.y, noteRadius * (1.22 + (1 - chargeAlpha) * 0.25), 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
          }

          // 3D Lower Cylinder Rim Under Each Falling Round Note (Gives 3D Puck Height)
          ctx.fillStyle = '#070910';
          ctx.strokeStyle = `${color}AA`;
          ctx.lineWidth = Math.max(1, 1.8 * nCenter.scale);
          ctx.beginPath();
          ctx.arc(nCenter.x, nCenter.y + noteDepth3D, noteRadius, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // 3D SPHERICAL / DOMED NEON ROUND NOTE ORB (1:1 Circle via ctx.arc)
          ctx.save();
          ctx.shadowColor = color;
          ctx.shadowBlur = 22 * nCenter.scale;

          const sphereGrad = ctx.createRadialGradient(
            nCenter.x - noteRadius * 0.32,
            nCenter.y - noteRadius * 0.32,
            noteRadius * 0.08,
            nCenter.x,
            nCenter.y,
            noteRadius
          );
          sphereGrad.addColorStop(0, '#FFFFFF');
          sphereGrad.addColorStop(0.38, isCymbalNote ? '#FEF08A' : color);
          sphereGrad.addColorStop(0.85, color);
          sphereGrad.addColorStop(1, '#0B0E17');

          ctx.fillStyle = sphereGrad;
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = Math.max(1.5, 2.6 * nCenter.scale);
          ctx.beginPath();
          ctx.arc(nCenter.x, nCenter.y, noteRadius, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Instrument-Specific Inner Ring Detail on the 3D Round Note
          if (isCymbalNote || inst === 'bass' || inst === 'trumpet') {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
            ctx.lineWidth = Math.max(1, 1.5 * nCenter.scale);
            ctx.beginPath();
            ctx.arc(nCenter.x, nCenter.y, noteRadius * 0.66, 0, Math.PI * 2);
            ctx.stroke();
          }
          ctx.restore();

          // Glossy White Inner Neon Core + Top 3D Specular Highlight
          ctx.fillStyle = 'rgba(255, 255, 255, 0.96)';
          ctx.beginPath();
          ctx.arc(nCenter.x, nCenter.y, noteRadius * 0.36, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 4. Render Shockwaves & Particles
      for (let i = s.shockwaves.length - 1; i >= 0; i--) {
        const sw = s.shockwaves[i];
        sw.radius += (sw.maxRadius - sw.radius) * 0.22;
        sw.alpha -= 0.045;
        if (sw.alpha <= 0) {
          s.shockwaves.splice(i, 1);
          continue;
        }
        ctx.save();
        ctx.strokeStyle = sw.color;
        ctx.globalAlpha = Math.max(0, sw.alpha);
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      for (let i = s.particles.length - 1; i >= 0; i--) {
        const p = s.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.12;
        p.alpha -= p.decay;
        if (p.alpha <= 0) {
          s.particles.splice(i, 1);
          continue;
        }
        ctx.save();
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 5. Center Combo & Precision Judgment Callout
      const hitElapsed = nowMs - s.lastHitTime;
      if (hitElapsed < 650 && s.lastHitText) {
        const progress = hitElapsed / 650;
        const scale =
          progress < 0.15 ? 0.85 + (progress / 0.15) * 0.28 : 1.13 - progress * 0.15;
        const alpha = progress > 0.7 ? 1 - (progress - 0.7) / 0.3 : 1;

        ctx.save();
        ctx.globalAlpha = Math.max(0, alpha);
        ctx.translate(W / 2, H * 0.42);
        ctx.scale(scale, scale);

        ctx.font = '800 42px "Outfit", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = s.lastHitColor;
        ctx.shadowBlur = 18;
        ctx.fillStyle = s.lastHitColor;
        ctx.fillText(s.lastHitText, 0, 0);

        ctx.shadowBlur = 0;
        ctx.font = '600 12px "JetBrains Mono", monospace';
        ctx.fillStyle = '#E4E4E7';
        ctx.fillText(s.lastHitSubtext, 0, 28);

        if (s.combo >= 2) {
          ctx.font = '800 26px "JetBrains Mono", monospace';
          ctx.fillStyle = s.feverActive ? '#FBBF24' : '#FFFFFF';
          ctx.fillText(`${s.combo} STREAK`, 0, -40);
        }
        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      clearTimeout(c1);
      clearTimeout(c2);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      cancelAnimationFrame(animationFrameId);
    };
  }, [activateFever, bpm, handleHit, isPlaying, syncHudStats, togglePause]);

  const handleAudioEnded = () => {
    const state = gameState.current;
    onComplete({
      score: state.score,
      combo: state.combo,
      maxCombo: state.maxCombo,
      perfects: state.perfects,
      greats: state.greats,
      goods: state.goods,
      misses: state.misses,
      feverActivations: state.feverActivations,
      hitOffsets: state.hitOffsets,
      trackTitle,
      trackArtist,
      difficulty,
      bpm,
      instrument: settings.instrument,
    });
  };

  const handleLanePadPointerDown = (col: number) => {
    const audio = audioRef.current;
    gameState.current.keysPressed[col] = true;
    gameState.current.laneFlashAlpha[col] = 1.0;
    setPressedLanesUI([...gameState.current.keysPressed]);
    if (audio && !audio.paused) {
      handleHit(col, audio.currentTime);
    }
    setTimeout(() => {
      gameState.current.keysPressed[col] = false;
      setPressedLanesUI([...gameState.current.keysPressed]);
    }, 135);
  };

  const handleSeekStageTimeline = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !audio.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const targetTime = ratio * audio.duration;
    audio.currentTime = targetTime;

    for (const n of gameState.current.notes) {
      if (n.time < targetTime - 0.05) {
        n.hit = true;
        n.missed = false;
      } else {
        n.hit = false;
        n.missed = false;
      }
    }
    syncHudStats(targetTime, audio.duration);
  };

  const handleInstrumentChangeOnStage = (instKey: InstrumentType) => {
    soundFX.playWarmupNote(0, instKey);
    onUpdateSettings({ ...settings, instrument: instKey });
    if (onSwitchInstrument) {
      const rebuilt = onSwitchInstrument(instKey);
      if (rebuilt && rebuilt.length > 0) {
        const curTime = audioRef.current?.currentTime || 0;
        const pastNotes = gameState.current.notes.filter((n) => n.time <= curTime + 0.12);
        const futureNotes = rebuilt
          .filter((n) => n.time > curTime + 0.12)
          .map((n) => ({
            ...n,
            column: Math.abs(n.column) % COLUMNS,
            hit: false,
            missed: false,
          }));
        gameState.current.notes = [...pastNotes, ...futureNotes];
      }
    }
  };

  const formatClock = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col justify-between bg-[#08090C] min-h-screen text-[#F3F4F6] w-full touch-none select-none overflow-hidden">
      <audio ref={audioRef} src={audioUrl} onEnded={handleAudioEnded} />

      {/* Top Concert Stage Telemetry HUD with Live Instrument Switcher & Auto-Play */}
      <header className="w-full bg-[#11131A]/90 backdrop-blur-md border-b border-white/[0.08] px-4 lg:px-8 py-2.5 z-20">
        <div className="max-w-[1280px] mx-auto flex flex-wrap items-center justify-between gap-4">
          {/* Left: Track Info & Instrument Role */}
          <div className="flex items-center gap-3.5">
            <button
              type="button"
              onClick={() => {
                soundFX.playUiClick(600);
                onExit();
              }}
              className="p-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-zinc-300 hover:text-white transition-colors cursor-pointer"
              title="Quay lại Phòng Thu BandMaster"
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <div className="flex items-center gap-2 text-xs text-zinc-400 font-mono tabular-nums">
                <span className={`${instMeta.badgeClass} font-bold`}>
                  {instMeta.name} ({instMeta.vietnameseName})
                </span>
                <span aria-hidden="true">·</span>
                <span>{hudStats.sectionName}</span>
                <span aria-hidden="true">·</span>
                <span>{bpm} BPM</span>
              </div>
              <h1 className="font-display font-bold text-sm sm:text-base text-white truncate max-w-[220px] sm:max-w-md">
                {trackTitle}
              </h1>
            </div>
          </div>

          {/* Center: Score, Streak & Star Power Fever Bar */}
          <div className="flex items-center gap-5 sm:gap-7 font-mono tabular-nums">
            <div>
              <div className="text-[10px] text-zinc-500 uppercase">Score</div>
              <div className="text-lg sm:text-xl font-bold text-white">
                {hudStats.score.toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-zinc-500 uppercase">Streak</div>
              <div className="text-lg sm:text-xl font-bold text-amber-400">
                {hudStats.combo}x{' '}
                <span
                  className={`text-xs ${
                    hudStats.feverActive ? 'text-amber-300 font-extrabold' : 'text-zinc-400'
                  }`}
                >
                  ({hudStats.multiplier}x)
                </span>
              </div>
            </div>

            <div className="w-28 sm:w-36">
              <div className="flex justify-between text-[10px] mb-1">
                <span
                  className={
                    hudStats.feverActive
                      ? 'text-amber-400 font-bold'
                      : hudStats.fever >= 100
                      ? 'text-cyan-400 font-bold'
                      : 'text-zinc-400'
                  }
                >
                  {hudStats.feverActive
                    ? 'FEVER 2X!'
                    : hudStats.fever >= 100
                    ? 'READY [SPACE]'
                    : 'STAR POWER'}
                </span>
                <span className="text-zinc-300">{hudStats.fever}%</span>
              </div>
              <button
                type="button"
                onClick={activateFever}
                className="h-2.5 w-full bg-zinc-900 rounded-md overflow-hidden border border-white/15 block cursor-pointer"
                title="Click or Press SPACEBAR when 100% to trigger 2x Band Fever"
              >
                <div
                  className={`h-full transition-all duration-150 ${
                    hudStats.feverActive || hudStats.fever >= 100
                      ? 'bg-amber-400'
                      : 'bg-cyan-400'
                  }`}
                  style={{ width: `${hudStats.fever}%` }}
                />
              </button>
            </div>
          </div>

          {/* Right: Live On-Stage Instrument Switcher (Max 3 Suitable Instruments for Genre), Auto-Play & Controls */}
          <div className="flex items-center gap-2">
            <div className="hidden xl:flex items-center gap-1 p-1 bg-[#08090C] border border-white/[0.08] rounded-xl">
              <span className="text-[10px] font-mono text-zinc-500 px-2">
                {genreName ? `${genreName}:` : '3 Nhạc cụ:'}
              </span>
              {stageInstruments.map((instKey) => {
                const active = settings.instrument === instKey;
                const m = INSTRUMENT_META[instKey];
                return (
                  <button
                    key={instKey}
                    type="button"
                    onClick={() => handleInstrumentChangeOnStage(instKey)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      active
                        ? 'bg-amber-400 text-black font-bold'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    {m.vietnameseName}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => {
                soundFX.playUiClick(760);
                setAutoPlay((prev) => !prev);
              }}
              className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                autoPlay
                  ? 'bg-emerald-400 text-black border-white'
                  : 'bg-white/[0.05] hover:bg-white/[0.1] border-white/[0.08] text-zinc-300'
              }`}
              title="Bật/Tắt chế độ Tự Động Đánh Mẫu (Auto-Play)"
            >
              {autoPlay ? 'AUTO: ON' : 'AUTO PLAY'}
            </button>

            <button
              type="button"
              onClick={() =>
                onUpdateSettings({
                  ...settings,
                  hitSoundEnabled: !settings.hitSoundEnabled,
                })
              }
              className="p-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-zinc-300 transition-colors cursor-pointer"
              title="Toggle Instrument Synth"
            >
              {settings.hitSoundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>
            <button
              type="button"
              onClick={togglePause}
              className="p-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-zinc-300 transition-colors cursor-pointer"
              title="Pause (ESC or P)"
            >
              {isPaused ? <Play size={16} className="text-amber-400" /> : <Pause size={16} />}
            </button>
          </div>
        </div>

        {/* Interactive Song Timeline & Section Scrubber Bar */}
        <div className="max-w-[1280px] mx-auto mt-2 flex items-center gap-3">
          <span className="font-mono text-[10px] text-zinc-400 tabular-nums shrink-0">
            {formatClock(hudStats.currentTimeSec)}
          </span>
          <div
            onClick={handleSeekStageTimeline}
            title="Click to jump/scrub to any part of the song"
            className="relative flex-1 h-2 bg-white/[0.07] rounded-md overflow-hidden cursor-pointer group"
          >
            <div
              className="h-full bg-gradient-to-r from-orange-400 via-amber-400 to-cyan-400 transition-all duration-100"
              style={{ width: `${hudStats.progress}%` }}
            />
          </div>
          <span className="font-mono text-[10px] text-zinc-400 tabular-nums shrink-0">
            {formatClock(hudStats.durationSec)}
          </span>
        </div>
      </header>

      {/* Main Concert & 6-Key Round Sheet Canvas */}
      <div className="relative flex-1 flex items-center justify-center w-full max-w-[1100px] mx-auto px-2 py-2">
        <canvas
          ref={canvasRef}
          width={960}
          height={720}
          className="w-full h-auto max-h-[calc(100dvh-165px)] rounded-2xl border border-white/[0.08] bg-[#08090C]"
        />

        {countdown > 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/75 backdrop-blur-md rounded-2xl z-10 p-6 text-center">
            <span className="text-xs font-mono text-amber-400 tracking-widest mb-1">
              {instMeta.cockpitTitle} · {bpm} BPM · {gameState.current.notes.length} NOTES
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-white mb-2 max-w-lg truncate">
              {trackTitle}
            </h2>
            <div className="font-display text-6xl font-extrabold text-amber-400 my-2">
              STAGE IN {countdown}
            </div>
            <div className="grid grid-cols-6 gap-2.5 mt-4 max-w-2xl w-full">
              {instMeta.laneLabels.map((lbl, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-2xl bg-[#11131A] border border-white/15 flex flex-col items-center"
                >
                  <div
                    className="w-10 h-10 rounded-full border-2 flex items-center justify-center font-display font-extrabold text-sm text-white mb-1"
                    style={{
                      borderColor: instMeta.laneColors[idx],
                      backgroundColor: `${instMeta.laneColors[idx]}25`,
                    }}
                  >
                    {SIX_KEY_LABELS[idx]}
                  </div>
                  <span className="font-display text-[11px] font-bold text-white truncate max-w-full">
                    {lbl.split(' ')[0]}
                  </span>
                  <span className="font-mono text-[9px] text-zinc-400 mt-0.5">
                    Phím {SIX_KEY_LABELS[idx]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {isPaused && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md rounded-2xl z-20 p-6">
            <div className="bg-[#11131A] border border-white/[0.1] rounded-2xl p-8 max-w-md w-full text-center">
              <div className="text-xs font-mono text-amber-400 mb-1">
                CONCERT PAUSED · {instMeta.name.toUpperCase()} ({instMeta.vietnameseName.toUpperCase()})
              </div>
              <h2 className="font-display text-2xl font-bold text-white mb-4 truncate">
                {trackTitle}
              </h2>

              <div className="mb-6 text-left">
                <div className="text-[10px] font-mono text-zinc-400 mb-2 text-center">
                  3 NHẠC CỤ PHÙ HỢP THỂ LOẠI ({genreName ? genreName.toUpperCase() : '6 PHÍM TRÒN'})
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {stageInstruments.map((instKey) => {
                    const active = settings.instrument === instKey;
                    const m = INSTRUMENT_META[instKey];
                    return (
                      <button
                        key={instKey}
                        type="button"
                        onClick={() => handleInstrumentChangeOnStage(instKey)}
                        className={`py-2 px-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                          active
                            ? 'bg-amber-400 text-black font-bold'
                            : 'bg-[#08090C] border border-white/10 text-zinc-300 hover:text-white'
                        }`}
                      >
                        {m.vietnameseName}
                      </button>
                    );
                  })}
                </div>
              </div>


              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={togglePause}
                  className="w-full py-3 bg-amber-400 hover:bg-amber-300 text-black font-display font-bold text-sm rounded-xl transition-colors cursor-pointer"
                >
                  Tiếp Tục Biểu Diễn (Resume)
                </button>
                <button
                  type="button"
                  onClick={handleRestartTrack}
                  className="w-full py-3 bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] text-white font-semibold text-sm rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <RotateCcw size={15} />
                  <span>Chơi Lại Từ Đầu (Restart)</span>
                </button>
                <button
                  type="button"
                  onClick={onExit}
                  className="w-full py-3 bg-transparent hover:bg-white/[0.04] text-zinc-400 hover:text-white font-medium text-sm rounded-xl transition-colors cursor-pointer"
                >
                  Quay Về Phòng Thu BandMaster
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Interactive 3D Neon Touch / Click Deck (A · S · D · ← · ↓ · →) */}
      <div className="w-full max-w-[880px] mx-auto px-4 pb-3 grid grid-cols-6 gap-2.5 z-20">
        {instMeta.laneLabels.map((label, idx) => {
          const colHex = instMeta.laneColors[idx];
          const keyChar = SIX_KEY_LABELS[idx];
          const isPressed = pressedLanesUI[idx];
          return (
            <button
              key={idx}
              type="button"
              onPointerDown={() => handleLanePadPointerDown(idx)}
              className={`py-2 px-2 rounded-2xl bg-[#11131A] border transition-all duration-75 flex flex-col items-center justify-center gap-1 cursor-pointer ${
                isPressed ? 'translate-y-1 scale-95' : '-translate-y-0.5 hover:-translate-y-1'
              }`}
              style={{
                borderColor: isPressed ? '#FFFFFF' : `${colHex}88`,
                boxShadow: isPressed
                  ? `0 0 26px ${colHex}, inset 0 0 16px ${colHex}66`
                  : `0 5px 0 ${colHex}44, 0 6px 14px rgba(0,0,0,0.65)`,
              }}
            >
              <div
                className="w-9 h-9 sm:w-10 sm:h-10 aspect-square rounded-full border-2 flex items-center justify-center font-display text-xs sm:text-sm font-extrabold transition-all"
                style={{
                  borderColor: isPressed ? '#FFFFFF' : colHex,
                  color: isPressed ? '#08090C' : '#FFFFFF',
                  background: isPressed
                    ? `radial-gradient(circle at 35% 30%, #FFFFFF 0%, ${colHex} 65%, #08090C 100%)`
                    : `radial-gradient(circle at 35% 30%, ${colHex}44 0%, #121624 72%, #08090C 100%)`,
                  boxShadow: isPressed
                    ? `0 0 20px ${colHex}, 0 0 36px ${colHex}`
                    : `0 0 10px ${colHex}44, inset 0 2px 3px rgba(255,255,255,0.28)`,
                }}
              >
                {keyChar}
              </div>
              <span
                className="font-display text-[10px] sm:text-xs font-bold truncate max-w-full"
                style={{ color: isPressed ? colHex : '#FFFFFF' }}
              >
                {label.split(' ')[0]}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
