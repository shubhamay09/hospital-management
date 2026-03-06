// Patient types
export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  sex: "male" | "female" | "other" | "prefer_not_to_say";
  birthDate: string;
  phone: string;
  email: string;
  address: string;
  allergies: string[];
  conditions: string[];
  medications: string[];
  createdAt: string;
}

export type PatientInput = Omit<Patient, "id" | "createdAt">;

// Provider types
export interface Provider {
  id: string;
  name: string;
  specialty: string;
  locations: string[];
  slots: string[];
}

// Appointment types
export type AppointmentStatus = "Scheduled" | "Completed" | "Cancelled";
export type AppointmentChannel = "in_person" | "video" | "phone";

export interface Appointment {
  id: string;
  patientId: string;
  providerId: string;
  start: string;
  reason: string;
  channel: AppointmentChannel;
  status: AppointmentStatus;
  createdAt: string;
  patientName?: string;
  providerName?: string;
  specialty?: string;
}

export interface AppointmentInput {
  patientId: string;
  providerId: string;
  start: string;
  reason: string;
  channel: AppointmentChannel;
}

// Triage types
export interface Vitals {
  tempC?: number;
  hr?: number;
  bp?: string;
  spo2?: number;
}

export interface TriageInput {
  symptoms: string;
  vitals: Vitals;
  onsetDays: number;
  age: number;
  sex: string;
}

export interface TriageResult {
  triage: { urgency: "Low" | "Medium" | "High" | "Critical"; confidence: number };
  differentials: Array<{ condition: string; confidence: number }>;
  guidance: string[];
  explanation: string;
}

// Diagnostics types
export interface DiagnosticsInput {
  type: string;
  fileRef: string;
}

export interface DiagnosticsResult {
  summary: string;
  confidence: number;
  flags: string[];
  nextSteps: string[];
}

// API response types
export interface ApiError {
  error: string;
  code?: string;
}
