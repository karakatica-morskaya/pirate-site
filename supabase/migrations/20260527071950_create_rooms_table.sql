/*
  # Create rooms table for Pirate DND Map

  1. New Tables
    - `rooms`
      - `id` (uuid, primary key) - internal unique identifier
      - `room_id` (text, unique) - human-readable room identifier used in URLs
      - `created_at` (timestamptz) - when room was created
      - `updated_at` (timestamptz) - when room was last modified
      - `canvas_data` (jsonb) - serialized Fabric.js canvas state including all objects
      - `preview_image` (text) - base64 PNG preview of the canvas

  2. Indexes
    - Index on `room_id` for fast URL lookups
    - Index on `updated_at` for sorting archive by recency

  3. Security
    - Enable RLS on `rooms` table
    - Public read/write policies (no auth required for this collaborative tool)

  Notes:
    - canvas_data stores the full Fabric.js toJSON() output
    - preview_image stores canvas.toDataURL() base64 string
    - room_id is used in URLs: /room/{room_id}
    - Records are created immediately when a room is opened
*/

CREATE TABLE IF NOT EXISTS rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  canvas_data jsonb,
  preview_image text
);

CREATE INDEX IF NOT EXISTS idx_rooms_room_id ON rooms(room_id);
CREATE INDEX IF NOT EXISTS idx_rooms_updated_at ON rooms(updated_at DESC);

ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read rooms"
  ON rooms FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert rooms"
  ON rooms FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update rooms"
  ON rooms FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete rooms"
  ON rooms FOR DELETE
  USING (true);
