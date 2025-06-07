/*
  # TrackMyRun Database Schema
  
  Complete database schema for the TrackMyRun application including:
  1. User profiles linked to Supabase auth
  2. Running activity records with comprehensive metrics
  3. User-defined goals with progress tracking
  4. Analytics views for reporting
  5. Security policies and triggers
*/

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom functions
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, created_at, updated_at)
  VALUES (NEW.id, NEW.email, now(), now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

COMMENT ON TABLE profiles IS 'User profile information linked to Supabase auth';

-- Create runs table
CREATE TABLE IF NOT EXISTS runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date date NOT NULL,
  distance numeric NOT NULL,
  duration numeric NOT NULL,
  pace numeric NOT NULL,
  route text,
  notes text,
  feeling_rating integer NOT NULL CHECK (feeling_rating >= 1 AND feeling_rating <= 5),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

COMMENT ON TABLE runs IS 'Individual running activity records';
COMMENT ON COLUMN runs.distance IS 'Distance in miles';
COMMENT ON COLUMN runs.duration IS 'Duration in minutes';
COMMENT ON COLUMN runs.pace IS 'Pace in minutes per mile';
COMMENT ON COLUMN runs.feeling_rating IS 'Subjective feeling rating from 1-5';

-- Create goals table
CREATE TABLE IF NOT EXISTS goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  target_date date NOT NULL,
  target_distance numeric,
  target_pace numeric,
  completed boolean DEFAULT false,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT goals_has_target CHECK (target_distance IS NOT NULL OR target_pace IS NOT NULL)
);

COMMENT ON TABLE goals IS 'User-defined running goals with target metrics';
COMMENT ON COLUMN goals.target_distance IS 'Target distance in miles (optional)';
COMMENT ON COLUMN goals.target_pace IS 'Target pace in minutes per mile (optional)';
COMMENT ON COLUMN goals.completed IS 'Whether the goal has been completed';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_runs_user_id ON runs(user_id);
CREATE INDEX IF NOT EXISTS idx_runs_date ON runs(date DESC);
CREATE INDEX IF NOT EXISTS idx_runs_user_date ON runs(user_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_target_date ON goals(target_date);
CREATE INDEX IF NOT EXISTS idx_goals_user_completed ON goals(user_id, completed);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
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

-- Create RLS policies for runs
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

-- Create RLS policies for goals
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

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_runs_updated_at
  BEFORE UPDATE ON runs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_goals_updated_at
  BEFORE UPDATE ON goals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Create trigger for automatic profile creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Create analytics views
CREATE OR REPLACE VIEW user_run_stats AS
SELECT 
  p.id as user_id,
  p.username,
  COUNT(r.id) as total_runs,
  COALESCE(SUM(r.distance), 0) as total_distance,
  COALESCE(AVG(r.distance), 0) as avg_distance,
  COALESCE(AVG(r.pace), 0) as avg_pace,
  COALESCE(MIN(r.pace), 0) as best_pace,
  COALESCE(MAX(r.distance), 0) as longest_run,
  MIN(r.date) as first_run_date,
  MAX(r.date) as last_run_date
FROM profiles p
LEFT JOIN runs r ON p.id = r.user_id
GROUP BY p.id, p.username;

CREATE OR REPLACE VIEW weekly_run_summary AS
SELECT 
  user_id,
  date_trunc('week', date) as week_start,
  COUNT(*) as runs_count,
  SUM(distance) as total_distance,
  AVG(pace) as avg_pace,
  SUM(duration) as total_duration
FROM runs
GROUP BY user_id, date_trunc('week', date)
ORDER BY user_id, week_start DESC;

CREATE OR REPLACE VIEW monthly_run_summary AS
SELECT 
  user_id,
  date_trunc('month', date) as month_start,
  COUNT(*) as runs_count,
  SUM(distance) as total_distance,
  AVG(pace) as avg_pace,
  SUM(duration) as total_duration
FROM runs
GROUP BY user_id, date_trunc('month', date)
ORDER BY user_id, month_start DESC;

CREATE OR REPLACE VIEW goal_progress AS
SELECT 
  g.*,
  COALESCE(SUM(r.distance), 0) as current_distance,
  COALESCE(MIN(r.pace), 0) as best_pace,
  COUNT(r.id) as total_runs
FROM goals g
LEFT JOIN runs r ON g.user_id = r.user_id 
  AND r.date <= g.target_date
GROUP BY g.id, g.user_id, g.name, g.target_date, g.target_distance, 
         g.target_pace, g.completed, g.description, g.created_at, g.updated_at;