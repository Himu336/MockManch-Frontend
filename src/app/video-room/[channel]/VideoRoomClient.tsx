"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import type {
  IAgoraRTCClient,
  ILocalAudioTrack,
  ILocalVideoTrack,
  IRemoteAudioTrack,
  IRemoteVideoTrack,
  UID,
} from "agora-rtc-sdk-ng";
import AgoraRTC from "agora-rtc-sdk-ng";
import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import clsx from "clsx";
import { Circle, Clock, Copy, Crown, ListChecks, Mic, MicOff, Settings, Users, Video, VideoOff } from "lucide-react";

/**
 * VideoRoomClient
 * - Safe join using isMounted guard to prevent OPERATION_ABORTED
 * - Multi-user grid rendering
 * - Toggle mic / cam, leave call, cleanup
 *
 * Props (all strings): channel, token, appId, uid (user account string), roomId
 */

type Props = {
  channel: string;
  token: string;
  appId: string;
  uid?: string;
  roomId?: string;
  hostId?: string;
};

export default function VideoRoomClient({
  channel,
  token,
  appId,
  uid,
  roomId,
  hostId,
}: Props) {
  // basic quick validation
  const missing = !channel || !token || !appId;

  // Agora client & local tracks
  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const localAudioTrack = useRef<ILocalAudioTrack | null>(null);
  const localVideoTrack = useRef<ILocalVideoTrack | null>(null);

  // local video DOM ref
  const localVideoRef = useRef<HTMLDivElement | null>(null);

  // remote users map: uid -> { videoTrack?, audioTrack? }
  type RemoteUserState = {
    videoTrack?: IRemoteVideoTrack | null;
    audioTrack?: IRemoteAudioTrack | null;
    connected?: boolean;
  };

  const [remoteUsers, setRemoteUsers] = useState<Map<UID, RemoteUserState>>(new Map());

  const [joined, setJoined] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const joinAttemptRef = useRef(0);

  // Helper: set remote user in map (immutable update)
  function setRemote(uid: UID, entry: RemoteUserState | null) {
    setRemoteUsers((prev) => {
      const copy = new Map(prev);
      if (entry === null) {
        copy.delete(uid);
      } else {
        copy.set(uid, { ...(copy.get(uid) || {}), ...entry });
      }
      return copy;
    });
  }

  // JOIN effect: safe, cancels gracefully if unmounted during async ops
  useEffect(() => {
    let isMounted = true;
    const attempt = ++joinAttemptRef.current;

    async function start() {
      if (missing) {
        setError("Missing channel / token / appId");
        return;
      }

      setLoading(true);
      setError(null);

      const c = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
      clientRef.current = c;

      // event handlers
      c.on("user-joined", (user) => {
        setRemote(user.uid, { connected: true });
      });

      c.on("user-published", async (user, mediaType) => {
        try {
          await c.subscribe(user, mediaType);
          if (!isMounted) return;
          if (mediaType === "video") {
            // @ts-ignore
            const rv = user.videoTrack as IRemoteVideoTrack;
            setRemote(user.uid, { videoTrack: rv, connected: true });
          }
          if (mediaType === "audio") {
            // @ts-ignore
            const ra = (user.audioTrack as IRemoteAudioTrack | undefined) ?? null;
            // play audio immediately
            try {
              ra?.play?.();
            } catch (e) {
              console.warn("remote audio play failed", e);
            }
            setRemote(user.uid, { audioTrack: ra, connected: true });
          }
        } catch (e) {
          console.warn("subscribe failed", e);
        }
      });

      c.on("user-unpublished", (user, mediaType) => {
        if (mediaType === "video") {
          setRemote(user.uid, { videoTrack: null });
        } else if (mediaType === "audio") {
          setRemote(user.uid, { audioTrack: null });
        }
      });

      c.on("user-left", (user) => {
        setRemote(user.uid, null);
      });

      try {
        // join (uid is string user account; pass as is)
        await c.join(appId, channel, token || null, uid);

        if (!isMounted || joinAttemptRef.current !== attempt) return;

        // create tracks (this is where OPERATION_ABORTED often came from)
        const [microphoneTrack, cameraTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();

        if (!isMounted || joinAttemptRef.current !== attempt) {
          // cleanup tracks if we created them but are unmounted
          try {
            await microphoneTrack.stop?.();
            await microphoneTrack.close?.();
          } catch {}
          try {
            await cameraTrack.stop?.();
            await cameraTrack.close?.();
          } catch {}
          return;
        }

        localAudioTrack.current = microphoneTrack;
        localVideoTrack.current = cameraTrack;

        // play local preview
        if (localVideoRef.current) {
          try {
            cameraTrack.play(localVideoRef.current);
          } catch (e) {
            console.warn("play local preview failed", e);
          }
        }

        // publish
        await c.publish([microphoneTrack, cameraTrack]);

        if (!isMounted || joinAttemptRef.current !== attempt) return;

        setJoined(true);
        setLoading(false);
      } catch (e: any) {
        console.error("Agora join/create tracks error", e);
        if (!isMounted) return;
        // If token expired or invalid, surface friendly message
        const msg = e?.message || String(e);
        setError(msg.includes("token") ? "Invalid or expired token" : msg);
        setLoading(false);
      }
    }

    start();

    return () => {
      // unmount: prevent async flow from applying, and perform cleanup
      isMounted = false;

      (async () => {
        try {
          const c = clientRef.current;
          if (c) {
            try {
              await c.unpublish();
            } catch {}
            try {
              await c.leave();
            } catch {}
            c.removeAllListeners();
          }
        } catch (e) {
          console.warn("cleanup leave error", e);
        }

        // close local tracks
        try {
          if (localAudioTrack.current) {
            await localAudioTrack.current.stop?.();
            await localAudioTrack.current.close?.();
            localAudioTrack.current = null;
          }
          if (localVideoTrack.current) {
            await localVideoTrack.current.stop?.();
            await localVideoTrack.current.close?.();
            localVideoTrack.current = null;
          }
        } catch (e) {
          // ignore
        }

        // reset state
        setJoined(false);
        setRemoteUsers(new Map());
        clientRef.current = null;
      })();
    };
    // We intentionally omit dependency on uid/appId/token/channel so effect runs once per mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once

  // Toggle mic
  async function toggleMic() {
    if (!localAudioTrack.current) return;
    try {
      if (micOn) {
        await localAudioTrack.current.setEnabled(false);
        setMicOn(false);
      } else {
        await localAudioTrack.current.setEnabled(true);
        setMicOn(true);
      }
    } catch (e) {
      console.warn("toggleMic failed", e);
      setError("Failed to toggle mic");
    }
  }

  // Toggle camera
  async function toggleCam() {
    if (!localVideoTrack.current) return;
    try {
      if (camOn) {
        await localVideoTrack.current.setEnabled(false);
        setCamOn(false);
      } else {
        await localVideoTrack.current.setEnabled(true);
        setCamOn(true);
      }
    } catch (e) {
      console.warn("toggleCam failed", e);
      setError("Failed to toggle camera");
    }
  }

  // Leave call explicitly
  async function leaveCall() {
    setLoading(true);
    try {
      const c = clientRef.current;
      if (c) {
        try {
          await c.unpublish();
        } catch {}
        try {
          await c.leave();
        } catch {}
        c.removeAllListeners();
        clientRef.current = null;
      }

      if (localAudioTrack.current) {
        try {
          await localAudioTrack.current.stop?.();
          await localAudioTrack.current.close?.();
        } catch {}
        localAudioTrack.current = null;
      }
      if (localVideoTrack.current) {
        try {
          await localVideoTrack.current.stop?.();
          await localVideoTrack.current.close?.();
        } catch {}
        localVideoTrack.current = null;
      }

      setRemoteUsers(new Map());
      setJoined(false);
      setLoading(false);
      // optional: navigate away if you want; otherwise user stays on page
      // router.push("/group-practice");
    } catch (e) {
      console.error("leave error", e);
      setError("Failed to leave call cleanly");
      setLoading(false);
    }
  }

  const remoteEntries = useMemo(() => Array.from(remoteUsers.entries()), [remoteUsers]);

  const participants = useMemo<ParticipantMeta[]>(() => {
    const list: ParticipantMeta[] = [];
    if (uid) {
      list.push({
        id: `local-${uid}`,
        label: formatDisplayName(uid),
        role: hostId && uid === hostId ? "Host" : "Participant",
        isHost: Boolean(hostId && uid === hostId),
        isLocal: true,
        micOn,
        camOn,
        connected: joined,
      });
    }
    remoteEntries.forEach(([rUid, tracks]) => {
      const id = String(rUid);
      list.push({
        id,
        label: formatDisplayName(id),
        role: hostId && id === hostId ? "Host" : "Participant",
        isHost: Boolean(hostId && id === hostId),
        isLocal: false,
        micOn: Boolean(tracks.audioTrack),
        camOn: Boolean(tracks.videoTrack),
        connected: true,
      });
    });
    return list;
  }, [remoteEntries, uid, hostId, micOn, camOn, joined]);

  const stageTiles = useMemo(() => {
    const tiles: StageTileDescriptor[] = [];
    if (uid) {
      tiles.push({
        key: `local-${uid}`,
        label: formatDisplayName(uid),
        role: hostId && uid === hostId ? "Host" : "Participant",
        isHost: Boolean(hostId && uid === hostId),
        isLocal: true,
        micOn,
        camOn,
        content: <div ref={localVideoRef} className="w-full h-full" />,
      });
    }
    remoteEntries.forEach(([rUid, tracks]) => {
      const id = String(rUid);
      tiles.push({
        key: id,
        label: formatDisplayName(id),
        role: hostId && id === hostId ? "Host" : "Participant",
        isHost: Boolean(hostId && id === hostId),
        isLocal: false,
        micOn: Boolean(tracks.audioTrack),
        camOn: Boolean(tracks.videoTrack),
        content: <RemoteVideoSurface videoTrack={tracks.videoTrack ?? null} />,
      });
    });
    return tiles;
  }, [remoteEntries, uid, hostId, camOn, micOn]);

  const roomCode = roomId || channel;
  const sessionTitle = "Panel Interview Practice";
  const displayCode = roomCode || "Unavailable";
  const sessionMeta = {
    type: "Panel Interview",
    duration: "45:00",
    questionsLeft: 3,
    agenda: "Behavioral Round",
  };
  const liveState = joined ? "Live" : loading ? "Connecting" : "Preparing";

  async function handleCopyRoomCode() {
    if (!roomCode || typeof navigator === "undefined" || !navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.warn("copy failed", err);
    }
  }

  const stageGridClass = clsx(
    "grid gap-4 justify-items-stretch",
    stageTiles.length > 1 && "md:grid-cols-2",
    stageTiles.length > 3 && "2xl:grid-cols-3"
  );

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 pt-6 pb-10 lg:gap-8 lg:px-8">
      <div className="flex flex-col gap-4 rounded-3xl border border-white/5 bg-black/30 px-5 py-4 shadow-inner lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-white">{sessionTitle}</h2>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-white/70">
            <span
              className={clsx(
                "inline-flex items-center gap-2 rounded-full px-3 py-1 font-medium",
                joined
                  ? "bg-emerald-500/10 text-emerald-400"
                  : loading
                  ? "bg-amber-500/10 text-amber-400"
                  : "bg-white/10 text-white/70"
              )}
            >
              <Circle className="h-3 w-3 fill-current" />
              {liveState}
            </span>
            <span className="flex items-center gap-2">
              <span className="text-white/60">Room Code:</span>
              <span className="font-mono text-white">{displayCode}</span>
              {roomCode && (
                <button
                  onClick={handleCopyRoomCode}
                  className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2.5 py-1 text-xs text-white/70 hover:bg-white/10"
                >
                  <Copy className="h-3.5 w-3.5" />
                  {copied ? "Copied" : "Copy"}
                </button>
              )}
            </span>
          </div>
        </div>
        <Button onClick={leaveCall} className="bg-red-600 hover:bg-red-500 w-full sm:w-auto">
          Leave Room
        </Button>
      </div>

      <div className="flex flex-col gap-6 xl:flex-row">
        <Card className="flex-1 border border-white/5 bg-black/40 p-4 sm:p-6">
          <div className="space-y-6">
            <div className={stageGridClass}>
              {stageTiles.length > 0 ? (
                stageTiles.map((tile) => (
                  <StageTile
                    key={tile.key}
                    label={tile.isLocal ? "You" : tile.label}
                    name={tile.label}
                    role={tile.role}
                    isHost={tile.isHost}
                    micOn={tile.micOn}
                    camOn={tile.camOn}
                    isLocal={tile.isLocal}
                  >
                    {tile.content}
                  </StageTile>
                ))
              ) : (
                <div className="col-span-full flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 p-10 text-center text-white/50">
                  <p>No participants yet</p>
                  <p className="text-sm text-white/40">Share the room code to invite others.</p>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-8 rounded-2xl border border-white/5 bg-black/30 px-6 py-5">
              <ControlCircle
                label={micOn ? "Mute" : "Unmute"}
                icon={micOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                active={micOn}
                onClick={toggleMic}
                disabled={!joined}
                danger={!micOn}
              />
              <ControlCircle
                label={camOn ? "Camera off" : "Camera on"}
                icon={camOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
                active={camOn}
                onClick={toggleCam}
                disabled={!joined}
                danger={!camOn}
              />
              <ControlCircle
                label="Settings"
                icon={<Settings className="h-5 w-5" />}
                active
                onClick={() => console.log("open settings")}
                disabled={!joined}
              />
            </div>

            {error && <div className="text-sm text-red-400">{error}</div>}
            {loading && <div className="text-sm text-white/60">Connecting to Agora...</div>}
          </div>
        </Card>

        <div className="w-full space-y-6 xl:w-80">
          <Card className="space-y-4 border border-white/5 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-lg font-semibold text-white">
                <Users className="h-5 w-5" />
                Participants ({participants.length})
              </div>
            </div>
            <div className="space-y-4">
              {participants.map((participant) => (
                <ParticipantRow key={participant.id} participant={participant} />
              ))}
              {participants.length === 0 && (
                <div className="text-sm text-white/60">Waiting for participants to join…</div>
              )}
            </div>
          </Card>

          <Card className="space-y-4 border border-white/5 p-4">
            <h3 className="text-lg font-semibold text-white">Session Info</h3>
            <div className="space-y-3 text-sm">
              <InfoRow icon={<Video className="h-4 w-4 text-white/60" />} label="Type" value={sessionMeta.type} />
              <InfoRow icon={<Clock className="h-4 w-4 text-white/60" />} label="Duration" value={sessionMeta.duration} />
              <InfoRow
                icon={<ListChecks className="h-4 w-4 text-white/60" />}
                label="Questions left"
                value={String(sessionMeta.questionsLeft)}
              />
              <InfoRow icon={<Users className="h-4 w-4 text-white/60" />} label="Agenda" value={sessionMeta.agenda} />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

type StageTileDescriptor = {
  key: string;
  label: string;
  role: string;
  isHost: boolean;
  isLocal: boolean;
  micOn: boolean;
  camOn: boolean;
  content: React.ReactNode;
};

type ParticipantMeta = {
  id: string;
  label: string;
  role: string;
  isHost: boolean;
  isLocal: boolean;
  micOn: boolean;
  camOn: boolean;
  connected: boolean;
};

type ControlCircleProps = {
  label: string;
  icon: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  active?: boolean;
  danger?: boolean;
};

function ControlCircle({ label, icon, onClick, disabled, active = false, danger = false }: ControlCircleProps) {
  return (
    <div className="flex flex-col items-center gap-2 text-xs text-white/60">
      <button
        onClick={onClick}
        disabled={disabled}
        className={clsx(
          "flex h-14 w-14 items-center justify-center rounded-full border border-white/10 text-white transition focus:outline-none",
          active ? "bg-white/10" : "bg-white/5",
          danger && "bg-red-500/20 border-red-500/30",
          disabled && "opacity-40 cursor-not-allowed"
        )}
      >
        {icon}
      </button>
      <span>{label}</span>
    </div>
  );
}

type StageTileProps = {
  label: string;
  name: string;
  role: string;
  isHost: boolean;
  micOn: boolean;
  camOn: boolean;
  isLocal: boolean;
  children?: React.ReactNode;
};

function StageTile({ label, name, role, isHost, micOn, camOn, isLocal, children }: StageTileProps) {
  const initial = name?.trim()?.charAt(0)?.toUpperCase() || "U";
  return (
    <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-white/10 bg-zinc-950">
      <div className={clsx("absolute inset-0 transition-opacity", camOn ? "opacity-100" : "opacity-0")}>{children}</div>
      {!camOn && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-zinc-900">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/10 text-3xl font-semibold text-white/70">
            {initial}
          </div>
          <div className="text-sm text-white/60">{isLocal ? "Camera off" : "Waiting for video"}</div>
        </div>
      )}
      <div className="absolute left-4 bottom-4 flex flex-col gap-1 text-white">
        <div className="inline-flex items-center gap-2 rounded-full bg-black/60 px-3 py-1 text-sm font-medium backdrop-blur">
          {isHost && <Crown className="h-4 w-4 text-amber-300" />}
          {label}
        </div>
        <span className="text-xs uppercase tracking-wide text-white/60">{role}</span>
      </div>
      <div className="absolute right-4 bottom-4 flex h-9 w-9 items-center justify-center rounded-full bg-black/70">
        {micOn ? <Mic className="h-4 w-4 text-white" /> : <MicOff className="h-4 w-4 text-red-400" />}
      </div>
    </div>
  );
}

function ParticipantRow({ participant }: { participant: ParticipantMeta }) {
  const initial = participant.label?.charAt(0)?.toUpperCase() || "U";
  return (
    <div className="flex items-center justify-between rounded-xl border border-white/5 bg-white/5 px-3 py-2">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-sm font-semibold text-white">
          {participant.isLocal ? "You" : initial}
        </div>
        <div>
          <div className="text-sm font-medium text-white">{participant.isLocal ? "You" : participant.label}</div>
          <div className="text-xs text-white/60">{participant.role}</div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span
          className={clsx(
            "h-2.5 w-2.5 rounded-full",
            participant.connected ? "bg-emerald-400" : "bg-zinc-500"
          )}
        />
        {participant.micOn ? (
          <Mic className="h-4 w-4 text-white/70" />
        ) : (
          <MicOff className="h-4 w-4 text-red-400" />
        )}
      </div>
    </div>
  );
}

function RemoteVideoSurface({ videoTrack }: { videoTrack?: IRemoteVideoTrack | null }) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!videoTrack || !containerRef.current) return;
    const el = document.createElement("div");
    el.style.width = "100%";
    el.style.height = "100%";
    containerRef.current.innerHTML = "";
    containerRef.current.appendChild(el);
    const playResult = videoTrack.play(el as HTMLElement);
    Promise.resolve(playResult).catch((e) => console.warn("remote play failed", e));

    return () => {
      if (containerRef.current?.contains(el)) {
        containerRef.current.removeChild(el);
      }
    };
  }, [videoTrack]);

  return <div ref={containerRef} className="h-full w-full bg-black" />;
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-white/5 px-3 py-2">
      <div className="flex items-center gap-2 text-white/60">
        {icon}
        <span>{label}</span>
      </div>
      <span className="font-medium text-white">{value}</span>
    </div>
  );
}

function formatDisplayName(value?: string) {
  if (!value) return "Guest";
  return value
    .split(/[-_]/)
    .filter(Boolean)
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(" ");
}
