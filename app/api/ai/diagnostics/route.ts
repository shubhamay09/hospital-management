import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import type { DiagnosticsResult } from "@/types";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

const diagnosticsSchema = z.object({
  type: z.enum(["chest_xray", "ecg", "lab_report", "mri", "ct_scan"]),
  fileRef: z.string().min(1),
  fileSize: z.number().max(MAX_SIZE_BYTES).optional(),
  fileType: z.string().optional(),
});

const MOCK_RESULTS: Record<string, DiagnosticsResult> = {
  chest_xray: {
    summary: "No acute cardiopulmonary process detected.",
    confidence: 0.81,
    flags: [],
    nextSteps: ["Clinical correlation recommended"],
  },
  ecg: {
    summary: "Normal sinus rhythm. No ischemic changes detected.",
    confidence: 0.88,
    flags: [],
    nextSteps: ["Routine follow-up as clinically indicated"],
  },
  lab_report: {
    summary: "CBC and metabolic panel within normal limits. Mild leukocytosis noted.",
    confidence: 0.91,
    flags: ["Mild leukocytosis (WBC 11.2)"],
    nextSteps: ["Repeat CBC in 1 week", "Clinical correlation with symptoms"],
  },
  mri: {
    summary: "No intracranial abnormality identified on this series.",
    confidence: 0.77,
    flags: [],
    nextSteps: ["Radiologist review recommended", "Clinical correlation required"],
  },
  ct_scan: {
    summary: "No acute intrathoracic pathology. Small lymph nodes within normal limits.",
    confidence: 0.83,
    flags: [],
    nextSteps: ["Clinical correlation recommended", "Follow-up if symptoms persist"],
  },
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate file type/size if provided
    if (body.fileType && !ALLOWED_TYPES.includes(body.fileType)) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed: JPEG, PNG, WebP, PDF" },
        { status: 400 }
      );
    }
    if (body.fileSize && body.fileSize > MAX_SIZE_BYTES) {
      return NextResponse.json({ error: "File too large. Max 5 MB" }, { status: 400 });
    }

    const data = diagnosticsSchema.parse(body);
    await new Promise((r) => setTimeout(r, 800));

    const result = MOCK_RESULTS[data.type] ?? MOCK_RESULTS.chest_xray;
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation error", details: err.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
