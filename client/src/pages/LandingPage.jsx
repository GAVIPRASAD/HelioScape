import React from "react";
import { Button } from "@/components/ui/button";
import {
  Cloud,
  Shield,
  Zap,
  Globe,
  Lock,
  Server,
  ChevronRight,
  ArrowRight,
} from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

import LandingNavbar from "@/components/layout/LandingNavbar";

import { useAuthStore } from "@/store/useAuthStore";
import { Navigate } from "react-router-dom";

const LandingPage = () => {
  const { isAuthenticated } = useAuthStore();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground font-sans overflow-hidden selection:bg-cyan-500/30 selection:text-cyan-100">
      <LandingNavbar />
      {/* Dynamic Background Elements */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-violet-600/20 blur-[150px] animate-float" />
        <div
          className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-cyan-500/20 blur-[150px] animate-float"
          style={{ animationDelay: "2s" }}
        />
        <div className="absolute top-[40%] left-[30%] w-[40%] h-[40%] rounded-full bg-emerald-500/10 blur-[120px] animate-pulse-glow" />
      </div>

      <main className="flex-1 z-10 pt-20">
        {/* Hero Section */}
        <section className="w-full py-20 md:py-32 flex flex-col items-center text-center px-4 relative">
          <div className="container max-w-6xl space-y-10">
            {/* Badge */}
            <div className="inline-flex items-center rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-1.5 text-sm font-medium text-cyan-300 backdrop-blur-xl mb-6 animate-float">
              <span className="flex h-2 w-2 rounded-full bg-cyan-400 mr-2 animate-pulse shadow-[0_0_10px_#22d3ee]"></span>
              Decentralized Storage v2.0
            </div>

            {/* Heading */}
            <h1 className="font-heading text-6xl md:text-8xl lg:text-9xl font-bold tracking-tight text-slate-900 dark:text-white drop-shadow-2xl">
              The Cloud, <br />
              <span className="text-gradient">Reimagined.</span>
            </h1>

            {/* Subtext */}
            <p className="mx-auto max-w-[800px] text-slate-600 dark:text-slate-400 md:text-xl lg:text-2xl leading-relaxed font-light">
              Shatter your data into encrypted shards. Scatter them across the
              void.
              <br className="hidden md:block" />
              <span className="text-slate-900 dark:text-white font-medium">
                Invincible. Private. Forever.
              </span>
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center pt-10">
              <Link to="/dashboard">
                <Button
                  size="lg"
                  className="h-16 px-10 text-lg rounded-full bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-white font-bold shadow-lg transition-all duration-300 hover:scale-105"
                >
                  Initialize System
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button
                size="lg"
                variant="outline"
                className="h-16 px-10 text-lg rounded-full border-slate-200 dark:border-white/10 bg-white/50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-900 dark:text-white backdrop-blur-md transition-all duration-300 hover:scale-105"
              >
                Read the Protocol
              </Button>
            </div>

            {/* Floating Cards / Stats */}
            <div className="pt-24 grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  label: "Uptime",
                  value: "99.99%",
                  icon: Server,
                  color: "text-cyan-600 dark:text-cyan-400",
                  bg: "bg-cyan-100 dark:bg-white/5",
                },
                {
                  label: "Encryption",
                  value: "AES-256",
                  icon: Lock,
                  color: "text-violet-600 dark:text-violet-400",
                  bg: "bg-violet-100 dark:bg-white/5",
                },
                {
                  label: "Speed",
                  value: "10Gbps",
                  icon: Zap,
                  color: "text-emerald-600 dark:text-emerald-400",
                  bg: "bg-emerald-100 dark:bg-white/5",
                },
              ].map((stat, i) => (
                <div
                  key={i}
                  className="glass-panel rounded-3xl p-8 flex flex-col items-center justify-center gap-4 group hover:-translate-y-2 transition-transform duration-500"
                >
                  <div
                    className={cn(
                      "p-4 rounded-full transition-colors",
                      stat.bg,
                      stat.color
                    )}
                  >
                    <stat.icon className="h-8 w-8" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-4xl font-heading font-bold text-slate-900 dark:text-white mb-1">
                      {stat.value}
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 uppercase tracking-widest text-xs font-semibold">
                      {stat.label}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="w-full py-32 relative">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <div className="space-y-8">
                <h2 className="font-heading text-4xl md:text-6xl font-bold text-slate-900 dark:text-white leading-tight">
                  Data that{" "}
                  <span className="text-cyan-500 dark:text-cyan-400">
                    breathes
                  </span>{" "}
                  freedom.
                </h2>
                <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
                  We don't just store files. We decompose them into mathematical
                  proofs and distribute them across a global network of nodes.
                  No central authority. No single point of failure.
                </p>
                <div className="flex flex-col gap-4">
                  {[
                    "Zero-Knowledge Architecture",
                    "Self-Healing Data Grid",
                    "Quantum-Resistant Encryption",
                  ].map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-4 p-4 rounded-2xl bg-white/50 dark:bg-white/5 border border-slate-200 dark:border-white/5 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                    >
                      <div className="h-2 w-2 rounded-full bg-emerald-500 dark:bg-emerald-400 shadow-[0_0_10px_#34d399]" />
                      <span className="text-slate-900 dark:text-white font-medium">
                        {item}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Visual Element */}
              <div className="relative h-[500px] w-full rounded-[3rem] overflow-hidden glass-panel border-slate-200 dark:border-white/20 group">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-violet-500/10 opacity-50" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Globe className="h-64 w-64 text-slate-300 dark:text-white/10 animate-pulse-glow" />
                </div>
                {/* Floating Particles (Simulated) */}
                <div className="absolute top-1/4 left-1/4 h-4 w-4 rounded-full bg-cyan-400 blur-sm animate-float" />
                <div
                  className="absolute bottom-1/3 right-1/4 h-6 w-6 rounded-full bg-violet-400 blur-sm animate-float"
                  style={{ animationDelay: "1s" }}
                />
                <div
                  className="absolute top-1/2 right-1/3 h-3 w-3 rounded-full bg-emerald-400 blur-sm animate-float"
                  style={{ animationDelay: "2s" }}
                />
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-10 w-full border-t border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-black/20 text-center z-10 backdrop-blur-lg">
        <div className="flex items-center justify-center gap-2 mb-4 opacity-50 hover:opacity-100 transition-opacity">
          <Cloud className="h-5 w-5 text-cyan-500 dark:text-cyan-400" />
          <span className="font-heading font-bold text-slate-900 dark:text-white">
            HelioScape
          </span>
        </div>
        <p className="text-sm text-slate-500">© 2024 HelioScape Protocol.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
