import React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { initiateOAuth, unlinkAccount } from "../services/authService";
import { useToast } from "@/components/ui/use-toast"; // Assuming shadcn toast
import { useUserQuery } from "../hooks/useUserQuery";
import { useQueryClient } from "@tanstack/react-query";
import Loading from "@/components/ui/Loading";
import { useSearchParams } from "react-router-dom";

import MegaConnectDialog from "../components/MegaConnectDialog";

const Settings = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: user, isLoading, error } = useUserQuery();
  const [searchParams, setSearchParams] = useSearchParams();

  console.log("Settings Render - User Data:", user);
  if (user?.linkedAccounts) {
    console.log("Linked Accounts:", user.linkedAccounts);
  }

  React.useEffect(() => {
    const status = searchParams.get("status");
    const message = searchParams.get("message");
    const provider = searchParams.get("provider");

    if (status === "success") {
      toast({
        title: "Account Linked",
        description: `${provider || "Provider"} account linked successfully.`,
      });
      // Clear params
      setSearchParams({});
      // Refetch user to show new link
      queryClient.invalidateQueries(["user"]);
      queryClient.resetQueries(["quota"]);
    } else if (status === "error") {
      toast({
        variant: "destructive",
        title: "Linking Failed",
        description: message || "Failed to link account.",
      });
      setSearchParams({});
    }
  }, [searchParams, setSearchParams, toast, queryClient]);

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

  const [accountToUnlink, setAccountToUnlink] = React.useState(null);
  const [isUnlinkDialogOpen, setIsUnlinkDialogOpen] = React.useState(false);

  const confirmUnlink = async () => {
    if (!accountToUnlink) return;

    try {
      await unlinkAccount(accountToUnlink.provider, accountToUnlink._id);
      toast({
        title: "Success",
        description: `Unlinked ${accountToUnlink.provider} successfully.`,
      });
      // Refetch user data to update UI
      queryClient.invalidateQueries(["user"]);
      await queryClient.resetQueries(["quota"]);
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error.response?.data?.message || "Failed to unlink account.",
      });
    } finally {
      setIsUnlinkDialogOpen(false);
      setAccountToUnlink(null);
    }
  };

  const handleUnlinkClick = (account) => {
    setAccountToUnlink(account);
    setIsUnlinkDialogOpen(true);
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

      <Dialog open={isUnlinkDialogOpen} onOpenChange={setIsUnlinkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unlink Account</DialogTitle>
            <DialogDescription>
              Are you sure you want to unlink this account?
              <br />
              <br />
              <span className="font-bold text-destructive">Warning:</span> If
              you have files stored on this account, you must delete them first.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-4">
            <Button
              variant="outline"
              onClick={() => setIsUnlinkDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmUnlink}>
              Unlink
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>Connected Accounts</CardTitle>
          <CardDescription>
            Manage your cloud storage providers.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
                    onClick={() => handleUnlinkClick(account)}
                  >
                    Unlink
                  </Button>
                </div>
              ))}
          </div>

          {/* Dropbox */}
          <div className="p-4 border rounded-lg space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                  D
                </div>
                <div>
                  <p className="font-medium">Dropbox</p>
                  <p className="text-sm text-muted-foreground">
                    Link multiple accounts for more storage.
                  </p>
                </div>
              </div>
              <Button onClick={() => handleLink("dropbox")}>Add Account</Button>
            </div>

            {/* List Linked Accounts */}
            {user?.linkedAccounts
              ?.filter((a) => a.provider === "dropbox")
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
                    onClick={() => handleUnlinkClick(account)}
                  >
                    Unlink
                  </Button>
                </div>
              ))}
          </div>

          {/* MEGA */}
          <div className="p-4 border rounded-lg space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center text-red-600 font-bold">
                  M
                </div>
                <div>
                  <p className="font-medium">MEGA</p>
                  <p className="text-sm text-muted-foreground">
                    End-to-end encrypted storage.
                  </p>
                </div>
              </div>

              <MegaConnectDialog
                onSuccess={() => queryClient.invalidateQueries(["user"])}
              />
            </div>

            {/* List Linked Accounts */}
            {user?.linkedAccounts
              ?.filter((a) => a.provider === "mega")
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
                    onClick={() => handleUnlinkClick(account)}
                  >
                    Unlink
                  </Button>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;
