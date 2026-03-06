import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { store } from "@/lib/store";

const patientSchema = z.object({
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  sex: z.enum(["male", "female", "other", "prefer_not_to_say"]),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  phone: z.string().min(7).max(20),
  email: z.string().email(),
  address: z.string().min(1).max(200),
  allergies: z.array(z.string()).default([]),
  conditions: z.array(z.string()).default([]),
  medications: z.array(z.string()).default([]),
});

export async function GET() {
  return NextResponse.json(store.getPatients());
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = patientSchema.parse(body);

    const duplicate = store.findDuplicate(data.phone, data.email);
    if (duplicate) {
      return NextResponse.json(
        {
          error: "Duplicate patient",
          code: "DUPLICATE",
          existing: { id: duplicate.id, name: `${duplicate.firstName} ${duplicate.lastName}` },
        },
        { status: 409 }
      );
    }

    const patient = store.addPatient(data);
    return NextResponse.json(
      { id: patient.id, createdAt: patient.createdAt },
      { status: 201 }
    );
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation error", details: err.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
