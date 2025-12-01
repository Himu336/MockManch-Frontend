// src/lib/api.ts
export const BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

export type CreateRoomResp = {
  success: boolean;
  room: {
    id: string;
    hostId: string;
    createdAt: string;
  };
  agora_app_id: string;
  agora_token: string;
  channel: string; // Agora channel name returned by backend
};

export async function createRoom(userId: string) : Promise<CreateRoomResp> {
  const res = await fetch(`${BASE}/api/v1/room/create`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ user_id: userId }),
  });

  // Handle 402 - Insufficient tokens
  if (res.status === 402) {
    const errorData = await res.json();
    const error: ServiceError = {
      status: 402,
      message: errorData.error || "You do not have enough tokens. Please purchase more tokens or upgrade your plan.",
      error: errorData.error,
    };
    throw error;
  }

  // Handle 401 - Authentication required
  if (res.status === 401) {
    const errorData = await res.json();
    const error: ServiceError = {
      status: 401,
      message: errorData.error || "Authentication required. Please sign in again.",
      error: errorData.error,
    };
    throw error;
  }

  // Handle other errors
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: "Unknown error" }));
    const error: ServiceError = {
      status: 500,
      message: errorData.error || `Create room failed: ${res.status}`,
      error: errorData.error,
    };
    throw error;
  }

  const data = await res.json();
  console.log("CREATE ROOM DATA:", data); // debug
  return data as CreateRoomResp;
}

/**
 * joinRoom - the backend in your screenshot uses the same endpoint,
 * passing both user_id and room_id to join an existing room.
 */
export async function joinRoom(userId: string, roomId: string) : Promise<CreateRoomResp> {
  const res = await fetch(`${BASE}/api/v1/room/join`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ user_id: userId, room_id: roomId }),
  });

  // Handle 402 - Insufficient tokens
  if (res.status === 402) {
    const errorData = await res.json();
    const error: ServiceError = {
      status: 402,
      message: errorData.error || "You do not have enough tokens. Please purchase more tokens or upgrade your plan.",
      error: errorData.error,
    };
    throw error;
  }

  // Handle 401 - Authentication required
  if (res.status === 401) {
    const errorData = await res.json();
    const error: ServiceError = {
      status: 401,
      message: errorData.error || "Authentication required. Please sign in again.",
      error: errorData.error,
    };
    throw error;
  }

  // Handle other errors
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: "Unknown error" }));
    const error: ServiceError = {
      status: 500,
      message: errorData.error || `Join room failed: ${res.status}`,
      error: errorData.error,
    };
    throw error;
  }
  
  const data = await res.json();
  return data as CreateRoomResp;
}

export type RAGResponse = {
  success: boolean;
  data: {
    ai_text: string;
  };
  error?: string;
};

export type RAGError = {
  status: 401 | 402 | 500;
  message: string;
  error?: string;
};

export type ServiceError = {
  status: 401 | 402 | 500;
  message: string;
  error?: string;
};

export async function sendMessageToCoach(
  message: string,
  userId: string
): Promise<RAGResponse> {
  const res = await fetch(`${BASE}/api/v1/rag`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({
      message: message,
      user_id: userId,
    }),
  });

  // Handle 402 - Insufficient tokens
  if (res.status === 402) {
    const errorData = await res.json();
    const error: RAGError = {
      status: 402,
      message: errorData.error || "You do not have enough tokens. Please purchase more tokens or upgrade your plan.",
      error: errorData.error,
    };
    throw error;
  }

  // Handle 401 - Authentication required
  if (res.status === 401) {
    const errorData = await res.json();
    const error: RAGError = {
      status: 401,
      message: errorData.error || "Authentication required. Please sign in again.",
      error: errorData.error,
    };
    throw error;
  }

  // Handle other errors
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: "Unknown error" }));
    const error: RAGError = {
      status: 500,
      message: errorData.error || `AI Coach request failed: ${res.status}`,
      error: errorData.error,
    };
    throw error;
  }

  const data = await res.json();
  return data as RAGResponse;
}

