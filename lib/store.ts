import type { Patient, Provider, Appointment } from "@/types";

// ── Patients ────────────────────────────────────────────────────────────────
const patients: Patient[] = [
  {
    id: "pat_001",
    firstName: "Asha",
    lastName: "Rao",
    sex: "female",
    birthDate: "1989-05-12",
    phone: "+91-9876543210",
    email: "asha.rao@example.com",
    address: "Bengaluru, Karnataka",
    allergies: ["penicillin"],
    conditions: ["hypertension"],
    medications: ["amlodipine"],
    createdAt: "2026-01-15T09:30:00Z",
  },
  {
    id: "pat_002",
    firstName: "Rohan",
    lastName: "Mehta",
    sex: "male",
    birthDate: "1995-11-23",
    phone: "+91-9123456789",
    email: "rohan.mehta@example.com",
    address: "Mumbai, Maharashtra",
    allergies: [],
    conditions: ["diabetes type 2"],
    medications: ["metformin"],
    createdAt: "2026-01-20T11:00:00Z",
  },
];

// ── Providers ────────────────────────────────────────────────────────────────
const BASE_DATE = new Date("2026-03-07T00:00:00Z");
function slots(offsetDays: number, times: string[]): string[] {
  return times.map((t) => {
    const d = new Date(BASE_DATE);
    d.setDate(d.getDate() + offsetDays);
    const [h, m] = t.split(":").map(Number);
    d.setUTCHours(h, m, 0, 0);
    return d.toISOString();
  });
}

const providers: Provider[] = [
  {
    id: "prov_101",
    name: "Dr. Priya Sharma",
    specialty: "General Medicine",
    locations: ["Bengaluru"],
    slots: [
      ...slots(0, ["06:00", "06:30", "07:00", "07:30", "08:00"]),
      ...slots(1, ["06:00", "06:30", "07:00"]),
      ...slots(2, ["08:00", "08:30", "09:00"]),
    ],
  },
  {
    id: "prov_102",
    name: "Dr. Arjun K",
    specialty: "General Medicine",
    locations: ["Bengaluru"],
    slots: [
      ...slots(0, ["09:00", "09:30", "10:00", "10:30"]),
      ...slots(1, ["09:00", "09:30", "10:00"]),
      ...slots(3, ["07:00", "07:30", "08:00"]),
    ],
  },
  {
    id: "prov_201",
    name: "Dr. Meera Krishnan",
    specialty: "Cardiology",
    locations: ["Bengaluru", "Chennai"],
    slots: [
      ...slots(1, ["05:30", "06:00", "06:30"]),
      ...slots(4, ["05:30", "06:00"]),
    ],
  },
  {
    id: "prov_301",
    name: "Dr. Vikram Nair",
    specialty: "Pediatrics",
    locations: ["Bengaluru"],
    slots: [
      ...slots(0, ["04:30", "05:00", "05:30", "06:00"]),
      ...slots(2, ["04:30", "05:00"]),
    ],
  },
  {
    id: "prov_401",
    name: "Dr. Sunita Desai",
    specialty: "Dermatology",
    locations: ["Mumbai", "Bengaluru"],
    slots: [
      ...slots(2, ["06:30", "07:00", "07:30"]),
      ...slots(5, ["06:00", "06:30"]),
    ],
  },
  {
    id: "prov_501",
    name: "Dr. Rajesh Iyer",
    specialty: "Orthopedics",
    locations: ["Chennai"],
    slots: [
      ...slots(1, ["07:30", "08:00", "08:30"]),
      ...slots(3, ["07:30", "08:00"]),
    ],
  },
];

// ── Appointments ─────────────────────────────────────────────────────────────
const appointments: Appointment[] = [
  {
    id: "appt_9001",
    patientId: "pat_001",
    providerId: "prov_102",
    start: slots(0, ["09:00"])[0],
    reason: "Fever and sore throat",
    channel: "in_person",
    status: "Scheduled",
    createdAt: "2026-03-04T10:00:00Z",
    patientName: "Asha Rao",
    providerName: "Dr. Arjun K",
    specialty: "General Medicine",
  },
  {
    id: "appt_9002",
    patientId: "pat_002",
    providerId: "prov_201",
    start: slots(-1, ["05:30"])[0],
    reason: "Chest pain follow-up",
    channel: "video",
    status: "Completed",
    createdAt: "2026-03-01T08:00:00Z",
    patientName: "Rohan Mehta",
    providerName: "Dr. Meera Krishnan",
    specialty: "Cardiology",
  },
];

let patientCounter = 3;
let appointmentCounter = 9003;

// ── Store API ─────────────────────────────────────────────────────────────────
export const store = {
  // Patients
  getPatients: () => [...patients],
  getPatientById: (id: string) => patients.find((p) => p.id === id),
  findDuplicate: (phone: string, email: string) =>
    patients.find((p) => p.phone === phone || p.email === email),
  addPatient: (data: Omit<Patient, "id" | "createdAt">): Patient => {
    const patient: Patient = {
      ...data,
      id: `pat_${String(patientCounter++).padStart(3, "0")}`,
      createdAt: new Date().toISOString(),
    };
    patients.push(patient);
    return patient;
  },

  // Providers
  getProviders: (specialty?: string, name?: string) => {
    let result = [...providers];
    if (specialty) {
      result = result.filter((p) =>
        p.specialty.toLowerCase().includes(specialty.toLowerCase())
      );
    }
    if (name) {
      result = result.filter((p) =>
        p.name.toLowerCase().includes(name.toLowerCase())
      );
    }
    return result;
  },
  getProviderById: (id: string) => providers.find((p) => p.id === id),
  getAllSpecialties: () => [...new Set(providers.map((p) => p.specialty))].sort(),

  // Appointments
  getAppointments: (filters?: {
    patientId?: string;
    providerId?: string;
    status?: string;
    date?: string;
  }) => {
    let result = [...appointments];
    if (filters?.patientId)
      result = result.filter((a) => a.patientId === filters.patientId);
    if (filters?.providerId)
      result = result.filter((a) => a.providerId === filters.providerId);
    if (filters?.status)
      result = result.filter((a) => a.status === filters.status);
    if (filters?.date) {
      result = result.filter((a) => a.start.startsWith(filters.date!));
    }
    return result.sort(
      (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
    );
  },
  getAppointmentById: (id: string) => appointments.find((a) => a.id === id),
  addAppointment: (
    data: Omit<Appointment, "id" | "status" | "createdAt" | "patientName" | "providerName" | "specialty">
  ): Appointment => {
    const patient = patients.find((p) => p.id === data.patientId);
    const provider = providers.find((p) => p.id === data.providerId);
    const appt: Appointment = {
      ...data,
      id: `appt_${appointmentCounter++}`,
      status: "Scheduled",
      createdAt: new Date().toISOString(),
      patientName: patient ? `${patient.firstName} ${patient.lastName}` : undefined,
      providerName: provider?.name,
      specialty: provider?.specialty,
    };
    appointments.push(appt);
    return appt;
  },
  updateAppointment: (
    id: string,
    updates: Partial<Pick<Appointment, "status" | "start">>
  ): Appointment | null => {
    const idx = appointments.findIndex((a) => a.id === id);
    if (idx === -1) return null;
    appointments[idx] = { ...appointments[idx], ...updates };
    return appointments[idx];
  },
};
