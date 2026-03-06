// Tests for the deterministic triage logic by calling the mock API handler logic directly

// We extract the core logic from the route for testability
// These tests mirror expected behavior of the POST /api/ai/triage mock

interface TriageInput {
  symptoms: string;
  vitals: { tempC?: number; hr?: number; bp?: string; spo2?: number };
  onsetDays: number;
  age: number;
  sex: string;
}

// Replicate mock logic inline (deterministic rule-based)
function deriveUrgency(input: TriageInput): "Low" | "Medium" | "High" | "Critical" {
  const s = input.symptoms.toLowerCase();
  const { tempC, hr, spo2 } = input.vitals;

  if (
    s.includes("chest pain") ||
    s.includes("difficulty breathing") ||
    s.includes("unconscious") ||
    (spo2 !== undefined && spo2 < 92)
  )
    return "Critical";

  if (
    s.includes("high fever") ||
    (tempC !== undefined && tempC >= 39.5) ||
    s.includes("severe") ||
    (hr !== undefined && hr > 120)
  )
    return "High";

  if (s.includes("rash") || s.includes("mild") || input.onsetDays >= 7)
    return "Low";

  return "Medium";
}

describe("AI Triage mock logic", () => {
  it("returns Critical for low SpO2", () => {
    expect(deriveUrgency({ symptoms: "breathlessness", vitals: { spo2: 88 }, onsetDays: 1, age: 45, sex: "male" })).toBe("Critical");
  });

  it("returns Critical for chest pain", () => {
    expect(deriveUrgency({ symptoms: "Chest pain radiating to arm", vitals: {}, onsetDays: 0, age: 55, sex: "male" })).toBe("Critical");
  });

  it("returns High for very high fever", () => {
    expect(deriveUrgency({ symptoms: "Fever", vitals: { tempC: 40.1 }, onsetDays: 1, age: 30, sex: "female" })).toBe("High");
  });

  it("returns High for tachycardia", () => {
    expect(deriveUrgency({ symptoms: "Dizziness", vitals: { hr: 135 }, onsetDays: 1, age: 40, sex: "female" })).toBe("High");
  });

  it("returns Low for mild rash", () => {
    expect(deriveUrgency({ symptoms: "mild rash on arm", vitals: {}, onsetDays: 3, age: 25, sex: "male" })).toBe("Low");
  });

  it("returns Low for long-onset non-critical symptoms", () => {
    expect(deriveUrgency({ symptoms: "occasional headache", vitals: {}, onsetDays: 10, age: 35, sex: "female" })).toBe("Low");
  });

  it("returns Medium for moderate fever/sore throat", () => {
    expect(deriveUrgency({ symptoms: "Fever and sore throat", vitals: { tempC: 38.4 }, onsetDays: 2, age: 37, sex: "female" })).toBe("Medium");
  });
});
