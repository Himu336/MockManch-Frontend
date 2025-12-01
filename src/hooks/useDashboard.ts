"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  getDashboard,
  getDashboardSummary,
  getDashboardGoals,
  getDashboardRecentActivity,
  getDashboardAreasToImprove,
  type DashboardData,
  type DashboardSummary,
  type DashboardGoal,
  type DashboardRecentActivity,
  type DashboardAreaToImprove,
} from "@/lib/api";

type UseDashboardOptions = {
  userId: string;
  /**
   * If true, fetches all sections in parallel for better performance
   * If false, fetches complete dashboard in one request
   * @default true
   */
  parallel?: boolean;
  /**
   * Auto-refetch interval in milliseconds. Set to 0 to disable.
   * @default 0 (disabled)
   */
  refetchInterval?: number;
  /**
   * Enable caching to prevent unnecessary refetches
   * @default true
   */
  enableCache?: boolean;
};

type UseDashboardReturn = {
  // Data
  data: DashboardData | null;
  summary: DashboardSummary | null;
  goals: DashboardGoal[];
  recentActivity: DashboardRecentActivity[];
  areasToImprove: DashboardAreaToImprove[];
  
  // Loading states
  isLoading: boolean;
  isLoadingSummary: boolean;
  isLoadingGoals: boolean;
  isLoadingActivity: boolean;
  isLoadingAreas: boolean;
  
  // Error states
  error: string | null;
  errorSummary: string | null;
  errorGoals: string | null;
  errorActivity: string | null;
  errorAreas: string | null;
  
  // Actions
  refetch: () => Promise<void>;
  refetchSummary: () => Promise<void>;
  refetchGoals: () => Promise<void>;
  refetchActivity: () => Promise<void>;
  refetchAreas: () => Promise<void>;
};

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const DEFAULT_USER_ID = "user123"; // TODO: Replace with actual auth context

/**
 * Custom hook for fetching and managing dashboard data
 * Optimized with parallel fetching, caching, and error handling
 */
