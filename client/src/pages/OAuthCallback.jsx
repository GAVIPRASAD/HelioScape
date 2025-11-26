import React, { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { linkAccount } from "../services/authService";
import { useToast } from "@/components/ui/use-toast";
import Loading from "@/components/ui/Loading";

const OAuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const processedRef = useRef(false); // Prevent double execution in React Strict Mode

  useEffect(() => {
    if (processedRef.current) return;
    processedRef.current = true;

    const code = searchParams.get("code");
    // We assume provider is passed in state or we infer it?
    // Actually, the callback URL usually doesn't have the provider in the path if we use a generic one.
    // But our config said `/oauth/callback`.
    // We can pass the provider in the 'state' param during auth initiation.
    // For now, let's assume it's Google since that's all we have.
    // TODO: Implement proper state handling to know which provider this is.
    const provider = "google";

    if (code) {
      linkAccount(provider, code)
        .then(() => {
          toast({
            title: "Success",
            description: "Account linked successfully!",
          });
          navigate("/settings");
        })
        .catch((err) => {
          console.error(err);
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to link account.",
          });
          navigate("/settings");
        });
    } else {
      navigate("/settings");
    }
  }, [searchParams, navigate, toast]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Loading size="lg" text="Linking Account..." />
    </div>
  );
};

export default OAuthCallback;
