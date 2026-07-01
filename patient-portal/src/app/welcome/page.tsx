"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { 
  Shield, Activity, Sparkles, Heart, Calendar, 
  Video, MessageSquare, ArrowRight, CheckCircle, 
  Mic, Users, TrendingUp, Send, Globe, Play, Server, RefreshCw
} from "lucide-react";

export default function WelcomePage() {
  const router = useRouter();
  const { token, user } = useAuthStore();
  
  // Redirect if already logged in
  useEffect(() => {
    if (token && user) {
      router.push(user.role === "Doctor" ? "/doctor/dashboard" : "/");
    }
  }, [token, user, router]);

  // Scroll reveal trigger
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("active");
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );

    const elements = document.querySelectorAll(".reveal-on-scroll");
    elements.forEach((el) => observer.observe(el));

    return () => {
      elements.forEach((el) => observer.unobserve(el));
    };
  }, []);

  const handleNavigateToLogin = () => {
    router.push("/login");
  };

  // Choreographed scroll-driven showcase logic
  const [scrollProgress, setScrollProgress] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Active gauges and simulated live telemetry state
  const [activeGauge, setActiveGauge] = useState<number | null>(null);
  const [telemetryLogs, setTelemetryLogs] = useState<string[]>([
    "sys-node-east [INIT]: starting telemetry sync...",
    "sys-node-east [SECURE]: HIPAA validation handshake verified [AES-256-GCM]",
    "sys-node-east [NET]: latency ping 14ms (avg)",
    "ehr-sync-service [OK]: patient database matched successfully [1.2s]",
  ]);

  useEffect(() => {
    const logPhrases = [
      "scribe-ambient-nlp: transcription block verified at 99.4% accuracy",
      "sys-node-west [SECURE]: credentials handshake complete",
      "vitals-ingest-hub: diagnostics matched in-network triggers",
      "webrtc-signaling: video connection established (1080p)",
      "telehealth-latency: ping optimized. current local ping = 11ms",
      "ehr-soap-service: SOAP draft exported successfully [240ms]",
      "auth-handshake: AES-256 session key rotated",
      "sys-node-east [SYNC]: 14 patient records synced to primary hub"
    ];

    const interval = setInterval(() => {
      const randomPhrase = logPhrases[Math.floor(Math.random() * logPhrases.length)];
      const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const newEntry = `[${timestamp}] ${randomPhrase}`;
      
      setTelemetryLogs((prev) => {
        const updated = [...prev, newEntry];
        if (updated.length > 5) updated.shift();
        return updated;
      });
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const totalHeight = rect.height;
      const viewportHeight = window.innerHeight;
      const scrolled = -rect.top;
      
      const scrollableHeight = totalHeight - viewportHeight;
      if (scrollableHeight <= 0) return;
      
      const fraction = Math.max(0, Math.min(1, scrolled / scrollableHeight));
      setScrollProgress(fraction);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const features = [
    {
      id: "01",
      title: "AI Ambient Scribe",
      description: "Turns ambient doctor-patient conversation directly into production-ready EHR charts, clinical summaries, and formatted SOAP notes automatically.",
      visual: (
        <div className="w-full bg-white border border-slate-100 rounded-3xl p-6 shadow-2xl relative overflow-hidden font-mono text-[10px] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <span className="text-indigo-655 text-indigo-600 font-bold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-ping" />
              AMBIENT NLP NODES
            </span>
            <span className="text-[8px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded-full font-bold">ACTIVE</span>
          </div>
          <div className="space-y-2.5 text-slate-500">
            <p className="truncate"><span className="text-slate-700 font-bold">[00:24]</span> "BP measured 120 over 80..."</p>
            <p className="text-indigo-650 font-semibold truncate">↳ Generating SOAP Objective...</p>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-150 font-sans text-slate-700 text-[10px] shadow-inner leading-relaxed">
              <strong>Objective:</strong> BP 120/80 mmHg, SpO2 99%. Lungs clear to auscultation.
            </div>
          </div>
          <div className="pt-2 flex justify-between items-center text-[9px] text-slate-400">
            <span>Accuracy: 99.4%</span>
            <span>Uptime: 99.99%</span>
          </div>
        </div>
      )
    },
    {
      id: "02",
      title: "Secure Telehealth",
      description: "HIPAA-compliant high-performance video consultations featuring low-latency vitals feed and secure authentication.",
      visual: (
        <div className="w-full bg-white border border-slate-100 rounded-3xl p-6 shadow-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center text-amber-600 border border-amber-100">
                <Video className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-800">Telehealth Workspace</span>
            </div>
            <span className="text-[9px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full border border-emerald-100 font-bold flex items-center gap-1 animate-pulse">
              <span className="w-1 h-1 rounded-full bg-emerald-500" />
              LIVE
            </span>
          </div>
          
          <div className="relative aspect-[16/10] bg-slate-900 rounded-2xl overflow-hidden flex items-center justify-center border border-slate-800 shadow-inner group">
            <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm text-[9px] text-white px-2.5 py-1 rounded-full flex items-center gap-1 font-bold">
              Dr. Sarah Jenkins (Cardiology)
            </div>
            <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-white border border-white/20 hover:scale-105 transition-transform cursor-pointer shadow-lg shadow-black/20">
              <Play className="w-5 h-5 fill-white/10" />
            </div>
            <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm text-[8px] text-white px-2 py-0.5 rounded-md">
              1080p WebRTC
            </div>
          </div>
        </div>
      )
    },
    {
      id: "03",
      title: "Clinic Directory",
      description: "Instantly filter nearby specialists based on in-network insurance status, proximity, and live clinical availability metrics.",
      visual: (
        <div className="w-full bg-white border border-slate-100 rounded-3xl p-6 shadow-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600 border border-emerald-100">
                <Users className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-805 text-slate-800">Specialist Matching Engine</span>
            </div>
            <span className="text-[9px] text-slate-400 font-mono">1.2 mi radius</span>
          </div>

          <div className="space-y-3">
            <div className="bg-slate-50 border border-slate-100 p-3 rounded-2xl flex items-center justify-between shadow-sm hover:border-emerald-250 transition-colors">
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-slate-800">Dr. Alan Mercer, MD</p>
                <p className="text-[9px] text-slate-505 text-slate-500">Cardiology • In-Network</p>
              </div>
              <div className="text-right shrink-0">
                <span className="text-[10px] bg-emerald-50 text-emerald-600 font-bold px-2 py-0.5 rounded-full border border-emerald-100 font-bold">98% Match</span>
              </div>
            </div>
            <div className="bg-slate-50 border border-slate-100 p-3 rounded-2xl flex items-center justify-between shadow-sm opacity-60">
              <div>
                <p className="text-[11px] font-bold text-slate-800">Dr. Jessica Chen</p>
                <p className="text-[9px] text-slate-505 text-slate-500">Pediatrics • Out-Of-Network</p>
              </div>
              <span className="text-[10px] bg-slate-100 text-slate-500 font-bold px-2 py-0.5 rounded-full">85% Match</span>
            </div>
          </div>
        </div>
      )
    },
    {
      id: "04",
      title: "Care Companion",
      description: "Empowers patients with 24/7 post-visit recovery conversations. AI checks symptoms, logs vitals, and automatically prompts medication schedules.",
      visual: (
        <div className="w-full bg-white border border-slate-100 rounded-3xl p-6 shadow-2xl flex flex-col gap-4 h-[280px]">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="text-[9px] font-bold text-slate-405 text-slate-400 uppercase tracking-widest font-mono">Active Care Assistant</span>
            <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping" />
          </div>
          
          <div className="flex-1 space-y-3 overflow-y-auto pr-1">
            <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-2xl rounded-bl-none shadow-inner text-[10.5px] text-slate-600">
              Hi John, remember to take your Amoxicillin at 8:00 PM.
            </div>
            <div className="bg-indigo-600 text-white p-2.5 rounded-2xl rounded-br-none shadow-sm ml-auto max-w-[85%] text-[10.5px]">
              Logged dose, thank you!
            </div>
          </div>

          <div className="bg-emerald-50 border border-emerald-100 p-2.5 rounded-xl flex items-center justify-between text-[10px] text-emerald-800">
            <span className="flex items-center gap-1.5 font-bold">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              Medication Log Active
            </span>
            <span className="font-mono text-emerald-700 font-bold">100% compliant</span>
          </div>
        </div>
      )
    }
  ];

  const getFeatureStyle = (idx: number, p: number) => {
    const centers = [0, 0.33, 0.66, 1.0];
    const center = centers[idx];
    
    let opacity = 0;
    let translateY = 150; // starts below
    
    if (p <= center) {
      if (idx === 0) {
        opacity = 1;
        translateY = 0;
      } else {
        const start = center - 0.20;
        if (p < start) {
          opacity = 0;
          translateY = 150;
        } else {
          const t = (p - start) / 0.20;
          opacity = t;
          translateY = Math.round(150 * (1 - t));
        }
      }
    } else {
      // p > center
      const fadeEnd = center + 0.15;
      if (idx === 3) {
        opacity = 1;
        translateY = 0;
      } else if (p > fadeEnd) {
        opacity = 0;
        translateY = 0;
      } else {
        const t = (p - center) / 0.15;
        opacity = 1 - t;
        translateY = 0; // Remains stationary!
      }
    }
    
    return {
      opacity,
      transform: `translateY(${translateY}px)`,
      pointerEvents: opacity > 0.1 ? ("auto" as const) : ("none" as const),
      zIndex: 10 + idx,
      transition: "opacity 150ms ease-out, transform 150ms ease-out"
    };
  };

  return (
    <div className="min-h-screen bg-slate-50/30 text-slate-800 overflow-x-clip font-sans relative">
      
      {/* TopAppBar Navigation (Floating Pill Capsule Bar) */}
      <div className="sticky top-4 z-50 w-full px-4 md:px-8 max-w-7xl mx-auto pointer-events-none">
        <header className="pointer-events-auto bg-indigo-50/80 backdrop-blur-md border border-indigo-100 rounded-full shadow-lg shadow-indigo-100/10 px-6 md:px-8 h-16 flex justify-between items-center w-full transition-all duration-300">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2 group cursor-pointer">
              <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-md shadow-indigo-600/20 group-hover:scale-105 transition-transform">
                <Activity className="w-4.5 h-4.5 animate-pulse" />
              </div>
              <span className="font-display font-extrabold text-base text-slate-900 tracking-tight animate-fade-in">
                MedOS <span className="text-indigo-650 font-semibold text-indigo-600 font-medium">AI</span>
              </span>
            </div>
            <nav className="hidden md:flex gap-6 items-center">
              <a className="text-xs font-bold text-indigo-705 text-indigo-700 py-1 transition-all" href="#">Home</a>
              <a className="text-xs font-medium text-slate-500 hover:text-slate-905 hover:text-slate-900 hover:scale-[1.02] py-1 transition-all" href="#solutions">Solutions</a>
              <a className="text-xs font-medium text-slate-500 hover:text-slate-905 hover:text-slate-900 hover:scale-[1.02] py-1 transition-all" href="#metrics">Metrics</a>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={handleNavigateToLogin}
              className="bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-600/15 hover:-translate-y-0.5 text-white px-5 py-2 rounded-full font-semibold text-xs transition-all active:scale-95 cursor-pointer"
            >
              Sign In
            </button>
          </div>
        </header>
      </div>

      <main className="relative">
        
        {/* Hero Section */}
        <section className="relative min-h-[900px] flex flex-col items-center px-6 md:px-8 overflow-hidden pt-16 pb-28 bg-gradient-to-b from-indigo-50/40 via-white to-white">
          
          {/* Centered Typography Header */}
          <div className="max-w-4xl mx-auto text-center flex flex-col items-center gap-6 animate-fade-in relative z-20">
            <span className="inline-flex items-center gap-1.5 bg-indigo-55 bg-indigo-50 text-indigo-700 px-4 py-1.5 rounded-full text-xs font-semibold border border-indigo-100 animate-float">
              <Sparkles className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: "3s" }} />
              Introducing v4.0 Platform
            </span>
            <h1 className="font-display font-black text-4xl sm:text-6xl lg:text-7xl text-slate-900 leading-[1.05] tracking-tight animate-fade-in">
              The Future of <br/>
              <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 bg-clip-text text-transparent">Medical Intelligence</span>
            </h1>
            <p className="text-slate-650 text-slate-600 text-lg sm:text-xl leading-relaxed max-w-2xl mt-2 animate-fade-in">
              Precise diagnostics, ambient SOAP note transcription, and empathetic care. MedOS AI bridges the gap between complex clinical data and meaningful patient outcomes.
            </p>
            <div className="flex flex-wrap justify-center gap-4 mt-2">
              <button 
                onClick={handleNavigateToLogin}
                className="bg-indigo-600 hover:bg-indigo-700 hover:shadow-xl hover:shadow-indigo-600/20 text-white px-8 py-4 rounded-xl font-semibold text-sm hover:-translate-y-0.5 transition-all active:scale-95 flex items-center gap-2 cursor-pointer animate-fade-in"
              >
                Get Started
                <ArrowRight className="w-4 h-4" />
              </button>
              <button 
                onClick={handleNavigateToLogin}
                className="bg-white text-slate-700 hover:text-slate-905 text-slate-900 hover:bg-slate-50 hover:shadow-md px-8 py-4 rounded-xl border border-slate-200 font-semibold text-sm hover:-translate-y-0.5 transition-all cursor-pointer animate-fade-in"
              >
                View Demo
              </button>
            </div>
          </div>

          {/* Futuristic 3D Overlapping Console Showcase */}
          <div className="w-full max-w-5xl mx-auto mt-20 relative px-4 flex justify-center items-center select-none animate-scale-up">
            {/* Ambient Background Glows */}
            <div className="absolute -top-10 left-1/4 w-72 h-72 bg-indigo-400/20 rounded-full blur-[100px] opacity-70 animate-pulse-glow" />
            <div className="absolute -bottom-10 right-1/4 w-80 h-80 bg-violet-400/20 rounded-full blur-[100px] opacity-70 animate-pulse-glow" style={{ animationDelay: "2s" }} />

            {/* Main Clinical Console Container */}
            <div className="w-full bg-white rounded-3xl border border-slate-100 shadow-2xl p-4 md:p-6 transition-all duration-500 hover:shadow-indigo-100 hover:scale-[1.01] relative z-15 group">
              {/* Console Window Controls */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                <div className="flex gap-2">
                  <span className="w-3 h-3 rounded-full bg-red-100 border border-red-200 block" />
                  <span className="w-3 h-3 rounded-full bg-amber-100 border border-amber-200 block" />
                  <span className="w-3 h-3 rounded-full bg-green-100 border border-green-200 block" />
                </div>
                <div className="bg-slate-50 border border-slate-150 px-6 py-1 rounded-full text-[10px] text-slate-400 font-medium tracking-wide flex items-center gap-1.5 font-mono">
                  <Shield className="w-3 h-3 text-indigo-500" />
                  medos-consult-console.health/active
                </div>
                <div className="w-14" />
              </div>

              {/* Main Dashboard Representation */}
              <div className="grid grid-cols-3 gap-4 h-[350px] sm:h-[400px]">
                {/* Column 1: Patient Quickinfo */}
                <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center font-bold text-indigo-650">
                        JD
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-800">John Doe</h4>
                        <p className="text-[10px] text-slate-500">ID: #4010-P</p>
                      </div>
                    </div>
                    <div className="space-y-2 border-t border-slate-100 pt-3">
                      <div className="flex justify-between text-[10px]">
                        <span className="text-slate-550 text-slate-500">Age / Gender</span>
                        <span className="font-semibold text-slate-700">42 / Male</span>
                      </div>
                      <div className="flex justify-between text-[10px]">
                        <span className="text-slate-550 text-slate-500">Blood Type</span>
                        <span className="font-semibold text-slate-700">O Positive</span>
                      </div>
                      <div className="flex justify-between text-[10px]">
                        <span className="text-slate-555 text-slate-500">Primary Ins.</span>
                        <span className="font-semibold text-slate-700">MedShield</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold font-mono">Active Consultation</span>
                    <div className="bg-indigo-600/5 border border-indigo-55 p-2.5 rounded-xl flex items-center gap-3">
                      <div className="w-2.5 h-2.5 rounded-full bg-indigo-655 bg-indigo-650 animate-ping shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold text-slate-808 text-slate-800 truncate">Telehealth Visit</p>
                        <p className="text-[9px] text-indigo-605 text-indigo-600 font-medium">Connecting (WebRTC)</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Column 2 & 3: Clinical Workspace */}
                <div className="col-span-2 bg-slate-50/50 border border-slate-100 rounded-2xl p-4 flex flex-col justify-between overflow-hidden relative">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <span className="text-xs font-bold text-slate-805 text-slate-800 font-bold">Clinical Consultation Notes</span>
                    <span className="text-[10px] bg-slate-150 px-2 py-0.5 rounded-full text-slate-500 font-medium">SOAP Format</span>
                  </div>
                  
                  <div className="flex-1 py-4 font-mono text-[10.5px] text-slate-600 space-y-3 overflow-y-auto leading-relaxed">
                    <p><span className="text-indigo-650 font-bold">SUBJECTIVE:</span> Patient reports dry cough and slight shortness of breath when exercising for past 4 days. No fever, sore throat, or chest pain.</p>
                    <p><span className="text-indigo-650 font-bold">OBJECTIVE:</span> Lungs clear to auscultation bilaterally. Heart rate and rhythm regular. Blood pressure 122/80 mmHg. SpO2 at 98% room air.</p>
                    <p><span className="text-indigo-650 font-bold">ASSESSMENT:</span> Mild acute bronchitis. Rule out secondary infection. Recommend rest and hydration.</p>
                  </div>
                  
                  <div className="bg-white border border-slate-100 p-2 rounded-xl flex items-center justify-between text-[10px]">
                    <span className="text-slate-505 text-slate-500">Auto-save completed 1 min ago</span>
                    <button className="bg-indigo-50 hover:bg-indigo-100 text-indigo-750 px-3 py-1 rounded-lg font-semibold transition-all">
                      Export Notes
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* FLOATING WIDGET 1: AI Ambient Scribe (Overlapping Bottom Left) */}
            <div className="absolute -bottom-8 -left-6 md:-left-12 bg-white/95 backdrop-blur-md border border-slate-100 p-4 rounded-2xl shadow-xl shadow-slate-150 max-w-[280px] z-30 animate-float group hover:-translate-y-1.5 transition-transform duration-300">
              <div className="flex items-center justify-between mb-3.5">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-red-50 text-red-500 rounded-lg flex items-center justify-center border border-red-100">
                    <Mic className="w-3.5 h-3.5 animate-pulse" />
                  </div>
                  <span className="text-xs font-bold text-slate-805 text-slate-800">Ambient AI Recorder</span>
                </div>
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              </div>
              <div className="h-6 flex items-center justify-between gap-1 px-1 bg-slate-50 rounded-lg overflow-hidden border border-slate-100 mb-3">
                <div className="w-1.5 h-4 bg-indigo-500 rounded animate-pulse" style={{ animationDuration: "0.6s" }} />
                <div className="w-1.5 h-2.5 bg-indigo-400 rounded animate-pulse" style={{ animationDuration: "1s" }} />
                <div className="w-1.5 h-5 bg-indigo-650 rounded animate-pulse" style={{ animationDuration: "0.8s" }} />
                <div className="w-1.5 h-3 bg-indigo-500 rounded animate-pulse" style={{ animationDuration: "1.2s" }} />
                <div className="w-1.5 h-4 bg-indigo-400 rounded animate-pulse" style={{ animationDuration: "0.5s" }} />
                <div className="w-1.5 h-2 bg-indigo-300 rounded animate-pulse" style={{ animationDuration: "0.9s" }} />
                <div className="w-1.5 h-4.5 bg-indigo-500 rounded animate-pulse" style={{ animationDuration: "0.7s" }} />
                <div className="w-1.5 h-1.5 bg-indigo-300 rounded animate-pulse" style={{ animationDuration: "1.1s" }} />
                <div className="w-1.5 h-3.5 bg-indigo-400 rounded animate-pulse" style={{ animationDuration: "0.75s" }} />
                <div className="w-1.5 h-5 bg-indigo-655 bg-indigo-650 rounded animate-pulse" style={{ animationDuration: "0.65s" }} />
              </div>
              <p className="text-[10px] text-slate-550 italic leading-relaxed">
                "Shortness of breath for past 4 days, especially when climbing stairs..."
              </p>
              <div className="mt-3.5 pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Status</span>
                <span className="text-[9px] bg-emerald-50 text-emerald-600 font-semibold px-2 py-0.5 rounded-full border border-emerald-100 font-bold">Transcribing</span>
              </div>
            </div>

            {/* FLOATING WIDGET 2: Vitals / ECG Monitor (Overlapping Top Right) */}
            <div className="absolute -top-10 -right-6 md:-right-12 bg-white/95 backdrop-blur-md border border-slate-100 p-4 rounded-2xl shadow-xl shadow-slate-150 max-w-[280px] z-30 animate-float group hover:-translate-y-1.5 transition-transform duration-300" style={{ animationDelay: "1.5s" }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center border border-emerald-100">
                    <Heart className="w-3.5 h-3.5 animate-pulse" />
                  </div>
                  <span className="text-xs font-bold text-slate-808 text-slate-800">Diagnostics Hub</span>
                </div>
                <span className="text-[9px] font-bold font-mono text-emerald-600 uppercase tracking-widest animate-pulse">Sync Active</span>
              </div>
              
              <div className="grid grid-cols-2 gap-3.5 mb-3">
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="text-[9px] text-slate-500 font-semibold uppercase">Heart Rate</span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-lg font-black text-slate-800">72</span>
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">bpm</span>
                  </div>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="text-[9px] text-slate-500 font-semibold uppercase">SpO2 Level</span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-lg font-black text-slate-800">98</span>
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">%</span>
                  </div>
                </div>
              </div>

              {/* Heartbeat Rhythm Canvas representation (SVG ECG line) */}
              <div className="h-10 bg-slate-50 border border-slate-100 rounded-lg p-1.5 flex items-center overflow-hidden">
                <svg className="w-full h-full text-emerald-500" viewBox="0 0 100 30" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M0,15 L30,15 L35,5 L40,25 L45,15 L60,15 L65,15 L68,3 L72,28 L76,15 L100,15" strokeDasharray="300" strokeDashoffset="0">
                    <animate attributeName="stroke-dashoffset" values="300;0" dur="2s" repeatCount="indefinite" />
                  </path>
                </svg>
              </div>
            </div>

            {/* FLOATING WIDGET 3: Security & Encryption Badge (Centered Bottom) */}
            <div className="absolute -bottom-10 bg-white/95 backdrop-blur-md px-5 py-3 rounded-2xl flex items-center gap-3.5 z-35 border border-slate-100 shadow-xl shadow-slate-100 hover:scale-[1.02] transition-transform duration-300">
              <div className="w-9 h-9 bg-indigo-50 text-indigo-650 rounded-xl flex items-center justify-center border border-indigo-100 shadow-inner">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="font-bold text-xs text-slate-800 leading-none font-bold">HIPAA Compliant Platform</p>
                <p className="text-[9px] text-slate-505 text-slate-500 mt-1 uppercase font-semibold tracking-wider">AES-256 Encrypted &amp; Secure</p>
              </div>
            </div>

          </div>
        </section>

        {/* Platform Ecosystem Solutions Section */}
        <div id="solutions" className="w-full">
          {/* Mobile Showcase Header & List (Normal Scrolling Flow) */}
          <div className="block lg:hidden pt-20 bg-slate-50 px-6">
            <div className="text-center flex flex-col items-center gap-3 mb-8">
              <span className="inline-flex items-center gap-1.5 bg-indigo-50 border border-indigo-100 px-3.5 py-1.5 rounded-full text-[10px] font-bold text-indigo-700 uppercase tracking-widest font-mono shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-ping" />
                Platform Ecosystem
              </span>
              <h2 className="font-display font-black text-3xl sm:text-4xl text-slate-900 leading-[1.15] tracking-tight bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 bg-clip-text text-transparent">
                Integrated Clinical Modules
              </h2>
              <div className="w-24 h-0.5 bg-slate-200 mt-2 relative rounded-full overflow-hidden">
                <div className="absolute inset-y-0 left-0 w-8 bg-indigo-600 rounded-full animate-pulse" style={{ animationDuration: "2s" }} />
              </div>
            </div>
          </div>

          <div className="block lg:hidden max-w-7xl mx-auto px-6 md:px-8 space-y-16 pb-16 bg-slate-50">
            {features.map((feature) => (
              <div key={feature.id} className="space-y-6">
                <div className="relative pl-6 border-l-2 border-indigo-600">
                  <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest font-mono">Module {feature.id}</span>
                  <h3 className="text-3xl font-black text-slate-900 leading-tight">{feature.title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{feature.description}</p>
                </div>
                <div className="w-full max-w-[400px] mx-auto">
                  {feature.visual}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Choreographed Scroll Showcase */}
          <div className="hidden lg:block relative w-full h-[320vh] bg-slate-50 border-t border-slate-100 z-10" ref={containerRef}>
            <div className="sticky top-20 h-[calc(100vh-80px)] flex flex-col justify-center w-full px-6 md:px-8 max-w-7xl mx-auto overflow-hidden">
              
              {/* Sticky Header inside desktop showcase */}
              <div className="text-center flex flex-col items-center gap-3 mb-12 shrink-0">
                <span className="inline-flex items-center gap-1.5 bg-indigo-55 bg-indigo-50 border border-indigo-100 px-3.5 py-1.5 rounded-full text-[10px] font-bold text-indigo-700 uppercase tracking-widest font-mono shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-ping" />
                  Platform Ecosystem
                </span>
                <h2 className="font-display font-black text-4xl sm:text-4xl text-slate-900 leading-[1.15] tracking-tight bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 bg-clip-text text-transparent">
                  Integrated Clinical Modules
                </h2>
                <div className="w-24 h-0.5 bg-slate-200 mt-2 relative rounded-full overflow-hidden">
                  <div className="absolute inset-y-0 left-0 w-8 bg-indigo-600 rounded-full animate-pulse" style={{ animationDuration: "2s" }} />
                </div>
              </div>

              <div className="relative w-full h-[450px] shrink-0">
                {features.map((feature, idx) => {
                  const style = getFeatureStyle(idx, scrollProgress);
                  return (
                    <div 
                      key={feature.id}
                      className="absolute inset-0 grid grid-cols-2 gap-16 items-center w-full h-full"
                      style={style}
                    >
                      {/* Left Side: Transparent outline number & text */}
                      <div className="relative flex flex-col justify-center min-h-[300px]">
                        {/* Outline Number */}
                        <div 
                          className="absolute left-0 text-[280px] font-black select-none leading-none -z-10 font-mono tracking-tighter" 
                          style={{ 
                            WebkitTextStroke: "1.5px rgba(99, 102, 241, 0.12)", 
                            color: "transparent"
                          } as React.CSSProperties}
                        >
                          {feature.id}
                        </div>
                        
                        <div className="space-y-4 max-w-md relative z-10 pl-6 border-l-2 border-indigo-600">
                          <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest font-mono">Module {feature.id}</span>
                          <h3 className="text-4xl font-black text-slate-905 leading-tight">
                            {feature.title}
                          </h3>
                          <p className="text-slate-600 text-base leading-relaxed">
                            {feature.description}
                          </p>
                        </div>
                      </div>

                      {/* Right Side: The visual mockup console */}
                      <div className="w-full max-w-[460px] flex items-center justify-center justify-self-end">
                        {feature.visual}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Trust & Analytics Section */}
        <section id="metrics" className="py-28 px-6 md:px-8 bg-white border-b border-slate-100 reveal-on-scroll">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
            
            {/* Left Column: Headings & Dials (lg:col-span-5) */}
            <div className="lg:col-span-5 space-y-10">
              <div className="space-y-4">
                <span className="inline-flex items-center gap-1.5 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full text-[10px] font-bold text-indigo-700 uppercase tracking-widest font-mono shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-ping" />
                  Performance Impact
                </span>
                <h2 className="font-display font-black text-3xl sm:text-4xl text-slate-900 leading-tight">
                  Measurable Clinical Efficiency
                </h2>
                <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                  MedOS AI isn't just about features; it's about reclaiming time for patient care. Our clinical partners report significant improvements in daily workflow.
                </p>
              </div>
                       {/* Circular SVG dials */}
              <div className="grid grid-cols-3 gap-4">
                {/* Dial 1 */}
                <div 
                  onMouseEnter={() => setActiveGauge(0)}
                  onMouseLeave={() => setActiveGauge(null)}
                  className={`relative isolate overflow-hidden bg-slate-50 border rounded-3xl p-4 flex flex-col items-center text-center gap-4 transition-all duration-300 cursor-pointer ${
                    activeGauge === 0 ? "border-indigo-300 bg-indigo-50/10 scale-105 shadow-md shadow-indigo-100/5" : "border-slate-100 hover:border-slate-200"
                  }`}
                >
                  {/* Background Outline Number */}
                  <div 
                    className="absolute bottom-1 right-3 text-[60px] font-black select-none leading-none -z-10 font-mono tracking-tighter" 
                    style={{ 
                      WebkitTextStroke: "1.2px rgba(99, 102, 241, 0.22)", 
                      color: "transparent"
                    } as React.CSSProperties}
                  >
                    01
                  </div>
                  <div className="relative w-18 h-18 sm:w-20 sm:h-20 transition-transform duration-300">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                      <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#f1f5f9" strokeWidth="2.5" />
                      <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#4f46e5" strokeWidth="2.5" strokeDasharray="82, 100" strokeLinecap="round" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center text-sm font-black text-slate-800">+42%</div>
                  </div>
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider font-mono">Charting Speed</span>
                </div>

                {/* Dial 2 */}
                <div 
                  onMouseEnter={() => setActiveGauge(1)}
                  onMouseLeave={() => setActiveGauge(null)}
                  className={`relative isolate overflow-hidden bg-slate-50 border rounded-3xl p-4 flex flex-col items-center text-center gap-4 transition-all duration-300 cursor-pointer ${
                    activeGauge === 1 ? "border-emerald-300 bg-emerald-50/10 scale-105 shadow-md shadow-emerald-100/5" : "border-slate-100 hover:border-slate-200"
                  }`}
                >
                  {/* Background Outline Number */}
                  <div 
                    className="absolute bottom-1 right-3 text-[60px] font-black select-none leading-none -z-10 font-mono tracking-tighter" 
                    style={{ 
                      WebkitTextStroke: "1.2px rgba(16, 185, 129, 0.22)", 
                      color: "transparent"
                    } as React.CSSProperties}
                  >
                    02
                  </div>
                  <div className="relative w-18 h-18 sm:w-20 sm:h-20 transition-transform duration-300">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                      <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#f1f5f9" strokeWidth="2.5" />
                      <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#10b981" strokeWidth="2.5" strokeDasharray="68, 100" strokeLinecap="round" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center text-sm font-black text-slate-800">+68%</div>
                  </div>
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider font-mono">Engagement</span>
                </div>

                {/* Dial 3 */}
                <div 
                  onMouseEnter={() => setActiveGauge(2)}
                  onMouseLeave={() => setActiveGauge(null)}
                  className={`relative isolate overflow-hidden bg-slate-50 border rounded-3xl p-4 flex flex-col items-center text-center gap-4 transition-all duration-300 cursor-pointer ${
                    activeGauge === 2 ? "border-violet-300 bg-violet-50/10 scale-105 shadow-md shadow-violet-100/5" : "border-slate-100 hover:border-slate-200"
                  }`}
                >
                  {/* Background Outline Number */}
                  <div 
                    className="absolute bottom-1 right-3 text-[60px] font-black select-none leading-none -z-10 font-mono tracking-tighter" 
                    style={{ 
                      WebkitTextStroke: "1.2px rgba(139, 92, 246, 0.22)", 
                      color: "transparent"
                    } as React.CSSProperties}
                  >
                    03
                  </div>
                  <div className="relative w-18 h-18 sm:w-20 sm:h-20 transition-transform duration-300">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                      <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#f1f5f9" strokeWidth="2.5" />
                      <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#8b5cf6" strokeWidth="2.5" strokeDasharray="76, 100" strokeLinecap="round" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center text-sm font-black text-slate-800">+24%</div>
                  </div>
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider font-mono">Accuracy</span>
                </div>
              </div>

              {/* Gauge Detail Explanation Box */}
              <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl h-24 flex items-center transition-all duration-300">
                {activeGauge === null ? (
                  <p className="text-xs text-slate-500 text-center font-mono uppercase tracking-wide w-full select-none">
                    💡 Hover over any gauge dial to inspect telemetry data
                  </p>
                ) : activeGauge === 0 ? (
                  <div className="space-y-1 animate-fade-in w-full text-left">
                    <p className="text-[10px] font-bold text-indigo-650 uppercase tracking-widest font-mono">Charting Speed Details</p>
                    <p className="text-xs text-slate-600 leading-normal">MedOS saves clinicians an average of 2.4 hours of documentation per day, accelerating primary SOAP drafts by 42%.</p>
                  </div>
                ) : activeGauge === 1 ? (
                  <div className="space-y-1 animate-fade-in w-full text-left">
                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest font-mono">Direct Patient Engagement</p>
                    <p className="text-xs text-slate-600 leading-normal">Allows 68% more face-to-face eye contact. Ambient microphones work in the background, eliminating typing during visits.</p>
                  </div>
                ) : (
                  <div className="space-y-1 animate-fade-in w-full text-left">
                    <p className="text-[10px] font-bold text-violet-600 uppercase tracking-widest font-mono">EHR Sync Coding Accuracy</p>
                    <p className="text-xs text-slate-600 leading-normal">Boosts billing validation and SOAP diagnostic match accuracy by 24%, lowering primary claim rejection rates.</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Right Column: Live Telemetry monitor panel & Graph (lg:col-span-7) */}
            <div className="lg:col-span-7 relative">
              <div className="bg-white text-slate-800 p-6 md:p-8 rounded-[40px] relative overflow-hidden border border-slate-100 shadow-2xl hover:shadow-indigo-100/20 hover:scale-[1.005] transition-all duration-300 font-mono space-y-6">
                
                {/* Terminal Header */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <Server className="w-4.5 h-4.5 text-indigo-600" />
                    <h4 className="text-xs font-bold text-slate-850 text-slate-800">medos-node-east</h4>
                  </div>
                  <span className="text-[9px] bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full border border-emerald-100 font-bold flex items-center gap-1.5 animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                    NODE_STABLE
                  </span>
                </div>
                
                {/* Live Console Output */}
                <div className="h-[125px] bg-slate-50 rounded-2xl border border-slate-100 p-4 font-mono text-[10px] text-indigo-700 space-y-1.5 overflow-hidden shadow-inner leading-relaxed text-left select-none">
                  {telemetryLogs.map((log, index) => (
                    <p key={index} className="truncate animate-float-up" style={{ animationDuration: "0.2s" }}>
                      <span className="text-slate-400">{log.split(" ")[0]}</span> {log.substring(log.indexOf(" ") + 1)}
                    </p>
                  ))}
                </div>

                {/* Animated Line Graph Dashboard */}
                <div className="space-y-3.5 border-t border-slate-100 pt-5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-slate-500">Documentation Efficiency Trend</span>
                    <span className="font-bold text-emerald-600 font-mono flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5" />
                      -145 min/week
                    </span>
                  </div>
                  
                  <div className="h-[120px] bg-slate-50 rounded-2xl border border-slate-100 p-4 flex items-end relative overflow-hidden">
                    <svg className="w-full h-full" viewBox="0 0 100 35" fill="none">
                      {/* Background grid lines */}
                      <line x1="0" y1="10" x2="100" y2="10" stroke="rgba(0,0,0,0.02)" strokeWidth="0.5" />
                      <line x1="0" y1="20" x2="100" y2="20" stroke="rgba(0,0,0,0.02)" strokeWidth="0.5" />
                      <line x1="0" y1="30" x2="100" y2="30" stroke="rgba(0,0,0,0.02)" strokeWidth="0.5" />
                      
                      {/* Gradient path fill */}
                      <path d="M0,32 Q20,28 40,20 T80,10 T100,5 L100,35 L0,35 Z" fill="url(#grad)" opacity="0.08" />
                      
                      {/* Active graph line */}
                      <path 
                        d="M0,32 Q20,28 40,20 T80,10 T100,5" 
                        stroke="url(#line-grad)" 
                        strokeWidth="1.5" 
                        strokeLinecap="round"
                        strokeDasharray="500"
                        strokeDashoffset="0"
                      >
                        <animate attributeName="stroke-dashoffset" values="500;0" dur="2s" repeatCount="1" />
                      </path>

                      {/* Definitions */}
                      <defs>
                        <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#10b981" />
                          <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                        </linearGradient>
                        <linearGradient id="line-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#6366f1" />
                          <stop offset="50%" stopColor="#a855f7" />
                          <stop offset="100%" stopColor="#10b981" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>
                  
                  <div className="flex justify-between text-[9px] font-mono text-slate-500 px-1 select-none">
                    <span>Mon</span>
                    <span>Tue</span>
                    <span>Wed</span>
                    <span>Thu</span>
                    <span>Fri</span>
                    <span>Sat</span>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </section>

        {/* CTA Section (Overhauled into a terminal command deploy node) */}
        <section className="py-20 px-6 md:px-8 bg-white reveal-on-scroll">
          <div className="max-w-7xl mx-auto bg-slate-950 text-white rounded-[40px] p-12 md:p-20 relative overflow-hidden shadow-2xl border border-slate-900 font-mono">
            {/* Background Subtle Gradient Glows */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-650/10 rounded-full blur-[140px]" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-violet-650/10 rounded-full blur-[140px]" />
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
              {/* Text content left */}
              <div className="text-left space-y-6 font-sans">
                <span className="inline-flex items-center gap-1.5 bg-indigo-500/10 text-indigo-400 px-3 py-1 rounded-full text-xs font-semibold border border-indigo-500/20 uppercase tracking-widest font-mono">
                  Launch Platform
                </span>
                <h2 className="font-display font-black text-3xl sm:text-4xl md:text-5xl leading-tight">
                  Ready to deploy your modern clinic console?
                </h2>
                <p className="text-slate-400 text-base leading-relaxed">
                  Start your 30-day trial deployment immediately. Integrate with your active EHR portal in under 24 hours.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <button 
                    onClick={handleNavigateToLogin}
                    className="bg-indigo-600 hover:bg-indigo-700 hover:shadow-xl hover:shadow-indigo-600/20 text-white px-8 py-4 rounded-xl text-sm font-semibold transition-all active:scale-95 cursor-pointer font-sans"
                  >
                    Initiate Deployment
                  </button>
                  <button 
                    onClick={handleNavigateToLogin}
                    className="bg-transparent border border-slate-700 hover:border-slate-500 text-slate-300 hover:bg-white/5 px-8 py-4 rounded-xl text-sm font-semibold transition-all cursor-pointer font-sans"
                  >
                    Contact Sales Eng.
                  </button>
                </div>
              </div>

              {/* Terminal screen right */}
              <div className="bg-slate-950 border border-slate-850 p-6 rounded-2xl text-[10.5px] text-slate-350 text-left space-y-2.5 relative overflow-hidden shadow-inner leading-relaxed">
                <div className="flex items-center justify-between pb-2 border-b border-slate-900 text-slate-500 uppercase tracking-widest text-[9px] font-bold">
                  <span>deploy-console-status</span>
                  <RefreshCw className="w-3 h-3 text-indigo-400 animate-spin" style={{ animationDuration: "4s" }} />
                </div>
                <p className="text-indigo-400">$ medos-admin deploy --region=us-east-1 --secure=true</p>
                <p className="text-slate-500">Connecting to EHR primary clinical endpoints...</p>
                <p className="text-emerald-500">✔ [OK] MedOS HIPAA validation key matches successfully.</p>
                <p className="text-slate-505 text-slate-500">Initializing ambient scribe NLP nodes...</p>
                <p className="text-emerald-500 font-bold">✔ [OK] Audio transcript transcription models active.</p>
                <p className="text-indigo-305 text-indigo-300 font-bold font-sans">MedOS Platform node initialized. Ready to consult (t=148ms).</p>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="bg-slate-50 border-t border-slate-100 py-16 px-6 md:px-8 transition-theme">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
          
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
                <Activity className="w-4 h-4 animate-pulse" />
              </div>
              <span className="font-display font-extrabold text-lg text-slate-900 tracking-tight font-black">MedOS AI</span>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed">
              The leading artificial intelligence platform for high-performance clinical teams.
            </p>
            <div className="flex gap-4">
              <a className="w-9 h-9 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-600 hover:text-indigo-600 shadow-sm hover:scale-110 hover:shadow-md transition-all" href="#">
                <Globe className="w-4 h-4" />
              </a>
              <a className="w-9 h-9 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-600 hover:text-indigo-600 shadow-sm hover:scale-110 hover:shadow-md transition-all" href="#">
                <Send className="w-4 h-4" />
              </a>
            </div>
          </div>

          <div>
            <h5 className="text-sm font-bold text-slate-800 mb-6 uppercase tracking-wider font-mono">Platform</h5>
            <ul className="space-y-4 text-sm text-slate-500">
              <li><a className="hover:text-indigo-600 transition-colors" href="#">AI Scribe</a></li>
              <li><a className="hover:text-indigo-655 transition-colors" href="#">Telehealth Pro</a></li>
              <li><a className="hover:text-indigo-655 transition-colors" href="#">Care Companion</a></li>
              <li><a className="hover:text-indigo-655 transition-colors" href="#">Directory Services</a></li>
            </ul>
          </div>

          <div>
            <h5 className="text-sm font-bold text-slate-800 mb-6 uppercase tracking-wider font-mono font-bold">Support</h5>
            <ul className="space-y-4 text-sm text-slate-500">
              <li><a className="hover:text-indigo-600 transition-colors" href="#">Help Center</a></li>
              <li><a className="hover:text-indigo-655 transition-colors" href="#">API Documentation</a></li>
              <li><a className="hover:text-indigo-655 transition-colors" href="#">HIPAA Policy</a></li>
              <li><a className="hover:text-indigo-655 transition-colors" href="#">Contact Sales</a></li>
            </ul>
          </div>

          <div>
            <h5 className="text-sm font-bold text-slate-800 mb-6 uppercase tracking-wider font-mono font-bold">Newsletter</h5>
            <p className="text-sm text-slate-505 text-slate-500 mb-4 leading-relaxed">
              Stay updated with clinical AI research.
            </p>
            <div className="flex gap-2">
              <input 
                className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 w-full focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none text-sm transition-all" 
                placeholder="Email address" 
                type="email"
              />
              <button className="bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-xl transition-all cursor-pointer shadow-sm hover:shadow-md">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>
        
        <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-slate-200/60 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} MedOS AI Platform. All rights reserved.</p>
          <div className="flex gap-8">
            <a className="hover:text-indigo-600 transition-colors" href="#">Privacy Policy</a>
            <a className="hover:text-indigo-655 hover:text-indigo-600 transition-colors" href="#">Terms of Service</a>
            <a className="hover:text-indigo-655 hover:text-indigo-600 transition-colors" href="#">Security Standard</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
