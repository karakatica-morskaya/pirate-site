/*
  # Add last_updated_by column for realtime sync

  1. New Column
    - `last_updated_by` (text) - client ID that made the last update

  2. Purpose
    - Prevents applying own updates back when using Realtime
    - Each client generates unique ID on page load
    - Used to filter out self-generated realtime events

  3. Default
    - NULL by default for existing rows
    - Will be set on each save
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rooms' AND column_name = 'last_updated_by'
  ) THEN
    ALTER TABLE rooms ADD COLUMN last_updated_by text;
  END IF;
END $$;