// Interview API Types and Functions
export type CreateInterviewRequest = {
  job_role: string;
  experience_level: string;
  company?: string;
  job_description?: string;
  interview_type: string;
  user_id: string;
  num_questions?: number;
};

export type CreateInterviewResponse = {
  success: boolean;
  session_id?: string;
  data?: {
    session_id?: string;
  };
  message?: string;
};

export type QuestionResponse = {
  success: boolean;
  data: {
    current_question: {
      question_id: number;
      question_text: string | {
        text: string;
        framework?: string;
      };
      difficulty?: "Easy" | "Medium" | "Hard";
      hint?: string | {
        text: string;
        framework?: string | null;
      };
      interview_type?: string;
    };
    is_complete: boolean;
    progress_percentage: number;
    question_number: number;
    session_id: string;
    total_questions: number;
  };
};

export type SubmitAnswerRequest = {
  answer: string;
  question_id: number;
};

export type SubmitAnswerResponse = {
  success: boolean;
  message?: string;
};

export type InterviewStatus = {
  success: boolean;
  status: "in_progress" | "completed";
  current_question: number;
  total_questions: number;
};

export type QuestionAnalysis = {
  question_id?: number;
  question_text: string | {
    text: string;
    framework?: string;
  };
  feedback: string;
  score: number;
};

export type InterviewAnalysis = {
  success: boolean;
  data: {
    overall_score: number;
    evaluations: QuestionAnalysis[];
    overall_feedback: string;
    strengths_summary?: string[];
    improvement_areas?: string[];
  };
};

// Create Interview Session
export async function createInterview(
  data: CreateInterviewRequest
): Promise<CreateInterviewResponse> {
  const res = await fetch(`${BASE}/api/v1/interview/create`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  // Handle 402 - Insufficient tokens
  if (res.status === 402) {
    const errorData = await res.json();
    const error: ServiceError = {
      status: 402,
      message: errorData.error || "You do not have enough tokens. Please purchase more tokens or upgrade your plan.",
      error: errorData.error,
    };
    throw error;
  }

  // Handle 401 - Authentication required
  if (res.status === 401) {
    const errorData = await res.json();
    const error: ServiceError = {
      status: 401,
      message: errorData.error || "Authentication required. Please sign in again.",
      error: errorData.error,
    };
    throw error;
  }

  // Handle other errors
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: "Unknown error" }));
    const error: ServiceError = {
      status: 500,
      message: errorData.error || `Create interview failed: ${res.status}`,
      error: errorData.error,
    };
    throw error;
  }

  const response = await res.json();
  console.log("Create interview response:", response); // Debug log
  return response as CreateInterviewResponse;
}

// Get Current Question
export async function getCurrentQuestion(
  sessionId: string
): Promise<QuestionResponse> {
  const res = await fetch(`${BASE}/api/v1/interview/${sessionId}/question`);

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Get question failed: ${res.status} ${text}`);
  }

  const data = await res.json();
  console.log("Get question response:", data); // Debug log
  return data as QuestionResponse;
}

// Submit Answer
export async function submitAnswer(
  sessionId: string,
  data: SubmitAnswerRequest
): Promise<SubmitAnswerResponse> {
  const res = await fetch(`${BASE}/api/v1/interview/${sessionId}/answer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Submit answer failed: ${res.status} ${text}`);
  }

  const response = await res.json();
  return response as SubmitAnswerResponse;
}

// Get Interview Analysis
export async function getInterviewAnalysis(
  sessionId: string
): Promise<InterviewAnalysis> {
  const res = await fetch(`${BASE}/api/v1/interview/${sessionId}/analysis`);

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Get analysis failed: ${res.status} ${text}`);
  }

  const data = await res.json();
  return data as InterviewAnalysis;
}

