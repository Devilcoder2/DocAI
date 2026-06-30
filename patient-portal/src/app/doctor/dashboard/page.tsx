"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Calendar, Clock, User, ClipboardList, ShieldAlert, 
  ExternalLink, FileText, Lock, PlusCircle, CheckCircle, Search
} from "lucide-react";
import Link from "next/link";
import { useAuthStore } from "@/store/useAuthStore";


interface Appointment {
  id: string;
  doctor_id: string;
  patient_id: string;
  appointment_time: string;
  duration_minutes: number;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  consult_type: "in_person" | "telehealth";
  reason_for_visit: string;
  clinical_note?: {
    id: string;
    appointment_id: string;
    raw_transcript: string;
    subjective: string;
    objective: string;
    assessment: string;
    plan: string;
    patient_summary: string;
    status: "draft" | "approved";
    signed_at: string | null;
  };
}

/**
 * Doctor Dashboard Queue page.
 * Displays today's clinic appointments, including clinical note statuses and quick workspace links.
 */
export default function DoctorDashboard() {
  const { token, user } = useAuthStore();
  const [filter, setFilter] = useState<"all" | "pending" | "approved">("all");
  const [searchTerm, setSearchTerm] = useState("");
  
  // Patient profile preview modal states
  const [patientProfile, setPatientProfile] = useState<any>(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  const handleViewPatientProfile = async (patientId: string) => {
    try {
      const response = await fetch(`http://localhost:8000/api/v1/users/${patientId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setPatientProfile(data);
        setProfileModalOpen(true);
      } else {
        alert("Failed to retrieve patient profile. Check HIPAA access claims.");
      }
    } catch (e) {
      console.error("Profile lookup error:", e);
    }
  };

  // 1. Fetch doctor's appointments
  const { data: appointments, isLoading, error } = useQuery<Appointment[]>({
    queryKey: ["doctor-appointments", user?.id],
    queryFn: async () => {
      const response = await fetch(`http://localhost:8000/api/v1/appointments?doctor_id=${user?.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) {
        throw new Error("Failed to load appointments.");
      }
      return response.json();
    },
    enabled: !!token && !!user?.id
  });

  // Access check
  if (!token || user?.role !== "Doctor") {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4 transition-theme">
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-3xl p-8 max-w-md text-center">
          <ShieldAlert className="w-12 h-12 text-rose-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">Access Denied</h3>
          <p className="text-sm text-slate-400 mb-6">Provider credentials required. Please log in as a clinical provider to access this dashboard.</p>
          <Link href="/" className="bg-teal-500 hover:bg-teal-400 text-slate-950 px-6 py-2.5 rounded-xl font-bold text-sm transition-all">
            Return to Homepage
          </Link>
        </div>
      </div>
    );
  }

  // Filter and search appointments
  const filteredAppointments = appointments?.filter(appt => {
    // 1. Filter by tab
    const noteStatus = appt.clinical_note?.status || "none";
    if (filter === "pending" && noteStatus !== "draft") return false;
    if (filter === "approved" && noteStatus !== "approved") return false;

    // 2. Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const reason = appt.reason_for_visit.toLowerCase();
      return reason.includes(term);
    }
    
    return true;
  }) || [];

  return (
    <div className="min-h-screen bg-background text-foreground font-sans pb-12 transition-theme">
      {/* Header Banner */}
      <header className="border-b border-card-border bg-card-bg/40 backdrop-blur-xl sticky top-0 z-50 transition-theme">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-teal-500/10 p-2.5 rounded-xl border border-teal-500/20 text-teal-400">
              <ClipboardList className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] text-teal-400 font-bold uppercase tracking-widest">Clinical Care Portal</span>
              <h1 className="text-lg font-bold">Doctor Consult Queue</h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-foreground">{user.name}</p>
              <p className="text-[11px] text-teal-500 font-semibold uppercase tracking-wider">{user.role}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-input-bg border border-input-border flex items-center justify-center font-bold text-teal-500 transition-theme shadow-sm">
              {user.name.split(" ").map(n => n[0]).join("")}
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-6 mt-8">
        
        {/* Welcome Section */}
        <div className="bg-card-bg border border-card-border rounded-3xl p-8 mb-8 transition-theme shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />
          <h2 className="text-2xl font-extrabold text-foreground mb-2">Welcome Back, {user.name.split(" ")[0]}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
            Review patient consult list, view active telehealth rooms, or open the AI Scribe Split-Screen workspace to sign and approve clinical documentation.
          </p>
        </div>

        {/* Frameless Consultation Analytics Dashboard Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          
          {/* Card 1: Key Metrics */}
          <div className="bg-card-bg border border-card-border rounded-3xl p-6 transition-theme shadow-sm flex flex-col justify-between">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block mb-1">Today's Overview</span>
            <div className="flex justify-between items-end">
              <div>
                <span className="text-3xl font-black text-foreground">8</span>
                <span className="text-xs text-emerald-500 font-semibold ml-2 inline-flex items-center gap-0.5">
                  +12% vs yesterday
                </span>
              </div>
              <span className="text-[10px] text-teal-500 font-bold bg-teal-500/10 px-2 py-0.5 rounded-md border border-teal-500/20">Consults</span>
            </div>
            <div className="border-t border-card-border mt-4 pt-4 flex justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Completed: 6</span>
              <span>In Queue: 2</span>
            </div>
          </div>

          {/* Card 2: Average Duration */}
          <div className="bg-card-bg border border-card-border rounded-3xl p-6 transition-theme shadow-sm flex flex-col justify-between">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block mb-1">EHR Documentation Speed</span>
            <div className="flex justify-between items-end">
              <div>
                <span className="text-3xl font-black text-foreground">2.4m</span>
                <span className="text-xs text-teal-500 font-semibold ml-2 inline-flex items-center gap-0.5">
                  92% AI-assisted
                </span>
              </div>
              <span className="text-[10px] text-indigo-500 font-bold bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">Avg. Scribe Note Draft</span>
            </div>
            <div className="border-t border-card-border mt-4 pt-4 flex justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Time saved: 4.8 hrs</span>
              <span>Accuracy: 98.4%</span>
            </div>
          </div>

          {/* Card 3: Interactive Consultation Analytics Chart */}
          <div className="bg-card-bg border border-card-border rounded-3xl p-6 transition-theme shadow-sm flex flex-col justify-between">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block mb-2">Hourly Consultations Volume</span>
            
            {/* Frameless CSS Bar Chart */}
            <div className="flex items-end justify-between h-16 px-2">
              <div className="flex flex-col items-center gap-1.5 flex-1">
                <div className="w-5 bg-teal-500/20 dark:bg-teal-500/10 hover:bg-teal-500/40 rounded-t-md h-8 transition-all duration-300 relative group cursor-pointer">
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 bg-slate-900 text-white text-[9px] font-bold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap mb-1">2 Consults</div>
                </div>
                <span className="text-[8px] text-slate-450 dark:text-slate-400 font-bold">9 AM</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 flex-1">
                <div className="w-5 bg-teal-500/40 dark:bg-teal-500/30 hover:bg-teal-500/60 rounded-t-md h-12 transition-all duration-300 relative group cursor-pointer">
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 bg-slate-900 text-white text-[9px] font-bold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap mb-1">3 Consults</div>
                </div>
                <span className="text-[8px] text-slate-450 dark:text-slate-400 font-bold">11 AM</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 flex-1">
                <div className="w-5 bg-teal-500/80 dark:bg-teal-500/60 hover:bg-teal-500 rounded-t-md h-16 transition-all duration-300 relative group cursor-pointer">
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 bg-slate-900 text-white text-[9px] font-bold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap mb-1">5 Consults</div>
                </div>
                <span className="text-[8px] text-slate-450 dark:text-slate-400 font-bold">1 PM</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 flex-1">
                <div className="w-5 bg-teal-500/30 dark:bg-teal-500/20 hover:bg-teal-500/50 rounded-t-md h-10 transition-all duration-300 relative group cursor-pointer">
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 bg-slate-900 text-white text-[9px] font-bold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap mb-1">2 Consults</div>
                </div>
                <span className="text-[8px] text-slate-450 dark:text-slate-400 font-bold">3 PM</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 flex-1">
                <div className="w-5 bg-teal-500/10 dark:bg-teal-500/5 hover:bg-teal-500/20 rounded-t-md h-4 transition-all duration-300 relative group cursor-pointer">
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 bg-slate-900 text-white text-[9px] font-bold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap mb-1">1 Consult</div>
                </div>
                <span className="text-[8px] text-slate-450 dark:text-slate-400 font-bold">5 PM</span>
              </div>
            </div>
            
          </div>

        </div>

        {/* Filters and Search */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-6">
          {/* Tab buttons */}
          <div className="flex bg-input-bg p-1 rounded-2xl border border-input-border w-full md:w-auto transition-theme">
            <button
              onClick={() => setFilter("all")}
              className={`flex-1 md:flex-initial px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filter === "all" ? "bg-teal-500 text-slate-950" : "text-slate-500 dark:text-slate-400 hover:text-teal-550"
              }`}
            >
              All Appointments
            </button>
            <button
              onClick={() => setFilter("pending")}
              className={`flex-1 md:flex-initial px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filter === "pending" ? "bg-teal-500 text-slate-950" : "text-slate-500 dark:text-slate-400 hover:text-teal-550"
              }`}
            >
              Pending Approval (Drafts)
            </button>
            <button
              onClick={() => setFilter("approved")}
              className={`flex-1 md:flex-initial px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filter === "approved" ? "bg-teal-500 text-slate-950" : "text-slate-500 dark:text-slate-400 hover:text-teal-550"
              }`}
            >
              Completed & Approved
            </button>
          </div>

          {/* Search bar */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by reason..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-input-bg border border-input-border focus:border-teal-500/50 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-foreground placeholder-slate-400 focus:outline-none transition-theme"
            />
          </div>
        </div>

        {/* Appointments Queue Table */}
        <div className="bg-card-bg border border-card-border rounded-3xl overflow-hidden shadow-sm transition-theme">
          {isLoading ? (
            <div className="py-20 text-center">
              <div className="w-10 h-10 border-4 border-teal-500/20 border-t-teal-500 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-xs text-slate-400">Loading today's clinical queue...</p>
            </div>
          ) : error ? (
            <div className="py-20 text-center text-rose-400">
              <p className="text-sm font-semibold">Error: {(error as Error).message}</p>
            </div>
          ) : filteredAppointments.length === 0 ? (
            <div className="py-20 text-center text-slate-500">
              <ClipboardList className="w-12 h-12 text-slate-700 mx-auto mb-3" />
              <p className="text-sm font-semibold">No appointments found matching filters.</p>
              <p className="text-xs text-slate-600 mt-1">Use the seeder script to populate simulation queue data.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-card-border bg-sidebar-bg/60 text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold transition-theme">
                    <th className="px-6 py-4">Time</th>
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4">Visit Reason</th>
                    <th className="px-6 py-4">Note Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-card-border transition-theme">
                  {filteredAppointments.map((appt) => {
                    const apptTime = new Date(appt.appointment_time);
                    const formattedTime = apptTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    const formattedDate = apptTime.toLocaleDateString([], { month: 'short', day: 'numeric' });
                    
                    const noteStatus = appt.clinical_note?.status || "none";

                    return (
                      <tr key={appt.id} className="hover:bg-sidebar-bg/40 transition-theme group">
                        {/* Time */}
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <Clock className="w-4 h-4 text-teal-400" />
                            <div>
                              <p className="text-xs font-bold text-foreground">{formattedTime}</p>
                              <p className="text-[10px] text-slate-550 dark:text-slate-400 font-semibold">{formattedDate}</p>
                            </div>
                          </div>
                        </td>

                        {/* Consultation Type */}
                        <td className="px-6 py-5">
                          {appt.consult_type === "telehealth" ? (
                            <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-teal-500/10 text-teal-400 border border-teal-500/20">
                              Virtual
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                              In-Person
                            </span>
                          )}
                        </td>

                        {/* Visit Reason */}
                        <td className="px-6 py-5 max-w-sm">
                          <p className="text-xs text-foreground font-medium line-clamp-1">{appt.reason_for_visit}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] text-slate-550 dark:text-slate-400 font-semibold">Patient ID: {appt.patient_id.substring(0, 8)}</span>
                            <button
                              onClick={() => handleViewPatientProfile(appt.patient_id)}
                              className="text-[9px] font-bold text-teal-400 hover:text-teal-300 hover:underline transition-all"
                            >
                              (View Clinical Profile)
                            </button>
                          </div>
                        </td>

                        {/* Note Status */}
                        <td className="px-6 py-5">
                          {noteStatus === "draft" && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                              Draft
                            </span>
                          )}
                          {noteStatus === "approved" && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              <Lock className="w-3 h-3" />
                              Approved
                            </span>
                          )}
                          {noteStatus === "none" && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                              No Note
                            </span>
                          )}
                        </td>

                        {/* Action buttons */}
                        <td className="px-6 py-5 text-right">
                          <div className="flex items-center justify-end gap-2.5">
                            {/* Room Quick Link */}
                            {appt.consult_type === "telehealth" && noteStatus !== "approved" && (
                              <Link
                                href={`/doctor/appointments/${appt.id}/room`}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold bg-slate-800 hover:bg-slate-750 text-slate-200 transition-all border border-slate-700/60"
                              >
                                Join Room
                                <ExternalLink className="w-3 h-3" />
                              </Link>
                            )}

                            {/* Note Editor Links */}
                            {noteStatus === "draft" ? (
                              <Link
                                href={`/doctor/appointments/${appt.id}/scribe`}
                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-[11px] font-bold bg-teal-500 hover:bg-teal-400 text-slate-950 transition-all"
                              >
                                Continue Scribe
                              </Link>
                            ) : noteStatus === "approved" ? (
                              <Link
                                href={`/doctor/appointments/${appt.id}/scribe`}
                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-[11px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all border border-slate-700"
                              >
                                <FileText className="w-3 h-3" />
                                View Note
                              </Link>
                            ) : (
                              <button
                                onClick={async () => {
                                  // Call telehealth endpoint to start scribe or create manual draft
                                  const roomName = `appointment_${appt.id}`;
                                  try {
                                    alert("Starting Scribe. Join the Telehealth Room to run recording, or run verify_phase4.py diagnostic trigger.");
                                  } catch (e) {
                                    console.error(e);
                                  }
                                }}
                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-[11px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-400 transition-all border border-slate-700 border-dashed"
                              >
                                <PlusCircle className="w-3.5 h-3.5" />
                                Initialize Scribe
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Patient Profile Overlay Modal */}
      {profileModalOpen && patientProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-card-bg border border-card-border rounded-3xl p-6 md:p-8 shadow-2xl space-y-6 relative selection:bg-teal-500 selection:text-slate-950 transition-theme">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-black text-foreground">Patient Clinical Profile</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">HIPAA Protected EHR Directory</p>
              </div>
              <button
                onClick={() => { setProfileModalOpen(false); setPatientProfile(null); }}
                className="w-8 h-8 rounded-xl bg-input-bg hover:bg-sidebar-bg border border-input-border flex items-center justify-center text-slate-550 hover:text-foreground transition-theme text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {/* Account info */}
              <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-800 flex gap-4 items-center shadow-inner">
                <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 font-extrabold text-lg">
                  {patientProfile.name ? patientProfile.name.charAt(0).toUpperCase() : "P"}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-200">{patientProfile.name}</p>
                  <p className="text-xs text-slate-500">{patientProfile.email}</p>
                </div>
              </div>

              {/* Metrics constants grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                <div className="bg-slate-950/20 p-3 rounded-xl border border-slate-800">
                  <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Age</span>
                  <span className="text-sm font-extrabold text-teal-400 mt-1 block">{patientProfile.age ?? "--"} yrs</span>
                </div>
                <div className="bg-slate-950/20 p-3 rounded-xl border border-slate-800">
                  <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Gender</span>
                  <span className="text-sm font-extrabold text-teal-400 mt-1 block truncate">{patientProfile.gender ?? "--"}</span>
                </div>
                <div className="bg-slate-950/20 p-3 rounded-xl border border-slate-800">
                  <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Weight</span>
                  <span className="text-sm font-extrabold text-teal-400 mt-1 block">{patientProfile.weight ?? "--"} kg</span>
                </div>
                <div className="bg-slate-950/20 p-3 rounded-xl border border-slate-800">
                  <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Height</span>
                  <span className="text-sm font-extrabold text-teal-400 mt-1 block">{patientProfile.height ?? "--"} cm</span>
                </div>
              </div>

              {/* Calculated BMI */}
              {patientProfile.weight && patientProfile.height && (
                <div className="bg-emerald-500/5 border border-emerald-500/10 p-3.5 rounded-2xl flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-400">Dynamically Calculated BMI:</span>
                  <span className="font-black text-emerald-450">
                    {(Number(patientProfile.weight) / Math.pow(Number(patientProfile.height) / 100, 2)).toFixed(1)}
                  </span>
                </div>
              )}

              {/* Allergies and Chronic Illnesses */}
              <div className="space-y-3">
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Allergies Profile</span>
                  <div className="bg-slate-950/40 p-3.5 rounded-xl border border-slate-800 text-xs text-slate-300 min-h-[45px]">
                    {patientProfile.allergies || "No active allergies logged."}
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Chronic Illnesses & Pre-existing Parameters</span>
                  <div className="bg-slate-950/40 p-3.5 rounded-xl border border-slate-800 text-xs text-slate-300 min-h-[45px]">
                    {patientProfile.chronic_illnesses || "No pre-existing conditions logged."}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
