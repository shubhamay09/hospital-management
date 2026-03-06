"use client";
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Input, Select, Alert, Badge, PageHeader, Spinner, Modal, EmptyState } from "@/components/ui";
import { STRINGS, formatDateTime, formatDate, formatTime } from "@/lib/utils";
import { Search, Calendar, Clock, MapPin, Stethoscope, RefreshCw, XCircle, CheckCircle } from "lucide-react";
import type { Provider, Appointment, Patient } from "@/types";

const bookSchema = z.object({
  patientId: z.string().min(1, "Select a patient"),
  providerId: z.string().min(1, "Select a provider"),
  start: z.string().min(1, "Select a time slot"),
  reason: z.string().min(3, "Please describe the reason").max(500),
  channel: z.enum(["in_person", "video", "phone"]),
});
type BookForm = z.infer<typeof bookSchema>;

const SPECIALTIES = ["General Medicine", "Cardiology", "Pediatrics", "Dermatology", "Orthopedics"];
const TZ = "Asia/Kolkata";

export default function SchedulingPage() {
  const qc = useQueryClient();
  const [specialtyFilter, setSpecialtyFilter] = useState("");
  const [nameFilter, setNameFilter] = useState("");
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [rescheduleModal, setRescheduleModal] = useState<{ appt: Appointment } | null>(null);
  const [cancelModal, setCancelModal] = useState<{ appt: Appointment } | null>(null);
  const [newSlot, setNewSlot] = useState("");
  const [activeTab, setActiveTab] = useState<"book" | "appointments">("book");

  const { data: providers = [], isLoading: providersLoading } = useQuery<Provider[]>({
    queryKey: ["providers", specialtyFilter, nameFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (specialtyFilter) params.set("specialty", specialtyFilter);
      if (nameFilter) params.set("name", nameFilter);
      const res = await fetch(`/api/providers?${params}`);
      return res.json();
    },
    staleTime: 60_000,
  });

  const { data: patients = [] } = useQuery<Patient[]>({
    queryKey: ["patients"],
    queryFn: async () => {
      const res = await fetch("/api/patients");
      return res.json();
    },
  });

  const { data: appointments = [], isLoading: apptLoading } = useQuery<Appointment[]>({
    queryKey: ["appointments"],
    queryFn: async () => {
      const res = await fetch("/api/appointments");
      return res.json();
    },
  });

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<BookForm>({
    resolver: zodResolver(bookSchema),
    defaultValues: { channel: "in_person" },
  });

  const bookMutation = useMutation({
    mutationFn: async (body: Omit<BookForm, never>) => {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed");
      return json;
    },
    onSuccess: (data) => {
      setSuccess(`Appointment booked! ID: ${data.id}`);
      reset();
      setSelectedProvider(null);
      qc.invalidateQueries({ queryKey: ["appointments"] });
    },
  });

  const patchMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: { status?: string; start?: string } }) => {
      const res = await fetch(`/api/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed");
      return json;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["appointments"] });
      setRescheduleModal(null);
      setCancelModal(null);
    },
  });

  const patientOptions = patients.map((p) => ({ value: p.id, label: `${p.firstName} ${p.lastName}` }));

  return (
    <div>
      <PageHeader
        title={STRINGS.scheduling.title}
        subtitle={STRINGS.scheduling.subtitle}
        action={
          <div style={{ display: "flex", gap: "0.5rem" }}>
            {(["book", "appointments"] as const).map((t) => (
              <button key={t} className={`btn ${activeTab === t ? "btn-primary" : "btn-secondary"}`} onClick={() => setActiveTab(t)}>
                {t === "book" ? <><Calendar size={15} /> Book</> : <><Clock size={15} /> My Appointments</>}
              </button>
            ))}
          </div>
        }
      />

      <div style={{ padding: "2rem" }}>
        {activeTab === "book" ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", alignItems: "start" }}>
            {/* Provider Search */}
            <div>
              <div className="card" style={{ marginBottom: "1rem" }}>
                <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem", marginBottom: "1rem" }}>Find Provider</h2>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  <div>
                    <p className="label">Specialty</p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem" }}>
                      <button
                        className={`btn btn-secondary`}
                        style={{ fontSize: "0.8125rem", padding: "0.3rem 0.75rem", ...(specialtyFilter === "" ? { borderColor: "var(--accent)", color: "var(--accent)" } : {}) }}
                        onClick={() => setSpecialtyFilter("")}
                      >
                        All
                      </button>
                      {SPECIALTIES.map((s) => (
                        <button
                          key={s}
                          className="btn btn-secondary"
                          style={{ fontSize: "0.8125rem", padding: "0.3rem 0.75rem", ...(specialtyFilter === s ? { borderColor: "var(--accent)", color: "var(--accent)" } : {}) }}
                          onClick={() => setSpecialtyFilter(specialtyFilter === s ? "" : s)}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div style={{ position: "relative" }}>
                    <Search size={15} style={{ position: "absolute", left: "0.875rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                    <input
                      className="input-base"
                      style={{ paddingLeft: "2.5rem" }}
                      placeholder="Search by name…"
                      value={nameFilter}
                      onChange={(e) => setNameFilter(e.target.value)}
                      aria-label="Search provider by name"
                    />
                  </div>
                </div>
              </div>

              {providersLoading ? (
                <div style={{ display: "flex", justifyContent: "center", padding: "2rem" }}><Spinner size={28} /></div>
              ) : providers.length === 0 ? (
                <EmptyState icon={<Stethoscope size={32} />} title="No providers found" description="Try adjusting your filters." />
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {providers.map((prov) => (
                    <button
                      key={prov.id}
                      className="card"
                      style={{
                        textAlign: "left",
                        cursor: "pointer",
                        transition: "all 0.15s",
                        border: `1px solid ${selectedProvider?.id === prov.id ? "var(--accent)" : "var(--border)"}`,
                        background: selectedProvider?.id === prov.id ? "var(--accent-dim)" : "var(--bg-card)",
                        padding: "1rem 1.25rem",
                      }}
                      onClick={() => setSelectedProvider(prov)}
                      aria-pressed={selectedProvider?.id === prov.id}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                          <div style={{ fontWeight: 500 }}>{prov.name}</div>
                          <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginTop: "0.125rem" }}>
                            <Stethoscope size={11} style={{ display: "inline", verticalAlign: "middle", marginRight: "0.25rem" }} />
                            {prov.specialty}
                          </div>
                          <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
                            <MapPin size={11} style={{ display: "inline", verticalAlign: "middle", marginRight: "0.25rem" }} />
                            {prov.locations.join(", ")}
                          </div>
                        </div>
                        <span style={{ fontSize: "0.75rem", color: "var(--accent)" }}>{prov.slots.length} slots</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Booking Form */}
            <div>
              {success && <Alert type="success" onDismiss={() => setSuccess(null)} style={{ marginBottom: "1rem" }}>{success}</Alert>}
              <div className="card">
                <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem", marginBottom: "1.25rem" }}>Book Appointment</h2>
                <form onSubmit={handleSubmit((data) => bookMutation.mutate(data))} noValidate>
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    <Controller
                      control={control}
                      name="patientId"
                      render={({ field }) => (
                        <Select
                          label="Patient"
                          {...field}
                          placeholder="Select patient…"
                          error={errors.patientId?.message}
                          options={patientOptions}
                        />
                      )}
                    />

                    {selectedProvider ? (
                      <div>
                        <p className="label">Provider</p>
                        <div style={{ background: "var(--bg-elevated)", borderRadius: "8px", padding: "0.75rem 1rem", fontSize: "0.9rem" }}>
                          <span style={{ fontWeight: 500 }}>{selectedProvider.name}</span>
                          <span style={{ color: "var(--text-muted)", marginLeft: "0.5rem" }}>— {selectedProvider.specialty}</span>
                        </div>
                        <input type="hidden" value={selectedProvider.id} {...register("providerId")} />
                        {errors.providerId && <p className="error-text">{errors.providerId.message}</p>}
                      </div>
                    ) : (
                      <div>
                        <p className="label">Provider</p>
                        <div style={{ background: "var(--bg)", border: "1px dashed var(--border)", borderRadius: "8px", padding: "0.75rem 1rem", color: "var(--text-muted)", fontSize: "0.9rem" }}>
                          ← Select a provider from the list
                        </div>
                        <input type="hidden" {...register("providerId")} />
                        {errors.providerId && <p className="error-text">{errors.providerId.message}</p>}
                      </div>
                    )}

                    {selectedProvider && (
                      <Controller
                        control={control}
                        name="start"
                        render={({ field }) => (
                          <div>
                            <p className="label">Time Slot (IST)</p>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem", maxHeight: "160px", overflowY: "auto" }}>
                              {selectedProvider.slots.map((slot) => (
                                <button
                                  key={slot}
                                  type="button"
                                  className="btn btn-secondary"
                                  style={{
                                    fontSize: "0.8rem",
                                    padding: "0.3rem 0.6rem",
                                    ...(field.value === slot ? { borderColor: "var(--accent)", color: "var(--accent)", background: "var(--accent-dim)" } : {}),
                                  }}
                                  onClick={() => field.onChange(slot)}
                                >
                                  {formatDate(slot)} · {formatTime(slot, TZ)}
                                </button>
                              ))}
                            </div>
                            {errors.start && <p className="error-text">{errors.start.message}</p>}
                          </div>
                        )}
                      />
                    )}

                    <Input label="Reason for Visit" {...register("reason")} placeholder="Describe the chief complaint…" error={errors.reason?.message} />

                    <Controller
                      control={control}
                      name="channel"
                      render={({ field }) => (
                        <Select
                          label="Channel"
                          {...field}
                          error={errors.channel?.message}
                          options={[
                            { value: "in_person", label: "In Person" },
                            { value: "video", label: "Video Call" },
                            { value: "phone", label: "Phone" },
                          ]}
                        />
                      )}
                    />

                    {bookMutation.isError && (
                      <Alert type="error">{(bookMutation.error as Error).message}</Alert>
                    )}

                    <button type="submit" className="btn btn-primary" disabled={bookMutation.isPending} style={{ marginTop: "0.25rem" }}>
                      {bookMutation.isPending ? <><Spinner size={15} /> Booking…</> : <><Calendar size={15} /> Book Appointment</>}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        ) : (
          /* Appointments List */
          <div>
            {apptLoading ? (
              <div style={{ display: "flex", justifyContent: "center", padding: "3rem" }}><Spinner size={32} /></div>
            ) : appointments.length === 0 ? (
              <EmptyState icon={<Calendar size={32} />} title="No appointments" description="Book an appointment to see it here." />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                {appointments.map((appt) => (
                  <div key={appt.id} className="card" style={{ display: "flex", alignItems: "center", gap: "1.25rem", padding: "1rem 1.25rem" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.25rem" }}>
                        <span style={{ fontWeight: 500 }}>{appt.patientName}</span>
                        <Badge variant={appt.status} />
                      </div>
                      <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                        {appt.providerName} · {appt.specialty}
                      </div>
                      <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
                        <Clock size={11} style={{ display: "inline", verticalAlign: "middle", marginRight: "0.25rem" }} />
                        {formatDateTime(appt.start, TZ)}
                      </div>
                      <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.125rem" }}>{appt.reason}</div>
                    </div>
                    {appt.status === "Scheduled" && (
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <button className="btn btn-secondary" style={{ fontSize: "0.8rem", padding: "0.4rem 0.8rem" }} onClick={() => setRescheduleModal({ appt })}>
                          <RefreshCw size={13} /> Reschedule
                        </button>
                        <button className="btn btn-danger" style={{ fontSize: "0.8rem", padding: "0.4rem 0.8rem" }} onClick={() => setCancelModal({ appt })}>
                          <XCircle size={13} /> Cancel
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Reschedule Modal */}
      <Modal open={!!rescheduleModal} onClose={() => setRescheduleModal(null)} title="Reschedule Appointment">
        <p style={{ color: "var(--text-secondary)", marginBottom: "1rem", fontSize: "0.9rem" }}>
          Current: <strong>{rescheduleModal?.appt.start ? formatDateTime(rescheduleModal.appt.start, TZ) : ""}</strong>
        </p>
        <div>
          <p className="label">New date/time (ISO)</p>
          <input
            className="input-base"
            type="datetime-local"
            onChange={(e) => setNewSlot(new Date(e.target.value).toISOString())}
          />
        </div>
        <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.25rem", justifyContent: "flex-end" }}>
          <button className="btn btn-secondary" onClick={() => setRescheduleModal(null)}>Cancel</button>
          <button
            className="btn btn-primary"
            disabled={!newSlot || patchMutation.isPending}
            onClick={() => rescheduleModal && patchMutation.mutate({ id: rescheduleModal.appt.id, updates: { start: newSlot } })}
          >
            {patchMutation.isPending ? <Spinner size={15} /> : <CheckCircle size={15} />} Confirm
          </button>
        </div>
      </Modal>

      {/* Cancel Modal */}
      <Modal open={!!cancelModal} onClose={() => setCancelModal(null)} title="Cancel Appointment">
        <Alert type="warning">
          Are you sure you want to cancel the appointment for <strong>{cancelModal?.appt.patientName}</strong> on {cancelModal?.appt.start ? formatDateTime(cancelModal.appt.start, TZ) : ""}?
        </Alert>
        <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.25rem", justifyContent: "flex-end" }}>
          <button className="btn btn-secondary" onClick={() => setCancelModal(null)}>Keep</button>
          <button
            className="btn btn-danger"
            disabled={patchMutation.isPending}
            onClick={() => cancelModal && patchMutation.mutate({ id: cancelModal.appt.id, updates: { status: "Cancelled" } })}
          >
            {patchMutation.isPending ? <Spinner size={15} /> : <XCircle size={15} />} Cancel Appointment
          </button>
        </div>
      </Modal>
    </div>
  );
}
