# Voice Interview Feature - Complete Documentation

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [User Flow](#user-flow)
4. [Component Structure](#component-structure)
5. [State Management](#state-management)
6. [WebSocket Communication](#websocket-communication)
7. [Audio Processing](#audio-processing)
8. [API Endpoints](#api-endpoints)
9. [Error Handling](#error-handling)
10. [Troubleshooting](#troubleshooting)

---

## Overview

The Voice Interview feature is a real-time, AI-powered interview practice system that allows users to conduct voice-based interviews with an AI interviewer. The system uses WebSocket for real-time communication, MediaRecorder API for audio capture, and provides live transcription and analysis.

### Key Features
- Real-time voice conversation with AI interviewer
- Live transcription of user speech
- Automatic question progression
- Interview analysis and scoring
- Progress tracking
- Manual and automatic recording controls

---

## Architecture

### Technology Stack
- **Frontend Framework**: Next.js 16 with React 19
- **WebSocket**: Socket.IO Client
- **Audio Capture**: MediaRecorder API
- **State Management**: React Hooks (useState, useRef, useCallback, useEffect)
- **TypeScript**: Full type safety

### Component Hierarchy
```
VoiceInterviewPage (Page Component)
  └── VoiceInterview (Wrapper)
      └── InterviewRoom (Main UI)
          ├── AiAvatar (AI Visual)
          ├── MessageTimeline (Chat History)
          ├── TranscriptionBubble (Live Transcript)
          ├── MicController (Microphone Controls)
          ├── ProgressBar (Interview Progress)
          └── InterviewEndScreen (Results)
```

### Core Hook
- **`useVoiceInterview`**: Custom React hook managing all interview logic, state, and WebSocket communication

---

## User Flow

### 1. Configuration Phase

**Location**: `src/app/(dashboard)/voice-interview/page.tsx`

**Steps**:
1. User fills out interview configuration form:
   - **Role Name** (required): e.g., "Senior Software Engineer"
   - **Difficulty**: Beginner, Intermediate, or Advanced
   - **Interview Type**: Technical, Behavioral, System Design, or Mixed
   - **Interview Role**: Optional, e.g., "Technical Interviewer"
   - **Job Description**: Optional text area
   - **Number of Questions**: 3-15 (default: 5)
   - **Duration**: 10-60 minutes (default: 30)
   - **Experience Level**: Entry, Mid, Senior, or Lead
   - **Company Name**: Optional
   - **Resume Upload**: Optional PDF/DOC file

2. User clicks **"Start Interview"** button

3. System validates:
   - Role name is not empty
   - No duplicate requests (using `isStartingRef`)
   - Interview is not already active

4. Configuration object is created and passed to `VoiceInterview` component

### 2. Initialization Phase

**Location**: `src/components/voice-interview/useVoiceInterview.ts`

**State Transitions**:
```
idle → creating → connecting → ready
```

**Process**:
1. **Status: "creating"**
   - `createVoiceInterview` API call is made
   - Request includes all configuration parameters
   - Backend creates session and returns `session_id`

2. **Status: "connecting"**
   - WebSocket connection is established using Socket.IO
   - Connection uses both websocket and polling transports
   - `voiceInterview:join` event is emitted with session_id and user_id

3. **Status: "ready"**
   - Backend responds with `voiceInterview:joined` event
   - Interview state is received and stored
   - UI shows "Start Interview" button

### 3. Interview Start

**User Action**: Clicks "Start Interview" button

**Process**:
1. `startInterview()` function emits `voiceInterview:start` event
2. Backend responds with `voiceInterview:started` event
3. First AI greeting/question is received
4. Audio is played to user
5. Status changes to "running"
6. Recording automatically begins

### 4. Question-Answer Cycle

**Phase Flow**:
```
AI Speaking → User Listening → User Recording → Processing → AI Response → (Repeat)
```

#### 4.1 AI Speaking Phase
- **Status**: `aiState = "speaking"`
- **Mic Status**: `"muted"` (prevents echo)
- **Process**:
  - AI audio is received via `voiceInterview:response` or `voiceInterview:started`
  - Audio is played using HTML5 Audio API
  - Text is added to timeline
  - Progress is updated

#### 4.2 User Listening Phase
- **Status**: `aiState = "listening"`
- **Mic Status**: `"listening"` → `"recording"`
- **Process**:
  - After audio finishes, `beginUserTurn()` is called
  - 400ms delay for transition
  - Recording automatically starts

#### 4.3 User Recording Phase
- **Status**: `isRecording = true`, `micStatus = "recording"`
- **Process**:
  - MediaRecorder captures audio from microphone
  - Audio chunks are sent every 1 second (intermediate chunks)
  - Live transcription updates in real-time
  - Recording stops automatically when:
    - User clicks "Stop" button
    - 2.5 seconds of silence detected
    - 60 seconds maximum reached

#### 4.4 Processing Phase
- **Status**: `isProcessingUserResponse = true`, `micStatus = "processing"`
- **Process**:
  1. Final audio blob is created from all chunks
  2. Audio is converted to base64
  3. Final chunk is sent via WebSocket with `is_final: true`
  4. 30-second timeout is set
  5. System waits for:
     - Final transcription (`voiceInterview:transcription` with `is_final: true`)
     - AI response (`voiceInterview:response`)

#### 4.5 AI Response Phase
- **Process**:
  - AI processes the answer
  - Next question or follow-up is generated
  - Response is sent via `voiceInterview:response`
  - Cycle repeats

### 5. Interview Completion

**Trigger**: `voiceInterview:complete` event or `is_complete: true` in response

**Process**:
1. Status changes to "completed"
2. Media cleanup (stop recording, close streams)
3. Analysis is fetched via `getVoiceInterviewAnalysis` API
4. `InterviewEndScreen` component displays results

### 6. Results Display

**Components**: `InterviewEndScreen`

**Data Shown**:
- Overall score
- Communication score
- Content score
- Engagement score
- Strengths summary
- Improvement areas
- Recommendations
- Conversation summary

---

## Component Structure

### 1. VoiceInterviewPage
**File**: `src/app/(dashboard)/voice-interview/page.tsx`

**Responsibilities**:
- Configuration form UI
- Form state management
- Interview initialization
- Conditional rendering (config form vs interview room)

**Key State**:
```typescript
- isInterviewActive: boolean
- interviewConfig: CreateVoiceInterviewRequest | null
- form: InterviewFormData
- loading: boolean
- error: string | null
```

**Key Functions**:
- `handleStartInterview()`: Validates form, creates config, starts interview
- `handleExitInterview()`: Resets state, returns to config screen
- `handleInputChange()`: Updates form fields

### 2. VoiceInterview (Wrapper)
**File**: `src/components/VoiceInterview.tsx`

**Purpose**: Simple wrapper that passes props to `InterviewRoom`

### 3. InterviewRoom
**File**: `src/components/voice-interview/InterviewRoom.tsx`

**Responsibilities**:
- Main interview UI layout
- State management via `useVoiceInterview` hook
- Conditional rendering based on status
- Error and loading state handling

**UI Sections**:
1. **AI Avatar**: Visual representation of interviewer
2. **Message Timeline**: Chat history of questions and answers
3. **Transcription Bubble**: Live transcript display
4. **Mic Controller**: Recording controls
5. **Progress Bar**: Interview progress indicator
6. **End Screen**: Results display

### 4. useVoiceInterview Hook
**File**: `src/components/voice-interview/useVoiceInterview.ts`

**Core Logic**: All interview state and business logic

**Returns**:
```typescript
{
  status: InterviewStatus
  connectionMessage: string
  sessionId: string | null
  error: string | null
  timeline: TimelineEntry[]
  liveTranscript: string
  aiState: AvatarState
  micStatus: MicStatus
  isRecording: boolean
  isAiSpeaking: boolean
  isProcessingUserResponse: boolean
  progress: ProgressData
  analysis: VoiceInterviewAnalysis | null
  startInterview: () => void
  joinSession: () => void
  leaveSession: () => void
  toggleMicMute: () => void
  startManualRecording: () => Promise<void>
  stopManualRecording: () => void
}
```

---

## State Management

### Interview Status States
```typescript
type InterviewStatus = 
  | "idle"           // Initial state, no interview
  | "creating"       // Creating interview session
  | "connecting"     // Connecting WebSocket
  | "ready"          // Ready to start
  | "running"        // Interview in progress
  | "completed"      // Interview finished
  | "error"          // Error occurred
```

### Avatar States
```typescript
type AvatarState = 
  | "idle"           // No activity
  | "speaking"       // AI is speaking
  | "listening"      // Waiting for user
  | "thinking"       // Processing (not currently used)
```

### Mic Status States
```typescript
type MicStatus = 
  | "disabled"       // Mic not available
  | "muted"          // Mic muted
  | "preparing"      // Getting ready
  | "listening"      // Ready to record
  | "recording"      // Currently recording
  | "processing"     // Processing audio
```

### State Flow Diagram
```
┌─────────┐
│  idle   │
└────┬────┘
     │ User clicks "Start Interview"
     ▼
┌──────────┐
│ creating │ ──→ API: createVoiceInterview()
└────┬─────┘
     │ Session created
     ▼
┌────────────┐
│ connecting │ ──→ WebSocket: connect + join
└────┬───────┘
     │ Joined successfully
     ▼
┌────────┐
│ ready  │ ──→ User clicks "Start Interview"
└────┬───┘
     │
     ▼
┌─────────┐
│ running │ ──→ Interview loop
└────┬────┘
     │ Interview complete
     ▼
┌───────────┐
│ completed │
└───────────┘
```

### Refs Used for Non-Reactive State
```typescript
- socketRef: WebSocket connection
- mediaRecorderRef: MediaRecorder instance
- audioChunksRef: Accumulated audio chunks
- audioStreamRef: MediaStream from microphone
- audioPlayerRef: HTMLAudioElement for playback
- micMutedRef: Mute state (for callbacks)
- lastTranscriptRef: Timestamp of last transcript
- hasSpeechRef: Whether speech was detected
- recordingStartRef: Recording start timestamp
- isMountedRef: Component mount status
- processingTimeoutRef: Timeout for processing state
- initializingRef: Initialization lock
- configRef: Config key for deduplication
```

---

## WebSocket Communication

### Connection Setup
```typescript
const socket = io(BASE, { 
  transports: ["websocket", "polling"] 
});
```

### Events Emitted (Client → Server)

#### 1. `voiceInterview:join`
**When**: After WebSocket connects
**Payload**:
```typescript
{
  session_id: string
  user_id: string
}
```

#### 2. `voiceInterview:start`
**When**: User clicks "Start Interview"
**Payload**:
```typescript
{
  session_id: string
}
```

#### 3. `voiceInterview:audio`
**When**: Audio chunks are ready (every 1 second + final)
**Payload**:
```typescript
{
  session_id: string
  audio_data: string        // Base64 encoded audio
  audio_format: string      // "webm", "ogg", or "mp4"
  sample_rate: number       // 16000
  is_final: boolean         // true for final chunk
}
```

### Events Received (Server → Client)

#### 1. `connect`
**When**: WebSocket connection established
**Action**: Emit `voiceInterview:join`

#### 2. `disconnect`
**When**: Connection lost
**Action**: 
- Clear processing timeout
- Reset mic status
- Update connection message
- Attempt reconnection

#### 3. `voiceInterview:joined`
**When**: Successfully joined session
**Payload**:
```typescript
{
  state: VoiceInterviewState
}
```
**Action**: 
- Set status to "ready"
- Update interview state
- Enable "Start Interview" button

#### 4. `voiceInterview:started`
**When**: Interview started
**Payload**: `VoiceInterviewResponse`
**Action**: Process first question (same as `voiceInterview:response`)

#### 5. `voiceInterview:response`
**When**: AI responds with next question
**Payload**:
```typescript
{
  session_id: string
  text: string                    // Question text
  audio_data?: string             // Base64 audio
  audio_format?: string           // "mp3", etc.
  current_phase: string           // "greeting", "questions", etc.
  current_question_index: number
  total_questions: number
  progress_percentage: number
  is_complete: boolean
  should_ask_followup: boolean
}
```
**Action**:
- Add question to timeline
- Play audio
- Update progress
- Start user turn

#### 6. `voiceInterview:transcription`
**When**: Transcription updates received
**Payload**:
```typescript
{
  text: string
  is_final: boolean
}
```
**Action**:
- If `is_final: false`: Update live transcript
- If `is_final: true`: Add to timeline, clear live transcript

#### 7. `voiceInterview:state`
**When**: Interview state updates
**Payload**:
```typescript
{
  state: VoiceInterviewState
}
```
**Action**: Update progress and phase

#### 8. `voiceInterview:complete`
**When**: Interview completed
**Payload**:
```typescript
{
  session_id: string
}
```
**Action**: Fetch analysis and show results

#### 9. `voiceInterview:error`
**When**: Error occurs
**Payload**:
```typescript
{
  error: string
}
```
**Action**: 
- Set error state
- Clear processing
- Show error UI

---

## Audio Processing

### Audio Capture Configuration

**MediaRecorder Setup**:
```typescript
const stream = await navigator.mediaDevices.getUserMedia({ 
  audio: {
    echoCancellation: true,      // Remove echo
    noiseSuppression: true,       // Reduce background noise
    autoGainControl: true,        // Normalize volume
    sampleRate: 16000,            // Optimal for speech recognition
    channelCount: 1,              // Mono channel
  } 
});
```

**Format Selection**:
The system tries formats in order:
1. `audio/webm;codecs=opus` (preferred)
2. `audio/webm`
3. `audio/ogg;codecs=opus`
4. `audio/mp4`

**Recording Settings**:
```typescript
const recorder = new MediaRecorder(stream, { 
  mimeType: selectedMimeType,
  audioBitsPerSecond: 16000      // Low bitrate for speech
});
```

### Audio Chunk Processing

**Intermediate Chunks** (every 1 second):
- Captured via `ondataavailable` event
- Sent immediately with `is_final: false`
- Used for live transcription
- Errors are logged but don't block flow

**Final Chunk** (on stop):
- All chunks are combined into single Blob
- Converted to base64
- Sent with `is_final: true`
- Triggers AI processing

### Audio Transmission

**Process**:
1. Blob → Base64 conversion using FileReader
2. Format detection from blob type
3. WebSocket emission with metadata
4. Server processes and transcribes

**Payload Structure**:
```typescript
{
  session_id: string
  audio_data: string        // Base64 encoded
  audio_format: string      // Detected format
  sample_rate: 16000
  is_final: boolean
}
```

### Audio Playback

**AI Audio Playback**:
```typescript
const audio = new Audio(`data:audio/${format};base64,${base64Audio}`);
audio.play();
```

**Features**:
- Automatic cleanup of previous audio
- Error handling for autoplay blocks
- State updates on play/end

---

## API Endpoints

### 1. Create Voice Interview
**Endpoint**: `POST /api/v1/voice-interview/create`

**Request**:
```typescript
{
  job_role: string
  experience_level: string
  company?: string
  job_description?: string
  interview_type: string
  interview_role?: string
  difficulty?: "Beginner" | "Intermediate" | "Advanced"
  user_id: string
  num_questions?: number
  duration_minutes?: number
}
```

**Response**:
```typescript
{
  success: boolean
  data?: {
    session_id: string
    total_questions: number
    config: Record<string, any>
    created_at: string
  }
  error?: string
}
```

### 2. Get Interview State
**Endpoint**: `GET /api/v1/voice-interview/{sessionId}/state`

**Response**:
```typescript
{
  success: boolean
  data: {
    session_id: string
    current_phase: "greeting" | "questions" | "followup" | "wrapup"
    current_question_index: number
    total_questions: number
    progress_percentage: number
    is_complete: boolean
    is_started: boolean
  }
}
```

### 3. Get Interview Analysis
**Endpoint**: `GET /api/v1/voice-interview/{sessionId}/analysis`

**Response**:
```typescript
{
  success: boolean
  data: {
    session_id: string
    overall_score: number
    total_questions: number
    answered_questions: number
    conversation_summary: string
    strengths_summary: string[]
    improvement_areas: string[]
    recommendations: string[]
    communication_score: number
    content_score: number
    engagement_score: number
    completed_at: string
  }
}
```

### 4. Get Interview Status
**Endpoint**: `GET /api/v1/voice-interview/{sessionId}/status`

**Response**:
```typescript
{
  success: boolean
  data: {
    session_id: string
    is_complete: boolean
    is_started: boolean
    current_phase: string
    current_question_index: number
    total_questions: number
    conversation_turns: number
    created_at: string
    started_at: string | null
    completed_at: string | null
  }
}
```

---

## Error Handling

### Error Types and Handling

#### 1. Initialization Errors
**Causes**:
- API call failure
- Invalid configuration
- Network issues

**Handling**:
- Error state set
- Status changes to "error"
- Error message displayed
- User can retry

#### 2. WebSocket Connection Errors
**Causes**:
- Connection lost
- Server unavailable
- Network interruption

**Handling**:
- Automatic reconnection attempt
- Status shows "connecting"
- Processing state cleared
- User notified via connection message

#### 3. Audio Recording Errors
**Causes**:
- Microphone permission denied
- No audio input device
- MediaRecorder errors

**Handling**:
- Error message displayed
- Mic status set to "muted"
- User can retry after granting permissions

#### 4. Audio Transmission Errors
**Causes**:
- WebSocket not connected
- Session ID missing
- Network issues

**Handling**:
- For intermediate chunks: Logged, not shown to user
- For final chunks: Error displayed, processing cleared
- User can retry recording

#### 5. Processing Timeout
**Causes**:
- Server not responding
- Backend processing delay
- Network latency

**Handling**:
- 30-second timeout
- Processing state cleared
- Error message shown
- User can try speaking again

#### 6. Transcription Errors
**Causes**:
- Empty transcriptions
- Backend processing issues

**Handling**:
- Warnings logged
- Empty transcripts not added to timeline
- Flow continues normally

### Error Recovery Mechanisms

1. **Automatic Reconnection**: WebSocket automatically reconnects on disconnect
2. **State Validation**: Checks before critical operations
3. **Timeout Protection**: Prevents infinite waiting states
4. **Graceful Degradation**: Continues with partial data when possible
5. **User Feedback**: Clear error messages with actionable steps

---

## Troubleshooting

### Common Issues and Solutions

#### Issue 1: "Connection not ready" Error
**Symptoms**: Error appears during initialization
**Cause**: Recording attempted before WebSocket ready
**Solution**: 
- Fixed in code: Status check prevents recording during initialization
- Wait for "ready" status before interacting

#### Issue 2: Multiple API Calls on Button Click
**Symptoms**: Multiple interview sessions created
**Cause**: Missing debounce/guard
**Solution**: 
- Fixed: `isStartingRef` prevents duplicate calls
- Button disabled during loading

#### Issue 3: Stuck on "Processing your answer"
**Symptoms**: Processing state never clears
**Cause**: No response from server or timeout
**Solution**:
- Fixed: 30-second timeout clears state
- Check WebSocket connection
- Verify backend is processing audio

#### Issue 4: Audio Not Recognized
**Symptoms**: Transcriptions are empty or incorrect
**Possible Causes**:
1. **Audio format not supported**
   - Check console for "Selected audio format" log
   - Verify browser supports selected format

2. **Audio quality issues**
   - Check microphone permissions
   - Verify audio constraints are applied
   - Test microphone in other applications

3. **Network issues**
   - Check WebSocket connection status
   - Verify audio chunks are being sent (check console logs)
   - Check network tab for failed requests

4. **Backend processing**
   - Verify backend is receiving audio
   - Check backend logs for transcription errors
   - Ensure backend supports the audio format

**Debugging Steps**:
1. Open browser console (F12)
2. Look for audio-related logs:
   - "Selected audio format: ..."
   - "Audio chunk received: X bytes"
   - "Audio converted to base64: X characters"
   - "Emitting audio to server: ..."
   - "Transcription received: ..."
3. Check Network tab for WebSocket messages
4. Verify microphone is working in browser settings

#### Issue 5: Interview Doesn't Start
**Symptoms**: Stuck on "ready" status
**Cause**: `startInterview` not called or WebSocket issue
**Solution**:
- Verify "Start Interview" button is visible
- Check WebSocket connection status
- Verify `voiceInterview:start` event is emitted
- Check backend logs for event reception

#### Issue 6: Audio Playback Issues
**Symptoms**: Can't hear AI questions
**Cause**: Autoplay blocked or audio format issue
**Solution**:
- Check browser autoplay settings
- Verify audio format is supported
- Check console for audio playback errors
- Test with different browsers

### Debug Checklist

When debugging issues, check:

- [ ] Browser console for errors
- [ ] Network tab for WebSocket connection
- [ ] Microphone permissions granted
- [ ] WebSocket events being received
- [ ] Audio chunks being sent (check logs)
- [ ] Status transitions (check status logs)
- [ ] Backend logs for processing
- [ ] Browser compatibility (Chrome/Firefox recommended)

### Logging

The system includes comprehensive logging:

**Initialization**:
- "=== Starting Interview ==="
- "Interview config created: ..."
- "Setting interview config"

**Audio**:
- "Selected audio format: ..."
- "Audio chunk received: X bytes"
- "Audio converted to base64: X characters"
- "Emitting audio to server: ..."
- "Final audio chunk sent successfully"

**Transcription**:
- "Transcription received: ..."
- "Adding final transcription to timeline: ..."
- "Live transcript updated: ..."

**State Changes**:
- "=== State Changed ==="
- Status transitions logged

**Errors**:
- All errors logged with context
- Warnings for non-critical issues

---

## Best Practices

### For Developers

1. **State Management**:
   - Use refs for values that don't need to trigger re-renders
   - Use state for UI-reactive values
   - Memoize expensive computations

2. **WebSocket**:
   - Always check connection status before emitting
   - Handle disconnect events gracefully
   - Clean up listeners on unmount

3. **Audio**:
   - Always clean up MediaRecorder and streams
   - Handle permission errors gracefully
   - Validate audio data before sending

4. **Error Handling**:
   - Provide clear, actionable error messages
   - Log errors with context
   - Implement timeouts for async operations

5. **Performance**:
   - Debounce user actions
   - Prevent duplicate API calls
   - Clean up resources on unmount

### For Users

1. **Before Starting**:
   - Ensure stable internet connection
   - Test microphone in browser settings
   - Use a quiet environment
   - Close unnecessary applications

2. **During Interview**:
   - Speak clearly and at moderate pace
   - Wait for AI to finish speaking
   - Use "Stop" button to end recording
   - Don't interrupt the AI

3. **Troubleshooting**:
   - Check browser console for errors
   - Refresh page if stuck
   - Grant microphone permissions if prompted
   - Try different browser if issues persist

---

## Future Enhancements

Potential improvements:

1. **Resume Upload Processing**: Currently accepted but not processed
2. **Interview Resumption**: Save and resume interviews
3. **Multiple Language Support**: Support for non-English interviews
4. **Video Support**: Add video interview capability
5. **Real-time Feedback**: Show feedback during interview
6. **Interview History**: Save and review past interviews
7. **Custom Questions**: Allow users to add custom questions
8. **Interview Sharing**: Share interview results
9. **Mobile Optimization**: Better mobile experience
10. **Offline Mode**: Basic offline functionality

---

## Conclusion

The Voice Interview feature is a comprehensive, real-time interview practice system with robust error handling, state management, and user experience features. The architecture is designed for scalability and maintainability, with clear separation of concerns and comprehensive logging for debugging.

For questions or issues, refer to the troubleshooting section or check the browser console for detailed logs.

