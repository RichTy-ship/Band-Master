/**
 * Main Application Component - BandMaster Studio
 *
 * Orchestrates the Band Studio Deck, Universal Studio Audio/Video/MIDI/Chart Analyzer
 * with Persistent Session Uploaded Vault, 6-Instrument 3D Concert Stage with Live
 * On-Stage Re-Charting, and Post-Concert Telemetry Results.
 */

import React, { useState, useCallback } from 'react';
import { Menu } from './components/Menu';
import { Game } from './components/Game';
import { Result } from './components/Result';
import { generateSong } from './services/audioService';
import {
  generateBeatmap,
  generatePrompt,
  getStructure,
  adaptLibraryBeatmapForInstrument,
  FULL_SONG_STRUCTURE,
} from './game/beatmap';
import {
  AnalyzedTrackData,
  buildBeatmapFromAnalysis,
} from './services/audioAnalyzer';
import {
  Note,
  GameResult,
  GenerationOptions,
  GameplaySettings,
  SongSection,
  Difficulty,
  InstrumentType,
} from './types';
import {
  LibrarySong,
  SMART_GENRE_CATALOG,
  difficultyLabelToCode,
} from './game/songs';
import { INSTRUMENT_META } from './services/soundEffects';

type AppState = 'menu' | 'loading' | 'playing' | 'result';

interface ActiveTrackMeta {
  title: string;
  artist: string;
  bpm: number;
  difficulty: Difficulty | string;
  sections: SongSection[];
  waveformPeaks?: number[];
  analyzedData?: AnalyzedTrackData;
  densityMultiplier?: number;
  genreName?: string;
  allowedInstruments: InstrumentType[];
}

