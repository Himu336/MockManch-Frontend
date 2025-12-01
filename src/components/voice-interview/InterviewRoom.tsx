"use client";

import { useEffect, useMemo, useState } from "react";
import type { CreateVoiceInterviewRequest, VoiceInterviewAnalysis } from "../../lib/api";
import AiAvatar from "./AiAvatar";
import CaptionPanel from "./CaptionPanel";
import MicController from "./MicController";
import ProgressBar from "./ProgressBar";
import InterviewEndScreen from "./InterviewEndScreen";
import { useVoiceInterview } from "./useVoiceInterview";
import Button from "../ui/Button";
import WaveformStrip from "./WaveformStrip";

type Props = {
  config: CreateVoiceInterviewRequest;
  onComplete?: (analysis: VoiceInterviewAnalysis) => void;
  onExit?: () => void;
  onViewReport?: (analysis: VoiceInterviewAnalysis) => void;
};

export default function InterviewRoom({ config, onComplete, onExit, onViewReport }: Props) {
  const {
    status,
    connectionMessage,
    error,
    timeline,
    liveTranscript,
    aiState,
    micStatus,
    isRecording,
    isMicManuallyMuted,
    isAiSpeaking,
    isProcessingUserResponse,
    progress,
    analysis,
    startInterview,
    leaveSession,
    toggleMicMute,
    startManualRecording,
    stopManualRecording,
    retryMessage,
    clearRetryMessage,
  } = useVoiceInterview(config);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (analysis && onComplete) {
      onComplete(analysis);
    }
  }, [analysis, onComplete]);

  const handleExit = () => {
    leaveSession();
    onExit?.();
  };

  const handleViewReport = () => {
    if (analysis) {
      onViewReport?.(analysis);
    }
  };

  const showStartPrompt = status === "ready" && timeline.length === 0;
  const showLoading = status === "creating" || status === "connecting";

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;
    if (status === "running") {
      timer = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else if (status === "completed" || status === "idle" || status === "creating" || status === "connecting") {
      setElapsedSeconds(0);
    }

    return () => {
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [status]);

  const formattedTimer = useMemo(() => {
    const minutes = Math.floor(elapsedSeconds / 60)
      .toString()
      .padStart(2, "0");
    const seconds = (elapsedSeconds % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
  }, [elapsedSeconds]);

  const aiStatusMessage = useMemo(() => {
    if (showLoading) return connectionMessage;
    if (status === "ready" && showStartPrompt) return "Ready when you are";
    switch (aiState) {
      case "speaking":
        return "Speaking…";
      case "listening":
        return isMicManuallyMuted ? "Waiting for you to unmute" : "Listening…";
      case "thinking":
        return "Thinking…";
      default:
        return "Idle";
    }
  }, [aiState, connectionMessage, isMicManuallyMuted, showLoading, showStartPrompt, status]);

  const body = useMemo(() => {
    if (analysis && status === "completed") {
      return (
        <InterviewEndScreen
          analysis={analysis}
          onExit={handleExit}
          onViewReport={handleViewReport}
        />
      );
    }

    // Don't show error UI during initialization - show loading instead
    if (error && !showLoading) {
      return (
        <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-8 text-center space-y-4">
          <p className="text-red-200 text-lg font-semibold">We hit a snag</p>
          <p className="text-sm text-red-100/80">{error}</p>
          <Button onClick={handleExit}>Exit</Button>
        </div>
      );
    }

    if (showLoading) {
      return (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center space-y-4 animate-pulse">
          <p className="text-white text-lg font-semibold">Preparing your interviewer…</p>
          <p className="text-white/60 text-sm">{connectionMessage}</p>
        </div>
      );
    }

    const isWaveMuted = isMicManuallyMuted || micStatus === "muted" || micStatus === "disabled";

    return (
      <div className="flex flex-col gap-10 rounded-[32px] border border-[rgba(255,255,255,0.08)] bg-[#0D0D10] px-6 py-8 text-white lg:px-10">
        <header className="grid gap-4 text-center sm:text-left md:grid-cols-[auto,1fr,auto] md:items-center">
          <button
            type="button"
            onClick={handleExit}
            className="text-sm font-semibold text-white/80 transition hover:text-white md:justify-self-start"
          >
            &larr; Back to Configuration
          </button>
          <div>
            <h2 className="text-2xl font-semibold text-white">Voice Interview</h2>
            <p className="text-sm text-[#A1A1AA]">AI-Powered Technical Round</p>
          </div>
          <div className="flex items-center justify-center">
            <div className="rounded-full border border-[rgba(124,58,237,0.4)] bg-[#131317] px-4 py-1 text-sm font-mono text-white">
              {formattedTimer}
            </div>
          </div>
        </header>

        <div className="flex flex-col items-center gap-6">
          <AiAvatar state={aiState} name="AI Interviewer" role={config.interview_role ?? "Senior HR"} />
          <div className="flex items-center gap-2 text-sm text-[#A1A1AA]">
            <span className={`h-2 w-2 rounded-full ${isAiSpeaking ? "bg-[#F97316]" : "bg-[#7C3AED]"} animate-pulse`} />
            <span>{aiStatusMessage}</span>
          </div>
          {showStartPrompt && (
            <Button size="sm" className="rounded-full bg-gradient-to-r from-[#7C3AED] to-[#8B5CF6] px-6 py-2 text-white" onClick={startInterview}>
              Start Interview
            </Button>
          )}
        </div>

        <CaptionPanel
          timeline={timeline}
          liveTranscript={liveTranscript}
          connectionMessage={connectionMessage}
          isProcessing={isProcessingUserResponse}
        />

        {retryMessage && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-300/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            <span>{retryMessage}</span>
            <button
              type="button"
              onClick={clearRetryMessage}
              className="text-xs uppercase tracking-[0.25em] text-amber-200/80 transition hover:text-white"
            >
              Dismiss
            </button>
          </div>
        )}

        <WaveformStrip micStatus={micStatus} isRecording={isRecording} isMuted={isWaveMuted} />

        <ProgressBar
          current={progress.currentQuestionIndex}
          total={progress.totalQuestions}
          percentage={progress.percentage}
          phase={progress.phase}
        />

        <MicController
          micStatus={micStatus}
          isRecording={isRecording}
          isMuted={isMicManuallyMuted}
          onMicClick={startManualRecording}
          onStopRecording={stopManualRecording}
          onToggleMute={toggleMicMute}
          onEndInterview={handleExit}
        />
      </div>
    );
  }, [
    analysis,
    aiState,
    aiStatusMessage,
    config.interview_role,
    connectionMessage,
    formattedTimer,
    error,
    handleExit,
    handleViewReport,
    isAiSpeaking,
    isMicManuallyMuted,
    isProcessingUserResponse,
    isRecording,
    liveTranscript,
    micStatus,
    clearRetryMessage,
    progress,
    retryMessage,
    showLoading,
    showStartPrompt,
    startInterview,
    startManualRecording,
    status,
    stopManualRecording,
    timeline,
    toggleMicMute,
  ]);

  return body;
}

