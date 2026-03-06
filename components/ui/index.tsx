"use client";
import { cn } from "@/lib/utils";
import { X, AlertTriangle, CheckCircle, Info } from "lucide-react";
import { forwardRef, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";

// ── Input ────────────────────────────────────────────────────────────────────
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, id, className, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className={cn("flex flex-col", className)}>
        {label && <label htmlFor={inputId} className="label">{label}</label>}
        <input ref={ref} id={inputId} className="input-base" aria-invalid={!!error} aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined} {...props} />
        {error && <p id={`${inputId}-error`} className="error-text" role="alert"><AlertTriangle size={12} />{error}</p>}
        {!error && hint && <p id={`${inputId}-hint`} style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>{hint}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";

// ── Select ────────────────────────────────────────────────────────────────────
interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
}
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, placeholder, id, className, ...props }, ref) => {
    const selectId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className={cn("flex flex-col", className)}>
        {label && <label htmlFor={selectId} className="label">{label}</label>}
        <select
          ref={ref}
          id={selectId}
          className="input-base"
          style={{ cursor: "pointer" }}
          aria-invalid={!!error}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        {error && <p className="error-text" role="alert"><AlertTriangle size={12} />{error}</p>}
      </div>
    );
  }
);
Select.displayName = "Select";

// ── Textarea ──────────────────────────────────────────────────────────────────
interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, id, className, ...props }, ref) => {
    const taId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className={cn("flex flex-col", className)}>
        {label && <label htmlFor={taId} className="label">{label}</label>}
        <textarea
          ref={ref}
          id={taId}
          className="input-base"
          style={{ resize: "vertical", minHeight: "80px" }}
          aria-invalid={!!error}
          {...props}
        />
        {error && <p className="error-text" role="alert"><AlertTriangle size={12} />{error}</p>}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

// ── Badge ─────────────────────────────────────────────────────────────────────
const badgeVariants = {
  Scheduled: { bg: "var(--blue-dim)", color: "var(--blue)", border: "rgba(88,166,255,0.2)" },
  Completed: { bg: "var(--accent-dim)", color: "var(--accent)", border: "rgba(63,185,80,0.2)" },
  Cancelled: { bg: "var(--red-dim)", color: "var(--red)", border: "rgba(248,81,73,0.2)" },
  Critical: { bg: "var(--red-dim)", color: "var(--red)", border: "rgba(248,81,73,0.2)" },
  High: { bg: "var(--yellow-dim)", color: "var(--yellow)", border: "rgba(210,153,34,0.2)" },
  Medium: { bg: "var(--blue-dim)", color: "var(--blue)", border: "rgba(88,166,255,0.2)" },
  Low: { bg: "var(--accent-dim)", color: "var(--accent)", border: "rgba(63,185,80,0.2)" },
};

export function Badge({ variant, children }: { variant: keyof typeof badgeVariants; children?: React.ReactNode }) {
  const style = badgeVariants[variant] ?? badgeVariants.Medium;
  return (
    <span className="badge" style={{ background: style.bg, color: style.color, border: `1px solid ${style.border}` }}>
      {children ?? variant}
    </span>
  );
}

// ── Alert ─────────────────────────────────────────────────────────────────────
export function Alert({
  type = "info",
  title,
  children,
  onDismiss,
}: {
  type?: "info" | "success" | "warning" | "error";
  title?: string;
  children: React.ReactNode;
  onDismiss?: () => void;
}) {
  const styles = {
    info: { bg: "var(--blue-dim)", color: "var(--blue)", icon: <Info size={16} /> },
    success: { bg: "var(--accent-dim)", color: "var(--accent)", icon: <CheckCircle size={16} /> },
    warning: { bg: "var(--yellow-dim)", color: "var(--yellow)", icon: <AlertTriangle size={16} /> },
    error: { bg: "var(--red-dim)", color: "var(--red)", icon: <AlertTriangle size={16} /> },
  };
  const s = styles[type];
  return (
    <div
      role={type === "error" ? "alert" : "status"}
      style={{
        background: s.bg,
        color: s.color,
        border: `1px solid currentColor`,
        borderRadius: "var(--radius)",
        padding: "0.875rem 1rem",
        display: "flex",
        gap: "0.75rem",
        alignItems: "flex-start",
        opacity: 0.9,
      }}
      className="animate-fade-in"
    >
      <span style={{ flexShrink: 0, marginTop: "1px" }}>{s.icon}</span>
      <div style={{ flex: 1 }}>
        {title && <div style={{ fontWeight: 600, marginBottom: "0.25rem" }}>{title}</div>}
        <div style={{ fontSize: "0.9rem" }}>{children}</div>
      </div>
      {onDismiss && (
        <button onClick={onDismiss} style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", padding: 0 }} aria-label="Dismiss">
          <X size={16} />
        </button>
      )}
    </div>
  );
}

// ── Chip / Tag ────────────────────────────────────────────────────────────────
export function Chip({ label, onRemove }: { label: string; onRemove?: () => void }) {
  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      gap: "0.25rem",
      padding: "0.2rem 0.625rem",
      borderRadius: "999px",
      background: "var(--bg-elevated)",
      border: "1px solid var(--border)",
      color: "var(--text-secondary)",
      fontSize: "0.8125rem",
    }}>
      {label}
      {onRemove && (
        <button
          onClick={onRemove}
          style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", padding: 0, display: "flex" }}
          aria-label={`Remove ${label}`}
        >
          <X size={12} />
        </button>
      )}
    </span>
  );
}

