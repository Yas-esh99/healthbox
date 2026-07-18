/**
 * Clinical validation helpers for patient vitals and age characteristics.
 */

export interface FormErrors {
  age?: string;
  temp?: string;
  heartRate?: string;
  spo2?: string;
  bp?: string;
}

export interface FormValues {
  age: string;
  temp: string;
  heartRate: string;
  spo2: string;
  bp: string;
}

/**
 * Validates patient age (required, 0-120 years).
 */
export const validateAge = (val: string): string | undefined => {
  const trimmed = val.trim();
  if (!trimmed) {
    return "Age is required";
  }
  const num = Number(trimmed);
  if (isNaN(num) || !Number.isInteger(num)) {
    return "Age must be a valid integer";
  }
  if (num < 0 || num > 120) {
    return "Age must be between 0 and 120 years";
  }
  return undefined;
};

/**
 * Validates body temperature (optional, 30-45 °C or 86-113 °F).
 */
export const validateTemp = (val: string): string | undefined => {
  const trimmed = val.trim();
  if (!trimmed) {
    return undefined; // Optional field
  }
  const num = Number(trimmed);
  if (isNaN(num)) {
    return "Temperature must be a valid number";
  }

  // Accept either Celsius (30-45) or Fahrenheit (86-113)
  const isC = num >= 30 && num <= 45;
  const isF = num >= 86 && num <= 113;
  if (!isC && !isF) {
    return "Temperature must be 30–45°C or 86–113°F";
  }
  return undefined;
};

/**
 * Validates heart rate (optional, 30-220 bpm).
 */
export const validateHeartRate = (val: string): string | undefined => {
  const trimmed = val.trim();
  if (!trimmed) {
    return undefined; // Optional field
  }
  const num = Number(trimmed);
  if (isNaN(num) || !Number.isInteger(num)) {
    return "Heart rate must be a valid integer";
  }
  if (num < 30 || num > 220) {
    return "Heart rate must be between 30 and 220 BPM";
  }
  return undefined;
};

/**
 * Validates oxygen saturation SpO2 (optional, 50-100%).
 */
export const validateSpo2 = (val: string): string | undefined => {
  const trimmed = val.trim();
  if (!trimmed) {
    return undefined; // Optional field
  }
  const num = Number(trimmed);
  if (isNaN(num)) {
    return "SpO2 must be a valid number";
  }
  if (num < 50 || num > 100) {
    return "SpO2 must be between 50% and 100%";
  }
  return undefined;
};

/**
 * Validates blood pressure (optional, format Systolic/Diastolic).
 * Systolic range: 60-250 mmHg, Diastolic range: 40-150 mmHg.
 */
export const validateBp = (val: string): string | undefined => {
  const trimmed = val.trim();
  if (!trimmed) {
    return undefined; // Optional field
  }

  const match = trimmed.match(/^(\d+)\s*\/\s*(\d+)$/);
  if (!match) {
    return "Format must be Systolic/Diastolic (e.g., 120/80)";
  }

  const systolic = parseInt(match[1], 10);
  const diastolic = parseInt(match[2], 10);

  if (systolic < 60 || systolic > 250) {
    return "Systolic BP must be between 60 and 250 mmHg";
  }
  if (diastolic < 40 || diastolic > 150) {
    return "Diastolic BP must be between 40 and 150 mmHg";
  }
  return undefined;
};

/**
 * Validates all form values and returns an errors object.
 */
export const validateForm = (values: FormValues): FormErrors => {
  const errors: FormErrors = {};

  const ageErr = validateAge(values.age);
  if (ageErr) errors.age = ageErr;

  const tempErr = validateTemp(values.temp);
  if (tempErr) errors.temp = tempErr;

  const hrErr = validateHeartRate(values.heartRate);
  if (hrErr) errors.heartRate = hrErr;

  const spo2Err = validateSpo2(values.spo2);
  if (spo2Err) errors.spo2 = spo2Err;

  const bpErr = validateBp(values.bp);
  if (bpErr) errors.bp = bpErr;

  return errors;
};
