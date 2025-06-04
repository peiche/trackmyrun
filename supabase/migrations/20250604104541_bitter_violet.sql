/*
  # User-specific runs and profiles

  1. New Tables
    - `profiles`
      - `id` (uuid, references auth.users)
      - `username` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    - `runs`
      - `id` (uuid)
      - `user_id` (uuid, references profiles)
      - `date` (date)
      - `distance` (numeric)
      - `duration` (numeric)
      - `pace` (numeric)
      - `route` (text, optional)
      - `notes` (text, optional)
      - `feeling_rating` (integer)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to:
      - Read/write their own profile
      - Read/write their own runs
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  username text UNIQUE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create runs table
CREATE TABLE IF NOT EXISTS runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  distance numeric NOT NULL,
  duration numeric NOT NULL,
  pace numeric NOT NULL,
  route text,
  notes text,
  feeling_rating integer NOT NULL CHECK (feeling_rating BETWEEN 1 AND 5),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE runs ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Runs policies
CREATE POLICY "Users can read own runs"
  ON runs
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own runs"
  ON runs
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own runs"
  ON runs
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own runs"
  ON runs
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_runs_updated_at
  BEFORE UPDATE ON runs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();