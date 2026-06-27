"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { 
  Shield, Activity, Sparkles, Heart, Calendar, 
  Video, MessageSquare, Lock, ArrowRight, CheckCircle, AlertCircle
} from "lucide-react";

export default function WelcomePage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  
  // Auth Form State
  const [activeTab, setActiveTab] = useState<"patient" | "doctor">("patient");
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email.trim() || !password.trim()) {
      setErrorMsg("Please fill out all email and password parameters.");
      return;
    }

    if (authMode === "register" && !name.trim()) {
      setErrorMsg("Full name is required during registration.");
      return;
    }

    setLoading(true);
    try {
      if (authMode === "register") {
        // Sign up downstream
        const response = await fetch("http://localhost:8000/api/v1/public/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            email,
            password,
            role: activeTab === "patient" ? "Patient" : "Doctor"
          })
        });

        const data = await response.json();
        setLoading(false);

        if (!response.ok) {
          setErrorMsg(data.detail || "Registration failed.");
          return;
        }

        // Cache Zustand & redirect
        setAuth(data.token, data.user);
        setSuccessMsg("Account successfully created!");
        setTimeout(() => {
          router.push(data.user.role === "Doctor" ? "/doctor/dashboard" : "/");
        }, 800);
      } else {
        // Sign in downstream
        const response = await fetch("http://localhost:8000/api/v1/public/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password })
        });

        const data = await response.json();
        setLoading(false);

        if (!response.ok) {
          setErrorMsg(data.detail || "Authentication credentials invalid.");
          return;
        }

        // Enforce portal roles
        if (activeTab === "doctor" && data.user.role !== "Doctor") {
          setErrorMsg("Patient credentials cannot access the Physician Dashboard.");
          return;
        }
        if (activeTab === "patient" && data.user.role === "Doctor") {
          setErrorMsg("Physician credentials must log in through Doctor portal.");
          return;
        }

        setAuth(data.token, data.user);
        setSuccessMsg("Login successful!");
        setTimeout(() => {
          router.push(data.user.role === "Doctor" ? "/doctor/dashboard" : "/");
        }, 800);
      }
    } catch (err) {
      setLoading(false);
      setErrorMsg("Failed to establish server connection. Check API Gateway status.");
    }
  };

  // Mock SSO trigger (Google/Facebook) - Log in using a standard seeded account
  const handleMockSSO = async (ssoType: "google" | "facebook") => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const email = activeTab === "doctor" ? "alice.heart@medical.com" : "john.doe@email.com";
      const response = await fetch("http://localhost:8000/api/v1/public/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }) // Calls email-only fallback simulated SSO logic
      });

      const data = await response.json();
      setLoading(false);

      if (!response.ok) {
        setErrorMsg("Failed to authorize simulated SSO credentials.");
        return;
      }

      setAuth(data.token, data.user);
      setSuccessMsg(`Simulated ${ssoType === "google" ? "Google" : "Facebook"} OAuth successful!`);
      setTimeout(() => {
        router.push(data.user.role === "Doctor" ? "/doctor/dashboard" : "/");
      }, 800);
    } catch (err) {
      setLoading(false);
      setErrorMsg("SSO validation failed. Gateway is unreachable.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between overflow-hidden relative selection:bg-teal-500 selection:text-slate-950">
      
      {/* Background visual glow blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-teal-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] bg-indigo-500/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Header Bar */}
      <header className="w-full max-w-7xl mx-auto px-6 py-6 flex justify-between items-center z-10">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-gradient-to-br from-teal-400 to-teal-600 rounded-xl flex items-center justify-center border border-teal-400/25 shadow-lg shadow-teal-500/10">
            <Heart className="w-5 h-5 text-slate-950 fill-slate-950" />
          </div>
          <h1 className="text-lg font-black tracking-tight bg-gradient-to-r from-teal-400 to-emerald-300 bg-clip-text text-transparent">
            HealthCenter
          </h1>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold bg-slate-900/60 border border-slate-800 rounded-full px-4 py-1.5 backdrop-blur-md">
          <Shield className="w-3.5 h-3.5 text-teal-400" />
          HIPAA & PIPEDA Secure
        </div>
      </header>

      {/* Main Grid Hero Body */}
      <main className="w-full max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center z-10 flex-1 py-6 md:py-12">
        
        {/* Left Side: Brand Marketing & Features */}
        <section className="lg:col-span-7 space-y-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-xs font-bold text-teal-400 uppercase tracking-widest">
              <Activity className="w-3 h-3" /> Introducing Platform V2
            </div>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black leading-tight tracking-tight text-slate-100">
              Next-Gen Medical <br/>
              <span className="bg-gradient-to-r from-teal-400 via-teal-300 to-indigo-400 bg-clip-text text-transparent">
                Scheduling & Scribe
              </span>
            </h2>
            <p className="text-slate-400 text-sm md:text-base leading-relaxed max-w-xl">
              Discover local specialists, join high-fidelity virtual consultation rooms, and converse with state-of-the-art AI care companions powered by ambient note-taking pipelines.
            </p>
          </div>

          {/* Platform Flagship Features Listing */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
            
            {/* Feature 1 */}
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 hover:border-slate-700/60 hover:bg-slate-900/60 transition-all duration-300 shadow-lg">
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 mb-3.5 shadow-inner">
                <Calendar className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-200">Doctor Directory & Search</h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Filter by specialty, zip code location, and rolling matrices to book appointments in seconds.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 hover:border-slate-700/60 hover:bg-slate-900/60 transition-all duration-300 shadow-lg">
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 mb-3.5 shadow-inner">
                <Video className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-200">Telehealth Video Rooms</h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Secure virtual consultations with real-time text chats and automated HIPAA privacy access blocks.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 hover:border-slate-700/60 hover:bg-slate-900/60 transition-all duration-300 shadow-lg">
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 mb-3.5 shadow-inner">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-200">Ambient AI Clinical Scribe</h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Transcribes audio transcripts and structures them into SOAP doctor clinical notes instantly.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 hover:border-slate-700/60 hover:bg-slate-900/60 transition-all duration-300 shadow-lg">
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 mb-3.5 shadow-inner">
                <MessageSquare className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-200">AI Care Companion Chat</h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Review care directions, retrieve safety guidelines, and escalate triage concerns via secure chats.
              </p>
            </div>

          </div>
        </section>

        {/* Right Side: Authentication Control Card */}
        <section className="lg:col-span-5 flex justify-center">
          <div className="w-full max-w-md bg-slate-900/70 border border-slate-800 rounded-3xl p-6 md:p-8 backdrop-blur-xl shadow-2xl space-y-6 flex flex-col justify-between">
            
            {/* Tab Toggles: Patient vs Doctor Portal */}
            <div>
              <div className="grid grid-cols-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => { setActiveTab("patient"); setErrorMsg(null); setSuccessMsg(null); }}
                  className={`py-2 rounded-xl text-xs font-bold transition-all ${
                    activeTab === "patient" 
                      ? "bg-teal-500 text-slate-950" 
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Patient Portal
                </button>
                <button
                  type="button"
                  onClick={() => { setActiveTab("doctor"); setErrorMsg(null); setSuccessMsg(null); }}
                  className={`py-2 rounded-xl text-xs font-bold transition-all ${
                    activeTab === "doctor" 
                      ? "bg-teal-500 text-slate-950" 
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Physician Access
                </button>
              </div>
            </div>

            {/* Title / Description */}
            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-slate-100">
                {authMode === "login" ? "Welcome Back" : "Register Credentials"}
              </h3>
              <p className="text-xs text-slate-500">
                {activeTab === "doctor" 
                  ? "Access the doctor EHR queue and scribe tools" 
                  : "Book calls, search providers, and chat with care bot"
                }
              </p>
            </div>

            {/* Error/Success alerts */}
            {errorMsg && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs px-4 py-3 rounded-2xl flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}
            {successMsg && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs px-4 py-3 rounded-2xl flex items-start gap-2">
                <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Authentication Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {authMode === "register" && (
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-teal-500 text-sm transition-all"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder={activeTab === "doctor" ? "alice.heart@medical.com" : "john.doe@email.com"}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-teal-500 text-sm transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-teal-500 text-sm transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 disabled:opacity-50 text-slate-950 font-bold text-sm rounded-2xl shadow-lg shadow-teal-500/10 flex items-center justify-center gap-1.5 transition-all mt-6"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    {authMode === "login" ? "Authenticate Portal" : "Register Credentials"}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

            </form>

            {/* Tab switch logic */}
            <div className="text-center text-xs">
              <span className="text-slate-500">
                {authMode === "login" ? "New to the platform?" : "Already registered?"}
              </span>{" "}
              <button
                type="button"
                onClick={() => { setAuthMode(authMode === "login" ? "register" : "login"); setErrorMsg(null); setSuccessMsg(null); }}
                className="text-teal-400 hover:text-teal-300 font-bold hover:underline transition-all"
              >
                {authMode === "login" ? "Create Account" : "Sign In Here"}
              </button>
            </div>

            {/* Divider */}
            <div className="relative flex items-center">
              <div className="flex-grow border-t border-slate-800"></div>
              <span className="flex-shrink mx-3 text-[10px] text-slate-500 font-bold uppercase tracking-widest">Or Access Sandbox Demo</span>
              <div className="flex-grow border-t border-slate-800"></div>
            </div>

            {/* SSO / OAuth Simulated Triggers */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleMockSSO("google")}
                className="bg-slate-950 hover:bg-slate-850 border border-slate-800 rounded-2xl py-3 text-xs text-slate-300 font-semibold flex items-center justify-center gap-2 transition-all"
              >
                {/* SVG Google icon */}
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.24 10.285V13.4h6.887C18.2 15.614 15.645 18 12.24 18c-3.86 0-7-3.14-7-7s3.14-7 7-7c1.7 0 3.3.6 4.5 1.7l2.42-2.42C17.3 1.5 14.9 0 12.24 0 5.58 0 0 5.58 0 12.24s5.58 12.24 12.24 12.24c6.9 0 11.5-4.86 11.5-11.72 0-.78-.08-1.37-.2-1.98H12.24z"/>
                </svg>
                Google SSO
              </button>
              <button
                type="button"
                onClick={() => handleMockSSO("facebook")}
                className="bg-slate-950 hover:bg-slate-850 border border-slate-800 rounded-2xl py-3 text-xs text-slate-300 font-semibold flex items-center justify-center gap-2 transition-all"
              >
                {/* SVG Facebook icon */}
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                Facebook SSO
              </button>
            </div>

          </div>
        </section>

      </main>

      {/* Footer Branding */}
      <footer className="w-full max-w-7xl mx-auto px-6 py-6 border-t border-slate-900/60 text-center text-[10px] text-slate-600 z-10 flex flex-col md:flex-row justify-between gap-3">
        <p>© {new Date().getFullYear()} HealthCenter Inc. All rights reserved. HIPAA & HITECH Compliant.</p>
        <div className="flex justify-center gap-4">
          <span className="hover:text-slate-400 cursor-pointer">Terms of Service</span>
          <span className="hover:text-slate-400 cursor-pointer">Privacy Policy</span>
          <span className="hover:text-slate-400 cursor-pointer">Security Disclosures</span>
        </div>
      </footer>

    </div>
  );
}
