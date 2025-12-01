"use client";

import { useEffect, useState } from "react";
import type { VoiceInterviewAnalysis } from "../../lib/api";

type Props = {
  analysis: VoiceInterviewAnalysis;
  onExit: () => void;
  onViewReport?: () => void;
};

const metricCard = (label: string, value: number, accent: string) => (
  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
    <p className="text-xs uppercase tracking-[0.3em] text-white/40 mb-2">{label}</p>
    <p className={`text-3xl font-bold ${accent}`}>{value.toFixed(1)}%</p>
  </div>
);

export default function InterviewEndScreen({ analysis, onExit, onViewReport }: Props) {
  const [score, setScore] = useState(0);

  useEffect(() => {
    const duration = 800;
    const start = performance.now();
    const animate = (timestamp: number) => {
      const progress = Math.min(1, (timestamp - start) / duration);
      setScore(analysis.overall_score * progress);
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }, [analysis.overall_score]);

  return (
    <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-blue-950/60 via-purple-950/40 to-black/80 p-8 space-y-6">
      <div className="text-center space-y-2">
        <p className="text-sm uppercase tracking-[0.4em] text-emerald-300">Interview Completed</p>
        <h2 className="text-3xl text-white font-semibold">Great job! 🎉</h2>
        <p className="text-white/60 text-sm">{analysis.conversation_summary}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 flex flex-col justify-between">
          <p className="text-xs uppercase tracking-[0.3em] text-white/40 mb-2">Overall Score</p>
          <p className="text-4xl font-bold text-white">{score.toFixed(1)}%</p>
          <p className="text-xs text-white/50">{analysis.answered_questions} / {analysis.total_questions} answered</p>
        </div>
        {metricCard("Communication", analysis.communication_score, "text-sky-300")}
        {metricCard("Content", analysis.content_score, "text-purple-300")}
        {metricCard("Engagement", analysis.engagement_score, "text-pink-300")}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
          <p className="text-xs uppercase tracking-[0.3em] text-emerald-200 mb-3">Strengths</p>
          <ul className="space-y-2 text-sm text-white/80">
            {(analysis.strengths_summary ?? []).map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
          <p className="text-xs uppercase tracking-[0.3em] text-amber-200 mb-3">Improvements</p>
          <ul className="space-y-2 text-sm text-white/80">
            {(analysis.improvement_areas ?? []).map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
        </div>
      </div>

      {(analysis.recommendations?.length ?? 0) > 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs uppercase tracking-[0.3em] text-white/40 mb-3">Recommendations</p>
          <ul className="space-y-2 text-sm text-white/80">
            {analysis.recommendations?.map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-3">
        <button
          type="button"
          onClick={onViewReport}
          disabled={!onViewReport}
          className={`flex-1 rounded-full py-3 font-semibold ${
            onViewReport
              ? "bg-white text-black"
              : "bg-white/10 text-white/40 cursor-not-allowed"
          }`}
        >
          {onViewReport ? "View Full Report" : "Report unavailable"}
        </button>
        <button
          type="button"
          onClick={onExit}
          className="flex-1 rounded-full border border-white/20 py-3 text-white font-semibold"
        >
          Exit
        </button>
      </div>
    </div>
  );
}

