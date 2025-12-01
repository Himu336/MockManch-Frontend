"use client";

import type { AvatarState } from "./useVoiceInterview";

type Props = {
  state: AvatarState;
  name?: string;
  role?: string;
};

const stateConfig: Record<AvatarState, { label: string; glow: string; core: string }> = {
  idle: {
    label: "Idle",
    glow: "from-[#2B2B31] to-[#1C1C21] opacity-70",
    core: "shadow-[0_0_30px_rgba(255,255,255,0.05)]",
  },
  speaking: {
    label: "Speaking",
    glow: "from-[#7C3AED] to-[#8B5CF6] opacity-100",
    core: "shadow-[0_0_45px_rgba(124,58,237,0.55)]",
  },
  listening: {
    label: "Listening",
    glow: "from-[#5B21B6] to-[#7C3AED] opacity-90",
    core: "shadow-[0_0_35px_rgba(91,33,182,0.45)]",
  },
  thinking: {
    label: "Thinking",
    glow: "from-[#F97316] to-[#FDE68A] opacity-90",
    core: "shadow-[0_0_35px_rgba(251,191,36,0.4)]",
  },
};

export default function AiAvatar({
  state,
  name = "AI Interviewer",
  role = "Senior Technical Interviewer",
}: Props) {
  const stateMeta = stateConfig[state];

  return (
    <div className="flex flex-col items-center gap-6 rounded-3xl border border-[rgba(124,58,237,0.2)] bg-[#131317] px-10 py-8 text-center">
      <div className="relative">
        <div className="rounded-full bg-gradient-to-br from-[#18181C] to-[#0D0D10] p-1">
          <div
            className={`relative flex h-40 w-40 items-center justify-center rounded-full bg-gradient-to-br ${stateMeta.glow} transition-all duration-500`}
          >
            <div
              className={`flex h-32 w-32 items-center justify-center rounded-full bg-[#0D0D10] ${stateMeta.core} transition-all duration-500`}
            >
              <span className="text-3xl font-semibold tracking-[0.3em] text-white">AI</span>
            </div>
          </div>
        </div>
        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[11px] font-semibold uppercase tracking-[0.3em] text-[#A1A1AA]">
          {stateMeta.label}
        </div>
      </div>

      <div className="space-y-1">
        <p className="text-2xl font-semibold text-white">{name}</p>
        <p className="text-sm text-[#A1A1AA]">{role}</p>
      </div>
    </div>
  );
}

