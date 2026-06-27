"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/useAuthStore";
import { 
  User, Shield, Heart, ArrowLeft, Save, Activity, 
  Calendar, Check, AlertCircle, FileText, ChevronDown, ChevronUp, AlertTriangle
} from "lucide-react";

interface Doctor {
  id: string;
  specialty: string;
  clinic_address: string;
  zip_code: string;
  photo_url: string | null;
  rating: number;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

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
  appointment_time: string;
  consult_type: string;
  reason_for_visit: string;
  status: string;
  duration_minutes: number;
  clinical_note: ClinicalNote | null;
}

const parseBullets = (text: string | null): string[] => {
  if (!text) return [];
  // Split by newline, asterisks, or dashes
  return text
    .split(/\n|\*|-|•/)
    .map(line => line.trim())
    .filter(line => line.length > 2);
};

export default function ProfilePage() {
  const router = useRouter();
  const { user, token, setAuth } = useAuthStore();
  
  // Doctors catalog for resolving names
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [expandedApptId, setExpandedApptId] = useState<string | null>(null);
  const [noteTabs, setNoteTabs] = useState<Record<string, "summary" | "soap">>({});

  // Form Fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [age, setAge] = useState<number | "">("");
  const [weight, setWeight] = useState<number | "">("");
  const [height, setHeight] = useState<number | "">("");
  const [gender, setGender] = useState("");
  const [allergies, setAllergies] = useState("");
  const [chronicIllnesses, setChronicIllnesses] = useState("");

  // Status indicators
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fetch initial profile & appointments
  useEffect(() => {
    if (!user || !token) return;

    setName(user.name || "");
    setEmail(user.email || "");
    setAge(user.age ?? "");
    setWeight(user.weight ?? "");
    setHeight(user.height ?? "");
    setGender(user.gender || "");
    setAllergies(user.allergies || "");
    setChronicIllnesses(user.chronic_illnesses || "");

    const loadProfileData = async () => {
      try {
        setLoading(true);
        setErrorMsg(null);

        // 1. Fetch catalog of doctors
        const docRes = await fetch("http://localhost:8000/api/v1/public/doctors");
        if (docRes.ok) {
          const docData = await docRes.json();
          setDoctors(docData);
        }

        // 2. Fetch fresh user details to sync
        const meRes = await fetch("http://localhost:8000/api/v1/users/me", {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (meRes.ok) {
          const meData = await meRes.json();
          setAuth(token, meData); // Refresh cached store
          setAge(meData.age ?? "");
          setWeight(meData.weight ?? "");
          setHeight(meData.height ?? "");
          setGender(meData.gender || "");
          setAllergies(meData.allergies || "");
          setChronicIllnesses(meData.chronic_illnesses || "");
        }

        // 3. Fetch appointments if patient
        if (user.role === "Patient") {
          const apptRes = await fetch(`http://localhost:8000/api/v1/appointments?patient_id=${user.id}`, {
            headers: { "Authorization": `Bearer ${token}` }
          });
          if (apptRes.ok) {
            const apptData = await apptRes.json();
            setAppointments(apptData);
          }
        }
      } catch (err) {
        console.warn("Failed to load user profile statistics:", err);
        setErrorMsg("Failed to synchronize details. API services may be offline.");
      } finally {
        setLoading(false);
      }
    };

    loadProfileData();
  }, [user?.id, token]);

  // Handle Save edits
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !token) return;

    setSaving(true);
    setSaveSuccess(false);
    setErrorMsg(null);

    const payload = {
      name,
      email,
      age: age === "" ? null : Number(age),
      weight: weight === "" ? null : Number(weight),
      height: height === "" ? null : Number(height),
      gender: gender || null,
      allergies: allergies || null,
      chronic_illnesses: chronicIllnesses || null
    };

    try {
      const response = await fetch("http://localhost:8000/api/v1/users/me", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      setSaving(false);

      if (!response.ok) {
        setErrorMsg(data.detail || "Failed to update profile settings.");
        return;
      }

      setAuth(token, data); // Save updated object to Zustand
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setSaving(false);
      setErrorMsg("Failed to connect to backend service. Check configuration.");
    }
  };

  // Helper: Get Doctor Name by ID
  const resolveDoctorName = (docId: string) => {
    const doc = doctors.find(d => d.id === docId);
    return doc ? doc.user.name : "Consulting Provider";
  };

  const resolveDoctorSpecialty = (docId: string) => {
    const doc = doctors.find(d => d.id === docId);
    return doc ? doc.specialty : "Specialist";
  };

  // Dynamic BMI computation
  const calcBMI = () => {
    if (!weight || !height) return null;
    const heightM = Number(height) / 100;
    return (Number(weight) / (heightM * heightM)).toFixed(1);
  };

  const bmiVal = calcBMI();
  
  const getBMICategory = (val: number) => {
    if (val < 18.5) return { name: "Underweight", color: "text-sky-400", bg: "bg-sky-500/10" };
    if (val < 25.0) return { name: "Normal Weight", color: "text-emerald-400", bg: "bg-emerald-500/10" };
    if (val < 30.0) return { name: "Overweight", color: "text-amber-400", bg: "bg-amber-500/10" };
    return { name: "Obese", color: "text-rose-400", bg: "bg-rose-500/10" };
  };

  const bmiCategory = bmiVal ? getBMICategory(Number(bmiVal)) : null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 relative selection:bg-teal-500 selection:text-slate-950">
      
      {/* Background glow filters */}
      <div className="absolute top-[-10%] right-[-10%] w-[35%] h-[35%] bg-teal-500/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-15%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Profile Header */}
      <header className="border-b border-slate-900 bg-slate-900/40 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.push(user?.role === "Doctor" ? "/doctor/dashboard" : "/")}
              className="w-10 h-10 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-200 transition-all shadow-inner"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-teal-400 fill-teal-400" />
                <h1 className="text-lg font-black tracking-tight bg-gradient-to-r from-teal-400 to-emerald-300 bg-clip-text text-transparent">
                  Portal Settings
                </h1>
              </div>
              <p className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase">User Directory Account</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold bg-slate-950/60 border border-slate-800 rounded-full px-4 py-1.5 backdrop-blur-md">
            <Shield className="w-3.5 h-3.5 text-teal-400" />
            HIPAA Privacy Protected
          </div>
        </div>
      </header>

      {loading ? (
        <div className="min-h-[70vh] flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-12 gap-8 z-10 relative">
          
          {/* LEFT COLUMN: Sidebar Health Overview Panel */}
          <aside className="lg:col-span-4 space-y-6">
            
            {/* Account Metadata Card */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 shadow-xl backdrop-blur-md text-center space-y-4">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-teal-400 to-indigo-500 p-0.5 mx-auto shadow-md">
                <div className="w-full h-full bg-slate-950 rounded-[22px] flex items-center justify-center text-teal-300 text-3xl font-black shadow-inner">
                  {name ? name.charAt(0).toUpperCase() : <User className="w-8 h-8" />}
                </div>
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-slate-200">{name}</h2>
                <p className="text-xs text-slate-500">{email}</p>
              </div>
              <div className="inline-block px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase bg-teal-500/10 text-teal-400 border border-teal-500/25">
                {user?.role} Account
              </div>
            </div>

            {/* Health Overview / BMI Calculator Display (Only for Patients) */}
            {user?.role === "Patient" && (
              <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 shadow-xl backdrop-blur-md space-y-5">
                <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 pb-2 border-b border-slate-800/80">
                  <Activity className="w-4 h-4 text-teal-400" />
                  Health Status Overview
                </h3>

                {bmiVal ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-baseline">
                      <span className="text-xs text-slate-400 font-semibold">Calculated BMI</span>
                      <span className="text-2xl font-black text-slate-100">{bmiVal}</span>
                    </div>

                    <div className={`p-3 rounded-2xl ${bmiCategory?.bg} border border-slate-800/50 flex items-center justify-between`}>
                      <span className="text-xs text-slate-400 font-medium">Status Category</span>
                      <span className={`text-xs font-bold ${bmiCategory?.color}`}>{bmiCategory?.name}</span>
                    </div>

                    {/* Visual HSL Color scale pointer bar */}
                    <div className="space-y-1.5">
                      <div className="h-2 w-full rounded-full bg-gradient-to-r from-sky-400 via-emerald-400 via-amber-400 to-rose-400 relative overflow-hidden" />
                      <div className="flex justify-between text-[9px] text-slate-500 font-bold uppercase tracking-wider">
                        <span>18.5 Under</span>
                        <span>24.9 Norm</span>
                        <span>29.9 Over</span>
                        <span>Obese</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-4 text-center text-xs text-slate-500 space-y-2">
                    <p>Input height & weight parameters to display dynamic metabolic metrics.</p>
                  </div>
                )}

                {/* Health Metrics Recap */}
                <div className="grid grid-cols-2 gap-3 text-center pt-2">
                  <div className="bg-slate-950/40 p-3.5 rounded-2xl border border-slate-800/80 shadow-inner">
                    <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Weight</span>
                    <span className="text-base font-extrabold text-teal-300 mt-1 block">
                      {weight ? `${weight} kg` : "--"}
                    </span>
                  </div>
                  <div className="bg-slate-950/40 p-3.5 rounded-2xl border border-slate-800/80 shadow-inner">
                    <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Height</span>
                    <span className="text-base font-extrabold text-teal-300 mt-1 block">
                      {height ? `${height} cm` : "--"}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </aside>

          {/* RIGHT COLUMN: Profile Editor Form & Consultation Timelines */}
          <main className="lg:col-span-8 space-y-8">
            
            {/* Save Status Prompts */}
            {saveSuccess && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs px-5 py-4 rounded-3xl flex items-center gap-3">
                <Check className="w-5 h-5 shrink-0" />
                <span>Profile changes successfully committed to database.</span>
              </div>
            )}
            {errorMsg && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs px-5 py-4 rounded-3xl flex items-center gap-3">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Profile Forms Block */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl backdrop-blur-md">
              <form onSubmit={handleSave} className="space-y-6">
                
                {/* Account Details Block */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider pb-2 border-b border-slate-800">
                    Account Parameters
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Full Name</label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-slate-250 focus:outline-none focus:border-teal-500 text-sm transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Address</label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-slate-250 focus:outline-none focus:border-teal-500 text-sm transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Medical Parameter Inputs Block (Only for Patients) */}
                {user?.role === "Patient" && (
                  <div className="space-y-5 pt-4">
                    <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider pb-2 border-b border-slate-800">
                      Medical Profile & Vital Constants
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Age (Years)</label>
                        <input
                          type="number"
                          placeholder="e.g. 35"
                          min="0"
                          max="150"
                          value={age}
                          onChange={(e) => setAge(e.target.value === "" ? "" : Number(e.target.value))}
                          className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-slate-250 focus:outline-none focus:border-teal-500 text-sm transition-all"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Weight (kg)</label>
                        <input
                          type="number"
                          step="0.1"
                          placeholder="e.g. 72.5"
                          min="0"
                          value={weight}
                          onChange={(e) => setWeight(e.target.value === "" ? "" : Number(e.target.value))}
                          className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-slate-250 focus:outline-none focus:border-teal-500 text-sm transition-all"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Height (cm)</label>
                        <input
                          type="number"
                          step="0.1"
                          placeholder="e.g. 175"
                          min="0"
                          value={height}
                          onChange={(e) => setHeight(e.target.value === "" ? "" : Number(e.target.value))}
                          className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-slate-250 focus:outline-none focus:border-teal-500 text-sm transition-all"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Gender</label>
                        <select
                          value={gender}
                          onChange={(e) => setGender(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-slate-400 focus:outline-none focus:border-teal-500 text-sm transition-all appearance-none"
                        >
                          <option value="">Select Gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                          <option value="Prefer not to say">Prefer not to say</option>
                        </select>
                      </div>

                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Allergies Profile</label>
                      <textarea
                        rows={2}
                        placeholder="List any medication or environmental allergies (e.g., Penicillin, Peanuts, Pollen). Leave blank if none."
                        value={allergies}
                        onChange={(e) => setAllergies(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-slate-250 placeholder-slate-650 focus:outline-none focus:border-teal-500 text-sm transition-all resize-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Chronic Illnesses & Pre-existing Parameters</label>
                      <textarea
                        rows={2}
                        placeholder="List any pre-existing health details doctors need to know (e.g. Asthma, Hypertension, Diabetes)."
                        value={chronicIllnesses}
                        onChange={(e) => setChronicIllnesses(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-slate-250 placeholder-slate-650 focus:outline-none focus:border-teal-500 text-sm transition-all resize-none"
                      />
                    </div>
                  </div>
                )}

                <div className="pt-4 flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="py-3.5 px-6 bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-slate-950 font-bold text-sm rounded-2xl shadow-lg shadow-teal-500/10 flex items-center gap-2 transition-all cursor-pointer"
                  >
                    {saving ? (
                      <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Save Profile Settings
                      </>
                    )}
                  </button>
                </div>

              </form>
            </div>

            {/* Historical Consultations Timeline (Only for Patients) */}
            {user?.role === "Patient" && (
              <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl backdrop-blur-md space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-800">
                    <Calendar className="w-4.5 h-4.5 text-teal-400" />
                    Consultation History Log
                  </h3>
                  <p className="text-xs text-slate-500 mt-1.5">
                    Select a previous session below to expand the associated HIPAA clinical summary notes.
                  </p>
                </div>

                {appointments.length === 0 ? (
                  <div className="py-10 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-2xl">
                    No historical consultations or future sessions booked on this account yet.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {appointments.map((appt) => {
                      const isExpanded = expandedApptId === appt.id;
                      const dateStr = new Date(appt.appointment_time).toLocaleDateString("en-US", {
                        weekday: "short", month: "short", day: "numeric", year: "numeric"
                      });
                      const timeStr = new Date(appt.appointment_time).toLocaleTimeString("en-US", {
                        hour: "2-digit", minute: "2-digit"
                      });
                      
                      return (
                        <div 
                          key={appt.id} 
                          className="bg-slate-950 border border-slate-850 rounded-2xl overflow-hidden transition-all shadow-md"
                        >
                          {/* Accordion Trigger Header */}
                          <button
                            type="button"
                            onClick={() => setExpandedApptId(isExpanded ? null : appt.id)}
                            className="w-full text-left p-5 flex items-center justify-between hover:bg-slate-900/40 transition-all"
                          >
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-slate-200">
                                  {resolveDoctorName(appt.doctor_id)}
                                </span>
                                <span className="text-[10px] font-bold text-slate-500 bg-slate-900 border border-slate-850 px-2 py-0.5 rounded-full">
                                  {resolveDoctorSpecialty(appt.doctor_id)}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 text-xs text-slate-400">
                                <span>{dateStr}</span>
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-800" />
                                <span>{timeStr}</span>
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-800" />
                                <span className="capitalize font-semibold text-teal-400/80">
                                  {appt.consult_type.replace("_", " ")}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                                appt.status === "completed" 
                                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                  : appt.status === "confirmed" || appt.status === "pending"
                                  ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                  : "bg-slate-900 text-slate-500 border-slate-800"
                              }`}>
                                {appt.status}
                              </span>
                              {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                            </div>
                          </button>

                          {/* Accordion Expandable Content */}
                          {isExpanded && (
                            <div className="border-t border-slate-900 p-5 bg-slate-900/15 space-y-4 text-xs leading-relaxed text-slate-400">
                              
                              {/* Reason for Visit */}
                              <div className="space-y-1">
                                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Reason for visit</h4>
                                <p className="text-slate-350">{appt.reason_for_visit}</p>
                              </div>

                              {/* HIPAA Clinical Scribe Note Display */}
                              <div className="space-y-3 pt-2">
                                <div className="flex items-center gap-1.5">
                                  <FileText className="w-4 h-4 text-teal-400" />
                                  <h4 className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                                    Clinical consultation summary Note
                                  </h4>
                                </div>

                                {appt.clinical_note ? (
                                   <div className="space-y-4">
                                     {/* Tab Selectors */}
                                     <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-850 w-fit">
                                       <button
                                         type="button"
                                         onClick={() => setNoteTabs(prev => ({ ...prev, [appt.id]: "summary" }))}
                                         className={`px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                                           (noteTabs[appt.id] || "summary") === "summary"
                                             ? "bg-teal-500 text-slate-950"
                                             : "text-slate-400 hover:text-slate-200"
                                         }`}
                                       >
                                         Care Summary
                                       </button>
                                       <button
                                         type="button"
                                         onClick={() => setNoteTabs(prev => ({ ...prev, [appt.id]: "soap" }))}
                                         className={`px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                                           (noteTabs[appt.id] || "summary") === "soap"
                                             ? "bg-teal-500 text-slate-950"
                                             : "text-slate-400 hover:text-slate-200"
                                         }`}
                                       >
                                         Clinical SOAP Note
                                       </button>
                                     </div>

                                     {/* Tab Body */}
                                     {(noteTabs[appt.id] || "summary") === "summary" ? (
                                       <div className="bg-slate-900/50 border border-slate-850 rounded-2xl p-5 space-y-4 shadow-inner">
                                         
                                         {/* Disease Summary Card */}
                                         <div className="bg-teal-500/5 border border-teal-500/10 rounded-xl p-4 space-y-1">
                                           <span className="block text-[9px] font-bold text-teal-400 uppercase tracking-widest">Disease/Visit Summary</span>
                                           <p className="text-slate-250 font-medium leading-relaxed italic text-xs">
                                             "{appt.clinical_note.patient_summary || "No visit summary synthesized yet."}"
                                           </p>
                                         </div>

                                         {/* Discussion Bullet Points & Treatment Plan grid */}
                                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                           {/* Discussion Points */}
                                           <div className="space-y-2">
                                             <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest">Discussion Highlights</span>
                                             <ul className="space-y-1.5 list-disc pl-4 text-xs text-slate-350 leading-relaxed">
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
                                             <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest">Prescribed Plan & Recommended Medicine</span>
                                             <div className="space-y-1.5">
                                               {parseBullets(appt.clinical_note.plan).length > 0 ? (
                                                 parseBullets(appt.clinical_note.plan).map((bullet, idx) => (
                                                   <div key={idx} className="flex items-start gap-2">
                                                     <div className="w-4 h-4 rounded bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 text-[9px] font-bold shrink-0 mt-0.5">✓</div>
                                                     <span className="text-xs text-slate-350">{bullet}</span>
                                                   </div>
                                                 ))
                                               ) : (
                                                 <p className="text-xs text-slate-500 italic">No specific medicines or treatment plan logged.</p>
                                               )}
                                             </div>
                                           </div>
                                         </div>

                                         {/* Precautions / Doctor Tips Checklist */}
                                         <div className="space-y-2 pt-2 border-t border-slate-850/80">
                                           <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest">Physician Precautions & Tips</span>
                                           <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                                             {parseBullets(appt.clinical_note.objective).length > 0 ? (
                                               parseBullets(appt.clinical_note.objective).map((bullet, idx) => (
                                                 <div key={idx} className="flex items-start gap-2 p-2.5 rounded-xl bg-slate-950/40 border border-slate-850 shadow-inner">
                                                   <div className="w-4 h-4 rounded bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 text-[9px] font-bold shrink-0 mt-0.5">!</div>
                                                   <span className="text-[11px] text-slate-400 leading-normal">{bullet}</span>
                                                 </div>
                                               ))
                                             ) : (
                                               <>
                                                 <div className="flex items-start gap-2 p-2.5 rounded-xl bg-slate-950/40 border border-slate-850">
                                                   <div className="w-4 h-4 rounded bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 text-[9px] font-bold shrink-0 mt-0.5">!</div>
                                                   <span className="text-[11px] text-slate-400">Regularly monitor symptom status; report anomalies.</span>
                                                 </div>
                                                 <div className="flex items-start gap-2 p-2.5 rounded-xl bg-slate-950/40 border border-slate-850">
                                                   <div className="w-4 h-4 rounded bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 text-[9px] font-bold shrink-0 mt-0.5">!</div>
                                                   <span className="text-[11px] text-slate-400">Reach out to the AI Care Companion check-in bot for safety guidelines.</span>
                                                 </div>
                                               </>
                                             )}
                                           </div>
                                         </div>

                                       </div>
                                     ) : (
                                       /* SOAP Note Tab Body */
                                       <div className="bg-slate-900/50 border border-slate-850 rounded-2xl p-5 space-y-3 shadow-inner">
                                         <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                           <div className="space-y-0.5">
                                             <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Subjective</span>
                                             <p className="text-slate-350 text-xs">{appt.clinical_note.subjective || "No notes."}</p>
                                           </div>
                                           <div className="space-y-0.5">
                                             <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Objective</span>
                                             <p className="text-slate-350 text-xs">{appt.clinical_note.objective || "No notes."}</p>
                                           </div>
                                           <div className="space-y-0.5">
                                             <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Assessment</span>
                                             <p className="text-slate-350 text-xs">{appt.clinical_note.assessment || "No notes."}</p>
                                           </div>
                                           <div className="space-y-0.5">
                                             <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Care Plan</span>
                                             <p className="text-slate-350 text-xs">{appt.clinical_note.plan || "No notes."}</p>
                                           </div>
                                         </div>
                                       </div>
                                     )}

                                     {/* Escalation Warnings */}
                                     {appt.clinical_note.requires_escalation && (
                                       <div className="bg-rose-500/10 border border-rose-500/25 p-3 rounded-xl flex items-center gap-2 mt-2">
                                         <AlertTriangle className="w-4.5 h-4.5 text-rose-450 shrink-0" />
                                         <span className="text-[10px] font-bold text-rose-400">
                                           Attention: Safety escalation warning active for this consultation note. Review care companion guidelines.
                                         </span>
                                       </div>
                                     )}
                                   </div>
                                 ) : (
                                   <div className="py-3 px-4 bg-slate-900/30 border border-slate-850 rounded-xl text-slate-500 italic text-[11px]">
                                     No clinical summary notes are linked to this consultation ID. A summary is synthesized automatically following telehealth room calls.
                                   </div>
                                 )}
                              </div>

                              {/* Companion & Telehealth redirects */}
                              <div className="pt-2 flex justify-end gap-3">
                                {appt.status === "completed" && (
                                  <Link
                                    href={`/appointments/${appt.id}/companion`}
                                    className="text-[10px] font-bold text-teal-400 hover:text-teal-300 hover:underline flex items-center gap-1.5"
                                  >
                                    Chat with Care Companion for this visit
                                    <ArrowLeft className="w-3 h-3 rotate-180" />
                                  </Link>
                                )}
                                {(appt.status === "confirmed" || appt.status === "pending") && appt.consult_type === "telehealth" && (
                                  <Link
                                    href={`/appointments/${appt.id}/room`}
                                    className="text-[10px] font-bold text-teal-400 hover:text-teal-300 hover:underline flex items-center gap-1.5"
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
            )}
          </main>

        </div>
      )}
      
    </div>
  );
}
