const API_BASE_URL =
  typeof window !== "undefined"
    ? `http://${window.location.hostname}:8000/api/v1`
    : "http://localhost:8000/api/v1";

export class ApiError extends Error {
  status: number;
  detail: string;

  constructor(status: number, detail: string) {
    super(detail || `API Request failed with status ${status}`);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;

  const headers = new Headers(options.headers);
  if (options.body && !(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: "include", // Required to send/receive HTTPOnly cookies
  });

  if (!response.ok) {
    let errorDetail = "";
    try {
      const data = await response.json();
      errorDetail = data.detail || data.message || "";
    } catch {
      // Non-JSON error response
    }
    throw new ApiError(response.status, errorDetail);
  }

  // Handle empty or 204 No Content responses
  if (response.status === 204) {
    return null as unknown as T;
  }

  try {
    return await response.json();
  } catch (err) {
    throw new Error("Failed to parse response JSON");
  }
}

// --- Directory Interfaces ---

export interface Scheme {
  id: string;
  name: string;
  description: string;
  coverageLimit: string;
  targetDemographic: string;
  benefits: string[];
  eligibleCategories: string[];
  requiredDocuments: string[];

  // New Firestore fields
  type?: string;
  diseases_covered?: string[];
  scheme_logo?: string;
  documents_required?: string[];
  website_link?: string;
  eligibility?: string[];
  details?: string;
}

export interface Hospital {
  id: string;
  name: string;
  address: string;
  number: string;
  rating: number;
  beds_available: number;
  emergency_24x7: boolean;
  is_govt: boolean;
  ayushman_active: boolean;
  google_map_direction_link: string;
  all_disease_it_cures: string[];

  // New Firestore fields
  hospital_name?: string;
  type?: string;
  hospital_image?: string;
  years_of_care?: string;
  google_review_ratings?: number;
  file_charges_for_primary_checkup?: number;
  whatsapp_number?: string;
  open?: string;
  descriptions?: {
    total_staff_with_higher_qualification?: string;
    appointment_time?: string;
    medical_services?: string[];
    doctors_details?: Array<{
      name?: string;
      specialization?: string;
      qualification?: string;
      experience?: string;
    }>;
    specialists_department?: { services?: string[] };
    doctor_availability?: string;
  };
  main_doctors?: Array<{
    name?: string;
    qualifications?: string;
    years_of_experience?: number;
  }>;
  mobile_number?: string;
  address_details?: {
    location?: string;
    pincode?: string;
    google_map_direction_link?: string;
  };
  about_hospital?: {
    facility?: string[];
    room_quality?: Array<{
      room_type?: string;
      amenities?: string[];
      bed_charges_per_day?: number;
    }>;
  };
  services?: {
    all_machine?: boolean;
    ambulance?: boolean;
    experties?: string[];
    disease_names?: Array<{
      disease_name?: string;
      treatment_price?: number;
    }>;
  };
  email?: string;
}

export interface Medicine {
  name: string;
  price: number;
  inStock: boolean;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface Pharmacy {
  id: string;
  name: string;
  address: string;
  contact: string;
  isPremium: boolean;
  coordinates?: Coordinates | null;
  medicines: Medicine[];

  // New Firestore fields
  pharmacy_name?: string;
  pharmacist_name?: string;
  open_and_close_time?: string;
  mobile_number?: string;
  whatsapp_number?: string;
  email?: string;
  google_review_ratings?: number;
  address_details?: {
    location?: string;
    pincode?: string;
  };
  description?: {
    delivery_service?: {
      is_available?: boolean;
      terms?: string;
    };
    billing_discount_percentage?: number;
    pharmacist_details?: {
      name?: string;
      qualification?: string;
      experience_in_years?: number;
    };
    inventory?: Array<{
      medicine_name?: string;
      price?: number;
      stock_availability?: boolean;
    }>;
    types_of_medicine_available?: string[];
    total_staff?: number;
  };
  services?: {
    medical_and_general_store?: boolean;
    delivery?: boolean;
    pharmacist_consultation?: boolean;
  };
}

// --- Fetch Functions ---

export async function fetchHospitals(): Promise<Hospital[]> {
  return apiFetch<Hospital[]>("/hospitals");
}

export async function fetchPharmacies(): Promise<Pharmacy[]> {
  return apiFetch<Pharmacy[]>("/pharmacies");
}

export async function fetchSchemes(): Promise<Scheme[]> {
  return apiFetch<Scheme[]>("/schemes");
}

export async function fetchStates(): Promise<string[]> {
  return apiFetch<string[]>("/location/states");
}

export async function fetchCities(state: string): Promise<string[]> {
  return apiFetch<string[]>(`/location/cities?state=${encodeURIComponent(state)}`);
}

export interface HeatmapDataPoint {
  state: string;
  district: string;
  disease: string;
  cases_count: number;
}

export async function fetchHeatmap(disease?: string): Promise<HeatmapDataPoint[]> {
  const query = disease ? `?disease=${encodeURIComponent(disease)}` : "";
  return apiFetch<HeatmapDataPoint[]>(`/records/heatmap${query}`);
}
