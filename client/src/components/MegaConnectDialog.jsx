import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { megaLogin } from "../services/authService";

const MegaConnectDialog = ({ onSuccess }) => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = React.useState(false);
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await megaLogin(email, password);
      toast({
        title: "Success",
        description: "MEGA account linked successfully.",
      });
      setIsOpen(false);
      setEmail("");
      setPassword("");
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Login Failed",
        description:
          error.response?.data?.message || "Failed to login to MEGA.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Connect</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Connect MEGA</DialogTitle>
          <DialogDescription>
            Enter your MEGA credentials to link your account.
          </DialogDescription>
        </DialogHeader>

        <div className="bg-yellow-500/15 text-yellow-600 p-3 rounded-md text-sm mb-4 border border-yellow-500/20">
          <strong>Security Notice:</strong> To enable "on-the-fly" decryption of
          your files, your credentials will be <strong>encrypted</strong> with
          the server's master key and stored securely. They are never exposed in
          plain text.
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="mega-email">Email</Label>
            <Input
              id="mega-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="mega-password">Password</Label>
            <Input
              id="mega-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Connecting..." : "Connect Account"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default MegaConnectDialog;
