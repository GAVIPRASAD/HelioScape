import React, { useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import {
  User,
  Mail,
  Shield,
  Activity,
  HardDrive,
  Edit,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import axios from "axios";
import { API_BASE_URL as API_URL } from "@/constants";

const ProfilePage = () => {
  const { user, token, updateUser } = useAuthStore();
  const { toast } = useToast();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Form State
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (name !== user.name || email !== user.email) {
        const res = await axios.patch(
          `${API_URL}/users/updateMe`,
          { name, email },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        updateUser({
          ...user,
          name: res.data.data.user.name,
          email: res.data.data.user.email,
        });
        toast({
          title: "Profile Updated",
          description: "Your profile has been updated successfully.",
          variant: "default",
        });
      }
      setIsEditOpen(false);
    } catch (error) {
      console.error("Update failed:", error);
      toast({
        title: "Update Failed",
        description:
          error.response?.data?.message ||
          error.message ||
          "Could not update profile.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (newPassword !== confirmPassword) {
        throw new Error("New passwords do not match.");
      }

      await axios.patch(
        `${API_URL}/users/updateMyPassword`,
        {
          passwordCurrent: currentPassword,
          password: newPassword,
          passwordConfirm: confirmPassword,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast({
        title: "Password Updated",
        description: "Your password has been changed securely.",
        variant: "default",
      });

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setIsChangePasswordOpen(false);
    } catch (error) {
      console.error("Password update failed:", error);
      toast({
        title: "Update Failed",
        description:
          error.response?.data?.message ||
          error.message ||
          "Could not update password.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div>
        <h1 className="font-heading text-4xl md:text-5xl font-bold tracking-tight text-slate-900 dark:text-white drop-shadow-sm dark:drop-shadow-lg">
          User Profile
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg font-light">
          Manage your identity and security settings.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        {/* Main Profile Card */}
        <div className="md:col-span-2 glass-panel rounded-3xl p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <User className="h-64 w-64 text-slate-900 dark:text-white" />
          </div>

          <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start">
            {/* Avatar */}
            <div className="h-32 w-32 rounded-full bg-gradient-to-br from-cyan-500 to-violet-500 p-[3px] shadow-xl">
              <div className="h-full w-full rounded-full bg-white dark:bg-black flex items-center justify-center">
                <User className="h-16 w-16 text-slate-900 dark:text-white" />
              </div>
            </div>

            {/* Details */}
            <div className="space-y-6 flex-1">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                  {user?.name || user?.email?.split("@")[0]}
                </h2>
                <p className="text-slate-500 dark:text-slate-400">
                  Identity Node
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                  <div className="flex items-center gap-3 mb-2">
                    <Mail className="h-4 w-4 text-cyan-500" />
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Email Address
                    </span>
                  </div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                    {user?.email}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                  <div className="flex items-center gap-3 mb-2">
                    <Shield className="h-4 w-4 text-emerald-500" />
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Security Status
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      Encrypted & Secure
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                  <DialogTrigger asChild>
                    <Button className="rounded-full bg-slate-900 dark:bg-white text-white dark:text-black hover:bg-slate-800 dark:hover:bg-white/90">
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Profile
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px] glass-panel border-white/20 dark:border-white/10">
                    <DialogHeader>
                      <DialogTitle>Edit Profile</DialogTitle>
                      <DialogDescription>
                        Update your public profile information.
                      </DialogDescription>
                    </DialogHeader>
                    <form
                      onSubmit={handleUpdateProfile}
                      className="grid gap-4 py-4"
                    >
                      <div className="grid gap-2">
                        <Label htmlFor="name">Name</Label>
                        <Input
                          id="name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="glass-button"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="glass-button"
                        />
                      </div>
                      <DialogFooter>
                        <Button
                          type="submit"
                          disabled={isLoading}
                          className="bg-cyan-500 hover:bg-cyan-600 text-white"
                        >
                          {isLoading && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          Save Changes
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>

                <Dialog
                  open={isChangePasswordOpen}
                  onOpenChange={setIsChangePasswordOpen}
                >
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="rounded-full border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5"
                    >
                      <Shield className="mr-2 h-4 w-4" />
                      Change Password
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px] glass-panel border-white/20 dark:border-white/10">
                    <DialogHeader>
                      <DialogTitle>Change Password</DialogTitle>
                      <DialogDescription>
                        Ensure your account is secure with a strong password.
                      </DialogDescription>
                    </DialogHeader>
                    <form
                      onSubmit={handleChangePassword}
                      className="grid gap-4 py-4"
                    >
                      <div className="grid gap-2">
                        <Label htmlFor="currentPassword">
                          Current Password
                        </Label>
                        <Input
                          id="currentPassword"
                          type="password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="Required"
                          className="glass-button"
                          required
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="newPassword">New Password</Label>
                        <Input
                          id="newPassword"
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Min 8 characters"
                          className="glass-button"
                          required
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="confirmPassword">
                          Confirm New Password
                        </Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Re-enter new password"
                          className="glass-button"
                          required
                        />
                      </div>
                      <DialogFooter>
                        <Button
                          type="submit"
                          disabled={isLoading}
                          className="bg-violet-500 hover:bg-violet-600 text-white"
                        >
                          {isLoading && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          Update Password
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </div>

        {/* Stats / Side Panel */}
        <div className="space-y-6">
          <div className="glass-panel rounded-3xl p-6">
            <h3 className="font-heading font-semibold text-lg text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Activity className="h-5 w-5 text-violet-500" />
              Account Activity
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">
                  Status
                </span>
                <span className="px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-medium border border-emerald-500/20">
                  Active
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">
                  Member Since
                </span>
                <span className="text-slate-900 dark:text-white font-medium">
                  Nov 2024
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">
                  Last Login
                </span>
                <span className="text-slate-900 dark:text-white font-medium">
                  Just now
                </span>
              </div>
            </div>
          </div>

          <div className="glass-panel rounded-3xl p-6">
            <h3 className="font-heading font-semibold text-lg text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <HardDrive className="h-5 w-5 text-cyan-500" />
              Storage Plan
            </h3>
            <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-violet-500/10 border border-cyan-500/20">
              <p className="text-sm font-medium text-slate-900 dark:text-white mb-1">
                Free Tier
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                Up to 15GB aggregated storage
              </p>
              <Button
                variant="outline"
                size="sm"
                className="w-full rounded-full border-cyan-500/30 hover:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400"
              >
                Upgrade Plan
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
