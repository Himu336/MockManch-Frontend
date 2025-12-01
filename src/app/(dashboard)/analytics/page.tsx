"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  getAnalyticsOverview,
  getSkillsBreakdown,
  getWeakAreas,
  getAchievements,
  type AnalyticsOverviewResponse,
  type SkillsBreakdownResponse,
  type WeakAreasResponse,
  type AchievementsResponse,
} from "@/lib/api";
import Card from "@/components/ui/Card";
import {
  TrendingUp,
  Target,
  BookOpen,
  Trophy,
  Loader2,
  AlertCircle,
  Award,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type Tab = "overview" | "skills-breakdown" | "weak-areas" | "achievements";

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data states
  const [overviewData, setOverviewData] =
    useState<AnalyticsOverviewResponse["data"] | null>(null);
  const [skillsData, setSkillsData] =
    useState<SkillsBreakdownResponse["data"] | null>(null);
  const [weakAreasData, setWeakAreasData] = useState<
    WeakAreasResponse["data"] | null
  >(null);
  const [achievementsData, setAchievementsData] = useState<
    AchievementsResponse["data"] | null
  >(null);

  // Fetch data based on active tab
  useEffect(() => {
    if (!user?.id) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        switch (activeTab) {
          case "overview": {
            const overview = await getAnalyticsOverview(user.id);
            if (overview.success) {
              setOverviewData(overview.data);
            } else {
              setError(overview.error || "Failed to load overview");
            }
            break;
          }
          case "skills-breakdown": {
            const skills = await getSkillsBreakdown(user.id);
            if (skills.success) {
              setSkillsData(skills.data);
            } else {
              setError(skills.error || "Failed to load skills breakdown");
            }
            break;
          }
          case "weak-areas": {
            const weakAreas = await getWeakAreas(user.id);
            if (weakAreas.success) {
              setWeakAreasData(weakAreas.data);
            } else {
              setError(weakAreas.error || "Failed to load weak areas");
            }
            break;
          }
          case "achievements": {
            const achievements = await getAchievements(user.id);
            if (achievements.success) {
              setAchievementsData(achievements.data);
            } else {
              setError(achievements.error || "Failed to load achievements");
            }
            break;
          }
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "An unexpected error occurred"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.id, activeTab]);

  const tabs: { id: Tab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "skills-breakdown", label: "Skills Breakdown" },
    { id: "weak-areas", label: "Weak Areas" },
    { id: "achievements", label: "Achievements" },
  ];

  if (loading && !overviewData && !skillsData && !weakAreasData && !achievementsData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">
          Analytics & Progress
        </h1>
        <p className="text-white/60">
          Track your improvement and identify areas to focus on
        </p>
      </div>

      {/* Key Metrics Cards - Only show on Overview tab */}
      {activeTab === "overview" && overviewData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Overall Score */}
          <Card className="card-bg">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-white/60 mb-1">Overall Score</p>
                <p className="text-3xl font-bold text-white">
                  {overviewData.overallScore.value}
                </p>
                <p className="text-sm text-green-400 mt-1">
                  {overviewData.overallScore.change > 0 ? "↑" : overviewData.overallScore.change < 0 ? "↓" : ""} {Math.abs(overviewData.overallScore.change)} from last week
                </p>
              </div>
              <div className="p-3 rounded-lg bg-purple-500/20">
                <TrendingUp className="w-6 h-6 text-purple-400" />
              </div>
            </div>
          </Card>

          {/* Interviews */}
          <Card className="card-bg">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-white/60 mb-1">Interviews</p>
                <p className="text-3xl font-bold text-white">
                  {overviewData.interviews.count}
                </p>
                <p className="text-sm text-white/60 mt-1">
                  {overviewData.interviews.timeframe || "This month"}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-purple-500/20">
                <Target className="w-6 h-6 text-purple-400" />
              </div>
            </div>
          </Card>

          {/* Study Time */}
          <Card className="card-bg">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-white/60 mb-1">Study Time</p>
                <p className="text-3xl font-bold text-white">
                  {overviewData.studyTime.hours.toFixed(1)}h
                </p>
                <p className="text-sm text-white/60 mt-1">
                  {overviewData.studyTime.timeframe || "This week"}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-green-500/20">
                <BookOpen className="w-6 h-6 text-green-400" />
              </div>
            </div>
          </Card>

          {/* Achievements */}
          <Card className="card-bg">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-white/60 mb-1">Achievements</p>
                <p className="text-3xl font-bold text-white">
                  {overviewData.achievements.unlocked}/{overviewData.achievements.total}
                </p>
                <p className="text-sm text-white/60 mt-1">Unlocked</p>
              </div>
              <div className="p-3 rounded-lg bg-orange-500/20">
                <Trophy className="w-6 h-6 text-orange-400" />
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/10">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
              activeTab === tab.id
                ? "text-white border-purple-500"
                : "text-white/60 border-transparent hover:text-white/80"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Error State */}
      {error && (
        <Card className="card-bg border-red-500/20">
          <div className="flex items-center gap-2 text-red-400">
            <AlertCircle className="w-5 h-5" />
            <p>{error}</p>
          </div>
        </Card>
      )}

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === "overview" && (
          <OverviewTab data={overviewData} loading={loading} />
        )}
        {activeTab === "skills-breakdown" && (
          <SkillsBreakdownTab data={skillsData} loading={loading} />
        )}
        {activeTab === "weak-areas" && (
          <WeakAreasTab data={weakAreasData} loading={loading} />
        )}
        {activeTab === "achievements" && (
          <AchievementsTab data={achievementsData} loading={loading} />
        )}
      </div>
    </div>
  );
}

