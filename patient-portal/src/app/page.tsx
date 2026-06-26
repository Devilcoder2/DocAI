"use client";

import React from "react";
import { useRouter } from "next/navigation";
import SearchDashboard from "@/components/SearchDashboard";

/**
 * HomePage Component - Patient Portal Provider Marketplace Landing Page.
 * Routes users to specific doctor profile details upon selection.
 */
export default function HomePage() {
  const router = useRouter();

  const handleSelectDoctor = (doctorId: string, selectedSlot?: string) => {
    // Navigate directly to the doctor details route.
    // If a slot was clicked, it will be pre-loaded in the availability calendar view.
    router.push(`/doctors/${doctorId}`);
  };

  return (
    <main className="flex-1 min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between">
      <SearchDashboard onSelectDoctor={handleSelectDoctor} />
      
      {/* Footer Branding */}
      <footer className="w-full max-w-7xl mx-auto px-4 py-8 border-t border-slate-800/80 text-center text-xs text-slate-500 mt-20">
        <p>© {new Date().getFullYear()} HealthCenter Inc. All rights reserved. HIPAA Compliant Marketplace.</p>
        <p className="mt-1">Developed for Medical AI clinical scheduling and scribe companion services.</p>
      </footer>
    </main>
  );
}
