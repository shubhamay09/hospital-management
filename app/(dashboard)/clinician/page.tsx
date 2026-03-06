"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge, PageHeader, Spinner, EmptyState } from "@/components/ui";
import { STRINGS, formatDateTime, formatDate } from "@/lib/utils";
import { LayoutDashboard, Calendar, Clock, Users, Activity, Filter } from "lucide-react";
import type { Appointment, Provider } from "@/types";

const TZ = "Asia/Kolkata";

// Mock triage outcomes keyed by appointment id (deterministic)
const MOCK_TRIAGE: Record<string, { urgency: "Low" | "Medium" | "High" | "Critical"; symptoms: string }> = {
  appt_9001: { urgency: "Medium", symptoms: "Fever, sore throat, body ache" },
  appt_9002: { urgency: "High", symptoms: "Chest pain follow-up, palpitations" },
};

export default function ClinicianPage() {
  const [providerFilter, setProviderFilter] = useState("");
  const [dateFilter, setDateFilter] = useState(() => {
    // Default to today in YYYY-MM-DD
    return new Date().toISOString().split("T")[0];
  });

  const { data: appointments = [], isLoading } = useQuery<Appointment[]>({
    queryKey: ["appointments", providerFilter, dateFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (providerFilter) params.set("providerId", providerFilter);
      const res = await fetch(`/api/appointments?${params}`);
      return res.json();
    },
  });

  const { data: providers = [] } = useQuery<Provider[]>({
    queryKey: ["providers"],
    queryFn: async () => {
      const res = await fetch("/api/providers");
      return res.json();
    },
    staleTime: 60_000,
  });

  // Filter by date client-side (simulating "today")
  const filtered = appointments.filter((a) => {
    if (!dateFilter) return true;
    // Compare date portion in IST (we'll just compare the raw ISO date portion naively for demo)
    const apptDate = new Date(a.start);
    const filterDate = new Date(dateFilter);
    return (
      apptDate.getFullYear() === filterDate.getFullYear() &&
      apptDate.getMonth() === filterDate.getMonth() &&
      apptDate.getDate() === filterDate.getDate()
    );
  });

  const stats = {
    total: appointments.length,
    scheduled: appointments.filter((a) => a.status === "Scheduled").length,
    completed: appointments.filter((a) => a.status === "Completed").length,
    cancelled: appointments.filter((a) => a.status === "Cancelled").length,
  };

  const providerOptions = [
    { value: "", label: "All Providers" },
    ...providers.map((p) => ({ value: p.id, label: p.name })),
  ];

  return (
    <div>
      <PageHeader title={STRINGS.clinician.title} subtitle={STRINGS.clinician.subtitle} />

      <div style={{ padding: "2rem" }}>
        {/* Stats Bar */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", marginBottom: "2rem" }}>
          {[
            { label: "Total", value: stats.total, icon: <Users size={18} />, color: "var(--text-primary)" },
            { label: "Scheduled", value: stats.scheduled, icon: <Calendar size={18} />, color: "var(--blue)" },
            { label: "Completed", value: stats.completed, icon: <Activity size={18} />, color: "var(--accent)" },
            { label: "Cancelled", value: stats.cancelled, icon: <Clock size={18} />, color: "var(--red)" },
          ].map(({ label, value, icon, color }) => (
            <div key={label} className="card" style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <div style={{ color, opacity: 0.8 }}>{icon}</div>
              <div>
                <div style={{ fontSize: "1.75rem", fontFamily: "var(--font-display)", color, lineHeight: 1 }}>{value}</div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.125rem" }}>{label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", alignItems: "center" }}>
          <Filter size={16} color="var(--text-muted)" />
          <select
            className="input-base"
            style={{ maxWidth: "220px" }}
            value={providerFilter}
            onChange={(e) => setProviderFilter(e.target.value)}
            aria-label="Filter by provider"
          >
            {providerOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <input
            className="input-base"
            type="date"
            style={{ maxWidth: "180px" }}
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            aria-label="Filter by date"
          />
          {(providerFilter || dateFilter) && (
            <button
              className="btn btn-ghost"
              style={{ fontSize: "0.8rem" }}
              onClick={() => { setProviderFilter(""); setDateFilter(""); }}
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Appointments Table */}
        {isLoading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "3rem" }}><Spinner size={32} /></div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<LayoutDashboard size={32} />}
            title="No appointments"
            description="No appointments match the current filters."
          />
        ) : (
          <div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 2fr 2fr 1.5fr 1.5fr 1.5fr",
                gap: "0.75rem",
                padding: "0.5rem 1.25rem",
                fontSize: "0.75rem",
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                borderBottom: "1px solid var(--border)",
                marginBottom: "0.25rem",
              }}
            >
              <span>Patient</span>
              <span>Provider</span>
              <span>Time (IST)</span>
              <span>Channel</span>
              <span>Status</span>
              <span>AI Triage</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
              {filtered.map((appt) => {
                const triage = MOCK_TRIAGE[appt.id];
                return (
                  <div
                    key={appt.id}
                    className="card animate-fade-in"
                    style={{
                      display: "grid",
                      gridTemplateColumns: "2fr 2fr 2fr 1.5fr 1.5fr 1.5fr",
                      gap: "0.75rem",
                      padding: "0.875rem 1.25rem",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 500, fontSize: "0.9rem" }}>{appt.patientName ?? "—"}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{appt.reason}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: "0.875rem" }}>{appt.providerName ?? "—"}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{appt.specialty}</div>
                    </div>
                    <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                      {formatDateTime(appt.start, TZ)}
                    </div>
                    <div>
                      <span style={{
                        padding: "0.2rem 0.5rem",
                        background: "var(--bg-elevated)",
                        borderRadius: "4px",
                        fontSize: "0.75rem",
                        color: "var(--text-secondary)",
                        textTransform: "capitalize",
                      }}>
                        {appt.channel.replace("_", " ")}
                      </span>
                    </div>
                    <Badge variant={appt.status} />
                    <div>
                      {triage ? (
                        <div>
                          <Badge variant={triage.urgency} />
                          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                            {triage.symptoms.slice(0, 30)}{triage.symptoms.length > 30 ? "…" : ""}
                          </div>
                        </div>
                      ) : (
                        <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>—</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
