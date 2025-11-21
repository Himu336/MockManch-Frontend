"use client";

import { useSearchParams, useParams } from "next/navigation";
import WrapperClient from "./WrapperClient";

export default function VideoRoomPage() {
  const params = useParams();
  const searchParams = useSearchParams();

  const channel = (params?.channel as string) || "";
  const token = searchParams.get("token") || "";
  const appId = searchParams.get("appId") || "";
  const uid = searchParams.get("uid") || "";
  const roomId = searchParams.get("roomId") || "";
  const hostId = searchParams.get("hostId") || "";

  console.log("VideoRoomPage loaded with:", {
    channel,
    token: token ? "✓ present" : "✗ missing",
    appId: appId ? "✓ present" : "✗ missing",
    uid,
  });

  return (
    <WrapperClient
      channel={channel}
      token={token}
      appId={appId}
      uid={uid}
      roomId={roomId}
      hostId={hostId}
    />
  );
}
