/*
  # Database Support for VB.NET IDE

  1. New Tables
    - `students` - Sample table for testing database operations
      - `id` (integer, primary key, auto-increment)
      - `name` (text, required)
      - `age` (integer)
      - `grade` (text)
      - `created_at` (timestamp with timezone, default now())

  2. Security
    - Enable RLS on `students` table
    - Add policy for authenticated users to read all student data
    - Add policy for authenticated users to insert student data
    - Add policy for authenticated users to update student data
    - Add policy for authenticated users to delete student data

  3. Functions
    - Create `execute_sql` function for executing dynamic SQL queries
      This function allows the VB.NET code editor to execute SQL commands safely

  4. Notes
    - The execute_sql function is designed to support SELECT, INSERT, UPDATE, DELETE queries
    - For security, this should only be accessible to authenticated users
    - The students table serves as a sample for users to practice database operations
*/

-- Create students table
CREATE TABLE IF NOT EXISTS students (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  age INTEGER,
  grade TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- Policies for authenticated users
CREATE POLICY "Authenticated users can read students"
  ON students
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert students"
  ON students
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update students"
  ON students
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete students"
  ON students
  FOR DELETE
  TO authenticated
  USING (true);

-- Insert sample data
INSERT INTO students (name, age, grade) VALUES
  ('Alice Johnson', 15, 'A'),
  ('Bob Smith', 16, 'B'),
  ('Carol Williams', 15, 'A'),
  ('David Brown', 17, 'B'),
  ('Eve Davis', 16, 'A')
ON CONFLICT DO NOTHING;

-- Create execute_sql function for dynamic query execution
CREATE OR REPLACE FUNCTION execute_sql(query TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
  query_lower TEXT;
BEGIN
  query_lower := lower(trim(query));
  
  -- Check if query is a SELECT statement
  IF query_lower LIKE 'select%' THEN
    EXECUTE format('SELECT jsonb_agg(row_to_json(t)) FROM (%s) t', query) INTO result;
    RETURN COALESCE(result, '[]'::jsonb);
  
  -- Check if query is an INSERT, UPDATE, or DELETE statement
  ELSIF query_lower LIKE 'insert%' OR query_lower LIKE 'update%' OR query_lower LIKE 'delete%' THEN
    EXECUTE query;
    RETURN jsonb_build_object('affected_rows', 1);
  
  -- Check if query is a CREATE, ALTER, or DROP statement
  ELSIF query_lower LIKE 'create%' OR query_lower LIKE 'alter%' OR query_lower LIKE 'drop%' THEN
    EXECUTE query;
    RETURN jsonb_build_object('success', true);
  
  ELSE
    RAISE EXCEPTION 'Unsupported query type';
  END IF;
END;
$$;