const API_BASE_URL = typeof window !== "undefined" 
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
  coordinates: Coordinates;
  medicines: Medicine[];
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


