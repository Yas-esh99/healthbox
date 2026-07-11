import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { apiFetch, ApiError } from "./api";

export interface UserProfile {
  id: string;
  phone_number: string;
  full_name: string;
  state: string;
  district: string;
  age: number;
  gender?: string | null;
  has_ayushman: boolean;
  ayushman_card_number?: string | null;
  conditions: string[];
  created_at: string;
  updated_at: string;

  // New recommended user fields (strict Task 9 / Task 1 compliance)
  name?: string;
  mobile_number?: string;
  city?: string;
  has_aayushman_card?: boolean;
  aayushman_card_number?: string | null;
  profile_image?: string | null;
  email?: string | null;
  role?: string | null;
}

export interface VerifyOtpResponse {
  registered: boolean;
  redirect_to: string;
  phone_number: string;
  user?: UserProfile | null;
}

export interface RegisterRequest {
  phone_number: string;
  full_name: string;
  state: string;
  district: string;
  age: number;
  gender?: string | null;
  has_ayushman: boolean;
  ayushman_card_number?: string | null;
  conditions: string[];
}

export interface SessionResponse {
  authenticated: boolean;
  user?: UserProfile | null;
}

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  pendingPhone: string | null;
  requestOtp: (phone: string) => Promise<void>;
  verifyOtp: (phone: string, code: string) => Promise<VerifyOtpResponse>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (payload: Partial<UserProfile>) => Promise<void>;
  refetchSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [pendingPhone, setPendingPhone] = useState<string | null>(null);

  const fetchSession = async () => {
    try {
      const data = await apiFetch<SessionResponse>("/auth/session");
      if (data.authenticated && data.user) {
        setUser(data.user);
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (err) {
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
  }, []);

  const requestOtp = async (phone: string) => {
    await apiFetch<{ message: string }>("/auth/request-otp", {
      method: "POST",
      body: JSON.stringify({ phone_number: phone }),
    });
    setPendingPhone(phone);
  };

  const verifyOtp = async (phone: string, code: string) => {
    const data = await apiFetch<VerifyOtpResponse>("/auth/verify-otp", {
      method: "POST",
      body: JSON.stringify({ phone_number: phone, otp_code: code }),
    });

    if (data.registered && data.user) {
      setUser(data.user);
      setIsAuthenticated(true);
      setPendingPhone(null);
    }
    return data;
  };

  const register = async (payload: RegisterRequest) => {
    const data = await apiFetch<{ user: UserProfile }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    setUser(data.user);
    setIsAuthenticated(true);
    setPendingPhone(null);
  };

  const logout = async () => {
    try {
      await apiFetch("/auth/logout", { method: "POST" });
    } catch {
      // Ignore network errors on logout
    } finally {
      // Clear all state
      setUser(null);
      setIsAuthenticated(false);
      setPendingPhone(null);
      // Clear localStorage and sessionStorage
      if (typeof window !== "undefined") {
        localStorage.clear();
        sessionStorage.clear();
      }
    }
  };

  const updateProfile = async (payload: Partial<UserProfile>) => {
    const data = await apiFetch<UserProfile>("/auth/profile", {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    setUser(data);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        pendingPhone,
        requestOtp,
        verifyOtp,
        register,
        logout,
        updateProfile,
        refetchSession: fetchSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
