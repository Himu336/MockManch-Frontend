"use client";

import React, { useState } from "react";
import Card from "../../../components/ui/Card";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import PageHeader from "../../../components/ui/PageHeader";
import Notification from "../../../components/ui/Notification";
import { createRoom, joinRoom, type ServiceError } from "../../../lib/api";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useWallet } from "@/hooks/useWallet";
import { 
  AlertCircle, 
  Coins, 
  CreditCard, 
  Lightbulb, 
  Users, 
  Mic, 
  Video, 
  Clock, 
  CheckCircle2,
  MessageSquare,
  Eye,
  Shield
} from "lucide-react";
import Link from "next/link";

export default function GroupPracticePageClient() {
  const router = useRouter();
  const { user } = useAuth();
  const { balance, fetchWallet } = useWallet();

  const [createLoading, setCreateLoading] = useState(false);
  const [joinLoading, setJoinLoading] = useState(false);

  // Always use authenticated user ID
  const userId = user?.id || "";

  const [maxParticipants, setMaxParticipants] = useState<string>("");
  const [roomName, setRoomName] = useState<string>("");
  const [roomCode, setRoomCode] = useState<string>("");

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [insufficientTokens, setInsufficientTokens] = useState(false);

  async function handleCreateRoom() {
  setError(null);
  setSuccessMsg(null);
  setInsufficientTokens(false);

  if (!userId) {
    setError("Please sign in to create a room.");
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

      // Refresh wallet balance after successful token deduction
      await fetchWallet();

      router.push(url.pathname + url.search);

    } catch (err: any) {
      // Handle specific error types
      if (err && typeof err === "object" && "status" in err) {
        const serviceError = err as ServiceError;
        
        if (serviceError.status === 402) {
          // Insufficient tokens
          setInsufficientTokens(true);
          setError(serviceError.message);
          await fetchWallet();
        } else if (serviceError.status === 401) {
          // Authentication error
          setError(serviceError.message);
          setTimeout(() => {
            router.push("/login");
          }, 2000);
        } else {
          setError(serviceError.message || "Unknown error creating room");
        }
      } else {
        setError(err.message || "Unknown error creating room");
      }
    } finally {
      setCreateLoading(false);
    }
  }


async function handleJoinRoom() {
  setError(null);
  setSuccessMsg(null);
  setInsufficientTokens(false);

  if (!userId) {
    setError("Please sign in to join a room.");
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

      // Refresh wallet balance after successful token deduction
      await fetchWallet();

      router.push(url.pathname + url.search);

    } catch (err: any) {
      // Handle specific error types
      if (err && typeof err === "object" && "status" in err) {
        const serviceError = err as ServiceError;
        
        if (serviceError.status === 402) {
          // Insufficient tokens
          setInsufficientTokens(true);
          setError(serviceError.message);
          await fetchWallet();
        } else if (serviceError.status === 401) {
          // Authentication error
          setError(serviceError.message);
          setTimeout(() => {
            router.push("/login");
          }, 2000);
        } else {
          setError(serviceError.message || "Unknown error joining room");
        }
      } else {
        setError(err.message || "Unknown error joining room");
      }
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

      {insufficientTokens && (
        <Card className="p-4 bg-yellow-500/10 border-yellow-500/30">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-yellow-400 font-medium text-sm mb-2">
                Insufficient Tokens
              </p>
              <p className="text-yellow-400/80 text-sm mb-3">
                You need at least 3 tokens to create or join a group practice room. Each session costs 3 tokens.
              </p>
              <Link href="/billing">
                <Button
                  size="sm"
                  className="bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 border-yellow-500/30"
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Purchase Tokens
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      )}

      {error && !insufficientTokens && <Notification type="error">{error}</Notification>}
      {successMsg && <Notification type="success">{successMsg}</Notification>}

      {!userId && (
        <Card className="p-4 bg-yellow-500/10 border-yellow-500/30">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-yellow-400 font-medium text-sm">
                Please sign in to create or join rooms
              </p>
            </div>
          </div>
        </Card>
      )}

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

            <Button onClick={handleCreateRoom} disabled={createLoading || !userId} className="w-full">
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

            <Button onClick={handleJoinRoom} disabled={joinLoading || !userId} className="w-full">
              {joinLoading ? "Joining..." : "Join Room"}
            </Button>
          </div>
        </Card>
      </div>

      {/* Pro Tips & Guidelines */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pro Tips */}
        <Card className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-500/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Lightbulb className="w-5 h-5 text-blue-400" />
            </div>
            <h2 className="text-xl font-semibold text-white">Pro Tips</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-white font-medium text-sm mb-1">Test Your Setup First</p>
                <p className="text-white/60 text-xs">
                  Check your microphone and camera before joining to ensure smooth communication.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-white font-medium text-sm mb-1">Use a Quiet Environment</p>
                <p className="text-white/60 text-xs">
                  Find a quiet space with good lighting to minimize distractions and improve video quality.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-white font-medium text-sm mb-1">Prepare Your Questions</p>
                <p className="text-white/60 text-xs">
                  Come prepared with questions or topics to discuss for a more productive session.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-white font-medium text-sm mb-1">Share the Room Code</p>
                <p className="text-white/60 text-xs">
                  As a host, share your room code with participants in advance for better coordination.
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Guidelines */}
        <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <Shield className="w-5 h-5 text-purple-400" />
            </div>
            <h2 className="text-xl font-semibold text-white">Guidelines</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Users className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-white font-medium text-sm mb-1">Respectful Communication</p>
                <p className="text-white/60 text-xs">
                  Maintain professional and respectful communication with all participants at all times.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Mic className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-white font-medium text-sm mb-1">Mute When Not Speaking</p>
                <p className="text-white/60 text-xs">
                  Mute your microphone when you're not speaking to reduce background noise for others.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Video className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-white font-medium text-sm mb-1">Keep Camera On</p>
                <p className="text-white/60 text-xs">
                  Keep your camera on during practice sessions to simulate real interview conditions.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-white font-medium text-sm mb-1">Be Punctual</p>
                <p className="text-white/60 text-xs">
                  Join sessions on time and respect the time limits to ensure everyone gets practice.
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Best Practices */}
      <Card className="bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border-indigo-500/20">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-indigo-500/20 rounded-lg">
            <MessageSquare className="w-5 h-5 text-indigo-400" />
          </div>
          <h2 className="text-xl font-semibold text-white">Best Practices for Group Practice</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3 p-3 bg-white/5 rounded-lg border border-white/10">
            <Eye className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-white font-medium text-sm mb-1">Active Listening</p>
              <p className="text-white/60 text-xs">
                Pay attention to others' responses and provide constructive feedback when appropriate.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-white/5 rounded-lg border border-white/10">
            <Users className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-white font-medium text-sm mb-1">Equal Participation</p>
              <p className="text-white/60 text-xs">
                Ensure everyone gets a chance to speak and practice their interview skills.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-white/5 rounded-lg border border-white/10">
            <CheckCircle2 className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-white font-medium text-sm mb-1">Constructive Feedback</p>
              <p className="text-white/60 text-xs">
                Offer helpful, specific feedback that helps others improve their interview performance.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-white/5 rounded-lg border border-white/10">
            <Clock className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-white font-medium text-sm mb-1">Time Management</p>
              <p className="text-white/60 text-xs">
                Keep responses concise and on-topic to maximize practice time for all participants.
              </p>
            </div>
          </div>
        </div>
      </Card>

    </div>
  );
}
