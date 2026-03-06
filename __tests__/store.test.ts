import { calculateAge, formatDate, cn } from "@/lib/utils";
import { store } from "@/lib/store";

// ── Utility tests ─────────────────────────────────────────────────────────────
describe("calculateAge", () => {
  it("returns correct age for a past birthdate", () => {
    const dob = "1990-01-01";
    const age = calculateAge(dob);
    expect(age).toBeGreaterThanOrEqual(35);
    expect(typeof age).toBe("number");
  });

  it("returns 0 for today", () => {
    const today = new Date().toISOString().split("T")[0];
    expect(calculateAge(today)).toBe(0);
  });
});

describe("cn (classname merge)", () => {
  it("merges tailwind classes correctly", () => {
    expect(cn("p-4", "p-2")).toBe("p-2");
  });
  it("handles falsy values", () => {
    expect(cn("a", false && "b", undefined, "c")).toBe("a c");
  });
});

describe("formatDate", () => {
  it("formats ISO string to readable date", () => {
    const result = formatDate("2026-03-07T09:00:00Z");
    expect(result).toContain("2026");
  });
  it("handles invalid input gracefully", () => {
    expect(() => formatDate("not-a-date")).not.toThrow();
  });
});

// ── Store tests ───────────────────────────────────────────────────────────────
describe("store - patients", () => {
  it("returns initial seed patients", () => {
    const patients = store.getPatients();
    expect(patients.length).toBeGreaterThanOrEqual(2);
  });

  it("finds patient by id", () => {
    const p = store.getPatientById("pat_001");
    expect(p).toBeDefined();
    expect(p?.firstName).toBe("Asha");
  });

  it("detects duplicate by email", () => {
    const dup = store.findDuplicate("+99-0000000000", "asha.rao@example.com");
    expect(dup).toBeDefined();
  });

  it("detects duplicate by phone", () => {
    const dup = store.findDuplicate("+91-9876543210", "notexist@example.com");
    expect(dup).toBeDefined();
  });

  it("adds a new patient and returns it", () => {
    const before = store.getPatients().length;
    const newPatient = store.addPatient({
      firstName: "Test",
      lastName: "User",
      sex: "male",
      birthDate: "2000-06-15",
      phone: "+91-9000000001",
      email: "test.user.unique@example.com",
      address: "Delhi",
      allergies: [],
      conditions: [],
      medications: [],
    });
    expect(newPatient.id).toBeTruthy();
    expect(store.getPatients().length).toBe(before + 1);
  });

  it("returns null for unknown patient id", () => {
    expect(store.getPatientById("pat_999")).toBeUndefined();
  });
});

describe("store - providers", () => {
  it("returns all providers when no filter", () => {
    const providers = store.getProviders();
    expect(providers.length).toBeGreaterThan(0);
  });

  it("filters by specialty (case-insensitive)", () => {
    const providers = store.getProviders("cardiology");
    expect(providers.every((p) => p.specialty.toLowerCase().includes("cardiology"))).toBe(true);
  });

  it("filters by name", () => {
    const providers = store.getProviders(undefined, "Priya");
    expect(providers.some((p) => p.name.includes("Priya"))).toBe(true);
  });

  it("returns unique specialties", () => {
    const specs = store.getAllSpecialties();
    expect(new Set(specs).size).toBe(specs.length);
  });
});

describe("store - appointments", () => {
  it("returns seed appointments", () => {
    const appts = store.getAppointments();
    expect(appts.length).toBeGreaterThanOrEqual(1);
  });

  it("filters by patientId", () => {
    const appts = store.getAppointments({ patientId: "pat_001" });
    expect(appts.every((a) => a.patientId === "pat_001")).toBe(true);
  });

  it("filters by status", () => {
    const scheduled = store.getAppointments({ status: "Scheduled" });
    expect(scheduled.every((a) => a.status === "Scheduled")).toBe(true);
  });

  it("adds appointment and returns with id", () => {
    const appt = store.addAppointment({
      patientId: "pat_001",
      providerId: "prov_101",
      start: new Date().toISOString(),
      reason: "Test visit",
      channel: "video",
    });
    expect(appt.id).toMatch(/^appt_/);
    expect(appt.status).toBe("Scheduled");
  });

  it("cancels an appointment", () => {
    const appts = store.getAppointments({ status: "Scheduled" });
    const id = appts[0]?.id;
    if (id) {
      const updated = store.updateAppointment(id, { status: "Cancelled" });
      expect(updated?.status).toBe("Cancelled");
    }
  });

  it("returns null for unknown appointment update", () => {
    expect(store.updateAppointment("appt_nonexistent", { status: "Cancelled" })).toBeNull();
  });
});
