"use client";

import React, { useState, useMemo, useRef } from "react";
import Card from "../../../components/ui/Card";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import Select from "../../../components/ui/Select";
import Textarea from "../../../components/ui/Textarea";
import VoiceInterview from "../../../components/VoiceInterview";
import {
  Calendar,
  Upload,
  Video,
  Clock,
  MapPin,
  Loader2,
  Info,
  CheckCircle2,
  ArrowLeft,
  Plus,
  Minus,
} from "lucide-react";
import type { VoiceInterviewAnalysis, ServiceError } from "../../../lib/api";
import { recordSession } from "../../../lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useWallet } from "@/hooks/useWallet";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertCircle, Coins, CreditCard } from "lucide-react";

type ScheduledInterview = {
  id: string;
  role: string;
  difficulty: string;
  experienceLevel: string;
  company?: string;
  scheduledTime: string;
  status: "upcoming" | "in-progress" | "completed";
};

export default function VoiceInterviewPage() {
  const { user } = useAuth();
  const { balance, fetchWallet } = useWallet();
  const router = useRouter();
  const [isInterviewActive, setIsInterviewActive] = useState(false);
  const [interviewConfig, setInterviewConfig] = useState<any>(null);
  const [form, setForm] = useState({
    role: "",
    difficulty: "Intermediate",
    experienceLevel: "Mid Level (3-5 years)",
    company: "",
    jobDescription: "",
    interviewType: "Technical",
    interviewRole: "Technical Interviewer",
    numQuestions: 5,
    durationMinutes: 30,
    resume: null as File | null,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [insufficientTokens, setInsufficientTokens] = useState(false);
  const isStartingRef = useRef(false);
  const [scheduledInterviews, setScheduledInterviews] = useState<
    ScheduledInterview[]
  >([]);

  const handleInputChange = (
    field: keyof typeof form,
    value: string | File | number | null
  ) => {
    setForm((prev) => ({ ...prev, [field]: value as any }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    handleInputChange("resume", file);
  };

  const handleStartInterview = async (e?: React.MouseEvent) => {
    // Prevent any default behavior
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    // Prevent multiple simultaneous calls
    if (isStartingRef.current || loading || isInterviewActive) {
      console.log("Already starting or active, ignoring click");
      return;
    }

    if (!form.role.trim()) {
      setError("Please enter a job role");
      return;
    }

    console.log("=== Starting Interview ===");
    console.log("Form data:", form);

    // Set the ref to prevent multiple calls
    isStartingRef.current = true;
    setLoading(true);
    setError(null);
    setInsufficientTokens(false);

    try {
      // Map difficulty to API format (form uses Beginner/Intermediate/Advanced)
      const difficultyMap: Record<string, "Beginner" | "Intermediate" | "Advanced"> = {
        Beginner: "Beginner",
        Intermediate: "Intermediate",
        Advanced: "Advanced",
      };

      const config = {
        job_role: form.role,
        experience_level: form.experienceLevel,
        company: form.company || undefined,
        job_description: form.jobDescription || undefined,
        interview_type: form.interviewType,
        interview_role: form.interviewRole || undefined,
        difficulty: difficultyMap[form.difficulty] || "Intermediate",
        user_id: user?.id || "",
        num_questions: form.numQuestions,
        duration_minutes: form.durationMinutes,
      };

      console.log("Interview config created:", config);

      // Use functional updates to ensure state is set correctly
      setInterviewConfig(() => {
        console.log("Setting interview config");
        return config;
      });
      
      setIsInterviewActive(() => {
        console.log("Setting isInterviewActive to true");
        return true;
      });
      
      // Refresh wallet balance after successful token deduction
      await fetchWallet();
    } catch (err) {
      console.error("Error starting interview:", err);
      
      // Handle specific error types
      if (err && typeof err === "object" && "status" in err) {
        const serviceError = err as ServiceError;
        
        if (serviceError.status === 402) {
          // Insufficient tokens
          setInsufficientTokens(true);
          setError(serviceError.message);
          await fetchWallet();
        } else if (serviceError.status === 401) {
          // Authentication error
          setError(serviceError.message);
          setTimeout(() => {
            router.push("/login");
          }, 2000);
        } else {
          setError(serviceError.message);
        }
      } else {
        setError("Failed to start interview. Please try again.");
      }
      
      isStartingRef.current = false;
      setLoading(false);
    }
  };

  const handleInterviewComplete = async (analysis: VoiceInterviewAnalysis) => {
    console.log("Interview completed with analysis:", analysis);
    
    // Record the session in dashboard
    try {
      await recordSession({
        user_id: interviewConfig?.user_id || user?.id || "",
        session_id: analysis.session_id,
        interview_type: "voice",
        job_role: interviewConfig?.job_role,
        company: interviewConfig?.company,
        duration_minutes: interviewConfig?.duration_minutes,
      });
    } catch (recordError) {
      console.error("Failed to record session:", recordError);
      // Don't show error to user as this is a background operation
    }
  };

  const handleExitInterview = () => {
    setIsInterviewActive(false);
    setInterviewConfig(null);
    isStartingRef.current = false;
    setLoading(false);
  };

  const formatDateTime = (isoString: string) => {
    const date = new Date(isoString);
    const options: Intl.DateTimeFormatOptions = {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    };
    return date.toLocaleDateString("en-US", options);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case "easy":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "medium":
        return "bg-orange-500/20 text-orange-400 border-orange-500/30";
      case "hard":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const handleJoinInterview = (interviewId: string) => {
    // TODO: Implement join interview functionality
    console.log("Joining interview:", interviewId);
  };

  // Memoize config to prevent unnecessary recreations
  // Only recreate if the actual values change, not just the object reference
  const memoizedConfig = useMemo(() => {
    return interviewConfig;
  }, [
    interviewConfig?.job_role,
    interviewConfig?.experience_level,
    interviewConfig?.company,
    interviewConfig?.job_description,
    interviewConfig?.interview_type,
    interviewConfig?.interview_role,
    interviewConfig?.difficulty,
    interviewConfig?.user_id,
    interviewConfig?.num_questions,
    interviewConfig?.duration_minutes,
  ]);

  // Debug: Log state changes
  React.useEffect(() => {
    console.log("=== State Changed ===");
    console.log("isInterviewActive:", isInterviewActive);
    console.log("interviewConfig:", interviewConfig);
    console.log("Should render VoiceInterview:", isInterviewActive && interviewConfig);
  }, [isInterviewActive, interviewConfig]);

  // Reset starting ref when interview becomes active
  React.useEffect(() => {
    if (isInterviewActive) {
      isStartingRef.current = false;
      setLoading(false);
    }
  }, [isInterviewActive]);

  // If interview is active, show the VoiceInterview component
  if (isInterviewActive && interviewConfig) {
    console.log("=== Rendering VoiceInterview Component ===");
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            onClick={handleExitInterview}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Configuration
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">
              Voice Interview
            </h1>
            <p className="text-white/60 text-sm">
              Real-time AI-powered interview practice
            </p>
          </div>
        </div>
        <VoiceInterview
          config={memoizedConfig!}
          onComplete={handleInterviewComplete}
          onExit={handleExitInterview}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-1">
          AI Voice Interview
        </h1>
        <p className="text-white/60 text-sm">
          Configure and start your AI-powered voice interview practice session
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Side - Configuration Form */}
        <Card className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-white mb-1">
              Interview Configuration
            </h2>
            <p className="text-white/60 text-sm">
              Configure your AI voice interview session
            </p>
          </div>

          {insufficientTokens && (
            <Card className="p-4 bg-yellow-500/10 border-yellow-500/30">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-yellow-400 font-medium text-sm mb-2">
                    Insufficient Tokens
                  </p>
                  <p className="text-yellow-400/80 text-sm mb-3">
                    You need at least 10 tokens to start a voice interview. Each interview costs 10 tokens.
                  </p>
                  <Link href="/billing">
                    <Button
                      size="sm"
                      className="bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 border-yellow-500/30"
                    >
                      <CreditCard className="w-4 h-4 mr-2" />
                      Purchase Tokens
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          )}

          {error && !insufficientTokens && (
            <div className="bg-red-500/20 border border-red-500/30 text-red-400 rounded-md p-3 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1.5">
                Role Name <span className="text-red-400">*</span>
              </label>
              <Input
                placeholder="e.g., Senior Software Engineer"
                value={form.role}
                onChange={(e) => handleInputChange("role", e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-1.5">
                Difficulty <span className="text-red-400">*</span>
              </label>
              <Select
                value={form.difficulty}
                onChange={(e) => handleInputChange("difficulty", e.target.value)}
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-1.5">
                Interview Type <span className="text-red-400">*</span>
              </label>
              <Select
                value={form.interviewType}
                onChange={(e) => handleInputChange("interviewType", e.target.value)}
              >
                <option value="Technical">Technical</option>
                <option value="Behavioral">Behavioral</option>
                <option value="System Design">System Design</option>
                <option value="Mixed">Mixed</option>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-1.5">
                Interview Role <span className="text-white/40 text-xs">(Optional)</span>
              </label>
              <Input
                placeholder="e.g., Technical Interviewer, HR Manager"
                value={form.interviewRole}
                onChange={(e) => handleInputChange("interviewRole", e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-1.5">
                Job Description <span className="text-white/40 text-xs">(Optional)</span>
              </label>
              <Textarea
                placeholder="Paste the job description here..."
                value={form.jobDescription}
                onChange={(e) => handleInputChange("jobDescription", e.target.value)}
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Number of Questions - Enhanced Input */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Number of Questions
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (form.numQuestions > 3) {
                        handleInputChange("numQuestions", form.numQuestions - 1);
                      }
                    }}
                    disabled={form.numQuestions <= 3}
                    className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    aria-label="Decrease questions"
                  >
                    <Minus className="w-4 h-4 text-white/70" />
                  </button>
                  <div className="flex-1 relative">
                    <Input
                      type="number"
                      min="3"
                      max="15"
                      value={form.numQuestions}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 3;
                        const clamped = Math.min(15, Math.max(3, val));
                        handleInputChange("numQuestions", clamped);
                      }}
                      className="text-center font-semibold"
                    />
                    <div className="absolute -bottom-5 left-0 right-0 text-xs text-white/40 text-center">
                      3-15 questions
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (form.numQuestions < 15) {
                        handleInputChange("numQuestions", form.numQuestions + 1);
                      }
                    }}
                    disabled={form.numQuestions >= 15}
                    className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    aria-label="Increase questions"
                  >
                    <Plus className="w-4 h-4 text-white/70" />
                  </button>
                </div>
              </div>

              {/* Duration - Enhanced Input */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Duration (minutes)
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (form.durationMinutes > 10) {
                        handleInputChange("durationMinutes", form.durationMinutes - 5);
                      }
                    }}
                    disabled={form.durationMinutes <= 10}
                    className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    aria-label="Decrease duration"
                  >
                    <Minus className="w-4 h-4 text-white/70" />
                  </button>
                  <div className="flex-1 relative">
                    <Input
                      type="number"
                      min="10"
                      max="60"
                      step="5"
                      value={form.durationMinutes}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 10;
                        const clamped = Math.min(60, Math.max(10, val));
                        // Round to nearest 5
                        const rounded = Math.round(clamped / 5) * 5;
                        handleInputChange("durationMinutes", rounded);
                      }}
                      className="text-center font-semibold"
                    />
                    <div className="absolute -bottom-5 left-0 right-0 text-xs text-white/40 text-center">
                      10-60 minutes
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (form.durationMinutes < 60) {
                        handleInputChange("durationMinutes", Math.min(60, form.durationMinutes + 5));
                      }
                    }}
                    disabled={form.durationMinutes >= 60}
                    className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    aria-label="Increase duration"
                  >
                    <Plus className="w-4 h-4 text-white/70" />
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-1.5">
                Experience Level <span className="text-red-400">*</span>
              </label>
              <Select
                value={form.experienceLevel}
                onChange={(e) =>
                  handleInputChange("experienceLevel", e.target.value)
                }
              >
                <option value="Entry Level (0-2 years)">
                  Entry Level (0-2 years)
                </option>
                <option value="Mid Level (3-5 years)">
                  Mid Level (3-5 years)
                </option>
                <option value="Senior Level (5-8 years)">
                  Senior Level (5-8 years)
                </option>
                <option value="Lead/Principal (8+ years)">
                  Lead/Principal (8+ years)
                </option>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-1.5">
                Company Name <span className="text-white/40 text-xs">(Optional)</span>
              </label>
              <Input
                placeholder="e.g., Google, Microsoft, etc."
                value={form.company}
                onChange={(e) => handleInputChange("company", e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-1.5">
                Upload Resume <span className="text-white/40 text-xs">(Optional)</span>
              </label>
              <div className="relative">
                <input
                  type="file"
                  id="resume-upload"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label
                  htmlFor="resume-upload"
                  className="flex items-center gap-3 w-full bg-[#141416] border border-white/10 rounded-md px-4 py-3 cursor-pointer hover:bg-[#1a1a1c] transition-colors"
                >
                  <Upload className="w-5 h-5 text-white/60" />
                  <div className="flex-1">
                    {form.resume ? (
                      <span className="text-white text-sm">
                        {form.resume.name}
                      </span>
                    ) : (
                      <span className="text-white/40 text-sm">
                        Choose file or drag and drop
                      </span>
                    )}
                  </div>
                </label>
              </div>
              {form.resume && (
                <p className="text-xs text-white/60 mt-1">
                  File selected: {form.resume.name}
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="button"
              onClick={(e) => {
                console.log("Button clicked!");
                handleStartInterview(e);
              }}
              disabled={loading || isInterviewActive || !form.role.trim()}
              size="lg"
              className="flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Starting...
                </>
              ) : (
                <>
                  <Video className="w-4 h-4" />
                  Start Interview
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* Right Side - Queue List */}
        <Card className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-white mb-1">
              Scheduled Interviews
            </h2>
            <p className="text-white/60 text-sm">
              Your upcoming interview sessions
            </p>
          </div>

          {scheduledInterviews.length === 0 ? (
            <div className="text-center py-12">
              <Video className="w-12 h-12 text-white/20 mx-auto mb-3" />
              <p className="text-white/60 text-sm">
                No scheduled interviews yet
              </p>
              <p className="text-white/40 text-xs mt-1">
                Schedule your first interview to get started
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {scheduledInterviews.map((interview) => (
                <div
                  key={interview.id}
                  className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-white font-semibold text-sm mb-1">
                        {interview.role}
                      </h3>
                      {interview.company && (
                        <div className="flex items-center gap-1 text-white/60 text-xs mb-2">
                          <MapPin className="w-3 h-3" />
                          {interview.company}
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-white/60 text-xs">
                        <Clock className="w-3 h-3" />
                        {formatDateTime(interview.scheduledTime)}
                      </div>
                    </div>
                    <div
                      className={`px-2 py-1 rounded-full text-xs font-medium border ${getDifficultyColor(
                        interview.difficulty
                      )}`}
                    >
                      {interview.difficulty}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-white/10">
                    <div className="text-white/60 text-xs">
                      {interview.experienceLevel}
                    </div>
                    <Button
                      onClick={() => handleJoinInterview(interview.id)}
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <Video className="w-3 h-3" />
                      Join
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Guidelines Section */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Info className="w-5 h-5 text-blue-400" />
          <h2 className="text-xl font-semibold text-white">Guidelines</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-white font-semibold text-sm mb-2">
                Before Your Interview
              </h3>
              <ul className="space-y-2">
                <li className="flex items-start gap-2 text-white/70 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <span>
                    Ensure you have a stable internet connection and a quiet
                    environment
                  </span>
                </li>
                <li className="flex items-start gap-2 text-white/70 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <span>
                    Test your microphone and camera before joining the session
                  </span>
                </li>
                <li className="flex items-start gap-2 text-white/70 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <span>
                    Review the job description and prepare relevant examples from
                    your experience
                  </span>
                </li>
                <li className="flex items-start gap-2 text-white/70 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <span>
                    Upload your resume to help the AI tailor questions to your
                    background
                  </span>
                </li>
              </ul>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="text-white font-semibold text-sm mb-2">
                During Your Interview
              </h3>
              <ul className="space-y-2">
                <li className="flex items-start gap-2 text-white/70 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <span>
                    Speak clearly and take your time to think before answering
                  </span>
                </li>
                <li className="flex items-start gap-2 text-white/70 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <span>
                    Use the STAR method (Situation, Task, Action, Result) for
                    behavioral questions
                  </span>
                </li>
                <li className="flex items-start gap-2 text-white/70 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <span>
                    Ask clarifying questions if you need more context about a
                    question
                  </span>
                </li>
                <li className="flex items-start gap-2 text-white/70 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <span>
                    Be honest about your experience and focus on what you've
                    learned
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-white/10">
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-blue-400 font-semibold text-sm mb-1">
                  Pro Tip
                </h4>
                <p className="text-white/70 text-sm">
                  The AI interviewer adapts to your responses. The more detailed
                  and structured your answers, the better the feedback you'll
                  receive. Practice regularly to improve your interview skills
                  and confidence.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
