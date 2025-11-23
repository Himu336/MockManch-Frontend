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
} from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  // Hardcoded data
  const stats = [
    {
      label: "Interviews Done",
      value: "24",
      icon: FileText,
      color: "text-blue-400",
      bgColor: "bg-blue-500/20",
    },
    {
      label: "Avg Score",
      value: "78%",
      icon: TrendingUp,
      color: "text-green-400",
      bgColor: "bg-green-500/20",
    },
    {
      label: "Practice Hours",
      value: "12.5",
      icon: Clock,
      color: "text-purple-400",
      bgColor: "bg-purple-500/20",
    },
    {
      label: "Achievements",
      value: "8",
      icon: Award,
      color: "text-orange-400",
      bgColor: "bg-orange-500/20",
    },
  ];

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

  const recentActivities = [
    {
      title: "Video Interview",
      description: "Senior Developer • Today",
      score: "85%",
    },
    {
      title: "Text Interview",
      description: "Product Manager • Yesterday",
      score: "72%",
    },
    {
      title: "AI Coach",
      description: "System Design • 2 days ago",
      score: null,
    },
  ];

  const goals = [
    {
      label: "Weekly Practice Target",
      value: "5/7 days",
      progress: 71, // 5/7 = ~71%
    },
    {
      label: "Interview Mastery",
      value: "18/25 completed",
      progress: 72, // 18/25 = 72%
    },
    {
      label: "Communication Skills",
      value: "Level 3/5",
      progress: 60, // 3/5 = 60%
    },
  ];

  const improvementAreas = [
    {
      label: "Behavioral Questions",
      progress: 65,
      score: "65%",
      color: "green",
    },
    {
      label: "Technical Depth",
      progress: 58,
      score: "58%",
      color: "red",
    },
    {
      label: "Communication Clarity",
      progress: 71,
      score: "71%",
      color: "green",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-1">
          Welcome back, John! 👋
        </h1>
        <p className="text-white/60 text-sm">
          Ready to practice and improve your interview skills?
        </p>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
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
        })}
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
            <h2 className="text-lg font-semibold text-white mb-4">
              Recent Activity
            </h2>
            <div className="space-y-4">
              {recentActivities.map((activity, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between pb-4 border-b border-white/10 last:border-0 last:pb-0"
                >
                  <div>
                    <p className="text-white font-medium text-sm mb-1">
                      {activity.title}
                    </p>
                    <p className="text-white/60 text-xs">
                      {activity.description}
                    </p>
                  </div>
                  {activity.score && (
                    <div className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-xs font-medium">
                      {activity.score}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Current Goals */}
          <Card>
            <h2 className="text-lg font-semibold text-white mb-1">
              Current Goals
            </h2>
            <p className="text-sm text-white/60 mb-4">Track your progress</p>
            <div className="space-y-4">
              {goals.map((goal, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white text-sm font-medium">
                      {goal.label}
                    </span>
                    <span className="text-white/60 text-xs">
                      {goal.value}
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
          </Card>

          {/* Areas to Improve */}
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-5 h-5 text-red-400" />
              <h2 className="text-lg font-semibold text-white">
                Areas to Improve
              </h2>
            </div>
            <div className="space-y-4">
              {improvementAreas.map((area, index) => {
                const colorClasses = {
                  green: "bg-green-500/20 text-green-400 border-green-500/30",
                  red: "bg-red-500/20 text-red-400 border-red-500/30",
                };
                return (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white text-sm font-medium">
                        {area.label}
                      </span>
                      <div
                        className={`px-2 py-0.5 rounded-full text-xs font-medium border ${colorClasses[area.color as keyof typeof colorClasses]}`}
                      >
                        {area.score}
                      </div>
                    </div>
                    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          area.color === "green"
                            ? "bg-green-500"
                            : "bg-red-500"
                        }`}
                        style={{ width: `${area.progress}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
