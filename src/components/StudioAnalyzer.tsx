/**
 * Studio Universal Audio, Video, MIDI & Chart Upload + Stage Launch Deck
 *
 * Upgraded Music Upload & Stage Entry Experience:
 * - Instant Stage Mode ("Tự động vào chơi ngay khi tải nhạc") OR Studio Mastering Preview
 * - Persistent Session Vault of Uploaded Songs (no need to re-upload after playing on stage)
 * - Prominent Top Stage Launch Bar ("VÀO SÂN KHẤU CHƠI BẢN NHẠC NÀY NGAY")
 * - Interactive Dual-Layer Waveform + 4-Lane Rounded-Corner Beatmap Timeline Preview
 * - Live Note Density Multiplier (0.7x Chill · 1.0x Studio · 1.35x Pro · 1.7x Extreme) & BPM Calibration
 */

import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  Upload,
  Play,
  Pause,
  Download,
  Activity,
  RotateCcw,
  FileAudio,
  Zap,
  Music,
  CheckCircle2,
  Sliders,
} from 'lucide-react';
import {
  AnalyzedTrackData,
  analyzeUploadedAudio,
  buildBeatmapFromAnalysis,
} from '../services/audioAnalyzer';
import {
  SUPPORTED_FORMAT_CATEGORIES,
  ALL_ACCEPT_ATTRIBUTE,
} from '../services/formatDecoders';
import { Difficulty, InstrumentType, Note, SongSection } from '../types';
import { soundFX, INSTRUMENT_META, SIX_KEY_LABELS } from '../services/soundEffects';
import { SMART_GENRE_CATALOG } from '../game/songs';


interface StudioAnalyzerProps {
  selectedInstrument: InstrumentType;
  onSelectInstrument: (inst: InstrumentType) => void;
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
}

const VALID_EXTENSIONS_REGEX =
  /\.(mp3|wav|flac|ogg|oga|opus|m4a|aac|alac|aiff|aif|wma|amr|webm|caf|mp4|mov|mkv|avi|m4v|mid|midi|sm|ssc|osu|json)$/i;

const DENSITY_PRESETS = [
  { value: 0.75, label: '0.75x Chill', desc: 'Thư giãn, dễ bắt nhịp' },
  { value: 1.0, label: '1.0x Studio', desc: 'Chuẩn nhịp bản gốc' },
  { value: 1.35, label: '1.35x Pro', desc: 'Tăng nốt móc kép & dồn trống' },
  { value: 1.7, label: '1.7x Extreme', desc: 'Mật độ nốt dày đặc' },
];

const ALL_INSTRUMENTS: InstrumentType[] = [
  'drums',
  'guitar',
  'bass',
  'synth',
  'trumpet',
  'violin',
];

