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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { DialogFooter } from "@/components/ui/dialog";
import axios from "axios";
import { API_BASE_URL } from "../constants";
import { useAuthStore } from "../store/useAuthStore";

const Settings = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: user, isLoading, error } = useUserQuery();
  const [searchParams, setSearchParams] = useSearchParams();
  const token = useAuthStore((state) => state.token);

  const [isRedundancyDialogOpen, setIsRedundancyDialogOpen] =
    React.useState(false);
  const [isAgreed, setIsAgreed] = React.useState(false);

  const updatePreferences = async (enabled) => {
    try {
      await axios.patch(
        `${API_BASE_URL}/users/updateMe`,
        {
          preferences: {
            highRedundancyEnabled: enabled,
            highRedundancyAgreedAt: enabled
              ? new Date()
              : user?.preferences?.highRedundancyAgreedAt,
          },
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast({
        title: enabled ? "High Redundancy Enabled" : "High Redundancy Disabled",
        description: enabled
          ? "Your files will now be protected with parity data."
          : "Standard storage mode active.",
      });

      queryClient.invalidateQueries(["user"]);
    } catch (err) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update preferences.",
      });
    }
  };

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
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Settings</h1>
        <Button
          variant="outline"
          onClick={async () => {
            try {
              await axios.patch(
                `${API_BASE_URL}/users/updateMe`,
                {
                  preferences: {
                    ...user.preferences,
                    tourCompleted: false,
                  },
                },
                {
                  headers: { Authorization: `Bearer ${token}` },
                }
              );
              toast({
                title: "Tour Reset",
                description:
                  "The tour will restart on your next visit to the dashboard.",
              });
              // Redirect to dashboard to start tour immediately
              window.location.href = "/dashboard";
            } catch (err) {
              toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to reset tour.",
              });
            }
          }}
        >
          Reset Tour
        </Button>
      </div>

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
                  className="flex items-center justify-between p-3 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-md"
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
                  className="flex items-center justify-between p-3 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-md"
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
                  className="flex items-center justify-between p-3 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-md"
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

      {/* Storage Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Storage Preferences</CardTitle>
          <CardDescription>
            Configure how your files are stored across providers.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-0.5">
              <Label className="text-base font-medium">
                High Redundancy Storage (Parity)
              </Label>
              <p className="text-sm text-muted-foreground">
                Enable RAID 5 erasure coding (XOR Parity) to recover files even
                if a provider goes offline.
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full dark:bg-yellow-900 dark:text-yellow-200">
                  Uses +25% Storage
                </span>
                {user?.preferences?.highRedundancyEnabled && (
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full dark:bg-green-900 dark:text-green-200">
                    Active
                  </span>
                )}
              </div>
            </div>
            <Switch
              checked={user?.preferences?.highRedundancyEnabled || false}
              onCheckedChange={(checked) => {
                if (checked) {
                  setIsRedundancyDialogOpen(true);
                } else {
                  // Allow disabling without confirmation for now
                  updatePreferences(false);
                }
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* High Redundancy T&C Dialog */}
      <Dialog
        open={isRedundancyDialogOpen}
        onOpenChange={setIsRedundancyDialogOpen}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Enable High Redundancy?</DialogTitle>
            <DialogDescription>
              Please review the terms before enabling this feature.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-md text-sm space-y-3">
              <p className="font-semibold text-slate-900 dark:text-white">
                Benefits:
              </p>
              <ul className="list-disc pl-4 space-y-1 text-slate-600 dark:text-slate-400">
                <li>
                  **Data Recovery**: Your files can be reconstructed even if one
                  cloud provider fails or deletes your data.
                </li>
                <li>**Integrity**: Protects against bit-rot and corruption.</li>
              </ul>
              <p className="font-semibold text-slate-900 dark:text-white mt-4">
                Risks & Costs:
              </p>
              <ul className="list-disc pl-4 space-y-1 text-slate-600 dark:text-slate-400">
                <li>
                  **Increased Storage**: This feature requires **25% more
                  storage space**. A 1GB file will consume 1.25GB of your quota.
                </li>
                <li>
                  **Slower Uploads**: Encoding parity data takes extra CPU time
                  and bandwidth.
                </li>
              </ul>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="terms"
                checked={isAgreed}
                onCheckedChange={setIsAgreed}
              />
              <label
                htmlFor="terms"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                I understand the storage costs and agree to enable High
                Redundancy.
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsRedundancyDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                updatePreferences(true);
                setIsRedundancyDialogOpen(false);
              }}
              disabled={!isAgreed}
            >
              Enable Feature
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Settings;
