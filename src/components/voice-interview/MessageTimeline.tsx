"use client";

import { useEffect, useRef } from "react";
import type { TimelineEntry } from "./useVoiceInterview";

type Props = {
  messages: TimelineEntry[];
};

const roleStyles: Record<TimelineEntry["role"], string> = {
  ai: "justify-end",
  user: "justify-start",
  system: "justify-center",
};

const bubbleStyles: Record<TimelineEntry["role"], string> = {
  ai: "bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-white/10 text-white",
  user: "bg-white/5 border border-white/10 text-white/80",
  system: "bg-amber-500/20 border border-amber-500/30 text-amber-200",
};

export default function MessageTimeline({ messages }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.scrollTo({
      top: containerRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  return (
    <div
      ref={containerRef}
      className="relative flex-1 overflow-hidden"
    >
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-white/0 via-white/0 to-white/5" />
      <div className="relative h-full overflow-y-auto pr-2 space-y-4 max-h-[520px]">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-white/50 text-sm">
            Conversation will appear here
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`flex ${roleStyles[msg.role]}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-lg transition-all duration-300 ${bubbleStyles[msg.role]}`}
              >
                <p className="text-sm leading-relaxed">{msg.text}</p>
                <span className="block text-[10px] uppercase tracking-widest text-white/40 mt-2 text-right">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

