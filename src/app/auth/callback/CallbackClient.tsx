"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import Card from "@/components/ui/Card";
import { setAuthTokens } from "@/lib/api";

interface CallbackClientProps {
  errorParam: string | null;
  errorDescription: string | null;
  code: string | null;
}

export default function CallbackClient({
  errorParam,
  errorDescription,
  code,
}: CallbackClientProps) {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function handleCallback() {
      try {
        // Handle OAuth errors
        if (errorParam) {
          setError(errorDescription || errorParam || "OAuth authentication failed");
          setStatus("error");
          return;
        }

        // Check if there's a code in the URL (Supabase OAuth callback)
        if (code) {
          // Exchange code for session
          const { data: { session }, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          
          if (exchangeError || !session || !session.access_token) {
            console.error("Error exchanging code for session:", exchangeError);
            setError(exchangeError?.message || "Failed to exchange OAuth code for session");
            setStatus("error");
            return;
          }

          // Sync tokens for backend API compatibility
          setAuthTokens(session.access_token, session.refresh_token || "");

          setStatus("success");
          setTimeout(() => {
            router.push("/dashboard");
          }, 1500);
          return;
        }

        // Try to get existing session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error("Error getting session:", sessionError);
          setError(sessionError.message || "Failed to get authentication session");
          setStatus("error");
          return;
        }

        if (!session || !session.access_token) {
          setError("No authentication session found. Please try signing in again.");
          setStatus("error");
          return;
        }

        // Sync tokens for backend API compatibility
        setAuthTokens(session.access_token, session.refresh_token || "");

        setStatus("success");
        // Redirect to dashboard after a brief delay
        setTimeout(() => {
          router.push("/dashboard");
        }, 1500);
      } catch (err) {
        console.error("Error handling OAuth callback:", err);
        setError(
          err instanceof Error ? err.message : "An unexpected error occurred during authentication"
        );
        setStatus("error");
      }
    }

    handleCallback();
  }, [router, code, errorParam, errorDescription]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-950/20 via-purple-950/20 to-black p-4">
      <Card className="p-8 max-w-md w-full">
        <div className="flex flex-col items-center justify-center space-y-4">
          {status === "loading" && (
            <>
              <Loader2 className="w-12 h-12 animate-spin text-blue-400" />
              <h2 className="text-2xl font-bold text-white">Authenticating...</h2>
              <p className="text-white/60 text-center">
                Please wait while we complete your sign-in.
              </p>
            </>
          )}

          {status === "success" && (
            <>
              <CheckCircle2 className="w-12 h-12 text-green-400" />
              <h2 className="text-2xl font-bold text-white">Success!</h2>
              <p className="text-white/60 text-center">
                You have been successfully authenticated. Redirecting to dashboard...
              </p>
            </>
          )}

          {status === "error" && (
            <>
              <AlertCircle className="w-12 h-12 text-red-400" />
              <h2 className="text-2xl font-bold text-white">Authentication Failed</h2>
              <p className="text-white/60 text-center">{error}</p>
              <button
                onClick={() => router.push("/login")}
                className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                Return to Login
              </button>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}

