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

  const handleNavigateToLogin = () => {
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden font-body-md transition-theme relative">
      
      {/* TopAppBar Navigation */}
      <header className="bg-card-bg/70 dark:bg-card-bg/50 backdrop-blur-md border-b border-card-border/35 shadow-sm sticky top-0 flex justify-between items-center w-full px-margin-desktop h-16 z-40 transition-theme">
        <div className="flex items-center gap-8">
          <span className="font-headline-md text-headline-md text-medical-blue-dark dark:text-teal-400 font-extrabold tracking-tight">MedOS AI</span>
          <nav className="hidden md:flex gap-6 items-center">
            <a className="text-primary dark:text-teal-400 font-bold border-b-2 border-primary dark:border-teal-400 py-4 font-label-md text-label-md transition-colors" href="#">Home</a>
            <a className="text-slate-500 dark:text-slate-400 hover:text-medical-blue-dark dark:hover:text-teal-300 hover:bg-medical-blue-soft/50 dark:hover:bg-teal-500/10 transition-all px-3 py-1 rounded font-label-md text-label-md" href="#">Solutions</a>
            <a className="text-slate-500 dark:text-slate-400 hover:text-medical-blue-dark dark:hover:text-teal-300 hover:bg-medical-blue-soft/50 dark:hover:bg-teal-500/10 transition-all px-3 py-1 rounded font-label-md text-label-md" href="#">Resources</a>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={handleNavigateToLogin}
            className="bg-medical-blue-dark hover:bg-primary-container text-white px-5 py-2.5 rounded-xl font-label-md text-label-md transition-all active:scale-95 shadow-md shadow-medical-blue-dark/10 cursor-pointer"
          >
            Sign In
          </button>
        </div>
      </header>

      <main className="relative">
        
        {/* Hero Section */}
        <section className="relative min-h-[800px] flex items-center px-margin-mobile md:px-margin-desktop hero-mesh overflow-hidden py-12 md:py-24">
          <div className="max-w-[1200px] mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="flex flex-col items-start gap-6 animate-float-up">
              <span className="bg-primary-container/10 dark:bg-teal-500/10 text-primary dark:text-teal-400 px-4 py-1 rounded-full font-label-md text-label-md border border-primary-container/20">Introducing v4.0</span>
              <h1 className="font-display-lg text-display-lg md:text-[64px] md:leading-[72px] tracking-tight text-foreground font-black">
                The Future of <br/>Medical Intelligence
              </h1>
              <p className="font-body-lg text-body-lg text-slate-650 dark:text-slate-400 max-w-lg leading-relaxed">
                Precise diagnostics and empathetic care. MedOS AI bridges the gap between complex clinical data and meaningful patient outcomes.
              </p>
              <div className="flex gap-4 mt-4">
                <button 
                  onClick={handleNavigateToLogin}
                  className="bg-primary-container hover:bg-medical-blue-dark text-white px-8 py-4 rounded-xl font-label-md text-label-md hover:shadow-xl transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
                >
                  Get Started
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button 
                  onClick={handleNavigateToLogin}
                  className="bg-card-bg text-primary dark:text-teal-400 hover:bg-sidebar-bg px-8 py-4 rounded-xl border border-card-border font-label-md text-label-md hover:shadow-md transition-all cursor-pointer"
                >
                  View Demo
                </button>
              </div>
            </div>
            
            <div className="relative flex justify-center lg:justify-end">
              <div className="glass-card rounded-[32px] p-4 overflow-hidden shadow-2xl relative z-10 w-full max-w-[500px] border border-card-border/40 hover:scale-[1.01] transition-transform duration-300">
                <img 
                  className="w-full aspect-[4/3] object-cover rounded-[24px]" 
                  alt="Futuristic clinical data portal"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuChYRRsKRY41715lAH9N4N6BcVdBNUICQwh1mNNugL1M4HqdWzsC8AbYyUNz2U_sNTAY1Ooh16iNfhFogK3BybfU9XjaOCMsWyNMFndbV2u_7gzjYp1t7JEzTNq98LVoiOsU_hcQ7NX44fbDcAcDkVsdX3TYbgkQPalsAL1jD59D0tYAVb0uuit7x3fU-EtzYUYl9_yM4qTg8eQwyWvfHQER1c8t56WqyYCevZ_GelF0nIGs6kdAZaqdcAg694TmcYiQfyATUMVTnyl"
                />
              </div>
              
              {/* Decorative Elements */}
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-teal-500/10 rounded-full blur-3xl opacity-60 animate-pulse-glow" />
              <div className="absolute -bottom-6 -left-6 glass-card px-6 py-4 rounded-2xl flex items-center gap-4 z-20 border border-card-border/50 shadow-lg">
                <div className="w-10 h-10 bg-success-green/20 rounded-full flex items-center justify-center text-success-green">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-label-md text-label-md text-foreground">HIPAA Compliant</p>
                  <p className="font-label-sm text-label-sm text-slate-550 dark:text-slate-400">Secure &amp; Encrypted</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Grid (Bento Style) */}
        <section className="py-24 px-margin-mobile md:px-margin-desktop bg-card-bg/40 border-y border-card-border/30 transition-theme">
          <div className="max-w-[1200px] mx-auto">
            <div className="text-center mb-16 space-y-4">
              <h2 className="font-headline-lg text-headline-lg text-foreground font-bold">Integrated Clinical Units</h2>
              <p className="font-body-md text-body-md text-slate-500 dark:text-slate-455 max-w-xl mx-auto">
                One unified platform for the modern healthcare professional, built with the Single-Unit UX philosophy.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              
              {/* AI Ambient Scribe */}
              <div className="md:col-span-2 group glass-card p-8 rounded-[32px] hover:border-primary-container/40 dark:hover:border-teal-500/40 transition-all duration-300 flex flex-col justify-between overflow-hidden shadow-sm">
                <div className="flex justify-between items-start">
                  <div className="space-y-4">
                    <div className="w-14 h-14 bg-primary-container/10 dark:bg-teal-500/10 text-primary dark:text-teal-400 rounded-2xl flex items-center justify-center border border-primary-container/20">
                      <Mic className="w-7 h-7" />
                    </div>
                    <h3 className="font-headline-md text-headline-md text-foreground font-bold">AI Ambient Scribe</h3>
                    <p className="font-body-md text-body-md text-slate-555 dark:text-slate-400 max-w-md leading-relaxed">
                      Automatically captures consultation transcripts and generates structured SOAP notes, allowing you to focus entirely on the patient.
                    </p>
                  </div>
                  <img 
                    className="w-32 h-32 object-contain opacity-80 group-hover:scale-105 transition-transform duration-300 hidden sm:block" 
                    alt="Sound waves illustration"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCqje0ZB7qky8-eUKV-_n0VDYaokBkp7QHRDc4U51RvyHy0fA6p-L6l2xyLM2rF3_YKdLplbrz0tYW8SsmGpQg7oLgtE9E0YvhHQ4xxWRdp3xlvMlakBHlSt-qJSwID-e_GIfuyZWe8vifECZ3FMXQVbWJAsEWWkhW5c7wvjMaNuVf9TkHGL1yIdif8fBIrlW278EU-_K7gGHcN6nm3g6Dp4twadlsagXb949S6AAgwLO0TWGIfheIJLtQ7xo4LHX_mzdb-uwHaePyE"
                  />
                </div>
                <div className="mt-8 flex gap-4">
                  <span className="bg-sidebar-bg text-slate-655 dark:text-slate-400 px-3 py-1 rounded-full font-label-sm text-label-sm border border-card-border/60">NLP-Powered</span>
                  <span className="bg-sidebar-bg text-slate-655 dark:text-slate-400 px-3 py-1 rounded-full font-label-sm text-label-sm border border-card-border/60">EHR Integrated</span>
                </div>
              </div>

              {/* Secure Telehealth */}
              <div className="glass-card p-8 rounded-[32px] hover:border-primary-container/40 dark:hover:border-teal-500/40 transition-all duration-300 space-y-6 shadow-sm">
                <div className="w-14 h-14 bg-warning-amber/10 text-warning-amber rounded-2xl flex items-center justify-center border border-warning-amber/20">
                  <Video className="w-7 h-7" />
                </div>
                <h3 className="font-headline-md text-headline-md text-foreground font-bold">Secure Telehealth</h3>
                <p className="font-body-md text-body-md text-slate-555 dark:text-slate-400 leading-relaxed">
                  HIPAA-compliant WebRTC rooms with crystal-clear audio-video and low-latency diagnostic streaming.
                </p>
                <div className="pt-4 border-t border-card-border/55">
                  <a className="text-primary dark:text-teal-400 font-label-md text-label-md flex items-center gap-1 group transition-colors" href="#">
                    Explore Telehealth 
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </a>
                </div>
              </div>

              {/* Smart Clinic Directory */}
              <div className="glass-card p-8 rounded-[32px] hover:border-primary-container/40 dark:hover:border-teal-500/40 transition-all duration-300 space-y-6 shadow-sm">
                <div className="w-14 h-14 bg-success-green/10 text-success-green rounded-2xl flex items-center justify-center border border-success-green/20">
                  <Users className="w-7 h-7" />
                </div>
                <h3 className="font-headline-md text-headline-md text-foreground font-bold">Clinic Directory</h3>
                <p className="font-body-md text-body-md text-slate-555 dark:text-slate-400 leading-relaxed">
                  Hyper-accurate filtering for specialists by proximity, insurance provider, and live availability.
                </p>
                <div className="w-full h-32 bg-sidebar-bg rounded-2xl overflow-hidden mt-4 border border-card-border/50 relative">
                  <div 
                    className="w-full h-full bg-cover bg-center opacity-85" 
                    style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuB4WDBEkx3nPHXpLyTMb0d9tR2pZL0ikzB5vSlA-A6a6GZUMmDRrJj62Mfcm6WWguNmtcLUW4SIiwv5hz8po6uFRrVW-wtcBs_yikXlZmTIS-wUfYK_RrBHmsrsknsmWqZDZEqb8VoOfpm0f1D5DCOeZLzC02QsPDyVVuaGVvNJt6R5VCaUG-IN2fcT8ZtUVX18ZfAbgJYdNvxhkHApvvPVAj9jyWkpC0y-Vg4rdZdkliGQZzUYptaA3TjWhLJafG2DzGWJITwhTv_A')" }}
                  />
                </div>
              </div>

              {/* Care Companion */}
              <div className="md:col-span-2 glass-card p-8 rounded-[32px] hover:border-primary-container/40 dark:hover:border-teal-500/40 transition-all duration-300 flex flex-col md:flex-row gap-8 items-center shadow-sm">
                <div className="flex-1 space-y-6">
                  <div className="w-14 h-14 bg-primary-container/10 dark:bg-teal-500/10 text-primary dark:text-teal-400 rounded-2xl flex items-center justify-center border border-primary-container/20">
                    <MessageSquare className="w-7 h-7" />
                  </div>
                  <h3 className="font-headline-md text-headline-md text-foreground font-bold">Care Companion</h3>
                  <p className="font-body-md text-body-md text-slate-555 dark:text-slate-400 leading-relaxed">
                    An empathetic post-visit AI chat helping patients understand recovery plans and manage medication schedules seamlessly.
                  </p>
                  <button 
                    onClick={handleNavigateToLogin}
                    className="bg-primary-container text-white hover:bg-medical-blue-dark px-6 py-2.5 rounded-xl font-label-md text-label-md shadow-sm transition-all cursor-pointer"
                  >
                    Learn About Companion
                  </button>
                </div>
                
                <div className="flex-1 w-full bg-medical-blue-soft/50 dark:bg-teal-500/5 rounded-[24px] p-6 relative overflow-hidden h-64 border border-card-border/50">
                  <div className="space-y-3">
                    <div className="bg-card-bg p-3 rounded-2xl rounded-bl-none shadow-sm max-w-[85%] text-slate-700 dark:text-slate-300 font-body-sm text-body-sm border border-card-border/40">
                      How should I take my recovery medication?
                    </div>
                    <div className="bg-primary-container text-white p-3 rounded-2xl rounded-br-none shadow-sm ml-auto max-w-[85%] text-body-sm">
                      Please take 1 tablet with food twice daily...
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-medical-blue-soft dark:from-sidebar-bg/50 to-transparent flex justify-center">
                    <div className="w-12 h-1 bg-primary/20 rounded-full animate-pulse" />
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* Trust & Analytics Section */}
        <section className="py-24 px-margin-mobile md:px-margin-desktop bg-background transition-theme">
          <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <h2 className="font-headline-lg text-headline-lg text-foreground font-bold">Measurable Clinical Efficiency</h2>
              <p className="font-body-lg text-body-lg text-slate-555 dark:text-slate-400 leading-relaxed">
                MedOS AI isn't just about features; it's about reclaiming time for patient care. Our clinical partners report significant improvements in daily workflow.
              </p>
              
              <div className="space-y-6">
                
                <div className="space-y-2">
                  <div className="flex justify-between font-label-md text-label-md text-foreground">
                    <span>Documentation Speed</span>
                    <span className="text-primary dark:text-teal-400 font-bold">+42%</span>
                  </div>
                  <div className="w-full h-3 bg-sidebar-bg border border-card-border/50 rounded-full overflow-hidden">
                    <div className="h-full bg-primary-container rounded-full" style={{ width: "82%" }} />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between font-label-md text-label-md text-foreground">
                    <span>Patient Engagement</span>
                    <span className="text-success-green font-bold">+68%</span>
                  </div>
                  <div className="w-full h-3 bg-sidebar-bg border border-card-border/50 rounded-full overflow-hidden">
                    <div className="h-full bg-success-green rounded-full" style={{ width: "91%" }} />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between font-label-md text-label-md text-foreground">
                    <span>Diagnostic Accuracy</span>
                    <span className="text-medical-blue-dark dark:text-teal-300 font-bold">+24%</span>
                  </div>
                  <div className="w-full h-3 bg-sidebar-bg border border-card-border/50 rounded-full overflow-hidden">
                    <div className="h-full bg-medical-blue-dark rounded-full" style={{ width: "76%" }} />
                  </div>
                </div>

              </div>
            </div>
            
            <div className="relative">
              <div className="glass-card p-8 rounded-[40px] relative overflow-hidden border border-card-border shadow-xl">
                <div className="flex items-center justify-between mb-8">
                  <h4 className="font-headline-md text-headline-md text-foreground font-bold">System Performance</h4>
                  <span className="text-success-green flex items-center gap-1 font-label-md text-label-md">
                    <TrendingUp className="w-4 h-4 animate-bounce" />
                    Live Data
                  </span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="bg-sidebar-bg/60 p-6 rounded-3xl border border-card-border/60">
                    <p className="font-label-sm text-label-sm text-slate-500 uppercase tracking-wider font-bold">Clinicians Active</p>
                    <p className="font-headline-lg text-headline-lg text-primary dark:text-teal-400 mt-2 font-black">12,480</p>
                  </div>
                  <div className="bg-sidebar-bg/60 p-6 rounded-3xl border border-card-border/60">
                    <p className="font-label-sm text-label-sm text-slate-500 uppercase tracking-wider font-bold">Patient Sessions</p>
                    <p className="font-headline-lg text-headline-lg text-foreground mt-2 font-black">1.2M+</p>
                  </div>
                  <div className="sm:col-span-2 bg-primary-container/5 p-6 rounded-3xl border border-primary-container/10 flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary-container text-white rounded-2xl flex items-center justify-center shrink-0">
                      <Shield className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-label-md text-label-md text-foreground font-bold">Enterprise Encryption</p>
                      <p className="font-body-sm text-body-sm text-slate-555 dark:text-slate-400 mt-0.5">AES-256 Bit Data Protection Standard</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 px-margin-mobile md:px-margin-desktop">
          <div className="max-w-[1200px] mx-auto bg-medical-blue-dark rounded-[48px] p-12 md:p-24 relative overflow-hidden text-center text-white shadow-2xl">
            {/* Background Subtle Glows */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary-container opacity-20 blur-[120px]" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-medical-blue-soft opacity-10 blur-[120px]" />
            
            <div className="relative z-10 space-y-8 animate-float-up">
              <h2 className="font-display-lg text-display-lg md:text-5xl max-w-3xl mx-auto font-black leading-tight">
                Ready to join the modern clinic?
              </h2>
              <p className="font-body-lg text-body-lg text-medical-blue-soft max-w-xl mx-auto opacity-90">
                Start your 30-day free trial today. No complex integration required. Deployment in under 24 hours.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
                <button 
                  onClick={handleNavigateToLogin}
                  className="bg-white text-medical-blue-dark hover:bg-slate-100 px-10 py-5 rounded-2xl font-headline-md text-headline-md hover:shadow-xl transition-all active:scale-95 font-bold cursor-pointer"
                >
                  Get Started Now
                </button>
                <button 
                  onClick={handleNavigateToLogin}
                  className="bg-transparent border-2 border-white/30 text-white hover:border-white/60 px-10 py-5 rounded-2xl font-headline-md text-headline-md hover:bg-white/10 transition-all font-bold cursor-pointer"
                >
                  Schedule a Demo
                </button>
              </div>
              <p className="font-label-sm text-label-sm text-medical-blue-soft opacity-70">
                Trusted by over 450+ medical institutions worldwide.
              </p>
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="bg-sidebar-bg/60 border-t border-card-border/50 py-16 px-margin-mobile md:px-margin-desktop transition-theme">
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
          
          <div className="space-y-6">
            <span className="font-headline-md text-headline-md text-medical-blue-dark dark:text-teal-400 font-extrabold tracking-tight">MedOS AI</span>
            <p className="font-body-sm text-body-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              The leading artificial intelligence platform for high-performance clinical teams.
            </p>
            <div className="flex gap-4">
              <a className="w-10 h-10 bg-card-bg border border-card-border/80 rounded-full flex items-center justify-center text-primary dark:text-teal-400 shadow-sm hover:scale-110 hover:shadow-md transition-all" href="#">
                <Globe className="w-4 h-4" />
              </a>
              <a className="w-10 h-10 bg-card-bg border border-card-border/80 rounded-full flex items-center justify-center text-primary dark:text-teal-400 shadow-sm hover:scale-110 hover:shadow-md transition-all" href="#">
                <Send className="w-4 h-4" />
              </a>
            </div>
          </div>

          <div>
            <h5 className="font-label-md text-label-md text-foreground mb-6 font-bold">Platform</h5>
            <ul className="space-y-4 font-body-sm text-body-sm text-slate-500 dark:text-slate-400">
              <li><a className="hover:text-primary dark:hover:text-teal-355 transition-colors" href="#">AI Scribe</a></li>
              <li><a className="hover:text-primary dark:hover:text-teal-355 transition-colors" href="#">Telehealth Pro</a></li>
              <li><a className="hover:text-primary dark:hover:text-teal-355 transition-colors" href="#">Care Companion</a></li>
              <li><a className="hover:text-primary dark:hover:text-teal-355 transition-colors" href="#">Directory Services</a></li>
            </ul>
          </div>

          <div>
            <h5 className="font-label-md text-label-md text-foreground mb-6 font-bold">Support</h5>
            <ul className="space-y-4 font-body-sm text-body-sm text-slate-500 dark:text-slate-400">
              <li><a className="hover:text-primary dark:hover:text-teal-355 transition-colors" href="#">Help Center</a></li>
              <li><a className="hover:text-primary dark:hover:text-teal-355 transition-colors" href="#">API Documentation</a></li>
              <li><a className="hover:text-primary dark:hover:text-teal-355 transition-colors" href="#">HIPAA Policy</a></li>
              <li><a className="hover:text-primary dark:hover:text-teal-355 transition-colors" href="#">Contact Sales</a></li>
            </ul>
          </div>

          <div>
            <h5 className="font-label-md text-label-md text-foreground mb-6 font-bold">Newsletter</h5>
            <p className="font-body-sm text-body-sm text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
              Stay updated with clinical AI research.
            </p>
            <div className="flex gap-2">
              <input 
                className="bg-card-bg border border-card-border rounded-xl px-4 py-2 w-full focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-sm transition-theme" 
                placeholder="Email address" 
                type="email"
              />
              <button className="bg-primary-container hover:bg-medical-blue-dark text-white p-3 rounded-xl transition-all cursor-pointer">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>
        
        <div className="max-w-[1200px] mx-auto mt-16 pt-8 border-t border-card-border/50 flex flex-col sm:flex-row justify-between items-center gap-4 font-label-sm text-label-sm text-slate-500">
          <p>© {new Date().getFullYear()} MedOS AI Platform. All rights reserved.</p>
          <div className="flex gap-8">
            <a className="hover:text-primary dark:hover:text-teal-355 transition-colors" href="#">Privacy Policy</a>
            <a className="hover:text-primary dark:hover:text-teal-355 transition-colors" href="#">Terms of Service</a>
            <a className="hover:text-primary dark:hover:text-teal-355 transition-colors" href="#">Security Standard</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
