export interface Room {
  id: string;
  room_id: string;
  created_at: string;
  updated_at: string;
  canvas_data: object | null;
  preview_image: string | null;
  last_updated_by: string | null;
}