// Get Interview Status
export async function getInterviewStatus(
  sessionId: string
): Promise<InterviewStatus> {
  const res = await fetch(`${BASE}/api/v1/interview/${sessionId}/status`);

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Get status failed: ${res.status} ${text}`);
  }

  const data = await res.json();
  return data as InterviewStatus;
}

// Voice Interview API Types and Functions
export type CreateVoiceInterviewRequest = {
  job_role: string;
  experience_level: string;
  company?: string;
  job_description?: string;
  interview_type: string;
  interview_role?: string;
  difficulty?: "Beginner" | "Intermediate" | "Advanced";
  user_id: string;
  num_questions?: number;
  duration_minutes?: number;
};

export type CreateVoiceInterviewResponse = {
  success: boolean;
  data?: {
    session_id: string;
    total_questions: number;
    config: Record<string, any>;
    created_at: string;
  };
  error?: string;
};

export type VoiceInterviewState = {
  session_id: string;
  current_phase: "greeting" | "questions" | "followup" | "wrapup";
  current_question_index: number;
  total_questions: number;
  progress_percentage: number;
  is_complete: boolean;
  is_started: boolean;
};

export type VoiceInterviewResponse = {
  session_id: string;
  text: string;
  audio_data?: string;
  audio_format?: string;
  current_phase: string;
  current_question_index: number;
  total_questions: number;
  progress_percentage: number;
  is_complete: boolean;
  should_ask_followup: boolean;
};

export type VoiceInterviewAnalysis = {
  session_id: string;
  overall_score: number;
  total_questions: number;
  answered_questions: number;
  conversation_summary: string;
  strengths_summary: string[];
  improvement_areas: string[];
  recommendations: string[];
  communication_score: number;
  content_score: number;
  engagement_score: number;
  completed_at: string;
};

// Create Voice Interview Session
export async function createVoiceInterview(
  data: CreateVoiceInterviewRequest
): Promise<CreateVoiceInterviewResponse> {
  const res = await fetch(`${BASE}/api/v1/voice-interview/create`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  // Handle 402 - Insufficient tokens
  if (res.status === 402) {
    const errorData = await res.json();
    const error: ServiceError = {
      status: 402,
      message: errorData.error || "You do not have enough tokens. Please purchase more tokens or upgrade your plan.",
      error: errorData.error,
    };
    throw error;
  }

  // Handle 401 - Authentication required
  if (res.status === 401) {
    const errorData = await res.json();
    const error: ServiceError = {
      status: 401,
      message: errorData.error || "Authentication required. Please sign in again.",
      error: errorData.error,
    };
    throw error;
  }

  // Handle other errors
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: "Unknown error" }));
    const error: ServiceError = {
      status: 500,
      message: errorData.error || `Create voice interview failed: ${res.status}`,
      error: errorData.error,
    };
    throw error;
  }

  const response = await res.json();
  return response as CreateVoiceInterviewResponse;
}

// Get Voice Interview State
export async function getVoiceInterviewState(
  sessionId: string
): Promise<{ success: boolean; data: VoiceInterviewState }> {
  const res = await fetch(`${BASE}/api/v1/voice-interview/${sessionId}/state`);

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Get voice interview state failed: ${res.status} ${text}`);
  }

  const data = await res.json();
  return data;
}

// Get Voice Interview Analysis
export async function getVoiceInterviewAnalysis(
  sessionId: string
): Promise<{ success: boolean; data: VoiceInterviewAnalysis }> {
  const res = await fetch(`${BASE}/api/v1/voice-interview/${sessionId}/analysis`);

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Get voice interview analysis failed: ${res.status} ${text}`);
  }

  const data = await res.json();
  return data;
}

// Get Voice Interview Status
export async function getVoiceInterviewStatus(
  sessionId: string
): Promise<{
  success: boolean;
  data: {
    session_id: string;
    is_complete: boolean;
    is_started: boolean;
    current_phase: string;
    current_question_index: number;
    total_questions: number;
    conversation_turns: number;
    created_at: string;
    started_at: string | null;
    completed_at: string | null;
  };
}> {
  const res = await fetch(`${BASE}/api/v1/voice-interview/${sessionId}/status`);

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Get voice interview status failed: ${res.status} ${text}`);
  }

  const data = await res.json();
  return data;
}

