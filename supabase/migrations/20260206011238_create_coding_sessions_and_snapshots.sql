/*
  # Create coding sessions and snapshots tables

  1. New Tables
    - `coding_sessions`
      - `id` (uuid, primary key) - unique session identifier
      - `student_name` (text) - name of the student
      - `started_at` (timestamptz) - when the session began
      - `submitted_at` (timestamptz) - when the student submitted
      - `share_token` (text, unique) - short token used in shareable link

    - `code_snapshots`
      - `id` (uuid, primary key) - unique snapshot identifier
      - `session_id` (uuid, foreign key) - references coding_sessions
      - `code` (text) - the code content at this point in time
      - `captured_at` (timestamptz) - when the snapshot was taken
      - `elapsed_seconds` (integer) - seconds since session start

  2. Security
    - Enable RLS on both tables
    - Allow anonymous inserts for students (no auth required for this use case)
    - Allow anonymous reads via share_token for teacher review
*/

CREATE TABLE IF NOT EXISTS coding_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_name text NOT NULL DEFAULT '',
  started_at timestamptz NOT NULL DEFAULT now(),
  submitted_at timestamptz,
  share_token text UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(12), 'hex')
);

ALTER TABLE coding_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create a coding session"
  ON coding_sessions FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anyone can read sessions by share_token"
  ON coding_sessions FOR SELECT
  TO anon
  USING (share_token IS NOT NULL AND submitted_at IS NOT NULL);

CREATE POLICY "Anyone can update their own session to submit"
  ON coding_sessions FOR UPDATE
  TO anon
  USING (submitted_at IS NULL)
  WITH CHECK (submitted_at IS NOT NULL);


CREATE TABLE IF NOT EXISTS code_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES coding_sessions(id) ON DELETE CASCADE,
  code text NOT NULL DEFAULT '',
  captured_at timestamptz NOT NULL DEFAULT now(),
  elapsed_seconds integer NOT NULL DEFAULT 0
);

ALTER TABLE code_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert snapshots for active sessions"
  ON code_snapshots FOR INSERT
  TO anon
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM coding_sessions
      WHERE coding_sessions.id = code_snapshots.session_id
      AND coding_sessions.submitted_at IS NULL
    )
  );

CREATE POLICY "Anyone can read snapshots for submitted sessions"
  ON code_snapshots FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM coding_sessions
      WHERE coding_sessions.id = code_snapshots.session_id
      AND coding_sessions.submitted_at IS NOT NULL
    )
  );

CREATE INDEX IF NOT EXISTS idx_snapshots_session_id ON code_snapshots(session_id);
CREATE INDEX IF NOT EXISTS idx_snapshots_elapsed ON code_snapshots(session_id, elapsed_seconds);
CREATE INDEX IF NOT EXISTS idx_sessions_share_token ON coding_sessions(share_token);
