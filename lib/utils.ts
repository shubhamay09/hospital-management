import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO, formatInTimeZone } from "date-fns-tz";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDateTime(isoString: string, tz = "Asia/Kolkata") {
  try {
    return formatInTimeZone(parseISO(isoString), tz, "MMM d, yyyy · h:mm a zzz");
  } catch {
    return isoString;
  }
}

export function formatDate(isoString: string) {
  try {
    return format(parseISO(isoString), "MMM d, yyyy");
  } catch {
    return isoString;
  }
}

export function formatTime(isoString: string, tz = "Asia/Kolkata") {
  try {
    return formatInTimeZone(parseISO(isoString), tz, "h:mm a");
  } catch {
    return isoString;
  }
}

export function calculateAge(birthDate: string): number {
  const today = new Date();
  const dob = new Date(birthDate);
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age;
}

export const STRINGS = {
  app: {
    name: "MediCare Hub",
    tagline: "AI-Assisted Hospital Management",
    disclaimer:
      "Not medical advice. Prototype. Synthetic data only. For demonstration purposes.",
  },
  nav: {
    registration: "Patient Registration",
    scheduling: "Scheduling",
    triage: "AI Triage",
    clinician: "Clinician Dashboard",
  },
  registration: {
    title: "Register Patient",
    subtitle: "Add a new patient to the system",
    duplicateTitle: "Duplicate Detected",
    duplicateDesc:
      "A patient with this phone or email already exists. Would you like to update their record or continue registering?",
  },
  scheduling: {
    title: "Book Appointment",
    subtitle: "Search providers and schedule appointments",
  },
  triage: {
    title: "AI Triage",
    subtitle: "Symptom assessment powered by clinical AI",
    disclaimer:
      "⚠️ This is a prototype using synthetic/deterministic mock data. Not medical advice. Do not use for real clinical decisions.",
  },
  clinician: {
    title: "Clinician Dashboard",
    subtitle: "Today's schedule and AI triage outcomes",
  },
};
