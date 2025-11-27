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

  const handleUnlink = async (provider, providerId) => {
    try {
      await unlinkAccount(provider, providerId);
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
          {/* Google Drive */}
          <div className="p-4 border rounded-lg space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                  G
                </div>
                <div>
                  <p className="font-medium">Google Drive</p>
                  <p className="text-sm text-muted-foreground">
                    Link multiple accounts for more storage.
                  </p>
                </div>
              </div>
              <Button onClick={() => handleLink("google")}>Add Account</Button>
            </div>

            {/* List Linked Accounts */}
            {user?.linkedAccounts
              ?.filter((a) => a.provider === "google")
              .map((account) => (
                <div
                  key={account.providerId}
                  className="flex items-center justify-between p-3 bg-secondary/20 rounded-md"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-sm font-medium">
                      {account.email || "Linked Account"}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleUnlink("google", account.providerId)}
                  >
                    Unlink
                  </Button>
                </div>
              ))}
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
