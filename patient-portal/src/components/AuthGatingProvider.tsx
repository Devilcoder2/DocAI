"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";

interface AuthGatingProviderProps {
  children: React.ReactNode;
}

const PUBLIC_ROUTES = ["/welcome"];

export default function AuthGatingProvider({ children }: AuthGatingProviderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, user } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

    if (!isAuthenticated) {
      // Unauthenticated users are gated from accessing dashboard/portal routes
      if (!isPublicRoute) {
        router.replace("/welcome");
      }
    } else if (user) {
      // Authenticated users visiting public auth screen are auto-routed to their portals
      if (isPublicRoute) {
        if (user.role === "Doctor") {
          router.replace("/doctor/dashboard");
        } else {
          router.replace("/");
        }
      } else {
        // Enforce role-based route access controls
        const isDoctorRoute = pathname.startsWith("/doctor");
        if (isDoctorRoute && user.role !== "Doctor") {
          router.replace("/");
        } else if (!isDoctorRoute && pathname !== "/welcome" && user.role === "Doctor") {
          // Doctors should not browse the patient-portal dashboard
          router.replace("/doctor/dashboard");
        }
      }
    }
  }, [mounted, isAuthenticated, user, pathname, router]);

  // Prevent SSR hydration flicker by rendering children only after mounting
  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Check if we are in redirect phase to prevent showing layout content briefly
  const isPublic = PUBLIC_ROUTES.includes(pathname);
  if (!isAuthenticated && !isPublic) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (isAuthenticated && user) {
    const isDoctorRoute = pathname.startsWith("/doctor");
    if (isDoctorRoute && user.role !== "Doctor") {
      return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      );
    }
    if (!isDoctorRoute && !isPublic && user.role === "Doctor") {
      return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      );
    }
  }

  return <>{children}</>;
}
