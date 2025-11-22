"use client";

import React, { useState, useRef, useEffect } from "react";
import { Zap, Send, Bot, Loader2 } from "lucide-react";
import Input from "../../../components/ui/Input";
import { sendMessageToCoach } from "../../../lib/api";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export default function AiCoachPage() {
  // TODO: Replace with actual user ID from auth/session
  const userId = "test_user_8";

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content:
        "Hello! I'm your personal AI interview coach. I remember all our previous conversations and your goals. I see you're preparing for Senior Developer roles at tech companies. How can I help you practice today?",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue,
      timestamp: new Date(),
    };

    const messageText = inputValue;
    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);
    setError(null);

    try {
      const response = await sendMessageToCoach(messageText, userId);
      
      // Extract ai_text from the response data
      const aiResponseText = response.success && response.data?.ai_text 
        ? response.data.ai_text 
        : "Sorry, I couldn't process that response. Please try again.";

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: aiResponseText,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to get response from AI Coach");
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-[#0f1012] -m-8 p-8">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-6 border-b border-white/10">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#3b82f6] flex items-center justify-center flex-shrink-0">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-white mb-1">
              Your AI Coach
            </h1>
            <p className="text-sm sm:text-base text-white/60">
              Personalized guidance based on your profile and history
            </p>
          </div>
        </div>

        {/* Status Buttons */}
        <div className="flex flex-wrap gap-2 sm:flex-nowrap">
          <div className="px-3 py-1.5 bg-[#3b82f6] text-white text-xs sm:text-sm font-medium rounded-md whitespace-nowrap">
            Remembers your context
          </div>
          <div className="px-3 py-1.5 bg-[#10b981] text-white text-xs sm:text-sm font-medium rounded-md whitespace-nowrap">
            Active
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-1 py-6 space-y-6">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${
              message.role === "user" ? "flex-row-reverse" : ""
            }`}
          >
            {/* Avatar */}
            <div
              className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                message.role === "assistant"
                  ? "bg-white"
                  : "bg-[#3b82f6]"
              }`}
            >
              {message.role === "assistant" ? (
                <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-[#0f1012]" />
              ) : (
                <span className="text-white text-xs sm:text-sm font-medium">
                  U
                </span>
              )}
            </div>

            {/* Message Bubble */}
            <div className="flex flex-col flex-1 max-w-[85%] sm:max-w-[75%]">
              <div
                className={`rounded-2xl px-4 py-3 ${
                  message.role === "assistant"
                    ? "bg-[#1f1f23] text-white"
                    : "bg-[#3b82f6] text-white"
                }`}
              >
                <p className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap">
                  {message.content}
                </p>
              </div>
              <span className="text-xs text-white/40 mt-1.5 px-1">
                {formatTime(message.timestamp)}
              </span>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-[#0f1012]" />
            </div>
            <div className="flex flex-col flex-1 max-w-[85%] sm:max-w-[75%]">
              <div className="rounded-2xl px-4 py-3 bg-[#1f1f23] text-white">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm sm:text-base">Thinking...</span>
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Section */}
      <div className="pt-4 border-t border-white/10">
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <Input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask your coach anything... (e.g., 'Help me prepare for a system design interview')"
              className="w-full bg-[#141416] border-white/10 rounded-xl px-4 py-3 text-sm sm:text-base placeholder:text-white/40 focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent"
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || isLoading}
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#3b82f6] text-white flex items-center justify-center hover:bg-[#2563eb] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
            ) : (
              <Send className="w-4 h-4 sm:w-5 sm:h-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