export default function App() {
  const [appState, setAppState] = useState<AppState>('menu');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [beatmap, setBeatmap] = useState<Note[]>([]);
  const [gameResult, setGameResult] = useState<GameResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Persistent session vault of user-uploaded tracks
  const [uploadedTracks, setUploadedTracks] = useState<AnalyzedTrackData[]>([]);
  const [activeAnalysis, setActiveAnalysis] = useState<AnalyzedTrackData | null>(null);

  const [settings, setSettings] = useState<GameplaySettings>({
    instrument: 'drums',
    highwayMode: '3d',
    scrollDirection: 'down',
    speedMultiplier: 1.0,
    hitSoundEnabled: true,
    autoFever: true,
  });

  const [trackMeta, setTrackMeta] = useState<ActiveTrackMeta>({
    title: 'BandMaster Concert Stage',
    artist: 'BandMaster Studio',
    bpm: 128,
    difficulty: 'normal',
    sections: FULL_SONG_STRUCTURE,
    genreName: 'Rock & Arena Metal',
    allowedInstruments: ['guitar', 'drums', 'bass'],
  });

  const handleTrackAnalyzed = useCallback((track: AnalyzedTrackData) => {
    setActiveAnalysis(track);
    // Automatically align selected instrument with the song's max-3 suitable instruments
    setSettings((prev) => {
      if (track.allowedInstruments.includes(prev.instrument)) return prev;
      return { ...prev, instrument: track.allowedInstruments[0] || 'drums' };
    });
    setUploadedTracks((prev) => {
      const exists = prev.some(
        (item) => item.fileName === track.fileName && item.duration === track.duration
      );
      if (exists) return prev;
      return [track, ...prev];
    });
  }, []);

  /**
   * Launches a custom Studio Multi-Track Jam Session.
   */
  const handleStartJam = async (options: GenerationOptions) => {
    setErrorMsg(null);
    setAppState('loading');

    const genreDef = options.genreId ? SMART_GENRE_CATALOG[options.genreId] : undefined;
    const allowedInsts = (
      options.allowedInstruments ||
      genreDef?.suitableInstruments || ['guitar', 'drums', 'bass']
    ).slice(0, 3);

    const activeInst = allowedInsts.includes(options.instrument)
      ? options.instrument
      : allowedInsts[0];

    if (activeInst !== settings.instrument) {
      setSettings((prev) => ({ ...prev, instrument: activeInst }));
    }

    const finalOptions: GenerationOptions = {
      ...options,
      instrument: activeInst,
    };

    try {
      const structure = getStructure(finalOptions);
      const prompt = generatePrompt(structure, finalOptions);
      const { url, blob } = await generateSong(
        prompt,
        finalOptions.mode,
        () => {},
        finalOptions
      );

      const map = generateBeatmap(structure, finalOptions);
      const bpm =
        finalOptions.bpm ||
        (finalOptions.difficulty === 'easy'
          ? 90
          : finalOptions.difficulty === 'normal'
          ? 128
          : 150);

      const instName = INSTRUMENT_META[activeInst].name;

      setTrackMeta({
        title: finalOptions.theme || `${instName} Studio Jam`,
        artist: genreDef ? `${genreDef.vietnameseName} · BandMaster` : 'BandMaster Multi-Track Engine',
        bpm,
        difficulty: finalOptions.difficulty,
        sections: structure,
        genreName: genreDef?.vietnameseName || 'Band Jam',
        allowedInstruments: allowedInsts,
      });

      setAudioUrl(url);
      setAudioBlob(blob);
      setBeatmap(map);
      setAppState('playing');
    } catch (error) {
      const err = error as Error;
      console.warn('Studio jam notice:', err.message);
      setErrorMsg(err.message);
      setAppState('menu');
    }
  };

  /**
   * Selects a song from the Smart Music Library (either Mastered Audio or Studio Multi-Track)
   * and enforces its max-3 suitable instruments.
   */
  const handleSelectLibrarySong = async (
    song: LibrarySong,
    preferredInstrument?: InstrumentType
  ) => {
    const allowedInsts = song.allowedInstruments.slice(0, 3);
    const chosenInst =
      preferredInstrument && allowedInsts.includes(preferredInstrument)
        ? preferredInstrument
        : allowedInsts.includes(settings.instrument)
        ? settings.instrument
        : allowedInsts[0];

    if (chosenInst !== settings.instrument) {
      setSettings((prev) => ({ ...prev, instrument: chosenInst }));
    }

    const genreDef = SMART_GENRE_CATALOG[song.genreId];

    // If this library song is a synthesized multi-track session, route through handleStartJam
    if (song.sourceType === 'synth_jam' || !song.audioUrl || !song.beatmapUrl) {
      await handleStartJam({
        mode: 'full',
        style: song.styleCode,
        theme: song.title,
        difficulty: difficultyLabelToCode(song.difficulty),
        instrument: chosenInst,
        bpm: song.bpm,
        genreId: song.genreId,
        allowedInstruments: allowedInsts,
      });
      return;
    }

    setAppState('loading');
    setErrorMsg(null);

    try {
      const response = await fetch(song.beatmapUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch beatmap: ${response.statusText}`);
      }
      const beatmapData: Note[] = await response.json();
      const adaptedBeatmap = adaptLibraryBeatmapForInstrument(
        beatmapData,
        chosenInst,
        song.difficulty
      );

      setTrackMeta({
        title: song.title,
        artist: song.artist,
        bpm: song.bpm,
        difficulty: song.difficulty,
        sections: FULL_SONG_STRUCTURE,
        genreName: genreDef?.vietnameseName || song.genreId,
        allowedInstruments: allowedInsts,
      });

      setAudioUrl(song.audioUrl);
      setAudioBlob(null);
      setBeatmap(adaptedBeatmap);
      setAppState('playing');
    } catch (error) {
      setErrorMsg('Failed to load song: ' + (error as Error).message);
      setAppState('menu');
    }
  };

  /**
   * Launches gameplay directly from a user-uploaded & DSP-analyzed audio/video/MIDI/chart track.
   */
  const handlePlayAnalyzedTrack = (payload: {
    audioUrl: string;
    audioBlob: Blob;
    beatmap: Note[];
    title: string;
    artist: string;
    bpm: number;
    difficulty: Difficulty;
    sections: SongSection[];
    analyzedData?: AnalyzedTrackData;
    densityMultiplier?: number;
  }) => {
    setErrorMsg(null);
    const allowedInsts = (
      payload.analyzedData?.allowedInstruments || ['guitar', 'drums', 'bass']
    ).slice(0, 3);

    const activeInst = allowedInsts.includes(settings.instrument)
      ? settings.instrument
      : allowedInsts[0];

    let finalBeatmap = payload.beatmap;
    if (activeInst !== settings.instrument) {
      setSettings((prev) => ({ ...prev, instrument: activeInst }));
      if (payload.analyzedData) {
        finalBeatmap = buildBeatmapFromAnalysis(
          payload.analyzedData,
          activeInst,
          payload.difficulty,
          payload.densityMultiplier || 1.0
        );
      }
    }

    setTrackMeta({
      title: payload.title,
      artist: payload.artist,
      bpm: payload.bpm,
      difficulty: payload.difficulty,
      sections: payload.sections,
      waveformPeaks: payload.analyzedData?.waveformPeaks,
      analyzedData: payload.analyzedData,
      densityMultiplier: payload.densityMultiplier || 1.0,
      genreName: payload.analyzedData?.vietnameseGenreName || 'Smart Analyzed',
      allowedInstruments: allowedInsts,
    });
    setAudioUrl(payload.audioUrl);
    setAudioBlob(payload.audioBlob);
    setBeatmap(finalBeatmap);
    setAppState('playing');
  };


  /**
   * Dynamically rebuilds the beatmap if the player switches instruments on stage.
   */
  const handleSwitchInstrumentOnStage = useCallback(
    (newInstrument: InstrumentType): Note[] | null => {
      if (trackMeta.analyzedData) {
        const diff = (
          ['easy', 'normal', 'hard'].includes(String(trackMeta.difficulty).toLowerCase())
            ? String(trackMeta.difficulty).toLowerCase()
            : 'normal'
        ) as Difficulty;
        return buildBeatmapFromAnalysis(
          trackMeta.analyzedData,
          newInstrument,
          diff,
          trackMeta.densityMultiplier || 1.0
        );
      }
      if (beatmap.length > 0) {
        return adaptLibraryBeatmapForInstrument(
          beatmap,
          newInstrument,
          String(trackMeta.difficulty)
        );
      }
      return null;
    },
    [beatmap, trackMeta]
  );

  /**
   * Handles completion of the concert stage and displays post-concert telemetry.
   */
  const handleGameComplete = (result: GameResult) => {
    setGameResult({
      ...result,
      audioBlob: audioBlob || undefined,
      beatmap: beatmap,
      trackTitle: trackMeta.title,
      trackArtist: trackMeta.artist,
      difficulty: String(trackMeta.difficulty),
      bpm: trackMeta.bpm,
      instrument: settings.instrument,
    });
    setAppState('result');
  };

  /**
   * Replays the current track.
   */
  const handleReplay = () => {
    const resetBeatmap = beatmap.map((note) => ({
      ...note,
      hit: false,
      missed: false,
    }));
    setBeatmap(resetBeatmap);
    setGameResult(null);
    setAppState('playing');
  };

  /**
   * Returns to the BandMaster Studio Deck while keeping uploaded tracks in the Session Vault.
   */
  const handleRestart = () => {
    setAppState('menu');
    setAudioUrl(null);
    setAudioBlob(null);
    setBeatmap([]);
    setGameResult(null);
  };

  return (
    <>
      {appState === 'menu' && (
        <Menu
          onStartJam={handleStartJam}
          onSelectLibrarySong={handleSelectLibrarySong}
          uploadedTracks={uploadedTracks}
          activeAnalysis={activeAnalysis}
          onTrackAnalyzed={handleTrackAnalyzed}
          onSelectUploadedTrack={setActiveAnalysis}
          onPlayAnalyzedTrack={handlePlayAnalyzedTrack}
          errorMsg={errorMsg}
          settings={settings}
          onUpdateSettings={setSettings}
        />
      )}
      {appState === 'loading' && (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#08090C] text-[#F3F4F6] p-8">
          <div className="bg-[#11131A] border border-white/[0.08] rounded-2xl p-10 flex flex-col items-center max-w-md w-full text-center">
            <div className="relative w-14 h-14 mb-6">
              <div className="absolute inset-0 border-4 border-white/10 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <div className="text-xs font-mono text-amber-400 mb-1">
              TUNING {INSTRUMENT_META[settings.instrument].name.toUpperCase()}
            </div>
            <h2 className="font-display text-2xl font-bold tracking-tight text-white">
              Entering 3D Concert Stage...
            </h2>
          </div>
        </div>
      )}
      {appState === 'playing' && audioUrl && (
        <Game
          audioUrl={audioUrl}
          beatmap={beatmap}
          settings={settings}
          onUpdateSettings={setSettings}
          onSwitchInstrument={handleSwitchInstrumentOnStage}
          onComplete={handleGameComplete}
          onExit={handleRestart}
          trackTitle={trackMeta.title}
          trackArtist={trackMeta.artist}
          bpm={trackMeta.bpm}
          difficulty={String(trackMeta.difficulty)}
          sections={trackMeta.sections}
          waveformPeaks={trackMeta.waveformPeaks}
          allowedInstruments={trackMeta.allowedInstruments}
          genreName={trackMeta.genreName}
        />
      )}

      {appState === 'result' && gameResult && (
        <Result
          result={gameResult}
          onReplay={handleReplay}
          onMenu={handleRestart}
        />
      )}
    </>
  );
}
