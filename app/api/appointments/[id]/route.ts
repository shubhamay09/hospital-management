import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { store } from "@/lib/store";

const patchSchema = z.object({
  status: z.enum(["Scheduled", "Completed", "Cancelled"]).optional(),
  start: z.string().datetime().optional(),
});

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const appt = store.getAppointmentById(params.id);
  if (!appt) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(appt);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const data = patchSchema.parse(body);

    const appt = store.updateAppointment(params.id, data);
    if (!appt) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(appt);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation error", details: err.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
