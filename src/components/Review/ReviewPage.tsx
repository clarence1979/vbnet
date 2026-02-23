import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Clock,
  User,
  Loader2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { fetchSessionByToken } from '../../services/sessionRecorder';

interface Snapshot {
  id: string;
  code: string;
  elapsed_seconds: number;
  captured_at: string;
}

interface SessionData {
  session: {
    id: string;
    student_name: string;
    started_at: string;
    submitted_at: string;
  };
  snapshots: Snapshot[];
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function ReviewPage({ token }: { token: string }) {
  const [data, setData] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const playIntervalRef = useRef<number | null>(null);
  const sliderRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchSessionByToken(token).then((result) => {
      if (result && result.snapshots.length > 0) {
        setData(result as SessionData);
      } else {
        setError('Session not found or has no recorded activity.');
      }
      setLoading(false);
    });
  }, [token]);

  const maxElapsed = useMemo(() => {
    if (!data) return 0;
    return data.snapshots[data.snapshots.length - 1]?.elapsed_seconds || 0;
  }, [data]);

  const stopPlayback = useCallback(() => {
    setPlaying(false);
    if (playIntervalRef.current) {
      clearInterval(playIntervalRef.current);
      playIntervalRef.current = null;
    }
  }, []);

  const startPlayback = useCallback(() => {
    if (!data || data.snapshots.length <= 1) return;
    setPlaying(true);
  }, [data]);

  useEffect(() => {
    if (!playing || !data) return;

    if (currentIndex >= data.snapshots.length - 1) {
      setCurrentIndex(0);
    }

    playIntervalRef.current = window.setInterval(() => {
      setCurrentIndex((prev) => {
        if (prev >= data.snapshots.length - 1) {
          stopPlayback();
          return prev;
        }
        return prev + 1;
      });
    }, 1000 / playbackSpeed);

    return () => {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
        playIntervalRef.current = null;
      }
    };
  }, [playing, playbackSpeed, data, stopPlayback, currentIndex]);

  const togglePlayback = useCallback(() => {
    if (playing) {
      stopPlayback();
    } else {
      startPlayback();
    }
  }, [playing, stopPlayback, startPlayback]);

  const stepBack = useCallback(() => {
    stopPlayback();
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  }, [stopPlayback]);

  const stepForward = useCallback(() => {
    if (!data) return;
    stopPlayback();
    setCurrentIndex((prev) => Math.min(data.snapshots.length - 1, prev + 1));
  }, [data, stopPlayback]);

  const handleSliderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    stopPlayback();
    setCurrentIndex(parseInt(e.target.value, 10));
  }, [stopPlayback]);

  const cycleSpeed = useCallback(() => {
    setPlaybackSpeed((prev) => {
      if (prev === 1) return 2;
      if (prev === 2) return 4;
      if (prev === 4) return 8;
      return 1;
    });
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ') { e.preventDefault(); togglePlayback(); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); stepBack(); }
      if (e.key === 'ArrowRight') { e.preventDefault(); stepForward(); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlayback, stepBack, stepForward]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#1E1E1E]">
        <div className="flex items-center gap-3 text-[#CCC]">
          <Loader2 size={24} className="animate-spin" />
          <span className="text-sm">Loading session...</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#1E1E1E]">
        <div className="bg-[#2D2D2D] rounded-lg p-8 max-w-md text-center space-y-3">
          <AlertTriangle size={32} className="text-amber-400 mx-auto" />
          <p className="text-sm text-[#CCC]">{error || 'Session not found.'}</p>
          <button
            onClick={() => { window.location.href = window.location.pathname; }}
            className="text-xs text-[#0078D4] hover:underline"
          >
            Go to editor
          </button>
        </div>
      </div>
    );
  }

  const currentSnapshot = data.snapshots[currentIndex];
  const progress = data.snapshots.length > 1
    ? (currentIndex / (data.snapshots.length - 1)) * 100
    : 100;

  return (
    <div className="h-screen flex flex-col bg-[#1E1E1E] text-[#CCC]">
      <div className="h-12 bg-[#252526] border-b border-[#3C3C3C] flex items-center px-4 justify-between shrink-0">
        <div className="flex items-center gap-4">
          <span className="text-sm font-semibold text-white">Session Review</span>
          <div className="flex items-center gap-1.5 text-xs text-[#999]">
            <User size={12} />
            <span>{data.session.student_name || 'Unknown'}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-[#999]">
            <Clock size={12} />
            <span>{new Date(data.session.started_at).toLocaleString()}</span>
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs text-[#999]">
          <span>{data.snapshots.length} snapshots</span>
          <span>Duration: {formatTime(maxElapsed)}</span>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-auto">
          <CodeDisplay code={currentSnapshot?.code || ''} />
        </div>
      </div>

      <div className="shrink-0 bg-[#252526] border-t border-[#3C3C3C] px-4 py-3 space-y-2">
        <div className="flex items-center gap-3">
          <button
            onClick={stepBack}
            disabled={currentIndex === 0}
            className="p-1.5 rounded hover:bg-[#3C3C3C] transition-colors disabled:opacity-30"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={togglePlayback}
            className="p-2 rounded-full bg-[#0078D4] hover:bg-[#006CBE] transition-colors text-white"
          >
            {playing ? <Pause size={16} /> : <Play size={16} />}
          </button>
          <button
            onClick={stepForward}
            disabled={currentIndex >= data.snapshots.length - 1}
            className="p-1.5 rounded hover:bg-[#3C3C3C] transition-colors disabled:opacity-30"
          >
            <ChevronRight size={16} />
          </button>
          <button
            onClick={cycleSpeed}
            className="px-2 py-1 rounded text-xs font-mono bg-[#333] hover:bg-[#444] transition-colors min-w-[40px] text-center"
          >
            {playbackSpeed}x
          </button>

          <div className="flex-1 flex items-center gap-3">
            <span className="text-xs font-mono min-w-[36px] text-right">
              {formatTime(currentSnapshot?.elapsed_seconds || 0)}
            </span>
            <div className="flex-1 relative">
              <div className="h-1 bg-[#333] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#0078D4] rounded-full transition-all duration-150"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <input
                ref={sliderRef}
                type="range"
                min={0}
                max={data.snapshots.length - 1}
                value={currentIndex}
                onChange={handleSliderChange}
                className="absolute inset-0 w-full opacity-0 cursor-pointer"
              />
            </div>
            <span className="text-xs font-mono min-w-[36px]">
              {formatTime(maxElapsed)}
            </span>
          </div>

          <div className="text-xs text-[#999]">
            {currentIndex + 1} / {data.snapshots.length}
          </div>
        </div>

        <SnapshotTimeline
          snapshots={data.snapshots}
          currentIndex={currentIndex}
          onSelect={(i) => { stopPlayback(); setCurrentIndex(i); }}
        />
      </div>
    </div>
  );
}

function CodeDisplay({ code }: { code: string }) {
  const lines = code.split('\n');

  return (
    <div className="font-mono text-[13px] leading-5 p-4">
      <table className="border-collapse">
        <tbody>
          {lines.map((line, i) => (
            <tr key={i} className="hover:bg-[#2A2D2E]">
              <td className="pr-4 text-right text-[#858585] select-none align-top w-[1%] whitespace-nowrap">
                {i + 1}
              </td>
              <td className="whitespace-pre-wrap break-all text-[#D4D4D4]">
                {line || '\u00A0'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SnapshotTimeline({
  snapshots,
  currentIndex,
  onSelect,
}: {
  snapshots: Snapshot[];
  currentIndex: number;
  onSelect: (index: number) => void;
}) {
  if (snapshots.length <= 1) return null;

  const maxElapsed = snapshots[snapshots.length - 1].elapsed_seconds || 1;

  return (
    <div className="relative h-6 bg-[#1E1E1E] rounded overflow-hidden">
      {snapshots.map((snap, i) => {
        const left = (snap.elapsed_seconds / maxElapsed) * 100;
        const isActive = i === currentIndex;
        const hasChange = i === 0 || snap.code !== snapshots[i - 1].code;

        return (
          <button
            key={snap.id}
            onClick={() => onSelect(i)}
            title={`${formatTime(snap.elapsed_seconds)}${hasChange ? ' (code changed)' : ''}`}
            className="absolute top-0 h-full transition-colors"
            style={{
              left: `${left}%`,
              width: '3px',
              backgroundColor: isActive
                ? '#0078D4'
                : hasChange
                ? '#CC6633'
                : '#444',
            }}
          />
        );
      })}
    </div>
  );
}
