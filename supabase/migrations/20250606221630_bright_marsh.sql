-- TrackMyRun Database Schema
-- Complete database structure for the running tracker application

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom function for updating timestamps (only if it doesn't exist)
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create profiles table (only if it doesn't exist)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  username text UNIQUE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create runs table (only if it doesn't exist)
CREATE TABLE IF NOT EXISTS runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  distance numeric NOT NULL CHECK (distance > 0),
  duration numeric NOT NULL CHECK (duration > 0),
  pace numeric NOT NULL CHECK (pace > 0),
  route text,
  notes text,
  feeling_rating integer NOT NULL CHECK (feeling_rating BETWEEN 1 AND 5),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create goals table (only if it doesn't exist)
CREATE TABLE IF NOT EXISTS goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  target_date date NOT NULL,
  target_distance numeric CHECK (target_distance > 0),
  target_pace numeric CHECK (target_pace > 0),
  completed boolean DEFAULT false,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add constraint to goals table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'goals_has_target' 
    AND table_name = 'goals'
  ) THEN
    ALTER TABLE goals ADD CONSTRAINT goals_has_target CHECK (
      target_distance IS NOT NULL OR target_pace IS NOT NULL
    );
  END IF;
END $$;

-- Create indexes for better query performance (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_runs_user_id ON runs(user_id);
CREATE INDEX IF NOT EXISTS idx_runs_date ON runs(date DESC);
CREATE INDEX IF NOT EXISTS idx_runs_user_date ON runs(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_target_date ON goals(target_date);
CREATE INDEX IF NOT EXISTS idx_goals_user_completed ON goals(user_id, completed);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

-- Profiles RLS Policies (create only if they don't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Users can read own profile'
  ) THEN
    CREATE POLICY "Users can read own profile"
      ON profiles
      FOR SELECT
      TO authenticated
      USING (auth.uid() = id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Users can update own profile'
  ) THEN
    CREATE POLICY "Users can update own profile"
      ON profiles
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = id)
      WITH CHECK (auth.uid() = id);
  END IF;
END $$;

-- Runs RLS Policies (create only if they don't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'runs' 
    AND policyname = 'Users can read own runs'
  ) THEN
    CREATE POLICY "Users can read own runs"
      ON runs
      FOR SELECT
      TO authenticated
      USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'runs' 
    AND policyname = 'Users can insert own runs'
  ) THEN
    CREATE POLICY "Users can insert own runs"
      ON runs
      FOR INSERT
      TO authenticated
      WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'runs' 
    AND policyname = 'Users can update own runs'
  ) THEN
    CREATE POLICY "Users can update own runs"
      ON runs
      FOR UPDATE
      TO authenticated
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'runs' 
    AND policyname = 'Users can delete own runs'
  ) THEN
    CREATE POLICY "Users can delete own runs"
      ON runs
      FOR DELETE
      TO authenticated
      USING (user_id = auth.uid());
  END IF;
END $$;

-- Goals RLS Policies (create only if they don't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'goals' 
    AND policyname = 'Users can read own goals'
  ) THEN
    CREATE POLICY "Users can read own goals"
      ON goals
      FOR SELECT
      TO authenticated
      USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'goals' 
    AND policyname = 'Users can insert own goals'
  ) THEN
    CREATE POLICY "Users can insert own goals"
      ON goals
      FOR INSERT
      TO authenticated
      WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'goals' 
    AND policyname = 'Users can update own goals'
  ) THEN
    CREATE POLICY "Users can update own goals"
      ON goals
      FOR UPDATE
      TO authenticated
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'goals' 
    AND policyname = 'Users can delete own goals'
  ) THEN
    CREATE POLICY "Users can delete own goals"
      ON goals
      FOR DELETE
      TO authenticated
      USING (user_id = auth.uid());
  END IF;
END $$;

