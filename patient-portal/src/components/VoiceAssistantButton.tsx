"use client";

import React, { useEffect, useState, useRef } from "react";
import { Mic, MicOff, Bot, X, Wifi, AlertTriangle } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";

type ConnectionState = "offline" | "connecting" | "ready" | "listening" | "speaking";

interface SpeechMessage {
  sender: "user" | "agent";
  text: string;
}

export default function VoiceAssistantButton() {
  const { isAuthenticated, user, token } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [connState, setConnState] = useState<ConnectionState>("offline");
  const [messages, setMessages] = useState<SpeechMessage[]>([]);
  const [userSpeech, setUserSpeech] = useState("");
  const [agentSpeech, setAgentSpeech] = useState("");
  
  // Browser Speech refs
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const audioIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [visualScale, setVisualScale] = useState<number[]>([1, 1, 1, 1, 1]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      synthRef.current = window.speechSynthesis;
    }
    return () => {
      if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
    };
  }, []);

  // Only render for authenticated Patients
  if (!isAuthenticated || !user || user.role !== "Patient") {
    return null;
  }

  // Generate mock voice response flow for Sub-Phase 9.1 client preview
  const generateMockAgentReply = (input: string): string => {
    const text = input.toLowerCase();
    
    // Emergency Triage Guardrail check
    if (
      text.includes("chest pain") || 
      text.includes("shortness of breath") || 
      text.includes("heart attack") ||
      text.includes("breathing") ||
      text.includes("severe bleeding")
    ) {
      setTimeout(() => {
        setIsOpen(false); // Simply hang up / close the session as per instructions
        if (synthRef.current) synthRef.current.cancel();
      }, 7000);
      return "Warning: We detect potential emergency symptoms. Please call 9 1 1 immediately or go to the nearest emergency room. We cannot book appointments for emergency conditions. Hanging up session.";
    }

    if (text.includes("hello") || text.includes("hi")) {
      return "Hello! I am your AI clinic booking assistant. Would you like to schedule an annual physical or search our doctors list?";
    }
    if (text.includes("doctor") || text.includes("search") || text.includes("physician")) {
      return "I found Dr. Alice Heart, who is a Cardiologist, and Dr. Bob Shield, who is a General Practitioner. Who would you like to schedule with?";
    }
    if (text.includes("alice") || text.includes("cardiology")) {
      return "Dr. Alice has available appointments next Monday at 9:00 AM or 10:30 AM. Would you like to book the 9:00 AM slot?";
    }
    if (text.includes("book") || text.includes("confirm") || text.includes("yes")) {
      return "Thank you! I have confirmed your appointment with Dr. Alice Heart for next Monday at 9:00 AM. A confirmation email notification has been dispatched to your inbox.";
    }
    if (text.includes("recipe") || text.includes("cake") || text.includes("cookie") || text.includes("code")) {
      return "I am configured to assist only with clinic bookings, doctor directories, and appointment scheduling. I cannot answer out of scope questions.";
    }

    return "I can search local healthcare providers, check calendar slot availability, or book a consultation. Let me know how I can help.";
  };

  // Launch Web Speech API Simulator
  const startBrowserSpeechSimulator = () => {
    setConnState("connecting");
    setMessages([
      { sender: "agent", text: "Connecting to AI Care Assistant voice room..." }
    ]);

    setTimeout(() => {
      setConnState("ready");
      setMessages([
        { sender: "agent", text: "Ready. Say 'Hello' to begin or ask to search doctors list." }
      ]);
      speakAgentText("Hello! I am your AI clinic booking assistant. Let me know how I can help you today.");
    }, 1500);
  };

  // Speaks agent response text using browser TTS
  const speakAgentText = (text: string) => {
    if (!synthRef.current) return;
    
    // Stop any active speech
    synthRef.current.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    
    utterance.onstart = () => {
      setConnState("speaking");
      setAgentSpeech(text);
      setMessages(prev => [...prev, { sender: "agent", text }]);
      
      // Animate visual wave bars
      if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
      audioIntervalRef.current = setInterval(() => {
        setVisualScale([
          Math.random() * 2 + 0.5,
          Math.random() * 2 + 0.5,
          Math.random() * 2 + 0.5,
          Math.random() * 2 + 0.5,
          Math.random() * 2 + 0.5
        ]);
      }, 100);
    };

    utterance.onend = () => {
      setConnState("ready");
      if (audioIntervalRef.current) {
        clearInterval(audioIntervalRef.current);
        audioIntervalRef.current = null;
      }
      setVisualScale([1, 1, 1, 1, 1]);
      
      // Auto-listen again after speaking
      listenToUser();
    };

    synthRef.current.speak(utterance);
  };

  // Starts microphone capture using browser SpeechRecognition
  const listenToUser = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setMessages(prev => [...prev, { sender: "agent", text: "Your browser does not support voice speech recognition." }]);
      return;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      setConnState("listening");
      setUserSpeech("");
      
      // Animate visual bars slightly for mic capture active
      if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
      audioIntervalRef.current = setInterval(() => {
        setVisualScale([
          Math.random() * 1.5 + 0.5,
          Math.random() * 1.5 + 0.5,
          Math.random() * 1.5 + 0.5,
          Math.random() * 1.5 + 0.5,
          Math.random() * 1.5 + 0.5
        ]);
      }, 120);
    };

    recognition.onresult = async (event: any) => {
      const transcript = event.results[0][0].transcript;
      setUserSpeech(transcript);
      setMessages(prev => [...prev, { sender: "user", text: transcript }]);

      try {
        const response = await fetch("http://localhost:8000/api/v1/agent/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ message: transcript })
        });
        
        if (response.ok) {
          const data = await response.json();
          const reply = data.response;
          
          if (data.is_emergency) {
            speakAgentText(reply);
            setTimeout(() => {
              setIsOpen(false);
              if (synthRef.current) synthRef.current.cancel();
            }, 8000);
          } else {
            speakAgentText(reply);
          }
        } else {
          const reply = generateMockAgentReply(transcript);
          speakAgentText(reply);
        }
      } catch (err) {
        const reply = generateMockAgentReply(transcript);
        speakAgentText(reply);
      }
    };

    recognition.onerror = () => {
      setConnState("ready");
      if (audioIntervalRef.current) {
        clearInterval(audioIntervalRef.current);
        audioIntervalRef.current = null;
      }
      setVisualScale([1, 1, 1, 1, 1]);
    };

    recognition.onend = () => {
      // If we didn't transition to speaking, return to ready
      setConnState(prev => prev === "listening" ? "ready" : prev);
      if (audioIntervalRef.current && connState === "listening") {
        clearInterval(audioIntervalRef.current);
        audioIntervalRef.current = null;
        setVisualScale([1, 1, 1, 1, 1]);
      }
    };

    recognition.start();
  };

  const handleToggleOpen = () => {
    if (!isOpen) {
      setIsOpen(true);
      startBrowserSpeechSimulator();
    } else {
      setIsOpen(false);
      setConnState("offline");
      if (synthRef.current) synthRef.current.cancel();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
      if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      
      {/* Voice Assistant Panel Window */}
      {isOpen && (
        <div className="mb-4 w-80 bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl flex flex-col space-y-4 animate-in slide-in-from-bottom-5 duration-300">
          
          {/* Header */}
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-teal-400" />
              <div>
                <h4 className="text-xs font-bold text-slate-200">AI Care Assistant</h4>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    connState === "listening" ? "bg-amber-450 animate-pulse" :
                    connState === "speaking" ? "bg-teal-400 animate-pulse" :
                    connState === "ready" ? "bg-emerald-500" :
                    "bg-slate-500"
                  }`} />
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                    {connState === "offline" ? "Offline" :
                     connState === "connecting" ? "Connecting..." :
                     connState === "listening" ? "Listening" :
                     connState === "speaking" ? "Speaking" :
                     "Ready"}
                  </span>
                </div>
              </div>
            </div>
            <button 
              onClick={handleToggleOpen}
              className="text-slate-500 hover:text-slate-300 hover:bg-slate-800 p-1.5 rounded-xl transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages Console View */}
          <div className="h-44 overflow-y-auto space-y-2.5 p-3 rounded-2xl bg-slate-950/60 border border-slate-850 shadow-inner flex flex-col scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
            {messages.map((m, idx) => (
              <div 
                key={idx} 
                className={`text-[11px] max-w-[85%] p-2.5 rounded-xl leading-relaxed ${
                  m.sender === "user" 
                    ? "bg-indigo-500/10 text-indigo-300 border border-indigo-500/15 self-end"
                    : "bg-slate-900 text-slate-350 border border-slate-850 self-start"
                }`}
              >
                {m.text}
              </div>
            ))}
          </div>

          {/* Sound wave Visualizer bars */}
          <div className="flex justify-center items-center gap-1.5 h-12 py-2 bg-slate-950/20 border border-slate-850/50 rounded-2xl">
            {visualScale.map((scale, i) => (
              <span 
                key={i} 
                style={{ transform: `scaleY(${scale})` }}
                className={`w-1.5 rounded-full transition-transform duration-100 ${
                  connState === "listening" ? "h-6 bg-amber-400" :
                  connState === "speaking" ? "h-8 bg-teal-400" :
                  "h-2 bg-slate-800"
                }`}
              />
            ))}
          </div>

          {/* Control Banner */}
          <div className="flex justify-between items-center bg-slate-950/40 border border-slate-850 rounded-xl px-3 py-2 text-[10px] text-slate-500">
            <span className="flex items-center gap-1">
              <Wifi className="w-3.5 h-3.5 text-teal-400" />
              Browser Speech Simulator
            </span>
            {connState === "ready" && (
              <button 
                onClick={listenToUser}
                className="text-teal-400 hover:text-teal-300 font-bold hover:underline cursor-pointer"
              >
                Press to Speak
              </button>
            )}
          </div>

        </div>
      )}

      {/* Floating Microphone Trigger Action Button */}
      <button
        onClick={handleToggleOpen}
        className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl cursor-pointer ${
          isOpen 
            ? "bg-slate-800 text-teal-400 border border-slate-750 hover:bg-slate-750 shadow-teal-500/10" 
            : "bg-gradient-to-r from-teal-500 to-indigo-500 hover:from-teal-400 hover:to-indigo-400 text-slate-950 hover:scale-105 shadow-teal-500/20 shadow-lg"
        }`}
      >
        {isOpen ? <MicOff className="w-6 h-6 animate-pulse" /> : <Mic className="w-6 h-6" />}
      </button>

    </div>
  );
}
