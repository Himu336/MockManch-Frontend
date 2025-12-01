"use client";

import React, { useState, useRef, useEffect } from "react";
import { Zap, Send, Bot, Loader2, AlertCircle, Coins, CreditCard } from "lucide-react";
import Input from "../../../components/ui/Input";
import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import { sendMessageToCoach, type RAGError } from "../../../lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useWallet } from "@/hooks/useWallet";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export default function AiCoachPage() {
  const { user } = useAuth();
  const { balance, fetchWallet } = useWallet();
  const router = useRouter();
  const userId = user?.id || "";

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
  const [insufficientTokens, setInsufficientTokens] = useState(false);
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
    setInsufficientTokens(false);

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
      
      // Refresh wallet balance after successful token deduction
      await fetchWallet();
    } catch (err) {
      // Handle specific error types
      if (err && typeof err === "object" && "status" in err) {
        const ragError = err as RAGError;
        
        if (ragError.status === 402) {
          // Insufficient tokens
          setInsufficientTokens(true);
          setError(ragError.message);
          const errorMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: "I'd love to help, but you don't have enough tokens to continue this conversation. Please purchase more tokens to keep chatting!",
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, errorMessage]);
          // Refresh wallet to get latest balance
          await fetchWallet();
        } else if (ragError.status === 401) {
          // Authentication error
          setError(ragError.message);
          const errorMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: "Your session has expired. Please sign in again to continue.",
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, errorMessage]);
          // Redirect to login after a short delay
          setTimeout(() => {
            router.push("/login");
          }, 2000);
        } else {
          // Other errors
          setError(ragError.message);
          const errorMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: "Sorry, I encountered an error. Please try again.",
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, errorMessage]);
        }
      } else {
        // Generic error
        const errorMsg = err instanceof Error ? err.message : "Failed to get response from AI Coach";
        setError(errorMsg);
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
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
          <div className="w-10 h-10 rounded-lg bg-[#5b21b6] flex items-center justify-center flex-shrink-0 shadow-[0_0_18px_rgba(91,33,182,0.35)]">
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
          <div className="px-3 py-1.5 bg-[#5b21b6] text-white text-xs sm:text-sm font-medium rounded-md whitespace-nowrap">
            Remembers your context
          </div>
          <div className="px-3 py-1.5 bg-[#10b981] text-white text-xs sm:text-sm font-medium rounded-md whitespace-nowrap">
            Active
          </div>
          {/* Token Balance */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 text-white text-xs sm:text-sm font-medium rounded-md whitespace-nowrap">
            <Coins className="w-3.5 h-3.5 text-primary-soft" />
            <span>{balance} tokens</span>
          </div>
        </div>
      </div>

      {/* Insufficient Tokens Banner */}
      {insufficientTokens && (
        <Card className="mt-4 p-4 bg-yellow-500/10 border-yellow-500/30">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-yellow-400 font-medium text-sm mb-2">
                Insufficient Tokens
              </p>
              <p className="text-yellow-400/80 text-sm mb-3">
                You need at least 1 token to use the AI Coach. Each message costs 1 token.
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

      {/* Error Banner (for non-token errors) */}
      {error && !insufficientTokens && (
        <Card className="mt-4 p-4 bg-red-500/10 border-red-500/30">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        </Card>
      )}

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
                    : "bg-[#5b21b6]"
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
                    : "bg-[#5b21b6] text-white"
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
              className="w-full bg-[#141416] border-white/10 rounded-xl px-4 py-3 text-sm sm:text-base placeholder:text-white/40 focus:ring-2 focus:ring-[#6d28d9] focus:border-[#6d28d9]"
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || isLoading}
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#5b21b6] text-white flex items-center justify-center hover:bg-[#4c1d95] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0 shadow-[0_0_18px_rgba(91,33,182,0.35)]"
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
