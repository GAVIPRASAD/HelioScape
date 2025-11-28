import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FileQuestion, Home } from "lucide-react";

const NotFound = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-4 relative overflow-hidden">
      {/* Ambient Background */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[20%] left-[20%] w-[40%] h-[40%] rounded-full bg-cyan-500/10 blur-[120px]" />
        <div className="absolute bottom-[20%] right-[20%] w-[40%] h-[40%] rounded-full bg-violet-500/10 blur-[120px]" />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center space-y-6 max-w-md mx-auto">
        <div className="h-32 w-32 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center mb-4 animate-pulse">
          <FileQuestion className="h-16 w-16 text-slate-400 dark:text-slate-500" />
        </div>

        <h1 className="text-4xl md:text-6xl font-heading font-bold text-slate-900 dark:text-white">
          404
        </h1>

        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-200">
            Page Not Found
          </h2>
          <p className="text-slate-500 dark:text-slate-400">
            The page you are looking for doesn't exist or has been moved.
          </p>
        </div>

        <div className="pt-4">
          <Link to="/">
            <Button
              size="lg"
              className="rounded-full gap-2 bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-white border-0"
            >
              <Home className="h-4 w-4" />
              Return Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
