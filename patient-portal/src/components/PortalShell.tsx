"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { CalendarDays, ClipboardList, FileText, Home, LogOut, Search, Stethoscope, UserRound } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";

type PortalShellProps = {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  doctor?: boolean;
  actions?: React.ReactNode;
};

const patientLinks = [
  { href: "/", label: "Home", icon: Home },
  { href: "/?tab=find-care", label: "Find care", icon: Search },
  { href: "/?tab=appointments", label: "Appointments", icon: CalendarDays },
  { href: "/?tab=records", label: "Health records", icon: FileText },
];

/** Shared, task-first navigation for authenticated pages. */
export default function PortalShell({ children, title, subtitle, doctor = false, actions }: PortalShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, clearAuth } = useAuthStore();
  const links = doctor
    ? [{ href: "/doctor/dashboard", label: "Appointments", icon: ClipboardList }]
    : patientLinks;

  const signOut = () => {
    clearAuth();
    router.replace("/welcome");
  };

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || (href.includes("?tab=") && pathname === "/");
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
          <Link href={doctor ? "/doctor/dashboard" : "/"} className="flex items-center gap-2 font-bold text-slate-900">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-teal-600 text-white">
              {doctor ? <Stethoscope className="h-5 w-5" /> : <span className="text-lg">+</span>}
            </span>
            <span>MedOS Care</span>
          </Link>
          <div className="hidden min-w-0 text-center sm:block">
            {title && <p className="text-sm font-semibold text-slate-900">{title}</p>}
            {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-2">
            {actions}
            {!doctor && <Link href="/profile" aria-label="Open profile" className="grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-sm font-bold text-slate-700 hover:bg-slate-200">{user?.name?.slice(0, 1) || <UserRound className="h-4 w-4" />}</Link>}
            <button onClick={signOut} className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900" aria-label="Sign out">
              <LogOut className="h-4 w-4" /><span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl">
        <aside className="hidden w-60 shrink-0 border-r border-slate-200 bg-white p-3 md:block">
          <nav aria-label="Portal navigation" className="space-y-1">
            {links.map(({ href, label, icon: Icon }) => <Link key={href} href={href} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold ${isActive(href) ? "bg-teal-50 text-teal-800" : "text-slate-600 hover:bg-slate-50"}`}><Icon className="h-5 w-5" />{label}</Link>)}
          </nav>
        </aside>
        <main className="min-w-0 flex-1 pb-24 md:pb-8">{children}</main>
      </div>

      {!doctor && <nav aria-label="Mobile navigation" className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] md:hidden">
        {links.map(({ href, label, icon: Icon }) => <Link key={href} href={href} className={`flex min-h-16 flex-col items-center justify-center gap-1 text-[11px] font-semibold ${isActive(href) ? "text-teal-700" : "text-slate-500"}`}><Icon className="h-5 w-5" />{label}</Link>)}
      </nav>}
    </div>
  );
}
