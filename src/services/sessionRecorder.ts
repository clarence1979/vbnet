import { supabase } from '../lib/supabase';

const SNAPSHOT_INTERVAL_MS = 3000;

let sessionId: string | null = null;
let shareToken: string | null = null;
let startedAt: number | null = null;
let intervalHandle: number | null = null;
let lastSnapshotCode: string | null = null;

export function getSessionId() {
  return sessionId;
}

export function getShareToken() {
  return shareToken;
}

export function isRecording() {
  return sessionId !== null && intervalHandle !== null;
}

export async function startSession(studentName: string): Promise<string> {
  const { data, error } = await supabase
    .from('coding_sessions')
    .insert({ student_name: studentName })
    .select('id, share_token')
    .maybeSingle();

  if (error || !data) {
    throw new Error(error?.message || 'Failed to create session');
  }

  sessionId = data.id;
  shareToken = data.share_token;
  startedAt = Date.now();
  lastSnapshotCode = null;

  return data.id;
}

export function beginRecording(getCode: () => string) {
  if (!sessionId || !startedAt) return;

  captureSnapshot(getCode());

  intervalHandle = window.setInterval(() => {
    captureSnapshot(getCode());
  }, SNAPSHOT_INTERVAL_MS);
}

async function captureSnapshot(code: string) {
  if (!sessionId || !startedAt) return;
  if (code === lastSnapshotCode) return;

  lastSnapshotCode = code;
  const elapsed = Math.floor((Date.now() - startedAt) / 1000);

  await supabase.from('code_snapshots').insert({
    session_id: sessionId,
    code,
    elapsed_seconds: elapsed,
  });
}

export async function captureAndFlush(code: string) {
  if (!sessionId || !startedAt) return;
  lastSnapshotCode = null;
  await captureSnapshot(code);
}

export async function submitSession(): Promise<string | null> {
  if (!sessionId) return null;

  stopRecording();

  const { error } = await supabase
    .from('coding_sessions')
    .update({ submitted_at: new Date().toISOString() })
    .eq('id', sessionId);

  if (error) {
    throw new Error(error.message);
  }

  const token = shareToken;
  sessionId = null;
  shareToken = null;
  startedAt = null;
  lastSnapshotCode = null;

  return token;
}

export function stopRecording() {
  if (intervalHandle !== null) {
    clearInterval(intervalHandle);
    intervalHandle = null;
  }
}

export async function fetchSessionByToken(token: string) {
  const { data: session, error: sessionError } = await supabase
    .from('coding_sessions')
    .select('*')
    .eq('share_token', token)
    .maybeSingle();

  if (sessionError || !session) return null;

  const { data: snapshots, error: snapError } = await supabase
    .from('code_snapshots')
    .select('*')
    .eq('session_id', session.id)
    .order('elapsed_seconds', { ascending: true });

  if (snapError) return null;

  return { session, snapshots: snapshots || [] };
}
