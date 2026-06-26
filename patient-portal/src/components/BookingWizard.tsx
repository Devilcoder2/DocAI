"use client";

import React, { useState } from "react";
import { X, ArrowRight, ArrowLeft, CheckCircle, ShieldAlert, Sparkles, Bell, Calendar, MapPin } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";

interface BookingWizardProps {
  doctorId: string;
  doctorName: string;
  specialty: string;
  selectedSlotTime?: string; // Optional: ISO string of the slot
  onClose: () => void;
  onSuccess: () => void;
}

/**
 * BookingWizard Component - Multi-step appointment checkout container.
 * Steps:
 *   1. Visit Reason & Description
 *   2. Insurance Details
 *   3. Guest Account Setup (Login/Register)
 *   4. Notification Reminders
 *   5. AI Clinical Scribe Consent
 *   6. Reservation Confirmation
 */
export default function BookingWizard({
  doctorId,
  doctorName,
  specialty,
  selectedSlotTime,
  onClose,
  onSuccess
}: BookingWizardProps) {
  const { isAuthenticated, token, user, setAuth } = useAuthStore();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form Fields
  const [patientType, setPatientType] = useState<"new" | "returning">("new");
  const [visitReason, setVisitReason] = useState("Annual Physical");
  const [symptoms, setSymptoms] = useState("");
  const [consultType, setConsultType] = useState<"in_person" | "telehealth">("in_person");
  
  const [carrier, setCarrier] = useState("");
  const [planName, setPlanName] = useState("");
  const [policyNumber, setPolicyNumber] = useState("");

  const [authMode, setAuthMode] = useState<"register" | "login">("register");
  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");

  const [reminderPref, setReminderPref] = useState<"email" | "sms" | "both">("both");
  const [aiConsent, setAiConsent] = useState(false);
  const [tosConsent, setTosConsent] = useState(false);

  // Confirmed Appointment Payload
  const [confirmedAppt, setConfirmedAppt] = useState<any>(null);

  // Helper: Format readable slot date
  const formatSlotTime = (isoString?: string) => {
    if (!isoString) return "Custom Time Requested (Pending)";
    const dateObj = new Date(isoString);
    return dateObj.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) + 
      " at " + dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleNextStep = async () => {
    setErrorMsg(null);
    
    // Step 1 Validation
    if (step === 1 && !symptoms.trim()) {
      setErrorMsg("Please describe your symptoms or reason for visit.");
      return;
    }

    // Step 3 Validation & Authentication Submission
    if (step === 3 && !isAuthenticated) {
      if (!authEmail.trim()) {
        setErrorMsg("Email address is required.");
        return;
      }
      if (authMode === "register" && !authName.trim()) {
        setErrorMsg("Full name is required.");
        return;
      }

      setLoading(true);
      try {
        const url = authMode === "register" 
          ? "http://localhost:8000/api/v1/public/auth/register"
          : "http://localhost:8000/api/v1/public/auth/login";
        
        const payload = authMode === "register"
          ? { name: authName, email: authEmail, role: "Patient" }
          : { email: authEmail };

        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        const resData = await response.json();
        setLoading(false);

        if (!response.ok) {
          setErrorMsg(resData.detail || "Authentication check failed.");
          return;
        }

        // Write credentials to Zustand
        setAuth(resData.token, resData.user);
      } catch (err: any) {
        setLoading(false);
        setErrorMsg("Failed to connect to gateway services.");
        return;
      }
    }

    // Step 5 Validation & Booking Reservation Submission
    if (step === 5) {
      if (!aiConsent || !tosConsent) {
        setErrorMsg("You must accept the terms of service and AI scribe note-taking consent form.");
        return;
      }

      setLoading(true);
      try {
        // Construct target booking datetime: use selected ISO string, or fall back to a dynamic tomorrow date if custom
        const appointmentTime = selectedSlotTime || new Date(Date.now() + 86400000).toISOString(); // 24 hours from now
        
        const bookingPayload = {
          doctor_id: doctorId,
          appointment_time: appointmentTime,
          consult_type: consultType,
          reason_for_visit: `${visitReason}: ${symptoms}`,
          insurance_carrier: carrier || null,
          insurance_plan: planName || null,
          insurance_policy_number: policyNumber || null
        };

        const response = await fetch("http://localhost:8000/api/v1/appointments", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify(bookingPayload)
        });

        const resData = await response.json();
        setLoading(false);

        if (!response.ok) {
          setErrorMsg(resData.detail || "Slot booking failed. The slot may have been taken.");
          return;
        }

        setConfirmedAppt(resData);
        setStep(6); // Go to final confirmation screen
        return;
      } catch (err) {
        setLoading(false);
        setErrorMsg("Failed to book appointment. Check connection.");
        return;
      }
    }

    setStep(prev => prev + 1);
  };

  const handlePrevStep = () => {
    setErrorMsg(null);
    setStep(prev => prev - 1);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Wizard Header */}
        <header className="flex justify-between items-center px-6 py-4 border-b border-slate-800 bg-slate-900/55">
          <div>
            <span className="text-[10px] text-teal-400 font-extrabold uppercase tracking-widest">
              Booking Wizard (Step {step} of 6)
            </span>
            <h3 className="text-lg font-bold text-slate-100 mt-0.5">
              {step === 6 ? "Booking Confirmed" : `Reserve with ${doctorName}`}
            </h3>
          </div>
          {step < 6 && (
            <button 
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </header>

        {/* Wizard Content Body */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
          
          {errorMsg && (
            <div className="bg-rose-500/10 border border-rose-500/25 text-rose-400 text-xs px-4 py-3 rounded-2xl flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* STEP 1: Classification & Reason */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Patient Classification</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPatientType("new")}
                    className={`py-3.5 rounded-2xl font-bold text-sm border transition-all ${
                      patientType === "new" 
                        ? "bg-teal-500/10 border-teal-500 text-teal-400" 
                        : "bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    New Patient
                  </button>
                  <button
                    type="button"
                    onClick={() => setPatientType("returning")}
                    className={`py-3.5 rounded-2xl font-bold text-sm border transition-all ${
                      patientType === "returning" 
                        ? "bg-teal-500/10 border-teal-500 text-teal-400" 
                        : "bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    Returning Patient
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Consultation Format</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setConsultType("in_person")}
                    className={`py-3.5 rounded-2xl font-bold text-sm border transition-all ${
                      consultType === "in_person" 
                        ? "bg-teal-500/10 border-teal-500 text-teal-400" 
                        : "bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    In-Person Visit
                  </button>
                  <button
                    type="button"
                    onClick={() => setConsultType("telehealth")}
                    className={`py-3.5 rounded-2xl font-bold text-sm border transition-all ${
                      consultType === "telehealth" 
                        ? "bg-teal-500/10 border-teal-500 text-teal-400" 
                        : "bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    Virtual Video (Telehealth)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Visit Reason</label>
                <select
                  value={visitReason}
                  onChange={(e) => setVisitReason(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-slate-200 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-sm transition-all"
                >
                  <option value="Annual Physical">Annual Physical / Check-up</option>
                  <option value="Follow-Up">Follow-Up Consultation</option>
                  <option value="Illness">Acute Illness / Sick Visit</option>
                  <option value="Specialist Consult">Specialist Consult</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Describe Your Symptoms</label>
                <textarea
                  rows={4}
                  placeholder="Please describe what symptoms you are experiencing, how long they have lasted, or any details to help the doctor prepare..."
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-slate-200 placeholder-slate-650 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-sm transition-all"
                />
              </div>
            </div>
          )}

          {/* STEP 2: Insurance Validation */}
          {step === 2 && (
            <div className="space-y-5">
              <p className="text-xs text-slate-400 leading-relaxed">
                Provide your insurance credentials to pre-verify network rates. Leaving this empty denotes guest check-out as self-pay.
              </p>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Insurance Carrier</label>
                <input
                  type="text"
                  placeholder="e.g. Aetna, Blue Cross, UnitedHealth..."
                  value={carrier}
                  onChange={(e) => setCarrier(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-teal-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Plan Name</label>
                <input
                  type="text"
                  placeholder="e.g. PPO Choice, Bronze Select..."
                  value={planName}
                  onChange={(e) => setPlanName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-teal-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Policy ID Number / Member Number</label>
                <input
                  type="text"
                  placeholder="e.g. POL-99887711"
                  value={policyNumber}
                  onChange={(e) => setPolicyNumber(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-teal-500 text-sm"
                />
              </div>
            </div>
          )}

          {/* STEP 3: Sign-Up/Sign-In Checkout Bridge */}
          {step === 3 && (
            <div className="space-y-5">
              {isAuthenticated && user ? (
                <div className="bg-teal-500/5 border border-teal-500/25 rounded-2xl p-6 text-center space-y-3">
                  <CheckCircle className="w-10 h-10 text-teal-400 mx-auto" />
                  <h4 className="font-bold text-slate-100">Authenticated Checkout Profile</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    You are verified as patient <span className="text-teal-300 font-semibold">{user.name}</span> ({user.email}). Click next to proceed.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex border-b border-slate-800">
                    <button
                      type="button"
                      onClick={() => { setAuthMode("register"); setErrorMsg(null); }}
                      className={`flex-1 pb-3 text-sm font-bold border-b-2 transition-all ${
                        authMode === "register" ? "border-teal-500 text-teal-400" : "border-transparent text-slate-500"
                      }`}
                    >
                      New Patient Account
                    </button>
                    <button
                      type="button"
                      onClick={() => { setAuthMode("login"); setErrorMsg(null); }}
                      className={`flex-1 pb-3 text-sm font-bold border-b-2 transition-all ${
                        authMode === "login" ? "border-teal-500 text-teal-400" : "border-transparent text-slate-500"
                      }`}
                    >
                      Returning Patient Sign-In
                    </button>
                  </div>

                  {authMode === "register" ? (
                    <div className="space-y-4 pt-2">
                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Full Name</label>
                        <input
                          type="text"
                          placeholder="John Doe"
                          value={authName}
                          onChange={(e) => setAuthName(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-teal-500 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Email Address</label>
                        <input
                          type="email"
                          placeholder="john@example.com"
                          value={authEmail}
                          onChange={(e) => setAuthEmail(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-teal-500 text-sm"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4 pt-2">
                      <p className="text-xs text-slate-500 leading-normal">
                        Type in your email to fetch your clinical files (e.g. `john@example.com` or `jane@example.com` to test seeded patients).
                      </p>
                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Registered Email</label>
                        <input
                          type="email"
                          placeholder="john@example.com"
                          value={authEmail}
                          onChange={(e) => setAuthEmail(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-teal-500 text-sm"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* STEP 4: Reminders Preferences */}
          {step === 4 && (
            <div className="space-y-5">
              <div className="bg-slate-950/40 border border-slate-850 rounded-2xl p-5 flex gap-4">
                <Bell className="w-8 h-8 text-teal-400 shrink-0" />
                <div>
                  <h4 className="font-bold text-slate-200 text-sm">Appointment Alerts & Reminders</h4>
                  <p className="text-xs text-slate-400 mt-1 leading-normal">
                    Receive confirmation alerts, reminders, and directions prior to your check-up.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Alert Format Preference</label>
                <div className="flex flex-col gap-3">
                  <label className="flex items-center gap-3 bg-slate-950/40 hover:bg-slate-950/70 p-4 border border-slate-850 rounded-2xl cursor-pointer transition-all">
                    <input
                      type="radio"
                      name="reminder"
                      checked={reminderPref === "email"}
                      onChange={() => setReminderPref("email")}
                      className="accent-teal-500 w-4 h-4"
                    />
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-slate-200">Email Notifications</span>
                      <span className="text-xs text-slate-500 mt-0.5">Send maps and details directly to your inbox.</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 bg-slate-950/40 hover:bg-slate-950/70 p-4 border border-slate-850 rounded-2xl cursor-pointer transition-all">
                    <input
                      type="radio"
                      name="reminder"
                      checked={reminderPref === "sms"}
                      onChange={() => setReminderPref("sms")}
                      className="accent-teal-500 w-4 h-4"
                    />
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-slate-200">SMS Mobile Alerts</span>
                      <span className="text-xs text-slate-500 mt-0.5">Send text message reminders 24 hours prior.</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 bg-slate-950/40 hover:bg-slate-950/70 p-4 border border-slate-850 rounded-2xl cursor-pointer transition-all">
                    <input
                      type="radio"
                      name="reminder"
                      checked={reminderPref === "both"}
                      onChange={() => setReminderPref("both")}
                      className="accent-teal-500 w-4 h-4"
                    />
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-slate-200">Email and SMS Alert Reminders</span>
                      <span className="text-xs text-slate-500 mt-0.5">Subscribe to both channels for maximum coverage.</span>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: AI Scribe Consent Checkboxes */}
          {step === 5 && (
            <div className="space-y-5">
              <div className="bg-teal-500/10 border border-teal-500/25 rounded-2xl p-5 flex gap-4 shadow-sm">
                <Sparkles className="w-8 h-8 text-teal-400 shrink-0 animate-pulse" />
                <div>
                  <h4 className="font-bold text-slate-100 text-sm">AI Scribe Consultation Feature</h4>
                  <p className="text-xs text-slate-400 mt-1 leading-normal">
                    This consultation integrates our virtual clinical scribe companion. The bot transcribes conversations into SOAP structured clinical files for doctor signing.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <label className="flex items-start gap-3 bg-slate-950/40 p-4 border border-slate-850 rounded-2xl cursor-pointer hover:border-slate-800 transition-all">
                  <input
                    type="checkbox"
                    checked={aiConsent}
                    onChange={(e) => setAiConsent(e.target.checked)}
                    className="accent-teal-500 w-4 h-4 shrink-0 mt-0.5"
                  />
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-slate-200">Consent to AI Note-Taking</span>
                    <span className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                      I authorize the AI Scribe to listen, record, transcribe, and structure clinical notes during my telehealth or in-office visit. I understand notes are reviewed and edited by my provider.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-3 bg-slate-950/40 p-4 border border-slate-850 rounded-2xl cursor-pointer hover:border-slate-800 transition-all">
                  <input
                    type="checkbox"
                    checked={tosConsent}
                    onChange={(e) => setTosConsent(e.target.checked)}
                    className="accent-teal-500 w-4 h-4 shrink-0 mt-0.5"
                  />
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-slate-200">Accept Terms & Privacy Policy</span>
                    <span className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                      I agree to the HealthCenter Terms of Service, HIPAA data security disclosures, and privacy policies.
                    </span>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* STEP 6: Confirmation Screen */}
          {step === 6 && confirmedAppt && (
            <div className="space-y-6 text-center py-6">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/35 flex items-center justify-center mx-auto text-emerald-400 shadow-lg">
                <CheckCircle className="w-8 h-8" />
              </div>
              
              <div>
                <h4 className="text-xl font-bold text-slate-100">Appointment Confirmed!</h4>
                <p className="text-xs text-slate-400 mt-1">Your reservation was logged successfully in the database.</p>
              </div>

              <div className="max-w-md mx-auto bg-slate-950/50 border border-slate-850 rounded-2xl p-5 text-left space-y-4">
                <div className="flex items-start gap-3">
                  <Calendar className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-bold text-xs text-slate-300">Appointment Time</h5>
                    <p className="text-xs text-slate-400 mt-0.5">{formatSlotTime(confirmedAppt.appointment_time)}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 border-t border-slate-800 pt-3">
                  <CheckCircle className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-bold text-xs text-slate-300">Provider & Format</h5>
                    <p className="text-xs text-slate-400 mt-0.5">{doctorName} ({specialty})</p>
                    <p className="text-[10px] font-bold text-teal-400 uppercase tracking-widest mt-1">
                      {confirmedAppt.consult_type === "telehealth" ? "Virtual Telehealth Link Generated" : "In-Person Clinic Visit"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 border-t border-slate-800 pt-3 text-slate-400 text-xs">
                  <MapPin className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-bold text-xs text-slate-300">Location Directions</h5>
                    <p className="text-[11px] leading-relaxed mt-0.5">
                      Clinic Address: 100 Main St, Suite 400. Free patient parking is validated at checkout in the parking deck.
                    </p>
                  </div>
                </div>
              </div>

              {confirmedAppt.consult_type === "telehealth" && (
                <div className="bg-teal-500/5 border border-teal-500/20 max-w-md mx-auto p-4 rounded-xl text-xs text-left leading-normal text-teal-400">
                  <strong>Telehealth Instructions:</strong> A secure video session console link will appear on your Patient Dashboard. An SMS link was dispatched to your alert preferences.
                </div>
              )}
            </div>
          )}

        </div>

        {/* Wizard Action Footer */}
        <footer className="px-6 py-4 border-t border-slate-800 bg-slate-900/55 flex justify-between items-center gap-3">
          {step > 1 && step < 6 ? (
            <button
              onClick={handlePrevStep}
              className="px-5 py-2.5 rounded-2xl hover:bg-slate-850 text-slate-400 hover:text-slate-200 border border-slate-800 hover:border-slate-700 font-bold text-xs transition-all flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back
            </button>
          ) : (
            <div />
          )}

          {step < 6 ? (
            <button
              disabled={loading}
              onClick={handleNextStep}
              className="px-6 py-2.5 rounded-2xl bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-slate-950 font-bold text-xs shadow-lg shadow-teal-500/25 flex items-center gap-1.5 transition-all"
            >
              {loading ? (
                <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
              ) : step === 5 ? (
                "Confirm & Reserve Slot"
              ) : (
                "Continue"
              )}
              {step < 5 && !loading && <ArrowRight className="w-3.5 h-3.5" />}
            </button>
          ) : (
            <button
              onClick={onSuccess}
              className="w-full py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 transition-all text-center"
            >
              Close & Dismiss Wizard
            </button>
          )}
        </footer>

      </div>
    </div>
  );
}
