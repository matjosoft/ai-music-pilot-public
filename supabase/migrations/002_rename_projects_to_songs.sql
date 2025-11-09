-- Rename projects table to songs
ALTER TABLE projects RENAME TO songs;

-- Rename indexes
ALTER INDEX idx_projects_user_id RENAME TO idx_songs_user_id;
ALTER INDEX idx_projects_created_at RENAME TO idx_songs_created_at;

-- Drop old policies
DROP POLICY "Users can view own projects" ON songs;
DROP POLICY "Users can create own projects" ON songs;
DROP POLICY "Users can update own projects" ON songs;
DROP POLICY "Users can delete own projects" ON songs;

-- Create new policies with updated names
CREATE POLICY "Users can view own songs"
  ON songs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own songs"
  ON songs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own songs"
  ON songs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own songs"
  ON songs FOR DELETE
  USING (auth.uid() = user_id);

-- Rename trigger
DROP TRIGGER update_projects_updated_at ON songs;
CREATE TRIGGER update_songs_updated_at
  BEFORE UPDATE ON songs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
