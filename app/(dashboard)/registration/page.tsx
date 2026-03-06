"use client";
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Input, Select, Textarea, Alert, Badge, Chip, Modal, PageHeader, Spinner, EmptyState } from "@/components/ui";
import { STRINGS, formatDate, calculateAge } from "@/lib/utils";
import { Plus, UserPlus, Users, Search, ChevronRight } from "lucide-react";
import type { Patient } from "@/types";

const schema = z.object({
  firstName: z.string().min(1, "Required").max(50),
  lastName: z.string().min(1, "Required").max(50),
  sex: z.enum(["male", "female", "other", "prefer_not_to_say"], { required_error: "Required" }),
  birthDate: z.string().min(1, "Required").refine((d) => !isNaN(Date.parse(d)), "Invalid date"),
  phone: z.string().min(7, "Min 7 chars").max(20, "Max 20 chars"),
  email: z.string().email("Invalid email"),
  address: z.string().min(1, "Required").max(200),
  allergiesInput: z.string().optional(),
  conditionsInput: z.string().optional(),
  medicationsInput: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

async function fetchPatients(): Promise<Patient[]> {
  const res = await fetch("/api/patients");
  if (!res.ok) throw new Error("Failed to fetch patients");
  return res.json();
}

export default function RegistrationPage() {
  const qc = useQueryClient();
  const [view, setView] = useState<"form" | "list">("form");
  const [allergies, setAllergies] = useState<string[]>([]);
  const [conditions, setConditions] = useState<string[]>([]);
  const [medications, setMedications] = useState<string[]>([]);
  const [success, setSuccess] = useState<string | null>(null);
  const [dupModal, setDupModal] = useState<{ existing: { id: string; name: string } } | null>(null);
  const [pendingData, setPendingData] = useState<Omit<Patient, "id" | "createdAt"> | null>(null);
  const [search, setSearch] = useState("");

  const { data: patients = [], isLoading: patientsLoading } = useQuery({
    queryKey: ["patients"],
    queryFn: fetchPatients,
  });

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const mutation = useMutation({
    mutationFn: async (body: Omit<Patient, "id" | "createdAt">) => {
      const res = await fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (res.status === 409) throw { code: "DUPLICATE", existing: json.existing };
      if (!res.ok) throw new Error(json.error ?? "Failed");
      return json;
    },
    onSuccess: (data) => {
      setSuccess(`Patient registered successfully. ID: ${data.id}`);
      reset();
      setAllergies([]);
      setConditions([]);
      setMedications([]);
      qc.invalidateQueries({ queryKey: ["patients"] });
    },
    onError: (err: { code?: string; existing?: { id: string; name: string } }) => {
      if (err.code === "DUPLICATE" && err.existing) {
        setDupModal({ existing: err.existing });
      }
    },
  });

  function addTag(list: string[], setList: (v: string[]) => void, val: string) {
    const trimmed = val.trim();
    if (trimmed && !list.includes(trimmed)) setList([...list, trimmed]);
  }

  function onSubmit(data: FormData) {
    setSuccess(null);
    const body = {
      firstName: data.firstName,
      lastName: data.lastName,
      sex: data.sex,
      birthDate: data.birthDate,
      phone: data.phone,
      email: data.email,
      address: data.address,
      allergies,
      conditions,
      medications,
    };
    setPendingData(body);
    mutation.mutate(body);
  }

  const filtered = patients.filter((p) =>
    `${p.firstName} ${p.lastName} ${p.email} ${p.phone}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <PageHeader
        title={STRINGS.registration.title}
        subtitle={STRINGS.registration.subtitle}
        action={
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button className={`btn ${view === "form" ? "btn-primary" : "btn-secondary"}`} onClick={() => setView("form")}>
              <UserPlus size={15} /> Register
            </button>
            <button className={`btn ${view === "list" ? "btn-primary" : "btn-secondary"}`} onClick={() => setView("list")}>
              <Users size={15} /> Patients
            </button>
          </div>
        }
      />

      <div style={{ padding: "2rem", maxWidth: "800px" }}>
        {view === "form" ? (
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            {success && <Alert type="success" onDismiss={() => setSuccess(null)}>{success}</Alert>}
            {mutation.isError && !dupModal && (
              <Alert type="error">{(mutation.error as Error)?.message ?? "Something went wrong"}</Alert>
            )}

            <div className="card" style={{ marginTop: success || mutation.isError ? "1.25rem" : 0 }}>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem", marginBottom: "1.25rem", color: "var(--text-secondary)" }}>
                Personal Information
              </h2>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <Input label="First Name" {...register("firstName")} error={errors.firstName?.message} />
                <Input label="Last Name" {...register("lastName")} error={errors.lastName?.message} />
                <Controller
                  control={control}
                  name="sex"
                  render={({ field }) => (
                    <Select
                      label="Sex"
                      {...field}
                      placeholder="Select..."
                      error={errors.sex?.message}
                      options={[
                        { value: "male", label: "Male" },
                        { value: "female", label: "Female" },
                        { value: "other", label: "Other" },
                        { value: "prefer_not_to_say", label: "Prefer not to say" },
                      ]}
                    />
                  )}
                />
                <Input label="Date of Birth" type="date" {...register("birthDate")} error={errors.birthDate?.message} />
                <Input label="Phone" type="tel" {...register("phone")} placeholder="+91-9xxxxxxxxx" error={errors.phone?.message} />
                <Input label="Email" type="email" {...register("email")} placeholder="patient@example.com" error={errors.email?.message} />
              </div>
              <div style={{ marginTop: "1rem" }}>
                <Input label="Address" {...register("address")} placeholder="City, State" error={errors.address?.message} />
              </div>
            </div>

            <div className="card" style={{ marginTop: "1rem" }}>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem", marginBottom: "1.25rem", color: "var(--text-secondary)" }}>
                Medical History
              </h2>
              {[
                { label: "Allergies", state: allergies, setState: setAllergies, placeholder: "e.g. penicillin" },
                { label: "Conditions", state: conditions, setState: setConditions, placeholder: "e.g. hypertension" },
                { label: "Medications", state: medications, setState: setMedications, placeholder: "e.g. amlodipine" },
              ].map(({ label, state, setState, placeholder }) => (
                <div key={label} style={{ marginBottom: "1rem" }}>
                  <p className="label">{label}</p>
                  <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem", flexWrap: "wrap" }}>
                    {state.map((item) => (
                      <Chip key={item} label={item} onRemove={() => setState(state.filter((i) => i !== item))} />
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <input
                      className="input-base"
                      placeholder={placeholder}
                      style={{ flex: 1 }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addTag(state, setState, (e.target as HTMLInputElement).value);
                          (e.target as HTMLInputElement).value = "";
                        }
                      }}
                    />
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={(e) => {
                        const input = (e.currentTarget.previousSibling as HTMLInputElement);
                        addTag(state, setState, input.value);
                        input.value = "";
                      }}
                    >
                      <Plus size={15} /> Add
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: "1.25rem", display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
              <button type="button" className="btn btn-secondary" onClick={() => reset()}>Clear</button>
              <button type="submit" className="btn btn-primary" disabled={mutation.isPending}>
                {mutation.isPending ? <><Spinner size={15} /> Registering…</> : <><UserPlus size={15} /> Register Patient</>}
              </button>
            </div>
          </form>
        ) : (
          <div>
            <div style={{ marginBottom: "1rem", position: "relative" }}>
              <Search size={16} style={{ position: "absolute", left: "0.875rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
              <input
                className="input-base"
                style={{ paddingLeft: "2.5rem" }}
                placeholder="Search by name, email, phone…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Search patients"
              />
            </div>
            {patientsLoading ? (
              <div style={{ display: "flex", justifyContent: "center", padding: "3rem" }}><Spinner size={32} /></div>
            ) : filtered.length === 0 ? (
              <EmptyState icon="👤" title="No patients found" description="Register a patient to see them here." />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {filtered.map((p) => (
                  <div key={p.id} className="card" style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "1rem 1.25rem" }}>
                    <div style={{
                      width: "40px", height: "40px", borderRadius: "50%",
                      background: "var(--accent-dim)", color: "var(--accent)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontFamily: "var(--font-display)", fontSize: "1.1rem", flexShrink: 0,
                    }}>
                      {p.firstName[0]}{p.lastName[0]}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 500 }}>{p.firstName} {p.lastName}</div>
                      <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
                        {calculateAge(p.birthDate)}y · {p.sex} · {p.email}
                      </div>
                      {(p.allergies.length > 0 || p.conditions.length > 0) && (
                        <div style={{ display: "flex", gap: "0.375rem", marginTop: "0.375rem", flexWrap: "wrap" }}>
                          {p.allergies.map((a) => <Chip key={a} label={`⚠ ${a}`} />)}
                          {p.conditions.map((c) => <Chip key={c} label={c} />)}
                        </div>
                      )}
                    </div>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                      {formatDate(p.createdAt)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Duplicate Modal */}
      <Modal open={!!dupModal} onClose={() => setDupModal(null)} title={STRINGS.registration.duplicateTitle}>
        <Alert type="warning">{STRINGS.registration.duplicateDesc}</Alert>
        <div style={{ marginTop: "1rem", background: "var(--bg-elevated)", borderRadius: "8px", padding: "0.75rem 1rem", fontSize: "0.9rem" }}>
          <div style={{ color: "var(--text-secondary)", fontSize: "0.8rem" }}>Existing patient</div>
          <div style={{ fontWeight: 500 }}>{dupModal?.existing.name}</div>
          <div style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>ID: {dupModal?.existing.id}</div>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.25rem", justifyContent: "flex-end" }}>
          <button className="btn btn-secondary" onClick={() => setDupModal(null)}>Cancel</button>
          <button
            className="btn btn-primary"
            onClick={() => {
              setDupModal(null);
              setSuccess(`Viewing existing patient: ${dupModal?.existing.id}`);
              setView("list");
            }}
          >
            View Existing <ChevronRight size={15} />
          </button>
        </div>
      </Modal>
    </div>
  );
}
