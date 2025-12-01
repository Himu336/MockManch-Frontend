"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import io, { Socket } from "socket.io-client";
import {
  BASE,
  createVoiceInterview,
  getVoiceInterviewAnalysis,
  type CreateVoiceInterviewRequest,
  type VoiceInterviewAnalysis,
  type VoiceInterviewResponse,
  type VoiceInterviewState,
  type ServiceError,
} from "../../lib/api";

type AvatarState = "idle" | "speaking" | "listening" | "thinking";
type MicStatus = "muted" | "preparing" | "listening" | "recording" | "processing" | "disabled";

export type TimelineEntry = {
  id: string;
  role: "ai" | "user" | "system";
  text: string;
  timestamp: number;
};

const createMessage = (role: TimelineEntry["role"], text: string): TimelineEntry => ({
  id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2),
  role,
  text,
  timestamp: Date.now(),
});

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export type UseVoiceInterviewConfig = CreateVoiceInterviewRequest | null;

export type UseVoiceInterviewResult = {
  status: "idle" | "creating" | "connecting" | "ready" | "running" | "completed" | "error";
  connectionMessage: string;
  sessionId: string | null;
  error: string | null;
  timeline: TimelineEntry[];
  liveTranscript: string;
  aiState: AvatarState;
  micStatus: MicStatus;
  isRecording: boolean;
  isAiSpeaking: boolean;
  isProcessingUserResponse: boolean;
  retryMessage: string | null;
  progress: {
    phase: string;
    currentQuestionIndex: number;
    totalQuestions: number;
    percentage: number;
  };
  analysis: VoiceInterviewAnalysis | null;
  startInterview: () => void;
  joinSession: () => void;
  leaveSession: () => void;
  toggleMicMute: () => void;
  isMicManuallyMuted: boolean;
  startManualRecording: () => Promise<void>;
  stopManualRecording: () => void;
  clearRetryMessage: () => void;
};

