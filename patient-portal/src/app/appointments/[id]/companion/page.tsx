"use client";

import React, { useState, useEffect, useRef, use } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { 
  MessageSquare, Send, ShieldAlert, ArrowLeft, Bot, User, CheckCircle2, 
  HelpCircle, RefreshCw, AlertTriangle
} from "lucide-react";
import Link from "next/link";
import { useAuthStore } from "@/store/useAuthStore";

interface ChatMessage {
  sender: "Companion" | "Patient";
  text: string;
  timestamp: string;
}

export default function CareCompanionPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id: appointmentId } = use(params);
  const { token, user } = useAuthStore();
  
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      sender: "Companion",
      text: "Hello! I am your post-visit Care Companion. I have processed your doctor-approved clinical care plan and am ready to answer any questions you have regarding your recovery, medications, and schedules.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputText, setInputText] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [escalated, setEscalated] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  
  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch appointment details
  const { data: appointment, isLoading: isLoadingApp } = useQuery({
    queryKey: ["appointment", appointmentId],
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

  // Fetch doctor details
  const doctorId = appointment?.doctor_id;
  const { data: doctor } = useQuery({
    queryKey: ["doctor", doctorId],
    queryFn: async () => {
      const response = await fetch(`http://localhost:8000/api/v1/public/doctors/${doctorId}`);
      if (!response.ok) {
        throw new Error("Failed to load doctor details.");
      }
      return response.json();
    },
    enabled: !!doctorId
  });

  // Connect to Gateway WebSocket
  useEffect(() => {
    if (!token || !appointmentId) return;

    const gatewayWsUrl = `ws://localhost:8000/api/v1/appointments/${appointmentId}/companion/chat`;
    console.log(`Connecting to Care Companion WebSocket: ${gatewayWsUrl}`);
    
    const ws = new WebSocket(gatewayWsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("WebSocket connected to Gateway.");
      setIsConnected(true);
      setErrorMsg("");
      // Send auth token is not required for gateway handshake but we send initialization block
      ws.send(JSON.stringify({ appointment_id: appointmentId, token }));
    };

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        console.log("Received WebSocket payload:", payload);
        
        if (payload.status === "connected") {
          return;
        }

        if (payload.error) {
          setErrorMsg(payload.error);
          return;
        }

        if (payload.response) {
          setMessages((prev) => [
            ...prev,
            {
              sender: "Companion",
              text: payload.response,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
          ]);
          if (payload.escalation_triggered) {
            setEscalated(true);
          }
        }
      } catch (err) {
        console.error("Failed to parse WebSocket frame:", err);
      }
    };

    ws.onerror = (err) => {
      console.error("WebSocket connection error:", err);
      setErrorMsg("Failed to establish secure connection to Care Companion.");
    };

    ws.onclose = () => {
      console.log("WebSocket disconnected.");
      setIsConnected(false);
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [token, appointmentId]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return;
    }

    const textToSend = inputText;
    setInputText("");

    // Add user message
    setMessages((prev) => [
      ...prev,
      {
        sender: "Patient",
        text: textToSend,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);

    // Send payload
    wsRef.current.send(JSON.stringify({ message: textToSend }));
  };

  // Redirect if not logged in
  if (!token) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-slate-100 p-4">
        <ShieldAlert className="w-16 h-16 text-rose-500 animate-pulse mb-4" />
        <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
        <p className="text-slate-400 mb-6 text-center max-w-md">Please sign in to your patient account to converse with your Care Companion.</p>
        <button onClick={() => router.push("/")} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-semibold transition">
          Return to Login
        </button>
      </div>
    );
  }

  return (
    <main className="flex-1 min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between">
      {/* Top Banner Navigation */}
      <header className="w-full bg-slate-900/80 border-b border-slate-800 backdrop-blur px-4 py-4 md:px-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="p-2 hover:bg-slate-800 rounded-lg transition text-slate-400 hover:text-slate-200">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <h1 className="text-lg font-bold">Care Companion Chat</h1>
              </div>
              <p className="text-xs text-slate-400">
                {doctor ? `Follow-up for consultation with Dr. ${doctor.user?.name} (${doctor.specialty})` : "Loading consultation context..."}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${isConnected ? "bg-emerald-950 text-emerald-400 border border-emerald-800" : "bg-amber-950 text-amber-400 border border-amber-800"}`}>
              {isConnected ? "Connected" : "Offline"}
            </span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <section className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-6 flex flex-col gap-4 overflow-hidden h-[calc(100vh-140px)]">
        {/* Safety Warning Banner */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex gap-3 shadow-lg">
          <HelpCircle className="w-6 h-6 text-indigo-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-slate-200">Medical Consultation Assistant</h4>
            <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
              This companion answers questions anchored strictly to your doctor-approved care plan. It is not licensed to diagnose new symptoms, recommend alternative drugs, or suggest lifestyle changes not outlined in your record.
            </p>
          </div>
        </div>

        {/* Escalation Alert Flag */}
        {escalated && (
          <div className="bg-rose-950/80 border border-rose-800/80 rounded-xl p-4 flex gap-3 shadow-md animate-bounce">
            <AlertTriangle className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-rose-300">Physician Escalation Triggered</h4>
              <p className="text-xs text-rose-400 mt-0.5 leading-relaxed font-medium">
                The safety protocol has flagged this session. Worsening symptoms or off-plan queries require clinician evaluation. A representative from Dr. {doctor?.user?.name || "the clinic"}'s office has been alerted and will reach out to you directly.
              </p>
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="bg-amber-950/80 border border-amber-800/80 text-amber-400 text-xs rounded-xl p-3 text-center">
            {errorMsg}
          </div>
        )}

        {/* Chat Body */}
        <div className="flex-1 bg-slate-900/60 border border-slate-900 rounded-xl p-4 overflow-y-auto flex flex-col gap-4 max-h-[550px] shadow-inner">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 max-w-[85%] ${msg.sender === "Patient" ? "self-end flex-row-reverse" : "self-start"}`}>
              <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center ${msg.sender === "Patient" ? "bg-indigo-600 text-indigo-100" : "bg-slate-800 text-slate-300 border border-slate-700"}`}>
                {msg.sender === "Patient" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              <div className={`p-3.5 rounded-2xl shadow-sm ${msg.sender === "Patient" ? "bg-indigo-600 text-slate-50 rounded-tr-none" : "bg-slate-800/80 border border-slate-800 text-slate-100 rounded-tl-none"}`}>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                <span className="block text-[10px] text-slate-400/80 mt-1.5 text-right">{msg.timestamp}</span>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Footer Chat Input */}
        <form onSubmit={handleSendMessage} className="w-full flex gap-3">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={escalated || !isConnected}
            placeholder={escalated ? "Session locked - escalation triggered." : "Ask a question about your care plan..."}
            className="flex-1 bg-slate-900 border border-slate-850 hover:border-slate-800 focus:border-indigo-500 outline-none rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
          />
          <button
            type="submit"
            disabled={escalated || !inputText.trim() || !isConnected}
            className="px-5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed rounded-xl text-slate-100 flex items-center justify-center transition shadow-md"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </section>

      {/* Footer Branded Footer */}
      <footer className="w-full py-4 text-center text-[10px] text-slate-600 border-t border-slate-900 mt-4 bg-slate-950">
        <p>HealthCenter Care Companion • HIPAA Compliant Vector Data Anchoring</p>
      </footer>
    </main>
  );
}
