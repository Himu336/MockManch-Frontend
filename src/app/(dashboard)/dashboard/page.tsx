"use client";

import React from "react";
import Card from "../../../components/ui/Card";
import Button from "../../../components/ui/Button";
import {
  FileText,
  TrendingUp,
  Clock,
  Award,
  MessageCircle,
  Video,
  Users,
  Target,
  ChevronRight,
  Loader2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { useDashboard } from "@/hooks/useDashboard";
import { useAuth } from "@/contexts/AuthContext";

// Helper function to format goal labels
function formatGoalLabel(goalType: string): string {
  const labels: Record<string, string> = {
    weekly_practice: "Weekly Practice Target",
    interview_mastery: "Interview Mastery",
    communication_skills: "Communication Skills",
  };
  return labels[goalType] || goalType.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}

// Helper function to format goal value display
function formatGoalValue(goal: { goalType: string; currentValue: number; targetValue: number }): string {
  if (goal.goalType === "weekly_practice") {
    return `${goal.currentValue}/${goal.targetValue} days`;
  } else if (goal.goalType === "interview_mastery") {
    return `${goal.currentValue}/${goal.targetValue} completed`;
  } else if (goal.goalType === "communication_skills") {
    return `Level ${goal.currentValue}/${goal.targetValue}`;
  }
  return `${goal.currentValue}/${goal.targetValue}`;
}

// Helper function to format interview type display
function formatInterviewType(type: string): string {
  if (type.toLowerCase().includes("voice")) return "Voice Interview";
  if (type.toLowerCase().includes("text")) return "Text Interview";
  if (type.toLowerCase().includes("video")) return "Video Interview";
  return type;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const {
    summary,
    goals,
    recentActivity,
    areasToImprove,
    isLoading,
    error,
    refetch,
  } = useDashboard({
    userId: user?.id || "",
    parallel: true, // Fetch all sections in parallel for better performance
    enableCache: true,
  });

  const quickPracticeOptions = [
    {
      label: "Chat with AI Coach",
      icon: MessageCircle,
      href: "/ai-coach",
      highlighted: true,
    },
    {
      label: "Text Interview Practice",
      icon: FileText,
      href: "/text-interview",
      highlighted: false,
    },
    {
      label: "Video Interview Practice",
      icon: Video,
      href: "/voice-interview",
      highlighted: false,
    },
    {
      label: "Join Group Practice",
      icon: Users,
      href: "/group-practice",
      highlighted: false,
    },
  ];

  // Build stats from API data
  const stats = summary
    ? [
        {
          label: "Interviews Done",
          value: summary.interviewsDone.toString(),
          icon: FileText,
          color: "text-blue-400",
          bgColor: "bg-blue-500/20",
        },
        {
          label: "Avg Score",
          value: `${summary.avgScore.toFixed(0)}%`,
          icon: TrendingUp,
          color: "text-green-400",
          bgColor: "bg-green-500/20",
        },
        {
          label: "Practice Hours",
          value: summary.practiceHours.toFixed(1),
          icon: Clock,
          color: "text-purple-400",
          bgColor: "bg-purple-500/20",
        },
        {
          label: "Achievements",
          value: summary.achievements.toString(),
          icon: Award,
          color: "text-orange-400",
          bgColor: "bg-orange-500/20",
        },
      ]
    : [];

  // Loading skeleton component
  const LoadingSkeleton = () => (
    <div className="animate-pulse">
      <div className="h-4 bg-white/10 rounded w-3/4 mb-2"></div>
      <div className="h-8 bg-white/10 rounded w-1/2"></div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-1">
          Welcome back{user?.fullName ? `, ${user.fullName.split(" ")[0]}` : ""}! 👋
        </h1>
        <p className="text-white/60 text-sm">
          Ready to practice and improve your interview skills?
        </p>
      </div>

      {/* Error Banner */}
      {error && (
        <Card className="p-4 bg-red-500/10 border-red-500/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <div>
                <p className="text-red-400 font-medium text-sm">Error loading dashboard</p>
                <p className="text-red-400/60 text-xs">{error}</p>
              </div>
            </div>
            <Button
              onClick={() => refetch()}
              className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border-red-500/30"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        </Card>
      )}

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading && !summary ? (
          // Loading skeleton for stats
          Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} className="p-4">
              <LoadingSkeleton />
            </Card>
          ))
        ) : stats.length > 0 ? (
          stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/60 text-sm mb-1">{stat.label}</p>
                    <p className="text-2xl font-bold text-white">{stat.value}</p>
                  </div>
                  <div
                    className={`${stat.bgColor} ${stat.color} p-3 rounded-lg`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
              </Card>
            );
          })
        ) : (
          // Empty state
          <Card className="p-4 col-span-4">
            <p className="text-white/60 text-sm">No statistics available</p>
          </Card>
        )}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Quick Practice */}
          <Card>
            <h2 className="text-lg font-semibold text-white mb-1">
              Quick Practice
            </h2>
            <p className="text-sm text-white/60 mb-4">
              Start a practice session now
            </p>
            <div className="space-y-2">
              {quickPracticeOptions.map((option, index) => {
                const Icon = option.icon;
                return (
                  <Link key={index} href={option.href}>
                    <button
                      className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                        option.highlighted
                          ? "bg-blue-500/20 border border-blue-500/30 text-blue-400 hover:bg-blue-500/30"
                          : "bg-white/5 border border-white/10 text-white hover:bg-white/10"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-5 h-5" />
                        <span className="text-sm font-medium">
                          {option.label}
                        </span>
                      </div>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </Link>
                );
              })}
            </div>
          </Card>

          {/* Recent Activity */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Recent Activity</h2>
              {isLoading && (
                <Loader2 className="w-4 h-4 text-white/60 animate-spin" />
              )}
            </div>
            {isLoading && recentActivity.length === 0 ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="animate-pulse">
                    <div className="h-4 bg-white/10 rounded w-2/3 mb-2"></div>
                    <div className="h-3 bg-white/10 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : recentActivity.length > 0 ? (
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center justify-between pb-4 border-b border-white/10 last:border-0 last:pb-0"
                  >
                    <div>
                      <p className="text-white font-medium text-sm mb-1">
                        {formatInterviewType(activity.interviewType)}
                      </p>
                      <p className="text-white/60 text-xs">
                        {activity.jobRole}
                        {activity.company && ` • ${activity.company}`}
                        {activity.dateLabel && ` • ${activity.dateLabel}`}
                      </p>
                    </div>
                    {activity.score > 0 && (
                      <div className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-xs font-medium">
                        {activity.score}%
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-white/60 text-sm">No recent activity</p>
                <p className="text-white/40 text-xs mt-1">
                  Start practicing to see your activity here
                </p>
              </div>
            )}
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Current Goals */}
          <Card>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-lg font-semibold text-white">Current Goals</h2>
              {isLoading && (
                <Loader2 className="w-4 h-4 text-white/60 animate-spin" />
              )}
            </div>
            <p className="text-sm text-white/60 mb-4">Track your progress</p>
            {isLoading && goals.length === 0 ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="animate-pulse">
                    <div className="h-3 bg-white/10 rounded w-full mb-2"></div>
                    <div className="h-2 bg-white/10 rounded w-full"></div>
                  </div>
                ))}
              </div>
            ) : goals.length > 0 ? (
              <div className="space-y-4">
                {goals.map((goal, index) => (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white text-sm font-medium">
                        {formatGoalLabel(goal.goalType)}
                      </span>
                      <span className="text-white/60 text-xs">
                        {formatGoalValue(goal)}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 transition-all duration-300"
                        style={{ width: `${goal.progress}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-white/60 text-sm">No goals set</p>
                <p className="text-white/40 text-xs mt-1">
                  Goals will appear here once you start practicing
                </p>
              </div>
            )}
          </Card>

          {/* Areas to Improve */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-red-400" />
                <h2 className="text-lg font-semibold text-white">
                  Areas to Improve
                </h2>
              </div>
              {isLoading && (
                <Loader2 className="w-4 h-4 text-white/60 animate-spin" />
              )}
            </div>
            {isLoading && areasToImprove.length === 0 ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="animate-pulse">
                    <div className="h-3 bg-white/10 rounded w-full mb-2"></div>
                    <div className="h-2 bg-white/10 rounded w-full"></div>
                  </div>
                ))}
              </div>
            ) : areasToImprove.length > 0 ? (
              <div className="space-y-4">
                {areasToImprove.map((area, index) => {
                  const colorClasses = {
                    green: "bg-green-500/20 text-green-400 border-green-500/30",
                    yellow: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
                    red: "bg-red-500/20 text-red-400 border-red-500/30",
                  };
                  const progressColors = {
                    green: "bg-green-500",
                    yellow: "bg-yellow-500",
                    red: "bg-red-500",
                  };
                  return (
                    <div key={index}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white text-sm font-medium">
                          {area.skillName}
                        </span>
                        <div
                          className={`px-2 py-0.5 rounded-full text-xs font-medium border ${
                            colorClasses[area.progressColor]
                          }`}
                        >
                          {area.score}%
                        </div>
                      </div>
                      <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            progressColors[area.progressColor]
                          }`}
                          style={{ width: `${area.score}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-white/60 text-sm">No improvement areas</p>
                <p className="text-white/40 text-xs mt-1">
                  Complete interviews to see skill assessments
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
