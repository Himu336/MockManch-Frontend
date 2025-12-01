"use client";

import React, { useState } from "react";
import Card from "../../../components/ui/Card";
import Button from "../../../components/ui/Button";
import PageHeader from "../../../components/ui/PageHeader";
import { useWallet } from "@/hooks/useWallet";
import {
  Coins,
  CreditCard,
  Check,
  Loader2,
  AlertCircle,
  RefreshCw,
  TrendingUp,
  Clock,
  Calendar,
  Sparkles,
} from "lucide-react";
import clsx from "clsx";

export default function BillingPage() {
  const {
    balance,
    loading,
    error,
    recentTransactions,
    plans,
    transactions,
    fetchWallet,
    fetchTransactions,
    handlePurchase,
  } = useWallet();

  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [purchasing, setPurchasing] = useState(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [showTransactions, setShowTransactions] = useState(false);
  const [showComingSoon, setShowComingSoon] = useState(false);

  // Load full transaction history when user clicks to view
  React.useEffect(() => {
    if (showTransactions && transactions.length === 0) {
      fetchTransactions(100);
    }
  }, [showTransactions, transactions.length, fetchTransactions]);

  const handlePlanSelect = async (planId: string) => {
    setSelectedPlan(planId);
    setPurchaseError(null);
    setShowComingSoon(true);
    
    // Auto-hide the message after 5 seconds
    setTimeout(() => {
      setShowComingSoon(false);
      setSelectedPlan(null);
    }, 5000);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return formatDate(dateString);
  };

  const displayTransactions = showTransactions ? transactions : recentTransactions;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Billing & Subscriptions"
        subtitle="Manage your tokens and subscription plans"
      />

      {/* Error Banner */}
      {error && (
        <Card className="p-4 bg-red-500/10 border-red-500/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <div>
                <p className="text-red-400 font-medium text-sm">Error loading wallet</p>
                <p className="text-red-400/60 text-xs">{error}</p>
              </div>
            </div>
            <Button
              onClick={() => fetchWallet()}
              className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border-red-500/30"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        </Card>
      )}

      {/* Purchase Error */}
      {purchaseError && (
        <Card className="p-4 bg-red-500/10 border-red-500/30">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <p className="text-red-400 text-sm">{purchaseError}</p>
          </div>
        </Card>
      )}

      {/* Coming Soon Message */}
      {showComingSoon && (
        <Card className="p-4 bg-blue-500/10 border-blue-500/30">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-400" />
            <p className="text-blue-400 text-sm">
              Buying more credits will be available soon. Stay tuned!
            </p>
          </div>
        </Card>
      )}

      {/* Token Balance Card */}
      <Card className="relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-ui/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-white mb-1">Token Balance</h2>
              <p className="text-sm text-white/60">
                Use tokens to access premium features
              </p>
            </div>
            {loading ? (
              <Loader2 className="w-5 h-5 text-white/60 animate-spin" />
            ) : (
              <div className="flex items-center gap-2 bg-primary-ui/20 px-4 py-2 rounded-lg border border-primary-ui/30">
                <Coins className="w-5 h-5 text-primary-soft" />
                <span className="text-2xl font-bold text-white">{balance}</span>
                <span className="text-sm text-white/60">tokens</span>
              </div>
            )}
          </div>

          {/* Service Costs Info */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4 border-t border-white/10">
            <div className="text-center">
              <p className="text-xs text-white/60 mb-1">AI Chat</p>
              <p className="text-sm font-semibold text-white">1 token</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-white/60 mb-1">Text Interview</p>
              <p className="text-sm font-semibold text-white">5 tokens</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-white/60 mb-1">Voice Interview</p>
              <p className="text-sm font-semibold text-white">10 tokens</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-white/60 mb-1">Group Practice</p>
              <p className="text-sm font-semibold text-white">3 tokens</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Subscription Plans */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-4">Available Plans</h2>
        {loading && plans.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Card key={index} className="animate-pulse">
                <div className="h-4 bg-white/10 rounded w-3/4 mb-4"></div>
                <div className="h-8 bg-white/10 rounded w-1/2 mb-4"></div>
                <div className="h-3 bg-white/10 rounded w-full mb-2"></div>
                <div className="h-10 bg-white/10 rounded w-full"></div>
              </Card>
            ))}
          </div>
        ) : plans.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {plans.map((plan) => {
              const isSelected = selectedPlan === plan.planId;
              const isPurchasing = purchasing && isSelected;
              const isFree = parseFloat(plan.price) === 0;

              return (
                <Card
                  key={plan.planId}
                  className={clsx(
                    "relative overflow-hidden transition-all duration-200",
                    isSelected && "ring-2 ring-primary-ui",
                    !isFree && "hover:border-primary-ui/50"
                  )}
                >
                  {plan.isRecurring && (
                    <div className="absolute top-3 right-3">
                      <div className="bg-primary-ui/20 text-primary-soft px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        Recurring
                      </div>
                    </div>
                  )}

                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-white mb-2">
                      {plan.name}
                    </h3>
                    <div className="flex items-baseline gap-2 mb-3">
                      <span className="text-3xl font-bold text-white">
                        ${plan.price}
                      </span>
                      {plan.isRecurring && plan.durationDays > 0 && (
                        <span className="text-sm text-white/60">
                          /{plan.durationDays} days
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-white/80">
                      <Coins className="w-4 h-4 text-primary-soft" />
                      <span className="font-medium">{plan.tokens} tokens</span>
                    </div>
                  </div>

                  {plan.durationDays > 0 && !plan.isRecurring && (
                    <div className="mb-4 flex items-center gap-2 text-sm text-white/60">
                      <Clock className="w-4 h-4" />
                      <span>Valid for {plan.durationDays} days</span>
                    </div>
                  )}

                  {plan.isRecurring && (
                    <div className="mb-4 flex items-center gap-2 text-sm text-white/60">
                      <Calendar className="w-4 h-4" />
                      <span>Auto-renewal every {plan.durationDays} days</span>
                    </div>
                  )}

                  <Button
                    onClick={() => handlePlanSelect(plan.planId)}
                    disabled={isPurchasing || purchasing || showComingSoon}
                    className={clsx(
                      "w-full",
                      isFree && "bg-white/10 hover:bg-white/20"
                    )}
                    variant={isFree ? "outline" : "default"}
                  >
                    {isPurchasing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : isFree ? (
                      "Get Started"
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4 mr-2" />
                        Purchase
                      </>
                    )}
                  </Button>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <p className="text-white/60 text-sm text-center py-8">
              No plans available
            </p>
          </Card>
        )}
      </div>

      {/* Transaction History */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-white mb-1">
              Transaction History
            </h2>
            <p className="text-sm text-white/60">
              {showTransactions
                ? "Complete transaction history"
                : "Recent transactions"}
            </p>
          </div>
          <Button
            onClick={() => setShowTransactions(!showTransactions)}
            variant="ghost"
            size="sm"
          >
            {showTransactions ? "Show Less" : "View All"}
          </Button>
        </div>

        {loading && displayTransactions.length === 0 ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="h-4 bg-white/10 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-white/10 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : displayTransactions.length > 0 ? (
          <div className="space-y-4">
            {displayTransactions.map((transaction) => {
              const isCredit = transaction.type === "credit";
              return (
                <div
                  key={transaction.transactionId}
                  className="flex items-center justify-between pb-4 border-b border-white/10 last:border-0 last:pb-0"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {isCredit ? (
                        <TrendingUp className="w-4 h-4 text-green-400" />
                      ) : (
                        <Coins className="w-4 h-4 text-red-400" />
                      )}
                      <p className="text-white font-medium text-sm">
                        {transaction.reason}
                      </p>
                    </div>
                    <p className="text-white/60 text-xs">
                      {formatRelativeTime(transaction.createdAt)}
                    </p>
                  </div>
                  <div
                    className={clsx(
                      "px-3 py-1 rounded-full text-sm font-semibold",
                      isCredit
                        ? "bg-green-500/20 text-green-400"
                        : "bg-red-500/20 text-red-400"
                    )}
                  >
                    {isCredit ? "+" : "-"}
                    {Math.abs(transaction.changeAmount)} tokens
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-white/60 text-sm">No transactions yet</p>
            <p className="text-white/40 text-xs mt-1">
              Your transaction history will appear here
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}

