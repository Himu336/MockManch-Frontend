"use client";

type Props = {
  current: number;
  total: number;
  percentage: number;
  phase: string;
};

export default function ProgressBar({ current, total, percentage, phase }: Props) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-white/50 mb-2">
        <span>
          Question {Math.min(current + 1, total)} / {total}
        </span>
        <span>{phase}</span>
      </div>
      <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transition-all duration-500"
          style={{ width: `${Math.min(100, percentage)}%` }}
        />
      </div>
    </div>
  );
}

