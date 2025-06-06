/*
  # Add Garmin Connect integration support

  1. New Tables
    - `garmin_connections`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `garmin_username` (text)
      - `access_token` (text, encrypted)
      - `refresh_token` (text, encrypted)
      - `token_expires_at` (timestamp)
      - `last_sync` (timestamp)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on garmin_connections table
    - Add policies for authenticated users to manage their own connections
*/

-- Create garmin_connections table
CREATE TABLE IF NOT EXISTS garmin_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles ON DELETE CASCADE NOT NULL UNIQUE,
  garmin_username text NOT NULL,
  access_token text NOT NULL,
  refresh_token text NOT NULL,
  token_expires_at timestamptz,
  last_sync timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE garmin_connections ENABLE ROW LEVEL SECURITY;

-- Garmin connections policies
CREATE POLICY "Users can read own garmin connection"
  ON garmin_connections
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own garmin connection"
  ON garmin_connections
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own garmin connection"
  ON garmin_connections
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own garmin connection"
  ON garmin_connections
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Create trigger to update updated_at
CREATE TRIGGER update_garmin_connections_updated_at
  BEFORE UPDATE ON garmin_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();