export const useVoiceInterview = (config: UseVoiceInterviewConfig): UseVoiceInterviewResult => {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [status, setStatus] = useState<UseVoiceInterviewResult["status"]>("idle");
  const [connectionMessage, setConnectionMessage] = useState("Preparing your interviewer…");
  const [error, setError] = useState<string | null>(null);
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [aiState, setAiState] = useState<AvatarState>("idle");
  const [micStatus, setMicStatus] = useState<MicStatus>("disabled");
  const [isRecording, setIsRecording] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [isProcessingUserResponse, setIsProcessingUserResponse] = useState(false);
  const [analysis, setAnalysis] = useState<VoiceInterviewAnalysis | null>(null);
  const [retryMessage, setRetryMessage] = useState<string | null>(null);
  const [isMicManuallyMuted, setIsMicManuallyMuted] = useState(false);

  const [progress, setProgress] = useState({
    phase: "greeting",
    currentQuestionIndex: 0,
    totalQuestions: config?.num_questions ?? 5,
    percentage: 0,
  });

  const socketRef = useRef<Socket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const micMutedRef = useRef(false);
  const lastTranscriptRef = useRef<number | null>(null);
  const hasSpeechRef = useRef(false);
  const recordingStartRef = useRef<number | null>(null);
  const isMountedRef = useRef(true);
  const processingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const stopReasonRef = useRef<"manual" | "silence" | "timeout" | null>(null);
  const silenceDebounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const waitingForFinalTranscriptRef = useRef(false);

  micMutedRef.current = isMicManuallyMuted;

  const resetState = useCallback(() => {
    setTimeline([]);
    setLiveTranscript("");
    setAiState("idle");
    setMicStatus("disabled");
    setIsRecording(false);
    setIsAiSpeaking(false);
    setIsProcessingUserResponse(false);
    setAnalysis(null);
    setProgress({
      phase: "greeting",
      currentQuestionIndex: 0,
      totalQuestions: config?.num_questions ?? 5,
      percentage: 0,
    });
  }, [config?.num_questions]);

  const cleanupMedia = useCallback(() => {
    // Clear processing timeout
    if (processingTimeoutRef.current) {
      clearTimeout(processingTimeoutRef.current);
      processingTimeoutRef.current = null;
    }
    
    // Clear silence debounce timeout
    if (silenceDebounceTimeoutRef.current) {
      clearTimeout(silenceDebounceTimeoutRef.current);
      silenceDebounceTimeoutRef.current = null;
    }
    
    if (mediaRecorderRef.current) {
      try {
        mediaRecorderRef.current.ondataavailable = null;
        mediaRecorderRef.current.onstop = null;
        if (mediaRecorderRef.current.state !== "inactive") {
          mediaRecorderRef.current.stop();
        }
      } catch (err) {
        console.error("Failed to stop media recorder", err);
      }
      mediaRecorderRef.current = null;
    }
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((track) => track.stop());
      audioStreamRef.current = null;
    }
    setIsRecording(false);
    setIsProcessingUserResponse(false);
    hasSpeechRef.current = false;
    lastTranscriptRef.current = null;
    recordingStartRef.current = null;
    stopReasonRef.current = null;
    waitingForFinalTranscriptRef.current = false;
    setRetryMessage(null);
  }, []);

  const cleanupSocket = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  }, []);

  const leaveSession = useCallback(() => {
    cleanupMedia();
    cleanupSocket();
    setSessionId(null);
    setStatus("idle");
    setConnectionMessage("Session ended");
    initializingRef.current = false;
    configRef.current = null;
  }, [cleanupMedia, cleanupSocket]);

  // Convert audio blob to PCM and measure amplitude
  // Returns amplitude (0-1) or null if decoding fails
  const checkAudioAmplitude = useCallback(async (blob: Blob): Promise<number | null> => {
    try {
      const arrayBuffer = await blob.arrayBuffer();
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      // Get PCM data from first channel (mono)
      const channelData = audioBuffer.getChannelData(0);
      const length = channelData.length;
      
      if (length === 0) {
        return 0;
      }
      
      // Calculate RMS (Root Mean Square) amplitude
      let sumSquares = 0;
      for (let i = 0; i < length; i++) {
        const sample = channelData[i];
        if (sample !== undefined) {
          sumSquares += sample * sample;
        }
      }
      const rms = Math.sqrt(sumSquares / length);
      
      // Close audio context to free resources
      await audioContext.close();
      
      return rms;
    } catch (err) {
      console.error("Failed to check audio amplitude:", err);
      return null; // Return null on error - we'll send the chunk anyway to be safe
    }
  }, []);

  const sendAudioChunk = useCallback(
    async (blob: Blob, isFinal: boolean, stopReason?: "manual" | "silence" | "timeout") => {
      // SILENCE DETECTION: Check amplitude before sending
      // Convert chunk to PCM and measure amplitude
      // If amplitude < 0.01 (99% silence) → DROP THE CHUNK
      const amplitude = await checkAudioAmplitude(blob);
      
      if (amplitude !== null && amplitude < 0.01) {
        // 99% silence detected - drop the chunk
        if (isFinal) {
          // For final chunks, log warning but still send (user might have intentionally stopped)
          console.warn(`Final chunk is silent (amplitude: ${amplitude.toFixed(4)}), but sending anyway`);
        } else {
          // For intermediate chunks, drop silent chunks
          console.log(`Dropping silent intermediate chunk (amplitude: ${amplitude.toFixed(4)} < 0.01)`);
          return; // Do NOT send to backend
        }
      } else if (amplitude !== null) {
        console.log(`Audio chunk amplitude: ${amplitude.toFixed(4)} (above threshold)`);
      }
      
      // For non-final chunks during recording, fail silently if socket isn't ready
      // Only validate and throw for final chunks (which will be caught and handled)
      if (!socketRef.current || !sessionId) {
        if (isFinal) {
          throw new Error("Socket or session ID not available");
        }
        console.warn("Skipping audio chunk: Socket or session ID not available");
        return;
      }
      
      // Check if socket is connected
      if (!socketRef.current.connected) {
        if (isFinal) {
          throw new Error("WebSocket not connected");
        }
        console.warn("Skipping audio chunk: WebSocket not connected");
        return;
      }
      
      try {
        console.log(`Converting audio blob to base64 (${blob.size} bytes, final: ${isFinal})...`);
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const result = reader.result as string;
            const base64Data = result.split(",")[1] ?? "";
            console.log(`Audio converted to base64: ${base64Data.length} characters`);
            resolve(base64Data);
          };
          reader.onerror = (error) => {
            console.error("FileReader error:", error);
            reject(new Error("Failed to read audio file"));
          };
          reader.readAsDataURL(blob);
        });

        // Extract audio format from blob type
        const audioFormat = blob.type.includes("webm") ? "webm" : 
                           blob.type.includes("ogg") ? "ogg" :
                           blob.type.includes("mp4") ? "mp4" : "webm";

        const audioPayload: {
          session_id: string;
          audio_data: string;
          audio_format: string;
          sample_rate: number;
          is_final: boolean;
          stop_reason?: "manual" | "silence" | "timeout";
        } = {
          session_id: sessionId,
          audio_data: base64,
          audio_format: audioFormat,
          sample_rate: 16000,
          is_final: isFinal,
        };

        // Add stop_reason only for final chunks
        if (isFinal && stopReason) {
          audioPayload.stop_reason = stopReason;
        }

        console.log(`Emitting audio to server: format=${audioFormat}, size=${base64.length}, final=${isFinal}${isFinal && stopReason ? `, stop_reason=${stopReason}` : ""}`);
        socketRef.current.emit("voiceInterview:audio", audioPayload);
        console.log("Audio emitted successfully");
      } catch (err) {
        console.error("Failed to send audio chunk", err);
        if (isFinal) {
          throw err; // Only throw for final chunks
        }
        // For non-final chunks, just log the error
      }
    },
    [sessionId, checkAudioAmplitude]
  );

  const stopRecording = useCallback((reason: "manual" | "silence" | "timeout" = "manual") => {
    if (!mediaRecorderRef.current) return;
    
    // Clear any existing silence debounce timeout
    if (silenceDebounceTimeoutRef.current) {
      clearTimeout(silenceDebounceTimeoutRef.current);
      silenceDebounceTimeoutRef.current = null;
    }
    
    // Store stop reason for use in onstop handler
    stopReasonRef.current = reason;
    
    try {
      if (mediaRecorderRef.current.state !== "inactive") {
        // For manual stops, stop immediately
        if (reason === "manual" || reason === "timeout") {
          mediaRecorderRef.current.stop();
          setMicStatus("processing");
        } else if (reason === "silence") {
          // For silence stops, add 300-400ms debounce
          silenceDebounceTimeoutRef.current = setTimeout(() => {
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
              mediaRecorderRef.current.stop();
              setMicStatus("processing");
            }
          }, 350); // 350ms debounce (middle of 300-400ms range)
        }
      }
    } catch (err) {
      console.error("Failed to stop recording", err);
    }
  }, []);

  const startRecording = useCallback(async () => {
    if (isRecording || micMutedRef.current) return;
    setRetryMessage(null);
    
    // Don't allow recording if we're still initializing
    if (status === "creating" || status === "connecting" || status === "idle") {
      console.log("Interview still initializing, cannot start recording yet");
      return; // Silently return, don't show error during normal initialization
    }
    
    // Only validate connection if we're in a state where recording should be possible
    if (status === "ready" || status === "running") {
      if (!socketRef.current || !sessionId) {
        console.error("Cannot start recording: Socket or session ID not available");
        setError("Connection lost. Please try restarting the interview.");
        return;
      }
      
      if (!socketRef.current.connected) {
        console.error("Cannot start recording: WebSocket not connected");
        setError("Connection lost. Please wait for reconnection or restart the interview.");
        return;
      }
    } else {
      // If status is "error" or "completed", don't allow recording
      console.log("Cannot start recording: Interview is in", status, "status");
      return;
    }

    try {
      // Get audio stream with optimal settings for STT (ElevenLabs compatible)
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000,
          channelCount: 1,
        } 
      });
      audioStreamRef.current = stream;

      // Force "audio/webm;codecs=opus" as first attempt (required for ElevenLabs STT)
      // Fallbacks are allowed, but this MUST be the first attempt
      const mimeTypes = [
        "audio/webm;codecs=opus", // REQUIRED: First attempt
        "audio/webm",
        "audio/ogg;codecs=opus",
        "audio/mp4",
      ];
      
      let selectedMimeType: string | null = null;
      for (const mimeType of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mimeType)) {
          selectedMimeType = mimeType;
          console.log("Selected audio format:", mimeType);
          break;
        }
      }
      
      if (!selectedMimeType) {
        console.warn("No preferred audio format supported, using default");
        selectedMimeType = "audio/webm"; // Final fallback
      }

      const recorder = new MediaRecorder(stream, { 
        mimeType: selectedMimeType,
        audioBitsPerSecond: 16000, // Low bitrate suitable for speech
      });
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];
      
      // Add error handler for recorder
      recorder.onerror = (event) => {
        console.error("MediaRecorder error:", event);
        setError("Recording error occurred. Please try again.");
      };

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          console.log(`Audio chunk received: ${event.data.size} bytes`);
          audioChunksRef.current.push(event.data);
          // Send intermediate chunks every 1s ONLY for preview mode (live transcription)
          // Node will buffer chunks, frontend should NOT include text messages for /process until final chunk
          sendAudioChunk(event.data, false)
            .then(() => {
              console.log("Intermediate audio chunk sent for preview (live transcription)");
            })
            .catch((err) => {
              console.error("Failed to send intermediate audio chunk:", err);
              // Don't show error to user for intermediate chunks, but log it
            });
        } else {
          console.warn("Received empty audio chunk");
        }
      };

      recorder.onstop = async () => {
        const totalSize = audioChunksRef.current.reduce((sum, chunk) => sum + chunk.size, 0);
        const stopReason = stopReasonRef.current || "manual";
        console.log(`Recording stopped (reason: ${stopReason}). Total audio size: ${totalSize} bytes, Chunks: ${audioChunksRef.current.length}`);
        
        // Clear silence debounce timeout if it exists
        if (silenceDebounceTimeoutRef.current) {
          clearTimeout(silenceDebounceTimeoutRef.current);
          silenceDebounceTimeoutRef.current = null;
        }
        
        if (totalSize === 0) {
          console.warn("No audio data recorded!");
          setIsRecording(false);
          setMicStatus("muted");
          setError("No audio was recorded. Please check your microphone and try again.");
          stopReasonRef.current = null;
          return;
        }
        
        const mimeType = mediaRecorderRef.current?.mimeType || "audio/webm";
        const finalBlob = new Blob(audioChunksRef.current, { type: mimeType });
        console.log(`Final blob created: ${finalBlob.size} bytes, type: ${mimeType}`);
        audioChunksRef.current = [];
        setIsRecording(false);
        hasSpeechRef.current = false;
        lastTranscriptRef.current = null;
        recordingStartRef.current = null;
        
        // Validate socket and session before setting processing state
        if (!socketRef.current || !sessionId) {
          console.error("Cannot send audio: Socket or session ID not available");
          setMicStatus("muted");
          setError("Connection lost. Please try starting the interview again.");
          stopReasonRef.current = null;
          return;
        }
        
        if (!socketRef.current.connected) {
          console.error("Cannot send audio: WebSocket not connected");
          setMicStatus("muted");
          setError("Connection lost. Please try starting the interview again.");
          stopReasonRef.current = null;
          return;
        }
        
        // Set processing state only if we can actually send
        setIsProcessingUserResponse(true);
        setMicStatus("processing");
        waitingForFinalTranscriptRef.current = true;
        console.log("Sending final audio chunk to server...");
        
        // Set a timeout to clear processing state if no response is received
        // Clear any existing timeout first
        if (processingTimeoutRef.current) {
          clearTimeout(processingTimeoutRef.current);
        }
        processingTimeoutRef.current = setTimeout(() => {
          if (isMountedRef.current) {
            console.warn("Processing timeout: No response received from server");
            setIsProcessingUserResponse(false);
            setMicStatus("muted");
            waitingForFinalTranscriptRef.current = false;
            setError("No response received from server. Please try speaking again.");
          }
        }, 30000); // 30 second timeout
        
        // Send the final audio chunk with stop_reason
        // Correct order: 1. Send final chunk → 2. Wait for transcription final → 3. Wait for AI response
        try {
          await sendAudioChunk(finalBlob, true, stopReason);
          console.log(`Final audio chunk sent successfully (stop_reason: ${stopReason}), waiting for transcription final...`);
          stopReasonRef.current = null;
        } catch (err) {
          console.error("Failed to send audio chunk:", err);
          // Clear processing state on send failure
          if (processingTimeoutRef.current) {
            clearTimeout(processingTimeoutRef.current);
            processingTimeoutRef.current = null;
          }
          setIsProcessingUserResponse(false);
          setMicStatus("muted");
          waitingForFinalTranscriptRef.current = false;
          stopReasonRef.current = null;
          setError("Failed to send audio. Please check your connection and try again.");
        }
      };

      recorder.start(1000);
      setIsRecording(true);
      setMicStatus("recording");
      hasSpeechRef.current = false;
      lastTranscriptRef.current = null;
      recordingStartRef.current = Date.now();
    } catch (err) {
      console.error("Failed to start recording", err);
      setError("Microphone access denied. Please check permissions.");
      setMicStatus("muted");
    }
  }, [isRecording, sendAudioChunk, status, sessionId]);

  const playAudio = useCallback(async (base64Audio?: string, format = "mp3") => {
    setIsAiSpeaking(true);
    setAiState("speaking");
    setMicStatus("muted"); // AI speaking → mic muted (no recording)

    if (!base64Audio) {
      await wait(500);
      setIsAiSpeaking(false);
      setAiState("listening");
      return;
    }

    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current = null;
    }

    await new Promise<void>((resolve) => {
      const audio = new Audio(`data:audio/${format};base64,${base64Audio}`);
      audioPlayerRef.current = audio;
      audio.onended = () => {
        setIsAiSpeaking(false);
        setAiState("listening"); // After AI finishes, go to listening state
        resolve();
      };
      audio.onerror = () => {
        console.error("Failed to play audio");
        setIsAiSpeaking(false);
        setAiState("listening");
        resolve();
      };
      audio.play().catch((err) => {
        console.error("Autoplay blocked", err);
        setIsAiSpeaking(false);
        setAiState("listening");
        resolve();
      });
    });
  }, []);

  const beginUserTurn = useCallback(async () => {
    if (status === "completed") return;
    // Don't start recording if AI is still speaking or we're processing
    if (isAiSpeaking || isProcessingUserResponse) {
      console.log("Cannot begin user turn: AI is speaking or processing");
      return;
    }
    setAiState("listening");
    if (micMutedRef.current) {
      setMicStatus("listening"); // Ready but muted
      return;
    }
    setMicStatus("listening"); // Ready to record
    await wait(400);
    await startRecording();
  }, [startRecording, status, isAiSpeaking, isProcessingUserResponse]);

  const handleAIResponse = useCallback(
    async (data: VoiceInterviewResponse) => {
      // Clear processing timeout since we got a response
      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current);
        processingTimeoutRef.current = null;
      }
      
      // Correct order: Final chunk → transcription final → AI response
      // Only process AI response after we've received final transcription
      if (waitingForFinalTranscriptRef.current) {
        console.log("Received AI response but still waiting for final transcription, queuing...");
        // Wait a bit and check again - transcription should arrive soon
        await wait(500);
        if (waitingForFinalTranscriptRef.current) {
          console.warn("AI response received before final transcription - proceeding anyway");
        }
      }
      
      setStatus("running");
      setTimeline((prev) => [...prev, createMessage("ai", data.text)]);
      setProgress({
        phase: data.current_phase,
        currentQuestionIndex: data.current_question_index,
        totalQuestions: data.total_questions,
        percentage: data.progress_percentage,
      });
      setIsProcessingUserResponse(false);
      waitingForFinalTranscriptRef.current = false;
      setError(null); // Clear any previous errors

      // Play AI audio - this sets aiState to "speaking" and micStatus to "muted"
      await playAudio(data.audio_data, data.audio_format);
      // After audio finishes, playAudio sets aiState to "listening"
      await wait(600);
      // Do not restart recording until AI finishes speaking (handled in playAudio)
      if (!data.is_complete) {
        await beginUserTurn();
      }
    },
    [beginUserTurn, playAudio]
  );

  const updateState = useCallback((state: VoiceInterviewState) => {
    setProgress({
      phase: state.current_phase,
      currentQuestionIndex: state.current_question_index,
      totalQuestions: state.total_questions,
      percentage: state.progress_percentage,
    });
    if (state.is_complete) {
      setStatus("completed");
    }
  }, []);

  const handleCompletion = useCallback(
    async (currentSessionId: string) => {
      setStatus("completed");
      cleanupMedia();
      setMicStatus("disabled");
      setAiState("idle");
      try {
        const response = await getVoiceInterviewAnalysis(currentSessionId);
        if (response.success) {
          setAnalysis(response.data);
        }
      } catch (err) {
        console.error("Failed to fetch analysis", err);
      }
    },
    [cleanupMedia]
  );

  const joinSession = useCallback(() => {
    if (!socketRef.current || !sessionId || !config) return;
    socketRef.current.emit("voiceInterview:join", {
      session_id: sessionId,
      user_id: config.user_id,
    });
  }, [config, sessionId]);

  const startInterview = useCallback(() => {
    if (!socketRef.current || !sessionId) return;
    socketRef.current.emit("voiceInterview:start", { session_id: sessionId });
  }, [sessionId]);

  const connectWebSocket = useCallback(
    (newSessionId: string) => {
      if (!config) return;
      setStatus("connecting");
      setConnectionMessage("Connecting to your interviewer…");
      const socket = io(BASE, { transports: ["websocket", "polling"] });
      socketRef.current = socket;

      socket.on("connect", () => {
        setConnectionMessage("Connected. Finalizing setup…");
        socket.emit("voiceInterview:join", {
          session_id: newSessionId,
          user_id: config.user_id,
        });
      });

      socket.on("disconnect", () => {
        // Clear processing timeout on disconnect
        if (processingTimeoutRef.current) {
          clearTimeout(processingTimeoutRef.current);
          processingTimeoutRef.current = null;
        }
        // Clear silence debounce timeout
        if (silenceDebounceTimeoutRef.current) {
          clearTimeout(silenceDebounceTimeoutRef.current);
          silenceDebounceTimeoutRef.current = null;
        }
        setIsProcessingUserResponse(false);
        waitingForFinalTranscriptRef.current = false;
        setMicStatus("muted");
        setConnectionMessage("Disconnected. Attempting to reconnect…");
        setStatus((prev) => (prev === "completed" ? prev : "connecting"));
      });

      socket.on("voiceInterview:joined", (payload: { state: VoiceInterviewState }) => {
        setStatus("ready");
        setConnectionMessage("Your interviewer is ready.");
        updateState(payload.state);
        setMicStatus("muted");
      });

      socket.on("voiceInterview:started", async (data: VoiceInterviewResponse) => {
        await handleAIResponse(data);
      });

      socket.on("voiceInterview:response", async (data: VoiceInterviewResponse) => {
        await handleAIResponse(data);
      });

      socket.on("voiceInterview:transcription", (data: { text: string; is_final: boolean; should_retry?: boolean; retry_message?: string }) => {
        console.log("Transcription received:", { text: data.text, is_final: data.is_final });
        if (data.is_final) {
          // Correct order: After final chunk → wait for transcription final → then wait for AI response
          setLiveTranscript("");
          if (data.should_retry) {
            const message = data.retry_message?.trim() || "We couldn't hear you. Please speak again.";
            setRetryMessage(message);
            setIsProcessingUserResponse(false);
            setMicStatus("listening");
            setIsRecording(false);
            waitingForFinalTranscriptRef.current = false;
            console.warn("Retry requested by backend:", message);
            return;
          }
          setRetryMessage(null);
          if (data.text.trim()) {
            console.log("Adding final transcription to timeline:", data.text);
            setTimeline((prev) => [...prev, createMessage("user", data.text.trim())]);
          } else {
            console.warn("Received empty final transcription");
          }
          hasSpeechRef.current = false;
          lastTranscriptRef.current = null;
          // Mark that we've received final transcription, now waiting for AI response
          waitingForFinalTranscriptRef.current = false;
          console.log("Final transcription received, now waiting for AI response...");
        } else {
          // Live transcript updates (preview mode)
          setLiveTranscript(data.text);
          setRetryMessage(null);
          console.log("Live transcript updated:", data.text);
          if (data.text.trim()) {
            hasSpeechRef.current = true;
            lastTranscriptRef.current = Date.now();
          }
        }
      });

      socket.on("voiceInterview:state", (payload: { state: VoiceInterviewState }) => {
        updateState(payload.state);
      });

      socket.on("voiceInterview:complete", async (payload: { session_id: string }) => {
        await handleCompletion(payload.session_id);
      });

      socket.on("voiceInterview:error", (payload: { error: string }) => {
        console.error("Voice Interview error:", payload.error);
        // Clear processing timeout and state on error
        if (processingTimeoutRef.current) {
          clearTimeout(processingTimeoutRef.current);
          processingTimeoutRef.current = null;
        }
        // Clear silence debounce timeout
        if (silenceDebounceTimeoutRef.current) {
          clearTimeout(silenceDebounceTimeoutRef.current);
          silenceDebounceTimeoutRef.current = null;
        }
        setIsProcessingUserResponse(false);
        waitingForFinalTranscriptRef.current = false;
        
        // Handle "message too short" error gracefully - allow interview to continue
        if (payload.error.includes("too short") || payload.error.includes("at least 2 words")) {
          console.warn("Backend reported short transcript, but keeping interview running.");
          setMicStatus("listening");
          setError(null); // Avoid showing "We hit a snag" UI
          setStatus((prev) => (prev === "completed" ? prev : "running"));
          return;
        } else {
          // For other errors, show error state
          setMicStatus("muted");
          setError(payload.error);
          setStatus("error");
        }
      });
    },
    [config, handleAIResponse, handleCompletion, joinSession, updateState]
  );

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      leaveSession();
    };
  }, [leaveSession]);

  // Track if initialization is in progress to prevent multiple calls
  const initializingRef = useRef(false);
  const configRef = useRef<string | null>(null);
  const connectWebSocketRef = useRef(connectWebSocket);
  const resetStateRef = useRef(resetState);
  const cleanupSocketRef = useRef(cleanupSocket);
  const cleanupMediaRef = useRef(cleanupMedia);

  // Keep refs up to date with latest functions
  connectWebSocketRef.current = connectWebSocket;
  resetStateRef.current = resetState;
  cleanupSocketRef.current = cleanupSocket;
  cleanupMediaRef.current = cleanupMedia;

  // Create a stable config key for comparison
  const configKey = useMemo(() => {
    if (!config) return null;
    return JSON.stringify({
      job_role: config.job_role,
      experience_level: config.experience_level,
      company: config.company,
      job_description: config.job_description,
      interview_type: config.interview_type,
      interview_role: config.interview_role,
      difficulty: config.difficulty,
      user_id: config.user_id,
      num_questions: config.num_questions,
      duration_minutes: config.duration_minutes,
    });
  }, [
    config?.job_role,
    config?.experience_level,
    config?.company,
    config?.job_description,
    config?.interview_type,
    config?.interview_role,
    config?.difficulty,
    config?.user_id,
    config?.num_questions,
    config?.duration_minutes,
  ]);

  useEffect(() => {
    if (!config || !configKey) return;
    
    // Prevent duplicate initialization for the same config
    if (configRef.current === configKey && initializingRef.current) {
      console.log("Skipping duplicate initialization for same config");
      return;
    }

    // If config changed, reset and initialize
    if (configRef.current !== null && configRef.current !== configKey) {
      console.log("Config changed, resetting state");
      cleanupSocketRef.current();
      cleanupMediaRef.current();
      resetStateRef.current();
    }

    // Prevent multiple simultaneous initializations
    if (initializingRef.current) {
      console.log("Already initializing, skipping");
      return;
    }

    setError(null);
    setStatus("creating");
    setConnectionMessage("Preparing your interviewer…");
    resetStateRef.current();

    initializingRef.current = true;
    configRef.current = configKey;

    let cancelled = false;
    const initialize = async () => {
      try {
        const response = await createVoiceInterview(config);
        if (cancelled) return;
        
        initializingRef.current = false;
        
        if (response.success && response.data?.session_id) {
          const newSessionId = response.data.session_id;
          setSessionId(newSessionId);
          setProgress((prev) => ({
            ...prev,
            totalQuestions: response.data?.total_questions ?? prev.totalQuestions,
          }));
          connectWebSocketRef.current(newSessionId);
        } else {
          throw new Error(response.error || "Failed to create interview session");
        }
      } catch (err) {
        initializingRef.current = false;
        if (cancelled) return;
        
        // Handle specific error types
        if (err && typeof err === "object" && "status" in err) {
          const serviceError = err as ServiceError;
          if (serviceError.status === 402) {
            setError("Insufficient tokens. Please purchase more tokens to start a voice interview.");
          } else if (serviceError.status === 401) {
            setError("Authentication required. Please sign in again.");
          } else {
            setError(serviceError.message || "Failed to create interview session");
          }
        } else {
          const message = err instanceof Error ? err.message : "Failed to create interview session";
          setError(message);
        }
        setStatus("error");
      }
    };

    initialize();

    return () => {
      cancelled = true;
      initializingRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configKey]); // Only depend on configKey to prevent unnecessary re-runs

  // Clear errors when entering initialization states
  useEffect(() => {
    if (status === "creating" || status === "connecting") {
      setError(null);
    }
  }, [status]);

  useEffect(() => {
    if (isMicManuallyMuted && isRecording) {
      stopRecording();
    }
  }, [isMicManuallyMuted, isRecording, stopRecording]);

  useEffect(() => {
    if (!isMicManuallyMuted && micStatus === "muted" && aiState === "listening" && !isRecording) {
      beginUserTurn();
    }
  }, [aiState, beginUserTurn, isMicManuallyMuted, isRecording, micStatus]);

  useEffect(() => {
    if (!isRecording) return;
    
    // Strengthen silence detection:
    // - Require 2.5 seconds of silence
    // - Ensure min recording length of 1 second
    // - Do NOT trigger silence if AI is still talking
    const interval = setInterval(() => {
      if (!isRecording) return;
      
      // Don't trigger silence detection if AI is speaking
      if (isAiSpeaking) {
        console.log("Skipping silence detection: AI is speaking");
        return;
      }
      
      const lastUpdate = lastTranscriptRef.current;
      const recordingStart = recordingStartRef.current;
      const now = Date.now();
      
      // Timeout: 60s max duration
      if (recordingStart && now - recordingStart > 60000) {
        console.log("Recording timeout: 60s max duration reached");
        stopRecording("timeout");
        return;
      }
      
      // Silence detection: 2.5 seconds of silence, but only if:
      // 1. We've detected speech at least once (hasSpeechRef.current)
      // 2. Minimum recording length of 1 second has passed
      // 3. Last transcript update was more than 2.5 seconds ago
      if (recordingStart && now - recordingStart >= 1000) { // Min 1 second recording
        if (hasSpeechRef.current && lastUpdate && now - lastUpdate > 2500) {
          console.log("Silence detected: 2.5s of silence after speech");
          stopRecording("silence");
        }
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [isRecording, stopRecording, isAiSpeaking]);

  const startManualRecording = useCallback(async () => {
    if (status === "completed") return;
    await startRecording();
  }, [startRecording, status]);

  const stopManualRecording = useCallback(() => {
    stopRecording("manual");
  }, [stopRecording]);

  const toggleMicMute = useCallback(() => {
    setIsMicManuallyMuted((prev) => !prev);
  }, []);

  const clearRetryMessage = useCallback(() => {
    setRetryMessage(null);
  }, []);

  return useMemo(
    () => ({
      status,
      connectionMessage,
      sessionId,
      error,
      timeline,
      liveTranscript,
      aiState,
      micStatus,
      isRecording,
      isAiSpeaking,
      isProcessingUserResponse,
      retryMessage,
      progress,
      analysis,
      startInterview,
      joinSession,
      leaveSession,
      toggleMicMute,
      isMicManuallyMuted,
      startManualRecording,
      stopManualRecording,
      clearRetryMessage,
    }),
    [
      analysis,
      aiState,
      connectionMessage,
      error,
      isAiSpeaking,
      isMicManuallyMuted,
      isProcessingUserResponse,
      isRecording,
      joinSession,
      leaveSession,
      liveTranscript,
      micStatus,
      retryMessage,
      progress,
      sessionId,
      startInterview,
      startManualRecording,
      status,
      stopManualRecording,
      timeline,
      toggleMicMute,
      clearRetryMessage,
    ]
  );
};

export type { AvatarState, MicStatus };