// Overview Tab Component
function OverviewTab({
  data,
  loading,
}: {
  data: AnalyticsOverviewResponse["data"] | null;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  if (!data) {
    return (
      <Card className="card-bg">
        <p className="text-white/60">No data available</p>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Score Progression Chart */}
      <Card className="card-bg">
        <h3 className="text-lg font-semibold text-white mb-1">
          Score Progression
        </h3>
        <p className="text-sm text-white/60 mb-4">
          Your performance over time
        </p>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data.scoreProgression || []}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis
              dataKey="week"
              stroke="rgba(255,255,255,0.5)"
              style={{ fontSize: "12px" }}
            />
            <YAxis
              stroke="rgba(255,255,255,0.5)"
              domain={[0, 100]}
              style={{ fontSize: "12px" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(15, 16, 18, 0.95)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "8px",
                color: "#fff",
              }}
            />
            <Line
              type="monotone"
              dataKey="score"
              stroke="#a78bfa"
              strokeWidth={2}
              dot={{ fill: "#a78bfa", r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Performance by Category Chart */}
      <Card className="card-bg">
        <h3 className="text-lg font-semibold text-white mb-1">
          Performance by Category
        </h3>
        <p className="text-sm text-white/60 mb-4">
          Current vs target scores
        </p>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data.performanceByCategory || []}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis
              dataKey="category"
              stroke="rgba(255,255,255,0.5)"
              style={{ fontSize: "12px" }}
            />
            <YAxis
              stroke="rgba(255,255,255,0.5)"
              domain={[0, 100]}
              style={{ fontSize: "12px" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(15, 16, 18, 0.95)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "8px",
                color: "#fff",
              }}
            />
            <Bar 
              key="current-bar"
              dataKey="current" 
              fill="#a78bfa" 
              radius={[4, 4, 0, 0]} 
              name="Current" 
            />
            <Bar 
              key="target-bar"
              dataKey="target" 
              fill="#6d28d9" 
              radius={[4, 4, 0, 0]} 
              name="Target" 
            />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}

// Skills Breakdown Tab Component
function SkillsBreakdownTab({
  data,
  loading,
}: {
  data: SkillsBreakdownResponse["data"] | null;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  if (!data) {
    return (
      <Card className="card-bg">
        <p className="text-white/60">No data available</p>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Skills Radar Chart */}
      <Card className="card-bg">
        <h3 className="text-lg font-semibold text-white mb-1">Skills Radar</h3>
        <p className="text-sm text-white/60 mb-4">
          Visual breakdown of your capabilities
        </p>
        <ResponsiveContainer width="100%" height={400}>
          <RadarChart data={data.radarData || []}>
            <PolarGrid stroke="rgba(255,255,255,0.1)" />
            <PolarAngleAxis
              dataKey="skill"
              stroke="rgba(255,255,255,0.7)"
              style={{ fontSize: "12px" }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              stroke="rgba(255,255,255,0.3)"
            />
            <Radar
              name="Skills"
              dataKey="score"
              stroke="#a78bfa"
              fill="#a78bfa"
              fillOpacity={0.3}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(15, 16, 18, 0.95)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "8px",
                color: "#fff",
              }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </Card>

      {/* Skill Details */}
      <Card className="card-bg">
        <h3 className="text-lg font-semibold text-white mb-1">Skill Details</h3>
        <p className="text-sm text-white/60 mb-4">
          Individual skill scores and progress
        </p>
        <div className="space-y-4">
          {data.skillDetails.map((skill, index) => (
            <div key={`skill-${skill.skill}-${index}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-white font-medium">{skill.skill}</span>
                <span className="text-white/80">
                  {skill.score}/{skill.maxScore}
                </span>
              </div>
              <div className="w-full bg-white/5 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full transition-all duration-500"
                  style={{
                    width: `${(skill.score / skill.maxScore) * 100}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// Weak Areas Tab Component
function WeakAreasTab({
  data,
  loading,
}: {
  data: WeakAreasResponse["data"] | null;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className="card-bg">
        <p className="text-white/60">No weak areas identified</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-1">
          Areas Needing Attention
        </h3>
        <p className="text-sm text-white/60">
          Focus on these topics to improve faster
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.map((area, index) => (
          <Card key={`weak-area-${area.area}-${index}`} className="card-bg">
            <div className="space-y-4">
              <div>
                <h4 className="text-lg font-semibold text-white mb-1">
                  {area.area}
                </h4>
                <p className="text-sm text-white/60">
                  {area.practiceSessions} practice sessions
                </p>
              </div>

              <div className="w-full bg-white/5 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${area.progress}%` }}
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-purple-400">
                  Recommended: {area.recommendedSessions} more sessions
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-green-400">
                    +{area.improvement}%
                  </span>
                  <span className="text-sm text-orange-400">
                    {area.currentScore}/{area.maxScore}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Achievements Tab Component
function AchievementsTab({
  data,
  loading,
}: {
  data: AchievementsResponse["data"] | null;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className="card-bg">
        <p className="text-white/60">No achievements available</p>
      </Card>
    );
  }

  const unlocked = data.filter((a) => a.unlocked);
  const locked = data.filter((a) => !a.unlocked);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Unlocked Achievements */}
        {unlocked.map((achievement) => (
          <Card
            key={achievement.id}
            className="card-bg bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-purple-500/20">
                <Award className="w-6 h-6 text-purple-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-lg font-semibold text-white">
                    {achievement.title}
                  </h4>
                  <span className="text-xs text-green-400 font-medium">
                    Unlocked
                  </span>
                </div>
                <p className="text-sm text-white/60">
                  {achievement.description}
                </p>
              </div>
            </div>
          </Card>
        ))}

        {/* Locked Achievements */}
        {locked.map((achievement) => (
          <Card key={achievement.id} className="card-bg opacity-60">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-white/5">
                <Award className="w-6 h-6 text-white/40" />
              </div>
              <div className="flex-1">
                <h4 className="text-lg font-semibold text-white/60 mb-1">
                  {achievement.title}
                </h4>
                <p className="text-sm text-white/40">
                  {achievement.description}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
