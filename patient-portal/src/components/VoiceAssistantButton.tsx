"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { AlertTriangle, Bot, Loader2, Mic, MicOff, Send, Volume2, X } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";

type Status = "idle" | "listening" | "thinking" | "speaking" | "error";
type AgentAction = { id: string; label: string; kind: "message" | "select_slot" | "confirm_booking"; doctor_id?: string; appointment_time?: string; consult_type?: string };
type Reply = { conversation_id: string; response: string; transcript?: string; is_emergency: boolean; requires_confirmation: boolean; state: string; actions: AgentAction[] };
type Message = { sender: "user" | "agent"; text: string };

declare global { interface Window { SpeechRecognition?: new () => any; webkitSpeechRecognition?: new () => any; } }

export default function VoiceAssistantButton() {
  const { isAuthenticated, user, token } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [heard, setHeard] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [actions, setActions] = useState<AgentAction[]>([]);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => () => recognitionRef.current?.stop(), []);
  if (!isAuthenticated || !user || user.role !== "Patient") return null;
  const addMessage = (message: Message) => setMessages((current) => [...current, message]);

  const speak = (text: string) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = /[\u0900-\u097F]/.test(text) ? "hi-IN" : "en-IN";
    utterance.onstart = () => setStatus("speaking");
    utterance.onend = () => setStatus("idle");
    window.speechSynthesis.speak(utterance);
  };

  const send = async (payload: Record<string, string | undefined>) => {
    if (!token) return;
    setStatus("thinking"); setError(null);
    try {
      const response = await fetch("http://localhost:8100/api/v1/agent/chat", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ ...payload, conversation_id: conversationId }) });
      const data: Reply | { detail?: string } = await response.json();
      if (!response.ok) throw new Error("detail" in data ? data.detail || "Voice service is unavailable." : "Voice service is unavailable.");
      const reply = data as Reply;
      setConversationId(reply.conversation_id); setActions(reply.actions || []); addMessage({ sender: "agent", text: reply.response });
      if (reply.is_emergency) setStatus("error"); else { speak(reply.response); if (!("speechSynthesis" in window)) setStatus("idle"); }
    } catch (caught) {
      setStatus("error"); setActions([]); setError(caught instanceof Error ? caught.message : "Voice service is unavailable. Please use Find a Doctor instead.");
    }
  };

  const submitText = async (event?: FormEvent) => {
    event?.preventDefault(); const text = draft.trim(); if (!text || status === "thinking") return;
    addMessage({ sender: "user", text }); setHeard(text); setDraft(""); await send({ message: text });
  };

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) { setError("Voice typing is not supported in this browser. You can type your request below."); setStatus("error"); return; }
    setError(null); const recognition = new SpeechRecognition(); recognitionRef.current = recognition;
    recognition.lang = "en-IN"; recognition.continuous = false; recognition.interimResults = true;
    recognition.onstart = () => setStatus("listening");
    recognition.onresult = (event: any) => { const text = Array.from(event.results as any).map((result: any) => result[0].transcript).join("").trim(); setHeard(text); setDraft(text); };
    recognition.onerror = () => { setStatus("error"); setError("We could not hear you clearly. Please try again or type your request."); };
    recognition.onend = () => setStatus((current) => current === "listening" ? "idle" : current);
    recognition.start();
  };

  const close = () => { recognitionRef.current?.stop(); window.speechSynthesis?.cancel(); setOpen(false); setStatus("idle"); };
  const handleAction = async (action: AgentAction) => {
    if (action.kind === "confirm_booking") { addMessage({ sender: "user", text: "Confirm booking" }); await send({ message: "confirm", action: "confirm_booking" }); return; }
    if (action.kind === "select_slot") { addMessage({ sender: "user", text: `Select ${action.label}` }); await send({ message: action.label, action: "select_slot", doctor_id: action.doctor_id, appointment_time: action.appointment_time, consult_type: action.consult_type }); }
  };

  return (
    <div className="fixed bottom-5 right-4 z-50 sm:bottom-6 sm:right-6">
      {open && <section aria-label="Health Help voice assistant" className="mb-3 flex w-[calc(100vw-2rem)] max-w-sm flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/20">
        <header className="flex items-center justify-between border-b border-slate-100 bg-teal-50 px-4 py-3"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-600 text-white"><Bot className="h-5 w-5" /></span><div><h2 className="text-sm font-bold text-slate-900">Health Help</h2><p className="text-xs text-slate-600">Find a doctor or book a visit</p></div></div><button onClick={close} aria-label="Close Health Help" className="rounded-xl p-2 text-slate-600 hover:bg-white"><X className="h-5 w-5" /></button></header>
        <div className="max-h-72 min-h-44 space-y-3 overflow-y-auto bg-slate-50 p-4">{messages.length === 0 && <p className="rounded-2xl bg-white p-3 text-sm text-slate-700 shadow-sm">Tell me the kind of doctor you need. You can speak or type in English, Hindi, or Hinglish.</p>}{messages.map((item, index) => <p key={index} className={`max-w-[90%] rounded-2xl px-3 py-2 text-sm leading-5 ${item.sender === "user" ? "ml-auto bg-teal-600 text-white" : "bg-white text-slate-700 shadow-sm"}`}>{item.text}</p>)}{status === "thinking" && <p className="flex items-center gap-2 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Checking live availability…</p>}</div>
        {heard && <div className="border-t border-slate-100 px-4 py-2 text-xs text-slate-500">You said: <span className="font-medium text-slate-700">{heard}</span></div>}
        {error && <div className="m-3 flex gap-2 rounded-xl bg-amber-50 p-3 text-xs text-amber-900"><AlertTriangle className="h-4 w-4 shrink-0" />{error}</div>}
        {actions.length > 0 && <div className="flex flex-wrap gap-2 border-t border-slate-100 p-3">{actions.map((action) => <button key={action.id} disabled={status === "thinking"} onClick={() => handleAction(action)} className="rounded-xl border border-teal-200 bg-teal-50 px-3 py-2 text-xs font-semibold text-teal-800 hover:bg-teal-100 disabled:opacity-50">{action.label}</button>)}</div>}
        <form onSubmit={submitText} className="flex gap-2 border-t border-slate-100 p-3"><button type="button" onClick={startListening} disabled={status === "thinking" || status === "speaking"} aria-label="Start voice typing" className={`rounded-xl p-3 ${status === "listening" ? "bg-red-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}>{status === "listening" ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}</button><input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Type your request" className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-teal-600" /><button type="submit" disabled={!draft.trim() || status === "thinking"} aria-label="Send message" className="rounded-xl bg-teal-600 p-3 text-white hover:bg-teal-700 disabled:opacity-40"><Send className="h-5 w-5" /></button></form>
        <p className="px-4 pb-3 text-[11px] text-slate-500"><Volume2 className="mr-1 inline h-3 w-3" />Voice typing is a browser fallback. Do not use this for emergency care.</p>
      </section>}
      <button id="voiceTrigger" onClick={() => setOpen(true)} aria-label="Open Health Help" className="flex h-14 w-14 items-center justify-center rounded-full bg-teal-600 text-white shadow-lg shadow-teal-700/30 transition hover:scale-105 hover:bg-teal-700"><Mic className="h-6 w-6" /></button>
    </div>
  );
}
