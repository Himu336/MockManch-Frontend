"use client";

import React, { useState } from "react";
import Card from "../../../components/ui/Card";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import Textarea from "../../../components/ui/Textarea";
import Select from "../../../components/ui/Select";
import {
  createInterview,
  getCurrentQuestion,
  submitAnswer,
  getInterviewAnalysis,
  getInterviewStatus,
  recordSession,
  type CreateInterviewRequest,
  type QuestionResponse,
  type InterviewAnalysis,
  type ServiceError,
} from "../../../lib/api";
import { 
  Play, 
  Lightbulb, 
  CheckCircle2, 
  Loader2, 
  AlertCircle, 
  Coins, 
  CreditCard,
  BookOpen,
  Target,
  Info,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useWallet } from "@/hooks/useWallet";
import { useRouter } from "next/navigation";
import Link from "next/link";

type InterviewState = "config" | "question" | "results";

type ConfigForm = {
  job_role: string;
  experience_level: string;
  company: string;
  job_description: string;
  interview_type: string;
};

type AnswerState = {
  [questionId: number]: string;
};

export default function TextInterviewPage() {
  const [state, setState] = useState<InterviewState>("config");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<QuestionResponse | null>(null);
  const [answers, setAnswers] = useState<AnswerState>({});
  const [analysis, setAnalysis] = useState<InterviewAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [insufficientTokens, setInsufficientTokens] = useState(false);

  const [form, setForm] = useState<ConfigForm>({
    job_role: "",
    experience_level: "Mid Level (3-5 years)",
    company: "",
    job_description: "",
    interview_type: "Behavioral",
  });

  const { user } = useAuth();
  const { balance, fetchWallet } = useWallet();
  const router = useRouter();
  const userId = user?.id || "";

  const handleConfigChange = (
    field: keyof ConfigForm,
    value: string
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleStartInterview = async () => {
    setLoading(true);
    setError(null);
    setInsufficientTokens(false);

    try {
      const request: CreateInterviewRequest = {
        job_role: form.job_role,
        experience_level: form.experience_level,
        interview_type: form.interview_type,
        user_id: userId,
        num_questions: 4,
        ...(form.company.trim() && { company: form.company }),
        ...(form.job_description.trim() && { job_description: form.job_description }),
      };

      const response = await createInterview(request);
      console.log("Interview creation response:", response); // Debug log
      
      // Handle different response structures - try multiple possible locations
      const sessionId = 
        response.session_id || 
        response.data?.session_id ||
        (response as any).data?.sessionId ||
        (response as any).sessionId;
      
      if (!sessionId || typeof sessionId !== 'string') {
        console.error("Invalid session ID in response:", response);
        throw new Error(
          "Session ID not found in response. Please check the console for details. " +
          "Expected 'session_id' or 'data.session_id' in the response."
        );
      }
      
      console.log("Extracted session ID:", sessionId); // Debug log
      setSessionId(sessionId);

      // Fetch the first question
      const question = await getCurrentQuestion(sessionId);
      console.log("Question response FULL:", JSON.stringify(question, null, 2)); // Detailed debug log
      console.log("question_text type:", typeof question.data?.current_question?.question_text);
      console.log("question_text value:", question.data?.current_question?.question_text);
      console.log("hint type:", typeof question.data?.current_question?.hint);
      console.log("hint value:", question.data?.current_question?.hint);
      console.log("difficulty type:", typeof question.data?.current_question?.difficulty);
      console.log("difficulty value:", question.data?.current_question?.difficulty);
      
      // Validate question structure
      if (!question || !question.data?.current_question) {
        console.error("Invalid question response:", question);
        throw new Error(
          "Invalid question data received from server. Expected 'data.current_question' object. " +
          "Check console for actual response structure."
        );
      }
      
      setCurrentQuestion(question);
      setState("question");
      
      // Refresh wallet balance after successful token deduction
      await fetchWallet();
    } catch (err) {
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
        setError(err instanceof Error ? err.message : "Failed to start interview");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (value: string) => {
    if (currentQuestion && currentQuestion.data?.current_question) {
      setAnswers((prev) => ({
        ...prev,
        [currentQuestion.data.current_question.question_id]: value,
      }));
    }
  };

  const getWordCount = (text: string) => {
    return text.trim().split(/\s+/).filter((word) => word.length > 0).length;
  };

  const getReadTime = (wordCount: number) => {
    // Average reading speed: 200 words per minute
    const minutes = Math.ceil(wordCount / 200);
    return minutes;
  };

  // Helper function to extract text from question_text (can be string or object)
  // Note: question_text might be a string that contains escaped JSON, so we clean it
  const getQuestionText = (questionText: string | { text: string; framework?: string }): string => {
    if (typeof questionText === 'string') {
      // Remove any escaped JSON formatting if present
      let cleaned = questionText.trim();
      // Remove "question_text": prefix and surrounding quotes if present
      cleaned = cleaned.replace(/^"question_text":\s*"/, '');
      cleaned = cleaned.replace(/",?\s*$/, ''); // Remove trailing quote, comma, and any trailing characters like ?
      cleaned = cleaned.trim();
      return cleaned;
    }
    if (typeof questionText === 'object' && questionText !== null) {
      return questionText.text || '';
    }
    return String(questionText || '');
  };

  // Helper function to extract text from hint (can be string or object)
  const getHintText = (hint: string | { text: string; framework?: string | null } | null | undefined): string => {
    if (!hint) return '';
    if (typeof hint === 'string') {
      return hint.trim();
    }
    if (typeof hint === 'object' && hint !== null && 'text' in hint) {
      // Extract text property, handling malformed JSON
      let text = hint.text || '';
      if (typeof text === 'string') {
        // Clean if it contains escaped JSON patterns
        text = text.replace(/^"hint":\s*{\s*"/, '');
        text = text.replace(/",?\s*$/, '');
        text = text.trim();
      }
      return text;
    }
    return '';
  };

  const handleNextQuestion = async () => {
    if (!currentQuestion || !currentQuestion.data?.current_question || !sessionId) return;

    const answerText = answers[currentQuestion.data.current_question.question_id] || "";

    if (!answerText.trim()) {
      setError("Please provide an answer before proceeding");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Submit current answer
      await submitAnswer(sessionId, {
        answer: answerText,
        question_id: currentQuestion.data.current_question.question_id,
      });

      // Try to get the next question
      // If interview is complete, the backend will return an error, which we'll catch
      try {
        const nextQuestion = await getCurrentQuestion(sessionId);
        setCurrentQuestion(nextQuestion);
      } catch (questionError) {
        // Check if error is about interview being complete
        const errorMessage = questionError instanceof Error ? questionError.message : String(questionError);
        if (errorMessage.includes("already complete") || errorMessage.includes("complete") || errorMessage.includes("400")) {
          // Interview is complete, get analysis
          const analysisData = await getInterviewAnalysis(sessionId);
          setAnalysis(analysisData);
          setState("results");
          
          // Record the session in dashboard
          try {
            await recordSession({
              user_id: userId,
              session_id: sessionId,
              interview_type: "text",
              job_role: form.job_role,
              ...(form.company.trim() && { company: form.company }),
            });
          } catch (recordError) {
            console.error("Failed to record session:", recordError);
            // Don't show error to user as this is a background operation
          }
        } else {
          // Some other error, throw it
          throw questionError;
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit answer");
    } finally {
      setLoading(false);
    }
  };

  const handleStartNewInterview = () => {
    setState("config");
    setSessionId(null);
    setCurrentQuestion(null);
    setAnswers({});
    setAnalysis(null);
    setError(null);
    setForm({
      job_role: "",
      experience_level: "Mid Level (3-5 years)",
      company: "",
      job_description: "",
      interview_type: "Behavioral",
    });
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

  const getScoreColor = (score: number) => {
    if (score >= 80) return "bg-green-500/20 text-green-400 border-green-500/30";
    if (score >= 60) return "bg-orange-500/20 text-orange-400 border-orange-500/30";
    return "bg-red-500/20 text-red-400 border-red-500/30";
  };

  // Configuration State
  if (state === "config") {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">
            Text Interview Practice
          </h1>
          <p className="text-white/60 text-sm">
            Practice with AI-generated questions tailored to your role
          </p>
        </div>

        <Card className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-white mb-1">
              Configure Your Interview
            </h2>
            <p className="text-white/60 text-sm">
              Customize the interview based on your target role
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
                    You need at least 5 tokens to start a text interview. Each interview costs 5 tokens.
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
                Job Role <span className="text-red-400">*</span>
              </label>
              <Input
                placeholder="e.g., Senior Software Engineer"
                value={form.job_role}
                onChange={(e) => handleConfigChange("job_role", e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-1.5">
                Experience Level <span className="text-red-400">*</span>
              </label>
              <Select
                value={form.experience_level}
                onChange={(e) =>
                  handleConfigChange("experience_level", e.target.value)
                }
              >
                <option value="Entry Level (0-2 years)">Entry Level (0-2 years)</option>
                <option value="Mid Level (3-5 years)">Mid Level (3-5 years)</option>
                <option value="Senior Level (5-8 years)">Senior Level (5-8 years)</option>
                <option value="Lead/Principal (8+ years)">Lead/Principal (8+ years)</option>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-1.5">
                Company (Optional)
              </label>
              <Input
                placeholder="e.g., Google, Startup, etc."
                value={form.company}
                onChange={(e) => handleConfigChange("company", e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-1.5">
                Job Description (Optional)
              </label>
              <Textarea
                placeholder="Paste the job description here for more targeted questions..."
                rows={6}
                value={form.job_description}
                onChange={(e) =>
                  handleConfigChange("job_description", e.target.value)
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-1.5">
                Interview Type <span className="text-red-400">*</span>
              </label>
              <Select
                value={form.interview_type}
                onChange={(e) =>
                  handleConfigChange("interview_type", e.target.value)
                }
              >
                <option value="Behavioral">Behavioral</option>
                <option value="Technical">Technical</option>
                <option value="System Design">System Design</option>
                <option value="Mixed">Mixed</option>
              </Select>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              onClick={handleStartInterview}
              disabled={loading || !form.job_role.trim()}
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
                  <Play className="w-4 h-4" />
                  Start Interview
                </>
              )}
            </Button>
          </div>

          {/* Guide Section */}
          <div className="mt-6 pt-6 border-t border-white/10">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <BookOpen className="w-5 h-5 text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">Quick Guide</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Configuration Tips */}
              <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Target className="w-4 h-4 text-blue-400" />
                  <h4 className="text-white font-semibold text-sm">Configuration Tips</h4>
                </div>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2 text-white/70 text-xs">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 mt-0.5 flex-shrink-0" />
                    <span>Be specific with your job role to get more relevant questions</span>
                  </li>
                  <li className="flex items-start gap-2 text-white/70 text-xs">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 mt-0.5 flex-shrink-0" />
                    <span>Include job description for questions tailored to the position</span>
                  </li>
                  <li className="flex items-start gap-2 text-white/70 text-xs">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 mt-0.5 flex-shrink-0" />
                    <span>Select experience level matching your background for appropriate difficulty</span>
                  </li>
                  <li className="flex items-start gap-2 text-white/70 text-xs">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 mt-0.5 flex-shrink-0" />
                    <span>Choose Mixed interview type for comprehensive practice across different areas</span>
                  </li>
                </ul>
              </div>

              {/* Best Practices */}
              <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Lightbulb className="w-4 h-4 text-purple-400" />
                  <h4 className="text-white font-semibold text-sm">Best Practices</h4>
                </div>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2 text-white/70 text-xs">
                    <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 mt-0.5 flex-shrink-0" />
                    <span>Take your time to think before writing your answers</span>
                  </li>
                  <li className="flex items-start gap-2 text-white/70 text-xs">
                    <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 mt-0.5 flex-shrink-0" />
                    <span>Use the STAR method (Situation, Task, Action, Result) for behavioral questions</span>
                  </li>
                  <li className="flex items-start gap-2 text-white/70 text-xs">
                    <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 mt-0.5 flex-shrink-0" />
                    <span>Be concise but comprehensive - aim for 150-300 words per answer</span>
                  </li>
                  <li className="flex items-start gap-2 text-white/70 text-xs">
                    <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 mt-0.5 flex-shrink-0" />
                    <span>Review the hints provided to guide your response structure</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Important Notes */}
            <div className="mt-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-yellow-400 font-semibold text-sm mb-1">Important Notes</h4>
                  <ul className="space-y-1.5 text-white/70 text-xs">
                    <li className="flex items-start gap-2">
                      <span className="text-yellow-400 mt-1">•</span>
                      <span>Each interview session costs 5 tokens. Ensure you have sufficient balance before starting.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-yellow-400 mt-1">•</span>
                      <span>You can review and edit your answers before submitting each question.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-yellow-400 mt-1">•</span>
                      <span>Take advantage of the word count indicator to ensure comprehensive answers.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-yellow-400 mt-1">•</span>
                      <span>After completion, review the detailed feedback to identify areas for improvement.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Question State
  if (state === "question" && currentQuestion) {
    // Defensive check - ensure question structure exists
    if (!currentQuestion.data?.current_question) {
      console.error("Invalid question structure:", currentQuestion);
      return (
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">
              Text Interview Practice
            </h1>
            <p className="text-white/60 text-sm">
              Practice with AI-generated questions tailored to your role
            </p>
          </div>
          <Card>
            <div className="bg-red-500/20 border border-red-500/30 text-red-400 rounded-md p-3 text-sm">
              Error: Invalid question data received. Please check the console for details.
              <pre className="mt-2 text-xs overflow-auto">{JSON.stringify(currentQuestion, null, 2)}</pre>
            </div>
          </Card>
        </div>
      );
    }

    const currentAnswer = answers[currentQuestion.data.current_question.question_id] || "";
    const wordCount = getWordCount(currentAnswer);
    const readTime = getReadTime(wordCount);
    const progress = currentQuestion.data.progress_percentage || 
      (currentQuestion.data.question_number / currentQuestion.data.total_questions) * 100;

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">
            Text Interview Practice
          </h1>
          <p className="text-white/60 text-sm">
            Practice with AI-generated questions tailored to your role
          </p>
        </div>

        <Card className="space-y-4">
          {error && (
            <div className="bg-red-500/20 border border-red-500/30 text-red-400 rounded-md p-3 text-sm">
              {error}
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-[#5b21b6] text-white px-4 py-1.5 rounded-full text-sm font-medium">
                Question {currentQuestion.data.question_number} of {currentQuestion.data.total_questions}
              </div>
              <div className="flex-1 w-48 h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#5b21b6] transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
            {currentQuestion.data.current_question.difficulty && (
              <div
                className={`px-3 py-1.5 rounded-full text-sm font-medium border ${getDifficultyColor(
                  currentQuestion.data.current_question.difficulty
                )}`}
              >
                {currentQuestion.data.current_question.difficulty}
              </div>
            )}
          </div>

          <div>
            <h2 className="text-2xl font-bold text-white mb-4">
              {getQuestionText(currentQuestion.data.current_question.question_text)}
            </h2>

            <Textarea
              placeholder="Type your answer here..."
              rows={12}
              value={currentAnswer}
              onChange={(e) => handleAnswerChange(e.target.value)}
              className="min-h-[300px] text-white"
            />
          </div>

          {currentQuestion.data.current_question.hint && getHintText(currentQuestion.data.current_question.hint) && (
            <div className="bg-[#4c1d95]/30 border border-[#6d28d9]/30 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="w-5 h-5 text-[#a78bfa]" />
                <span className="font-semibold text-[#a78bfa]">Hint</span>
              </div>
              <p className="text-white/80 text-sm">
                {getHintText(currentQuestion.data.current_question.hint)}
              </p>
            </div>
          )}

          <div className="flex items-center justify-between pt-3 border-t border-white/10">
            <div className="text-white/60 text-sm">
              {wordCount} words • ~{readTime} min read time
            </div>
            <Button
              onClick={handleNextQuestion}
              disabled={loading || !currentAnswer.trim()}
              size="lg"
              className="flex items-center gap-2"
            >
              {loading ? "Submitting..." : "Next Question"}
              {!loading && <span>→</span>}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Results State
  if (state === "results" && analysis) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">
            Text Interview Practice
          </h1>
          <p className="text-white/60 text-sm">
            Practice with AI-generated questions tailored to your role
          </p>
        </div>

        <Card className="space-y-4">
          {/* Overall Score */}
          <div className="flex items-start gap-4 pb-4 border-b border-white/10">
            <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-6 h-6 text-green-400" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white mb-2">
                Interview Complete!
              </h2>
              <div className="text-3xl font-bold text-white">
                Overall Score: {analysis.data.overall_score}/100
              </div>
            </div>
          </div>

          {/* Overall Feedback */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">
              Overall Feedback
            </h3>
            <p className="text-white/70 leading-relaxed">
              {analysis.data.overall_feedback}
            </p>
          </div>

          {/* Question-by-Question Analysis */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">
              Question-by-Question Analysis
            </h3>
            <div className="space-y-3">
              {analysis.data.evaluations && analysis.data.evaluations.map((q, idx) => (
                <Card key={idx} className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-white font-medium mb-2">
                        {getQuestionText(q.question_text)}
                      </p>
                      <p className="text-white/70 text-sm flex items-center gap-2">
                        <span className="text-green-400">✓</span>
                        {q.feedback}
                      </p>
                    </div>
                    <div
                      className={`px-4 py-2 rounded-lg border font-semibold ${getScoreColor(
                        q.score
                      )}`}
                    >
                      {q.score}/100
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Strengths and Areas to Improve */}
          {(analysis.data.strengths_summary || analysis.data.improvement_areas) && (
            <div className="grid md:grid-cols-2 gap-4 pt-3 border-t border-white/10">
              {analysis.data.strengths_summary && analysis.data.strengths_summary.length > 0 && (
                <div>
                  <h4 className="text-green-400 font-semibold mb-2">Strengths</h4>
                  <ul className="space-y-1.5">
                    {analysis.data.strengths_summary.map((strength, idx) => (
                      <li key={idx} className="text-white/70 text-sm flex items-start gap-2">
                        <span className="text-green-400 mt-1">•</span>
                        <span>{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {analysis.data.improvement_areas && analysis.data.improvement_areas.length > 0 && (
                <div>
                  <h4 className="text-orange-400 font-semibold mb-2">Areas to Improve</h4>
                  <ul className="space-y-1.5">
                    {analysis.data.improvement_areas.map((area, idx) => (
                      <li key={idx} className="text-white/70 text-sm flex items-start gap-2">
                        <span className="text-orange-400 mt-1">•</span>
                        <span>{area}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4 border-t border-white/10">
            <Button
              onClick={handleStartNewInterview}
              size="lg"
              className="flex-1"
            >
              Start New Interview
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => {
                // TODO: Implement review answers functionality
                console.log("Review answers");
              }}
            >
              Review Answers
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return null;
}
