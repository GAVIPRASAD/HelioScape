import React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { initiateOAuth, unlinkAccount } from "../services/authService";
import { useToast } from "@/components/ui/use-toast"; // Assuming shadcn toast
import { useUserQuery } from "../hooks/useUserQuery";
import { useQueryClient } from "@tanstack/react-query";
import Loading from "@/components/ui/Loading";

const Settings = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: user, isLoading, error } = useUserQuery();

  const handleLink = async (provider) => {
    try {
      const url = await initiateOAuth(provider);
      window.location.href = url;
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to initiate login.",
      });
    }
  };

  const handleUnlink = async (provider) => {
    try {
      await unlinkAccount(provider);
      toast({
        title: "Success",
        description: `Unlinked ${provider} successfully.`,
      });
      // Refetch user data to update UI
      queryClient.invalidateQueries(["user"]);
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to unlink account.",
      });
    }
  };

  if (isLoading) return <Loading text="Loading settings..." />;
  if (error)
    return (
      <div className="p-6 text-red-500">
        Error loading profile. Please log in.
      </div>
    );

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>Connected Accounts</CardTitle>
          <CardDescription>
            Manage your cloud storage providers.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Google Drive */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                G
              </div>
              <div>
                <p className="font-medium">Google Drive</p>
                <p className="text-sm text-muted-foreground">
                  {user?.linkedAccounts?.find((a) => a.provider === "google")
                    ? "Connected"
                    : "Not connected"}
                </p>
              </div>
            </div>
            {user?.linkedAccounts?.find((a) => a.provider === "google") ? (
              <Button variant="outline" onClick={() => handleUnlink("google")}>
                Unlink
              </Button>
            ) : (
              <Button onClick={() => handleLink("google")}>Connect</Button>
            )}
          </div>

          {/* Dropbox (Placeholder) */}
          <div className="flex items-center justify-between p-4 border rounded-lg opacity-50">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                D
              </div>
              <div>
                <p className="font-medium">Dropbox</p>
                <p className="text-sm text-muted-foreground">Coming Soon</p>
              </div>
            </div>
            <Button disabled>Connect</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;
