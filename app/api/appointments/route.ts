import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { store } from "@/lib/store";

const apptSchema = z.object({
  patientId: z.string().min(1),
  providerId: z.string().min(1),
  start: z.string().datetime(),
  reason: z.string().min(1).max(500),
  channel: z.enum(["in_person", "video", "phone"]),
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const patientId = searchParams.get("patientId") ?? undefined;
  const providerId = searchParams.get("providerId") ?? undefined;
  const status = searchParams.get("status") ?? undefined;
  const date = searchParams.get("date") ?? undefined;
  return NextResponse.json(store.getAppointments({ patientId, providerId, status, date }));
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = apptSchema.parse(body);

    const patient = store.getPatientById(data.patientId);
    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }
    const provider = store.getProviderById(data.providerId);
    if (!provider) {
      return NextResponse.json({ error: "Provider not found" }, { status: 404 });
    }

    const appt = store.addAppointment(data);
    return NextResponse.json(
      { id: appt.id, status: appt.status, createdAt: appt.createdAt },
      { status: 201 }
    );
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation error", details: err.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