export function useDashboard(options: UseDashboardOptions): UseDashboardReturn {
  const {
    userId = DEFAULT_USER_ID,
    parallel = true,
    refetchInterval = 0,
    enableCache = true,
  } = options;

  // State for complete dashboard (single request mode)
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for parallel fetching mode
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [goals, setGoals] = useState<DashboardGoal[]>([]);
  const [recentActivity, setRecentActivity] = useState<DashboardRecentActivity[]>([]);
  const [areasToImprove, setAreasToImprove] = useState<DashboardAreaToImprove[]>([]);

  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [isLoadingGoals, setIsLoadingGoals] = useState(false);
  const [isLoadingActivity, setIsLoadingActivity] = useState(false);
  const [isLoadingAreas, setIsLoadingAreas] = useState(false);

  const [errorSummary, setErrorSummary] = useState<string | null>(null);
  const [errorGoals, setErrorGoals] = useState<string | null>(null);
  const [errorActivity, setErrorActivity] = useState<string | null>(null);
  const [errorAreas, setErrorAreas] = useState<string | null>(null);

  // Cache management
  const cacheRef = useRef<{
    data: DashboardData | null;
    summary: DashboardSummary | null;
    goals: DashboardGoal[];
    recentActivity: DashboardRecentActivity[];
    areasToImprove: DashboardAreaToImprove[];
    timestamp: number;
  }>({
    data: null,
    summary: null,
    goals: [],
    recentActivity: [],
    areasToImprove: [],
    timestamp: 0,
  });

  // Check if cache is valid
  const isCacheValid = useCallback(() => {
    if (!enableCache) return false;
    const now = Date.now();
    return now - cacheRef.current.timestamp < CACHE_DURATION;
  }, [enableCache]);

  // Fetch complete dashboard
  const fetchDashboard = useCallback(async () => {
    if (isCacheValid() && cacheRef.current.data) {
      setData(cacheRef.current.data);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await getDashboard(userId);
      if (response.success && response.data) {
        setData(response.data);
        cacheRef.current.data = response.data;
        cacheRef.current.timestamp = Date.now();
      } else {
        throw new Error(response.error || "Failed to fetch dashboard");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      console.error("Error fetching dashboard:", err);
    } finally {
      setIsLoading(false);
    }
  }, [userId, isCacheValid]);

  // Fetch summary
  const fetchSummary = useCallback(async () => {
    if (isCacheValid() && cacheRef.current.summary) {
      setSummary(cacheRef.current.summary);
      return;
    }

    setIsLoadingSummary(true);
    setErrorSummary(null);

    try {
      const response = await getDashboardSummary(userId);
      if (response.success && response.data) {
        setSummary(response.data);
        cacheRef.current.summary = response.data;
        cacheRef.current.timestamp = Date.now();
      } else {
        throw new Error(response.error || "Failed to fetch summary");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setErrorSummary(errorMessage);
      console.error("Error fetching summary:", err);
    } finally {
      setIsLoadingSummary(false);
    }
  }, [userId, isCacheValid]);

  // Fetch goals
  const fetchGoals = useCallback(async () => {
    if (isCacheValid() && cacheRef.current.goals.length > 0) {
      setGoals(cacheRef.current.goals);
      return;
    }

    setIsLoadingGoals(true);
    setErrorGoals(null);

    try {
      const response = await getDashboardGoals(userId);
      if (response.success && response.data) {
        setGoals(response.data);
        cacheRef.current.goals = response.data;
        cacheRef.current.timestamp = Date.now();
      } else {
        throw new Error(response.error || "Failed to fetch goals");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setErrorGoals(errorMessage);
      console.error("Error fetching goals:", err);
    } finally {
      setIsLoadingGoals(false);
    }
  }, [userId, isCacheValid]);

  // Fetch recent activity
  const fetchActivity = useCallback(async () => {
    if (isCacheValid() && cacheRef.current.recentActivity.length > 0) {
      setRecentActivity(cacheRef.current.recentActivity);
      return;
    }

    setIsLoadingActivity(true);
    setErrorActivity(null);

    try {
      const response = await getDashboardRecentActivity(userId);
      if (response.success && response.data) {
        setRecentActivity(response.data);
        cacheRef.current.recentActivity = response.data;
        cacheRef.current.timestamp = Date.now();
      } else {
        throw new Error(response.error || "Failed to fetch recent activity");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setErrorActivity(errorMessage);
      console.error("Error fetching recent activity:", err);
    } finally {
      setIsLoadingActivity(false);
    }
  }, [userId, isCacheValid]);

  // Fetch areas to improve
  const fetchAreas = useCallback(async () => {
    if (isCacheValid() && cacheRef.current.areasToImprove.length > 0) {
      setAreasToImprove(cacheRef.current.areasToImprove);
      return;
    }

    setIsLoadingAreas(true);
    setErrorAreas(null);

    try {
      const response = await getDashboardAreasToImprove(userId);
      if (response.success && response.data) {
        setAreasToImprove(response.data);
        cacheRef.current.areasToImprove = response.data;
        cacheRef.current.timestamp = Date.now();
      } else {
        throw new Error(response.error || "Failed to fetch areas to improve");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setErrorAreas(errorMessage);
      console.error("Error fetching areas to improve:", err);
    } finally {
      setIsLoadingAreas(false);
    }
  }, [userId, isCacheValid]);

  // Refetch all (clears cache)
  const refetch = useCallback(async () => {
    cacheRef.current.timestamp = 0; // Invalidate cache
    if (parallel) {
      await Promise.all([
        fetchSummary(),
        fetchGoals(),
        fetchActivity(),
        fetchAreas(),
      ]);
    } else {
      await fetchDashboard();
    }
  }, [parallel, fetchDashboard, fetchSummary, fetchGoals, fetchActivity, fetchAreas]);

  // Initial fetch
  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    if (parallel) {
      // Fetch all sections in parallel for better performance
      Promise.all([
        fetchSummary(),
        fetchGoals(),
        fetchActivity(),
        fetchAreas(),
      ]).then(() => {
        setIsLoading(false);
      });
    } else {
      fetchDashboard();
    }
  }, [userId, parallel, fetchDashboard, fetchSummary, fetchGoals, fetchActivity, fetchAreas]);

  // Auto-refetch interval
  useEffect(() => {
    if (refetchInterval > 0) {
      const interval = setInterval(() => {
        refetch();
      }, refetchInterval);

      return () => clearInterval(interval);
    }
  }, [refetchInterval, refetch]);

  // Compute derived data from parallel mode
  const computedData: DashboardData | null = parallel
    ? summary
      ? {
          summary,
          goals,
          recentActivity,
          areasToImprove,
        }
      : null
    : data;

  return {
    // Data
    data: computedData,
    summary: parallel ? summary : data?.summary || null,
    goals: parallel ? goals : data?.goals || [],
    recentActivity: parallel ? recentActivity : data?.recentActivity || [],
    areasToImprove: parallel ? areasToImprove : data?.areasToImprove || [],

    // Loading states
    isLoading: parallel
      ? isLoadingSummary || isLoadingGoals || isLoadingActivity || isLoadingAreas
      : isLoading,
    isLoadingSummary,
    isLoadingGoals,
    isLoadingActivity,
    isLoadingAreas,

    // Error states
    error: parallel ? errorSummary || errorGoals || errorActivity || errorAreas : error,
    errorSummary,
    errorGoals,
    errorActivity,
    errorAreas,

    // Actions
    refetch,
    refetchSummary: () => {
      cacheRef.current.summary = null;
      return fetchSummary();
    },
    refetchGoals: () => {
      cacheRef.current.goals = [];
      return fetchGoals();
    },
    refetchActivity: () => {
      cacheRef.current.recentActivity = [];
      return fetchActivity();
    },
    refetchAreas: () => {
      cacheRef.current.areasToImprove = [];
      return fetchAreas();
    },
  };
}

