'use client';

import { useEffect, useRef, useState } from "react";
import AgoraRTC from "agora-rtc-sdk-ng";

type Props = {
  channel: string;
  token: string;
  appId: string;
  uid: string;
  roomId: string;
};

export default function VideoRoomClient({ channel, token, appId, uid }: Props) {
  console.log("CLIENT PARAMS:", {
    appId, token, channel, uid
  });

  const videoRef = useRef(null);

  useEffect(() => {
    if (!appId || !token || !channel) {
      console.error("Missing Agora params");
      return;
    }

    const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });

    (async () => {
      try {
        await client.join(appId, channel, token, uid);

        const [aTrack, vTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
        if(videoRef.current) {
          vTrack.play(videoRef.current);
        }

        await client.publish([aTrack, vTrack]);

      } catch (err) {
        console.error("AGORA ERROR:", err);
      }
    })();

    return () => {
      client?.leave?.();
    };
  }, [appId, token, channel, uid]);

  return (
    <div>
      <h1>Video Room</h1>
      <div ref={videoRef} className="w-full h-64 bg-black" />
    </div>
  );
}
