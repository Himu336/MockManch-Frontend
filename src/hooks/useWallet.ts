"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getWallet,
  getPlans,
  getTransactions,
  purchaseTokens,
  type WalletResponse,
  type SubscriptionPlan,
  type WalletTransaction,
  type PurchaseTokensRequest,
} from "@/lib/api";

export function useWallet() {
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<WalletTransaction[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);

  const fetchWallet = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getWallet();
      if (response.success && response.data) {
        setBalance(response.data.balance);
        setRecentTransactions(response.data.recentTransactions);
      } else {
        setError(response.error || "Failed to fetch wallet");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch wallet");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPlans = useCallback(async () => {
    try {
      const response = await getPlans();
      if (response.success && response.data) {
        setPlans(response.data);
      }
    } catch (err) {
      console.error("Failed to fetch plans:", err);
    }
  }, []);

  const fetchTransactions = useCallback(async (limit: number = 100) => {
    try {
      const response = await getTransactions(limit);
      if (response.success && response.data) {
        setTransactions(response.data);
      }
    } catch (err) {
      console.error("Failed to fetch transactions:", err);
    }
  }, []);

  const handlePurchase = useCallback(
    async (data: PurchaseTokensRequest) => {
      try {
        setError(null);
        const response = await purchaseTokens(data);
        if (response.success && response.data) {
          setBalance(response.data.newBalance);
          // Refresh wallet data
          await fetchWallet();
          return { success: true };
        } else {
          const errorMsg = response.error || "Purchase failed";
          setError(errorMsg);
          return { success: false, error: errorMsg };
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Purchase failed";
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }
    },
    [fetchWallet]
  );

  useEffect(() => {
    fetchWallet();
    fetchPlans();
  }, [fetchWallet, fetchPlans]);

  return {
    balance,
    loading,
    error,
    recentTransactions,
    plans,
    transactions,
    fetchWallet,
    fetchPlans,
    fetchTransactions,
    handlePurchase,
  };
}

