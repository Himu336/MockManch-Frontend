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
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Create room failed: ${res.status} ${text}`);
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
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId, room_id: roomId }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Join room failed: ${res.status} ${text}`);
  }
  const data = await res.json();
  return data as CreateRoomResp;
}

export type RAGResponse = {
  success: boolean;
  data: {
    ai_text: string;
  };
};

export async function sendMessageToCoach(
  message: string,
  userId: string
): Promise<RAGResponse> {
  const res = await fetch(`${BASE}/api/v1/rag`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: message,
      user_id: userId,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`AI Coach request failed: ${res.status} ${text}`);
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
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Create interview failed: ${res.status} ${text}`);
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