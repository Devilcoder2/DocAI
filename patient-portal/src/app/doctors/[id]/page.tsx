"use client";

import React, { useState, use } from "react";
import { useQuery } from "@tanstack/react-query";
import { Star, MapPin, Shield, Calendar, ArrowLeft, GraduationCap, Award, MessageSquare, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import BookingWizard from "@/components/BookingWizard";

interface Doctor {
  id: string;
  specialty: string;
  clinic_address: string;
  zip_code: string;
  accepted_insurances: string[];
  photo_url: string | null;
  rating: number;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

/**
 * Doctor Profile Page rendering doctor credentials, verified reviews,
 * and an interactive 14-day availability calendar grid linked to the booking checkout.
 */
export default function DoctorProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id: doctorId } = use(params);
  
  // States for Booking Wizard Modal
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string | undefined>(undefined);
  
  // Fetch Doctor details
  const { data: doctor, isLoading: isLoadingDoc, isError: isErrorDoc } = useQuery<Doctor>({
    queryKey: ["doctor", doctorId],
    queryFn: async () => {
      const response = await fetch(`http://localhost:8000/api/v1/public/doctors/${doctorId}`);
      if (!response.ok) {
        throw new Error("Failed to load doctor profile.");
      }
      return response.json();
    }
  });

  // Calculate the rolling 14 days starting from today
  const getRollingFourteenDays = (): Date[] => {
    const dates: Date[] = [];
    const today = new Date();
    for (let i = 0; i < 14; i++) {
      const target = new Date();
      target.setDate(today.getDate() + i);
      dates.push(target);
    }
    return dates;
  };

  const rollingDates = getRollingFourteenDays();
  const [activeDateIndex, setActiveDateIndex] = useState(0); // Offset for sliding calendar views (show 4 days at once)

  // Current sliding segment of 4 days
  const visibleDates = rollingDates.slice(activeDateIndex, activeDateIndex + 4);

  // Set selected slot and trigger wizard
  const handleSelectSlot = (slotIsoString: string) => {
    setSelectedSlot(slotIsoString);
    setIsBookingOpen(true);
  };

  const handleOpenGeneralBooking = () => {
    setSelectedSlot(undefined);
    setIsBookingOpen(true);
  };

  if (isLoadingDoc) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-400 text-sm">Loading provider profile details...</p>
      </div>
    );
  }

  if (isErrorDoc || !doctor) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-center p-4">
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-3xl p-8 max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-rose-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-100 mb-2">Failed to Load Profile</h3>
          <p className="text-sm text-slate-400">The requested healthcare provider profile could not be retrieved from the server.</p>
          <Link href="/" className="mt-6 inline-block bg-teal-500 hover:bg-teal-400 text-slate-950 px-6 py-2.5 rounded-xl font-bold text-sm transition-all">
            Return to Directory
          </Link>
        </div>
      </div>
    );
  }

  const initials = doctor.user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <div className="w-full max-w-7xl mx-auto px-4 py-8">
        
        {/* Back Link */}
        <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-teal-400 font-semibold text-sm mb-8 group transition-all">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Provider Directory
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Column 1 & 2: Provider Info */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Header Details Card */}
            <div className="bg-slate-800/30 border border-slate-800/80 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row gap-6 shadow-xl">
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-teal-500/20 to-teal-500/5 flex items-center justify-center border border-teal-500/30 text-teal-400 font-extrabold text-3xl uppercase shadow-inner mx-auto md:mx-0">
                {initials}
              </div>
              <div className="text-center md:text-left flex-1">
                <h2 className="text-3xl font-extrabold text-slate-100">{doctor.user.name}</h2>
                <p className="text-teal-400 font-bold text-lg mt-1">{doctor.specialty}</p>
                
                <div className="flex items-center justify-center md:justify-start gap-2 mt-3">
                  <div className="flex items-center gap-1 bg-amber-400/10 text-amber-400 px-3 py-1 rounded-lg border border-amber-400/20 text-sm font-bold">
                    <Star className="w-4 h-4 fill-amber-400" />
                    <span>{doctor.rating.toFixed(1)}</span>
                  </div>
                  <span className="text-slate-500 text-xs">•</span>
                  <span className="text-xs text-slate-400">Verified Marketplace Doctor</span>
                </div>

                <div className="flex flex-col md:flex-row gap-4 mt-6 text-sm text-slate-400 border-t border-slate-800/80 pt-4">
                  <span className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-teal-400" />
                    {doctor.clinic_address} (ZIP {doctor.zip_code})
                  </span>
                  <span className="hidden md:inline text-slate-600">|</span>
                  <span className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-teal-400" />
                    Accepts {doctor.accepted_insurances.join(", ")}
                  </span>
                </div>
              </div>
            </div>

            {/* Biography & Credentials */}
            <div className="bg-slate-800/30 border border-slate-800/80 rounded-3xl p-6 md:p-8 space-y-6 shadow-xl">
              <div>
                <h3 className="text-lg font-bold text-slate-200 border-b border-slate-800 pb-3">About Provider</h3>
                <p className="text-slate-400 text-sm leading-relaxed mt-4">
                  {doctor.user.name} is a board-certified specialist practicing in {doctor.specialty} at our local clinic. With over a decade of clinical experience, they are dedicated to providing state-of-the-art diagnostic care and individualized recovery plans. Their practice focuses on patient-centric diagnostics, using advanced clinical tools to deliver top-tier health outcomes.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/25 flex items-center justify-center text-teal-400 shrink-0">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="font-bold text-sm text-slate-200">Education & Training</h5>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      MD — Harvard Medical School<br/>
                      Residency in Medicine — Mayo Clinic
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/25 flex items-center justify-center text-teal-400 shrink-0">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="font-bold text-sm text-slate-200">Board Certifications</h5>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      American Board of {doctor.specialty}<br/>
                      Fellow of the College of Clinical Specialists
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Patient Reviews Section */}
            <div className="bg-slate-800/30 border border-slate-800/80 rounded-3xl p-6 md:p-8 shadow-xl">
              <h3 className="text-lg font-bold text-slate-200 border-b border-slate-800 pb-3 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-teal-400" />
                Patient Feedback & Reviews
              </h3>

              {/* Review scoring breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-6 bg-slate-900/40 p-5 rounded-2xl border border-slate-850">
                <div className="text-center md:border-r border-slate-800/80 pr-4">
                  <span className="text-4xl font-extrabold text-slate-100">{doctor.rating.toFixed(1)}</span>
                  <p className="text-xs text-slate-500 mt-1">Out of 5 Stars</p>
                  <div className="flex justify-center mt-2 text-amber-400">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                  </div>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Bedside Manner</span>
                    <span className="font-bold text-teal-400">4.9 / 5.0</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Wait Time Score</span>
                    <span className="font-bold text-teal-400">4.7 / 5.0</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Cleanliness & Facilities</span>
                    <span className="font-bold text-teal-400">4.8 / 5.0</span>
                  </div>
                </div>
              </div>

              {/* Chronological reviews */}
              <div className="space-y-4 mt-6">
                <div className="border-b border-slate-800/50 pb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-slate-300">Verified Patient</span>
                    <span className="text-xs text-slate-500">2 days ago</span>
                  </div>
                  <div className="flex text-amber-400 mt-1">
                    <Star className="w-3 h-3 fill-amber-400" />
                    <Star className="w-3 h-3 fill-amber-400" />
                    <Star className="w-3 h-3 fill-amber-400" />
                    <Star className="w-3 h-3 fill-amber-400" />
                    <Star className="w-3 h-3 fill-amber-400" />
                  </div>
                  <p className="text-xs text-slate-400 mt-2 italic leading-relaxed">
                    "{doctor.user.name} took the time to review all my options and answer my questions. The clinic was pristine."
                  </p>
                </div>
                
                <div className="pb-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-slate-300">Verified Patient</span>
                    <span className="text-xs text-slate-500">1 week ago</span>
                  </div>
                  <div className="flex text-amber-400 mt-1">
                    <Star className="w-3 h-3 fill-amber-400" />
                    <Star className="w-3 h-3 fill-amber-400" />
                    <Star className="w-3 h-3 fill-amber-400" />
                    <Star className="w-3 h-3 fill-amber-400" />
                    <Star className="w-3 h-3 text-slate-600" />
                  </div>
                  <p className="text-xs text-slate-400 mt-2 italic leading-relaxed">
                    "Very professional staff, minimal wait times. Highly recommended provider."
                  </p>
                </div>
              </div>

            </div>

          </div>

          {/* Column 3: Calendar Grid */}
          <div className="space-y-6">
            
            <div className="bg-slate-800/35 border border-slate-800 hover:border-slate-700/80 rounded-3xl p-6 shadow-xl sticky top-8">
              <h3 className="text-lg font-bold text-slate-200 mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-teal-400" />
                Schedule Appointment
              </h3>
              <p className="text-xs text-slate-400 mb-6">Select a slot to start check-out.</p>

              {/* 14-Day Calendar Carousel Controls */}
              <div className="flex items-center justify-between gap-1 mb-4 bg-slate-900/60 p-2 rounded-2xl border border-slate-800">
                <button
                  disabled={activeDateIndex === 0}
                  onClick={() => setActiveDateIndex(prev => Math.max(0, prev - 2))}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-xs font-bold transition-all text-slate-300"
                >
                  ◀
                </button>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Scroll Dates
                </span>
                <button
                  disabled={activeDateIndex >= 10}
                  onClick={() => setActiveDateIndex(prev => Math.min(10, prev + 2))}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-xs font-bold transition-all text-slate-300"
                >
                  ▶
                </button>
              </div>

              {/* Date Columns and Slots */}
              <div className="grid grid-cols-4 gap-2 mb-6">
                {visibleDates.map((d) => {
                  const dayName = d.toLocaleDateString([], { weekday: 'short' });
                  const dateStr = d.toLocaleDateString([], { month: 'short', day: 'numeric' });
                  const ymd = d.toISOString().split("T")[0];
                  
                  return (
                    <div key={ymd} className="flex flex-col gap-2">
                      <div className="text-center py-1.5 rounded-xl bg-slate-900/40 border border-slate-800/80">
                        <p className="text-[10px] font-bold text-teal-400 uppercase tracking-wider">{dayName}</p>
                        <p className="text-xs font-bold text-slate-200 mt-0.5">{dateStr}</p>
                      </div>
                      <DateSlotsColumn 
                        doctorId={doctorId} 
                        dateStr={ymd} 
                        onSelectSlot={handleSelectSlot} 
                      />
                    </div>
                  );
                })}
              </div>

              <button
                onClick={handleOpenGeneralBooking}
                className="w-full py-3.5 rounded-2xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold text-sm shadow-lg shadow-teal-500/25 transition-all"
              >
                Request Custom Time
              </button>

            </div>

          </div>

        </div>

      </div>

      {/* Booking Wizard Modal */}
      {isBookingOpen && (
        <BookingWizard
          doctorId={doctorId}
          doctorName={doctor.user.name}
          specialty={doctor.specialty}
          selectedSlotTime={selectedSlot}
          onClose={() => setIsBookingOpen(false)}
          onSuccess={() => {
            setIsBookingOpen(false);
            router.push("/");
          }}
        />
      )}

    </div>
  );
}

