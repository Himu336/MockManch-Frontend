"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { User as SupabaseUser, Session } from "@supabase/supabase-js";
import {
  type User,
  type SignInRequest,
  type SignUpRequest,
  type UpdateProfileRequest,
  updateProfile as apiUpdateProfile,
  setAuthTokens,
  clearAuthTokens,
} from "@/lib/api";

type AuthContextType = {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  signIn: (credentials: SignInRequest) => Promise<{ success: boolean; error?: string }>;
  signUp: (data: SignUpRequest) => Promise<{ success: boolean; error?: string }>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (data: UpdateProfileRequest) => Promise<{ success: boolean; error?: string }>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function mapSupabaseUserToAppUser(supabaseUser: SupabaseUser | null): User | null {
  if (!supabaseUser) return null;

  const metadata = (supabaseUser.user_metadata || {}) as Record<string, any>;

  return {
    id: supabaseUser.id,
    email: supabaseUser.email || "",
    fullName: metadata.fullName || metadata.full_name || "",
    avatarUrl: metadata.avatarUrl || metadata.avatar_url || "",
    phoneNumber: metadata.phoneNumber || metadata.phone_number || "",
    bio: metadata.bio || "",
    emailVerified: !!supabaseUser.email_confirmed_at,
    createdAt: supabaseUser.created_at || undefined,
  };
}

function syncSessionTokens(session: Session | null) {
  if (session && session.access_token) {
    // Mirror Supabase tokens into our existing token storage for backend API compatibility
    setAuthTokens(session.access_token, session.refresh_token || "");
  } else {
    clearAuthTokens();
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const loadInitialUser = useCallback(async () => {
    try {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        console.error("Error getting Supabase user:", error);
        setUser(null);
      } else {
        setUser(mapSupabaseUserToAppUser(data.user));
      }

      const { data: sessionData } = await supabase.auth.getSession();
      syncSessionTokens(sessionData.session ?? null);
    } catch (err) {
      console.error("Error initializing auth state:", err);
      setUser(null);
      clearAuthTokens();
    } finally {
      setLoading(false);
    }
  }, []);

  // Initialize auth state on mount
  useEffect(() => {
    loadInitialUser();

    // Subscribe to auth state changes so reloads and other tab actions stay in sync
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      syncSessionTokens(session);

      if (!session) {
        setUser(null);
        return;
      }

      // When session changes, fetch the latest user
      supabase.auth
        .getUser()
        .then(({ data, error }) => {
          if (error) {
            console.error("Error getting Supabase user on auth change:", error);
            setUser(null);
          } else {
            setUser(mapSupabaseUserToAppUser(data.user));
          }
        })
        .catch((err) => {
          console.error("Error during auth state change handling:", err);
          setUser(null);
        });
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [loadInitialUser]);

  const handleSignIn = useCallback(
    async (credentials: SignInRequest) => {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: credentials.email,
          password: credentials.password,
        });

        if (error) {
          return { success: false, error: error.message || "Sign in failed" };
        }

        syncSessionTokens(data.session ?? null);
        setUser(mapSupabaseUserToAppUser(data.user));
        return { success: true };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Sign in failed",
        };
      }
    },
    []
  );

  const handleSignUp = useCallback(
    async (data: SignUpRequest) => {
      try {
        const { data: signUpData, error } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
          options: {
            data: {
              fullName: data.fullName,
              phoneNumber: data.phoneNumber,
            },
          },
        });

        if (error) {
          return { success: false, error: error.message || "Sign up failed" };
        }

        syncSessionTokens(signUpData.session ?? null);
        setUser(mapSupabaseUserToAppUser(signUpData.user));
        return { success: true };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Sign up failed",
        };
      }
    },
    []
  );

  const handleSignOut = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Error signing out from Supabase:", error);
      }
    } finally {
      clearAuthTokens();
      setUser(null);
      router.push("/login");
    }
  }, [router]);

  const handleUpdateProfile = useCallback(
    async (data: UpdateProfileRequest) => {
      try {
        const response = await apiUpdateProfile(data);
        if (response.success && response.data) {
          setUser(response.data);
          return { success: true };
        } else {
          return {
            success: false,
            error: response.error || "Update profile failed",
          };
        }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Update profile failed",
        };
      }
    },
    []
  );

  const handleRefreshUser = useCallback(async () => {
    await loadInitialUser();
  }, [loadInitialUser]);

  const handleSignInWithGoogle = useCallback(async () => {
    try {
      const callbackUrl = `${window.location.origin}/auth/callback`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: callbackUrl,
        },
      });

      if (error) {
        console.error("Failed to initiate Google sign-in:", error);
        throw new Error(error.message || "Failed to initiate Google sign-in");
      }
    } catch (error) {
      console.error("Error initiating Google sign-in:", error);
      throw error;
    }
  }, []);

  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated: !!user,
    signIn: handleSignIn,
    signUp: handleSignUp,
    signInWithGoogle: handleSignInWithGoogle,
    signOut: handleSignOut,
    updateProfile: handleUpdateProfile,
    refreshUser: handleRefreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

