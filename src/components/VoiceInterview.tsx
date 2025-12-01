"use client";

import type { CreateVoiceInterviewRequest, VoiceInterviewAnalysis } from "../lib/api";
import InterviewRoom from "./voice-interview/InterviewRoom";

type Props = {
  config: CreateVoiceInterviewRequest;
  onComplete?: (analysis: VoiceInterviewAnalysis) => void;
  onExit?: () => void;
  onViewReport?: (analysis: VoiceInterviewAnalysis) => void;
};

export default function VoiceInterview(props: Props) {
  return <InterviewRoom {...props} />;
}

