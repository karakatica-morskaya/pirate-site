import { Room } from './storage';

const STORAGE_KEY = 'pirate_maps_rooms';

function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function loadRooms(): Record<string, Room> {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

function saveRooms(rooms: Record<string, Room>): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rooms));
}

export async function createRoom(roomId: string): Promise<Room | null> {
  console.log('[Room] Created', roomId);
  const rooms = loadRooms();

  if (rooms[roomId]) {
    return rooms[roomId];
  }

  const now = new Date().toISOString();
  const room: Room = {
    id: generateId(),
    room_id: roomId,
    created_at: now,
    updated_at: now,
    canvas_data: null,
    preview_image: null,
    last_updated_by: null,
  };

  rooms[roomId] = room;
  saveRooms(rooms);
  return room;
}

export async function getRoom(roomId: string): Promise<Room | null> {
  console.log('[Room] Loading', roomId);
  const rooms = loadRooms();
  const room = rooms[roomId] ?? null;
  if (room) console.log('[Room] Loaded', roomId);
  return room;
}

export async function saveRoom(
  roomId: string,
  canvasData: object,
  previewImage: string
): Promise<boolean> {
  console.log('[Room] Saving', roomId);
  const rooms = loadRooms();
  const room = rooms[roomId];

  if (!room) {
    console.error('[Room] Room not found:', roomId);
    return false;
  }

  room.canvas_data = canvasData;
  room.preview_image = previewImage;
  room.updated_at = new Date().toISOString();

  saveRooms(rooms);
  console.log('[Room] Saved', roomId);
  return true;
}

export async function deleteRoom(roomId: string): Promise<boolean> {
  console.log('[Room] Deleted', roomId);
  const rooms = loadRooms();

  if (!rooms[roomId]) {
    return false;
  }

  delete rooms[roomId];
  saveRooms(rooms);
  return true;
}

export async function getAllRooms(): Promise<Room[]> {
  const rooms = loadRooms();
  const roomList = Object.values(rooms);
  roomList.sort((a, b) =>
    new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  );
  console.log('[Rooms] Loaded', roomList.length, 'rooms');
  return roomList;
}
