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
} from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

const LandingPage = () => {
  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-white selection:bg-cyan-500/30">
      {/* Background Gradients */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-purple-500/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-cyan-500/10 blur-[120px]" />
      </div>

      {/* Navbar */}
      <header className="px-6 lg:px-10 h-20 flex items-center z-10 border-b border-white/5 backdrop-blur-md sticky top-0">
        <Link className="flex items-center justify-center group" to="#">
          <div className="relative mr-2">
            <div className="absolute inset-0 bg-cyan-500 blur-md opacity-50 group-hover:opacity-100 transition-opacity" />
            <Cloud className="h-8 w-8 text-cyan-400 relative z-10" />
          </div>
          <span className="font-bold text-2xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
            HelioScape
          </span>
        </Link>
        <nav className="ml-auto flex gap-8 hidden md:flex">
          {["Features", "Security", "Pricing"].map((item) => (
            <Link
              key={item}
              className="text-sm font-medium text-slate-400 hover:text-cyan-400 transition-colors"
              to="#"
            >
              {item}
            </Link>
          ))}
        </nav>
        <div className="ml-auto md:ml-8">
          <Link to="/dashboard">
            <Button className="bg-cyan-500 hover:bg-cyan-600 text-black font-semibold shadow-[0_0_20px_rgba(6,182,212,0.5)] hover:shadow-[0_0_30px_rgba(6,182,212,0.7)] transition-all duration-300">
              Launch App
            </Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 z-10">
        {/* Hero Section */}
        <section className="w-full py-24 md:py-32 lg:py-40 flex flex-col items-center text-center px-4">
          <div className="container max-w-5xl space-y-8">
            <div className="inline-flex items-center rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-sm font-medium text-cyan-400 backdrop-blur-xl mb-4">
              <span className="flex h-2 w-2 rounded-full bg-cyan-400 mr-2 animate-pulse"></span>
              v1.0 Public Beta is Live
            </div>

            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-slate-500">
              The Cloud, <br />
              <span className="text-cyan-400 drop-shadow-[0_0_30px_rgba(34,211,238,0.3)]">
                Decentralized.
              </span>
            </h1>

            <p className="mx-auto max-w-[800px] text-slate-400 md:text-xl lg:text-2xl leading-relaxed">
              Aggregate your Google Drive, Dropbox, and MEGA into one
              <span className="text-white font-semibold"> invincible</span>{" "}
              storage network. Sharded, encrypted, and distributed.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
              <Link to="/dashboard">
                <Button
                  size="lg"
                  className="h-14 px-8 text-lg bg-white text-black hover:bg-slate-200 font-bold"
                >
                  Get Started Free
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button
                size="lg"
                variant="outline"
                className="h-14 px-8 text-lg border-slate-700 text-white hover:bg-slate-800 hover:text-white"
              >
                View Documentation
              </Button>
            </div>

            {/* Stats / Social Proof */}
            <div className="pt-16 grid grid-cols-2 md:grid-cols-4 gap-8 text-slate-500 border-t border-white/5 mt-16">
              {[
                { label: "Uptime", value: "99.99%" },
                { label: "Encryption", value: "AES-256" },
                { label: "Providers", value: "3+" },
                { label: "Cost", value: "$0" },
              ].map((stat) => (
                <div key={stat.label} className="flex flex-col">
                  <span className="text-2xl font-bold text-white">
                    {stat.value}
                  </span>
                  <span className="text-sm uppercase tracking-wider">
                    {stat.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="w-full py-24 bg-slate-900/50 border-t border-white/5">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold mb-4">
                Why HelioScape?
              </h2>
              <p className="text-slate-400 max-w-2xl mx-auto">
                We don't just store your files. We shatter them, encrypt them,
                and scatter them across the internet so no single provider holds
                your data.
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
              {[
                {
                  icon: Globe,
                  title: "Distributed Architecture",
                  desc: "Your file is split into chunks and stored across multiple providers. If one goes down, your data survives.",
                  color: "text-blue-400",
                },
                {
                  icon: Lock,
                  title: "Zero-Knowledge Encryption",
                  desc: "Files are encrypted on your device before they ever touch the cloud. Only you hold the keys.",
                  color: "text-purple-400",
                },
                {
                  icon: Zap,
                  title: "Parallel Transfer",
                  desc: "Upload and download from multiple clouds simultaneously, maximizing your bandwidth saturation.",
                  color: "text-yellow-400",
                },
              ].map((feature, i) => (
                <div
                  key={i}
                  className="group relative p-8 rounded-2xl bg-slate-900 border border-white/5 hover:border-cyan-500/30 transition-all duration-300 hover:shadow-[0_0_30px_rgba(6,182,212,0.1)]"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-purple-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative z-10">
                    <div
                      className={cn(
                        "p-3 rounded-lg bg-slate-800 w-fit mb-6 group-hover:scale-110 transition-transform duration-300",
                        feature.color
                      )}
                    >
                      <feature.icon className="h-8 w-8" />
                    </div>
                    <h3 className="text-xl font-bold mb-3 text-white">
                      {feature.title}
                    </h3>
                    <p className="text-slate-400 leading-relaxed">
                      {feature.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-10 w-full border-t border-white/5 bg-slate-950 text-center z-10">
        <div className="flex items-center justify-center gap-2 mb-4 opacity-50">
          <Cloud className="h-5 w-5" />
          <span className="font-bold">HelioScape</span>
        </div>
        <p className="text-sm text-slate-500">
          © 2024 HelioScape Inc. Open Source & Decentralized.
        </p>
      </footer>
    </div>
  );
};

export default LandingPage;
