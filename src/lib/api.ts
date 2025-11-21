// src/lib/api.ts
export const BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

export type CreateRoomResp = {
  success: boolean;
  room: {
    id: string;
    hostId: string;
    createdAt: string;
  };
  agora_app_id: string;
  agora_token: string;
  channel: string; // Agora channel name returned by backend
};

export async function createRoom(userId: string) : Promise<CreateRoomResp> {
  const res = await fetch(`${BASE}/api/v1/room/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Create room failed: ${res.status} ${text}`);
  }

  const data = await res.json();
  console.log("CREATE ROOM DATA:", data); // debug
  return data as CreateRoomResp;

}

/**
 * joinRoom - the backend in your screenshot uses the same endpoint,
 * passing both user_id and room_id to join an existing room.
 */
export async function joinRoom(userId: string, roomId: string) : Promise<CreateRoomResp> {
  const res = await fetch(`${BASE}/api/v1/room/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId, room_id: roomId }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Join room failed: ${res.status} ${text}`);
  }
  const data = await res.json();
  return data as CreateRoomResp;
}
