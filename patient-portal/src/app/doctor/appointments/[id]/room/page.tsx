"use client";

import React, { useState, useEffect, useRef, use } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { 
  Video, VideoOff, Mic, MicOff, PhoneOff, AlertTriangle, 
  MessageSquare, Send, ShieldAlert, Wifi, Camera, User, RefreshCw,
  Play, Square, Eye, Award
} from "lucide-react";
import Link from "next/link";
import { useAuthStore } from "@/store/useAuthStore";

interface Message {
  sender: "Doctor" | "Patient" | "System";
  text: string;
  time: string;
}

/**
 * Doctor Consult Telehealth Console Room.
 * Provides the clinical user interface containing participant streams and
 * Scribe recording buttons (triggers downstream Docker container recorders).
 */
export default function DoctorTelehealthRoom({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id: appointmentId } = use(params);
  const queryClient = useQueryClient();
  
  // Auth state
  const { token, user } = useAuthStore();
  
  // Audio/Video control states
  const [cameraActive, setCameraActive] = useState(true);
  const [micActive, setMicActive] = useState(true);
  const [isSimulator, setIsSimulator] = useState(false);
  const [scribeStatus, setScribeStatus] = useState<"STANDBY" | "RECORDING" | "MOCK_ACTIVE" | "PROCESSING">("STANDBY");
  const [scribeDetail, setScribeDetail] = useState("");
  
  // Video DOM refs
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  
  // Chat state
  const [chatMessages, setChatMessages] = useState<Message[]>([
    { sender: "System", text: "Clinical consultation session initialized. Patient is ready to join.", time: "11:00 AM" }
  ]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // LiveKit Room state reference
  const roomRef = useRef<any>(null);

  // 1. Fetch appointment details
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

  // 2. Fetch patient details to display profile in room
  const patientId = appointment?.patient_id;
  const { data: patientProfile } = useQuery({
    queryKey: ["patient", patientId],
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

  // 3. Connect to LiveKit Room or activate Simulator fallback
  useEffect(() => {
    if (!token || !appointmentId) return;

    let active = true;

    async function initializeRoom() {
      try {
        // Request LiveKit join token from Telehealth microservice
        const tokenResp = await fetch("http://localhost:8000/api/v1/telehealth/rooms/token", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ appointment_id: appointmentId })
        });

        if (!tokenResp.ok) {
          throw new Error("Failed to generate LiveKit room token");
        }

        const roomCredentials = await tokenResp.json();
        
        // Dynamically import livekit-client to prevent Next.js SSR build errors
        const { Room, RoomEvent, VideoPresets } = await import("livekit-client");
        
        const lkRoom = new Room({
          videoCaptureDefaults: {
            resolution: VideoPresets.h720.resolution
          }
        });
        roomRef.current = lkRoom;

        // Monitor remote participant track publications (Patient video)
        lkRoom.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
          if (track.kind === "video" && remoteVideoRef.current) {
            track.attach(remoteVideoRef.current);
          }
        });

        lkRoom.on(RoomEvent.TrackUnsubscribed, (track, publication, participant) => {
          if (track.kind === "video") {
            track.detach();
          }
        });

        // Track scribe recording container activity
        const checkScribeStatus = async () => {
          try {
            const statusResp = await fetch(`http://localhost:8000/api/v1/telehealth/rooms/${roomCredentials.room_name}/scribe/status`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            if (statusResp.ok) {
              const data = await statusResp.json();
              setScribeStatus(data.status);
            }
          } catch (e) {
            console.warn("Failed to check scribe status:", e);
          }
        };

        // Poll status every 3 seconds to update indicator
        const scribeInterval = setInterval(checkScribeStatus, 3000);

        // Connect to LiveKit SFU instance
        await lkRoom.connect(`ws://localhost:7880`, roomCredentials.token);
        
        // Publish local camera and microphone tracks (Doctor)
        await lkRoom.localParticipant.enableCameraAndMicrophone();
        
        // Bind local camera track to display
        if (localVideoRef.current) {
          const localVideoTrack = lkRoom.localParticipant.getTrackPublication("video");
          if (localVideoTrack && localVideoTrack.track) {
            localVideoTrack.track.attach(localVideoRef.current);
          }
        }

        console.log("[LiveKit] Doctor connected to session room:", roomCredentials.room_name);
        
        return () => {
          clearInterval(scribeInterval);
          lkRoom.disconnect();
        };

      } catch (err) {
        if (!active) return;
        console.warn("[LiveKit] Connection failed. Booting Doctor Telehealth Simulator instead.", err);
        setIsSimulator(true);
        activateSimulatorCamera();
      }
    }

    initializeRoom();

    return () => {
      active = false;
      if (roomRef.current) {
        roomRef.current.disconnect();
      }
      stopLocalWebcam();
    };
  }, [token, appointmentId]);

  // 4. Activate local camera inside Simulator Mode
  const activateSimulatorCamera = async () => {
    try {
      if (localStreamRef.current) {
        stopLocalWebcam();
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    } catch (e) {
      console.warn("Could not access local webcam feed in mock simulator:", e);
    }
  };

  const stopLocalWebcam = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
  };

  // Toggle Camera Track
  const toggleCamera = () => {
    if (isSimulator) {
      if (localStreamRef.current) {
        localStreamRef.current.getVideoTracks().forEach(track => {
          track.enabled = !cameraActive;
        });
      }
      setCameraActive(!cameraActive);
    } else if (roomRef.current) {
      const active = !cameraActive;
      roomRef.current.localParticipant.setCameraEnabled(active);
      setCameraActive(active);
    }
  };

  // Toggle Mic Track
  const toggleMicrophone = () => {
    if (isSimulator) {
      if (localStreamRef.current) {
        localStreamRef.current.getAudioTracks().forEach(track => {
          track.enabled = !micActive;
        });
      }
      setMicActive(!micActive);
    } else if (roomRef.current) {
      const active = !micActive;
      roomRef.current.localParticipant.setMicrophoneEnabled(active);
      setMicActive(active);
    }
  };

  // End Consultation session
  const handleEndCall = () => {
    stopLocalWebcam();
    if (roomRef.current) {
      roomRef.current.disconnect();
    }
    router.push("/");
  };

  // Scribe Recording Control Handlers
  const handleStartScribe = async () => {
    const roomName = `appointment_${appointmentId}`;
    try {
      setScribeDetail("Launching transcription recorder container...");
      const response = await fetch(`http://localhost:8000/api/v1/telehealth/rooms/${roomName}/scribe/start`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setScribeStatus(data.status);
        setScribeDetail(data.status === "RECORDING" ? "Docker Playwright container active." : "Mock recorder mode active.");
        
        // Broadcast System Alert in chat
        setChatMessages(prev => [
          ...prev, 
          { sender: "System", text: "AI Clinical Scribe bot has connected to room and started audio recording.", time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
        ]);
      } else {
        const errData = await response.json();
        setScribeDetail(`Start failed: ${errData.detail || response.statusText}`);
      }
    } catch (e: any) {
      setScribeDetail(`Network error toggling scribe: ${e.message}`);
    }
  };

  const handleStopScribe = async () => {
    const roomName = `appointment_${appointmentId}`;
    try {
      setScribeDetail("Stopping recorder & triggering post-processing...");
      const response = await fetch(`http://localhost:8000/api/v1/telehealth/rooms/${roomName}/scribe/stop`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setScribeStatus("PROCESSING");
        setScribeDetail("FFmpeg mixing, Fernet encryption, and S3 upload in progress...");
        
        setChatMessages(prev => [
          ...prev, 
          { sender: "System", text: "AI Scribe has disconnected. Consolidating clinical transcripts...", time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
        ]);
      } else {
        const errData = await response.json();
        setScribeDetail(`Stop failed: ${errData.detail || response.statusText}`);
      }
    } catch (e: any) {
      setScribeDetail(`Network error stopping scribe: ${e.message}`);
    }
  };

  // Poll simulator scribe status to update UI simulation
  useEffect(() => {
    if (!isSimulator || !appointmentId) return;
    
    const checkMockScribe = async () => {
      try {
        const roomName = `appointment_${appointmentId}`;
        const statusResp = await fetch(`http://localhost:8000/api/v1/telehealth/rooms/${roomName}/scribe/status`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (statusResp.ok) {
          const data = await statusResp.json();
          setScribeStatus(data.status);
          if (data.status === "STANDBY") {
            setScribeDetail("System idle. Awaiting clinical toggle.");
          } else if (data.status === "MOCK_ACTIVE") {
            setScribeDetail("Mock recorder active. Appending streams to disk...");
          }
        }
      } catch (e) {
        // Ignored in simulator
      }
    };

    const interval = setInterval(checkMockScribe, 2000);
    return () => clearInterval(interval);
  }, [isSimulator, appointmentId, token]);

  // Auto Scroll Chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // Send Message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: Message = {
      sender: "Doctor",
      text: newMessage,
      time: timeStr
    };

    setChatMessages(prev => [...prev, userMsg]);
    setNewMessage("");

    // Simulate patient responding after a delay in Simulator Mode
    if (isSimulator) {
      setTimeout(() => {
        const responseMsg: Message = {
          sender: "Patient",
          text: `Yes doctor, I hear you loud and clear. (Simulated Patient)`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setChatMessages(prev => [...prev, responseMsg]);
      }, 2000);
    }
  };

  if (!token || user?.role !== "Doctor") {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-center p-4">
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

  return (
    <div className="flex flex-col h-screen bg-slate-950 overflow-hidden font-sans">
      
      {/* HIPAA AI Scribe Warning Banner */}
      <div className="bg-teal-900/40 border-b border-teal-500/30 px-6 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-teal-500/20 p-2 rounded-lg text-teal-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-100">AI Clinical Scribe Dashboard Console</h4>
            <p className="text-xs text-slate-300">
              Ensure you obtain digital consent from the patient prior to launching the scribe recording tasks. Keep recording active for duration of conversation.
            </p>
          </div>
        </div>
        
        {/* Scribe Status Lights */}
        <div className="flex items-center gap-2">
          {scribeStatus === "RECORDING" || scribeStatus === "MOCK_ACTIVE" ? (
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
              SCRIBE CAPTURE ACTIVE
            </span>
          ) : scribeStatus === "PROCESSING" ? (
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              S3 ARCHIVING PIPELINE
            </span>
          ) : (
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
              SCRIBE STANDBY
            </span>
          )}
        </div>
      </div>

      {/* Main Room Console Layout */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Left Column: Video Feeds & Controls */}
        <div className="flex-1 flex flex-col p-6 gap-6 justify-between bg-slate-900/40">
          
          {/* Room Header Info */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-teal-400 uppercase tracking-widest">Clinical Dashboard Portal</span>
              <h2 className="text-xl font-bold text-slate-100">
                Consultation with Patient: {patientProfile?.name || "Loading Name..."}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Patient Member ID: {patientProfile?.id || "N/A"} | Appointment ID: {appointmentId.substring(0, 8)}
              </p>
            </div>
            
            {isSimulator && (
              <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-1.5 text-amber-400">
                <Wifi className="w-4 h-4 animate-bounce" />
                <span className="text-xs font-semibold">Simulator Fallback Active</span>
              </div>
            )}
          </div>

          {/* Video Grid Grid */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 relative min-h-[300px]">
            
            {/* Remote Feed (Patient) */}
            <div className="relative bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl flex items-center justify-center">
              {isSimulator ? (
                // Simulator Mock Feed UI
                <div className="text-center p-8 flex flex-col items-center gap-4">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 text-3xl font-bold">
                      {patientProfile?.name ? patientProfile.name.split(" ").map((n: string) => n[0]).join("") : "PA"}
                    </div>
                    <span className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-emerald-500 border-4 border-slate-900"></span>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-100 text-lg">{patientProfile?.name || "Patient Account"}</h3>
                    <p className="text-xs text-teal-400 font-medium tracking-wider">{patientProfile?.email || "patient@gmail.com"}</p>
                    <p className="text-xs text-slate-500 mt-2 italic">Remote camera connected. Awaiting stream sync...</p>
                  </div>
                </div>
              ) : (
                <video 
                  ref={remoteVideoRef} 
                  autoPlay 
                  playsInline 
                  className="w-full h-full object-cover"
                />
              )}
              
              {/* Patient Label overlay */}
              <div className="absolute bottom-4 left-4 bg-slate-950/80 backdrop-blur-md px-4 py-2 rounded-xl text-xs font-semibold text-slate-200 border border-slate-800 flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-teal-400" />
                Patient: {patientProfile?.name?.split(" ").slice(-1)[0] || "User"}
              </div>
            </div>

            {/* Local Feed (Doctor) */}
            <div className="relative bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl flex items-center justify-center">
              <video 
                ref={localVideoRef} 
                autoPlay 
                playsInline 
                muted
                className={`w-full h-full object-cover ${cameraActive ? "" : "hidden"}`}
              />
              
              {!cameraActive && (
                <div className="text-center p-6 text-slate-500 flex flex-col items-center gap-3">
                  <VideoOff className="w-12 h-12 text-slate-600" />
                  <span className="text-xs">Your camera is turned off</span>
                </div>
              )}

              {/* Doctor Label Overlay */}
              <div className="absolute bottom-4 left-4 bg-slate-950/80 backdrop-blur-md px-4 py-2 rounded-xl text-xs font-semibold text-slate-200 border border-slate-800 flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-teal-400" />
                Dr. {user?.name || "Physician"} (You)
              </div>
            </div>

          </div>

          {/* Media Actions Call Control Toolbar */}
          <div className="flex items-center justify-center gap-4 py-2">
            <button 
              onClick={toggleMicrophone}
              className={`p-4 rounded-2xl border transition-all duration-300 ${
                micActive 
                  ? "bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700" 
                  : "bg-rose-500/20 border-rose-500/30 text-rose-400 hover:bg-rose-500/30"
              }`}
              title={micActive ? "Mute Mic" : "Unmute Mic"}
            >
              {micActive ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
            </button>

            <button 
              onClick={toggleCamera}
              className={`p-4 rounded-2xl border transition-all duration-300 ${
                cameraActive 
                  ? "bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700" 
                  : "bg-rose-500/20 border-rose-500/30 text-rose-400 hover:bg-rose-500/30"
              }`}
              title={cameraActive ? "Turn Camera Off" : "Turn Camera On"}
            >
              {cameraActive ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
            </button>

            {isSimulator && (
              <button 
                onClick={activateSimulatorCamera}
                className="p-4 rounded-2xl border bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 transition-all"
                title="Reset Camera Device Connection"
              >
                <RefreshCw className="w-6 h-6 animate-spin-slow" />
              </button>
            )}

            <button 
              onClick={handleEndCall}
              className="p-4 rounded-2xl bg-rose-500 hover:bg-rose-400 text-slate-950 hover:scale-105 transition-all shadow-lg shadow-rose-500/20"
              title="Leave Consultation Session"
            >
              <PhoneOff className="w-6 h-6 font-bold" />
            </button>
          </div>

        </div>

        {/* Right Column: Scribe Panel & Chat */}
        <div className="w-96 border-l border-slate-800 flex flex-col bg-slate-900/60 backdrop-blur-xl">
          
          {/* Scribe Controls Card Section */}
          <div className="p-5 border-b border-slate-800 bg-slate-900/80">
            <div className="flex items-center gap-2 mb-4">
              <Eye className="w-5 h-5 text-teal-400" />
              <h3 className="font-bold text-slate-100 text-sm uppercase tracking-wider">AI Scribe Controller</h3>
            </div>
            
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Recording Status:</span>
                <span className={`text-xs font-bold ${
                  scribeStatus === "RECORDING" || scribeStatus === "MOCK_ACTIVE" 
                    ? "text-rose-400" 
                    : scribeStatus === "PROCESSING"
                      ? "text-amber-400"
                      : "text-slate-500"
                }`}>
                  {scribeStatus}
                </span>
              </div>
              
              {scribeDetail && (
                <div className="text-[11px] text-slate-400 leading-relaxed bg-slate-900/50 p-2.5 rounded-lg border border-slate-800/50">
                  {scribeDetail}
                </div>
              )}

              <div className="flex gap-2.5 mt-1">
                {scribeStatus === "STANDBY" || scribeStatus === "PROCESSING" ? (
                  <button 
                    onClick={handleStartScribe}
                    disabled={scribeStatus === "PROCESSING"}
                    className="flex-1 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-teal-500/10 disabled:opacity-50"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    Start Scribe
                  </button>
                ) : (
                  <button 
                    onClick={handleStopScribe}
                    className="flex-1 bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-rose-500/10"
                  >
                    <Square className="w-3.5 h-3.5 fill-current" />
                    Stop Scribe
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Chat Logs List */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {chatMessages.map((msg, i) => (
              <div 
                key={i} 
                className={`flex flex-col max-w-[85%] ${
                  msg.sender === "Doctor" 
                    ? "ml-auto items-end" 
                    : msg.sender === "System" 
                      ? "mx-auto text-center items-center w-full" 
                      : "items-start"
                }`}
              >
                {msg.sender !== "System" && (
                  <span className="text-[10px] text-slate-500 font-semibold mb-1">
                    {msg.sender === "Doctor" ? "You" : patientProfile?.name || "Patient"}
                  </span>
                )}
                <div 
                  className={`p-3.5 rounded-2xl text-sm ${
                    msg.sender === "Doctor"
                      ? "bg-teal-500 text-slate-950 font-medium rounded-tr-none"
                      : msg.sender === "System"
                        ? "bg-slate-800/40 text-teal-400/90 border border-slate-800 text-xs py-2"
                        : "bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700/60"
                  }`}
                >
                  {msg.text}
                </div>
                {msg.sender !== "System" && (
                  <span className="text-[9px] text-slate-600 mt-1">{msg.time}</span>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-800 flex gap-2 bg-slate-950/40">
            <input 
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type message here..."
              className="flex-1 bg-slate-900 border border-slate-800 focus:border-teal-500/50 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none transition-all"
            />
            <button 
              type="submit"
              className="bg-teal-500 hover:bg-teal-400 text-slate-950 p-2.5 rounded-xl font-bold transition-all shadow-md shadow-teal-500/10"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>

        </div>

      </div>
    </div>
  );
}