// Dashboard API Types and Functions
export type DashboardSummary = {
  interviewsDone: number;
  avgScore: number;
  practiceHours: number;
  achievements: number;
};

export type DashboardGoal = {
  goalType: string;
  currentValue: number;
  targetValue: number;
  progress: number;
};

export type DashboardRecentActivity = {
  id: string;
  interviewType: string;
  jobRole: string;
  company: string;
  score: number;
  completedAt: string;
  dateLabel: string;
};

export type DashboardAreaToImprove = {
  skillName: string;
  score: number;
  progressColor: "green" | "yellow" | "red";
};

export type DashboardData = {
  summary: DashboardSummary;
  goals: DashboardGoal[];
  recentActivity: DashboardRecentActivity[];
  areasToImprove: DashboardAreaToImprove[];
};

export type DashboardResponse = {
  success: boolean;
  data: DashboardData;
  error?: string;
};

export type DashboardSummaryResponse = {
  success: boolean;
  data: DashboardSummary;
  error?: string;
};

export type DashboardGoalsResponse = {
  success: boolean;
  data: DashboardGoal[];
  error?: string;
};

export type DashboardRecentActivityResponse = {
  success: boolean;
  data: DashboardRecentActivity[];
  error?: string;
};

export type DashboardAreasToImproveResponse = {
  success: boolean;
  data: DashboardAreaToImprove[];
  error?: string;
};

export type RecordSessionRequest = {
  user_id: string;
  session_id: string;
  interview_type: "voice" | "text" | "video";
  job_role?: string;
  company?: string;
  duration_minutes?: number;
};

export type RecordSessionResponse = {
  success: boolean;
  message?: string;
  error?: string;
};

// Get complete dashboard data
export async function getDashboard(
  userId: string
): Promise<DashboardResponse> {
  const res = await fetch(`${BASE}/api/v1/dashboard?user_id=${userId}`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Get dashboard failed: ${res.status} ${text}`);
  }

  const data = await res.json();
  return data as DashboardResponse;
}

// Get dashboard summary only
export async function getDashboardSummary(
  userId: string
): Promise<DashboardSummaryResponse> {
  const res = await fetch(`${BASE}/api/v1/dashboard/summary?user_id=${userId}`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Get dashboard summary failed: ${res.status} ${text}`);
  }

  const data = await res.json();
  return data as DashboardSummaryResponse;
}

// Get user goals
export async function getDashboardGoals(
  userId: string
): Promise<DashboardGoalsResponse> {
  const res = await fetch(`${BASE}/api/v1/dashboard/goals?user_id=${userId}`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Get dashboard goals failed: ${res.status} ${text}`);
  }

  const data = await res.json();
  return data as DashboardGoalsResponse;
}

// Get recent activity
export async function getDashboardRecentActivity(
  userId: string
): Promise<DashboardRecentActivityResponse> {
  const res = await fetch(
    `${BASE}/api/v1/dashboard/recent-activity?user_id=${userId}`,
    {
      method: "GET",
      headers: getAuthHeaders(),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Get recent activity failed: ${res.status} ${text}`);
  }

  const data = await res.json();
  return data as DashboardRecentActivityResponse;
}