// ── Modal ─────────────────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-modal
      aria-labelledby="modal-title"
      style={{
        position: "fixed", inset: 0, zIndex: 50,
        background: "rgba(0,0,0,0.6)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "1rem",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="card animate-fade-in" style={{ maxWidth: "480px", width: "100%", position: "relative" }}>
        <button
          onClick={onClose}
          style={{ position: "absolute", top: "1rem", right: "1rem", background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
          aria-label="Close modal"
        >
          <X size={18} />
        </button>
        <h2 id="modal-title" style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", marginBottom: "1rem" }}>{title}</h2>
        {children}
      </div>
    </div>
  );
}

// ── Page Header ───────────────────────────────────────────────────────────────
export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div style={{
      padding: "1.75rem 2rem 1.25rem",
      borderBottom: "1px solid var(--border)",
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: "1rem",
      background: "var(--bg-card)",
    }}>
      <div>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.75rem", color: "var(--text-primary)", lineHeight: 1.2, margin: 0 }}>{title}</h1>
        {subtitle && <p style={{ color: "var(--text-secondary)", marginTop: "0.25rem", fontSize: "0.9rem" }}>{subtitle}</p>}
      </div>
      {action && <div style={{ flexShrink: 0 }}>{action}</div>}
    </div>
  );
}

// ── Loading Spinner ───────────────────────────────────────────────────────────
export function Spinner({ size = 20 }: { size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        border: "2px solid var(--border)",
        borderTopColor: "var(--accent)",
        borderRadius: "50%",
        animation: "spin 0.6s linear infinite",
      }}
      role="status"
      aria-label="Loading"
    />
  );
}

// ── Empty State ───────────────────────────────────────────────────────────────
export function EmptyState({ icon, title, description }: { icon: React.ReactNode; title: string; description?: string }) {
  return (
    <div style={{ textAlign: "center", padding: "3rem 1rem", color: "var(--text-secondary)" }}>
      <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem", opacity: 0.5 }}>{icon}</div>
      <div style={{ fontWeight: 500, color: "var(--text-primary)", marginBottom: "0.25rem" }}>{title}</div>
      {description && <div style={{ fontSize: "0.875rem" }}>{description}</div>}
    </div>
  );
}
