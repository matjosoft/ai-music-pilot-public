-- Migration: Add song versions support
-- This creates a song_versions table and migrates existing data

-- Create song_versions table
CREATE TABLE song_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  song_id UUID NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  lyrics TEXT NOT NULL,
  style TEXT NOT NULL,
  title TEXT NOT NULL,
  generation_params JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_song_version UNIQUE (song_id, version_number),
  CONSTRAINT max_10_versions CHECK (version_number <= 10)
);

-- Indexes for performance
CREATE INDEX idx_song_versions_song_id ON song_versions(song_id);
CREATE INDEX idx_song_versions_created_at ON song_versions(created_at DESC);

-- RLS policies
ALTER TABLE song_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own song versions"
  ON song_versions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM songs
      WHERE songs.id = song_versions.song_id
      AND songs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create versions for own songs"
  ON song_versions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM songs
      WHERE songs.id = song_versions.song_id
      AND songs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete versions of own songs"
  ON song_versions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM songs
      WHERE songs.id = song_versions.song_id
      AND songs.user_id = auth.uid()
    )
  );

-- Modify songs table - add columns for version tracking
ALTER TABLE songs ADD COLUMN active_version_id UUID;
ALTER TABLE songs ADD COLUMN version_count INTEGER DEFAULT 0;

-- Migrate existing data: Create version 1 for each song with existing content
INSERT INTO song_versions (song_id, version_number, lyrics, style, title, generation_params, created_at)
SELECT
  s.id as song_id,
  1 as version_number,
  COALESCE(s.songs->0->>'lyrics', '') as lyrics,
  COALESCE(s.songs->0->>'style', '') as style,
  COALESCE(s.songs->0->>'title', '') as title,
  s.generation_params,
  s.created_at
FROM songs s
WHERE s.songs IS NOT NULL
  AND jsonb_array_length(s.songs) > 0;

-- Set active_version_id and version_count for migrated songs
UPDATE songs s
SET active_version_id = (
  SELECT sv.id
  FROM song_versions sv
  WHERE sv.song_id = s.id
  AND sv.version_number = 1
),
version_count = 1
WHERE EXISTS (
  SELECT 1 FROM song_versions sv
  WHERE sv.song_id = s.id
);

-- Now add the foreign key constraint after data is migrated
ALTER TABLE songs
  ADD CONSTRAINT fk_songs_active_version
  FOREIGN KEY (active_version_id)
  REFERENCES song_versions(id)
  ON DELETE SET NULL;

-- Create index for active version lookups
CREATE INDEX idx_songs_active_version ON songs(active_version_id);

-- Rename old columns (keep for safety during migration, can be dropped later)
ALTER TABLE songs RENAME COLUMN songs TO songs_deprecated;
ALTER TABLE songs RENAME COLUMN generation_params TO generation_params_deprecated;