// Get areas to improve
export async function getDashboardAreasToImprove(
  userId: string
): Promise<DashboardAreasToImproveResponse> {
  const res = await fetch(
    `${BASE}/api/v1/dashboard/areas-to-improve?user_id=${userId}`,
    {
      method: "GET",
      headers: getAuthHeaders(),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Get areas to improve failed: ${res.status} ${text}`);
  }

  const data = await res.json();
  return data as DashboardAreasToImproveResponse;
}

// Record completed interview session
export async function recordSession(
  data: RecordSessionRequest
): Promise<RecordSessionResponse> {
  const res = await fetch(`${BASE}/api/v1/dashboard/record-session`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Record session failed: ${res.status} ${text}`);
  }

  const response = await res.json();
  return response as RecordSessionResponse;
}

// Authentication API Types and Functions
export type User = {
  id: string;
  email: string;
  fullName?: string;
  avatarUrl?: string;
  phoneNumber?: string;
  bio?: string;
  emailVerified?: boolean;
  createdAt?: string;
};

export type SignUpRequest = {
  email: string;
  password: string;
  fullName: string;
  phoneNumber: string;
};

export type SignInRequest = {
  email: string;
  password: string;
};

export type AuthResponse = {
  success: boolean;
  data?: {
    user: User;
    accessToken: string;
    refreshToken: string;
  };
  error?: string;
};

export type RefreshTokenRequest = {
  refreshToken: string;
};

export type RefreshTokenResponse = {
  success: boolean;
  data?: {
    accessToken: string;
    refreshToken?: string;
  };
  error?: string;
};

export type UserProfileResponse = {
  success: boolean;
  data?: User;
  error?: string;
};

export type UpdateProfileRequest = {
  fullName?: string;
  bio?: string;
  phoneNumber?: string;
  avatarUrl?: string;
};

export type VerifyEmailRequest = {
  token: string;
};

export type ForgotPasswordRequest = {
  email: string;
};

// Helper function to get auth token from storage
export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("accessToken");
}

// Helper function to set auth tokens
export function setAuthTokens(accessToken: string, refreshToken: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("accessToken", accessToken);
  localStorage.setItem("refreshToken", refreshToken);
}

// Helper function to clear auth tokens
export function clearAuthTokens(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
}

// Helper function to get refresh token from storage
export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("refreshToken");
}

// Helper function to create authenticated fetch headers
export function getAuthHeaders(): Record<string, string> {
  const token = getAuthToken();
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}

