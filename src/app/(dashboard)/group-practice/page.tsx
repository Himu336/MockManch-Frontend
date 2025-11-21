"use client";

import React, { useState } from "react";
import Card from "../../../components/ui/Card";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import PageHeader from "../../../components/ui/PageHeader";
import Notification from "../../../components/ui/Notification";
import { createRoom, joinRoom } from "../../../lib/api";
import { useRouter } from "next/navigation";

export default function GroupPracticePageClient() {
  const router = useRouter();

  const [createLoading, setCreateLoading] = useState(false);
  const [joinLoading, setJoinLoading] = useState(false);

  // 🔥🔥 USER CAN ENTER THEIR OWN ID NOW (this fixes multi-user)
  const [userId, setUserId] = useState<string>("");

  const [maxParticipants, setMaxParticipants] = useState<string>("");
  const [roomName, setRoomName] = useState<string>("");
  const [roomCode, setRoomCode] = useState<string>("");

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const upcomingSessions = [
    {
      title: "System Design Panel",
      time: "Today, 3:00 PM",
      participants: 4,
      host: "Alex Chen",
    },
    {
      title: "Behavioral Q&A Practice",
      time: "Tomorrow, 10:00 AM",
      participants: 6,
      host: "Maria Garcia",
    },
    {
      title: "Mock Technical Round",
      time: "Tomorrow, 4:00 PM",
      participants: 3,
      host: "Evan Park",
    },
  ];

  async function handleCreateRoom() {
  setError(null);
  setSuccessMsg(null);

  if (!userId) {
    setError("Please enter your User ID before creating a room.");
    return;
  }

  setCreateLoading(true);

    try {
      const res = await createRoom(userId);

      // Use channel field returned by backend for Agora
      const channel = res.channel;
      
      console.log("Create room response:", res);
      console.log("Navigating to:", channel, "with token:", res.agora_token);

      // Create URL with proper query string
      const url = new URL(`/video-room/${channel}`, window.location.origin);
      url.searchParams.set("token", res.agora_token);
      url.searchParams.set("appId", res.agora_app_id);
      url.searchParams.set("roomId", res.room.id);
      url.searchParams.set("hostId", res.room.hostId || userId);
      url.searchParams.set("uid", userId);

      router.push(url.pathname + url.search);

    } catch (err: any) {
      setError(err.message || "Unknown error creating room");
    } finally {
      setCreateLoading(false);
    }
  }


async function handleJoinRoom() {
  setError(null);
  setSuccessMsg(null);

  if (!userId) {
    setError("Please enter your User ID before joining.");
    return;
  }

  if (!roomCode) {
    setError("Please enter a room code to join.");
    return;
  }

  setJoinLoading(true);

    try {
      const res = await joinRoom(userId, roomCode);

      // Use channel field returned by backend for Agora
      const channel = res.channel;

      console.log("Join room response:", res);
      console.log("Navigating to:", channel, "with token:", res.agora_token);

      // Create URL with proper query string
      const url = new URL(`/video-room/${channel}`, window.location.origin);
      url.searchParams.set("token", res.agora_token);
      url.searchParams.set("appId", res.agora_app_id);
      url.searchParams.set("roomId", res.room.id);
      url.searchParams.set("hostId", res.room.hostId);
      url.searchParams.set("uid", userId);

      router.push(url.pathname + url.search);

    } catch (err: any) {
      setError(err.message || "Unknown error joining room");
    } finally {
      setJoinLoading(false);
    }
  }


  return (
    <div className="space-y-8">
      <PageHeader
        title="Group Practice Rooms"
        subtitle="Join or create group practice sessions with other candidates"
      />

      {error && <Notification type="error">{error}</Notification>}
      {successMsg && <Notification type="success">{successMsg}</Notification>}

      {/* USER ID INPUT — 🔥 new block */}
      <Card>
        <h2 className="text-lg font-semibold mb-3">Your Identity</h2>
        <p className="text-sm text-white/60 mb-4">
          Enter your user ID before you create or join rooms
        </p>

        <Input
          placeholder="Enter your user ID (e.g., test-user-123)"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
        />
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Create Room */}
        <Card>
          <h2 className="text-xl font-semibold mb-3">Create a Room</h2>
          <p className="text-sm text-white/60 mb-4">
            Start a new group practice session
          </p>

          <div className="space-y-3">
            <Input
              placeholder="Room name (optional)"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
            />
            <Input
              placeholder="Max participants (default: 6)"
              value={maxParticipants}
              onChange={(e) => setMaxParticipants(e.target.value)}
            />

            <Button onClick={handleCreateRoom} disabled={createLoading} className="w-full">
              {createLoading ? "Creating..." : "Create Room"}
            </Button>
          </div>
        </Card>

        {/* Join Room */}
        <Card>
          <h2 className="text-xl font-semibold mb-3">Join a Room</h2>
          <p className="text-sm text-white/60 mb-4">
            Enter a room code to join an existing session
          </p>

          <div className="space-y-3">
            <Input
              placeholder="Enter room code"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value)}
            />

            <Button onClick={handleJoinRoom} disabled={joinLoading} className="w-full">
              {joinLoading ? "Joining..." : "Join Room"}
            </Button>
          </div>
        </Card>
      </div>

      <Card>
        <h2 className="text-xl font-semibold mb-4">Upcoming Public Sessions</h2>
        <p className="text-sm text-white/60 mb-6">
          Join scheduled practice sessions with the community
        </p>

        <div className="space-y-4">
          {upcomingSessions.map((s, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-4 border border-white/5 rounded-lg"
            >
              <div>
                <div className="text-lg font-medium">{s.title}</div>
                <div className="text-sm text-white/50">
                  {s.time} • {s.participants} participants • Host: {s.host}
                </div>
              </div>

              <Button
                size="sm"
                onClick={async () => {
                  if (!userId) {
                    setError("Please enter your User ID first.");
                    return;
                  }

                  try {
                    const res = await createRoom(userId);
                    const channel = res.channel;
                    
                    const url = new URL(`/video-room/${channel}`, window.location.origin);
                    url.searchParams.set("token", res.agora_token);
                    url.searchParams.set("appId", res.agora_app_id);
                    url.searchParams.set("roomId", res.room.id);
                    url.searchParams.set("hostId", res.room.hostId || userId);
                    url.searchParams.set("uid", userId);
                    
                    router.push(url.pathname + url.search);
                  } catch (err: any) {
                    setError(err.message || "Failed to join session");
                  }
                }}
              >
                Join
              </Button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
