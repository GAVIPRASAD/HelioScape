import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";
import axios from "axios";
import { API_BASE_URL } from "../constants";
import { useAuthStore } from "../store/useAuthStore";
import { useUserQuery } from "../hooks/useUserQuery";
import Loading from "@/components/ui/Loading";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { formatBytes } from "../lib/utils";
import { ArrowLeft, Loader2 } from "lucide-react";

const AccountDetails = () => {
  const { provider, providerId } = useParams();
  const navigate = useNavigate();
  const token = useAuthStore((state) => state.token);
  const { ref, inView } = useInView();
  const limit = 20;

  const { data: user } = useUserQuery(); // Need user to check if first account

  // Construct the target ID string
  const targetId = `${provider}-${providerId}`;

  // Determine if we should include legacy files (only for first account of this provider)
  const includeLegacy = React.useMemo(() => {
    if (!user?.linkedAccounts) return false;
    const index = user.linkedAccounts.findIndex(
      (a) => a.provider === provider && a.providerId === providerId
    );
    const firstIndex = user.linkedAccounts.findIndex(
      (a) => a.provider === provider
    );
    return index === firstIndex && index !== -1;
  }, [user, provider, providerId]);

  // Query param: "google-123" OR "google-123,google"
  const queryProviderParam = includeLegacy
    ? `${targetId},${provider}`
    : targetId;

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteQuery({
    queryKey: ["account-files", queryProviderParam], // Include param in key
    queryFn: async ({ pageParam = 1 }) => {
      const res = await axios.get(`${API_BASE_URL}/files`, {
        params: {
          provider: queryProviderParam,
          page: pageParam,
          limit,
          folderId: "all",
        },
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
    enabled: !!user, // Wait for user data
    getNextPageParam: (lastPage) => {
      if (lastPage.page < lastPage.pages) return lastPage.page + 1;
      return undefined;
    },
  });

  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, fetchNextPage]);

  if (isLoading) return <Loading text="Loading account files..." />;
  if (isError)
    return <div className="p-6 text-red-500">Error loading files.</div>;

  const allFiles = data?.pages.flatMap((page) => page.data.files) || [];
  const totalFiles = data?.pages[0]?.total || 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/distribution/accounts")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold capitalize">{provider} Account</h1>
          <p className="text-muted-foreground text-sm">ID: {providerId}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Stored Files ({totalFiles})</CardTitle>
          <CardDescription>
            Files stored in this specific cloud account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>File Name</TableHead>
                <TableHead>Total Size</TableHead>
                <TableHead>Stored Here</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allFiles.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No files found in this account.
                  </TableCell>
                </TableRow>
              ) : (
                allFiles.map((file) => {
                  // Calculate size stored in THIS account
                  const sizeInAccount = file.chunks
                    .filter(
                      (c) =>
                        c.provider === targetId ||
                        (includeLegacy && c.provider === provider)
                    )
                    .reduce((acc, c) => acc + c.size, 0);

                  return (
                    <TableRow key={file._id}>
                      <TableCell className="font-medium">{file.name}</TableCell>
                      <TableCell>{formatBytes(file.size)}</TableCell>
                      <TableCell className="text-blue-600 font-semibold">
                        {formatBytes(sizeInAccount)}
                      </TableCell>
                      <TableCell>
                        {new Date(file.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>

          {/* Infinite Scroll Sentinel */}
          <div ref={ref} className="py-4 flex justify-center w-full">
            {isFetchingNextPage && (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            )}
            {!hasNextPage && allFiles.length > 0 && (
              <span className="text-xs text-muted-foreground">End of list</span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AccountDetails;