// Sign up new user
export async function signUp(data: SignUpRequest): Promise<AuthResponse> {
  const res = await fetch(`${BASE}/api/v1/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  const response = await res.json();
  
  if (!res.ok) {
    return {
      success: false,
      error: response.error || `Sign up failed: ${res.status}`,
    };
  }

  if (response.success && response.data) {
    setAuthTokens(response.data.accessToken, response.data.refreshToken);
  }

  return response as AuthResponse;
}

// Sign in existing user
export async function signIn(data: SignInRequest): Promise<AuthResponse> {
  const res = await fetch(`${BASE}/api/v1/auth/signin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  const response = await res.json();
  
  if (!res.ok) {
    return {
      success: false,
      error: response.error || `Sign in failed: ${res.status}`,
    };
  }

  if (response.success && response.data) {
    setAuthTokens(response.data.accessToken, response.data.refreshToken);
  }

  return response as AuthResponse;
}

// Sign out current user
export async function signOut(): Promise<{ success: boolean; error?: string }> {
  try {
    const token = getAuthToken();
    if (token) {
      await fetch(`${BASE}/api/v1/auth/signout`, {
        method: "POST",
        headers: getAuthHeaders(),
      });
    }
  } catch (error) {
    console.error("Error signing out:", error);
  } finally {
    clearAuthTokens();
  }
  return { success: true };
}

// Refresh access token
export async function refreshToken(): Promise<RefreshTokenResponse> {
  const refreshTokenValue = getRefreshToken();
  
  if (!refreshTokenValue) {
    return {
      success: false,
      error: "No refresh token available",
    };
  }

  const res = await fetch(`${BASE}/api/v1/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken: refreshTokenValue }),
  });

  const response = await res.json();
  
  if (!res.ok) {
    clearAuthTokens();
    return {
      success: false,
      error: response.error || `Token refresh failed: ${res.status}`,
    };
  }

  if (response.success && response.data) {
    const newAccessToken = response.data.accessToken;
    const newRefreshToken = response.data.refreshToken || refreshTokenValue;
    setAuthTokens(newAccessToken, newRefreshToken);
  }

  return response as RefreshTokenResponse;
}

// Get current user profile
export async function getCurrentUser(): Promise<UserProfileResponse> {
  const res = await fetch(`${BASE}/api/v1/auth/me`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (res.status === 401) {
    // Try to refresh token
    const refreshResponse = await refreshToken();
    if (refreshResponse.success) {
      // Retry with new token
      const retryRes = await fetch(`${BASE}/api/v1/auth/me`, {
        method: "GET",
        headers: getAuthHeaders(),
      });
      
      if (!retryRes.ok) {
        clearAuthTokens();
        return {
          success: false,
          error: "Authentication failed",
        };
      }
      
      const retryResponse = await retryRes.json();
      return retryResponse as UserProfileResponse;
    } else {
      clearAuthTokens();
      return {
        success: false,
        error: "Authentication expired. Please sign in again.",
      };
    }
  }

  if (!res.ok) {
    const response = await res.json();
    return {
      success: false,
      error: response.error || `Get user failed: ${res.status}`,
    };
  }

  const response = await res.json();
  return response as UserProfileResponse;
}

// Update user profile
export async function updateProfile(
  data: UpdateProfileRequest
): Promise<UserProfileResponse> {
  const res = await fetch(`${BASE}/api/v1/auth/profile`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const response = await res.json();
    return {
      success: false,
      error: response.error || `Update profile failed: ${res.status}`,
    };
  }

  const response = await res.json();
  return response as UserProfileResponse;
}

// Verify email
export async function verifyEmail(
  data: VerifyEmailRequest
): Promise<{ success: boolean; error?: string }> {
  const res = await fetch(`${BASE}/api/v1/auth/verify-email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  const response = await res.json();
  
  if (!res.ok) {
    return {
      success: false,
      error: response.error || `Email verification failed: ${res.status}`,
    };
  }

  return response;
}

// Request password reset
export async function forgotPassword(
  data: ForgotPasswordRequest
): Promise<{ success: boolean; error?: string; message?: string }> {
  const res = await fetch(`${BASE}/api/v1/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  const response = await res.json();
  
  if (!res.ok) {
    return {
      success: false,
      error: response.error || `Password reset request failed: ${res.status}`,
    };
  }

  return response;
}

// OAuth API Types and Functions
export type GoogleOAuthUrlResponse = {
  success: boolean;
  data?: {
    url: string;
  };
  error?: string;
};

export type VerifyOAuthRequest = {
  accessToken: string;
};

export type VerifyOAuthResponse = {
  success: boolean;
  data?: {
    user: User;
    accessToken: string;
  };
  error?: string;
};

// Get Google OAuth URL from backend
export async function getGoogleOAuthUrl(
  redirectTo: string
): Promise<GoogleOAuthUrlResponse> {
  const res = await fetch(
    `${BASE}/api/v1/auth/oauth/google?redirect_to=${encodeURIComponent(redirectTo)}`,
    {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    }
  );

  const response = await res.json();
  
  if (!res.ok) {
    return {
      success: false,
      error: response.error || `Get OAuth URL failed: ${res.status}`,
    };
  }

  return response as GoogleOAuthUrlResponse;
}

// Verify OAuth session with backend
export async function verifyOAuthSession(
  accessToken: string
): Promise<VerifyOAuthResponse> {
  const res = await fetch(`${BASE}/api/v1/auth/oauth/verify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const response = await res.json();
  
  if (!res.ok) {
    return {
      success: false,
      error: response.error || `OAuth verification failed: ${res.status}`,
    };
  }

  if (response.success && response.data) {
    setAuthTokens(response.data.accessToken, response.data.accessToken);
  }

  return response as VerifyOAuthResponse;
}

// Wallet API Types and Functions
export type WalletResponse = {
  success: boolean;
  data: {
    balance: number;
    recentTransactions: WalletTransaction[];
  };
  error?: string;
};

export type WalletTransaction = {
  transactionId: string;
  changeAmount: number;
  type: "credit" | "debit";
  reason: string;
  metadata?: Record<string, any>;
  createdAt: string;
};

export type DeductTokensRequest = {
  service_name: string;
};

export type DeductTokensResponse = {
  success: boolean;
  data?: {
    newBalance: number;
    serviceName: string;
  };
  error?: string;
};

export type PurchaseTokensRequest = {
  plan_id: string;
  payment_id: string;
};

export type PurchaseTokensResponse = {
  success: boolean;
  data?: {
    newBalance: number;
    purchaseId: string;
  };
  error?: string;
};

export type SubscriptionPlan = {
  planId: string;
  name: string;
  tokens: number;
  price: string;
  durationDays: number;
  isRecurring: boolean;
};

export type PlansResponse = {
  success: boolean;
  data: SubscriptionPlan[];
  error?: string;
};

export type TransactionsResponse = {
  success: boolean;
  data: WalletTransaction[];
  error?: string;
};

// Get wallet balance and recent transactions
export async function getWallet(): Promise<WalletResponse> {
  const res = await fetch(`${BASE}/api/v1/wallet`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    const response = await res.json();
    return {
      success: false,
      error: response.error || `Get wallet failed: ${res.status}`,
      data: {
        balance: 0,
        recentTransactions: [],
      },
    };
  }

  const response = await res.json();
  return response as WalletResponse;
}

// Deduct tokens for a service (backend only, but included for completeness)
export async function deductTokens(
  data: DeductTokensRequest
): Promise<DeductTokensResponse> {
  const res = await fetch(`${BASE}/api/v1/wallet/deduct`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  const response = await res.json();

  if (!res.ok) {
    return {
      success: false,
      error: response.error || `Deduct tokens failed: ${res.status}`,
    };
  }

  return response as DeductTokensResponse;
}

// Purchase tokens or subscription plan
export async function purchaseTokens(
  data: PurchaseTokensRequest
): Promise<PurchaseTokensResponse> {
  const res = await fetch(`${BASE}/api/v1/wallet/purchase`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  const response = await res.json();

  if (!res.ok) {
    return {
      success: false,
      error: response.error || `Purchase tokens failed: ${res.status}`,
    };
  }

  return response as PurchaseTokensResponse;
}

// Get all available subscription plans
export async function getPlans(): Promise<PlansResponse> {
  const res = await fetch(`${BASE}/api/v1/plans`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    const response = await res.json();
    return {
      success: false,
      error: response.error || `Get plans failed: ${res.status}`,
      data: [],
    };
  }

  const response = await res.json();
  return response as PlansResponse;
}

// Get full transaction history
export async function getTransactions(
  limit: number = 100
): Promise<TransactionsResponse> {
  const limitParam = Math.min(Math.max(1, limit), 1000);
  const res = await fetch(`${BASE}/api/v1/transactions?limit=${limitParam}`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    const response = await res.json();
    return {
      success: false,
      error: response.error || `Get transactions failed: ${res.status}`,
      data: [],
    };
  }

  const response = await res.json();
  return response as TransactionsResponse;
}

// Analytics API Types and Functions
export type AnalyticsOverviewResponse = {
  success: boolean;
  data: {
    overallScore: {
      value: number;
      change: number;
      changeText?: string;
    };
    interviews: {
      count: number;
      timeframe?: string;
    };
    studyTime: {
      hours: number;
      timeframe?: string;
    };
    achievements: {
      unlocked: number;
      total: number;
    };
    scoreProgression: Array<{
      week: string;
      score: number;
    }>;
    performanceByCategory: Array<{
      category: string;
      current: number;
      target: number;
    }>;
  };
  error?: string;
};

export type SkillsBreakdownResponse = {
  success: boolean;
  data: {
    radarData: Array<{
      skill: string;
      score: number;
    }>;
    skillDetails: Array<{
      skill: string;
      score: number;
      maxScore: number;
    }>;
  };
  error?: string;
};

export type WeakArea = {
  area: string;
  practiceSessions: number;
  recommendedSessions: number;
  improvement: number;
  currentScore: number;
  maxScore: number;
  progress: number;
};

export type WeakAreasResponse = {
  success: boolean;
  data: WeakArea[];
  error?: string;
};

export type Achievement = {
  id: string;
  type: string;
  title: string;
  description: string;
  unlocked: boolean;
  unlockedAt?: string;
};

export type AchievementsResponse = {
  success: boolean;
  data: Achievement[];
  error?: string;
};

// Get analytics overview
export async function getAnalyticsOverview(
  userId: string
): Promise<AnalyticsOverviewResponse> {
  const res = await fetch(
    `${BASE}/api/v1/analytics/overview?user_id=${userId}`,
    {
      method: "GET",
      headers: getAuthHeaders(),
    }
  );

  if (!res.ok) {
    const response = await res.json();
    return {
      success: false,
      error: response.error || `Get analytics overview failed: ${res.status}`,
      data: {
        overallScore: { value: 0, change: 0, changeText: "" },
        interviews: { count: 0, timeframe: "" },
        studyTime: { hours: 0, timeframe: "" },
        achievements: { unlocked: 0, total: 0 },
        scoreProgression: [],
        performanceByCategory: [],
      },
    };
  }

  const response = await res.json();
  return response as AnalyticsOverviewResponse;
}

// Get skills breakdown
export async function getSkillsBreakdown(
  userId: string
): Promise<SkillsBreakdownResponse> {
  const res = await fetch(
    `${BASE}/api/v1/analytics/skills-breakdown?user_id=${userId}`,
    {
      method: "GET",
      headers: getAuthHeaders(),
    }
  );

  if (!res.ok) {
    const response = await res.json();
    return {
      success: false,
      error: response.error || `Get skills breakdown failed: ${res.status}`,
      data: {
        radarData: [],
        skillDetails: [],
      },
    };
  }

  const response = await res.json();
  return response as SkillsBreakdownResponse;
}

// Get weak areas
export async function getWeakAreas(
  userId: string
): Promise<WeakAreasResponse> {
  const res = await fetch(
    `${BASE}/api/v1/analytics/weak-areas?user_id=${userId}`,
    {
      method: "GET",
      headers: getAuthHeaders(),
    }
  );

  if (!res.ok) {
    const response = await res.json();
    return {
      success: false,
      error: response.error || `Get weak areas failed: ${res.status}`,
      data: [],
    };
  }

  const response = await res.json();
  return response as WeakAreasResponse;
}

// Get achievements
export async function getAchievements(
  userId: string
): Promise<AchievementsResponse> {
  const res = await fetch(
    `${BASE}/api/v1/analytics/achievements?user_id=${userId}`,
    {
      method: "GET",
      headers: getAuthHeaders(),
    }
  );

  if (!res.ok) {
    const response = await res.json();
    return {
      success: false,
      error: response.error || `Get achievements failed: ${res.status}`,
      data: [],
    };
  }

  const response = await res.json();
  return response as AchievementsResponse;
}

// Check and update achievements
export async function checkAchievements(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const res = await fetch(`${BASE}/api/v1/analytics/check-achievements`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ user_id: userId }),
  });

  if (!res.ok) {
    const response = await res.json();
    return {
      success: false,
      error: response.error || `Check achievements failed: ${res.status}`,
    };
  }

  const response = await res.json();
  return response;
}