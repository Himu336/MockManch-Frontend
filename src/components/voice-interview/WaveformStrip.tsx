"use client";

import type { MicStatus } from "./useVoiceInterview";

type Props = {
  micStatus: MicStatus;
  isRecording: boolean;
  isMuted: boolean;
};

const activeStatuses: MicStatus[] = ["listening", "recording"];

export default function WaveformStrip({ micStatus, isRecording, isMuted }: Props) {
  const isActive = activeStatuses.includes(micStatus) && !isMuted;

  return (
    <div className="flex w-full justify-center">
      <div className="w-full max-w-[700px] rounded-full border border-[rgba(124,58,237,0.2)] bg-[#111114] px-6 py-4">
        <div className="flex items-end justify-between gap-1">
          {[...Array(28)].map((_, index) => (
            <span
              // biome-ignore lint/suspicious/noArrayIndexKey: static visual bars
              key={index}
              className={`caption-wave-bar h-8 flex-1 rounded-full bg-gradient-to-t from-[#7C3AED] via-[#8B5CF6] to-[#C4B5FD] ${
                isActive ? "opacity-90" : "opacity-25"
              }`}
              style={{
                animationDelay: `${index * 0.05}s`,
                animationDuration: isRecording ? "0.9s" : "1.4s",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

