"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Search, MapPin, Shield, Star, Calendar, ArrowRight, UserCheck } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";

// Type definitions matching schemas
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

interface SearchDashboardProps {
  onSelectDoctor: (doctorId: string, selectedSlot?: string) => void;
}

/**
 * SearchDashboard Component - Handles provider search, filtering, and result lists.
 *
 * Inputs:
 *   onSelectDoctor (function): Callback triggered when a doctor details or slot is clicked.
 */
export default function SearchDashboard({ onSelectDoctor }: SearchDashboardProps) {
  const { isAuthenticated, user, clearAuth } = useAuthStore();
  
  // Search state variables
  const [specialtyInput, setSpecialtyInput] = useState("");
  const [zipInput, setZipInput] = useState("");
  
  // Active search query variables sent to API
  const [specialtyQuery, setSpecialtyQuery] = useState("");
  const [zipQuery, setZipQuery] = useState("");

  // Fetch doctors matching active filters from gateway public endpoint
  const { data: doctors = [], isLoading, isError, refetch } = useQuery<Doctor[]>({
    queryKey: ["doctors", specialtyQuery, zipQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (specialtyQuery) params.append("specialty", specialtyQuery);
      if (zipQuery) params.append("zip_code", zipQuery);
      
      const response = await fetch(`http://localhost:8000/api/v1/public/doctors?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to search doctors.");
      }
      return response.json();
    }
  });

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSpecialtyQuery(specialtyInput);
    setZipQuery(zipInput);
  };

  const handleClearFilters = () => {
    setSpecialtyInput("");
    setZipInput("");
    setSpecialtyQuery("");
    setZipQuery("");
  };

  return (
    <div className="w-full p-6 md:p-8 space-y-8 bg-transparent">

      {/* Discovery Search Panel */}
      <div className="bg-sidebar-bg/30 border border-card-border/40 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
        <h2 className="text-lg font-display font-extrabold text-foreground mb-6 flex items-center gap-2">
          <Search className="text-primary-container dark:text-indigo-400 w-5 h-5" />
          Find Your Healthcare Provider
        </h2>
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-4 top-3.5 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Specialty (e.g. Cardiologist, Dentist...)"
              value={specialtyInput}
              onChange={(e) => setSpecialtyInput(e.target.value)}
              className="w-full bg-sidebar-bg/35 border border-card-border/50 focus:bg-card-bg rounded-2xl py-3.5 pl-12 pr-4 text-foreground placeholder-slate-400 focus:outline-none focus:border-primary-container focus:ring-2 focus:ring-primary-container/10 text-sm transition-all outline-none"
            />
          </div>
          <div className="relative">
            <MapPin className="absolute left-4 top-3.5 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="ZIP Code (e.g. 90210, 10001...)"
              value={zipInput}
              onChange={(e) => setZipInput(e.target.value)}
              className="w-full bg-sidebar-bg/35 border border-card-border/50 focus:bg-card-bg rounded-2xl py-3.5 pl-12 pr-4 text-foreground placeholder-slate-400 focus:outline-none focus:border-primary-container focus:ring-2 focus:ring-primary-container/10 text-sm transition-all outline-none"
            />
          </div>
          <div className="md:col-span-2 flex justify-end gap-3 mt-2">
            {(specialtyQuery || zipQuery) && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="px-5 py-2.5 rounded-2xl bg-card-bg hover:bg-sidebar-bg/60 border border-card-border text-foreground text-sm font-bold transition-all cursor-pointer"
              >
                Clear Filters
              </button>
            )}
            <button
              type="submit"
              className="px-8 py-2.5 rounded-2xl bg-primary-container hover:bg-primary-container/90 text-white font-bold text-sm shadow-lg shadow-primary-container/15 flex items-center gap-2 transition-all cursor-pointer hover:-translate-y-0.5 active:scale-95 duration-200"
            >
              Search Providers
            </button>
          </div>
        </form>
      </div>

      {/* Results Listings */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-display font-extrabold text-foreground">
            Available Providers ({doctors.length})
          </h3>
          {(specialtyQuery || zipQuery) && (
            <span className="text-xs bg-medical-blue-soft/80 text-indigo-700 border border-card-border/30 px-3 py-1 rounded-full text-xs font-semibold">
              Filtered Search
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-10 h-10 border-4 border-primary-container border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-500 text-sm">Searching the provider marketplace...</p>
          </div>
        ) : isError ? (
          <div className="bg-danger-red/10 border border-danger-red/20 text-danger-red rounded-2xl p-6 text-center my-10">
            <p className="font-semibold">Error retrieving doctors directory</p>
            <p className="text-sm text-slate-500 mt-1">Please ensure the gateway and microservices are running locally.</p>
            <button 
              onClick={() => refetch()}
              className="mt-4 px-4 py-2 bg-danger-red text-white hover:bg-danger-red/90 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Retry Connection
            </button>
          </div>
        ) : doctors.length === 0 ? (
          <div className="bg-sidebar-bg/20 border border-card-border/40 text-center py-16 px-4 rounded-3xl">
            <p className="text-slate-500 font-medium">No doctors found matching your criteria.</p>
            <p className="text-xs text-slate-400 mt-2">Try clearing your filters or searching another ZIP code.</p>
            <button
              onClick={handleClearFilters}
              className="mt-4 text-xs font-semibold text-primary-container dark:text-indigo-400 hover:underline"
            >
              Reset Search Parameters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {doctors.map((doc) => (
              <DoctorCard 
                key={doc.id} 
                doctor={doc} 
                onSelect={onSelectDoctor} 
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface DoctorCardProps {
  doctor: Doctor;
  onSelect: (doctorId: string, selectedSlot?: string) => void;
}

function DoctorCard({ doctor, onSelect }: DoctorCardProps) {
  // Format initials
  const initials = doctor.user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2);

  // Fetch the next 3 available slots dynamically for today
  const todayStr = new Date().toISOString().split("T")[0];
  const { data: slots = [], isLoading: isLoadingSlots } = useQuery<string[]>({
    queryKey: ["availability", doctor.id, todayStr],
    queryFn: async () => {
      const response = await fetch(`http://localhost:8000/api/v1/public/doctors/${doctor.id}/availability?date=${todayStr}`);
      if (!response.ok) return [];
      return response.json();
    }
  });

  const nextThreeSlots = slots.slice(0, 3);

  return (
    <div className="bg-card-bg/40 hover:bg-card-bg/85 border border-card-border/40 hover:border-card-border/70 rounded-3xl p-6 flex flex-col lg:flex-row justify-between gap-6 transition-all duration-350 hover:shadow-md hover:-translate-y-0.5">
      <div className="flex gap-5 items-start">
        {/* Profile Picture */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-indigo-500/5 flex items-center justify-center border border-card-border text-primary-container dark:text-indigo-400 font-bold text-xl uppercase shadow-inner">
          {initials}
        </div>

        {/* Doctor Identity */}
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-xl font-display font-extrabold text-foreground">{doctor.user.name}</h4>
          </div>
          <p className="text-primary-container dark:text-indigo-400 font-bold text-sm mt-0.5">{doctor.specialty}</p>

          <div className="flex items-center gap-1.5 mt-2.5">
            <div className="flex items-center gap-0.5 text-amber-400">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span className="text-sm font-bold text-foreground">{doctor.rating.toFixed(1)}</span>
            </div>
            <span className="text-slate-500 text-xs">•</span>
            <span className="text-slate-500 text-xs">Verified Provider</span>
          </div>

          <div className="flex items-center gap-2 mt-4 text-xs text-slate-500">
            <MapPin className="w-4 h-4 text-slate-400" />
            <span>{doctor.clinic_address} (ZIP {doctor.zip_code})</span>
          </div>
        </div>
      </div>

      {/* Slots Carousel Panel */}
      <div className="lg:w-80 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-card-border/40 lg:pl-6 pt-5 lg:pt-0">
        <div>
          <span className="text-xs font-display font-extrabold text-foreground tracking-wider flex items-center gap-1.5 mb-3">
            <Calendar className="w-4 h-4 text-primary-container dark:text-indigo-400" />
            Upcoming Slots (Today)
          </span>
          
          {isLoadingSlots ? (
            <div className="flex items-center justify-center py-4">
              <div className="w-5 h-5 border-2 border-primary-container border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : nextThreeSlots.length === 0 ? (
            <div className="bg-sidebar-bg/40 border border-card-border/40 rounded-2xl py-3 px-4 text-center">
              <p className="text-xs text-slate-500 font-semibold">No slots remaining today.</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {nextThreeSlots.map((slot) => {
                const timeStr = new Date(slot).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                return (
                  <button
                    key={slot}
                    onClick={() => onSelect(doctor.id, slot)}
                    className="py-2.5 px-1 rounded-xl bg-primary-container/10 hover:bg-primary-container text-primary-container hover:text-white border border-card-border/45 font-bold text-xs transition-all text-center cursor-pointer shadow-sm"
                  >
                    {timeStr}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <button
          onClick={() => onSelect(doctor.id)}
          className="mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-card-bg hover:bg-sidebar-bg/60 border border-card-border text-sm font-bold text-foreground transition-all cursor-pointer"
        >
          View Full Profile
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
