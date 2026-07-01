"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { 
  Shield, Activity, Sparkles, Heart, Calendar, 
  Video, MessageSquare, ArrowRight, CheckCircle, 
  Mic, Users, TrendingUp, Send, Globe
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

  return (
    <div className="min-h-screen bg-slate-50/30 text-slate-800 overflow-x-hidden font-sans relative">
      
      {/* TopAppBar Navigation */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 md:px-8 h-20 flex justify-between items-center w-full">
          <div className="flex items-center gap-10">
            <div className="flex items-center gap-2.5 group cursor-pointer">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-indigo-600/20 group-hover:scale-105 transition-transform">
                <Activity className="w-5.5 h-5.5 animate-pulse" />
              </div>
              <span className="font-display font-extrabold text-xl text-slate-900 tracking-tight">
                MedOS <span className="text-indigo-600 font-medium">AI</span>
              </span>
            </div>
            <nav className="hidden md:flex gap-8 items-center">
              <a className="text-sm font-semibold text-indigo-600 border-b-2 border-indigo-600 py-2.5 transition-all" href="#">Home</a>
              <a className="text-sm font-medium text-slate-500 hover:text-slate-900 hover:scale-[1.02] py-2.5 transition-all" href="#solutions">Solutions</a>
              <a className="text-sm font-medium text-slate-500 hover:text-slate-905 hover:scale-[1.02] py-2.5 transition-all" href="#metrics">Metrics</a>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={handleNavigateToLogin}
              className="bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-600/10 hover:-translate-y-0.5 text-white px-5.5 py-2.5 rounded-xl font-semibold text-sm transition-all active:scale-95 cursor-pointer"
            >
              Sign In
            </button>
          </div>
        </div>
      </header>

      <main className="relative">
        
        {/* Hero Section */}
        <section className="relative min-h-[900px] flex flex-col items-center px-6 md:px-8 overflow-hidden pt-16 pb-28 bg-gradient-to-b from-indigo-50/40 via-white to-white">
          
          {/* Centered Typography Header */}
          <div className="max-w-4xl mx-auto text-center flex flex-col items-center gap-6 animate-fade-in relative z-20">
            <span className="inline-flex items-center gap-1.5 bg-indigo-55 bg-indigo-50 text-indigo-700 px-4 py-1.5 rounded-full text-xs font-semibold border border-indigo-100 animate-float">
              <Sparkles className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: "3s" }} />
              Introducing v4.0 Platform
            </span>
            <h1 className="font-display font-black text-4xl sm:text-6xl lg:text-7xl text-slate-905 leading-[1.05] tracking-tight">
              The Future of <br/>
              <span className="bg-gradient-to-r from-indigo-600 via-violet-605 via-violet-600 to-purple-600 bg-clip-text text-transparent">Medical Intelligence</span>
            </h1>
            <p className="text-slate-600 text-lg sm:text-xl leading-relaxed max-w-2xl mt-2">
              Precise diagnostics, ambient SOAP note transcription, and empathetic care. MedOS AI bridges the gap between complex clinical data and meaningful patient outcomes.
            </p>
            <div className="flex flex-wrap justify-center gap-4 mt-2">
              <button 
                onClick={handleNavigateToLogin}
                className="bg-indigo-600 hover:bg-indigo-700 hover:shadow-xl hover:shadow-indigo-600/20 text-white px-8 py-4 rounded-xl font-semibold text-sm hover:-translate-y-0.5 transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
              >
                Get Started
                <ArrowRight className="w-4 h-4" />
              </button>
              <button 
                onClick={handleNavigateToLogin}
                className="bg-white text-slate-705 text-slate-700 hover:text-slate-900 hover:bg-slate-50 hover:shadow-md px-8 py-4 rounded-xl border border-slate-200 font-semibold text-sm hover:-translate-y-0.5 transition-all cursor-pointer"
              >
                View Demo
              </button>
            </div>
          </div>

          {/* Futuristic 3D Overlapping Console Showcase */}
          <div className="w-full max-w-5xl mx-auto mt-20 relative px-4 flex justify-center items-center select-none">
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
                      <div className="w-10 h-10 rounded-full bg-indigo-55 bg-indigo-50 border border-indigo-100 flex items-center justify-center font-bold text-indigo-650">
                        JD
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-800">John Doe</h4>
                        <p className="text-[10px] text-slate-500">ID: #4010-P</p>
                      </div>
                    </div>
                    <div className="space-y-2 border-t border-slate-100 pt-3">
                      <div className="flex justify-between text-[10px]">
                        <span className="text-slate-500">Age / Gender</span>
                        <span className="font-semibold text-slate-700">42 / Male</span>
                      </div>
                      <div className="flex justify-between text-[10px]">
                        <span className="text-slate-500">Blood Type</span>
                        <span className="font-semibold text-slate-700">O Positive</span>
                      </div>
                      <div className="flex justify-between text-[10px]">
                        <span className="text-slate-500">Primary Ins.</span>
                        <span className="font-semibold text-slate-700">MedShield</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold font-mono">Active Consultation</span>
                    <div className="bg-indigo-600/5 border border-indigo-50 p-2.5 rounded-xl flex items-center gap-3">
                      <div className="w-2.5 h-2.5 rounded-full bg-indigo-650 animate-ping shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold text-slate-800 truncate">Telehealth Visit</p>
                        <p className="text-[9px] text-indigo-600 font-medium">Connecting (WebRTC)</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Column 2 & 3: Clinical Workspace */}
                <div className="col-span-2 bg-slate-50/50 border border-slate-100 rounded-2xl p-4 flex flex-col justify-between overflow-hidden relative">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <span className="text-xs font-bold text-slate-800">Clinical Consultation Notes</span>
                    <span className="text-[10px] bg-slate-150 px-2 py-0.5 rounded-full text-slate-500 font-medium">SOAP Format</span>
                  </div>
                  
                  <div className="flex-1 py-4 font-mono text-[10.5px] text-slate-600 space-y-3 overflow-y-auto leading-relaxed">
                    <p><span className="text-indigo-650 font-bold">SUBJECTIVE:</span> Patient reports persistent dry cough and slight shortness of breath when exercising for past 4 days. No fever, sore throat, or chest pain.</p>
                    <p><span className="text-indigo-650 font-bold">OBJECTIVE:</span> Lungs clear to auscultation bilaterally. Heart rate and rhythm regular. Blood pressure 122/80 mmHg. SpO2 at 98% room air.</p>
                    <p><span className="text-indigo-650 font-bold">ASSESSMENT:</span> Mild acute bronchitis. Rule out secondary infection. Recommend rest and hydration.</p>
                  </div>
                  
                  <div className="bg-white border border-slate-100 p-2 rounded-xl flex items-center justify-between text-[10px]">
                    <span className="text-slate-500">Auto-save completed 1 min ago</span>
                    <button className="bg-indigo-50 hover:bg-indigo-100 text-indigo-750 text-indigo-700 px-3 py-1 rounded-lg font-semibold transition-all">
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
                  <span className="text-xs font-bold text-slate-800">Ambient AI Recorder</span>
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
                <div className="w-1.5 h-5 bg-indigo-650 rounded animate-pulse" style={{ animationDuration: "0.65s" }} />
              </div>
              <p className="text-[10px] text-slate-500 italic leading-relaxed">
                "Shortness of breath for past 4 days, especially when climbing stairs..."
              </p>
              <div className="mt-3.5 pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Status</span>
                <span className="text-[9px] bg-emerald-50 text-emerald-600 font-semibold px-2 py-0.5 rounded-full border border-emerald-100">Transcribing</span>
              </div>
            </div>

            {/* FLOATING WIDGET 2: Vitals / ECG Monitor (Overlapping Top Right) */}
            <div className="absolute -top-10 -right-6 md:-right-12 bg-white/95 backdrop-blur-md border border-slate-100 p-4 rounded-2xl shadow-xl shadow-slate-150 max-w-[280px] z-30 animate-float group hover:-translate-y-1.5 transition-transform duration-300" style={{ animationDelay: "1.5s" }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center border border-emerald-100">
                    <Heart className="w-3.5 h-3.5 animate-pulse" />
                  </div>
                  <span className="text-xs font-bold text-slate-800">Diagnostics Hub</span>
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
                <p className="font-bold text-xs text-slate-800 leading-none">HIPAA Compliant Platform</p>
                <p className="text-[9px] text-slate-500 mt-1 uppercase font-semibold tracking-wider">AES-256 Encrypted &amp; Secure</p>
              </div>
            </div>

          </div>
        </section>

        {/* Feature Grid (Bento Style) */}
        <section id="solutions" className="py-24 px-6 md:px-8 bg-slate-50/50 border-y border-slate-100 reveal-on-scroll">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16 space-y-3">
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Platform Features</span>
              <h2 className="font-display font-black text-3xl sm:text-4xl text-slate-900 leading-tight">Integrated Clinical Units</h2>
              <p className="text-slate-500 max-w-xl mx-auto text-base">
                One unified platform for the modern healthcare professional, built with the Single-Unit UX philosophy.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              
              {/* AI Ambient Scribe */}
              <div className="md:col-span-2 group bg-white p-8 rounded-3xl hover:border-indigo-200 border border-slate-100 transition-all duration-300 flex flex-col justify-between overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1">
                <div className="flex justify-between items-start">
                  <div className="space-y-4">
                    <div className="w-14 h-14 bg-indigo-50 text-indigo-650 rounded-2xl flex items-center justify-center border border-indigo-100 group-hover:scale-110 transition-transform">
                      <Mic className="w-7 h-7" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800">AI Ambient Scribe</h3>
                    <p className="text-slate-655 text-sm leading-relaxed max-w-md">
                      Automatically captures consultation transcripts and generates structured SOAP notes, allowing you to focus entirely on the patient.
                    </p>
                  </div>
                  <img 
                    className="w-36 h-36 object-contain opacity-90 group-hover:scale-105 transition-transform duration-300 hidden sm:block" 
                    alt="Sound waves illustration"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCqje0ZB7qky8-eUKV-_n0VDYaokBkp7QHRDc4U51RvyHy0fA6p-L6l2xyLM2rF3_YKdLplbrz0tYW8SsmGpQg7oLgtE9E0YvhHQ4xxWRdp3xlvMlakBHlSt-qJSwID-e_GIfuyZWe8vifECZ3FMXQVbWJAsEWWkhW5c7wvjMaNuVf9TkHGL1yIdif8fBIrlW278EU-_K7gGHcN6nm3g6Dp4twadlsagXb949S6AAgwLO0TWGIfheIJLtQ7xo4LHX_mzdb-uwHaePyE"
                  />
                </div>
                <div className="mt-8 flex flex-wrap gap-3">
                  <span className="bg-slate-50 text-slate-600 px-3 py-1 rounded-full text-xs font-semibold border border-slate-100">NLP-Powered</span>
                  <span className="bg-slate-50 text-slate-600 px-3 py-1 rounded-full text-xs font-semibold border border-slate-100">EHR Integrated</span>
                </div>
              </div>

              {/* Secure Telehealth */}
              <div className="group bg-white p-8 rounded-3xl hover:border-amber-200 border border-slate-100 transition-all duration-300 space-y-6 shadow-sm hover:shadow-xl hover:-translate-y-1">
                <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center border border-amber-100 group-hover:scale-110 transition-transform">
                  <Video className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-slate-800">Secure Telehealth</h3>
                <p className="text-slate-655 text-sm leading-relaxed">
                  HIPAA-compliant WebRTC rooms with crystal-clear audio-video and low-latency diagnostic streaming.
                </p>
                <div className="pt-4 border-t border-slate-100">
                  <a className="text-indigo-650 hover:text-indigo-850 text-indigo-650 font-semibold text-sm flex items-center gap-1 group/link transition-colors" href="#">
                    Explore Telehealth 
                    <ArrowRight className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
                  </a>
                </div>
              </div>

              {/* Smart Clinic Directory */}
              <div className="group bg-white p-8 rounded-3xl hover:border-emerald-200 border border-slate-100 transition-all duration-300 space-y-6 shadow-sm hover:shadow-xl hover:-translate-y-1">
                <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center border border-emerald-100 group-hover:scale-110 transition-transform">
                  <Users className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-slate-800">Clinic Directory</h3>
                <p className="text-slate-655 text-sm leading-relaxed font-normal">
                  Hyper-accurate filtering for specialists by proximity, insurance provider, and live availability.
                </p>
                <div className="w-full h-32 bg-slate-50 rounded-2xl overflow-hidden mt-4 border border-slate-100 relative group-hover:scale-[1.01] transition-transform">
                  <div 
                    className="w-full h-full bg-cover bg-center opacity-90 group-hover:scale-105 transition-transform duration-500" 
                    style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuB4WDBEkx3nPHXpLyTMb0d9tR2pZL0ikzB5vSlA-A6a6GZUMmDRrJj62Mfcm6WWguNmtcLUW4SIiwv5hz8po6uFRrVW-wtcBs_yikXlZmTIS-wUfYK_RrBHmsrsknsmWqZDZEqb8VoOfpm0f1D5DCOeZLzC02QsPDyVVuaGVvNJt6R5VCaUG-IN2fcT8ZtUVX18ZfAbgJYdNvxhkHApvvPVAj9jyWkpC0y-Vg4rdZdkliGQZzUYptaA3TjWhLJafG2DzGWJITwhTv_A')" }}
                  />
                </div>
              </div>

              {/* Care Companion */}
              <div className="md:col-span-2 group bg-white p-8 rounded-3xl hover:border-indigo-200 border border-slate-100 transition-all duration-300 flex flex-col md:flex-row gap-8 items-center shadow-sm hover:shadow-xl hover:-translate-y-1">
                <div className="flex-1 space-y-6">
                  <div className="w-14 h-14 bg-indigo-50 text-indigo-650 rounded-2xl flex items-center justify-center border border-indigo-100 group-hover:scale-110 transition-transform">
                    <MessageSquare className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800">Care Companion</h3>
                  <p className="text-slate-655 text-sm leading-relaxed">
                    An empathetic post-visit AI chat helping patients understand recovery plans and manage medication schedules seamlessly.
                  </p>
                  <button 
                    onClick={handleNavigateToLogin}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-semibold text-xs shadow-sm hover:shadow-md transition-all cursor-pointer"
                  >
                    Learn About Companion
                  </button>
                </div>
                
                <div className="flex-1 w-full bg-slate-50 rounded-2xl p-6 relative overflow-hidden h-64 border border-slate-100 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="bg-white p-3 rounded-2xl rounded-bl-none shadow-sm max-w-[85%] text-slate-700 text-xs border border-slate-100">
                      How should I take my recovery medication?
                    </div>
                    <div className="bg-indigo-600 text-white p-3 rounded-2xl rounded-br-none shadow-sm ml-auto max-w-[85%] text-xs">
                      Please take 1 tablet with food twice daily...
                    </div>
                  </div>
                  <div className="flex justify-center pt-4">
                    <div className="w-12 h-1 bg-indigo-200 rounded-full animate-pulse" />
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* Trust & Analytics Section */}
        <section id="metrics" className="py-24 px-6 md:px-8 bg-white reveal-on-scroll">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            
            <div className="space-y-8">
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest font-mono">Performance Impact</span>
              <h2 className="font-display font-black text-3xl sm:text-4xl text-slate-900 leading-tight">Measurable Clinical Efficiency</h2>
              <p className="text-slate-600 text-base leading-relaxed">
                MedOS AI isn't just about features; it's about reclaiming time for patient care. Our clinical partners report significant improvements in daily workflow.
              </p>
              
              <div className="space-y-6">
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm font-semibold text-slate-700">
                    <span>Documentation Speed</span>
                    <span className="text-indigo-600 font-bold">+42%</span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-600 rounded-full transition-all duration-1000" style={{ width: "82%" }} />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm font-semibold text-slate-700">
                    <span>Patient Engagement</span>
                    <span className="text-emerald-600 font-bold">+68%</span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000" style={{ width: "91%" }} />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm font-semibold text-slate-700">
                    <span>Diagnostic Accuracy</span>
                    <span className="text-indigo-600 font-bold">+24%</span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full transition-all duration-1000" style={{ width: "76%" }} />
                  </div>
                </div>

              </div>
            </div>
            
            <div className="relative">
              <div className="bg-slate-50 p-8 rounded-[40px] relative overflow-hidden border border-slate-100 shadow-xl hover:shadow-2xl transition-shadow duration-300">
                <div className="flex items-center justify-between mb-8">
                  <h4 className="text-lg font-bold text-slate-800">System Performance</h4>
                  <span className="text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full flex items-center gap-1 text-xs font-semibold">
                    <TrendingUp className="w-3.5 h-3.5 animate-bounce" />
                    Live Data
                  </span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="bg-white p-6 rounded-2xl border border-slate-100 hover:scale-[1.02] transition-transform">
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-bold">Clinicians Active</p>
                    <p className="text-3xl font-black text-indigo-600 mt-2">12,480</p>
                  </div>
                  <div className="bg-white p-6 rounded-2xl border border-slate-100 hover:scale-[1.02] transition-transform">
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-bold">Patient Sessions</p>
                    <p className="text-3xl font-black text-slate-800 mt-2">1.2M+</p>
                  </div>
                  <div className="sm:col-span-2 bg-indigo-50/30 p-6 rounded-2xl border border-indigo-50 flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-600 text-white rounded-xl flex items-center justify-center shrink-0 shadow-md shadow-indigo-600/10">
                      <Shield className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-850 font-bold">Enterprise Encryption</p>
                      <p className="text-xs text-slate-500 mt-0.5">AES-256 Bit Data Protection Standard</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-6 md:px-8 bg-white reveal-on-scroll">
          <div className="max-w-7xl mx-auto bg-indigo-900 rounded-[40px] p-12 md:p-20 relative overflow-hidden text-center text-white shadow-2xl">
            {/* Background Subtle Glows */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600 opacity-20 blur-[120px]" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-violet-600 opacity-20 blur-[120px]" />
            
            <div className="relative z-10 space-y-6">
              <h2 className="font-display font-black text-3xl sm:text-4xl md:text-5xl max-w-3xl mx-auto leading-tight">
                Ready to join the modern clinic?
              </h2>
              <p className="text-indigo-100 text-base max-w-xl mx-auto opacity-90">
                Start your 30-day free trial today. No complex integration required. Deployment in under 24 hours.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-6">
                <button 
                  onClick={handleNavigateToLogin}
                  className="w-full sm:w-auto bg-white hover:bg-slate-50 text-indigo-900 hover:shadow-xl hover:shadow-white/5 px-8 py-4 rounded-xl text-sm font-semibold transition-all active:scale-95 cursor-pointer"
                >
                  Get Started Now
                </button>
                <button 
                  onClick={handleNavigateToLogin}
                  className="w-full sm:w-auto bg-transparent border border-white/20 hover:border-white/50 text-white hover:bg-white/10 px-8 py-4 rounded-xl text-sm font-semibold transition-all cursor-pointer"
                >
                  Schedule a Demo
                </button>
              </div>
              <p className="text-xs text-indigo-200/70 pt-4">
                Trusted by over 450+ medical institutions worldwide.
              </p>
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
              <span className="font-display font-extrabold text-lg text-slate-900 tracking-tight">MedOS AI</span>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed">
              The leading artificial intelligence platform for high-performance clinical teams.
            </p>
            <div className="flex gap-4">
              <a className="w-9 h-9 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-655 hover:text-indigo-600 shadow-sm hover:scale-110 hover:shadow-md transition-all" href="#">
                <Globe className="w-4 h-4" />
              </a>
              <a className="w-9 h-9 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-655 hover:text-indigo-600 shadow-sm hover:scale-110 hover:shadow-md transition-all" href="#">
                <Send className="w-4 h-4" />
              </a>
            </div>
          </div>

          <div>
            <h5 className="text-sm font-bold text-slate-800 mb-6 uppercase tracking-wider font-mono">Platform</h5>
            <ul className="space-y-4 text-sm text-slate-500">
              <li><a className="hover:text-indigo-600 transition-colors" href="#">AI Scribe</a></li>
              <li><a className="hover:text-indigo-600 transition-colors" href="#">Telehealth Pro</a></li>
              <li><a className="hover:text-indigo-600 transition-colors" href="#">Care Companion</a></li>
              <li><a className="hover:text-indigo-600 transition-colors" href="#">Directory Services</a></li>
            </ul>
          </div>

          <div>
            <h5 className="text-sm font-bold text-slate-800 mb-6 uppercase tracking-wider font-mono">Support</h5>
            <ul className="space-y-4 text-sm text-slate-500">
              <li><a className="hover:text-indigo-600 transition-colors" href="#">Help Center</a></li>
              <li><a className="hover:text-indigo-600 transition-colors" href="#">API Documentation</a></li>
              <li><a className="hover:text-indigo-600 transition-colors" href="#">HIPAA Policy</a></li>
              <li><a className="hover:text-indigo-600 transition-colors" href="#">Contact Sales</a></li>
            </ul>
          </div>

          <div>
            <h5 className="text-sm font-bold text-slate-800 mb-6 uppercase tracking-wider font-mono">Newsletter</h5>
            <p className="text-sm text-slate-500 mb-4 leading-relaxed">
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
            <a className="hover:text-indigo-650 transition-colors" href="#">Privacy Policy</a>
            <a className="hover:text-indigo-655 hover:text-indigo-600 transition-colors" href="#">Terms of Service</a>
            <a className="hover:text-indigo-655 hover:text-indigo-600 transition-colors" href="#">Security Standard</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
