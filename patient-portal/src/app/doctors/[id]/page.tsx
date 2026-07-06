"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DoctorProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id: doctorId } = use(params);

  useEffect(() => {
    router.replace(`/?doctor=${doctorId}`);
  }, [doctorId, router]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
      <div className="w-10 h-10 border-4 border-primary-container border-t-transparent rounded-full animate-spin"></div>
      <p className="text-slate-500 text-xs">Redirecting to themed provider profile...</p>
    </div>
  );
}
