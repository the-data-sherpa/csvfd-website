/*
  # Add delete policy for pages

  1. Changes
    - Add RLS policy to allow authenticated users to delete pages
*/

CREATE POLICY "Authenticated users can delete pages"
  ON pages
  FOR DELETE
  TO authenticated
  USING (true);