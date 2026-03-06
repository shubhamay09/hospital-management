"use client";
import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Input, Alert, Badge, Chip, PageHeader, Spinner } from "@/components/ui";
import { STRINGS } from "@/lib/utils";
import { Activity, Brain, Plus, Upload, X, AlertTriangle, FileText } from "lucide-react";
import type { TriageResult, DiagnosticsResult } from "@/types";

const SYMPTOM_CHIPS = [
  "Fever", "Sore throat", "Cough", "Headache", "Body ache", "Nausea",
  "Chest pain", "Shortness of breath", "Abdominal pain", "Rash", "Fatigue", "Dizziness",
];

const triageSchema = z.object({
  symptomsText: z.string().min(5, "Describe symptoms (min 5 chars)"),
  tempC: z.string().optional(),
  hr: z.string().optional(),
  bp: z.string().optional(),
  spo2: z.string().optional(),
  onsetDays: z.string().min(1, "Required"),
  age: z.string().min(1, "Required"),
  sex: z.enum(["male", "female", "other"]),
});
type TriageForm = z.infer<typeof triageSchema>;

const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export default function TriagePage() {
  const [chips, setChips] = useState<string[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [triageResult, setTriageResult] = useState<TriageResult | null>(null);
  const [diagResult, setDiagResult] = useState<DiagnosticsResult | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<TriageForm>({
    resolver: zodResolver(triageSchema),
    defaultValues: { sex: "female", onsetDays: "1", age: "30" },
  });

  const triageMutation = useMutation({
    mutationFn: async (data: TriageForm) => {
      const allSymptoms = [data.symptomsText, ...chips].join(", ");
      const body = {
        symptoms: allSymptoms,
        vitals: {
          tempC: data.tempC ? parseFloat(data.tempC) : undefined,
          hr: data.hr ? parseInt(data.hr) : undefined,
          bp: data.bp || undefined,
          spo2: data.spo2 ? parseFloat(data.spo2) : undefined,
        },
        onsetDays: parseInt(data.onsetDays),
        age: parseInt(data.age),
        sex: data.sex,
      };
      const res = await fetch("/api/ai/triage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Triage failed");
      return res.json() as Promise<TriageResult>;
    },
    onSuccess: (data) => {
      setTriageResult(data);
      // If file uploaded, also run diagnostics
      if (file) {
        diagMutation.mutate();
      }
    },
  });

  const diagMutation = useMutation({
    mutationFn: async () => {
      const body = {
        type: "chest_xray",
        fileRef: `upload_${Date.now()}`,
        fileType: file?.type,
        fileSize: file?.size,
      };
      const res = await fetch("/api/ai/diagnostics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Diagnostics failed");
      return res.json() as Promise<DiagnosticsResult>;
    },
    onSuccess: setDiagResult,
  });

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    setFileError(null);
    if (!f) return;
    if (!ALLOWED_FILE_TYPES.includes(f.type)) {
      setFileError("Allowed: JPEG, PNG, WebP, PDF");
      return;
    }
    if (f.size > MAX_FILE_SIZE) {
      setFileError("File too large (max 5 MB)");
      return;
    }
    setFile(f);
  }

  const urgencyColor = {
    Critical: "var(--red)",
    High: "var(--yellow)",
    Medium: "var(--blue)",
    Low: "var(--accent)",
  };

  return (
    <div>
      <PageHeader title={STRINGS.triage.title} subtitle={STRINGS.triage.subtitle} />

      <div style={{ padding: "1.5rem 2rem" }}>
        <Alert type="warning">{STRINGS.triage.disclaimer}</Alert>
      </div>

      <div style={{ padding: "0 2rem 2rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", alignItems: "start" }}>
        {/* Form */}
        <form onSubmit={handleSubmit((data) => { setTriageResult(null); setDiagResult(null); triageMutation.mutate(data); })} noValidate>
          <div className="card" style={{ marginBottom: "1rem" }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem", marginBottom: "1rem" }}>Symptoms</h2>
            <div style={{ marginBottom: "0.75rem" }}>
              <p className="label">Quick Add</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem", marginBottom: "0.5rem" }}>
                {SYMPTOM_CHIPS.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    className="btn btn-secondary"
                    style={{
                      fontSize: "0.8rem",
                      padding: "0.25rem 0.625rem",
                      ...(chips.includes(chip) ? { borderColor: "var(--accent)", color: "var(--accent)", background: "var(--accent-dim)" } : {}),
                    }}
                    onClick={() => setChips((prev) => prev.includes(chip) ? prev.filter((c) => c !== chip) : [...prev, chip])}
                    aria-pressed={chips.includes(chip)}
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="label" htmlFor="symptomsText">Free-text Description</label>
              <textarea
                id="symptomsText"
                className="input-base"
                style={{ resize: "vertical", minHeight: "80px" }}
                placeholder="e.g. Fever and sore throat for 2 days, body ache…"
                {...register("symptomsText")}
                aria-invalid={!!errors.symptomsText}
              />
              {errors.symptomsText && <p className="error-text"><AlertTriangle size={12} />{errors.symptomsText.message}</p>}
            </div>
          </div>

          <div className="card" style={{ marginBottom: "1rem" }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem", marginBottom: "1rem" }}>Vitals & Demographics</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <Input label="Temperature (°C)" type="number" step="0.1" placeholder="38.4" {...register("tempC")} />
              <Input label="Heart Rate (bpm)" type="number" placeholder="92" {...register("hr")} />
              <Input label="Blood Pressure" placeholder="120/80" {...register("bp")} />
              <Input label="SpO₂ (%)" type="number" step="0.1" placeholder="98" {...register("spo2")} />
              <Input label="Onset (days)" type="number" min="0" {...register("onsetDays")} error={errors.onsetDays?.message} />
              <Input label="Age" type="number" min="0" max="120" {...register("age")} error={errors.age?.message} />
            </div>
            <div style={{ marginTop: "0.75rem" }}>
              <p className="label">Sex</p>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                {(["female", "male", "other"] as const).map((s) => (
                  <label key={s} style={{ display: "flex", alignItems: "center", gap: "0.375rem", cursor: "pointer", fontSize: "0.9rem" }}>
                    <input type="radio" value={s} {...register("sex")} />
                    <span style={{ textTransform: "capitalize" }}>{s}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* File Upload */}
          <div className="card" style={{ marginBottom: "1rem" }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem", marginBottom: "0.75rem" }}>
              Optional File Upload
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginLeft: "0.5rem", fontFamily: "var(--font-body)" }}>
                (for AI Diagnostics)
              </span>
            </h2>
            <div
              style={{
                border: "2px dashed var(--border)",
                borderRadius: "8px",
                padding: "1.5rem",
                textAlign: "center",
                cursor: "pointer",
                transition: "border-color 0.15s",
              }}
              onClick={() => fileRef.current?.click()}
              onKeyDown={(e) => e.key === "Enter" && fileRef.current?.click()}
              role="button"
              tabIndex={0}
              aria-label="Upload medical file"
            >
              {file ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.75rem" }}>
                  <FileText size={20} color="var(--accent)" />
                  <span style={{ fontSize: "0.875rem" }}>{file.name}</span>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setFile(null); }}
                    style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
                    aria-label="Remove file"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div style={{ color: "var(--text-muted)" }}>
                  <Upload size={24} style={{ display: "block", margin: "0 auto 0.5rem" }} />
                  <div style={{ fontSize: "0.875rem" }}>Click to upload (JPEG, PNG, PDF · max 5 MB)</div>
                </div>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              style={{ display: "none" }}
              onChange={onFileChange}
              aria-label="File input"
            />
            {fileError && <p className="error-text"><AlertTriangle size={12} />{fileError}</p>}
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: "100%" }} disabled={triageMutation.isPending}>
            {triageMutation.isPending ? <><Spinner size={16} /> Analyzing…</> : <><Brain size={16} /> Run AI Triage</>}
          </button>
        </form>

        {/* Results */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {!triageResult && !triageMutation.isPending && (
            <div style={{ textAlign: "center", padding: "3rem 1rem", color: "var(--text-muted)" }}>
              <Activity size={48} style={{ display: "block", margin: "0 auto 1rem", opacity: 0.3 }} />
              <div style={{ fontSize: "0.9rem" }}>Fill in symptoms and run AI triage to see results</div>
            </div>
          )}

          {triageMutation.isPending && (
            <div className="card" style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "3rem", gap: "1rem" }}>
              <Spinner size={36} />
              <div style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Running deterministic AI analysis…</div>
            </div>
          )}

          {triageResult && (
            <div className="card animate-fade-in">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
                <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem" }}>Triage Result</h2>
                <Badge variant={triageResult.triage.urgency} />
              </div>

              {/* Urgency Meter */}
              <div style={{ marginBottom: "1.25rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.375rem" }}>
                  <span>Urgency: <strong style={{ color: urgencyColor[triageResult.triage.urgency] }}>{triageResult.triage.urgency}</strong></span>
                  <span>Confidence: {Math.round(triageResult.triage.confidence * 100)}%</span>
                </div>
                <div style={{ height: "6px", background: "var(--bg)", borderRadius: "3px", overflow: "hidden" }}>
                  <div style={{
                    height: "100%",
                    width: `${triageResult.triage.confidence * 100}%`,
                    background: urgencyColor[triageResult.triage.urgency],
                    borderRadius: "3px",
                    transition: "width 0.8s ease",
                  }} />
                </div>
              </div>

              {/* Explanation */}
              <div style={{ background: "var(--bg-elevated)", borderRadius: "8px", padding: "0.875rem 1rem", marginBottom: "1.25rem", fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: 1.7 }}>
                {triageResult.explanation}
              </div>

              {/* Differentials */}
              <h3 style={{ fontSize: "0.875rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.75rem" }}>Differentials</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1.25rem" }}>
                {triageResult.differentials.map((d) => (
                  <div key={d.condition} style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <span style={{ flex: 1, fontSize: "0.9rem" }}>{d.condition}</span>
                    <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", minWidth: "3rem", textAlign: "right" }}>
                      {Math.round(d.confidence * 100)}%
                    </span>
                    <div style={{ width: "80px", height: "4px", background: "var(--bg)", borderRadius: "2px", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${d.confidence * 100}%`, background: "var(--blue)", borderRadius: "2px" }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Guidance */}
              <h3 style={{ fontSize: "0.875rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.5rem" }}>Guidance</h3>
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {triageResult.guidance.map((g, i) => (
                  <li key={i} style={{ display: "flex", gap: "0.5rem", fontSize: "0.875rem", marginBottom: "0.375rem", color: "var(--text-secondary)" }}>
                    <span style={{ color: "var(--accent)", flexShrink: 0 }}>→</span>
                    {g}
                  </li>
                ))}
              </ul>

              <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid var(--border)", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                ⚠️ Not medical advice. Deterministic mock output. Synthetic data only.
              </div>
            </div>
          )}

          {/* Diagnostics Result */}
          {(diagMutation.isPending || diagResult) && (
            <div className="card animate-fade-in">
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem", marginBottom: "1rem" }}>
                AI Diagnostics
              </h2>
              {diagMutation.isPending ? (
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", color: "var(--text-secondary)" }}>
                  <Spinner size={18} />
                  <span style={{ fontSize: "0.9rem" }}>Analyzing uploaded file…</span>
                </div>
              ) : diagResult && (
                <div>
                  <div style={{ fontSize: "0.95rem", marginBottom: "0.75rem" }}>{diagResult.summary}</div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.375rem" }}>
                    <span>Confidence</span>
                    <span>{Math.round(diagResult.confidence * 100)}%</span>
                  </div>
                  <div style={{ height: "4px", background: "var(--bg)", borderRadius: "2px", marginBottom: "1rem" }}>
                    <div style={{ height: "100%", width: `${diagResult.confidence * 100}%`, background: "var(--purple)", borderRadius: "2px" }} />
                  </div>
                  {diagResult.flags.length > 0 && (
                    <div style={{ marginBottom: "0.75rem" }}>
                      {diagResult.flags.map((f) => (
                        <span key={f} style={{ display: "inline-block", padding: "0.2rem 0.6rem", background: "var(--yellow-dim)", color: "var(--yellow)", borderRadius: "4px", fontSize: "0.8rem", marginRight: "0.375rem" }}>⚑ {f}</span>
                      ))}
                    </div>
                  )}
                  <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                    Next Steps: {diagResult.nextSteps.join(" · ")}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
