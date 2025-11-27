import React from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { API_BASE_URL } from "../constants";
import { useAuthStore } from "../store/useAuthStore";
import { useUserQuery } from "../hooks/useUserQuery";
import Loading from "@/components/ui/Loading";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { formatBytes } from "../lib/utils";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

// Simple SVG Logos
const ProviderLogo = ({ provider, className }) => {
  const p = provider.toLowerCase();
  if (p.includes("google")) {
    return (
      <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          fill="#4285F4"
        />
        <path
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          fill="#34A853"
        />
        <path
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.21.81-.63z"
          fill="#FBBC05"
        />
        <path
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          fill="#EA4335"
        />
      </svg>
    );
  }
  if (p.includes("dropbox")) {
    return (
      <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M7.06 1L2 6.55l5.06 4.22 5.06-4.22L7.06 1zM17.06 1l-5.06 5.55 5.06 4.22 5.06-4.22L17.06 1zM2 13.55l5.06 4.22 5.06-4.22-5.06-4.22L2 13.55zM17.06 9.33l-5.06 4.22 5.06 4.22 5.06-4.22-5.06-4.22zM7.06 17.77L12.12 22l5.06-4.23-5.06-3.71-5.06 3.71z"
          fill="#0061FF"
        />
      </svg>
    );
  }
  if (p.includes("mega")) {
    return (
      <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="12" cy="12" r="11" fill="#D9272E" />
        <path
          d="M12 13.5l-2.5-4h-2v7h2v-4l2.5 4 2.5-4v4h2v-7h-2l-2.5 4z"
          fill="white"
        />
      </svg>
    );
  }
  return <div className={`bg-gray-200 rounded-full ${className}`} />;
};

const AccountDistribution = () => {
  const token = useAuthStore((state) => state.token);
  const navigate = useNavigate();
  const { data: user, isLoading: isUserLoading } = useUserQuery();

  // Fetch calculated stats (our DB)
  const { data: stats, isLoading: isStatsLoading } = useQuery({
    queryKey: ["storage-stats"],
    queryFn: async () => {
      const res = await axios.get(`${API_BASE_URL}/files/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data.data.stats;
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 mins
  });

  // Fetch real-time quota (Cloud APIs)
  const { data: quotas, isLoading: isQuotaLoading } = useQuery({
    queryKey: ["quota"],
    queryFn: async () => {
      const res = await axios.get(`${API_BASE_URL}/providers/quota`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data.data.quotas;
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 mins
  });

  if (isUserLoading || isStatsLoading || isQuotaLoading)
    return <Loading text="Loading account distribution..." />;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Account Distribution</h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {user?.linkedAccounts?.map((account, index) => {
          // Determine if this is the first account of this provider type
          // We only assign "legacy" (unassigned) files to the first account to avoid double counting
          const isFirstOfProvider =
            user.linkedAccounts.findIndex(
              (a) => a.provider === account.provider
            ) === index;

          const specificUsage =
            stats?.[`${account.provider}-${account.providerId}`] || 0;
          const legacyUsage = isFirstOfProvider
            ? stats?.[account.provider] || 0
            : 0;

          const calculatedUsage = specificUsage + legacyUsage;

          // Find fresh quota data
          const freshQuota = quotas?.find(
            (q) =>
              q.provider === account.provider &&
              (q.providerId === account.providerId || q.email === account.email)
          );

          // Prefer fresh quota, fallback to account data, fallback to 0
          const cloudUsed = freshQuota?.used || account.storageQuota?.used || 0;
          const total = freshQuota?.total || account.storageQuota?.total || 0;

          // HelioScape Usage (Our DB)
          const helioUsed = calculatedUsage;

          // Cloud Usage (Real World) - Fallback to helio usage if cloud reports 0
          const realCloudUsed = cloudUsed > 0 ? cloudUsed : helioUsed;
          const percent = total > 0 ? (realCloudUsed / total) * 100 : 0;

          // Provider styling
          const getProviderStyle = (p) => {
            const lower = p.toLowerCase();
            if (lower.includes("google"))
              return {
                color: "text-blue-500",
                bg: "bg-blue-500/10",
                border: "hover:border-blue-500/50",
              };
            if (lower.includes("dropbox"))
              return {
                color: "text-indigo-500",
                bg: "bg-indigo-500/10",
                border: "hover:border-indigo-500/50",
              };
            if (lower.includes("mega"))
              return {
                color: "text-red-500",
                bg: "bg-red-500/10",
                border: "hover:border-red-500/50",
              };
            return {
              color: "text-zinc-500",
              bg: "bg-zinc-500/10",
              border: "hover:border-zinc-500/50",
            };
          };

          const style = getProviderStyle(account.provider);

          return (
            <Card
              key={account._id}
              className={`flex flex-col transition-all duration-300 ${style.border} hover:shadow-md`}
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-xl ${style.bg} flex items-center justify-center`}
                    >
                      <ProviderLogo
                        provider={account.provider}
                        className="w-8 h-8"
                      />
                    </div>
                    <div>
                      <CardTitle
                        className={`text-lg font-bold capitalize ${style.color}`}
                      >
                        {account.provider}
                      </CardTitle>
                      <CardDescription
                        className="text-xs mt-1 truncate max-w-[180px]"
                        title={account.email}
                      >
                        {account.email}
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-end pt-4">
                <div className="mb-6">
                  <span className="text-3xl font-bold tracking-tight">
                    {formatBytes(helioUsed)}
                  </span>
                  <span className="text-sm text-muted-foreground ml-2">
                    used by HelioScape
                  </span>
                </div>

                {total > 0 ? (
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Cloud Storage</span>
                      <span>
                        {formatBytes(realCloudUsed)} / {formatBytes(total)}
                      </span>
                    </div>
                    <Progress
                      value={percent}
                      className="h-1.5"
                      indicatorClassName={style.bg.replace("/10", "")}
                    />
                  </div>
                ) : (
                  <div className="mb-4 text-xs text-muted-foreground flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-green-500"></div>
                    <span>Storage quota not reported</span>
                  </div>
                )}

                <Button
                  variant="outline"
                  className="w-full mt-auto group hover:bg-slate-100 dark:hover:bg-slate-800"
                  onClick={() =>
                    navigate(
                      `/distribution/accounts/${account.provider}/${account.providerId}`
                    )
                  }
                >
                  View Files
                  <ArrowRight className="w-4 h-4 ml-2 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default AccountDistribution;
