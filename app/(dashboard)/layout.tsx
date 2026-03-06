"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { STRINGS } from "@/lib/utils";
import { UserPlus, Calendar, Activity, LayoutDashboard, Heart } from "lucide-react";

const navItems = [
  { href: "/registration", label: STRINGS.nav.registration, icon: UserPlus },
  { href: "/scheduling", label: STRINGS.nav.scheduling, icon: Calendar },
  { href: "/triage", label: STRINGS.nav.triage, icon: Activity },
  { href: "/clinician", label: STRINGS.nav.clinician, icon: LayoutDashboard },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* Sidebar */}
      <aside
        style={{
          width: "240px",
          minWidth: "240px",
          background: "var(--bg-card)",
          borderRight: "1px solid var(--border)",
          display: "flex",
          flexDirection: "column",
          position: "sticky",
          top: 0,
          height: "100vh",
          overflowY: "auto",
        }}
      >
        {/* Logo */}
        <div style={{ padding: "1.5rem 1.25rem 1rem", borderBottom: "1px solid var(--border)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                background: "var(--accent)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Heart size={16} color="#0d1117" fill="#0d1117" />
            </div>
            <div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem", color: "var(--text-primary)", lineHeight: 1.2 }}>
                MediCare
              </div>
              <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                Hub
              </div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ padding: "1rem 0.75rem", flex: 1 }} aria-label="Main navigation">
          <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase", padding: "0 0.5rem 0.5rem", marginBottom: "0.25rem" }}>
            Navigation
          </div>
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  padding: "0.625rem 0.75rem",
                  borderRadius: "8px",
                  marginBottom: "0.125rem",
                  color: active ? "var(--accent)" : "var(--text-secondary)",
                  background: active ? "var(--accent-dim)" : "transparent",
                  fontWeight: active ? 500 : 400,
                  fontSize: "0.9rem",
                  textDecoration: "none",
                  transition: "all 0.15s",
                  border: `1px solid ${active ? "rgba(63,185,80,0.2)" : "transparent"}`,
                }}
                aria-current={active ? "page" : undefined}
              >
                <Icon size={16} />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Disclaimer */}
        <div style={{ padding: "1rem 1.25rem", borderTop: "1px solid var(--border)" }}>
          <div
            style={{
              background: "var(--yellow-dim)",
              border: "1px solid rgba(210,153,34,0.25)",
              borderRadius: "8px",
              padding: "0.75rem",
              fontSize: "0.75rem",
              color: "var(--yellow)",
              lineHeight: 1.5,
            }}
          >
            ⚠️ Demo only. Synthetic data. Not medical advice.
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, overflow: "auto" }}>
        {children}
      </main>
    </div>
  );
}
