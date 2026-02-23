import { useState, useCallback, useEffect, useRef } from 'react';
import { CircleDot, Send, Copy, Check, Loader2 } from 'lucide-react';
import { useProjectStore } from '../../store/useProjectStore';
import {
  startSession,
  beginRecording,
  submitSession,
  isRecording,
  captureAndFlush,
  stopRecording,
} from '../../services/sessionRecorder';

export default function SessionPanel() {
  const [state, setState] = useState<'idle' | 'recording' | 'submitting' | 'submitted'>('idle');
  const [studentName, setStudentName] = useState('');
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const userCode = useProjectStore((s) => s.userCode);
  const userCodeRef = useRef(userCode);

  useEffect(() => {
    userCodeRef.current = userCode;
  }, [userCode]);

  const handleStartClick = useCallback(() => {
    setShowNamePrompt(true);
    setError('');
  }, []);

  const handleBeginSession = useCallback(async () => {
    if (!studentName.trim()) {
      setError('Please enter your name');
      return;
    }
    setError('');
    try {
      await startSession(studentName.trim());
      beginRecording(() => userCodeRef.current);
      setState('recording');
      setShowNamePrompt(false);
    } catch (e: any) {
      setError(e.message || 'Failed to start session');
    }
  }, [studentName]);

  const handleSubmit = useCallback(async () => {
    setState('submitting');
    try {
      await captureAndFlush(userCodeRef.current);
      const token = await submitSession();
      if (token) {
        const link = `${window.location.origin}${window.location.pathname}?review=${token}`;
        setShareLink(link);
        setState('submitted');
      }
    } catch (e: any) {
      setError(e.message || 'Failed to submit');
      setState('recording');
    }
  }, []);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  }, [shareLink]);

  const handleReset = useCallback(() => {
    setState('idle');
    setStudentName('');
    setShareLink('');
    setCopied(false);
    setError('');
  }, []);

  useEffect(() => {
    return () => {
      if (isRecording()) stopRecording();
    };
  }, []);

  if (state === 'submitted') {
    return (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl w-[480px] overflow-hidden">
          <div className="bg-[#107C10] px-5 py-3">
            <span className="text-white text-sm font-semibold">Session Submitted</span>
          </div>
          <div className="p-5 space-y-4">
            <p className="text-sm text-[#333]">
              Your coding session has been recorded. Share this link with your teacher:
            </p>
            <div className="flex items-center gap-2 bg-[#F5F5F5] rounded border border-[#DDD] p-2">
              <input
                readOnly
                value={shareLink}
                className="flex-1 bg-transparent text-xs text-[#333] outline-none font-mono"
              />
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-[#0078D4] text-white hover:bg-[#006CBE] transition-colors"
              >
                {copied ? <Check size={12} /> : <Copy size={12} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <div className="flex justify-end">
              <button
                onClick={handleReset}
                className="px-4 py-1.5 text-xs bg-[#F0F0F0] border border-[#CCC] rounded hover:bg-[#E0E0E0] transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {state === 'idle' && (
        <button
          onClick={handleStartClick}
          title="Start Recording Session"
          className="flex items-center gap-1.5 px-2 py-1 rounded text-xs text-[#444] hover:bg-[#E0E0E0] transition-colors"
        >
          <CircleDot size={14} className="text-[#C42B1C]" />
          <span className="hidden xl:inline">Record</span>
        </button>
      )}

      {state === 'recording' && (
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded text-xs text-[#C42B1C] bg-red-50">
            <CircleDot size={14} className="animate-pulse" />
            <span className="hidden xl:inline">Recording</span>
          </div>
          <button
            onClick={handleSubmit}
            className="flex items-center gap-1.5 px-3 py-1 rounded text-xs bg-[#107C10] text-white hover:bg-[#0E6B0E] transition-colors"
          >
            <Send size={12} />
            Submit
          </button>
        </div>
      )}

      {state === 'submitting' && (
        <div className="flex items-center gap-1.5 px-2 py-1 text-xs text-[#666]">
          <Loader2 size={14} className="animate-spin" />
          <span>Submitting...</span>
        </div>
      )}

      {showNamePrompt && state === 'idle' && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-[380px] overflow-hidden">
            <div className="bg-[#0078D4] px-5 py-3">
              <span className="text-white text-sm font-semibold">Start Recording Session</span>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-sm text-[#444]">
                Your coding progress will be recorded every few seconds. When you are done, click Submit to generate a review link for your teacher.
              </p>
              <div>
                <label className="block text-xs text-[#666] mb-1">Student Name</label>
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleBeginSession()}
                  placeholder="Enter your name"
                  autoFocus
                  className="w-full px-3 py-1.5 text-sm border border-[#CCC] rounded outline-none focus:border-[#0078D4] focus:ring-1 focus:ring-[#0078D4]/30"
                />
              </div>
              {error && <p className="text-xs text-red-600">{error}</p>}
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => { setShowNamePrompt(false); setError(''); }}
                  className="px-4 py-1.5 text-xs bg-[#F0F0F0] border border-[#CCC] rounded hover:bg-[#E0E0E0] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBeginSession}
                  className="px-4 py-1.5 text-xs bg-[#0078D4] text-white rounded hover:bg-[#006CBE] transition-colors"
                >
                  Start Recording
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
