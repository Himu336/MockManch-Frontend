"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  signIn as apiSignIn,
  signUp as apiSignUp,
  signOut as apiSignOut,
  getCurrentUser,
  refreshToken,
  updateProfile as apiUpdateProfile,
  getGoogleOAuthUrl,
  verifyOAuthSession,
  type User,
  type SignInRequest,
  type SignUpRequest,
  type UpdateProfileRequest,
  getAuthToken,
} from "@/lib/api";

type AuthContextType = {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  signIn: (credentials: SignInRequest) => Promise<{ success: boolean; error?: string }>;
  signUp: (data: SignUpRequest) => Promise<{ success: boolean; error?: string }>;
  signInWithGoogle: () => Promise<void>;
  verifyOAuthCallback: (accessToken: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  updateProfile: (data: UpdateProfileRequest) => Promise<{ success: boolean; error?: string }>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const fetchUser = useCallback(async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      const response = await getCurrentUser();
      if (response.success && response.data) {
        setUser(response.data);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Error fetching user:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initialize auth state on mount
  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  // Auto-refresh token before expiration
  useEffect(() => {
    const token = getAuthToken();
    if (!token) return;

    // Refresh token every 14 minutes (tokens typically last 15 minutes)
    const interval = setInterval(async () => {
      try {
        await refreshToken();
      } catch (error) {
        console.error("Error refreshing token:", error);
      }
    }, 14 * 60 * 1000);

    return () => clearInterval(interval);
  }, [user]);

  const handleSignIn = useCallback(
    async (credentials: SignInRequest) => {
      try {
        const response = await apiSignIn(credentials);
        if (response.success && response.data) {
          setUser(response.data.user);
          return { success: true };
        } else {
          return { success: false, error: response.error || "Sign in failed" };
        }
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
        const response = await apiSignUp(data);
        if (response.success && response.data) {
          setUser(response.data.user);
          return { success: true };
        } else {
          return { success: false, error: response.error || "Sign up failed" };
        }
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
      await apiSignOut();
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
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
    await fetchUser();
  }, [fetchUser]);

  const handleSignInWithGoogle = useCallback(async () => {
    try {
      const callbackUrl = `${window.location.origin}/auth/callback`;
      const response = await getGoogleOAuthUrl(callbackUrl);
      
      if (response.success && response.data?.url) {
        // Redirect to Google OAuth URL
        window.location.href = response.data.url;
      } else {
        console.error("Failed to get OAuth URL:", response.error);
        throw new Error(response.error || "Failed to initiate Google sign-in");
      }
    } catch (error) {
      console.error("Error initiating Google sign-in:", error);
      throw error;
    }
  }, []);

  const handleVerifyOAuthCallback = useCallback(
    async (accessToken: string) => {
      try {
        const response = await verifyOAuthSession(accessToken);
        if (response.success && response.data) {
          setUser(response.data.user);
          return { success: true };
        } else {
          return {
            success: false,
            error: response.error || "OAuth verification failed",
          };
        }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "OAuth verification failed",
        };
      }
    },
    []
  );

  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated: !!user,
    signIn: handleSignIn,
    signUp: handleSignUp,
    signInWithGoogle: handleSignInWithGoogle,
    verifyOAuthCallback: handleVerifyOAuthCallback,
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

