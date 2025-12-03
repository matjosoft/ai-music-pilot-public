-- Add generation_params column to songs table to store original generation parameters
-- This allows pre-filling the regeneration modal with original parameters

ALTER TABLE songs ADD COLUMN IF NOT EXISTS generation_params JSONB;

-- Add a comment explaining the column
COMMENT ON COLUMN songs.generation_params IS 'Stores the original generation parameters (vision, genre, mood, tempo, wordDensity, etc.) used to create the song';
