"use client";

import type { TimelineEntry } from "./useVoiceInterview";

type Props = {
  timeline: TimelineEntry[];
  liveTranscript: string;
  connectionMessage: string;
  isProcessing: boolean;
};

const roleLabel: Record<TimelineEntry["role"], string> = {
  ai: "AI SPEAKING…",
  user: "YOU SPEAKING…",
  system: "SYSTEM",
};

export default function CaptionPanel({ timeline, liveTranscript, connectionMessage, isProcessing }: Props) {
  const latestMessage = timeline.at(-1);

  const caption = (() => {
    if (isProcessing) {
      return {
        label: "AI PROCESSING…",
        text: "Analyzing your response…",
      };
    }

    if (liveTranscript.trim()) {
      return {
        label: "YOU SPEAKING…",
        text: liveTranscript,
      };
    }

    if (latestMessage) {
      return {
        label: roleLabel[latestMessage.role],
        text: latestMessage.text,
      };
    }

    return {
      label: "AI READY…",
      text: connectionMessage,
    };
  })();

  return (
    <div className="flex w-full justify-center">
      <div className="relative w-full max-w-[700px]">
        <div className="absolute inset-0 rounded-[20px] bg-gradient-to-br from-[rgba(124,58,237,0.45)] to-[rgba(139,92,246,0.45)] opacity-70 blur-lg" />
        <div className="relative rounded-[16px] border border-[rgba(124,58,237,0.25)] bg-[#131317] px-8 py-6 text-center shadow-[0_10px_35px_rgba(0,0,0,0.45)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-[#C4B5FD] mb-3">{caption.label}</p>
          <p className="text-xl leading-relaxed text-white">&quot;{caption.text.trim() || connectionMessage}&quot;</p>
        </div>
      </div>
    </div>
  );
}

