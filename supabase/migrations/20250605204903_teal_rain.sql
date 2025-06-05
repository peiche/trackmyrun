/*
  # Add Profile Creation Trigger

  1. Changes
    - Add a trigger function to create profiles for new users
    - Add a trigger to execute the function on user creation
    
  2. Security
    - No changes to existing RLS policies
    - Maintains existing table security
*/

-- Create the trigger function
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

-- Create the trigger
DO $$ BEGIN
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

-- Create profiles for existing users if they don't have one
INSERT INTO public.profiles (id, username, created_at, updated_at)
SELECT 
  id,
  email,
  COALESCE(created_at, now()),
  COALESCE(last_sign_in_at, now())
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles);