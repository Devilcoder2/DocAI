"use client";

import { use } from "react";
import VideoVisitRoom from "@/components/VideoVisitRoom";

export default function PatientVideoVisit({ params }: { params: Promise<{ id: string }> }) {
  return <VideoVisitRoom appointmentId={use(params).id} doctor={false} />;
}
