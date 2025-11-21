"use client";

import dynamic from "next/dynamic";

const VideoRoomClient = dynamic(() => import("./VideoRoomClient"), {
  ssr: false,
});

export default function WrapperClient({ channel, token, appId, uid, roomId, hostId }: any) {
  return (
    <VideoRoomClient
      channel={channel}
      token={token}
      appId={appId}
      uid={uid}
      roomId={roomId}
      hostId={hostId}
    />
  );
}
