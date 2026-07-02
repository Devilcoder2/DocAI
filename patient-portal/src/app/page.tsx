"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/useAuthStore";
import { useQuery } from "@tanstack/react-query";
import { 
  LayoutDashboard, Video, FileText, Users, MessageSquare, 
  HelpCircle, LogOut, Search, Bell, Settings, Brain, 
  Calendar, CheckCircle, ChevronRight, ArrowRight, User, Shield, Activity,
  ChevronUp, ChevronDown, AlertTriangle, ArrowLeft, Check
} from "lucide-react";

import SearchDashboard from "@/components/SearchDashboard";

interface ClinicalNote {
  id: string;
  appointment_id: string;
  raw_transcript: string | null;
  subjective: string | null;
  objective: string | null;
  assessment: string | null;
  plan: string | null;
  patient_summary: string | null;
  status: string;
  requires_escalation: boolean;
  signed_at: string | null;
}

interface Appointment {
  id: string;
  doctor_id: string;
  patient_id: string;
  start_time: string;
  appointment_time?: string;
  consult_type?: string;
  reason: string;
  reason_for_visit?: string;
  status: string;
  duration_minutes?: number;
  clinical_note?: ClinicalNote | null;
  doctor?: {
    id: string;
    specialty: string;
    user: {
      name: string;
    };
  };
}

