import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Cloud, CheckCircle } from "lucide-react";

import { verifyEmail } from "@/services/authService";

const VerifyEmail = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login } = useAuthStore();

  const [email, setEmail] = useState(location.state?.email || "");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!email) {
      toast({
        variant: "destructive",
        title: "Access Denied",
        description: "Please login to verify your email.",
      });
      navigate("/login", { replace: true });
    }
  }, [email, navigate, toast]);

  const handleVerify = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await verifyEmail(email, otp);
      login(response.data.user, response.token);

      toast({
        title: "Email Verified",
        description: "Your email has been verified successfully.",
      });
      // Use replace to prevent going back to verify page and clear state
      navigate("/dashboard", { replace: true, state: {} });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Verification Failed",
        description: error.response?.data?.message || "Invalid OTP.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      {/* Ambient Background */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-purple-500/10 blur-[120px]" />
        <div className="absolute top-[40%] -right-[10%] w-[40%] h-[40%] rounded-full bg-cyan-500/10 blur-[120px]" />
      </div>

      <Card className="w-full max-w-md z-10 border-primary/20 bg-card/50 backdrop-blur-xl">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-primary/10 border border-primary/20">
              <Cloud className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-center">
            Verify Email
          </CardTitle>
          <CardDescription className="text-center">
            Enter the code sent to {email || "your email"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleVerify} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-background/50"
                disabled={!!location.state?.email}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="otp">Verification Code</Label>
              <Input
                id="otp"
                type="text"
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
                className="bg-background/50 text-center text-2xl tracking-widest"
                maxLength={6}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  Verify Account <CheckCircle className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2 text-center">
          <div className="text-sm text-muted-foreground">
            Back to{" "}
            <Link
              to="/login"
              className="text-primary hover:underline font-medium"
            >
              Login
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default VerifyEmail;