-- Create triggers for automatic timestamp updates (only if they don't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_profiles_updated_at'
  ) THEN
    CREATE TRIGGER update_profiles_updated_at
      BEFORE UPDATE ON profiles
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at();
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_runs_updated_at'
  ) THEN
    CREATE TRIGGER update_runs_updated_at
      BEFORE UPDATE ON runs
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at();
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_goals_updated_at'
  ) THEN
    CREATE TRIGGER update_goals_updated_at
      BEFORE UPDATE ON goals
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at();
  END IF;
END $$;

-- Create function to automatically create profile for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username, created_at, updated_at)
  VALUES (
    new.id,
    new.email,
    now(),
    now()
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create profile when user signs up (only if it doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_new_user();
  END IF;
END $$;

-- Create helpful views for common queries
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

-- Create view for weekly run summaries
CREATE OR REPLACE VIEW weekly_run_summary AS
SELECT 
  user_id,
  DATE_TRUNC('week', date) as week_start,
  COUNT(*) as runs_count,
  SUM(distance) as total_distance,
  AVG(pace) as avg_pace,
  SUM(duration) as total_duration
FROM runs
GROUP BY user_id, DATE_TRUNC('week', date)
ORDER BY user_id, week_start DESC;

-- Create view for monthly run summaries
CREATE OR REPLACE VIEW monthly_run_summary AS
SELECT 
  user_id,
  DATE_TRUNC('month', date) as month_start,
  COUNT(*) as runs_count,
  SUM(distance) as total_distance,
  AVG(pace) as avg_pace,
  SUM(duration) as total_duration
FROM runs
GROUP BY user_id, DATE_TRUNC('month', date)
ORDER BY user_id, month_start DESC;

-- Create view for goal progress tracking
CREATE OR REPLACE VIEW goal_progress AS
SELECT 
  g.*,
  CASE 
    WHEN g.target_distance IS NOT NULL THEN
      COALESCE(SUM(r.distance), 0)
    ELSE NULL
  END as current_distance,
  CASE 
    WHEN g.target_pace IS NOT NULL THEN
      MIN(r.pace)
    ELSE NULL
  END as best_pace,
  COUNT(r.id) as total_runs
FROM goals g
LEFT JOIN runs r ON g.user_id = r.user_id 
  AND r.date <= g.target_date
GROUP BY g.id, g.user_id, g.name, g.target_date, g.target_distance, 
         g.target_pace, g.completed, g.description, g.created_at, g.updated_at;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Insert sample data for existing users (if any)
-- This will create profiles for any existing auth users who don't have profiles yet
INSERT INTO public.profiles (id, username, created_at, updated_at)
SELECT 
  id,
  email,
  COALESCE(created_at, now()),
  COALESCE(last_sign_in_at, now())
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;

-- Add helpful comments to tables and columns
COMMENT ON TABLE profiles IS 'User profile information linked to Supabase auth';
COMMENT ON TABLE runs IS 'Individual running activity records';
COMMENT ON TABLE goals IS 'User-defined running goals with target metrics';

COMMENT ON COLUMN runs.distance IS 'Distance in miles';
COMMENT ON COLUMN runs.duration IS 'Duration in minutes';
COMMENT ON COLUMN runs.pace IS 'Pace in minutes per mile';
COMMENT ON COLUMN runs.feeling_rating IS 'Subjective feeling rating from 1-5';

COMMENT ON COLUMN goals.target_distance IS 'Target distance in miles (optional)';
COMMENT ON COLUMN goals.target_pace IS 'Target pace in minutes per mile (optional)';
COMMENT ON COLUMN goals.completed IS 'Whether the goal has been completed';

-- Create function to clean up old data (optional, for maintenance)
CREATE OR REPLACE FUNCTION cleanup_old_data(days_to_keep integer DEFAULT 365)
RETURNS void AS $$
BEGIN
  -- This function can be used to clean up old data if needed
  -- Currently just a placeholder for future maintenance needs
  RAISE NOTICE 'Cleanup function called with % days retention', days_to_keep;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;