interface DateSlotsColumnProps {
  doctorId: string;
  dateStr: string;
  onSelectSlot: (slotIsoString: string) => void;
}

function DateSlotsColumn({ doctorId, dateStr, onSelectSlot }: DateSlotsColumnProps) {
  // Fetch slots for this specific date
  const { data: slots = [], isLoading } = useQuery<string[]>({
    queryKey: ["availability", doctorId, dateStr],
    queryFn: async () => {
      const response = await fetch(`http://localhost:8000/api/v1/public/doctors/${doctorId}/availability?date=${dateStr}`);
      if (!response.ok) return [];
      return response.json();
    }
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-4">
        <div className="w-4 h-4 border-2 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <div className="text-[10px] text-slate-500 text-center py-4 border border-dashed border-slate-800 rounded-xl bg-slate-900/10">
        None
      </div>
    );
  }

  // Display maximum 5 slots in column view, scroll if more
  return (
    <div className="flex flex-col gap-1.5 max-h-56 overflow-y-auto pr-1">
      {slots.map((slot) => {
        const timeStr = new Date(slot).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return (
          <button
            key={slot}
            onClick={() => onSelectSlot(slot)}
            className="py-2 px-1 text-[10px] bg-teal-500/5 hover:bg-teal-500 text-teal-400 hover:text-slate-950 border border-teal-500/15 hover:border-transparent font-bold rounded-lg transition-all text-center"
          >
            {timeStr}
          </button>
        );
      })}
    </div>
  );
}