const parseBullets = (text: string | null): string[] => {
  if (!text) return [];
  return text
    .split(/\n|\*|-|•/)
    .map(line => line.trim())
    .filter(line => line.length > 2);
};

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, user, token, clearAuth } = useAuthStore();
  const [activeTab, setActiveTab] = useState<"dashboard" | "directory" | "telehealth" | "vault" | "companion" | "history">("dashboard");
  const [searchRecordInput, setSearchRecordInput] = useState("");
  const [expandedApptId, setExpandedApptId] = useState<string | null>(null);
  const [noteTabs, setNoteTabs] = useState<Record<string, "summary" | "soap">>({});

  // Redirect to welcome if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/welcome");
    }
  }, [isAuthenticated, router]);

  // Fetch patient's actual appointments
  const { data: appointments = [], isLoading } = useQuery<Appointment[]>({
    queryKey: ["patient-appointments", user?.id],
    queryFn: async () => {
      if (!user?.id || !token) return [];
      const response = await fetch(`http://localhost:8000/api/v1/appointments?patient_id=${user.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!user?.id && !!token
  });

  const handleSelectDoctor = (doctorId: string) => {
    router.push(`/doctors/${doctorId}`);
  };

  const triggerVoiceAssistant = () => {
    // Triggers the global voice assistant trigger event
    const button = document.querySelector("#voiceTrigger") as HTMLButtonElement;
    if (button) {
      button.click();
    } else {
      // Fallback: search directory
      setActiveTab("directory");
    }
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Split appointments into upcoming and past
  const pastAppointments = appointments.filter(a => a.status === "Completed");
  const upcomingAppointments = appointments.filter(a => a.status === "Scheduled");

  return (
    <div className="bg-background text-foreground font-body-md min-h-screen flex flex-col transition-theme">
      
      {/* TopAppBar */}
      <header className="bg-card-bg/70 dark:bg-card-bg/50 backdrop-blur-md border-b border-card-border/35 shadow-sm sticky top-0 flex justify-between items-center w-full px-4 md:px-6 lg:px-8 h-16 z-30 transition-theme">
        <div 
          onClick={() => setActiveTab("dashboard")}
          className="flex items-center gap-2 group cursor-pointer select-none"
        >
          <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-md shadow-indigo-600/20 group-hover:scale-105 transition-transform">
            <Activity className="w-4 h-4 animate-pulse" />
          </div>
          <span className="font-display font-extrabold text-base text-medical-blue-dark tracking-tight">
            MedOS AI
          </span>
        </div>
        
        <div className="hidden md:flex flex-1 max-w-md mx-8">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input 
              value={searchRecordInput}
              onChange={(e) => setSearchRecordInput(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-sidebar-bg/60 border border-card-border/60 rounded-full focus:ring-2 focus:ring-primary-container/20 text-xs focus:outline-none transition-theme text-foreground placeholder-slate-400" 
              placeholder="Search your health records..." 
              type="text"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button className="text-slate-500 hover:text-foreground hover:bg-sidebar-bg/80 p-2 rounded-full transition-colors relative cursor-pointer">
            <Bell className="w-5 h-5" />
            {upcomingAppointments.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger-red rounded-full" />
            )}
          </button>
          <img 
            onClick={() => router.push("/profile")}
            alt="Patient Profile headshot" 
            className="w-9 h-9 rounded-full border-2 border-primary-container object-cover cursor-pointer hover:scale-105 transition-transform" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAQXUWFd3eIApifhmf5kVRU-vSgFbdTJefGO0bhXAsIVYhwDK5FNirfaSCGDUgUok59hJfww6UVVvTSofE628t1GqVtRkVqG3B2Vf0TXEYxpB3YyfsFJ2j0xohb3bI3NSq3_U8oo1itgkYyFpCzsKpKJEZeonlaPLc1k4pTcx5IrMW_CjveHjVG47j7MDnSb3upJaebFG57erXx4KBzEODkITczYHH2ltCUcSal-yBtCSo4pe0L8Cnoak8S0pi7_6w6hw1pm0K1O5UJ"
          />
        </div>
      </header>

      <div className="flex flex-1 h-[calc(100vh-64px)] overflow-hidden">
        
        {/* SideNavBar Desktop */}
        <aside className="hidden md:flex flex-col h-full py-8 px-4 bg-card-bg/60 dark:bg-card-bg/20 w-64 flex-shrink-0 border-r border-card-border/30 transition-theme">
          <div 
            onClick={() => router.push("/profile")}
            className="flex items-center gap-3 mb-10 px-2 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-primary-container/10 dark:bg-indigo-500/10 flex items-center justify-center text-primary-container dark:text-indigo-400 group-hover:scale-105 transition-transform border border-primary-container/20">
              <User className="w-5 h-5" />
            </div>
            <div className="overflow-hidden">
              <h3 className="font-label-md text-label-md text-foreground group-hover:text-primary-container dark:group-hover:text-indigo-350 transition-colors truncate font-bold">{user.name}</h3>
              <p className="text-[10px] text-slate-450 uppercase tracking-widest mt-0.5">ID: {user.id.slice(0, 8)}</p>
            </div>
          </div>

          <nav className="flex-1 space-y-1">
            <button 
              onClick={() => setActiveTab("dashboard")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-label-md text-label-md transition-all duration-200 cursor-pointer ${
                activeTab === "dashboard" 
                  ? "text-primary-container dark:text-indigo-400 bg-medical-blue-soft/50 dark:bg-indigo-500/10 border-r-4 border-primary-container dark:border-indigo-400 font-bold" 
                  : "text-slate-500 hover:text-foreground hover:bg-sidebar-bg/60"
              }`}
            >
              <LayoutDashboard className="w-5 h-5" />
              <span>Dashboard</span>
            </button>
            <button 
              onClick={() => setActiveTab("telehealth")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-label-md text-label-md transition-all duration-200 cursor-pointer ${
                activeTab === "telehealth" 
                  ? "text-primary-container dark:text-indigo-400 bg-medical-blue-soft/50 dark:bg-indigo-500/10 border-r-4 border-primary-container dark:border-indigo-400 font-bold" 
                  : "text-slate-500 hover:text-foreground hover:bg-sidebar-bg/60"
              }`}
            >
              <Video className="w-5 h-5" />
              <span>Telehealth</span>
            </button>
            <button 
              onClick={() => setActiveTab("history")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-label-md text-label-md transition-all duration-200 cursor-pointer ${
                activeTab === "history" 
                  ? "text-primary-container dark:text-indigo-400 bg-medical-blue-soft/50 dark:bg-indigo-500/10 border-r-4 border-primary-container dark:border-indigo-400 font-bold" 
                  : "text-slate-500 hover:text-foreground hover:bg-sidebar-bg/60"
              }`}
            >
              <Calendar className="w-5 h-5" />
              <span>Consultations</span>
            </button>
            <button 
              onClick={() => setActiveTab("vault")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-label-md text-label-md transition-all duration-200 cursor-pointer ${
                activeTab === "vault" 
                  ? "text-primary-container dark:text-indigo-400 bg-medical-blue-soft/50 dark:bg-indigo-500/10 border-r-4 border-primary-container dark:border-indigo-400 font-bold" 
                  : "text-slate-500 hover:text-foreground hover:bg-sidebar-bg/60"
              }`}
            >
              <FileText className="w-5 h-5" />
              <span>Health Vault</span>
            </button>
            <button 
              onClick={() => setActiveTab("directory")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-label-md text-label-md transition-all duration-200 cursor-pointer ${
                activeTab === "directory" 
                  ? "text-primary-container dark:text-indigo-400 bg-medical-blue-soft/50 dark:bg-indigo-500/10 border-r-4 border-primary-container dark:border-indigo-400 font-bold" 
                  : "text-slate-500 hover:text-foreground hover:bg-sidebar-bg/60"
              }`}
            >
              <Users className="w-5 h-5" />
              <span>Directory</span>
            </button>
            <button 
              onClick={() => setActiveTab("companion")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-label-md text-label-md transition-all duration-200 cursor-pointer ${
                activeTab === "companion" 
                  ? "text-primary-container dark:text-indigo-400 bg-medical-blue-soft/50 dark:bg-indigo-500/10 border-r-4 border-primary-container dark:border-indigo-400 font-bold" 
                  : "text-slate-500 hover:text-foreground hover:bg-sidebar-bg/60"
              }`}
            >
              <MessageSquare className="w-5 h-5" />
              <span>Companion</span>
            </button>
          </nav>

          <div className="mt-auto pt-6 border-t border-card-border/50 space-y-1">
            <a 
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-550 dark:text-slate-400 hover:text-foreground hover:bg-sidebar-bg/60 transition-all font-label-md text-label-md" 
              href="#"
            >
              <HelpCircle className="w-5 h-5" />
              <span>Help Center</span>
            </a>
            <button 
              onClick={clearAuth}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-danger-red hover:bg-danger-red/10 transition-all font-label-md text-label-md cursor-pointer"
            >
              <LogOut className="w-5 h-5" />
              <span>Sign Out</span>
            </button>
          </div>
        </aside>

        {/* Main Workspace Frame */}
        <main className="flex-1 overflow-y-auto p-6 md:p-12 relative h-full">
          <div className="max-w-[1200px] mx-auto">
            
            {activeTab === "dashboard" && (
              <div className="space-y-10 animate-float-up">
                
                {/* Greeting Header */}
                <header className="flex flex-col gap-2">
                  <h1 className="font-headline text-4xl font-extrabold text-foreground tracking-tight">Good morning, {user.name.split(" ")[0]}.</h1>
                  <p className="font-body-lg text-body-lg text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
                    How can we help you today? Your health journey is our priority, and our AI care team is ready to assist.
                  </p>
                </header>

                {/* Bento Grid Layout */}
                <div className="grid grid-cols-12 gap-6">
                  
                  {/* AI Care Companion (Large Module) */}
                  <section className="col-span-12 lg:col-span-8 glass-card rounded-[32px] p-8 relative overflow-hidden flex flex-col justify-between min-h-[400px] border border-card-border">
                    <div className="absolute top-0 right-0 w-1/2 h-full opacity-10 pointer-events-none bg-[radial-gradient(circle_at_center,_var(--color-primary-container)_0%,_transparent_60%)]" />
                    
                    <div className="relative z-10 space-y-6">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-primary-container/15 text-primary-container dark:text-indigo-400 rounded-2xl flex items-center justify-center border border-primary-container/20 shadow-lg shadow-primary-container/5">
                          <Brain className="w-6 h-6 animate-pulse" />
                        </div>
                        <div>
                          <h2 className="font-headline text-xl font-bold text-foreground">AI Care Companion</h2>
                          <p className="text-xs text-slate-500">Intelligent clinical guidance, 24/7</p>
                        </div>
                      </div>
                      
                      <div className="space-y-4 max-w-lg">
                        <p className="font-body-md text-body-md text-foreground leading-relaxed">
                          "I've analyzed your medical consult logs. Would you like a summary of the recommended recovery plan adjustments or help explaining your current prescription guidelines?"
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <button 
                            onClick={() => setActiveTab("companion")}
                            className="px-4 py-2 bg-card-bg hover:bg-sidebar-bg border border-card-border rounded-full text-xs font-bold text-primary-container dark:text-indigo-400 transition-colors cursor-pointer"
                          >
                            Summarize Visit
                          </button>
                          <button 
                            onClick={() => setActiveTab("companion")}
                            className="px-4 py-2 bg-card-bg hover:bg-sidebar-bg border border-card-border rounded-full text-xs font-bold text-primary-container dark:text-indigo-400 transition-colors cursor-pointer"
                          >
                            Explain Medication
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="relative z-10 mt-8 flex flex-col sm:flex-row sm:items-center gap-4">
                      <button 
                        onClick={triggerVoiceAssistant}
                        className="flex items-center gap-2 px-8 py-4 bg-primary-container hover:bg-medical-blue-dark text-white rounded-2xl font-bold text-sm shadow-lg shadow-primary-container/20 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer w-full sm:w-auto justify-center"
                      >
                        <MessageSquare className="w-4 h-4" />
                        Talk to AI Assistant
                      </button>
                      <p className="text-[10px] text-slate-450 max-w-xs italic leading-normal">
                        Privacy Secured: All AI interactions are end-to-end encrypted and HIPAA compliant.
                      </p>
                    </div>
                  </section>

                  {/* Find & Book Column */}
                  <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
                    
                    {/* Find a Doctor */}
                    <div 
                      onClick={() => setActiveTab("directory")}
                      className="group cursor-pointer glass-card rounded-[32px] p-6 border-l-4 border-primary-container hover:bg-primary-container transition-all duration-300 flex flex-col justify-between h-1/2 min-h-[188px]"
                    >
                      <div className="flex justify-between items-start">
                        <div className="w-12 h-12 bg-primary-container/10 dark:bg-white/10 rounded-2xl flex items-center justify-center text-primary-container dark:text-indigo-400 group-hover:bg-white group-hover:text-primary-container transition-all">
                          <Search className="w-6 h-6" />
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
                      </div>
                      <div>
                        <h3 className="font-headline text-lg font-bold text-medical-blue-dark group-hover:text-white mb-1">Find a Doctor</h3>
                        <p className="text-xs text-slate-500 group-hover:text-white/80 leading-normal">Search our network of specialists and primary care providers.</p>
                      </div>
                    </div>

                    {/* Book Appointment */}
                    <div 
                      onClick={() => setActiveTab("directory")}
                      className="group cursor-pointer glass-card rounded-[32px] p-6 border-l-4 border-success-green hover:bg-success-green transition-all duration-300 flex flex-col justify-between h-1/2 min-h-[188px]"
                    >
                      <div className="flex justify-between items-start">
                        <div className="w-12 h-12 bg-success-green/10 dark:bg-white/10 rounded-2xl flex items-center justify-center text-success-green group-hover:bg-white group-hover:text-success-green transition-all">
                          <Calendar className="w-6 h-6" />
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
                      </div>
                      <div>
                        <h3 className="font-headline text-lg font-bold text-medical-blue-dark group-hover:text-white mb-1">Book Appointment</h3>
                        <p className="text-xs text-slate-500 group-hover:text-white/80 leading-normal">Schedule virtual or in-person visits in just a few clicks.</p>
                      </div>
                    </div>

                  </div>

                  {/* Past Appointments Timeline */}
                  <section className="col-span-12 glass-card rounded-[32px] p-8 border border-card-border shadow-sm">
                    <div className="flex justify-between items-center mb-8">
                      <h2 className="font-headline text-xl font-bold text-foreground">Consultation History</h2>
                      <button 
                        onClick={() => setActiveTab("history")}
                        className="text-primary-container dark:text-indigo-400 font-bold text-xs flex items-center gap-1 hover:underline cursor-pointer"
                      >
                        View all history 
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {pastAppointments.length === 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {/* Elegant Mock Appt 1 */}
                        <div 
                          onClick={() => setActiveTab("companion")}
                          className="flex items-center gap-4 p-4 rounded-2xl bg-sidebar-bg/60 hover:bg-sidebar-bg border border-card-border/30 transition-colors cursor-pointer group"
                        >
                          <img 
                            alt="Dr. Richardson" 
                            className="w-16 h-16 rounded-xl object-cover shadow-sm" 
                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCzh_4hJ_1XCkc6V7x0JtPXn3Rq0DqXgeW-h7KEhIUm0stdx0ySR4KuZEoqzZ9eWj06S9MhQDp6iqVyrp28iC1nqbqZQ2bdSs7JOq2Rsf2VpRp51oi2FvL4EOJGD6geQkrfurX0obi-R8kzZywyStN7lZGjfiTnNKkhgKiuGfWbd8yzdsyXBpM1cZ9VScb0AU886u6qevlTLKy3WtAmyKgAXMCgW0TFbvZlr_TcXBtfB-C3xaEPOR_OJuY3151AAqHGLpdMHQ_J1n8v"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-xs text-foreground truncate">Dr. James Richardson</h4>
                            <p className="text-[10px] text-slate-500 mt-0.5">Cardiology • Oct 12, 2023</p>
                            <div className="mt-2 flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded-full bg-success-green/10 text-success-green text-[9px] font-bold uppercase tracking-wider">Completed</span>
                              <span className="text-[9px] text-primary-container dark:text-indigo-400 group-hover:underline">View Notes</span>
                            </div>
                          </div>
                        </div>

                        {/* Elegant Mock Appt 2 */}
                        <div 
                          onClick={() => setActiveTab("companion")}
                          className="flex items-center gap-4 p-4 rounded-2xl bg-sidebar-bg/60 hover:bg-sidebar-bg border border-card-border/30 transition-colors cursor-pointer group"
                        >
                          <img 
                            alt="Dr. Sarah Chen" 
                            className="w-16 h-16 rounded-xl object-cover shadow-sm" 
                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDp35RMHKlJFzwAv6wCHV3qhjDOeTUrNrXk6QmcZvS3LyUL1TTeLHBH8WNMx1nSsaQ7RBARV3Dg5HirIeJRVxYy0kYjPPVdI0oSqNu0rcHlHlPr9lt6WpYMRUJI5f8A-2nTkoZ4tbBy1qCLU80-4ZbG8y1Eiig0Z87qhBAAhTSmIDc0Hius53iYjpFkoRpr9WPh0Af3qFgCfz8uDYerT4ClSj3rDihEqzyRbAhYSTAJ-LBdw_c-S8OgXqr_CCJCMB3NFoIR4R2MlBOQ"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-xs text-foreground truncate">Dr. Sarah Chen</h4>
                            <p className="text-[10px] text-slate-500 mt-0.5">General Practitioner • Sep 24, 2023</p>
                            <div className="mt-2 flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded-full bg-success-green/10 text-success-green text-[9px] font-bold uppercase tracking-wider">Completed</span>
                              <span className="text-[9px] text-primary-container dark:text-indigo-400 group-hover:underline">View Notes</span>
                            </div>
                          </div>
                        </div>

                        {/* Elegant Mock Appt 3 */}
                        <div 
                          className="flex items-center gap-4 p-4 rounded-2xl bg-sidebar-bg/60 hover:bg-sidebar-bg border border-card-border/30 transition-colors cursor-pointer group"
                        >
                          <div className="w-16 h-16 rounded-xl bg-primary-container/10 border border-primary-container/20 flex items-center justify-center text-primary-container dark:text-indigo-400">
                            <FileText className="w-6 h-6" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-xs text-foreground truncate">City Health Labs</h4>
                            <p className="text-[10px] text-slate-500 mt-0.5">Blood Panel • Aug 30, 2023</p>
                            <div className="mt-2 flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded-full bg-primary-container/10 text-primary-container dark:text-indigo-350 text-[9px] font-bold uppercase tracking-wider">Lab Results</span>
                              <span className="text-[9px] text-primary-container dark:text-indigo-400 group-hover:underline">Download PDF</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {pastAppointments.map(appt => (
                          <div 
                            key={appt.id}
                            onClick={() => router.push(`/appointments/${appt.id}/companion`)}
                            className="flex items-center gap-4 p-4 rounded-2xl bg-sidebar-bg/60 hover:bg-sidebar-bg border border-card-border/30 transition-colors cursor-pointer group"
                          >
                            <div className="w-16 h-16 rounded-xl bg-primary-container/10 border border-primary-container/20 flex items-center justify-center text-primary-container dark:text-indigo-400 shrink-0">
                              <User className="w-6 h-6" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-xs text-foreground truncate">
                                {appt.doctor?.user.name || "Specialist Physician"}
                              </h4>
                              <p className="text-[10px] text-slate-500 mt-0.5">
                                {appt.doctor?.specialty || "Telehealth"} • {new Date(appt.start_time).toLocaleDateString()}
                              </p>
                              <div className="mt-2 flex items-center gap-2">
                                <span className="px-2 py-0.5 rounded-full bg-success-green/10 text-success-green text-[9px] font-bold uppercase tracking-wider">Completed</span>
                                <span className="text-[9px] text-primary-container dark:text-indigo-400 group-hover:underline">View Notes</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>

                </div>
                
                {/* Spacer for mobile nav */}
                <div className="h-16 md:hidden"></div>
              </div>
            )}

            {activeTab === "directory" && (
              <div className="animate-float-up space-y-6">
                <button 
                  onClick={() => setActiveTab("dashboard")}
                  className="text-xs text-primary-container dark:text-indigo-450 hover:underline flex items-center gap-1 font-bold cursor-pointer"
                >
                  <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                  Back to Dashboard
                </button>
                <div className="glass-card rounded-[32px] border border-card-border overflow-hidden">
                  <SearchDashboard onSelectDoctor={handleSelectDoctor} />
                </div>
              </div>
            )}

            {activeTab === "telehealth" && (
              <div className="animate-float-up space-y-8">
                <header className="flex flex-col gap-1.5">
                  <h2 className="font-headline text-2xl font-black text-foreground">Upcoming Telehealth Rooms</h2>
                  <p className="text-slate-500 text-xs">Access secure WebRTC virtual consult interfaces booked for your profile.</p>
                </header>

                {upcomingAppointments.length === 0 ? (
                  <div className="glass-card rounded-[32px] p-8 text-center border border-card-border max-w-lg">
                    <Video className="w-10 h-10 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-sm font-bold text-foreground">No Telehealth Appointments Scheduled</h3>
                    <p className="text-xs text-slate-550 mt-1 leading-normal">
                      Schedule a virtual appointment with a specialist provider in the Directory module.
                    </p>
                    <button 
                      onClick={() => setActiveTab("directory")}
                      className="mt-6 bg-primary-container hover:bg-medical-blue-dark text-white px-6 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                      Book Consultation Now
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {upcomingAppointments.map(appt => (
                      <div 
                        key={appt.id}
                        className="glass-card rounded-[24px] p-6 border border-card-border flex flex-col justify-between min-h-[180px]"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="px-2 py-0.5 rounded-full bg-primary-container/10 text-primary-container dark:text-indigo-400 text-[9px] font-bold uppercase tracking-wider">Scheduled</span>
                            <h4 className="font-bold text-sm text-foreground mt-2">{appt.doctor?.user.name || "Physician Practitioner"}</h4>
                            <p className="text-[10px] text-slate-550 mt-0.5">{appt.doctor?.specialty || "Telehealth Consultation"}</p>
                          </div>
                          <span className="text-[10px] text-slate-500 font-bold">{new Date(appt.start_time).toLocaleString()}</span>
                        </div>
                        <div className="mt-6 flex items-center gap-3">
                          <button 
                            onClick={() => router.push(`/appointments/${appt.id}/room`)}
                            className="bg-primary-container hover:bg-medical-blue-dark text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-md shadow-primary-container/10"
                          >
                            Join Video Consultation
                          </button>
                          <button 
                            onClick={() => router.push(`/appointments/${appt.id}/companion`)}
                            className="text-primary-container hover:underline text-xs font-bold cursor-pointer"
                          >
                            Pre-Consult Prep
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "vault" && (
              <div className="animate-float-up space-y-8">
                <header className="flex flex-col gap-1.5">
                  <h2 className="font-headline text-2xl font-black text-foreground">Clinical Health Vault</h2>
                  <p className="text-slate-550 text-xs">Verify past clinical notes, diagnosis records, and signed SOAP documents.</p>
                </header>

                <div className="glass-card rounded-[32px] p-8 border border-card-border shadow-sm space-y-6">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Shield className="w-4 h-4 text-success-green" />
                    HIPAA Secure Medical Logs
                  </h3>
                  
                  {pastAppointments.length === 0 ? (
                    <p className="text-xs text-slate-500 leading-normal">
                      No clinical notes found. Completed appointment document records will automatically sync to your health vault.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {pastAppointments.map(appt => (
                        <div 
                          key={appt.id}
                          className="flex items-center justify-between p-4 rounded-xl bg-sidebar-bg/60 border border-card-border/40 hover:bg-sidebar-bg transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <FileText className="w-5 h-5 text-primary-container dark:text-indigo-400 shrink-0" />
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-foreground truncate">{appt.doctor?.user.name || "Physician Specialist"}</p>
                              <p className="text-[10px] text-slate-500 mt-0.5">{new Date(appt.start_time).toLocaleDateString()} • {appt.reason || "General Consult"}</p>
                            </div>
                          </div>
                          <button 
                            onClick={() => router.push(`/appointments/${appt.id}/companion`)}
                            className="text-primary-container dark:text-indigo-400 text-xs font-bold hover:underline shrink-0 cursor-pointer"
                          >
                            View Clinical Summary
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "companion" && (
              <div className="animate-float-up space-y-8">
                <header className="flex flex-col gap-1.5">
                  <h2 className="font-headline text-2xl font-black text-foreground">AI Care Companion Chat</h2>
                  <p className="text-slate-550 text-xs">Conversational safety checkers, recovery timeline queries, and care directives.</p>
                </header>

                <div className="glass-card rounded-[32px] p-8 border border-card-border shadow-sm space-y-6 max-w-2xl">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-primary-container/10 border border-primary-container/20 text-primary-container dark:text-indigo-400 rounded-2xl flex items-center justify-center shrink-0">
                      <Brain className="w-6 h-6 animate-pulse" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-sm font-bold text-foreground">Active Clinical Context Available</h3>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        To chat with the LangGraph Care Companion about your medical instruction guidelines, select an appointment from your consultation list to launch the active chat portal.
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-card-border/50 pt-6">
                    <h4 className="text-xs font-bold text-foreground mb-4">Select Consultation to Open Chat:</h4>
                    {appointments.length === 0 ? (
                      <p className="text-xs text-slate-550 italic">No consultations available to start care companion chat.</p>
                    ) : (
                      <div className="space-y-3.5">
                        {appointments.map(appt => (
                          <div 
                            key={appt.id}
                            onClick={() => router.push(`/appointments/${appt.id}/companion`)}
                            className="flex items-center justify-between p-4 rounded-xl border border-card-border/40 hover:border-primary-container/30 bg-sidebar-bg/60 hover:bg-sidebar-bg transition-all cursor-pointer group"
                          >
                            <div>
                              <p className="text-xs font-bold text-foreground truncate group-hover:text-primary-container dark:group-hover:text-indigo-400 transition-colors">
                                Consultation with {appt.doctor?.user.name || "Physician"}
                              </p>
                              <p className="text-[10px] text-slate-500 mt-0.5">{new Date(appt.start_time).toLocaleDateString()} • {appt.doctor?.specialty || "Specialist"}</p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-primary-container transition-colors" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "history" && (
              <div className="animate-float-up space-y-6">
                <button 
                  onClick={() => setActiveTab("dashboard")}
                  className="text-xs text-primary-container dark:text-indigo-400 hover:underline flex items-center gap-1 font-bold cursor-pointer"
                >
                  <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                  Back to Dashboard
                </button>
                <div className="bg-white border border-slate-150 rounded-[32px] p-6 md:p-8 shadow-sm space-y-6">
                  <div>
                    <h3 className="text-sm font-bold text-medical-blue-dark uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100 font-mono">
                      <Calendar className="w-4.5 h-4.5 text-indigo-650 text-indigo-600" />
                      Consultation History Log
                    </h3>
                    <p className="text-xs text-slate-550 text-slate-500 mt-1.5 font-sans">
                      Select a previous session below to expand the associated HIPAA clinical summary notes.
                    </p>
                  </div>

                  {appointments.filter(a => a.status.toLowerCase() === "completed").length === 0 ? (
                    <div className="py-10 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                      No historical consultations or future sessions booked on this account yet.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {appointments
                        .filter(a => a.status.toLowerCase() === "completed")
                        .map((appt) => {
                          const isExpanded = expandedApptId === appt.id;
                          const apptTime = appt.appointment_time || appt.start_time;
                          const dateStr = new Date(apptTime).toLocaleDateString("en-US", {
                            weekday: "short", month: "short", day: "numeric", year: "numeric"
                          });
                          const timeStr = new Date(apptTime).toLocaleTimeString("en-US", {
                            hour: "2-digit", minute: "2-digit"
                          });
                          
                          return (
                            <div 
                              key={appt.id} 
                              className="bg-slate-50/30 border border-slate-150 rounded-2xl overflow-hidden transition-all shadow-sm"
                            >
                              {/* Accordion Trigger Header */}
                              <button
                                type="button"
                                onClick={() => setExpandedApptId(isExpanded ? null : appt.id)}
                                className="w-full text-left p-5 flex items-center justify-between hover:bg-slate-50 transition-all cursor-pointer outline-none"
                              >
                                <div className="space-y-1.5">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold text-slate-800">
                                      {appt.doctor?.user.name || "Consulting Provider"}
                                    </span>
                                    <span className="text-[10px] font-bold text-indigo-655 text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-full font-mono">
                                      {appt.doctor?.specialty || "Specialist"}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-3 text-xs text-slate-550 text-slate-500">
                                    <span>{dateStr}</span>
                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                                    <span>{timeStr}</span>
                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                                    <span className="capitalize font-semibold text-indigo-600">
                                      {(appt.consult_type || "telehealth").replace("_", " ")}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border font-mono ${
                                    appt.status.toLowerCase() === "completed" 
                                      ? "bg-emerald-55 bg-emerald-50 text-emerald-700 border-emerald-100"
                                      : appt.status.toLowerCase() === "confirmed" || appt.status.toLowerCase() === "pending"
                                      ? "bg-amber-55 bg-amber-50 text-amber-705 text-amber-700 border-amber-100"
                                      : "bg-slate-100 text-slate-500 border-slate-200"
                                  }`}>
                                    {appt.status}
                                  </span>
                                  {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                                </div>
                              </button>

                              {/* Accordion Expandable Content */}
                              {isExpanded && (
                                <div className="border-t border-slate-150 p-5 bg-white space-y-4 text-xs leading-relaxed text-slate-600">
                                  
                                  {/* Reason for Visit */}
                                  <div className="space-y-1">
                                    <h4 className="text-[10px] font-bold text-slate-450 text-slate-400 uppercase tracking-widest font-mono">Reason for visit</h4>
                                    <p className="text-slate-800 font-semibold">{appt.reason_for_visit || appt.reason}</p>
                                  </div>

                                  {/* HIPAA Clinical Scribe Note Display */}
                                  <div className="space-y-3 pt-2">
                                    <div className="flex items-center gap-1.5">
                                      <FileText className="w-4 h-4 text-indigo-600" />
                                      <h4 className="text-[10px] font-bold text-slate-800 uppercase tracking-widest font-mono">
                                        Clinical consultation summary Note
                                      </h4>
                                    </div>

                                    {appt.clinical_note ? (
                                       <div className="space-y-4">
                                         {/* Tab Selectors */}
                                         <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 w-fit">
                                           <button
                                             type="button"
                                             onClick={() => setNoteTabs(prev => ({ ...prev, [appt.id]: "summary" }))}
                                             className={`px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                                               (noteTabs[appt.id] || "summary") === "summary"
                                                 ? "bg-indigo-650 bg-indigo-600 text-white shadow-sm"
                                                 : "text-slate-500 hover:text-slate-800"
                                             }`}
                                           >
                                             Care Summary
                                           </button>
                                           <button
                                             type="button"
                                             onClick={() => setNoteTabs(prev => ({ ...prev, [appt.id]: "soap" }))}
                                             className={`px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                                               (noteTabs[appt.id] || "summary") === "soap"
                                                 ? "bg-indigo-600 text-white shadow-sm"
                                                 : "text-slate-500 hover:text-slate-800"
                                             }`}
                                           >
                                             Clinical SOAP Note
                                           </button>
                                         </div>

                                         {/* Tab Body */}
                                         {(noteTabs[appt.id] || "summary") === "summary" ? (
                                           <div className="bg-slate-50 border border-slate-150 rounded-2xl p-5 space-y-4">
                                             
                                             {/* Disease Summary Card */}
                                             <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 space-y-1">
                                               <span className="block text-[9px] font-bold text-indigo-700 uppercase tracking-widest font-mono">Disease/Visit Summary</span>
                                               <p className="text-slate-800 font-medium leading-relaxed italic text-xs">
                                                 "{appt.clinical_note.patient_summary || "No visit summary synthesized yet."}"
                                               </p>
                                             </div>

                                             {/* Discussion Bullet Points & Treatment Plan grid */}
                                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                               {/* Discussion Points */}
                                               <div className="space-y-2">
                                                 <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest font-mono">Discussion Highlights</span>
                                                 <ul className="space-y-1.5 list-disc pl-4 text-xs text-slate-600 leading-relaxed">
                                                   {parseBullets(appt.clinical_note.subjective).length > 0 ? (
                                                     parseBullets(appt.clinical_note.subjective).map((bullet, idx) => (
                                                       <li key={idx}>{bullet}</li>
                                                     ))
                                                   ) : (
                                                     <li>No specific discussion notes.</li>
                                                   )}
                                                 </ul>
                                               </div>

                                               {/* Recommended Care Plan */}
                                               <div className="space-y-2">
                                                 <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest font-mono">Prescribed Plan & Recommended Medicine</span>
                                                 <div className="space-y-1.5">
                                                   {parseBullets(appt.clinical_note.plan).length > 0 ? (
                                                     parseBullets(appt.clinical_note.plan).map((bullet, idx) => (
                                                       <div key={idx} className="flex items-start gap-2">
                                                         <div className="w-4 h-4 rounded bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 text-[9px] font-bold shrink-0 mt-0.5 font-mono">✓</div>
                                                         <span className="text-xs text-slate-600">{bullet}</span>
                                                       </div>
                                                     ))
                                                   ) : (
                                                     <p className="text-xs text-slate-500 italic">No specific medicines or treatment plan logged.</p>
                                                   )}
                                                 </div>
                                               </div>
                                             </div>

                                             {/* Precautions / Doctor Tips Checklist */}
                                             <div className="space-y-2 pt-2 border-t border-slate-200">
                                               <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest font-mono">Physician Precautions & Tips</span>
                                               <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                                                 {parseBullets(appt.clinical_note.objective).length > 0 ? (
                                                   parseBullets(appt.clinical_note.objective).map((bullet, idx) => (
                                                     <div key={idx} className="flex items-start gap-2 p-2.5 rounded-xl bg-white border border-slate-150 shadow-sm">
                                                       <div className="w-4 h-4 rounded bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 text-[9px] font-bold shrink-0 mt-0.5 font-mono">!</div>
                                                       <span className="text-[11px] text-slate-600 leading-normal">{bullet}</span>
                                                     </div>
                                                   ))
                                                 ) : (
                                                   <>
                                                     <div className="flex items-start gap-2 p-2.5 rounded-xl bg-white border border-slate-150 shadow-sm">
                                                       <div className="w-4 h-4 rounded bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 text-[9px] font-bold shrink-0 mt-0.5 font-mono">!</div>
                                                       <span className="text-[11px] text-slate-600 font-medium">Regularly monitor symptom status; report anomalies.</span>
                                                     </div>
                                                     <div className="flex items-start gap-2 p-2.5 rounded-xl bg-white border border-slate-150 shadow-sm">
                                                       <div className="w-4 h-4 rounded bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 text-[9px] font-bold shrink-0 mt-0.5 font-mono">!</div>
                                                       <span className="text-[11px] text-slate-600 font-medium">Reach out to the AI Care Companion check-in bot for safety guidelines.</span>
                                                     </div>
                                                   </>
                                                 )}
                                               </div>
                                             </div>

                                           </div>
                                         ) : (
                                           /* SOAP Note Tab Body */
                                           <div className="bg-slate-50 border border-slate-150 rounded-2xl p-5 space-y-3">
                                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                               <div className="space-y-0.5">
                                                 <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block font-mono">Subjective</span>
                                                 <p className="text-slate-700 text-xs leading-relaxed">{appt.clinical_note.subjective || "No notes."}</p>
                                               </div>
                                               <div className="space-y-0.5">
                                                 <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block font-mono">Objective</span>
                                                 <p className="text-slate-700 text-xs leading-relaxed">{appt.clinical_note.objective || "No notes."}</p>
                                               </div>
                                               <div className="space-y-0.5">
                                                 <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block font-mono">Assessment</span>
                                                 <p className="text-slate-700 text-xs leading-relaxed">{appt.clinical_note.assessment || "No notes."}</p>
                                               </div>
                                               <div className="space-y-0.5">
                                                 <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block font-mono">Care Plan</span>
                                                 <p className="text-slate-700 text-xs leading-relaxed">{appt.clinical_note.plan || "No notes."}</p>
                                               </div>
                                             </div>
                                           </div>
                                         )}

                                         {/* Escalation Warnings */}
                                         {appt.clinical_note.requires_escalation && (
                                           <div className="bg-rose-55 bg-rose-50 border border-rose-100 p-3 rounded-xl flex items-center gap-2 mt-2">
                                             <AlertTriangle className="w-4.5 h-4.5 text-rose-600 shrink-0" />
                                             <span className="text-[10px] font-bold text-rose-700 font-mono">
                                               Attention: Safety escalation warning active for this consultation note. Review care companion guidelines.
                                             </span>
                                           </div>
                                         )}
                                       </div>
                                     ) : (
                                       <div className="py-3.5 px-4 bg-slate-50 border border-slate-150 rounded-xl text-slate-400 italic text-[11px] font-sans">
                                         No clinical summary notes are linked to this consultation ID. A summary is synthesized automatically following telehealth room calls.
                                       </div>
                                     )}
                                  </div>

                                  {/* Companion & Telehealth redirects */}
                                  <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                                    {appt.status.toLowerCase() === "completed" && (
                                      <Link
                                        href={`/appointments/${appt.id}/companion`}
                                        className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 hover:underline flex items-center gap-1.5 transition-colors duration-150"
                                      >
                                        Chat with Care Companion for this visit
                                        <ArrowLeft className="w-3 h-3 rotate-180" />
                                      </Link>
                                    )}
                                    {appt.status.toLowerCase() === "scheduled" && appt.consult_type === "telehealth" && (
                                      <Link
                                        href={`/appointments/${appt.id}/room`}
                                        className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 hover:underline flex items-center gap-1.5 transition-colors duration-150"
                                      >
                                        Join Telehealth Room
                                        <ArrowLeft className="w-3 h-3 rotate-180" />
                                      </Link>
                                    )}
                                  </div>

                                </div>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
        </main>

      </div>

      {/* BottomNavBar (Mobile Layout Navigation) */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full z-40 flex justify-around items-center px-4 py-2 bg-card-bg/90 backdrop-blur-xl border-t border-card-border/40 shadow-lg rounded-t-xl transition-theme">
        <button 
          onClick={() => setActiveTab("dashboard")}
          className={`flex flex-col items-center justify-center py-1 transition-all cursor-pointer ${
            activeTab === "dashboard" ? "text-primary-container dark:text-indigo-400" : "text-slate-400 hover:text-foreground"
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px] font-bold mt-0.5">Home</span>
        </button>
        
        <button 
          onClick={() => setActiveTab("telehealth")}
          className={`flex flex-col items-center justify-center py-1 transition-all cursor-pointer ${
            activeTab === "telehealth" ? "text-primary-container dark:text-indigo-400" : "text-slate-400 hover:text-foreground"
          }`}
        >
          <Video className="w-5 h-5" />
          <span className="text-[10px] font-bold mt-0.5">Video</span>
        </button>

        <button 
          onClick={() => setActiveTab("history")}
          className={`flex flex-col items-center justify-center py-1 transition-all cursor-pointer ${
            activeTab === "history" ? "text-primary-container dark:text-indigo-400" : "text-slate-400 hover:text-foreground"
          }`}
        >
          <Calendar className="w-5 h-5" />
          <span className="text-[10px] font-bold mt-0.5">History</span>
        </button>
        
        <button 
          onClick={() => setActiveTab("vault")}
          className={`flex flex-col items-center justify-center py-1 transition-all cursor-pointer ${
            activeTab === "vault" ? "text-primary-container dark:text-indigo-400" : "text-slate-400 hover:text-foreground"
          }`}
        >
          <FileText className="w-5 h-5" />
          <span className="text-[10px] font-bold mt-0.5">Vault</span>
        </button>
        
        <button 
          onClick={() => setActiveTab("directory")}
          className={`flex flex-col items-center justify-center py-1 transition-all cursor-pointer ${
            activeTab === "directory" ? "text-primary-container dark:text-indigo-400" : "text-slate-400 hover:text-foreground"
          }`}
        >
          <Users className="w-5 h-5" />
          <span className="text-[10px] font-bold mt-0.5">Search</span>
        </button>

        <button 
          onClick={() => setActiveTab("companion")}
          className={`flex flex-col items-center justify-center py-1 transition-all cursor-pointer ${
            activeTab === "companion" ? "text-primary-container dark:text-indigo-400" : "text-slate-400 hover:text-foreground"
          }`}
        >
          <MessageSquare className="w-5 h-5" />
          <span className="text-[10px] font-bold mt-0.5">Chat</span>
        </button>
      </nav>

    </div>
  );
}
