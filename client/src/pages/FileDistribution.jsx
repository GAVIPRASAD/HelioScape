import React from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { API_BASE_URL } from "../constants";
import { useAuthStore } from "../store/useAuthStore";
import Loading from "@/components/ui/Loading";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatBytes } from "../lib/utils";

const FileDistribution = () => {
  const token = useAuthStore((state) => state.token);

  const { data: files, isLoading } = useQuery({
    queryKey: ["files", "all"],
    queryFn: async () => {
      const res = await axios.get(`${API_BASE_URL}/files?folderId=all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data.data.files;
    },
  });

  if (isLoading) return <Loading text="Loading file distribution..." />;

  const getProviderColor = (provider) => {
    if (!provider) return "bg-gray-500";
    if (provider.startsWith("google")) return "bg-blue-500";
    if (provider.startsWith("dropbox")) return "bg-indigo-500";
    if (provider.startsWith("mega")) return "bg-red-500";
    return "bg-gray-500";
  };

  const getProviderName = (provider) => {
    if (!provider) return "Unknown";
    if (provider.startsWith("google")) return "Google Drive";
    if (provider.startsWith("dropbox")) return "Dropbox";
    if (provider.startsWith("mega")) return "MEGA";
    return "Local";
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">File Distribution</h1>
      <Card>
        <CardHeader>
          <CardTitle>File Storage Map</CardTitle>
        </CardHeader>
        <CardContent>
          {files?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="h-20 w-20 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-4">
                <svg
                  className="h-10 w-10 text-slate-400 dark:text-slate-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
                No Files Distributed
              </h3>
              <p className="text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                Upload files to see how they are sharded across your cloud
                providers.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File Name</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead className="w-[50%]">Distribution</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {files?.map((file) => (
                  <TableRow key={file._id}>
                    <TableCell className="font-medium">{file.name}</TableCell>
                    <TableCell>{formatBytes(file.size)}</TableCell>
                    <TableCell>
                      <div className="flex h-4 w-full overflow-hidden rounded-full bg-secondary">
                        {file.chunks.map((chunk, i) => (
                          <div
                            key={i}
                            className={`h-full ${getProviderColor(
                              chunk.provider
                            )}`}
                            style={{
                              width: `${(chunk.size / file.size) * 100}%`,
                            }}
                            title={`${getProviderName(
                              chunk.provider
                            )}: ${formatBytes(chunk.size)}`}
                          />
                        ))}
                      </div>
                      <div className="flex gap-2 mt-1 text-xs text-muted-foreground flex-wrap">
                        {/* Legend/Summary for this file */}
                        {[...new Set(file.chunks.map((c) => c.provider))].map(
                          (p) => (
                            <span key={p} className="flex items-center gap-1">
                              <div
                                className={`w-2 h-2 rounded-full ${getProviderColor(
                                  p
                                )}`}
                              />
                              {getProviderName(p)}
                            </span>
                          )
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FileDistribution;
