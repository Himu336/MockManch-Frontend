// src/components/agora/VideoTile.tsx
"use client";

import React, { useEffect, useRef } from "react";
import type { IRemoteVideoTrack } from "agora-rtc-sdk-ng";
import Card from "../../components/ui/Card";

export default function VideoTile({ uid, videoTrack }: { uid: string; videoTrack?: IRemoteVideoTrack | null }) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!videoTrack || !containerRef.current) return;

    // create a temporary video element and let the remote track play into it
    const el = document.createElement("div");
    el.style.width = "100%";
    el.style.height = "100%";
    containerRef.current.innerHTML = "";
    containerRef.current.appendChild(el);
    // videoTrack.play may return void or a Promise depending on the SDK version;
    // normalize with Promise.resolve so we can safely handle rejections.
    const playResult = videoTrack.play(el as HTMLElement);
    Promise.resolve(playResult).catch((e) => {
      console.warn("remote play failed", e);
    });

    return () => {
      // nothing special to cleanup on track (Agora manages track lifecycle)
      containerRef.current?.removeChild(el);
    };
  }, [videoTrack]);

  return (
    <Card>
      <div className="text-sm text-white/60 mb-2">User: {uid}</div>
      <div className="w-full h-56 bg-black rounded-md overflow-hidden" ref={containerRef}>
        {!videoTrack && <div className="flex items-center justify-center h-full text-white/60">Video off</div>}
      </div>
    </Card>
  );
}
