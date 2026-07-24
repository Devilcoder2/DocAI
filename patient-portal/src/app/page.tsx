"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, ChevronRight, FileText, MessageCircle, Video } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import PortalShell from "@/components/PortalShell";
import SearchDashboard from "@/components/SearchDashboard";
import DoctorProfileView from "@/components/DoctorProfileView";

type Appointment = { id: string; doctor_id: string; appointment_time?: string; start_time?: string; consult_type?: string; reason_for_visit?: string; reason?: string; status: string; clinical_note?: { status: string; patient_summary?: string | null } | null };
type Tab = "home" | "find-care" | "appointments" | "records";
const appointmentDate = (item: Appointment) => new Date(item.appointment_time || item.start_time || "");
const readableDate = (item: Appointment) => appointmentDate(item).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
const normalStatus = (status: string) => status.toLowerCase();

export default function PatientPortal() {
  const params = useSearchParams();
  const { token, user } = useAuthStore();
  const [selectedDoctor, setSelectedDoctor] = useState<string | null>(null);
  const requestedTab = params.get("tab");
  const tab: Tab = requestedTab === "find-care" || requestedTab === "appointments" || requestedTab === "records" ? requestedTab : "home";
  const { data: appointments = [], isLoading, isError } = useQuery<Appointment[]>({
    queryKey: ["patient-appointments", user?.id], enabled: Boolean(token && user?.id),
    queryFn: async () => { const response = await fetch(`http://localhost:8100/api/v1/appointments?patient_id=${user!.id}`, { headers: { Authorization: `Bearer ${token}` } }); if (!response.ok) throw new Error("Could not load appointments"); return response.json(); },
  });
  const { upcoming, past } = useMemo(() => {
    const now = new Date(); const sorted = [...appointments].sort((a, b) => appointmentDate(a).getTime() - appointmentDate(b).getTime());
    return { upcoming: sorted.filter((item) => !["completed", "cancelled"].includes(normalStatus(item.status)) && appointmentDate(item) >= now), past: sorted.filter((item) => ["completed", "cancelled"].includes(normalStatus(item.status)) || appointmentDate(item) < now) };
  }, [appointments]);
  const openHealthHelp = () => document.querySelector<HTMLButtonElement>("#voiceTrigger")?.click();

  if (selectedDoctor) return <PortalShell title="Find care"><div className="p-4 sm:p-6"><DoctorProfileView doctorId={selectedDoctor} onBack={() => setSelectedDoctor(null)} /></div></PortalShell>;
  return <PortalShell title={tab === "home" ? "Your care" : tab === "find-care" ? "Find care" : tab === "appointments" ? "Appointments" : "Health records"} subtitle={tab === "home" ? "A simple view of your next steps" : undefined} actions={<button onClick={openHealthHelp} className="hidden rounded-xl bg-teal-600 px-3 py-2 text-sm font-semibold text-white hover:bg-teal-700 sm:inline-flex">Health help</button>}>
    <div className="p-4 sm:p-6 lg:p-8">
      {tab === "home" && <section className="space-y-6">
        <div className="rounded-3xl bg-teal-700 p-6 text-white shadow-sm sm:p-8"><p className="text-sm font-semibold text-teal-100">Hello, {user?.name?.split(" ")[0] || "there"}</p><h1 className="mt-1 text-3xl font-bold tracking-tight">What do you need today?</h1><p className="mt-2 max-w-xl text-sm leading-6 text-teal-50">Find a doctor, see your appointments, or get help with booking.</p><div className="mt-6 flex flex-wrap gap-3"><a href="/?tab=find-care" className="rounded-xl bg-white px-4 py-3 text-sm font-bold text-teal-800 hover:bg-teal-50">Find a doctor</a><button onClick={openHealthHelp} className="rounded-xl border border-teal-300 px-4 py-3 text-sm font-bold text-white hover:bg-teal-600">Ask Health Help</button></div></div>
        <div className="grid gap-4 md:grid-cols-3"><a href="/?tab=find-care" className="rounded-2xl border border-slate-200 bg-white p-5 hover:border-teal-300 hover:shadow-sm"><span className="grid h-10 w-10 place-items-center rounded-xl bg-teal-50 text-teal-700"><CalendarDays className="h-5 w-5" /></span><h2 className="mt-4 font-bold">Book a visit</h2><p className="mt-1 text-sm text-slate-600">Choose a doctor and a real available time.</p></a><a href="/?tab=appointments" className="rounded-2xl border border-slate-200 bg-white p-5 hover:border-teal-300 hover:shadow-sm"><span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-700"><Video className="h-5 w-5" /></span><h2 className="mt-4 font-bold">My appointments</h2><p className="mt-1 text-sm text-slate-600">Join video visits when it is time.</p></a><button onClick={openHealthHelp} className="rounded-2xl border border-slate-200 bg-white p-5 text-left hover:border-teal-300 hover:shadow-sm"><span className="grid h-10 w-10 place-items-center rounded-xl bg-amber-50 text-amber-700"><MessageCircle className="h-5 w-5" /></span><h2 className="mt-4 font-bold">Health help</h2><p className="mt-1 text-sm text-slate-600">Help finding a doctor or booking a visit.</p></button></div>
        <AppointmentPreview items={upcoming} loading={isLoading} error={isError} />
      </section>}
      {tab === "find-care" && <SearchDashboard onSelectDoctor={setSelectedDoctor} />}
      {tab === "appointments" && <AppointmentList upcoming={upcoming} past={past} loading={isLoading} error={isError} />}
      {tab === "records" && <Records items={past.filter((item) => normalStatus(item.clinical_note?.status || "") === "approved")} />}
    </div>
  </PortalShell>;
}

