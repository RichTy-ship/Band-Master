/**
 * BandMaster Studio & Smart Music Library Deck (Menu.tsx)
 *
 * Features:
 * - Smart Music Library ("Thư Viện Âm Nhạc Thông Minh") that automatically categorizes
 *   both built-in tracks and user-uploaded songs into 6 musical genres.
 * - Strict Genre-Instrument Matching: Each genre and song has at most 3 suitable instruments
 *   (Tối đa 3 nhạc cụ phù hợp) with dedicated 6-Key Round Sheets (A · S · D · ← · ↓ · →).
 * - Interactive 3D Neon Instrument Cockpit & Universal DSP Audio/Video/MIDI/Chart Uploader.
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Difficulty,
  GenerationOptions,
  GameplaySettings,
  InstrumentType,
  Note,
  SmartGenreId,
  SongSection,
} from '../types';
import {
  Play,
  Volume2,
  Pause,
  Disc,
  Upload,
  Sliders,
  Music,
  Zap,
  Search,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import {
  SMART_LIBRARY_SONGS,
  SMART_GENRE_CATALOG,
  SMART_GENRE_LIST,
  LibrarySong,
} from '../game/songs';
import {
  soundFX,
  INSTRUMENT_META,
  SIX_KEY_CODES,
  SIX_KEY_ALT_CODES,
} from '../services/soundEffects';
import { StudioAnalyzer } from './StudioAnalyzer';
import { InstrumentCockpit } from './InstrumentCockpit';
import {
  AnalyzedTrackData,
  buildBeatmapFromAnalysis,
} from '../services/audioAnalyzer';

interface MenuProps {
  onStartJam: (options: GenerationOptions) => void;
  onSelectLibrarySong: (
    song: LibrarySong,
    preferredInstrument?: InstrumentType
  ) => void;
  uploadedTracks: AnalyzedTrackData[];
  activeAnalysis: AnalyzedTrackData | null;
  onTrackAnalyzed: (track: AnalyzedTrackData) => void;
  onSelectUploadedTrack: (track: AnalyzedTrackData) => void;
  onPlayAnalyzedTrack: (payload: {
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
  }) => void;
  errorMsg?: string | null;
  settings: GameplaySettings;
  onUpdateSettings: (settings: GameplaySettings) => void;
}

const INSTRUMENTS: InstrumentType[] = [
  'drums',
  'guitar',
  'bass',
  'synth',
  'trumpet',
  'violin',
];

type StudioTab = 'setlist' | 'analyzer' | 'cockpit';

export function Menu({
  onSelectLibrarySong,
  uploadedTracks,
  activeAnalysis,
  onTrackAnalyzed,
  onSelectUploadedTrack,
  onPlayAnalyzedTrack,
  errorMsg,
  settings,
  onUpdateSettings,
}: MenuProps) {
  const [activeTab, setActiveTab] = useState<StudioTab>('setlist');
  const [selectedGenre, setSelectedGenre] = useState<SmartGenreId | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<'all' | 'Easy' | 'Medium' | 'Hard'>('all');
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const [activeSoundcheckLane, setActiveSoundcheckLane] = useState<number | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  const selectedInstrument = settings.instrument;
  const activeInstMeta = INSTRUMENT_META[selectedInstrument];

  const activeGenreDef =
    selectedGenre !== 'all' ? SMART_GENRE_CATALOG[selectedGenre] : null;

  useEffect(() => {
    return () => {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
        previewAudioRef.current = null;
      }
    };
  }, []);

  const selectInstrument = (inst: InstrumentType) => {
    onUpdateSettings({ ...settings, instrument: inst });
    soundFX.playWarmupNote(0, inst);
    setTimeout(() => soundFX.playWarmupNote(1, inst), 85);
    setTimeout(() => soundFX.playWarmupNote(3, inst), 170);
  };

  const handleSelectGenreFilter = (genre: SmartGenreId | 'all') => {
    soundFX.playUiClick(740);
    setSelectedGenre(genre);
    if (genre !== 'all') {
      const gDef = SMART_GENRE_CATALOG[genre];
      const max3 = gDef.suitableInstruments.slice(0, 3);
      // Automatically switch to the #1 suitable instrument if current instrument isn't in this genre's 3
      if (!max3.includes(selectedInstrument)) {
        selectInstrument(max3[0]);
      }
    }
  };

  const triggerSoundcheckPad = (col: number) => {
    soundFX.playWarmupNote(col, selectedInstrument);
    setActiveSoundcheckLane(col);
    setTimeout(() => {
      setActiveSoundcheckLane((prev) => (prev === col ? null : prev));
    }, 160);
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      let col = SIX_KEY_CODES.indexOf(e.code);
      if (col === -1) col = SIX_KEY_ALT_CODES.indexOf(e.code);
      if (col !== -1) {
        e.preventDefault();
        triggerSoundcheckPad(col);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  const togglePreview = (e: React.MouseEvent, id: string, audioUrl?: string) => {
    e.stopPropagation();
    soundFX.playUiClick(660);

    if (!audioUrl) return;

    if (previewingId === id) {
      previewAudioRef.current?.pause();
      setPreviewingId(null);
      return;
    }

    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
    }

    const audio = new Audio(audioUrl);
    audio.volume = 0.65;
    audio.onended = () => setPreviewingId(null);
    audio.onerror = () => setPreviewingId(null);
    previewAudioRef.current = audio;
    audio.play().catch(() => setPreviewingId(null));
    setPreviewingId(id);
  };

  const handlePlaySongWithInstrument = (
    song: LibrarySong,
    instChoice?: InstrumentType
  ) => {
    const allowed3 = song.allowedInstruments.slice(0, 3);
    const targetInst =
      instChoice && allowed3.includes(instChoice)
        ? instChoice
        : allowed3.includes(selectedInstrument)
        ? selectedInstrument
        : allowed3[0];

    soundFX.playWarmupNote(3, targetInst);
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
    }
    onSelectLibrarySong(song, targetInst);
  };

  const handlePlayUploadedFromLibrary = (
    track: AnalyzedTrackData,
    instChoice?: InstrumentType
  ) => {
    const allowed3 = track.allowedInstruments.slice(0, 3);
    const targetInst =
      instChoice && allowed3.includes(instChoice)
        ? instChoice
        : allowed3.includes(selectedInstrument)
        ? selectedInstrument
        : allowed3[0];

    if (targetInst !== selectedInstrument) {
      onUpdateSettings({ ...settings, instrument: targetInst });
    }
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
    }
    soundFX.playFeverActivate();
    const map = buildBeatmapFromAnalysis(track, targetInst, 'normal', 1.0);
    onPlayAnalyzedTrack({
      audioUrl: track.audioUrl,
      audioBlob: track.audioBlob,
      beatmap: map,
      title: track.title,
      artist: `${track.vietnameseGenreName} · ${track.formatLabel}`,
      bpm: track.estimatedBpm,
      difficulty: 'normal',
      sections: track.sections,
      analyzedData: track,
      densityMultiplier: 1.0,
    });
  };

  // Count songs per genre (Built-in + Uploaded)
  const genreCounts = useMemo(() => {
    const counts: Record<SmartGenreId, number> = {
      rock_metal: 0,
      electronic_cyber: 0,
      jazz_swing: 0,
      pop_kpop: 0,
      classical_symphonic: 0,
      hiphop_funk: 0,
    };
    for (const s of SMART_LIBRARY_SONGS) {
      counts[s.genreId] = (counts[s.genreId] || 0) + 1;
    }
    for (const u of uploadedTracks) {
      counts[u.genreId] = (counts[u.genreId] || 0) + 1;
    }
    return counts;
  }, [uploadedTracks]);

  // Filter built-in songs by selected genre, search query & difficulty
  const filteredLibrarySongs = useMemo(() => {
    return SMART_LIBRARY_SONGS.filter((song) => {
      if (selectedGenre !== 'all' && song.genreId !== selectedGenre) return false;
      if (difficultyFilter !== 'all' && song.difficulty !== difficultyFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const gDef = SMART_GENRE_CATALOG[song.genreId];
        const instNames = song.allowedInstruments
          .map((i) => `${INSTRUMENT_META[i].name} ${INSTRUMENT_META[i].vietnameseName}`)
          .join(' ')
          .toLowerCase();
        const match =
          song.title.toLowerCase().includes(q) ||
          song.artist.toLowerCase().includes(q) ||
          gDef.name.toLowerCase().includes(q) ||
          gDef.vietnameseName.toLowerCase().includes(q) ||
          instNames.includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [selectedGenre, difficultyFilter, searchQuery]);

  // Filter uploaded tracks by selected genre & search query
  const filteredUploadedTracks = useMemo(() => {
    return uploadedTracks.filter((track) => {
      if (selectedGenre !== 'all' && track.genreId !== selectedGenre) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const instNames = track.allowedInstruments
          .map((i) => `${INSTRUMENT_META[i].name} ${INSTRUMENT_META[i].vietnameseName}`)
          .join(' ')
          .toLowerCase();
        const match =
          track.title.toLowerCase().includes(q) ||
          track.vietnameseGenreName.toLowerCase().includes(q) ||
          instNames.includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [uploadedTracks, selectedGenre, searchQuery]);

  const totalLibraryCount = SMART_LIBRARY_SONGS.length + uploadedTracks.length;

  return (
    <div className="min-h-screen bg-[#08090C] text-[#F3F4F6] flex flex-col">
      {/* Top Studio Navigation Bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between gap-8 px-6 lg:px-10 py-3.5 bg-[#08090C]/95 backdrop-blur-md border-b border-white/[0.08]">
        {/* Zone 1: Brand & Active Instrument */}
        <div className="flex items-center gap-3 shrink-0">
          <div
            className="w-3 h-7 rounded-md"
            style={{ backgroundColor: activeInstMeta.accentHex }}
          />
          <div>
            <div className="font-display text-base font-extrabold tracking-tight text-white leading-none">
              BANDMASTER SMART LIBRARY
            </div>
            <div className={`text-[11px] font-mono ${activeInstMeta.badgeClass} mt-0.5`}>
              {activeInstMeta.name} ({activeInstMeta.vietnameseName}) · 6 Phím Tròn
            </div>
          </div>
        </div>

        {/* Zone 2: Studio Workspace Mode Switcher */}
        <nav className="flex items-center gap-1.5 p-1 bg-[#11131A] border border-white/[0.08] rounded-xl">
          <button
            type="button"
            onClick={() => {
              soundFX.playUiClick(740);
              setActiveTab('setlist');
            }}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'setlist'
                ? 'bg-amber-400 text-black font-bold'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Sparkles size={14} />
            <span>Thư Viện Thông Minh ({totalLibraryCount})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundFX.playUiClick(700);
              setActiveTab('analyzer');
            }}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'analyzer'
                ? 'bg-amber-400 text-black font-bold'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Upload size={14} />
            <span>Tải Nhạc & Tự Phân Loại</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundFX.playUiClick(780);
              setActiveTab('cockpit');
            }}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'cockpit'
                ? 'bg-amber-400 text-black font-bold'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Sliders size={14} />
            <span>Soundcheck & Cấu Hình</span>
          </button>
        </nav>

        {/* Zone 3: Quick Stage Launch */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={() => {
              if (activeAnalysis) {
                handlePlayUploadedFromLibrary(activeAnalysis);
              } else if (filteredLibrarySongs.length > 0) {
                handlePlaySongWithInstrument(filteredLibrarySongs[0]);
              } else {
                handlePlaySongWithInstrument(SMART_LIBRARY_SONGS[0]);
              }
            }}
            className="px-4 py-2 text-xs font-bold text-black bg-amber-400 hover:bg-amber-300 rounded-xl transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Play size={14} className="fill-current" />
            <span>
              {activeAnalysis
                ? `Vào Chơi: ${activeAnalysis.title.slice(0, 20)}`
                : 'Vào Sân Khấu Nhanh'}
            </span>
          </button>
        </div>
      </header>

      <main className="flex-1 w-full max-w-[1280px] mx-auto px-6 lg:px-10 py-6 space-y-6">
        {/* Persistent Top Band Instrument Selector Dock & Interactive Rounded Cockpit */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left 7 cols: 6-Instrument Band Selector Grid (Highlights the 3 Suitable Instruments when a Genre is selected) */}
          <div className="lg:col-span-7 bg-[#11131A] border border-white/[0.08] rounded-2xl p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between gap-4 mb-3">
              <div>
                <div className="text-[11px] font-mono text-amber-400">
                  {activeGenreDef
                    ? `THỂ LOẠI ${activeGenreDef.vietnameseName.toUpperCase()} · TỐI ĐA 3 NHẠC CỤ PHÙ HỢP`
                    : '6 NHẠC CỤ BAN NHẠC · TỰ ĐỘNG ĐỀ XUẤT 3 NHẠC CỤ THEO THỂ LOẠI'}
                </div>
                <h1 className="font-display text-xl font-extrabold text-white mt-0.5">
                  {activeGenreDef
                    ? `3 Nhạc Cụ Chuẩn Cho ${activeGenreDef.vietnameseName}`
                    : 'Chọn Nhạc Cụ Hoặc Chọn Thể Loại Để Lọc 3 Nhạc Cụ Phù Hợp'}
                </h1>
              </div>
              <span className="text-xs font-mono text-amber-300 hidden sm:inline">
                6 Phím: A · S · D · ← · ↓ · →
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {INSTRUMENTS.map((instKey) => {
                const meta = INSTRUMENT_META[instKey];
                const isSelected = selectedInstrument === instKey;
                const isGenreRecommended = activeGenreDef
                  ? activeGenreDef.suitableInstruments.slice(0, 3).includes(instKey)
                  : true;
                const fitRank = activeGenreDef
                  ? activeGenreDef.suitableInstruments.indexOf(instKey) + 1
                  : 0;

                return (
                  <button
                    key={instKey}
                    type="button"
                    onClick={() => selectInstrument(instKey)}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? `bg-[#171B29] ${meta.borderClass} ring-1 ring-amber-400/70`
                        : isGenreRecommended
                        ? 'bg-[#08090C] border-white/15 hover:border-amber-400/50'
                        : 'bg-[#08090C]/45 border-white/[0.04] opacity-45 hover:opacity-80'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1.5">
                        <span className="font-display text-sm font-bold text-white truncate">
                          {meta.name}
                        </span>
                        {activeGenreDef && isGenreRecommended ? (
                          <span className="px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 font-mono text-[9px] font-bold shrink-0">
                            TOP #{fitRank}
                          </span>
                        ) : (
                          isSelected && (
                            <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                          )
                        )}
                      </div>
                      <div className={`text-[11px] font-mono ${meta.badgeClass} mt-0.5 truncate`}>
                        {meta.vietnameseName}
                      </div>
                      <div className="text-[10px] font-mono text-zinc-400 mt-1 truncate">
                        Sheet: {meta.sheetStyleBadge}
                      </div>
                    </div>

                    {/* 6 Circular Round-Key Swatches */}
                    <div className="mt-2.5 grid grid-cols-6 gap-1">
                      {meta.laneLabels.map((lbl, i) => (
                        <div
                          key={i}
                          title={lbl}
                          className="aspect-square rounded-full bg-[#11131A] border flex items-center justify-center"
                          style={{ borderColor: meta.laneColors[i] }}
                        >
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: meta.laneColors[i] }}
                          />
                        </div>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right 5 cols: Interactive 3D Neon Instrument Cockpit & Sheet Profile */}
          <div className="lg:col-span-5 bg-[#11131A] border border-white/[0.08] rounded-2xl p-5 flex flex-col justify-between">
            <div className="mb-2">
              <div className="flex items-center justify-between">
                <div className="text-[11px] font-mono text-zinc-400">
                  SHEET RIÊNG & THỬ ÂM TRỰC TIẾP
                </div>
                <span className={`text-xs font-mono font-bold ${activeInstMeta.badgeClass}`}>
                  {activeInstMeta.vietnameseName.toUpperCase()}
                </span>
              </div>
              <h2 className="font-display text-base font-bold text-white mt-0.5">
                {activeInstMeta.sheetTitle}
              </h2>
              <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                {activeInstMeta.sheetMechanics}
              </p>
            </div>

            <InstrumentCockpit
              instrument={selectedInstrument}
              activeLane={activeSoundcheckLane}
              onTriggerLane={triggerSoundcheckPad}
            />
          </div>
        </section>

        {/* Active Studio Workspace Tab Content */}
        {activeTab === 'setlist' && (
          <section className="space-y-6">
            {/* 1. Smart Genre Auto-Classification Hub (6 Genres · Max 3 Suitable Instruments per Genre) */}
            <div className="bg-[#11131A] border border-white/[0.08] rounded-2xl p-5 lg:p-6 space-y-5">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
                <div>
                  <div className="flex items-center gap-2 text-xs font-mono text-amber-400">
                    <Sparkles size={14} />
                    <span>THƯ VIỆN ÂM NHẠC THÔNG MINH · TỰ ĐỘNG PHÂN LOẠI THỂ LOẠI</span>
                  </div>
                  <h2 className="font-display text-2xl font-extrabold text-white mt-0.5">
                    6 Thể Loại Âm Nhạc · Mỗi Thể Loại Tối Đa 3 Nhạc Cụ Phù Hợp
                  </h2>
                  <p className="text-xs text-zinc-400 mt-1">
                    Khi chọn thể loại hoặc tải nhạc mới lên, hệ thống tự động nhận diện cấu trúc âm thanh và giới hạn đúng 3 nhạc cụ hợp nhất cho bản nhạc đó.
                  </p>
                </div>

                {/* Search + Difficulty Filter + Quick Upload Button */}
                <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                  <div className="relative">
                    <Search
                      size={14}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
                    />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Tìm bài hát, thể loại, nhạc cụ..."
                      className="pl-8 pr-3 py-2 bg-[#08090C] border border-white/10 focus:border-amber-400 rounded-xl text-xs text-white placeholder:text-zinc-500 focus:outline-none w-52 sm:w-60"
                    />
                  </div>

                  <div className="flex items-center gap-1 p-1 bg-[#08090C] border border-white/10 rounded-xl">
                    {(['all', 'Easy', 'Medium', 'Hard'] as const).map((diff) => (
                      <button
                        key={diff}
                        type="button"
                        onClick={() => {
                          soundFX.playUiClick(720);
                          setDifficultyFilter(diff);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-semibold transition-colors cursor-pointer ${
                          difficultyFilter === diff
                            ? 'bg-amber-400 text-black font-bold'
                            : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        {diff === 'all' ? 'Tất cả' : diff}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      soundFX.playUiClick(760);
                      setActiveTab('analyzer');
                    }}
                    className="px-3.5 py-2 bg-white/[0.07] hover:bg-white/[0.14] border border-white/15 rounded-xl text-xs font-semibold text-amber-300 flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Upload size={14} />
                    <span>+ Tải Nhạc Tự Phân Loại</span>
                  </button>
                </div>
              </div>

              {/* 6 Smart Genre Category Cards + "All Genres" Tab */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono text-zinc-400">
                    CHỌN THỂ LOẠI ĐỂ LỌC BÀI HÁT & 3 NHẠC CỤ TƯƠNG ỨNG:
                  </span>
                  {selectedGenre !== 'all' && (
                    <button
                      type="button"
                      onClick={() => handleSelectGenreFilter('all')}
                      className="text-xs font-mono text-amber-400 hover:underline cursor-pointer"
                    >
                      Xem tất cả {totalLibraryCount} bài hát →
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {SMART_GENRE_LIST.map((genre) => {
                    const isSelected = selectedGenre === genre.id;
                    const count = genreCounts[genre.id] || 0;
                    const max3Instruments = genre.suitableInstruments.slice(0, 3);

                    return (
                      <div
                        key={genre.id}
                        onClick={() =>
                          handleSelectGenreFilter(isSelected ? 'all' : genre.id)
                        }
                        className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? `bg-[#171B29] ${genre.borderClass} ring-1 ring-amber-400/70`
                            : 'bg-[#08090C] border-white/[0.07] hover:border-white/25'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span
                              className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-white/[0.06] ${genre.badgeClass}`}
                            >
                              {genre.shortBadge}
                            </span>
                            <span className="text-[11px] font-mono text-zinc-400 tabular-nums">
                              {count} bài hát
                            </span>
                          </div>

                          <h3 className="font-display text-base font-bold text-white">
                            {genre.vietnameseName}
                          </h3>
                          <p className="text-[11px] text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                            {genre.description}
                          </p>
                        </div>

                        {/* Strictly 3 Suitable Instruments Pill Bar */}
                        <div className="mt-3 pt-2.5 border-t border-white/[0.06]">
                          <div className="text-[10px] font-mono text-zinc-500 mb-1.5">
                            TỐI ĐA 3 NHẠC CỤ PHÙ HỢP:
                          </div>
                          <div className="grid grid-cols-3 gap-1.5">
                            {max3Instruments.map((instKey, iIdx) => {
                              const m = INSTRUMENT_META[instKey];
                              const isCurrentInst = selectedInstrument === instKey;
                              return (
                                <button
                                  key={instKey}
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedGenre(genre.id);
                                    selectInstrument(instKey);
                                  }}
                                  className={`py-1.5 px-2 rounded-lg border text-[11px] font-semibold truncate transition-all cursor-pointer flex items-center justify-center gap-1 ${
                                    isCurrentInst
                                      ? 'bg-amber-400 text-black border-amber-300 font-bold'
                                      : 'bg-[#11131A] border-white/10 text-zinc-200 hover:border-white/30'
                                  }`}
                                  title={genre.instrumentFitNotes[instKey] || m.sheetTitle}
                                >
                                  <span
                                    className="w-2 h-2 rounded-full shrink-0"
                                    style={{
                                      backgroundColor: isCurrentInst
                                        ? '#08090C'
                                        : m.accentHex,
                                    }}
                                  />
                                  <span className="truncate">{m.vietnameseName}</span>
                                  <span className="text-[9px] opacity-65 shrink-0">
                                    #{iIdx + 1}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Active Genre Detailed 3-Instrument Breakdown Banner */}
              {activeGenreDef && (
                <div className="bg-[#08090C] border border-amber-400/40 rounded-xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div>
                    <div className="text-xs font-mono text-amber-400 font-bold">
                      ĐANG LỌC THỂ LOẠI: {activeGenreDef.vietnameseName.toUpperCase()} ({activeGenreDef.acousticSignature})
                    </div>
                    <div className="text-xs text-zinc-300 mt-1">
                      Chỉ hiển thị tối đa <strong className="text-white">3 nhạc cụ phù hợp nhất</strong> với cấu trúc âm thanh của dòng nhạc này:
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 shrink-0">
                    {activeGenreDef.suitableInstruments.slice(0, 3).map((instKey, idx) => {
                      const m = INSTRUMENT_META[instKey];
                      const active = selectedInstrument === instKey;
                      return (
                        <button
                          key={instKey}
                          type="button"
                          onClick={() => selectInstrument(instKey)}
                          className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                            active
                              ? 'bg-amber-400 text-black border-amber-300 font-bold'
                              : 'bg-[#11131A] border-white/10 text-white hover:border-amber-400/50'
                          }`}
                        >
                          <div className="text-xs font-display font-bold flex items-center justify-between">
                            <span>
                              #{idx + 1} {m.vietnameseName}
                            </span>
                            <span className="font-mono text-[10px] opacity-80">
                              {m.sheetStyleBadge}
                            </span>
                          </div>
                          <div
                            className={`text-[10px] mt-0.5 line-clamp-1 ${
                              active ? 'text-black/80' : 'text-zinc-400'
                            }`}
                          >
                            {activeGenreDef.instrumentFitNotes[instKey]}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* 2. Auto-Categorized User Uploaded Songs Section (If user uploaded 1+ tracks matching filter) */}
            {filteredUploadedTracks.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-400" />
                    <h3 className="font-display text-lg font-bold text-white">
                      Nhạc Đã Tải Lên · Tự Động Phân Loại ({filteredUploadedTracks.length})
                    </h3>
                  </div>
                  <span className="text-xs font-mono text-emerald-400">
                    Bấm chọn 1 trong 3 nhạc cụ phù hợp trên thẻ để vào chơi ngay
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredUploadedTracks.map((track, idx) => {
                    const gDef = SMART_GENRE_CATALOG[track.genreId];
                    const allowed3 = track.allowedInstruments.slice(0, 3);
                    const isPreviewing = previewingId === `upload-${idx}`;

                    return (
                      <div
                        key={`${track.fileName}-${idx}`}
                        className="bg-[#11131A] border border-emerald-500/40 hover:border-amber-400/70 rounded-2xl p-5 flex flex-col justify-between gap-4 transition-all"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-white/[0.07] ${gDef.badgeClass}`}
                              >
                                {gDef.vietnameseName.toUpperCase()}
                              </span>
                              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                                DSP Auto-Classified ({track.confidencePct}%)
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={(e) =>
                                togglePreview(e, `upload-${idx}`, track.audioUrl)
                              }
                              className="w-8 h-8 rounded-lg bg-[#08090C] border border-white/15 flex items-center justify-center text-white hover:border-amber-400 cursor-pointer shrink-0"
                              title="Nghe thử"
                            >
                              {isPreviewing ? (
                                <Pause size={14} className="text-amber-400" />
                              ) : (
                                <Volume2 size={14} />
                              )}
                            </button>
                          </div>

                          <h4 className="font-display text-lg font-bold text-white truncate">
                            {track.title}
                          </h4>
                          <p className="text-xs text-zinc-400 font-mono mt-0.5">
                            {track.autoClassifyReason}
                          </p>
                        </div>

                        {/* Strictly Max 3 Suitable Instruments Launch Buttons */}
                        <div className="pt-3 border-t border-white/[0.06] space-y-2">
                          <div className="flex items-center justify-between text-[11px] font-mono">
                            <span className="text-amber-400 font-semibold">
                              CHỌN 1 TRONG 3 NHẠC CỤ PHÙ HỢP ĐỂ VÀO CHƠI:
                            </span>
                            <span className="text-zinc-400 tabular-nums">
                              {track.estimatedBpm} BPM · {track.formatLabel}
                            </span>
                          </div>

                          <div className="grid grid-cols-3 gap-2">
                            {allowed3.map((instKey) => {
                              const m = INSTRUMENT_META[instKey];
                              const isCurrent = selectedInstrument === instKey;
                              return (
                                <button
                                  key={instKey}
                                  type="button"
                                  onClick={() =>
                                    handlePlayUploadedFromLibrary(track, instKey)
                                  }
                                  className={`py-2 px-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                                    isCurrent
                                      ? 'bg-amber-400 text-black border-amber-300 font-bold'
                                      : 'bg-[#08090C] border-white/15 text-white hover:border-amber-400/60'
                                  }`}
                                >
                                  <Play size={12} className="fill-current shrink-0" />
                                  <span className="truncate">{m.vietnameseName}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 3. Smart Categorized Music Library Grid (12 Built-In Songs Across 6 Genres) */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
                <div>
                  <div className="text-xs font-mono text-amber-400">
                    DANH SÁCH BÀI HÁT ĐÃ PHÂN LOẠI THÔNG MINH ({filteredLibrarySongs.length} BÀI)
                  </div>
                  <h3 className="font-display text-xl font-bold text-white">
                    {activeGenreDef
                      ? `Thư Viện ${activeGenreDef.vietnameseName} · Tối Đa 3 Nhạc Cụ Phù Hợp`
                      : 'Tất Cả Bài Hát Theo Thể Loại & 3 Nhạc Cụ Tương Ứng'}
                  </h3>
                </div>
                <span className="text-xs font-mono text-zinc-400">
                  Bấm trực tiếp vào 1 trong 3 nhạc cụ trên mỗi bài hát để vào sân khấu 3D
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredLibrarySongs.map((song) => {
                  const isPreviewing = previewingId === song.id;
                  const imgFailed = failedImages[song.id];
                  const genreDef = SMART_GENRE_CATALOG[song.genreId];
                  const allowed3 = song.allowedInstruments.slice(0, 3);
                  const activeAllowedInst = allowed3.includes(selectedInstrument)
                    ? selectedInstrument
                    : allowed3[0];

                  return (
                    <div
                      key={song.id}
                      onClick={() =>
                        handlePlaySongWithInstrument(song, activeAllowedInst)
                      }
                      className="group bg-[#11131A] border border-white/[0.08] hover:border-amber-400/60 rounded-2xl overflow-hidden transition-all cursor-pointer flex flex-col justify-between"
                    >
                      <div>
                        {/* Cover / Visual Genre Header */}
                        <div className="aspect-[16/9] bg-[#08090C] relative overflow-hidden">
                          {song.coverUrl && !imgFailed ? (
                            <img
                              src={song.coverUrl}
                              alt={song.title}
                              referrerPolicy="no-referrer"
                              onError={() =>
                                setFailedImages((prev) => ({
                                  ...prev,
                                  [song.id]: true,
                                }))
                              }
                              className="w-full h-full object-cover opacity-85 group-hover:scale-105 group-hover:opacity-100 transition-all duration-300"
                            />
                          ) : (
                            <div
                              className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center"
                              style={{
                                background: `radial-gradient(circle at 50% 35%, ${genreDef.accentHex}30 0%, #11131A 65%, #08090C 100%)`,
                              }}
                            >
                              <Disc
                                size={34}
                                style={{ color: genreDef.accentHex }}
                                className="mb-2 opacity-90 group-hover:rotate-45 transition-transform duration-500"
                              />
                              <span
                                className={`font-mono text-[10px] font-bold ${genreDef.badgeClass}`}
                              >
                                {genreDef.vietnameseName.toUpperCase()}
                              </span>
                            </div>
                          )}

                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent" />

                          {/* Top Left Genre Tag */}
                          <div className="absolute top-3 left-3 flex items-center gap-1.5">
                            <span
                              className={`px-2.5 py-1 rounded-lg bg-black/80 border border-white/15 font-mono text-[10px] font-bold ${genreDef.badgeClass}`}
                            >
                              {genreDef.shortBadge}
                            </span>
                            <span
                              className={`px-2 py-1 rounded-lg bg-black/75 font-mono text-[10px] font-semibold ${
                                song.difficulty === 'Hard'
                                  ? 'text-rose-400'
                                  : song.difficulty === 'Medium'
                                  ? 'text-cyan-400'
                                  : 'text-emerald-400'
                              }`}
                            >
                              {song.difficulty} · {song.bpm} BPM
                            </span>
                          </div>

                          {/* Top Right Audio Preview Button (for Mastered Audio tracks) */}
                          {song.audioUrl && (
                            <button
                              type="button"
                              onClick={(e) =>
                                togglePreview(e, song.id, song.audioUrl)
                              }
                              title={
                                isPreviewing
                                  ? 'Dừng nghe thử'
                                  : 'Nghe thử âm thanh'
                              }
                              className="absolute top-3 right-3 w-9 h-9 rounded-xl bg-black/75 hover:bg-black/90 border border-white/15 flex items-center justify-center text-white transition-colors z-10 cursor-pointer"
                            >
                              {isPreviewing ? (
                                <Pause size={15} className="text-amber-400" />
                              ) : (
                                <Volume2 size={15} />
                              )}
                            </button>
                          )}

                          {/* Bottom Title & Play Button */}
                          <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between gap-2">
                            <div className="min-w-0">
                              <div className="text-[10px] font-mono text-zinc-300 truncate">
                                {song.artist}
                              </div>
                              <h4 className="font-display font-bold text-base sm:text-lg text-white leading-snug truncate">
                                {song.title}
                              </h4>
                            </div>
                            <div className="w-9 h-9 rounded-xl bg-amber-400 text-black flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                              <Play size={17} className="ml-0.5 fill-current" />
                            </div>
                          </div>
                        </div>

                        {/* Acoustic Summary */}
                        <div className="px-4 pt-3 pb-2">
                          <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                            {song.acousticSummary}
                          </p>
                        </div>
                      </div>

                      {/* Strictly Max 3 Suitable Instruments Selector Bar per Song */}
                      <div className="p-4 pt-2 border-t border-white/[0.06] space-y-2">
                        <div className="flex items-center justify-between text-[10px] font-mono">
                          <span className="text-amber-400 font-bold">
                            3 NHẠC CỤ PHÙ HỢP ({genreDef.shortBadge}):
                          </span>
                          <span className="text-zinc-500">{song.duration}</span>
                        </div>

                        <div className="grid grid-cols-3 gap-1.5">
                          {allowed3.map((instKey) => {
                            const m = INSTRUMENT_META[instKey];
                            const isCurrent = activeAllowedInst === instKey;
                            return (
                              <button
                                key={instKey}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePlaySongWithInstrument(song, instKey);
                                }}
                                className={`py-1.5 px-2 rounded-lg border text-[11px] font-semibold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                                  isCurrent
                                    ? 'bg-amber-400 text-black border-amber-300 font-bold'
                                    : 'bg-[#08090C] border-white/10 text-zinc-200 hover:border-amber-400/50'
                                }`}
                                title={`Chơi bài "${song.title}" bằng ${m.name} (${m.vietnameseName})`}
                              >
                                <span
                                  className="w-2 h-2 rounded-full shrink-0"
                                  style={{
                                    backgroundColor: isCurrent
                                      ? '#08090C'
                                      : m.accentHex,
                                  }}
                                />
                                <span className="truncate">{m.vietnameseName}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {activeTab === 'analyzer' && (
          <section className="space-y-4">
            <StudioAnalyzer
              selectedInstrument={selectedInstrument}
              onSelectInstrument={selectInstrument}
              uploadedTracks={uploadedTracks}
              activeAnalysis={activeAnalysis}
              onTrackAnalyzed={onTrackAnalyzed}
              onSelectUploadedTrack={onSelectUploadedTrack}
              onPlayAnalyzedTrack={onPlayAnalyzedTrack}
            />
          </section>
        )}

        {activeTab === 'cockpit' && (
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 bg-[#11131A] border border-white/[0.08] rounded-2xl p-6 space-y-6">
              <div>
                <div className="text-xs font-mono text-cyan-400 mb-1">
                  3D STAGE & HIGHWAY CALIBRATION
                </div>
                <h2 className="font-display text-xl font-bold text-white">
                  Note Velocity, Scroll Direction & Star Power
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <span className="block text-xs font-mono text-zinc-400 mb-2">
                    NOTE SCROLL VELOCITY
                  </span>
                  <div className="grid grid-cols-4 gap-1.5 p-1 bg-[#08090C] border border-white/[0.06] rounded-xl">
                    {[0.8, 1.0, 1.25, 1.5].map((mult) => (
                      <button
                        key={mult}
                        type="button"
                        onClick={() => {
                          soundFX.playUiClick(750);
                          onUpdateSettings({ ...settings, speedMultiplier: mult });
                        }}
                        className={`py-2.5 px-2 rounded-lg text-xs font-mono font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                          settings.speedMultiplier === mult
                            ? 'bg-amber-400 text-black'
                            : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        {mult}x
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="block text-xs font-mono text-zinc-400 mb-2">
                    STAR POWER / BAND FEVER (2X BOOST)
                  </span>
                  <div className="grid grid-cols-2 gap-2 p-1 bg-[#08090C] border border-white/[0.06] rounded-xl">
                    <button
                      type="button"
                      onClick={() => {
                        soundFX.playUiClick(700);
                        onUpdateSettings({ ...settings, autoFever: true });
                      }}
                      className={`py-2.5 px-3 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        settings.autoFever
                          ? 'bg-amber-400 text-black'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      Auto Trigger (100%)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        soundFX.playUiClick(700);
                        onUpdateSettings({ ...settings, autoFever: false });
                      }}
                      className={`py-2.5 px-3 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        !settings.autoFever
                          ? 'bg-amber-400 text-black'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      Manual [SPACE]
                    </button>
                  </div>
                </div>

                <div>
                  <span className="block text-xs font-mono text-zinc-400 mb-2">
                    HIGHWAY SCROLL DIRECTION
                  </span>
                  <div className="grid grid-cols-2 gap-2 p-1 bg-[#08090C] border border-white/[0.06] rounded-xl">
                    <button
                      type="button"
                      onClick={() => {
                        soundFX.playUiClick(700);
                        onUpdateSettings({ ...settings, scrollDirection: 'down' });
                      }}
                      className={`py-2.5 px-3 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        settings.scrollDirection === 'down'
                          ? 'bg-cyan-400 text-black'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      Downscroll (Rock Band)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        soundFX.playUiClick(700);
                        onUpdateSettings({ ...settings, scrollDirection: 'up' });
                      }}
                      className={`py-2.5 px-3 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        settings.scrollDirection === 'up'
                          ? 'bg-cyan-400 text-black'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      Upscroll (Arcade)
                    </button>
                  </div>
                </div>

                <div>
                  <span className="block text-xs font-mono text-zinc-400 mb-2">
                    ACOUSTIC INSTRUMENT SYNTHESIS
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const next = !settings.hitSoundEnabled;
                      onUpdateSettings({ ...settings, hitSoundEnabled: next });
                      if (next) soundFX.playWarmupNote(1, selectedInstrument);
                    }}
                    className={`w-full py-2.5 px-4 rounded-xl border text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                      settings.hitSoundEnabled
                        ? 'bg-[#08090C] border-emerald-500/50 text-emerald-300'
                        : 'bg-[#08090C] border-white/[0.06] text-zinc-400'
                    }`}
                  >
                    <span>{activeInstMeta.name} Hit Synth</span>
                    <span className="font-mono">
                      {settings.hitSoundEnabled ? 'ENABLED' : 'MUTED'}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 bg-[#11131A] border border-white/[0.08] rounded-2xl p-6 flex flex-col justify-between">
              <div>
                <div className="text-xs font-mono text-amber-400 mb-1">
                  6-KEY ROUND STAGE CONTROLS · 6 PHÍM TRÒN
                </div>
                <h3 className="font-display text-lg font-bold text-white mb-4">
                  Keyboard & Touch Bindings
                </h3>

                <div className="space-y-2.5 text-xs">
                  <div className="p-3 bg-[#08090C] border border-white/[0.06] rounded-xl flex items-center justify-between">
                    <span className="text-zinc-300">{activeInstMeta.name} 6 Phím Tròn</span>
                    <span className="font-mono text-amber-400 font-semibold">
                      A · S · D · ← · ↓ · → (or 1–6)
                    </span>
                  </div>
                  <div className="p-3 bg-[#08090C] border border-white/[0.06] rounded-xl flex items-center justify-between">
                    <span className="text-zinc-300">Trigger 2x Star Power Fever</span>
                    <span className="font-mono text-cyan-400 font-semibold">
                      SPACEBAR (at 100%)
                    </span>
                  </div>
                  <div className="p-3 bg-[#08090C] border border-white/[0.06] rounded-xl flex items-center justify-between">
                    <span className="text-zinc-300">3 Nhạc Cụ Phù Hợp Mỗi Thể Loại</span>
                    <span className="font-mono text-emerald-400 font-semibold">
                      Tự động lọc trên Sân Khấu
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-white/[0.08] flex items-center justify-between text-xs text-zinc-400">
                <span>Sheet 6 phím tròn 1:1 sắc nét</span>
                <span className="font-mono text-amber-400">Up to 8x Multiplier</span>
              </div>
            </div>
          </section>
        )}

        {errorMsg && (
          <div className="p-4 bg-rose-950/60 border border-rose-500/50 rounded-2xl text-rose-200 text-xs font-mono">
            {errorMsg}
          </div>
        )}
      </main>
    </div>
  );
}

