"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Star, MapPin, Shield, Calendar, ArrowLeft, GraduationCap, Award, MessageSquare, AlertCircle } from "lucide-react";
import BookingWizard from "@/components/BookingWizard";

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

interface DoctorProfileViewProps {
  doctorId: string;
  onBack: () => void;
}

export default function DoctorProfileView({ doctorId, onBack }: DoctorProfileViewProps) {
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
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-12 h-12 border-4 border-primary-container border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-550 text-sm">Loading provider profile details...</p>
      </div>
    );
  }

  if (isErrorDoc || !doctor) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center">
        <div className="glass-card rounded-[32px] p-8 max-w-md border border-card-border">
          <AlertCircle className="w-12 h-12 text-danger-red mx-auto mb-4" />
          <h3 className="text-lg font-bold text-foreground mb-2">Failed to Load Profile</h3>
          <p className="text-xs text-slate-550">The requested healthcare provider profile could not be retrieved from the server.</p>
          <button onClick={onBack} className="mt-6 bg-primary-container hover:bg-medical-blue-dark text-white px-6 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer">
            Return to Directory
          </button>
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
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-slate-500 hover:text-primary-container font-semibold text-xs transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Provider Directory
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Column 1 & 2: Provider Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header Details Card */}
          <div className="glass-card rounded-[32px] p-6 md:p-8 flex flex-col md:flex-row gap-6 border border-card-border shadow-sm">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary-container/20 to-primary-container/5 flex items-center justify-center border border-primary-container/30 text-primary-container font-extrabold text-3xl uppercase shadow-inner mx-auto md:mx-0 shrink-0">
              {initials}
            </div>
            <div className="text-center md:text-left flex-1 min-w-0">
              <h2 className="text-2xl font-extrabold text-foreground truncate">{doctor.user.name}</h2>
              <p className="text-primary-container font-bold text-md mt-1">{doctor.specialty}</p>

              <div className="flex items-center justify-center md:justify-start gap-2 mt-3">
                <div className="flex items-center gap-1 bg-amber-500/10 text-amber-600 px-3 py-1 rounded-lg border border-amber-500/20 text-xs font-bold">
                  <Star className="w-3.5 h-3.5 fill-amber-500" />
                  <span>{doctor.rating.toFixed(1)}</span>
                </div>
                <span className="text-slate-400 text-xs">•</span>
                <span className="text-xs text-slate-500">Verified Marketplace Doctor</span>
              </div>

              <div className="flex flex-col md:flex-row gap-4 mt-6 text-xs text-slate-500 border-t border-card-border/50 pt-4">
                <span className="flex items-center gap-2 justify-center md:justify-start">
                  <MapPin className="w-4 h-4 text-primary-container shrink-0" />
                  <span className="truncate">{doctor.clinic_address} (ZIP {doctor.zip_code})</span>
                </span>
              </div>
            </div>
          </div>

          {/* Biography & Credentials */}
          <div className="glass-card rounded-[32px] p-6 md:p-8 space-y-6 border border-card-border shadow-sm">
            <div>
              <h3 className="text-base font-bold text-foreground border-b border-card-border pb-3">About Provider</h3>
              <p className="text-slate-600 text-xs leading-relaxed mt-4">
                {doctor.user.name} is a board-certified specialist practicing in {doctor.specialty} at our local clinic. With over a decade of clinical experience, they are dedicated to providing state-of-the-art diagnostic care and individualized recovery plans. Their practice focuses on patient-centric diagnostics, using advanced clinical tools to deliver top-tier health outcomes.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-card-border/30">
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-container/10 border border-primary-container/20 flex items-center justify-center text-primary-container shrink-0">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h5 className="font-bold text-xs text-foreground">Education & Training</h5>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    MD — Harvard Medical School<br />
                    Residency in Medicine — Mayo Clinic
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-container/10 border border-primary-container/20 flex items-center justify-center text-primary-container shrink-0">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h5 className="font-bold text-xs text-foreground">Board Certifications</h5>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    American Board of {doctor.specialty}<br />
                    Fellow of the College of Clinical Specialists
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Patient Reviews Section */}
          <div className="glass-card rounded-[32px] p-6 md:p-8 border border-card-border shadow-sm space-y-6">
            <h3 className="text-base font-bold text-foreground border-b border-card-border pb-3 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-primary-container" />
              Patient Feedback & Reviews
            </h3>

            {/* Review scoring breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-6 bg-sidebar-bg/40 p-5 rounded-2xl border border-card-border/40">
              <div className="text-center md:border-r border-card-border/50 pr-4 flex flex-col justify-center items-center">
                <span className="text-3xl font-extrabold text-foreground">{doctor.rating.toFixed(1)}</span>
                <p className="text-[10px] text-slate-400 mt-1">Out of 5 Stars</p>
                <div className="flex justify-center mt-2 text-amber-500">
                  <Star className="w-3.5 h-3.5 fill-amber-500" />
                  <Star className="w-3.5 h-3.5 fill-amber-500" />
                  <Star className="w-3.5 h-3.5 fill-amber-500" />
                  <Star className="w-3.5 h-3.5 fill-amber-500" />
                  <Star className="w-3.5 h-3.5 fill-amber-500" />
                </div>
              </div>
              <div className="space-y-2 md:col-span-2 flex flex-col justify-center">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Bedside Manner</span>
                  <span className="font-bold text-primary-container">4.9 / 5.0</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Wait Time Score</span>
                  <span className="font-bold text-primary-container">4.7 / 5.0</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Cleanliness & Facilities</span>
                  <span className="font-bold text-primary-container">4.8 / 5.0</span>
                </div>
              </div>
            </div>

            {/* Chronological reviews */}
            <div className="space-y-4">
              <div className="border-b border-card-border pb-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-foreground">Verified Patient</span>
                  <span className="text-[10px] text-slate-400">2 days ago</span>
                </div>
                <div className="flex text-amber-500 mt-1">
                  <Star className="w-3 h-3 fill-amber-500" />
                  <Star className="w-3 h-3 fill-amber-500" />
                  <Star className="w-3 h-3 fill-amber-500" />
                  <Star className="w-3 h-3 fill-amber-500" />
                  <Star className="w-3 h-3 fill-amber-500" />
                </div>
                <p className="text-xs text-slate-600 mt-2 italic leading-relaxed">
                  "{doctor.user.name} took the time to review all my options and answer my questions. The clinic was pristine."
                </p>
              </div>

              <div className="pb-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-foreground">Verified Patient</span>
                  <span className="text-[10px] text-slate-400">1 week ago</span>
                </div>
                <div className="flex text-amber-500 mt-1">
                  <Star className="w-3 h-3 fill-amber-500" />
                  <Star className="w-3 h-3 fill-amber-500" />
                  <Star className="w-3 h-3 fill-amber-500" />
                  <Star className="w-3 h-3 fill-amber-500" />
                  <Star className="w-3 h-3 text-slate-300" />
                </div>
                <p className="text-xs text-slate-600 mt-2 italic leading-relaxed">
                  "Very professional staff, minimal wait times. Highly recommended provider."
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Column 3: Calendar Grid */}
        <div className="space-y-6">
          <div className="glass-card rounded-[32px] p-6 border border-card-border shadow-sm sticky top-8 flex flex-col justify-between">
            <div>
              <h3 className="text-base font-bold text-foreground mb-1 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary-container" />
                Schedule Appointment
              </h3>
              <p className="text-xs text-slate-400 mb-6">Select a slot to start check-out.</p>

              {/* 14-Day Calendar Carousel Controls */}
              <div className="flex items-center justify-between gap-1 mb-4 bg-sidebar-bg/60 p-2 rounded-2xl border border-card-border/40">
                <button
                  disabled={activeDateIndex === 0}
                  onClick={() => setActiveDateIndex(prev => Math.max(0, prev - 2))}
                  className="px-2.5 py-1.5 rounded-lg bg-card-bg hover:bg-sidebar-bg disabled:opacity-40 text-[10px] font-bold transition-all border border-card-border/40 text-foreground cursor-pointer"
                >
                  ◀
                </button>
                <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">
                  Scroll Dates
                </span>
                <button
                  disabled={activeDateIndex >= 10}
                  onClick={() => setActiveDateIndex(prev => Math.min(10, prev + 2))}
                  className="px-2.5 py-1.5 rounded-lg bg-card-bg hover:bg-sidebar-bg disabled:opacity-40 text-[10px] font-bold transition-all border border-card-border/40 text-foreground cursor-pointer"
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
                      <div className="text-center py-1.5 rounded-xl bg-sidebar-bg/30 border border-card-border/50">
                        <p className="text-[9px] font-bold text-primary-container uppercase tracking-wider">{dayName}</p>
                        <p className="text-xs font-bold text-foreground mt-0.5">{dateStr}</p>
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
            </div>

            <button
              onClick={handleOpenGeneralBooking}
              className="w-full py-3.5 rounded-2xl bg-primary-container hover:bg-medical-blue-dark text-white font-extrabold text-xs shadow-md shadow-primary-container/15 transition-all cursor-pointer"
            >
              Request Custom Time
            </button>
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
            onBack();
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
        <div className="w-4 h-4 border-2 border-primary-container border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <div className="text-[9px] text-slate-400 text-center py-4 border border-dashed border-card-border/60 rounded-xl bg-sidebar-bg/10">
        None
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5 max-h-56 overflow-y-auto pr-1">
      {slots.map((slot) => {
        const timeStr = new Date(slot).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return (
          <button
            key={slot}
            onClick={() => onSelectSlot(slot)}
            className="py-2 px-1 text-[10px] bg-primary-container/10 hover:bg-primary-container text-primary-container hover:text-white border border-card-border/45 font-bold rounded-lg transition-all text-center cursor-pointer"
          >
            {timeStr}
          </button>
        );
      })}
    </div>
  );
}
