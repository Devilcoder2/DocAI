"use client";

import React, { useState, useEffect, useRef, use } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, Search, Save, CheckCircle, Lock, 
  User, Calendar, Clock, Sparkles, AlertCircle, FileText, Check,
  History, AlertTriangle, ChevronDown, ChevronUp, Activity
} from "lucide-react";
import Link from "next/link";
import { useAuthStore } from "@/store/useAuthStore";

interface Doctor {
  id: string;
  specialty: string;
  user: {
    name: string;
  };
}

interface ClinicalNote {
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
}

interface Appointment {
  id: string;
  doctor_id: string;
  patient_id: string;
  appointment_time: string;
  duration_minutes: number;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  consult_type: "in_person" | "telehealth";
  reason_for_visit: string;
}

/**
 * Split-Screen Clinical Scribe Workspace.
 * Left Pane: Raw conversational transcript with speaker search filter.
 * Right Pane: Interactive text editor blocks supporting auto-save and doctor electronic sign-off.
 */
export default function ClinicalScribeWorkspace({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id: appointmentId } = use(params);
  const queryClient = useQueryClient();
  const { token, user } = useAuthStore();

  // Search & Filter transcript state
  const [transcriptQuery, setTranscriptQuery] = useState("");

  // Editor states
  const [subjective, setSubjective] = useState("");
  const [objective, setObjective] = useState("");
  const [assessment, setAssessment] = useState("");
  const [plan, setPlan] = useState("");
  const [patientSummary, setPatientSummary] = useState("");

  // Auto-save notification status
  const [saveStatus, setSaveStatus] = useState<"SAVED" | "SAVING" | "ERROR">("SAVED");
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // History panel states
  const [isHistoryOpen, setIsHistoryOpen] = useState(true);
  const [historySearch, setHistorySearch] = useState("");
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);

  // 1. Fetch Appointment Context
  const { data: appointment, isLoading: isLoadingApp } = useQuery<Appointment>({
    queryKey: ["appointment-scribe", appointmentId],
    queryFn: async () => {
      const response = await fetch(`http://localhost:8000/api/v1/appointments/${appointmentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) {
        throw new Error("Failed to load appointment details.");
      }
      return response.json();
    },
    enabled: !!token
  });

  // 2. Fetch Patient Profile
  const patientId = appointment?.patient_id;
  const { data: patientProfile } = useQuery({
    queryKey: ["patient-profile-scribe", patientId],
    queryFn: async () => {
      const response = await fetch(`http://localhost:8000/api/v1/users/${patientId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) {
        throw new Error("Failed to load patient profile.");
      }
      return response.json();
    },
    enabled: !!patientId
  });

  // Fetch patient's past appointments timeline
  const { data: patientHistory = [] } = useQuery<any[]>({
    queryKey: ["patient-history-timeline", patientId],
    queryFn: async () => {
      const response = await fetch(`http://localhost:8000/api/v1/appointments?patient_id=${patientId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) {
        throw new Error("Failed to load historical consults.");
      }
      return response.json();
    },
    enabled: !!token && !!patientId
  });

  // Fetch doctors directory to match names
  const { data: doctorsCatalog = [] } = useQuery<Doctor[]>({
    queryKey: ["doctors-catalog"],
    queryFn: async () => {
      const response = await fetch("http://localhost:8000/api/v1/public/doctors");
      if (!response.ok) {
        throw new Error("Failed to load doctors list.");
      }
      return response.json();
    }
  });

  // 3. Fetch Clinical Note
  const { data: clinicalNote, isLoading: isLoadingNote } = useQuery<ClinicalNote>({
    queryKey: ["clinical-note", appointmentId],
    queryFn: async () => {
      const response = await fetch(`http://localhost:8000/api/v1/appointments/${appointmentId}/clinical-note`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) {
        throw new Error("No clinical notes found.");
      }
      return response.json();
    },
    enabled: !!token
  });

  // 4. Update note editor states once loaded from database
  useEffect(() => {
    if (clinicalNote) {
      setSubjective(clinicalNote.subjective || "");
      setObjective(clinicalNote.objective || "");
      setAssessment(clinicalNote.assessment || "");
      setPlan(clinicalNote.plan || "");
      setPatientSummary(clinicalNote.patient_summary || "");
    }
  }, [clinicalNote]);

  // 5. PUT manual draft updates
  const updateNoteMutation = useMutation({
    mutationFn: async (updatedFields: Partial<ClinicalNote>) => {
      const response = await fetch(`http://localhost:8000/api/v1/appointments/${appointmentId}/clinical-note`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(updatedFields)
      });
      if (!response.ok) {
        throw new Error("Failed to save draft edits.");
      }
      return response.json();
    },
    onSuccess: () => {
      setSaveStatus("SAVED");
      queryClient.invalidateQueries({ queryKey: ["clinical-note", appointmentId] });
    },
    onError: () => {
      setSaveStatus("ERROR");
    }
  });

  // 6. POST approve signature confirmation
  const approveNoteMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`http://localhost:8000/api/v1/appointments/${appointmentId}/clinical-note/approve`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) {
        throw new Error("Failed to sign clinical documentation.");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clinical-note", appointmentId] });
      queryClient.invalidateQueries({ queryKey: ["appointment-scribe", appointmentId] });
      alert("Clinical Note Approved and Electronic Signature Confirmed!");
      router.push("/doctor/dashboard");
    },
    onError: (err: Error) => {
      alert(`Signature failed: ${err.message}`);
    }
  });

  // 7. Auto-save handler triggering on field modifications (debounce 1500ms)
  const triggerAutoSave = (field: string, value: string) => {
    if (clinicalNote?.status === "approved") return; // locked

    setSaveStatus("SAVING");
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      updateNoteMutation.mutate({
        [field]: value
      });
    }, 1500);
  };

  // Clean timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const isApproved = clinicalNote?.status === "approved";

  // Parse raw transcript lines
  const transcriptLines = clinicalNote?.raw_transcript
    ? clinicalNote.raw_transcript.split("\n")
    : [];

  const filteredTranscriptLines = transcriptLines.filter(line => 
    line.toLowerCase().includes(transcriptQuery.toLowerCase())
  );

  // Access validation check
  if (!token || user?.role !== "Doctor") {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-center p-4">
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-3xl p-8 max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-rose-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">Access Denied</h3>
          <p className="text-sm text-slate-400 mb-6">Physician credentials required to access this clinical workspace.</p>
          <Link href="/" className="bg-teal-500 hover:bg-teal-400 text-slate-950 px-6 py-2.5 rounded-xl font-bold text-sm transition-all">
            Return to Homepage
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-slate-950 overflow-hidden font-sans">
      
      {/* Workspace Sub Header */}
      <div className="bg-slate-900/60 border-b border-slate-900 px-6 py-4 flex items-center justify-between z-10 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <Link 
            href="/doctor/dashboard"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-slate-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-teal-400 font-bold uppercase tracking-widest">Scribe Workspace</span>
              {isApproved && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[9px] font-bold border border-emerald-500/20">
                  <Lock className="w-2.5 h-2.5" /> APPROVED
                </span>
              )}
            </div>
            <h2 className="text-sm font-bold text-slate-150">
              Clinical SOAP Documentation: {patientProfile?.name || "Patient Profile"}
            </h2>
            {patientProfile && (
              <div className="text-[11px] text-slate-450 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                <span>Age: <strong className="text-teal-400">{patientProfile.age ?? "--"} yrs</strong></span>
                <span className="w-1 h-1 rounded-full bg-slate-800" />
                <span>Gender: <strong className="text-teal-400">{patientProfile.gender ?? "--"}</strong></span>
                <span className="w-1 h-1 rounded-full bg-slate-800" />
                <span>Weight: <strong className="text-teal-400">{patientProfile.weight ? `${patientProfile.weight} kg` : "--"}</strong></span>
                <span className="w-1 h-1 rounded-full bg-slate-800" />
                <span>Height: <strong className="text-teal-400">{patientProfile.height ? `${patientProfile.height} cm` : "--"}</strong></span>
                {patientProfile.allergies && (
                  <>
                    <span className="w-1 h-1 rounded-full bg-slate-800" />
                    <span className="text-rose-450">Allergies: <strong>{patientProfile.allergies}</strong></span>
                  </>
                )}
                {patientProfile.chronic_illnesses && (
                  <>
                    <span className="w-1 h-1 rounded-full bg-slate-800" />
                    <span className="text-amber-450">Chronic: <strong>{patientProfile.chronic_illnesses}</strong></span>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Status Indicators & Sign Button */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setIsHistoryOpen(!isHistoryOpen)}
            className={`px-3.5 py-1.5 rounded-xl text-[11px] font-bold border transition-all flex items-center gap-1.5 ${
              isHistoryOpen
                ? "bg-teal-500/10 text-teal-450 border-teal-500/25"
                : "bg-slate-800 hover:bg-slate-750 text-slate-400 border-slate-750"
            }`}
          >
            <History className="w-3.5 h-3.5" />
            {isHistoryOpen ? "Hide EHR Drawer" : "View EHR Drawer"}
          </button>

          {/* Save Status Indicators */}
          {!isApproved && (
            <div className="flex items-center gap-2">
              {saveStatus === "SAVING" ? (
                <span className="text-xs text-slate-400 flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-ping"></div>
                  Saving Draft...
                </span>
              ) : saveStatus === "ERROR" ? (
                <span className="text-xs text-rose-400 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> Save Failed
                </span>
              ) : (
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 text-teal-500" /> Draft Saved
                </span>
              )}
            </div>
          )}

          {/* Approve Sign Control */}
          {isApproved ? (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-2 flex items-center gap-2 text-emerald-400">
              <CheckCircle className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wide">Locked & Electronically Signed</span>
            </div>
          ) : (
            <button
              onClick={() => approveNoteMutation.mutate()}
              disabled={isLoadingNote || approveNoteMutation.isPending}
              className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md shadow-teal-500/10 disabled:opacity-50"
            >
              <CheckCircle className="w-4 h-4" />
              Approve & Sign Note
            </button>
          )}
        </div>
      </div>

      {/* Main Splitscreen Body */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Collapsible EHR History Drawer */}
        {isHistoryOpen && patientProfile && (
          <div className="w-[340px] border-r border-slate-900 bg-slate-950 flex flex-col shrink-0 overflow-y-auto p-5 space-y-6 selection:bg-teal-500 selection:text-slate-950">
            {/* Header */}
            <div>
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest flex items-center gap-1.5 pb-2 border-b border-slate-800">
                <User className="w-4 h-4 text-teal-400" />
                Patient EHR Constants
              </h3>
            </div>

            {/* Vital Signs Profile Card */}
            <div className="bg-slate-900/40 border border-slate-850 rounded-2xl p-4 space-y-3.5 shadow-inner">
              <div className="grid grid-cols-2 gap-2 text-center text-xs">
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-850">
                  <span className="block text-[8px] font-bold text-slate-500 uppercase tracking-wider">Age</span>
                  <span className="text-xs font-extrabold text-teal-400 block mt-0.5">{patientProfile.age ?? "--"} yrs</span>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-850">
                  <span className="block text-[8px] font-bold text-slate-500 uppercase tracking-wider">Gender</span>
                  <span className="text-xs font-extrabold text-teal-400 block mt-0.5 truncate">{patientProfile.gender ?? "--"}</span>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-850">
                  <span className="block text-[8px] font-bold text-slate-500 uppercase tracking-wider">Weight</span>
                  <span className="text-xs font-extrabold text-teal-400 block mt-0.5">{patientProfile.weight ?? "--"} kg</span>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-850">
                  <span className="block text-[8px] font-bold text-slate-500 uppercase tracking-wider">Height</span>
                  <span className="text-xs font-extrabold text-teal-400 block mt-0.5">{patientProfile.height ?? "--"} cm</span>
                </div>
              </div>

              {/* BMI indicator */}
              {patientProfile.weight && patientProfile.height && (
                <div className="bg-emerald-500/5 border border-emerald-500/10 p-2.5 rounded-xl flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-slate-400">Calculated BMI:</span>
                  <span className="font-bold text-emerald-400">
                    {(Number(patientProfile.weight) / Math.pow(Number(patientProfile.height) / 100, 2)).toFixed(1)}
                  </span>
                </div>
              )}

              {/* Allergies Alerts */}
              <div className="space-y-1.5 pt-1">
                <span className="block text-[8px] font-bold text-slate-500 uppercase tracking-wider">Allergies Warning</span>
                {patientProfile.allergies ? (
                  <div className="bg-rose-500/10 border border-rose-500/25 p-2.5 rounded-xl text-[11px] text-rose-450 font-semibold flex items-start gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>{patientProfile.allergies}</span>
                  </div>
                ) : (
                  <div className="bg-slate-950 p-2 text-center rounded-xl border border-slate-850 text-[10px] text-slate-500 italic">No allergies reported.</div>
                )}
              </div>

              {/* Chronic profile details */}
              <div className="space-y-1.5">
                <span className="block text-[8px] font-bold text-slate-500 uppercase tracking-wider">Chronic Pre-existing Conditions</span>
                {patientProfile.chronic_illnesses ? (
                  <div className="bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-xl text-[11px] text-amber-450 font-semibold">
                    {patientProfile.chronic_illnesses}
                  </div>
                ) : (
                  <div className="bg-slate-950 p-2 text-center rounded-xl border border-slate-850 text-[10px] text-slate-500 italic">No chronic illnesses reported.</div>
                )}
              </div>
            </div>

            {/* Searchable consultations queue */}
            <div className="space-y-4 pt-4 border-t border-slate-850">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest flex items-center gap-1.5 pb-2 border-b border-slate-800">
                <Calendar className="w-4 h-4 text-teal-400" />
                Previous consultations Timeline
              </h3>
              
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search past consults..."
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 focus:border-teal-500/50 rounded-xl pl-9 pr-3 py-2 text-[11px] text-slate-200 placeholder-slate-650 focus:outline-none transition-all"
                />
              </div>

              <div className="space-y-3.5">
                {patientHistory.filter(appt => appt.id !== appointmentId).length === 0 ? (
                  <div className="text-center py-6 text-[10px] text-slate-500 italic">No historical visits logged.</div>
                ) : (
                  patientHistory
                    .filter(appt => appt.id !== appointmentId)
                    .filter(appt => {
                      if (!historySearch) return true;
                      const term = historySearch.toLowerCase();
                      const reason = appt.reason_for_visit.toLowerCase();
                      const diag = appt.clinical_note?.assessment?.toLowerCase() || "";
                      return reason.includes(term) || diag.includes(term);
                    })
                    .map((appt) => {
                      const isExpanded = expandedHistoryId === appt.id;
                      const dateStr = new Date(appt.appointment_time).toLocaleDateString([], {
                        month: 'short', day: 'numeric', year: 'numeric'
                      });
                      
                      const doc = doctorsCatalog.find(d => d.id === appt.doctor_id);
                      const docName = doc ? doc.user.name : "Consulting Provider";

                      return (
                        <div key={appt.id} className="bg-slate-900/60 border border-slate-850 rounded-xl overflow-hidden shadow">
                          
                          {/* Accordion header button */}
                          <button
                            type="button"
                            onClick={() => setExpandedHistoryId(isExpanded ? null : appt.id)}
                            className="w-full p-3 text-left hover:bg-slate-900 flex justify-between items-center transition-all"
                          >
                            <div>
                              <p className="text-[11px] font-bold text-slate-250">{dateStr}</p>
                              <p className="text-[9px] text-slate-500 font-semibold">{docName} • {appt.consult_type === "telehealth" ? "Virtual" : "In-Person"}</p>
                            </div>
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-slate-500" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-500" />}
                          </button>

                          {/* Accordion Body details */}
                          {isExpanded && (
                            <div className="p-3 bg-slate-950 border-t border-slate-850 space-y-3 text-[11px] leading-relaxed text-slate-450">
                              
                              <div className="space-y-0.5">
                                <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider block">Reason for visit</span>
                                <p className="text-slate-350">{appt.reason_for_visit}</p>
                              </div>

                              {appt.clinical_note ? (
                                <div className="space-y-2 border-t border-slate-850/80 pt-2">
                                  {appt.clinical_note.patient_summary && (
                                    <div className="space-y-0.5">
                                      <span className="text-[8px] font-bold text-teal-400 uppercase tracking-wider block">Diagnosis Summary</span>
                                      <p className="text-slate-300 italic">"{appt.clinical_note.patient_summary}"</p>
                                    </div>
                                  )}
                                  <div className="grid grid-cols-1 gap-2 text-[10px]">
                                    {appt.clinical_note.subjective && (
                                      <div>
                                        <span className="font-bold text-slate-500 uppercase tracking-wider block">Subjective Notes</span>
                                        <p className="text-slate-400 line-clamp-2">{appt.clinical_note.subjective}</p>
                                      </div>
                                    )}
                                    {appt.clinical_note.plan && (
                                      <div>
                                        <span className="font-bold text-slate-500 uppercase tracking-wider block">Plan & Medicines</span>
                                        <p className="text-slate-400 line-clamp-2">{appt.clinical_note.plan}</p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <div className="text-[10px] text-slate-500 italic pt-1 border-t border-slate-850/50">No SOAP documentation notes linked.</div>
                              )}

                            </div>
                          )}

                        </div>
                      );
                    })
                )}
              </div>

            </div>

          </div>
        )}

        {/* LEFT COLUMN: Transcript Dialogues */}
        <div className="w-1/2 flex flex-col border-r border-slate-900 bg-slate-900/20">
          
          {/* Transcript Search Toolbar */}
          <div className="p-4 border-b border-slate-900 bg-slate-900/40">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-teal-400" />
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-350">Conversational AI Transcript</h3>
              </div>
              <span className="text-[10px] text-slate-500 font-bold">{filteredTranscriptLines.length} lines</span>
            </div>
            
            <div className="relative">
              <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search transcript dialog..."
                value={transcriptQuery}
                onChange={(e) => setTranscriptQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-850 focus:border-teal-500/50 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 placeholder-slate-650 focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Transcript Dialogue List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {isLoadingNote ? (
              <div className="py-20 text-center">
                <div className="w-8 h-8 border-3 border-teal-500/20 border-t-teal-500 rounded-full animate-spin mx-auto mb-3"></div>
                <p className="text-xs text-slate-500">Transcribing consultation...</p>
              </div>
            ) : filteredTranscriptLines.length === 0 ? (
              <div className="py-20 text-center text-slate-600">
                <FileText className="w-10 h-10 text-slate-800 mx-auto mb-2" />
                <p className="text-xs">No matching dialogue segments found.</p>
              </div>
            ) : (
              filteredTranscriptLines.map((line, i) => {
                const isDoc = line.toLowerCase().startsWith("doctor:");
                const cleanLine = line.replace(/^(doctor:|patient:)/i, "").trim();

                return (
                  <div 
                    key={i} 
                    className={`flex flex-col max-w-[85%] ${isDoc ? "ml-auto items-end" : "items-start"}`}
                  >
                    <span className="text-[9px] text-slate-500 font-bold mb-1 uppercase tracking-wide">
                      {isDoc ? "Doctor" : "Patient"}
                    </span>
                    <div 
                      className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                        isDoc 
                          ? "bg-teal-500/10 text-teal-300 border border-teal-500/20 rounded-tr-none"
                          : "bg-slate-900 text-slate-300 border border-slate-800/80 rounded-tl-none"
                      }`}
                    >
                      {cleanLine}
                    </div>
                  </div>
                );
              })
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: Interactive SOAP Editor */}
        <div className="w-1/2 flex flex-col bg-slate-950 overflow-y-auto p-6 space-y-6">
          
          {/* Header instructions warning */}
          {isApproved && (
            <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-2xl p-4 flex gap-3 text-emerald-400">
              <Lock className="w-5 h-5 shrink-0" />
              <div>
                <h4 className="text-xs font-bold">Approved Clinical Document</h4>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                  This note is electronically locked and saved to the patient health record. Fields are read-only.
                </p>
              </div>
            </div>
          )}

          {/* Section: Subjective (S) */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-450 uppercase tracking-widest">Subjective (S)</label>
            <textarea
              value={subjective}
              disabled={isApproved}
              onChange={(e) => {
                setSubjective(e.target.value);
                triggerAutoSave("subjective", e.target.value);
              }}
              rows={4}
              placeholder="Patient reports, symptoms, history of present illness..."
              className="w-full bg-slate-900 border border-slate-800/80 rounded-2xl p-4 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-teal-500/30 transition-all disabled:opacity-70 resize-none leading-relaxed"
            />
          </div>

          {/* Section: Objective (O) */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-450 uppercase tracking-widest">Objective (O)</label>
            <textarea
              value={objective}
              disabled={isApproved}
              onChange={(e) => {
                setObjective(e.target.value);
                triggerAutoSave("objective", e.target.value);
              }}
              rows={4}
              placeholder="Vitals, physical exam details, lab reports..."
              className="w-full bg-slate-900 border border-slate-800/80 rounded-2xl p-4 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-teal-500/30 transition-all disabled:opacity-70 resize-none leading-relaxed"
            />
          </div>

          {/* Section: Assessment (A) */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-450 uppercase tracking-widest">Assessment (A)</label>
            <textarea
              value={assessment}
              disabled={isApproved}
              onChange={(e) => {
                setAssessment(e.target.value);
                triggerAutoSave("assessment", e.target.value);
              }}
              rows={4}
              placeholder="Clinical impressions, diagnoses, differentials..."
              className="w-full bg-slate-900 border border-slate-800/80 rounded-2xl p-4 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-teal-500/30 transition-all disabled:opacity-70 resize-none leading-relaxed"
            />
          </div>

          {/* Section: Plan (P) */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-450 uppercase tracking-widest">Plan (P)</label>
            <textarea
              value={plan}
              disabled={isApproved}
              onChange={(e) => {
                setPlan(e.target.value);
                triggerAutoSave("plan", e.target.value);
              }}
              rows={4}
              placeholder="Treatment details, prescription details, follow-up times..."
              className="w-full bg-slate-900 border border-slate-800/80 rounded-2xl p-4 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-teal-500/30 transition-all disabled:opacity-70 resize-none leading-relaxed"
            />
          </div>

          {/* Section: Patient Summary (Layman summary) */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-450 uppercase tracking-widest">Patient Lay Translation Summary</label>
            <textarea
              value={patientSummary}
              disabled={isApproved}
              onChange={(e) => {
                setPatientSummary(e.target.value);
                triggerAutoSave("patient_summary", e.target.value);
              }}
              rows={4}
              placeholder="Lay translation explaining findings and directions in clear, simple terms..."
              className="w-full bg-slate-900 border border-slate-800/80 rounded-2xl p-4 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-teal-500/30 transition-all disabled:opacity-70 resize-none leading-relaxed"
            />
          </div>

        </div>

      </div>

    </div>
  );
}
