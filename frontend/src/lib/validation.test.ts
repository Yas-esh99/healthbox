import { describe, it, expect } from "vitest";
import {
  validateAge,
  validateTemp,
  validateHeartRate,
  validateSpo2,
  validateBp,
} from "./validation";

describe("Age Validation Boundary Tests", () => {
  it("should accept valid age values inside the clinical range", () => {
    expect(validateAge("0")).toBeUndefined();
    expect(validateAge("1")).toBeUndefined();
    expect(validateAge("35")).toBeUndefined();
    expect(validateAge("120")).toBeUndefined();
  });

  it("should reject age values outside the clinical range", () => {
    expect(validateAge("-1")).toBe("Age must be between 0 and 120 years");
    expect(validateAge("121")).toBe("Age must be between 0 and 120 years");
  });

  it("should reject non-numeric age values", () => {
    expect(validateAge("abc")).toBe("Age must be a valid integer");
    expect(validateAge("34.5")).toBe("Age must be a valid integer");
  });

  it("should reject empty age values", () => {
    expect(validateAge("")).toBe("Age is required");
    expect(validateAge("   ")).toBe("Age is required");
  });
});

describe("Body Temperature Validation Boundary Tests", () => {
  it("should accept empty temperature (optional field)", () => {
    expect(validateTemp("")).toBeUndefined();
    expect(validateTemp("   ")).toBeUndefined();
  });

  it("should accept Celsius temperatures inside range (30-45)", () => {
    expect(validateTemp("30")).toBeUndefined();
    expect(validateTemp("37.2")).toBeUndefined();
    expect(validateTemp("45")).toBeUndefined();
  });

  it("should reject Celsius temperatures outside range", () => {
    expect(validateTemp("29.9")).toBe("Temperature must be 30–45°C or 86–113°F");
    expect(validateTemp("45.1")).toBe("Temperature must be 30–45°C or 86–113°F");
  });

  it("should accept Fahrenheit temperatures inside range (86-113)", () => {
    expect(validateTemp("86")).toBeUndefined();
    expect(validateTemp("98.6")).toBeUndefined();
    expect(validateTemp("113")).toBeUndefined();
  });

  it("should reject Fahrenheit temperatures outside range", () => {
    expect(validateTemp("85.9")).toBe("Temperature must be 30–45°C or 86–113°F");
    expect(validateTemp("113.1")).toBe("Temperature must be 30–45°C or 86–113°F");
  });

  it("should reject non-numeric temperature values", () => {
    expect(validateTemp("abc")).toBe("Temperature must be a valid number");
  });
});

describe("Heart Rate Validation Boundary Tests", () => {
  it("should accept empty heart rate (optional field)", () => {
    expect(validateHeartRate("")).toBeUndefined();
  });

  it("should accept heart rates inside range (30-220)", () => {
    expect(validateHeartRate("30")).toBeUndefined();
    expect(validateHeartRate("72")).toBeUndefined();
    expect(validateHeartRate("220")).toBeUndefined();
  });

  it("should reject heart rates outside range", () => {
    expect(validateHeartRate("29")).toBe("Heart rate must be between 30 and 220 BPM");
    expect(validateHeartRate("221")).toBe("Heart rate must be between 30 and 220 BPM");
  });

  it("should reject non-numeric heart rates", () => {
    expect(validateHeartRate("abc")).toBe("Heart rate must be a valid integer");
    expect(validateHeartRate("72.5")).toBe("Heart rate must be a valid integer");
  });
});

describe("SpO2 Validation Boundary Tests", () => {
  it("should accept empty SpO2 (optional field)", () => {
    expect(validateSpo2("")).toBeUndefined();
  });

  it("should accept SpO2 inside range (50-100)", () => {
    expect(validateSpo2("50")).toBeUndefined();
    expect(validateSpo2("98.5")).toBeUndefined();
    expect(validateSpo2("100")).toBeUndefined();
  });

  it("should reject SpO2 outside range", () => {
    expect(validateSpo2("49.9")).toBe("SpO2 must be between 50% and 100%");
    expect(validateSpo2("100.1")).toBe("SpO2 must be between 50% and 100%");
  });

  it("should reject non-numeric SpO2 values", () => {
    expect(validateSpo2("abc")).toBe("SpO2 must be a valid number");
  });
});

describe("Blood Pressure Validation Boundary Tests", () => {
  it("should accept empty Blood Pressure (optional field)", () => {
    expect(validateBp("")).toBeUndefined();
  });

  it("should accept formatted blood pressures inside range", () => {
    expect(validateBp("120/80")).toBeUndefined();
    expect(validateBp("60/40")).toBeUndefined();
    expect(validateBp("250/150")).toBeUndefined();
    expect(validateBp("120 / 80")).toBeUndefined();
  });

  it("should reject invalid format", () => {
    expect(validateBp("120")).toBe("Format must be Systolic/Diastolic (e.g., 120/80)");
    expect(validateBp("120-80")).toBe("Format must be Systolic/Diastolic (e.g., 120/80)");
    expect(validateBp("abc/def")).toBe("Format must be Systolic/Diastolic (e.g., 120/80)");
  });

  it("should reject Systolic BP outside range (60-250)", () => {
    expect(validateBp("59/80")).toBe("Systolic BP must be between 60 and 250 mmHg");
    expect(validateBp("251/80")).toBe("Systolic BP must be between 60 and 250 mmHg");
  });

  it("should reject Diastolic BP outside range (40-150)", () => {
    expect(validateBp("120/39")).toBe("Diastolic BP must be between 40 and 150 mmHg");
    expect(validateBp("120/151")).toBe("Diastolic BP must be between 40 and 150 mmHg");
  });
});