export function StudioAnalyzer({
  selectedInstrument,
  onSelectInstrument,
  uploadedTracks,
  activeAnalysis,
  onTrackAnalyzed,
  onSelectUploadedTrack,
  onPlayAnalyzedTrack,
}: StudioAnalyzerProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progressStage, setProgressStage] = useState('');
  const [progressPct, setProgressPct] = useState(0);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const [autoPlayOnUpload, setAutoPlayOnUpload] = useState<boolean>(false);
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');
  const [densityMultiplier, setDensityMultiplier] = useState<number>(1.0);
  const [customTitle, setCustomTitle] = useState('');
  const [customBpm, setCustomBpm] = useState<number>(128);

  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const [previewProgress, setPreviewProgress] = useState(0);
  const [previewCurrentTime, setPreviewCurrentTime] = useState(0);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);

  const instMeta = INSTRUMENT_META[selectedInstrument];
  const analysis = activeAnalysis;

  // Sync title & BPM when activeAnalysis changes
  useEffect(() => {
    if (analysis) {
      setCustomTitle(analysis.title);
      setCustomBpm(analysis.estimatedBpm);
      setPreviewProgress(0);
      setPreviewCurrentTime(0);
      setIsPreviewPlaying(false);
    }
  }, [analysis]);

  useEffect(() => {
    return () => {
      if (audioPreviewRef.current) {
        audioPreviewRef.current.pause();
      }
    };
  }, []);

  const handleFileProcess = async (file: File) => {
    const isMediaMime =
      file.type.startsWith('audio/') ||
      file.type.startsWith('video/') ||
      file.type.includes('midi') ||
      file.type.includes('json');

    if (!isMediaMime && !VALID_EXTENSIONS_REGEX.test(file.name)) {
      setAnalysisError(
        'Định dạng chưa hỗ trợ. Hỗ trợ: MP3, WAV, FLAC, AIFF, ALAC, OGG, OPUS, M4A, AAC, WMA, MP4, MOV, MKV, WEBM, MIDI (.mid), StepMania (.sm/.ssc), osu! (.osu), JSON.'
      );
      return;
    }

    if (audioPreviewRef.current) {
      audioPreviewRef.current.pause();
      setIsPreviewPlaying(false);
    }

    setAnalysisError(null);
    setIsAnalyzing(true);
    setProgressPct(12);
    setProgressStage('Đang khởi tạo bộ giải mã âm thanh đa định dạng...');

    try {
      const result = await analyzeUploadedAudio(file, (stage, pct) => {
        setProgressStage(stage);
        setProgressPct(pct);
      });

      onTrackAnalyzed(result);
      setCustomTitle(result.title);
      setCustomBpm(result.estimatedBpm);
      setPreviewProgress(0);
      setPreviewCurrentTime(0);
      soundFX.playFeverActivate();

      // If user enabled "Vào chơi ngay khi tải nhạc", immediately launch the 3D Stage!
      if (autoPlayOnUpload) {
        const beatmap = buildBeatmapFromAnalysis(
          result,
          selectedInstrument,
          difficulty,
          densityMultiplier
        );
        onPlayAnalyzedTrack({
          audioUrl: result.audioUrl,
          audioBlob: result.audioBlob,
          beatmap,
          title: result.title,
          artist: `Uploaded · ${result.formatLabel}`,
          bpm: result.estimatedBpm,
          difficulty,
          sections: result.sections,
          analyzedData: result,
          densityMultiplier,
        });
      }
    } catch (err) {
      console.warn('Universal audio/format analysis notice:', err);
      setAnalysisError(
        'Không thể giải mã file này. Vui lòng kiểm tra lại file âm nhạc/video và thử lại.'
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
  };

  const compiledBeatmap = useMemo(() => {
    if (!analysis) return [];
    const modifiedAnalysis: AnalyzedTrackData = {
      ...analysis,
      estimatedBpm: customBpm,
    };
    return buildBeatmapFromAnalysis(
      modifiedAnalysis,
      selectedInstrument,
      difficulty,
      densityMultiplier
    );
  }, [analysis, selectedInstrument, difficulty, customBpm, densityMultiplier]);

  const chartStats = useMemo(() => {
    if (!compiledBeatmap.length || !analysis) {
      return {
        totalNotes: 0,
        chords: 0,
        sustains: 0,
        nps: '0.0',
        laneCounts: [0, 0, 0, 0, 0, 0],
      };
    }
    let chords = 0;
    let sustains = 0;
    const laneCounts = [0, 0, 0, 0, 0, 0];
    for (let i = 0; i < compiledBeatmap.length; i++) {
      const n = compiledBeatmap[i];
      if (n.column >= 0 && n.column < 6) {
        laneCounts[n.column]++;
      }
      if (n.duration) sustains++;
      if (
        i > 0 &&
        Math.abs(n.time - compiledBeatmap[i - 1].time) < 0.008
      ) {
        chords++;
      }
    }
    const nps = (compiledBeatmap.length / Math.max(1, analysis.duration)).toFixed(1);
    return {
      totalNotes: compiledBeatmap.length,
      chords,
      sustains,
      nps,
      laneCounts,
    };
  }, [compiledBeatmap, analysis]);

  const togglePreviewPlay = () => {
    const audio = audioPreviewRef.current;
    if (!audio || !analysis) return;
    soundFX.playUiClick(740);
    if (audio.paused) {
      audio.play().catch(() => {});
      setIsPreviewPlaying(true);
    } else {
      audio.pause();
      setIsPreviewPlaying(false);
    }
  };

  const handleSeekWaveform = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioPreviewRef.current;
    if (!audio || !analysis) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickRatio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const targetTime = clickRatio * analysis.duration;
    audio.currentTime = targetTime;
    setPreviewCurrentTime(targetTime);
    setPreviewProgress(clickRatio * 100);
    if (audio.paused) {
      audio.play().catch(() => {});
      setIsPreviewPlaying(true);
    }
  };

  const handleExportBeatmap = () => {
    if (!compiledBeatmap.length || !analysis) return;
    soundFX.playUiClick(840);
    const data = JSON.stringify(compiledBeatmap, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(customTitle || analysis.title).toLowerCase().replace(/\s+/g, '-')}-${selectedInstrument}-${difficulty}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportWavMaster = () => {
    if (!analysis) return;
    soundFX.playUiClick(840);
    const url = URL.createObjectURL(analysis.audioBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(customTitle || analysis.title).toLowerCase().replace(/\s+/g, '-')}-master.wav`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleLaunchStage = () => {
    if (!analysis || !compiledBeatmap.length) return;
    if (audioPreviewRef.current) {
      audioPreviewRef.current.pause();
      setIsPreviewPlaying(false);
    }
    soundFX.playFeverActivate();
    const modifiedAnalysis: AnalyzedTrackData = {
      ...analysis,
      estimatedBpm: customBpm,
      title: customTitle.trim() || analysis.title,
    };
    onPlayAnalyzedTrack({
      audioUrl: analysis.audioUrl,
      audioBlob: analysis.audioBlob,
      beatmap: compiledBeatmap,
      title: customTitle.trim() || analysis.title,
      artist: `Uploaded · ${analysis.formatLabel}`,
      bpm: customBpm,
      difficulty,
      sections: analysis.sections,
      analyzedData: modifiedAnalysis,
      densityMultiplier,
    });
  };

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Sample up to 220 notes for the visual 4-lane timeline roll so it stays ultra-crisp
  const previewTimelineNotes = useMemo(() => {
    if (!compiledBeatmap.length || !analysis) return [];
    const maxRender = 240;
    const step = Math.max(1, Math.floor(compiledBeatmap.length / maxRender));
    const sampled: Note[] = [];
    for (let i = 0; i < compiledBeatmap.length; i += step) {
      sampled.push(compiledBeatmap[i]);
    }
    return sampled;
  }, [compiledBeatmap, analysis]);

  return (
    <div className="space-y-6">
      <input
        ref={fileInputRef}
        type="file"
        accept={ALL_ACCEPT_ATTRIBUTE}
        onChange={handleFileChange}
        className="hidden"
      />

      {analysis && (
        <audio
          ref={audioPreviewRef}
          src={analysis.audioUrl}
          onTimeUpdate={(e) => {
            const el = e.currentTarget;
            if (el.duration > 0) {
              setPreviewCurrentTime(el.currentTime);
              setPreviewProgress((el.currentTime / el.duration) * 100);
            }
          }}
          onEnded={() => setIsPreviewPlaying(false)}
        />
      )}

      {/* Session Uploaded Tracks Vault Bar (When user has uploaded 1+ tracks) */}
      {uploadedTracks.length > 0 && !isAnalyzing && (
        <div className="bg-[#11131A] border border-white/[0.08] rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-xs font-mono text-amber-400 font-semibold flex items-center gap-1.5">
              <Music size={14} />
              <span>KHO NHẠC ĐÃ TẢI LÊN ({uploadedTracks.length}):</span>
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              {uploadedTracks.map((item, idx) => {
                const isCurrent = analysis?.audioUrl === item.audioUrl;
                const itemGenre = SMART_GENRE_CATALOG[item.genreId];
                return (
                  <button
                    key={`${item.fileName}-${idx}`}
                    type="button"
                    onClick={() => {
                      soundFX.playUiClick(720);
                      onSelectUploadedTrack(item);
                      if (!item.allowedInstruments.includes(selectedInstrument)) {
                        onSelectInstrument(item.allowedInstruments[0]);
                      }
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-2 cursor-pointer ${
                      isCurrent
                        ? 'bg-amber-400 text-black font-bold'
                        : 'bg-[#08090C] border border-white/10 text-zinc-300 hover:border-white/30'
                    }`}
                  >
                    <span className="truncate max-w-[160px]">{item.title}</span>
                    <span
                      className={`font-mono text-[10px] px-1.5 py-0.5 rounded ${
                        isCurrent
                          ? 'bg-black/20 text-black font-bold'
                          : 'bg-white/[0.06] text-amber-300'
                      }`}
                    >
                      {itemGenre?.shortBadge || item.vietnameseGenreName}
                    </span>
                    <span
                      className={`font-mono text-[10px] ${
                        isCurrent ? 'text-black/80' : 'text-zinc-500'
                      }`}
                    >
                      {item.estimatedBpm} BPM
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-3.5 py-2 bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 rounded-xl text-xs font-semibold text-white flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
          >
            <Upload size={14} className="text-amber-400" />
            <span>+ Tải Thêm Bản Nhạc Mới</span>
          </button>
        </div>
      )}

      {/* Upload Dropzone Card (Shown when no track is active OR when user clicks to upload) */}
      {!analysis && !isAnalyzing && (
        <div className="bg-[#11131A] border border-white/[0.08] rounded-2xl p-6 lg:p-8 space-y-6">
          {/* Pre-Upload Quick Stage Configuration Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-white/[0.08]">
            <div>
              <div className="text-xs font-mono text-amber-400">
                SMART DSP AUTO-GENRE CLASSIFIER & UPLOAD DECK
              </div>
              <h2 className="font-display text-2xl font-extrabold text-white mt-0.5">
                Tải Bản Nhạc Lên · Tự Động Chia Thể Loại & Chọn 3 Nhạc Cụ Phù Hợp
              </h2>
            </div>

            {/* Instant Stage Mode Toggle */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5 p-1 bg-[#08090C] border border-white/[0.08] rounded-xl">
                {(['easy', 'normal', 'hard'] as Difficulty[]).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => {
                      soundFX.playUiClick(740);
                      setDifficulty(d);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors cursor-pointer ${
                      difficulty === d
                        ? 'bg-amber-400 text-black font-bold'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => {
                  soundFX.playUiClick(800);
                  setAutoPlayOnUpload((prev) => !prev);
                }}
                className={`px-4 py-2 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                  autoPlayOnUpload
                    ? 'bg-emerald-500/15 border-emerald-400 text-emerald-300'
                    : 'bg-[#08090C] border-white/10 text-zinc-300 hover:border-white/25'
                }`}
              >
                <Zap size={14} className={autoPlayOnUpload ? 'text-emerald-400' : 'text-zinc-500'} />
                <span>
                  {autoPlayOnUpload
                    ? 'Vào Sân Khấu Ngay Khi Tải Lên: BẬT'
                    : 'Xem Trước Phòng Thu Trước Khi Chơi'}
                </span>
              </button>
            </div>
          </div>

          {/* Interactive Drag & Drop Stage Portal */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-2xl p-8 lg:p-12 text-center transition-all cursor-pointer flex flex-col items-center justify-center overflow-hidden ${
              isDragging
                ? 'border-amber-400 bg-amber-400/10 scale-[0.995]'
                : 'border-white/15 bg-[#08090C] hover:border-amber-400/60 hover:bg-white/[0.02]'
            }`}
          >
            <div
              className="w-16 h-16 rounded-2xl bg-[#11131A] border-2 flex items-center justify-center mb-4 transition-transform group-hover:scale-105"
              style={{ borderColor: instMeta.accentHex }}
            >
              <Upload size={28} style={{ color: instMeta.accentHex }} />
            </div>

            <div className={`text-xs font-mono ${instMeta.badgeClass} mb-1`}>
              TỰ ĐỘNG NHẬN DIỆN THỂ LOẠI & ĐỀ XUẤT TỐI ĐA 3 NHẠC CỤ PHÙ HỢP
            </div>

            <h3 className="font-display text-2xl sm:text-3xl font-extrabold text-white mb-2">
              Kéo Thả Hoặc Chọn Bất Kỳ File Nhạc Nào Để Vào Chơi
            </h3>

            <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl leading-relaxed mb-6">
              Hệ thống DSP tự động phân tích nhịp BPM, độ động và phổ tần số (Trầm/Trung/Cao) để
              xếp bài hát vào đúng thể loại (<strong className="text-white">Rock, EDM, Jazz, K-Pop, Giao Hưởng, Hip-Hop</strong>) và lọc ra{' '}
              <strong className="text-amber-300">tối đa 3 nhạc cụ phù hợp nhất</strong> với Sheet 6 phím tròn riêng biệt.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setAutoPlayOnUpload(false);
                  fileInputRef.current?.click();
                }}
                className="px-6 py-3.5 bg-amber-400 hover:bg-amber-300 text-black font-display font-bold text-sm rounded-xl transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Upload size={16} />
                <span>Chọn File Nhạc & Tự Phân Loại Thể Loại</span>
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setAutoPlayOnUpload(true);
                  fileInputRef.current?.click();
                }}
                className="px-6 py-3.5 bg-white/[0.08] hover:bg-white/[0.14] border border-white/15 text-white font-display font-bold text-sm rounded-xl transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Play size={16} className="text-amber-400 fill-current" />
                <span>Tải Nhạc & Vào Sân Khấu Chơi Ngay</span>
              </button>
            </div>
          </div>

          {/* 4-Category Supported Formats Reference Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {SUPPORTED_FORMAT_CATEGORIES.map((cat) => (
              <div
                key={cat.category}
                className="bg-[#08090C] border border-white/[0.06] rounded-xl p-4 flex flex-col justify-between"
              >
                <div>
                  <div className="text-xs font-display font-bold text-white mb-1">
                    {cat.category}
                  </div>
                  <div className="text-xs font-mono text-amber-400 mb-2">
                    {cat.formats.join(' · ')}
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    {cat.description}
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-white/[0.05] text-[10px] font-mono text-zinc-500 truncate">
                  {cat.extensions.join('  ')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DSP Progress State */}
      {isAnalyzing && (
        <div className="bg-[#11131A] border border-white/[0.08] rounded-2xl p-10 text-center">
          <div className="text-xs font-mono text-amber-400 mb-2">
            SMART GENRE CLASSIFIER & DSP ENGINE ACTIVE
          </div>
          <h3 className="font-display text-2xl font-bold text-white mb-4">
            {progressStage}
          </h3>
          <div className="max-w-md mx-auto h-3 bg-[#08090C] rounded-xl overflow-hidden border border-white/10 mb-2">
            <div
              className="h-full bg-gradient-to-r from-cyan-400 via-amber-400 to-orange-500 transition-all duration-200"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <span className="font-mono text-xs text-zinc-400 tabular-nums">
            {progressPct}% · Đang tự động phân loại thể loại & chọn 3 nhạc cụ phù hợp
          </span>
        </div>
      )}

      {/* Analyzed Song Stage Launch & Studio Mastering Deck */}
      {analysis && !isAnalyzing && (
        <div className="bg-[#11131A] border border-white/[0.08] rounded-2xl p-6 lg:p-8 space-y-6">
          {/* TOP HERO LAUNCH BANNER: Immediate Stage Entry + Auto-Genre + Max 3 Suitable Instruments */}
          <div
            className={`bg-[#08090C] border-2 ${instMeta.borderClass} rounded-2xl p-5 lg:p-6 flex flex-col xl:flex-row xl:items-center justify-between gap-6`}
          >
            <div className="space-y-2.5 flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 size={14} />
                  <span>TỰ ĐỘNG XẾP LOẠI: {analysis.vietnameseGenreName.toUpperCase()} ({analysis.confidencePct}%)</span>
                </span>
                <span aria-hidden="true" className="text-zinc-600">·</span>
                <span className={instMeta.badgeClass}>
                  {analysis.formatLabel.toUpperCase()} ({analysis.fileSizeMb} MB)
                </span>
                <span aria-hidden="true" className="text-zinc-600">·</span>
                <span className="text-zinc-300 tabular-nums">
                  {formatDuration(analysis.duration)} · {customBpm} BPM · {chartStats.totalNotes} Notes
                </span>
              </div>

              <div className="text-xs text-zinc-400 font-mono">
                {analysis.autoClassifyReason}
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="font-display text-2xl sm:text-3xl font-extrabold text-white bg-[#11131A] border border-white/15 focus:border-amber-400 rounded-xl px-3.5 py-1.5 focus:outline-none w-full max-w-lg"
                  aria-label="Tên bài hát"
                />
              </div>

              {/* Strictly Max 3 Suitable Instruments for this Auto-Classified Genre */}
              <div className="pt-1 flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-mono text-amber-400 font-bold mr-1">
                  3 Nhạc cụ phù hợp ({analysis.vietnameseGenreName}):
                </span>
                {analysis.allowedInstruments.slice(0, 3).map((instKey, idx) => {
                  const active = selectedInstrument === instKey;
                  const m = INSTRUMENT_META[instKey];
                  return (
                    <button
                      key={instKey}
                      type="button"
                      onClick={() => onSelectInstrument(instKey)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                        active
                          ? 'bg-amber-400 text-black font-bold ring-2 ring-amber-300/60'
                          : 'bg-[#11131A] border border-white/15 text-zinc-200 hover:border-amber-400/50'
                      }`}
                    >
                      <span className="font-mono text-[10px] opacity-75">#{idx + 1}</span>
                      <span>{m.name} ({m.vietnameseName})</span>
                    </button>
                  );
                })}
              </div>
            </div>


            {/* Primary Giant Stage Launch CTA */}
            <div className="flex flex-col sm:flex-row xl:flex-col items-stretch sm:items-center xl:items-end gap-3 shrink-0">
              <button
                type="button"
                onClick={handleLaunchStage}
                className="px-8 py-4 bg-amber-400 hover:bg-amber-300 text-black font-display font-extrabold text-base sm:text-lg rounded-2xl transition-transform active:scale-98 flex items-center justify-center gap-3 cursor-pointer shadow-lg shadow-amber-400/15"
              >
                <Play size={22} className="fill-current" />
                <span>VÀO SÂN KHẤU CHƠI NGAY ({instMeta.vietnameseName.toUpperCase()})</span>
              </button>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={togglePreviewPlay}
                  className="px-3.5 py-2 bg-[#11131A] hover:bg-white/[0.08] border border-white/15 text-xs font-semibold text-white rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  {isPreviewPlaying ? (
                    <>
                      <Pause size={14} className="text-amber-400" />
                      <span>Tạm Dừng Nghe Thử</span>
                    </>
                  ) : (
                    <>
                      <Play size={14} className="text-emerald-400 fill-current" />
                      <span>Nghe Thử Bản Nhạc</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3.5 py-2 bg-[#11131A] hover:bg-white/[0.08] border border-white/15 text-xs font-semibold text-zinc-300 hover:text-white rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw size={14} />
                  <span>Đổi File Nhạc Khác</span>
                </button>
              </div>
            </div>
          </div>

          {/* Interactive Waveform + Live 4-Lane Rounded-Corner Beatmap Preview Roll */}
          <div className="bg-[#08090C] border border-white/[0.06] rounded-2xl p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={togglePreviewPlay}
                  className="w-10 h-10 rounded-xl bg-amber-400 hover:bg-amber-300 text-black flex items-center justify-center transition-colors cursor-pointer shrink-0"
                  title={isPreviewPlaying ? 'Tạm dừng' : 'Nghe thử & xem nốt chạy'}
                >
                  {isPreviewPlaying ? (
                    <Pause size={17} />
                  ) : (
                    <Play size={17} className="ml-0.5 fill-current" />
                  )}
                </button>
                <div>
                  <div className="text-xs font-mono text-white font-semibold">
                    BIỂU ĐỒ SÓNG ÂM & SHEET 6 PHÍM TRÒN ({instMeta.name.toUpperCase()})
                  </div>
                  <div className="text-[11px] text-zinc-400 font-mono tabular-nums">
                    {formatDuration(previewCurrentTime)} / {formatDuration(analysis.duration)} · Bấm vào bất kỳ vị trí nào trên sóng âm để tua nhanh
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs font-mono tabular-nums">
                <span className="text-cyan-400">
                  Trầm/Kick: {analysis.bandProfile.lowEnergyPct}%
                </span>
                <span className="text-emerald-400">
                  Trung/Chord: {analysis.bandProfile.midEnergyPct}%
                </span>
                <span className="text-amber-400">
                  Cao/Cymbal: {analysis.bandProfile.highEnergyPct}%
                </span>
              </div>
            </div>

            {/* Waveform Scrubber */}
            <div
              onClick={handleSeekWaveform}
              className="relative h-24 flex items-end gap-[2px] pt-3 pb-2 px-2 bg-[#11131A] rounded-xl overflow-hidden cursor-pointer select-none border border-white/[0.05]"
            >
              {analysis.waveformPeaks.map((peak, idx) => {
                const barPct = (idx / analysis.waveformPeaks.length) * 100;
                const isPassed = barPct <= previewProgress;
                const hPct = Math.max(8, Math.round(peak * 95));
                return (
                  <div
                    key={idx}
                    className={`flex-1 rounded-t transition-colors ${
                      isPassed
                        ? 'bg-amber-400'
                        : peak > 0.78
                        ? 'bg-rose-400/80'
                        : peak > 0.45
                        ? 'bg-cyan-400/75'
                        : 'bg-zinc-600/60'
                    }`}
                    style={{ height: `${hPct}%` }}
                  />
                );
              })}

              <div
                className="absolute top-0 bottom-0 w-0.5 bg-white pointer-events-none"
                style={{ left: `${previewProgress}%` }}
              />
            </div>

            {/* Live 6-Key Round Beatmap Roll Synced to Waveform (Dedicated Sheet per Instrument) */}
            <div
              onClick={handleSeekWaveform}
              className="relative bg-[#11131A] border border-white/[0.06] rounded-xl p-3.5 cursor-pointer overflow-hidden space-y-2.5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-white/[0.06]">
                <div>
                  <div className={`text-[11px] font-mono font-bold ${instMeta.badgeClass}`}>
                    {instMeta.sheetTitle} · {instMeta.sheetStyleBadge}
                  </div>
                  <div className="text-[11px] text-zinc-400 mt-0.5">
                    {instMeta.sheetMechanics}
                  </div>
                </div>
                <span className="text-[10px] font-mono text-amber-400 shrink-0">
                  6 PHÍM (A · S · D · ← · ↓ · →) · {chartStats.totalNotes} NỐT
                </span>
              </div>

              <div className="space-y-1.5 relative">
                {[0, 1, 2, 3, 4, 5].map((laneIdx) => {
                  const laneColor = instMeta.laneColors[laneIdx];
                  return (
                    <div
                      key={laneIdx}
                      className="relative h-5 bg-[#08090C] rounded-md border border-white/[0.04] flex items-center overflow-hidden"
                    >
                      <span
                        className="text-[9px] font-mono font-bold px-2 z-10 shrink-0 w-28 truncate flex items-center gap-1"
                        style={{ color: laneColor }}
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full inline-block shrink-0"
                          style={{ backgroundColor: laneColor }}
                        />
                        <span>
                          [{SIX_KEY_LABELS[laneIdx]}] {instMeta.laneLabels[laneIdx].split(' ')[0]} ({chartStats.laneCounts[laneIdx]})
                        </span>
                      </span>

                      <div className="relative flex-1 h-full">
                        {previewTimelineNotes
                          .filter((n) => n.column === laneIdx)
                          .map((n, nIdx) => {
                            const leftPct = (n.time / Math.max(1, analysis.duration)) * 100;
                            const widthPct = n.duration
                              ? Math.max(0.6, (n.duration / analysis.duration) * 100)
                              : 0.65;
                            return (
                              <div
                                key={nIdx}
                                className="absolute top-1 bottom-1 rounded-full"
                                style={{
                                  left: `${leftPct}%`,
                                  width: `${widthPct}%`,
                                  minWidth: '6px',
                                  backgroundColor: laneColor,
                                }}
                              />
                            );
                          })}
                      </div>
                    </div>
                  );
                })}

                {/* Playhead line across the 6 lanes */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-white pointer-events-none z-20"
                  style={{ left: `${previewProgress}%` }}
                />
              </div>
            </div>

            {/* Song Sections Timeline */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {analysis.sections.map((sec, idx) => (
                <div
                  key={idx}
                  className="bg-[#11131A] border border-white/[0.06] rounded-xl px-3 py-2 text-left"
                >
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-zinc-300 font-semibold truncate">{sec.name}</span>
                    <span
                      className={
                        sec.energy >= 8 ? 'text-amber-400 font-bold' : 'text-cyan-400'
                      }
                    >
                      E{sec.energy}/10
                    </span>
                  </div>
                  <div className="text-[10px] font-mono text-zinc-500 tabular-nums mt-0.5">
                    {formatDuration(sec.startTime)}–{formatDuration(sec.endTime)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Beatmap Compiler Calibration Controls & Telemetry Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            <div className="lg:col-span-7 bg-[#08090C] border border-white/[0.06] rounded-2xl p-5 space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
                  <Sliders size={14} />
                  <span>TUỲ CHỈNH ĐỘ KHÓ & MẬT ĐỘ NỐT TRƯỚC KHI VÀO SÂN KHẤU</span>
                </div>
                <span className="text-xs font-mono text-amber-400">
                  {instMeta.name.toUpperCase()}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="block text-xs font-mono text-zinc-400 mb-2">
                    CẤP ĐỘ CHART (DIFFICULTY)
                  </span>
                  <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#11131A] border border-white/[0.06] rounded-xl">
                    {(['easy', 'normal', 'hard'] as Difficulty[]).map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => {
                          soundFX.playUiClick(780);
                          setDifficulty(d);
                        }}
                        className={`py-2 px-2 rounded-lg text-xs font-semibold capitalize transition-colors cursor-pointer ${
                          difficulty === d
                            ? 'bg-amber-400 text-black font-bold'
                            : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="block text-xs font-mono text-zinc-400 mb-2">
                    NHỊP ĐỘ BÀI HÁT (BPM GRID)
                  </span>
                  <div className="flex items-center justify-between p-1 bg-[#11131A] border border-white/[0.06] rounded-xl px-2">
                    <button
                      type="button"
                      onClick={() => setCustomBpm((b) => Math.max(60, b - 1))}
                      className="w-8 h-8 rounded-lg bg-[#08090C] hover:bg-white/10 border border-white/10 text-white text-sm font-bold cursor-pointer"
                    >
                      -
                    </button>
                    <span className="font-mono text-base font-bold text-cyan-400 tabular-nums">
                      {customBpm} BPM
                    </span>
                    <button
                      type="button"
                      onClick={() => setCustomBpm((b) => Math.min(220, b + 1))}
                      className="w-8 h-8 rounded-lg bg-[#08090C] hover:bg-white/10 border border-white/10 text-white text-sm font-bold cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Note Density Selector */}
              <div>
                <span className="block text-xs font-mono text-zinc-400 mb-2">
                  MẬT ĐỘ NỐT TRÊN SÂN KHẤU (NOTE DENSITY MULTIPLIER)
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {DENSITY_PRESETS.map((p) => {
                    const active = densityMultiplier === p.value;
                    return (
                      <button
                        key={p.value}
                        type="button"
                        onClick={() => {
                          soundFX.playUiClick(820);
                          setDensityMultiplier(p.value);
                        }}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          active
                            ? 'bg-[#151926] border-cyan-400 text-white'
                            : 'bg-[#11131A] border-white/[0.06] text-zinc-400 hover:border-white/20'
                        }`}
                      >
                        <div className="font-mono text-xs font-bold text-white">{p.label}</div>
                        <div className="text-[10px] text-zinc-400 mt-0.5 truncate">{p.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 bg-[#08090C] border border-white/[0.06] rounded-2xl p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs font-mono text-zinc-400 mb-3">
                  <span>THỐNG KÊ BẢN ĐỒ NỐT ({instMeta.vietnameseName.toUpperCase()})</span>
                  <Activity size={14} className="text-amber-400" />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono tabular-nums">
                  <div className="bg-[#11131A] border border-white/[0.05] rounded-xl p-3">
                    <div className="text-[10px] text-zinc-500">TỔNG NỐT</div>
                    <div className="text-xl font-bold text-white mt-0.5">
                      {chartStats.totalNotes}
                    </div>
                  </div>
                  <div className="bg-[#11131A] border border-white/[0.05] rounded-xl p-3">
                    <div className="text-[10px] text-zinc-500">NỐT ĐÔI</div>
                    <div className="text-xl font-bold text-amber-400 mt-0.5">
                      {chartStats.chords}
                    </div>
                  </div>
                  <div className="bg-[#11131A] border border-white/[0.05] rounded-xl p-3">
                    <div className="text-[10px] text-zinc-500">NGÂN DÀI</div>
                    <div className="text-xl font-bold text-cyan-400 mt-0.5">
                      {chartStats.sustains}
                    </div>
                  </div>
                  <div className="bg-[#11131A] border border-white/[0.05] rounded-xl p-3">
                    <div className="text-[10px] text-zinc-500">TỐC ĐỘ</div>
                    <div className="text-xl font-bold text-emerald-400 mt-0.5">
                      {chartStats.nps}/s
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-2.5">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleExportBeatmap}
                    className="px-3 py-2 bg-[#11131A] hover:bg-white/[0.08] border border-white/10 text-zinc-200 text-xs font-mono font-semibold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download size={13} />
                    <span>JSON Chart</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleExportWavMaster}
                    className="px-3 py-2 bg-[#11131A] hover:bg-white/[0.08] border border-white/10 text-zinc-200 text-xs font-mono font-semibold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <FileAudio size={13} />
                    <span>WAV Master</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleLaunchStage}
                  className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-black font-display font-bold text-xs sm:text-sm rounded-xl transition-transform active:scale-98 flex items-center gap-2 cursor-pointer"
                >
                  <Play size={15} className="fill-current" />
                  <span>Bắt Đầu Chơi</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {analysisError && (
        <div className="p-4 bg-rose-950/60 border border-rose-500/50 rounded-xl text-rose-200 text-xs font-mono">
          {analysisError}
        </div>
      )}
    </div>
  );
}
