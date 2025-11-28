import React from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import LandingNavbar from "@/components/layout/LandingNavbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Shield,
  Zap,
  Globe,
  Lock,
  ArrowRight,
  CheckCircle2,
  Database,
  Server,
} from "lucide-react";
import DashboardPreview from "@/components/landing/DashboardPreview";

const LandingPage = () => {
  const { isAuthenticated } = useAuthStore();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-cyan-500/30 selection:text-cyan-100 overflow-x-hidden">
      <LandingNavbar />

      <main className="flex flex-col items-center">
        {/* Hero Section */}
        <section className="relative w-full pt-32 pb-20 px-6 flex flex-col items-center text-center overflow-hidden">
          {/* Background Glows (Matching Dashboard) */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none" />

          <div className="relative z-10 max-w-4xl mx-auto space-y-8">
            <div className="inline-flex items-center rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-sm font-medium text-cyan-600 dark:text-cyan-400 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-4 duration-700">
              <span className="flex h-2 w-2 rounded-full bg-cyan-500 mr-2 animate-pulse"></span>
              Protocol v2.0 Live
            </div>

            <h1 className="font-heading text-5xl md:text-7xl font-bold tracking-tight text-slate-900 dark:text-white drop-shadow-sm animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-100">
              Decentralized Storage <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 via-violet-600 to-emerald-600 dark:from-cyan-400 dark:via-violet-400 dark:to-emerald-400">
                For the Modern Web
              </span>
            </h1>

            <p className="text-lg md:text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
              Secure, private, and unstoppable. Your data is encrypted, sharded,
              and distributed across a global network of nodes.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
              <Link to="/register">
                <Button
                  size="lg"
                  className="h-12 px-8 rounded-full bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-white font-bold shadow-lg transition-all hover:scale-105"
                >
                  Initialize Protocol
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/login">
                <Button
                  size="lg"
                  variant="outline"
                  className="h-12 px-8 rounded-full border-slate-200 dark:border-white/10 bg-white/50 dark:bg-white/5 hover:bg-white/80 dark:hover:bg-white/10 backdrop-blur-md transition-all"
                >
                  Access Console
                </Button>
              </Link>
            </div>
          </div>

          {/* Mock Dashboard Preview */}
          <div className="mt-20 w-full max-w-6xl animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-500">
            <DashboardPreview />
          </div>
        </section>

        {/* Stats Section */}
        <section className="w-full py-12 border-y border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-white/5 backdrop-blur-sm">
          <div className="container max-w-6xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { label: "Uptime", value: "99.99%" },
              { label: "Encryption", value: "AES-256" },
              { label: "Nodes", value: "10k+" },
              { label: "Privacy", value: "Zero-Know" },
            ].map((stat, i) => (
              <div key={i} className="space-y-1">
                <div className="text-3xl md:text-4xl font-heading font-bold text-slate-900 dark:text-white">
                  {stat.value}
                </div>
                <div className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Features Grid */}
        <section id="features" className="w-full py-24 px-6">
          <div className="container max-w-6xl mx-auto">
            <div className="text-center mb-16 space-y-4">
              <h2 className="text-3xl md:text-4xl font-heading font-bold text-slate-900 dark:text-white">
                System Capabilities
              </h2>
              <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
                Engineered for resilience and privacy.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  icon: Shield,
                  title: "End-to-End Encryption",
                  desc: "Client-side encryption ensures only you hold the keys.",
                },
                {
                  icon: Zap,
                  title: "High Performance",
                  desc: "Parallel retrieval from multiple nodes for max speed.",
                },
                {
                  icon: Globe,
                  title: "Global Redundancy",
                  desc: "Data is replicated across independent nodes worldwide.",
                },
                {
                  icon: Lock,
                  title: "Zero Knowledge",
                  desc: "We cannot see, read, or access your stored data.",
                },
                {
                  icon: Database,
                  title: "Immutable Ledger",
                  desc: "Audit trails verify data integrity and ownership.",
                },
                {
                  icon: Server,
                  title: "Decentralized",
                  desc: "No single point of failure. The network is the cloud.",
                },
              ].map((feature, i) => (
                <Card
                  key={i}
                  className="glass-panel border-slate-200 dark:border-white/10 bg-white/50 dark:bg-slate-950/40 hover:bg-white/80 dark:hover:bg-white/5 transition-all duration-300 group"
                >
                  <CardHeader>
                    <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                      <feature.icon className="h-6 w-6 text-cyan-600 dark:text-cyan-400" />
                    </div>
                    <CardTitle className="text-xl font-bold text-slate-900 dark:text-white">
                      {feature.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                      {feature.desc}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="w-full py-24 px-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-100 dark:to-slate-900/50 pointer-events-none" />

          <div className="container max-w-4xl mx-auto relative z-10">
            <Card className="glass-panel border-slate-200 dark:border-white/10 bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-950 overflow-hidden">
              <div className="absolute top-0 right-0 p-12 opacity-5">
                <Database className="h-64 w-64 text-slate-900 dark:text-white" />
              </div>

              <div className="p-12 md:p-16 text-center space-y-8 relative z-10">
                <h2 className="text-3xl md:text-5xl font-heading font-bold text-slate-900 dark:text-white">
                  Ready to Secure Your Data?
                </h2>
                <p className="text-lg text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
                  Join the decentralized revolution. Start storing your files
                  with military-grade encryption today.
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
                  <Link to="/register">
                    <Button
                      size="lg"
                      className="h-14 px-10 text-lg rounded-full bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-white font-bold shadow-xl shadow-cyan-500/20 transition-all hover:scale-105"
                    >
                      Get Started Free
                    </Button>
                  </Link>
                </div>
                <div className="pt-8 flex justify-center gap-8 text-sm text-slate-400">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    <span>No Credit Card</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    <span>5GB Free Storage</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </section>

        {/* Footer */}
        <footer className="w-full py-12 px-6 border-t border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-[#020617]">
          <div className="container max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-cyan-500 to-violet-500 flex items-center justify-center">
                <Shield className="h-4 w-4 text-white" />
              </div>
              <span className="font-heading font-bold text-lg text-slate-900 dark:text-white">
                Helio
                <span className="text-cyan-600 dark:text-cyan-400">Scape</span>
              </span>
            </div>

            <div className="text-sm text-slate-500 dark:text-slate-400">
              © 2024 HelioScape Protocol. All rights reserved.
            </div>

            <div className="flex gap-6">
              <a
                href="#"
                className="text-slate-500 hover:text-cyan-600 dark:text-slate-400 dark:hover:text-white transition-colors"
              >
                Privacy
              </a>
              <a
                href="#"
                className="text-slate-500 hover:text-cyan-600 dark:text-slate-400 dark:hover:text-white transition-colors"
              >
                Terms
              </a>
              <a
                href="#"
                className="text-slate-500 hover:text-cyan-600 dark:text-slate-400 dark:hover:text-white transition-colors"
              >
                Twitter
              </a>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default LandingPage;
