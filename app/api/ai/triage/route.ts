import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import type { TriageResult } from "@/types";

const triageInputSchema = z.object({
  symptoms: z.string().min(1),
  vitals: z
    .object({
      tempC: z.number().optional(),
      hr: z.number().optional(),
      bp: z.string().optional(),
      spo2: z.number().optional(),
    })
    .default({}),
  onsetDays: z.number().min(0).default(1),
  age: z.number().min(0).max(120),
  sex: z.string(),
});

// Deterministic mock: rule-based on symptom keywords
function mockTriage(input: z.infer<typeof triageInputSchema>): TriageResult {
  const s = input.symptoms.toLowerCase();
  const { tempC, hr, spo2 } = input.vitals;

  // Critical signals
  const hasCritical =
    s.includes("chest pain") ||
    s.includes("difficulty breathing") ||
    s.includes("stroke") ||
    s.includes("unconscious") ||
    (spo2 !== undefined && spo2 < 92);

  const hasHigh =
    s.includes("high fever") ||
    (tempC !== undefined && tempC >= 39.5) ||
    s.includes("severe") ||
    s.includes("bleeding") ||
    (hr !== undefined && hr > 120);

  const hasLow =
    s.includes("rash") ||
    s.includes("mild") ||
    s.includes("cold") ||
    (input.onsetDays >= 7 && !hasCritical && !hasHigh);

  let urgency: TriageResult["triage"]["urgency"];
  let urgencyConf: number;

  if (hasCritical) {
    urgency = "Critical";
    urgencyConf = 0.92;
  } else if (hasHigh) {
    urgency = "High";
    urgencyConf = 0.81;
  } else if (hasLow) {
    urgency = "Low";
    urgencyConf = 0.78;
  } else {
    urgency = "Medium";
    urgencyConf = 0.74;
  }

  // Differentials based on symptom clusters
  const differentials: TriageResult["differentials"] = [];

  if (s.includes("fever") && (s.includes("throat") || s.includes("cough"))) {
    differentials.push({ condition: "Viral pharyngitis", confidence: 0.68 });
    differentials.push({ condition: "Streptococcal pharyngitis", confidence: 0.22 });
    differentials.push({ condition: "Influenza", confidence: 0.1 });
  } else if (s.includes("chest pain") || s.includes("chest")) {
    differentials.push({ condition: "Musculoskeletal chest pain", confidence: 0.45 });
    differentials.push({ condition: "Gastroesophageal reflux", confidence: 0.28 });
    differentials.push({ condition: "Acute coronary syndrome", confidence: 0.15 });
    differentials.push({ condition: "Pulmonary embolism", confidence: 0.12 });
  } else if (s.includes("headache") || s.includes("migraine")) {
    differentials.push({ condition: "Tension headache", confidence: 0.55 });
    differentials.push({ condition: "Migraine without aura", confidence: 0.31 });
    differentials.push({ condition: "Sinusitis", confidence: 0.14 });
  } else if (s.includes("rash") || s.includes("itching") || s.includes("itch")) {
    differentials.push({ condition: "Allergic dermatitis", confidence: 0.52 });
    differentials.push({ condition: "Eczema", confidence: 0.3 });
    differentials.push({ condition: "Urticaria", confidence: 0.18 });
  } else if (s.includes("abdominal") || s.includes("stomach") || s.includes("nausea")) {
    differentials.push({ condition: "Gastroenteritis", confidence: 0.5 });
    differentials.push({ condition: "Irritable bowel syndrome", confidence: 0.28 });
    differentials.push({ condition: "Peptic ulcer disease", confidence: 0.22 });
  } else if (s.includes("breathing") || s.includes("breath") || s.includes("wheeze")) {
    differentials.push({ condition: "Asthma exacerbation", confidence: 0.48 });
    differentials.push({ condition: "COPD exacerbation", confidence: 0.3 });
    differentials.push({ condition: "Pneumonia", confidence: 0.22 });
  } else {
    differentials.push({ condition: "Non-specific viral illness", confidence: 0.55 });
    differentials.push({ condition: "Stress-related symptoms", confidence: 0.25 });
    differentials.push({ condition: "Further evaluation needed", confidence: 0.2 });
  }

  // Guidance
  const guidance: string[] = [];
  if (urgency === "Critical") {
    guidance.push("Seek emergency care immediately");
    guidance.push("Call emergency services (112) if deterioration");
  } else if (urgency === "High") {
    guidance.push("Consult a physician within 24 hours");
  }
  guidance.push("Hydration and rest");
  if (tempC && tempC >= 38) guidance.push("Monitor temperature every 4 hours");
  if (s.includes("throat")) guidance.push("Consider rapid strep test");
  if (s.includes("cough")) guidance.push("Consider chest auscultation");
  guidance.push("Follow up if symptoms worsen or persist > 5 days");

  // Explanation
  const tempNote = tempC ? `temp ${tempC}°C` : "temp not recorded";
  const hrNote = hr ? `HR ${hr} bpm` : "";
  const vitalsNote = [tempNote, hrNote].filter(Boolean).join(", ");
  const explanation = `${input.symptoms.slice(0, 80)} (onset ${input.onsetDays}d, ${input.age}y ${input.sex}) with ${vitalsNote || "vitals not recorded"} → ${urgency.toLowerCase()} urgency. Top differential: ${differentials[0]?.condition ?? "unspecified"}.`;

  return {
    triage: { urgency, confidence: urgencyConf },
    differentials,
    guidance,
    explanation,
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const input = triageInputSchema.parse(body);
    // Simulate a slight async delay (deterministic mock)
    await new Promise((r) => setTimeout(r, 600));
    return NextResponse.json(mockTriage(input));
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation error", details: err.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
