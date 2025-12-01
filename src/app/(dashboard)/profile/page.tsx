"use client";

import React from "react";
import Card from "../../../components/ui/Card";
import { useAuth } from "@/contexts/AuthContext";
import { useWallet } from "@/hooks/useWallet";
import {
  User,
  Mail,
  Phone,
  FileText,
  CheckCircle2,
  XCircle,
  Calendar,
  Coins,
  Loader2,
} from "lucide-react";

// Generate gradient colors based on initials
const generateGradient = (initials: string): string => {
  const colors = [
    "from-blue-500 to-purple-600",
    "from-purple-500 to-pink-600",
    "from-pink-500 to-red-600",
    "from-orange-500 to-yellow-600",
    "from-green-500 to-teal-600",
    "from-teal-500 to-cyan-600",
    "from-indigo-500 to-blue-600",
    "from-violet-500 to-purple-600",
  ];
  
  const hash = initials.split("").reduce((acc: number, char) => acc + char.charCodeAt(0), 0);
  const colorIndex = hash % colors.length;
  return colors[colorIndex]!;
};

const getUserInitials = (fullName?: string, email?: string): string => {
  if (fullName) {
    return fullName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }
  if (email && email[0]) {
    return email[0].toUpperCase();
  }
  return "U";
};

const formatDate = (dateString?: string): string => {
  if (!dateString) return "N/A";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "N/A";
  }
};

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const { balance, loading: walletLoading } = useWallet();

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-white/60" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Profile</h1>
          <p className="text-white/60 text-sm">View your profile information</p>
        </div>
        <Card>
          <div className="text-center py-8">
            <p className="text-white/60">No user data available. Please sign in again.</p>
          </div>
        </Card>
      </div>
    );
  }

  const initials = getUserInitials(user.fullName, user.email);
  const gradient = generateGradient(initials);
  const displayName = user.fullName || user.email?.split("@")[0] || "User";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-1">Profile</h1>
        <p className="text-white/60 text-sm">View and manage your profile information</p>
      </div>

      {/* Profile Header Card */}
      <Card className="space-y-6">
        <div className="flex items-start gap-6">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={displayName}
                className="w-24 h-24 rounded-full object-cover border-2 border-white/10"
              />
            ) : (
              <div
                className={`w-24 h-24 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold text-2xl border-2 border-white/10 shadow-lg`}
              >
                {initials}
              </div>
            )}
          </div>

          {/* User Info */}
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold text-white mb-2">{displayName}</h2>
            <div className="flex items-center gap-2 mb-4">
              {user.emailVerified ? (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span className="text-xs font-medium">Verified</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                  <XCircle className="w-3.5 h-3.5" />
                  <span className="text-xs font-medium">Unverified</span>
                </div>
              )}
            </div>

            {/* Token Balance */}
            <div className="flex items-center gap-2">
              {walletLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-primary-soft" />
              ) : (
                <>
                  <Coins className="w-4 h-4 text-primary-soft" />
                  <span className="text-sm font-medium text-primary-soft">
                    {balance} tokens
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Profile Details */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Personal Information */}
        <Card className="space-y-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <User className="w-5 h-5 text-primary-soft" />
            Personal Information
          </h3>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-white/60 uppercase tracking-wide mb-1.5 block">
                Full Name
              </label>
              <p className="text-white">{user.fullName || "Not set"}</p>
            </div>

            <div>
              <label className="text-xs font-medium text-white/60 uppercase tracking-wide mb-1.5 block flex items-center gap-2">
                <Mail className="w-3.5 h-3.5" />
                Email Address
              </label>
              <p className="text-white">{user.email}</p>
            </div>

            <div>
              <label className="text-xs font-medium text-white/60 uppercase tracking-wide mb-1.5 block flex items-center gap-2">
                <Phone className="w-3.5 h-3.5" />
                Phone Number
              </label>
              <p className="text-white">{user.phoneNumber || "Not set"}</p>
            </div>
          </div>
        </Card>

        {/* Account Information */}
        <Card className="space-y-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary-soft" />
            Account Information
          </h3>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-white/60 uppercase tracking-wide mb-1.5 block">
                Email Verification Status
              </label>
              <div className="flex items-center gap-2">
                {user.emailVerified ? (
                  <div className="flex items-center gap-2 text-green-400">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="text-sm">Verified</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-yellow-400">
                    <XCircle className="w-4 h-4" />
                    <span className="text-sm">Not Verified</span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-white/60 uppercase tracking-wide mb-1.5 block flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5" />
                Member Since
              </label>
              <p className="text-white">{formatDate(user.createdAt)}</p>
            </div>

            <div>
              <label className="text-xs font-medium text-white/60 uppercase tracking-wide mb-1.5 block">
                User ID
              </label>
              <p className="text-white font-mono text-sm">{user.id}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Bio Section */}
      {user.bio && (
        <Card className="space-y-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary-soft" />
            About
          </h3>
          <p className="text-white/80 leading-relaxed">{user.bio}</p>
        </Card>
      )}
    </div>
  );
}

