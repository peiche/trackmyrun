/*
  # Add goals table for user-specific running goals

  1. New Tables
    - `goals`
      - `id` (uuid)
      - `user_id` (uuid, references profiles)
      - `name` (text)
      - `target_date` (date)
      - `target_distance` (numeric, optional)
      - `target_pace` (numeric, optional)
      - `completed` (boolean)
      - `description` (text, optional)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS
    - Add policies for authenticated users to manage their own goals
*/

-- Create goals table
CREATE TABLE IF NOT EXISTS goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  target_date date NOT NULL,
  target_distance numeric,
  target_pace numeric,
  completed boolean DEFAULT false,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

-- Goals policies
CREATE POLICY "Users can read own goals"
  ON goals
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own goals"
  ON goals
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own goals"
  ON goals
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own goals"
  ON goals
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Create trigger to update updated_at
CREATE TRIGGER update_goals_updated_at
  BEFORE UPDATE ON goals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();