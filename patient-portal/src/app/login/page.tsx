"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { 
  Shield, Activity, Sparkles, Heart, CheckCircle, 
  AlertCircle, Loader2, Globe, Send, Eye, EyeOff
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { setAuth, token, user } = useAuthStore();
  
  // Auth Form State
  const [activeTab, setActiveTab] = useState<"patient" | "doctor">("patient");
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [showPassword, setShowPassword] = useState(false);
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Redirect if already logged in
  useEffect(() => {
    if (token && user) {
      router.push(user.role === "Doctor" ? "/doctor/dashboard" : "/");
    }
  }, [token, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email.trim() || !password.trim()) {
      setErrorMsg("Please fill out all email and password fields.");
      return;
    }

    if (authMode === "register" && !name.trim()) {
      setErrorMsg("Full name is required during registration.");
      return;
    }

    setLoading(true);
    try {
      if (authMode === "register") {
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

        setAuth(data.token, data.user);
        setSuccessMsg("Account successfully created!");
        setTimeout(() => {
          router.push(data.user.role === "Doctor" ? "/doctor/dashboard" : "/");
        }, 800);
      } else {
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

  const handleMockSSO = async (ssoType: "google" | "facebook") => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const email = activeTab === "doctor" ? "alice.heart@medical.com" : "john.doe@email.com";
      const response = await fetch("http://localhost:8000/api/v1/public/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
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
    <div className="min-h-screen bg-background text-foreground flex h-screen overflow-hidden font-body-md transition-theme">
      
      {/* Left Side: Immersive Visual Visuals */}
      <section className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-medical-blue-dark h-full select-none">
        <img 
          alt="Clinical Environment Backdrop" 
          className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-50 scale-105 hover:scale-100 transition-transform duration-1000 ease-out" 
          src="/clinical_bg.png"
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-medical-blue-dark/90 via-medical-blue-dark/25 to-transparent pointer-events-none" />
        
        <div className="relative z-10 p-16 flex flex-col justify-between h-full w-full">
          <div>
            <div 
              onClick={() => router.push("/welcome")}
              className="flex items-center gap-3 mb-12 cursor-pointer group"
            >
              <div className="bg-white/10 backdrop-blur-md p-2.5 rounded-xl border border-white/20 shadow-inner group-hover:scale-105 transition-transform">
                <Heart className="w-6 h-6 text-white fill-white" />
              </div>
              <span className="font-headline text-2xl font-black text-white tracking-tight">MedOS AI</span>
            </div>
          </div>

          <div className="max-w-md animate-float-up">
            <h2 className="font-headline text-5xl font-extrabold text-white leading-tight mb-6 tracking-tight">
              Redefining medical precision with AI.
            </h2>
            <p className="text-white/80 text-lg font-light leading-relaxed">
              Trusted by over 450 clinical institutions worldwide to deliver faster diagnostics and more empathetic patient care.
            </p>
            
            <div className="mt-12 flex gap-8">
              <div>
                <div className="text-white text-2xl font-black tracking-tight">99.9%</div>
                <div className="text-white/60 text-xs mt-0.5 font-bold uppercase tracking-wider">Accuracy Rate</div>
              </div>
              <div className="w-px h-10 bg-white/20 self-center" />
              <div>
                <div className="text-white text-2xl font-black tracking-tight">12M+</div>
                <div className="text-white/60 text-xs mt-0.5 font-bold uppercase tracking-wider">Patients Served</div>
              </div>
            </div>
          </div>

          <div className="text-white/45 text-xs">
            © {new Date().getFullYear()} MedOS AI Technologies. All rights reserved. HIPAA Secure Gate.
          </div>
        </div>
      </section>

      {/* Right Side: Authentication Area Form */}
      <section className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 bg-card-bg overflow-y-auto h-full">
        <div className="w-full max-w-[420px] animate-float-up space-y-8 py-8">
          
          {/* Mobile Header Only */}
          <div className="lg:hidden flex flex-col items-center mb-4">
            <div 
              onClick={() => router.push("/welcome")}
              className="bg-primary-container p-3 rounded-2xl mb-4 shadow-md shadow-primary-container/10 cursor-pointer"
            >
              <Heart className="w-6 h-6 text-white fill-white" />
            </div>
            <h1 className="font-headline text-2xl font-black text-foreground">MedOS AI</h1>
          </div>

          <div className="space-y-2">
            <h2 className="font-headline text-3.5xl font-black text-foreground tracking-tight">
              {authMode === "login" ? "Welcome back" : "Establish Profile"}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
              {authMode === "login" 
                ? "Please enter your details to sign in to your portal."
                : "Create your credentials to join our healthcare network."
              }
            </p>
          </div>

          {/* Role Switcher Sliding Pill */}
          <div className="relative flex bg-sidebar-bg border border-card-border p-1.5 rounded-full" id="role-selector">
            <div 
              className={`absolute h-[calc(100%-12px)] w-[calc(50%-6px)] bg-primary-container rounded-full shadow-md transition-all duration-300 top-1.5 ${
                activeTab === "patient" ? "left-1.5" : "left-[calc(50%+1.5px)]"
              }`}
            />
            
            <button 
              type="button"
              className={`relative z-10 flex-1 py-2.5 font-bold text-xs text-center transition-colors cursor-pointer ${
                activeTab === "patient" ? "text-white" : "text-slate-500 hover:text-foreground"
              }`}
              onClick={() => { setActiveTab("patient"); setErrorMsg(null); setSuccessMsg(null); }}
            >
              Patient
            </button>
            
            <button 
              type="button"
              className={`relative z-10 flex-1 py-2.5 font-bold text-xs text-center transition-colors cursor-pointer ${
                activeTab === "doctor" ? "text-white" : "text-slate-500 hover:text-foreground"
              }`}
              onClick={() => { setActiveTab("doctor"); setErrorMsg(null); setSuccessMsg(null); }}
            >
              Healthcare Provider
            </button>
          </div>

          {/* Core Credentials Input Fields */}
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {authMode === "register" && (
              <div className="floating-label-group">
                <input 
                  id="name"
                  type="text"
                  required
                  placeholder="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="block w-full px-4 py-4 text-sm text-foreground bg-card-bg border border-input-border rounded-xl focus:ring-2 focus:ring-primary-container/20 focus:border-primary-container transition-all outline-none"
                />
                <label 
                  htmlFor="name"
                  className="absolute left-4 top-0 transition-all pointer-events-none font-bold text-xs text-slate-500"
                >
                  Full Name
                </label>
              </div>
            )}

            <div className="floating-label-group">
              <input 
                id="email"
                type="email"
                required
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full px-4 py-4 text-sm text-foreground bg-card-bg border border-input-border rounded-xl focus:ring-2 focus:ring-primary-container/20 focus:border-primary-container transition-all outline-none"
              />
              <label 
                htmlFor="email"
                className="absolute left-4 top-0 transition-all pointer-events-none font-bold text-xs text-slate-500"
              >
                Email Address
              </label>
            </div>

            <div className="floating-label-group relative">
              <input 
                id="password"
                type={showPassword ? "text" : "password"}
                required
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full px-4 py-4 text-sm text-foreground bg-card-bg border border-input-border rounded-xl focus:ring-2 focus:ring-primary-container/20 focus:border-primary-container transition-all outline-none"
              />
              <label 
                htmlFor="password"
                className="absolute left-4 top-0 transition-all pointer-events-none font-bold text-xs text-slate-500"
              >
                Password
              </label>
              
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-4 text-slate-400 hover:text-primary-container cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {/* Alert components */}
            {errorMsg && (
              <div className="bg-danger-red/10 border border-danger-red/20 rounded-xl p-3 flex items-start gap-2.5 text-xs text-danger-red animate-float-up">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="bg-success-green/10 border border-success-green/20 rounded-xl p-3 flex items-start gap-2.5 text-xs text-success-green animate-float-up">
                <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{successMsg}</span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input 
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-input-border text-primary-container focus:ring-primary-container/20"
                />
                <span className="text-xs text-slate-500 group-hover:text-foreground transition-colors">Remember me</span>
              </label>
              <a className="text-xs font-bold text-primary-container hover:underline" href="#">Forgot password?</a>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-primary-container hover:bg-medical-blue-dark text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-primary-container/10 active:scale-[0.98] mt-2 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>{authMode === "login" ? "Sign In" : "Register Credentials"}</>
              )}
            </button>

          </form>

          {/* Google & Facebook Simulated SSO */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-card-border" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-widest text-slate-400 font-bold bg-card-bg">
              <span className="px-4">Or continue with</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button 
              type="button"
              onClick={() => handleMockSSO("google")}
              className="flex items-center justify-center gap-2.5 py-3 border border-input-border rounded-xl bg-card-bg hover:bg-sidebar-bg/60 transition-colors group cursor-pointer"
            >
              <svg height="18" viewBox="0 0 24 24" width="18" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"></path><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z" fill="#EA4335"></path></svg>
              <span className="text-xs font-bold text-slate-500 group-hover:text-foreground">Google</span>
            </button>
            <button 
              type="button"
              onClick={() => handleMockSSO("facebook")}
              className="flex items-center justify-center gap-2.5 py-3 border border-input-border rounded-xl bg-card-bg hover:bg-sidebar-bg/60 transition-colors group cursor-pointer"
            >
              <svg fill="#1877F2" height="18" viewBox="0 0 24 24" width="18" xmlns="http://www.w3.org/2000/svg"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"></path></svg>
              <span className="text-xs font-bold text-slate-500 group-hover:text-foreground">Facebook</span>
            </button>
          </div>

          {/* Switch Login vs Register */}
          <div className="text-center font-label-sm text-label-sm text-slate-500">
            {authMode === "login" ? (
              <>
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => { setAuthMode("register"); setErrorMsg(null); setSuccessMsg(null); }}
                  className="text-primary-container font-extrabold hover:underline cursor-pointer"
                >
                  Create an account
                </button>
              </>
            ) : (
              <>
                Already registered?{" "}
                <button
                  type="button"
                  onClick={() => { setAuthMode("login"); setErrorMsg(null); setSuccessMsg(null); }}
                  className="text-primary-container font-extrabold hover:underline cursor-pointer"
                >
                  Sign In Here
                </button>
              </>
            )}
          </div>

          <div className="text-center pt-2">
            <a className="text-[10px] text-slate-400 hover:text-primary-container transition-colors uppercase tracking-widest font-bold" href="#">
              Contact Administration
            </a>
          </div>

        </div>
      </section>

    </div>
  );
}
