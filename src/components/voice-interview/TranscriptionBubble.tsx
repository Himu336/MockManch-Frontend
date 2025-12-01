"use client";

type Props = {
  transcript: string;
  isProcessing: boolean;
};

export default function TranscriptionBubble({ transcript, isProcessing }: Props) {
  if (!transcript && !isProcessing) return null;

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl px-5 py-3 flex items-center justify-between text-sm text-white/80">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <p>
          {transcript
            ? transcript
            : "Analyzing your response…"}
        </p>
      </div>
      {transcript && <span className="text-xs text-white/40">Live transcript</span>}
    </div>
  );
}

