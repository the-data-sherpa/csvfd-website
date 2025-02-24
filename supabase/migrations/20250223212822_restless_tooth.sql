/*
  # Add auth user trigger

  1. Changes
    - Creates a trigger to automatically create site_users entries when new auth users sign up
    - Ensures user data consistency between auth.users and site_users tables
    - Sets default role to 'member' for new users
    - Uses user metadata from auth for name

  2. Security
    - Maintains existing RLS policies
    - Only system-level trigger, no direct user access
*/

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.site_users (id, email, name, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    'member'
  )
  ON CONFLICT (email) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();