function AppointmentPreview({ items, loading, error }: { items: Appointment[]; loading: boolean; error: boolean }) { return <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6"><div className="flex items-center justify-between gap-3"><div><h2 className="font-bold">Next appointments</h2><p className="mt-1 text-sm text-slate-600">Your upcoming visits appear here.</p></div><a href="/?tab=appointments" className="inline-flex items-center gap-1 text-sm font-semibold text-teal-700">See all <ChevronRight className="h-4 w-4" /></a></div>{loading ? <p className="py-6 text-sm text-slate-500">Loading appointments…</p> : error ? <p className="py-6 text-sm text-rose-700">We could not load your appointments. Please try again.</p> : items.length === 0 ? <div className="py-8 text-sm text-slate-600">You have no upcoming appointments. <a className="font-semibold text-teal-700" href="/?tab=find-care">Find a doctor</a> when you are ready.</div> : <div className="mt-4 space-y-3">{items.slice(0, 3).map((item) => <AppointmentCard key={item.id} item={item} />)}</div>}</section>; }
function AppointmentList({ upcoming, past, loading, error }: { upcoming: Appointment[]; past: Appointment[]; loading: boolean; error: boolean }) { if (loading) return <p className="py-12 text-center text-sm text-slate-500">Loading appointments…</p>; if (error) return <p className="rounded-2xl bg-rose-50 p-5 text-sm text-rose-700">We could not load your appointments. Refresh the page and try again.</p>; return <div className="space-y-8"><section><h1 className="text-2xl font-bold">Upcoming appointments</h1><p className="mt-1 text-sm text-slate-600">Join your video visit when it is time.</p><div className="mt-4 space-y-3">{upcoming.length ? upcoming.map((item) => <AppointmentCard key={item.id} item={item} />) : <Empty text="No upcoming appointments." link="Find a doctor" href="/?tab=find-care" />}</div></section><section><h2 className="text-xl font-bold">Past appointments</h2><div className="mt-4 space-y-3">{past.length ? past.map((item) => <AppointmentCard key={item.id} item={item} />) : <Empty text="No past appointments yet." />}</div></section></div>; }
function AppointmentCard({ item }: { item: Appointment }) { const video = item.consult_type === "telehealth"; return <article className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-semibold text-slate-900">{item.reason_for_visit || item.reason || "Appointment"}</p><p className="mt-1 text-sm text-slate-600">{readableDate(item)} · {video ? "Video visit" : "Clinic visit"}</p><p className="mt-2 text-xs font-semibold capitalize text-slate-500">{normalStatus(item.status)}</p></div>{video && normalStatus(item.status) !== "completed" && <a href={`/appointments/${item.id}/room`} className="rounded-xl bg-teal-600 px-4 py-2.5 text-center text-sm font-bold text-white hover:bg-teal-700">Join video visit</a>}{normalStatus(item.status) === "completed" && <a href={`/appointments/${item.id}/companion`} className="rounded-xl border border-slate-300 px-4 py-2.5 text-center text-sm font-bold text-slate-700 hover:bg-slate-50">View visit help</a>}</article>; }
function Records({ items }: { items: Appointment[] }) { return <section><h1 className="text-2xl font-bold">Health records</h1><p className="mt-1 text-sm text-slate-600">Notes appear after your doctor has reviewed and signed them.</p><div className="mt-5 space-y-3">{items.length ? items.map((item) => <article key={item.id} className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex gap-3"><FileText className="mt-0.5 h-5 w-5 text-teal-700" /><div><h2 className="font-bold">Visit summary</h2><p className="mt-1 text-sm text-slate-600">{readableDate(item)}</p>{item.clinical_note?.patient_summary && <p className="mt-3 text-sm leading-6 text-slate-700">{item.clinical_note.patient_summary}</p>}</div></div></article>) : <Empty text="No visit notes are ready yet. Completed notes will appear here after your doctor reviews them." />}</div></section>; }
function Empty({ text, link, href }: { text: string; link?: string; href?: string }) { return <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-600">{text} {link && href && <a href={href} className="font-semibold text-teal-700">{link}</a>}</div>; }
