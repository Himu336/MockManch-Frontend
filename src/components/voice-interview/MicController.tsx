"use client";

import { Mic, MicOff } from "lucide-react";
import type { MicStatus } from "./useVoiceInterview";

type Props = {
  micStatus: MicStatus;
  isRecording: boolean;
  isMuted: boolean;
  onMicClick: () => void;
  onStopRecording: () => void;
  onToggleMute: () => void;
  onEndInterview: () => void;
};

const statusCopy: Record<MicStatus, string> = {
  disabled: "Microphone disabled",
  muted: "AI speaking",
  preparing: "Getting things ready…",
  listening: "Listening for your answer…",
  recording: "Recording now",
  processing: "Analyzing your response…",
};

export default function MicController({
  micStatus,
  isRecording,
  isMuted,
  onMicClick,
  onStopRecording,
  onToggleMute,
  onEndInterview,
}: Props) {
  const isInteractive = micStatus !== "disabled" && micStatus !== "processing";

  const handleClick = () => {
    if (!isInteractive) return;
    if (isRecording) {
      onStopRecording();
    } else {
      onMicClick();
    }
  };

  const micStyles = (() => {
    if (isMuted || micStatus === "muted") {
      return "border border-[rgba(248,113,113,0.5)] bg-[#2A1116] shadow-[0_0_25px_rgba(248,113,113,0.35)]";
    }
    if (micStatus === "recording") {
      return "bg-gradient-to-br from-[#7C3AED] to-[#8B5CF6] shadow-[0_0_45px_rgba(124,58,237,0.6)]";
    }
    if (micStatus === "listening") {
      return "border border-[rgba(124,58,237,0.5)] bg-[#1B1B22] shadow-[0_0_35px_rgba(124,58,237,0.35)]";
    }
    return "border border-white/10 bg-[#1B1B22]";
  })();

  return (
    <div className="flex flex-col gap-6 rounded-3xl border border-[rgba(124,58,237,0.2)] bg-[#131317] px-6 py-6 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-col items-center gap-3 text-center">
        <button
          type="button"
          onClick={handleClick}
          className={`relative flex h-28 w-28 items-center justify-center rounded-full transition-all duration-300 ${
            isInteractive ? "hover:scale-105" : "cursor-not-allowed opacity-60"
          } ${micStyles}`}
        >
          {isMuted ? <MicOff className="h-8 w-8 text-white" /> : <Mic className="h-8 w-8 text-white" />}
          {micStatus === "recording" && (
            <span className="pointer-events-none absolute -inset-3 rounded-full border border-[rgba(124,58,237,0.35)] animate-pulse" />
          )}
          {(isMuted || micStatus === "muted") && (
            <span className="absolute right-4 top-4 h-3 w-3 rounded-full bg-[#F87171] shadow-[0_0_15px_rgba(248,113,113,0.8)]" />
          )}
        </button>
        <div className="space-y-1">
          <p className="text-[11px] uppercase tracking-[0.3em] text-[#A1A1AA]">Microphone</p>
          <p className="text-sm text-white">{statusCopy[micStatus]}</p>
        </div>
      </div>

      <div className="flex w-full flex-col gap-3 text-sm lg:w-auto lg:flex-row lg:items-center lg:justify-end">
        <button
          type="button"
          onClick={onToggleMute}
          className={`rounded-xl px-5 py-3 font-semibold transition-all ${
            isMuted
              ? "border border-white/10 bg-[#1B1B22] text-[#F4F4F5]"
              : "bg-gradient-to-r from-[#7C3AED] to-[#8B5CF6] text-white shadow-[0_10px_30px_rgba(124,58,237,0.35)]"
          }`}
        >
          {isMuted ? "Unmute" : "Mute"}
        </button>
        <button
          type="button"
          onClick={onEndInterview}
          className="rounded-xl border border-[rgba(124,58,237,0.3)] px-5 py-3 font-semibold text-white transition-colors hover:bg-white/5"
        >
          End Interview
        </button>
      </div>
    </div>
  );
}

