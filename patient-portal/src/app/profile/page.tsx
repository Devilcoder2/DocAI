"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { 
  User, Shield, Heart, ArrowLeft, Save, Activity, 
  Check, AlertCircle, ChevronDown
} from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();
  const { user, token, setAuth } = useAuthStore();

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

  // Fetch initial profile parameters
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

        const meRes = await fetch("http://localhost:8000/api/v1/users/me", {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (meRes.ok) {
          const meData = await meRes.json();
          setAuth(token, meData);
          setAge(meData.age ?? "");
          setWeight(meData.weight ?? "");
          setHeight(meData.height ?? "");
          setGender(meData.gender || "");
          setAllergies(meData.allergies || "");
          setChronicIllnesses(meData.chronic_illnesses || "");
        }
      } catch (err) {
        console.warn("Failed to load user profile details:", err);
        setErrorMsg("Failed to synchronize details. API services may be offline.");
      } finally {
        setLoading(false);
      }
    };

    loadProfileData();
  }, [user?.id, token]);

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

      setAuth(token, data);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setSaving(false);
      setErrorMsg("Failed to connect to backend service. Check configuration.");
    }
  };

  const calcBMI = () => {
    if (!weight || !height) return null;
    const heightM = Number(height) / 100;
    return (Number(weight) / (heightM * heightM)).toFixed(1);
  };

  const bmiVal = calcBMI();
  
  const getBMICategory = (val: number) => {
    if (val < 18.5) return { name: "Underweight", color: "text-sky-600", bg: "bg-sky-50" };
    if (val < 25.0) return { name: "Normal Weight", color: "text-emerald-600", bg: "bg-emerald-50" };
    if (val < 30.0) return { name: "Overweight", color: "text-amber-600", bg: "bg-amber-50" };
    return { name: "Obese", color: "text-rose-600", bg: "bg-rose-50" };
  };

  const bmiCategory = bmiVal ? getBMICategory(Number(bmiVal)) : null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 relative selection:bg-indigo-500 selection:text-white">
      
      {/* Background glow filters */}
      <div className="absolute top-[-10%] right-[-10%] w-[35%] h-[35%] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-15%] left-[-10%] w-[40%] h-[40%] bg-violet-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Profile Header */}
      <header className="border-b border-slate-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.push(user?.role === "Doctor" ? "/doctor/dashboard" : "/")}
              className="w-10 h-10 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 transition-all shadow-sm cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-indigo-600 fill-indigo-100" />
                <h1 className="text-lg font-display font-black tracking-tight text-medical-blue-dark">
                  Profile
                </h1>
              </div>
              <p className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase font-mono">User Directory Account</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-indigo-700 font-semibold bg-indigo-50 border border-indigo-100 rounded-full px-4 py-1.5 backdrop-blur-md">
            <Shield className="w-3.5 h-3.5 text-indigo-600" />
            HIPAA Privacy Protected
          </div>
        </div>
      </header>

      {loading ? (
        <div className="min-h-[70vh] flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-12 gap-8 z-10 relative">
          
          {/* LEFT COLUMN: Sidebar Health Overview Panel */}
          <aside className="lg:col-span-4 space-y-6">
            
            {/* Account Metadata Card */}
            <div className="bg-white border border-slate-150 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300 text-center space-y-4">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-500 to-violet-650 p-0.5 mx-auto shadow-md">
                <div className="w-full h-full bg-white rounded-[22px] flex items-center justify-center text-indigo-600 text-3xl font-black shadow-inner select-none">
                  {name ? name.charAt(0).toUpperCase() : <User className="w-8 h-8" />}
                </div>
              </div>
              <div>
                <h2 className="text-lg font-display font-extrabold text-medical-blue-dark leading-snug">{name}</h2>
                <p className="text-xs text-slate-500">{email}</p>
              </div>
              <div className="inline-block px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase bg-indigo-50 text-indigo-700 border border-indigo-100/50">
                {user?.role} Account
              </div>
            </div>

            {/* Health Overview / BMI Calculator Display (Only for Patients) */}
            {user?.role === "Patient" && (
              <div className="bg-white border border-slate-150 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300 space-y-5">
                <h3 className="text-sm font-bold text-medical-blue-dark flex items-center gap-2 pb-2 border-b border-slate-100">
                  <Activity className="w-4 h-4 text-indigo-600" />
                  Health Status Overview
                </h3>

                {bmiVal ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-baseline">
                      <span className="text-xs text-slate-500 font-semibold">Calculated BMI</span>
                      <span className="text-2xl font-display font-black text-slate-900">{bmiVal}</span>
                    </div>

                    <div className={`p-3.5 rounded-2xl ${bmiCategory?.bg} border border-slate-100 flex items-center justify-between`}>
                      <span className="text-xs text-slate-500 font-medium">Status Category</span>
                      <span className={`text-xs font-extrabold ${bmiCategory?.color}`}>{bmiCategory?.name}</span>
                    </div>

                    {/* Visual Color scale pointer bar */}
                    <div className="space-y-1.5">
                      <div className="h-2 w-full rounded-full bg-gradient-to-r from-sky-400 via-emerald-450 via-emerald-400 via-amber-400 to-rose-455 to-rose-400 relative overflow-hidden" />
                      <div className="flex justify-between text-[9px] text-slate-400 font-bold uppercase tracking-wider font-mono">
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
                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 shadow-inner">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Weight</span>
                    <span className="text-base font-display font-extrabold text-indigo-600 mt-1 block">
                      {weight ? `${weight} kg` : "--"}
                    </span>
                  </div>
                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 shadow-inner">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Height</span>
                    <span className="text-base font-display font-extrabold text-indigo-600 mt-1 block">
                      {height ? `${height} cm` : "--"}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </aside>

          {/* RIGHT COLUMN: Profile Editor Form */}
          <main className="lg:col-span-8 space-y-8">
            
            {/* Save Status Prompts */}
            {saveSuccess && (
              <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs px-5 py-4 rounded-3xl flex items-center gap-3 animate-fade-in shadow-sm">
                <Check className="w-5 h-5 shrink-0" />
                <span>Profile changes successfully committed to database.</span>
              </div>
            )}
            {errorMsg && (
              <div className="bg-rose-50 border border-rose-100 text-rose-700 text-xs px-5 py-4 rounded-3xl flex items-center gap-3 animate-fade-in shadow-sm">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Profile Forms Block */}
            <div className="bg-white border border-slate-150 rounded-[32px] p-6 md:p-8 shadow-sm hover:shadow-md transition-shadow duration-300">
              <form onSubmit={handleSave} className="space-y-6">
                
                {/* Account Details Block */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-medical-blue-dark uppercase tracking-wider pb-2 border-b border-slate-100 font-mono">
                    Account Parameters
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">Full Name</label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-2xl py-3.5 px-4 text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 text-sm transition-all outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">Email Address</label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-2xl py-3.5 px-4 text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 text-sm transition-all outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Medical Parameter Inputs Block (Only for Patients) */}
                {user?.role === "Patient" && (
                  <div className="space-y-5 pt-4">
                    <h3 className="text-sm font-bold text-medical-blue-dark uppercase tracking-wider pb-2 border-b border-slate-100 font-mono">
                      Medical Profile & Vital Constants
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">Age (Years)</label>
                        <input
                          type="number"
                          placeholder="e.g. 35"
                          min="0"
                          max="150"
                          value={age}
                          onChange={(e) => setAge(e.target.value === "" ? "" : Number(e.target.value))}
                          className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-2xl py-3.5 px-4 text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 text-sm transition-all outline-none"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">Weight (kg)</label>
                        <input
                          type="number"
                          step="0.1"
                          placeholder="e.g. 72.5"
                          min="0"
                          value={weight}
                          onChange={(e) => setWeight(e.target.value === "" ? "" : Number(e.target.value))}
                          className="w-full bg-slate-55 bg-slate-50 border border-slate-200 focus:bg-white rounded-2xl py-3.5 px-4 text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 text-sm transition-all outline-none"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">Height (cm)</label>
                        <input
                          type="number"
                          step="0.1"
                          placeholder="e.g. 175"
                          min="0"
                          value={height}
                          onChange={(e) => setHeight(e.target.value === "" ? "" : Number(e.target.value))}
                          className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-2xl py-3.5 px-4 text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 text-sm transition-all outline-none"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">Gender</label>
                        <div className="relative">
                          <select
                            value={gender}
                            onChange={(e) => setGender(e.target.value)}
                            className="w-full bg-slate-55 bg-slate-50 border border-slate-200 focus:bg-white rounded-2xl py-3.5 px-4 text-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 text-sm transition-all outline-none appearance-none cursor-pointer"
                          >
                            <option value="">Select Gender</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                            <option value="Prefer not to say">Prefer not to say</option>
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                            <ChevronDown className="w-4 h-4" />
                          </div>
                        </div>
                      </div>

                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">Allergies Profile</label>
                      <textarea
                        rows={2}
                        placeholder="List any medication or environmental allergies (e.g., Penicillin, Peanuts, Pollen). Leave blank if none."
                        value={allergies}
                        onChange={(e) => setAllergies(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-2xl py-3.5 px-4 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 text-sm transition-all outline-none resize-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">Chronic Illnesses & Pre-existing Parameters</label>
                      <textarea
                        rows={2}
                        placeholder="List any pre-existing health details doctors need to know (e.g. Asthma, Hypertension, Diabetes)."
                        value={chronicIllnesses}
                        onChange={(e) => setChronicIllnesses(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-2xl py-3.5 px-4 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 text-sm transition-all outline-none resize-none"
                      />
                    </div>
                  </div>
                )}

                <div className="pt-4 flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="py-3.5 px-6 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-sm rounded-2xl shadow-lg shadow-indigo-600/10 flex items-center gap-2 transition-all cursor-pointer hover:-translate-y-0.5 active:scale-95 duration-200"
                  >
                    {saving ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
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
          </main>

        </div>
      )}
      
    </div>
  );
}
