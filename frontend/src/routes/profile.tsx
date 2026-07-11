import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import {
  User,
  MapPin,
  Calendar,
  ShieldCheck,
  Mail,
  ShieldAlert,
  ChevronLeft,
  Loader2,
  Camera,
  Check,
  Eye,
  EyeOff,
  KeyRound,
  History,
  LogOut,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth";
import { useTranslation } from "@/lib/language";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { BottomNav } from "@/components/bottom-nav";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [{ title: "My Profile — Healthbox" }],
  }),
  component: ProfilePage,
});

const STATES: Record<string, string[]> = {
  Bihar: ["Patna", "Gaya", "Muzaffarpur", "Bhagalpur"],
  "Uttar Pradesh": ["Lucknow", "Varanasi", "Gorakhpur", "Prayagraj"],
  Rajasthan: ["Jaipur", "Jodhpur", "Udaipur", "Kota"],
  "Madhya Pradesh": ["Bhopal", "Indore", "Gwalior", "Jabalpur"],
  Maharashtra: ["Pune", "Nagpur", "Nashik", "Aurangabad"],
};

const GENDERS = [
  { value: "Male", label: "Male" },
  { value: "Female", label: "Female" },
  { value: "Other", label: "Other" },
  { value: "Prefer not to say", label: "Prefer not to say" },
];

const ROLES = [
  { value: "Patient", label: "Patient" },
  { value: "Doctor", label: "Doctor" },
  { value: "Admin", label: "Admin" },
];

function ProfilePage() {
  const { user, isAuthenticated, isLoading, logout, updateProfile } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate({ to: "/login" });
    }
  }, [isLoading, isAuthenticated, navigate]);

  // Form states
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [stateValue, setStateValue] = useState("");
  const [cityValue, setCityValue] = useState("");
  const [age, setAge] = useState(30);
  const [gender, setGender] = useState("");
  const [hasAyushman, setHasAyushman] = useState(false);
  const [cardNumber, setCardNumber] = useState("");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Patient");

  // Form interaction states
  const [saving, setSaving] = useState(false);
  const [showMaskedCard, setShowMaskedCard] = useState(true);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Populate form states once user is loaded
  useEffect(() => {
    if (user) {
      setName(user.name || user.full_name || "");
      setMobile(user.mobile_number || user.phone_number || "");
      setStateValue(user.state || "");
      setCityValue(user.city || user.district || "");
      setAge(user.age ?? 30);
      setGender(user.gender || "Prefer not to say");
      setHasAyushman(user.has_aayushman_card ?? user.has_ayushman ?? false);
      setCardNumber(user.aayushman_card_number || user.ayushman_card_number || "");
      setProfileImage(user.profile_image || null);
      setEmail(user.email || "");
      setRole(user.role || "Patient");
    }
  }, [user]);

  // Handle State change (reset city selection)
  const handleStateChange = (val: string) => {
    setStateValue(val);
    const citiesForState = STATES[val] || [];
    setCityValue(citiesForState[0] || "");
  };

  // Convert uploaded image to resized base64
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Resize to maximum 250x250 pixels for light firestore documents
        const canvas = document.createElement("canvas");
        const max_size = 250;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > max_size) {
            height *= max_size / width;
            width = max_size;
          }
        } else {
          if (height > max_size) {
            width *= max_size / height;
            height = max_size;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const base64Resized = canvas.toDataURL("image/jpeg", 0.7);
          setProfileImage(base64Resized);
          toast.success("Profile photo updated in preview.");
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Format Card Number (adds spaces every 4 digits)
  const formatCardNumberDisplay = (raw: string) => {
    const digits = raw.replace(/\D/g, "");
    if (showMaskedCard) {
      const masked = digits.slice(0, -4).replace(/./g, "•") + digits.slice(-4);
      return masked.replace(/(.{4})/g, "$1 ").trim();
    }
    return digits.replace(/(.{4})/g, "$1 ").trim();
  };

  // Handle Save
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validations
    if (!name.trim()) {
      toast.error("Full Name is required.");
      return;
    }
    if (mobile.length !== 10 || !/^\d+$/.test(mobile)) {
      toast.error("Mobile Number must be exactly 10 digits.");
      return;
    }
    if (!stateValue || !cityValue) {
      toast.error("Please select both State and City.");
      return;
    }
    if (age < 0 || age > 120) {
      toast.error("Age must be between 0 and 120.");
      return;
    }
    if (hasAyushman && (!cardNumber.trim() || cardNumber.replace(/\s/g, "").length < 6)) {
      toast.error("Please enter a valid Ayushman Card Number.");
      return;
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    setSaving(true);
    try {
      await updateProfile({
        name: name.trim(),
        mobile_number: mobile,
        state: stateValue,
        city: cityValue,
        age: Number(age),
        gender,
        has_aayushman_card: hasAyushman,
        aayushman_card_number: hasAyushman ? cardNumber.replace(/\s/g, "") : null,
        profile_image: profileImage,
        email: email.trim() || null,
        role: role,
      });
      toast.success("Profile saved successfully! 🎉");
    } catch (err) {
      const error = err as { detail?: string; message?: string };
      toast.error(error.detail || error.message || "Failed to update profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Handle Logout
  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Logged out successfully.");
      navigate({ to: "/login" });
    } catch {
      toast.error("Failed to log out. Please try again.");
    }
  };

  // Format member since date
  const getMemberSince = () => {
    if (!user?.created_at) return "July 2026";
    try {
      const dt = new Date(user.created_at);
      return dt.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    } catch {
      return "July 2026";
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-dvh bg-muted/30 pb-28">
      <div className="mx-auto w-full max-w-md bg-background min-h-dvh shadow-lg flex flex-col">
        {/* Header navigation bar */}
        <header className="sticky top-0 z-20 flex h-14 items-center gap-4 border-b bg-background px-4">
          <Link
            to="/home"
            className="flex h-9 w-9 items-center justify-center rounded-xl border hover:bg-muted"
          >
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-lg font-bold text-foreground">Edit Account Profile</h1>
        </header>

        {/* Profile page form */}
        <form onSubmit={handleSave} className="flex-1 p-5 space-y-6">
          {/* PROFILE HEADER SECTION */}
          <div className="flex flex-col items-center justify-center py-4 text-center bg-gradient-to-b from-primary/5 via-transparent to-transparent rounded-3xl border border-border/40 p-4">
            <div className="relative group">
              <span className="relative flex h-24 w-24 shrink-0 overflow-hidden rounded-full border-4 border-background shadow-xl ring-2 ring-primary/20 bg-muted">
                {profileImage ? (
                  <img
                    src={profileImage}
                    alt={name}
                    className="aspect-square h-full w-full object-cover"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center rounded-full bg-primary/10 text-primary font-black text-3xl">
                    {name ? name.charAt(0).toUpperCase() : <User className="h-10 w-10" />}
                  </span>
                )}
              </span>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 grid h-8 w-8 place-items-center rounded-full bg-primary text-primary-foreground shadow-md transition hover:scale-105 active:scale-95"
                title="Change profile photo"
              >
                <Camera className="h-4 w-4" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </div>

            <h2 className="mt-3 text-xl font-extrabold text-foreground">
              {name || "User Profile"}
            </h2>
            <div className="mt-1 flex items-center justify-center gap-2">
              <Badge className="bg-primary/10 text-primary border-none text-xs px-2.5 py-0.5 hover:bg-primary/20">
                {role}
              </Badge>
              <span className="text-xs text-muted-foreground">
                • Member since {getMemberSince()}
              </span>
            </div>
          </div>

          {/* PERSONAL INFORMATION */}
          <div className="space-y-4 rounded-3xl border-2 border-border/40 bg-card p-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2">
              <User className="h-4 w-4" /> Personal Information
            </h3>

            <div className="space-y-2">
              <Label htmlFor="fullname">Full Name</Label>
              <Input
                id="fullname"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter full name"
                className="rounded-xl h-11 border-border/60 focus-visible:ring-primary"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mobile">Mobile Number</Label>
              <div className="flex h-11 w-full items-center overflow-hidden rounded-xl border border-border/60 bg-card focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
                <span className="flex h-full items-center border-r bg-muted/80 px-3 text-sm font-semibold text-muted-foreground select-none">
                  +91
                </span>
                <input
                  id="mobile"
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  placeholder="00000 00000"
                  className="h-full flex-1 bg-transparent px-3 text-base font-semibold tracking-wider text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>State</Label>
                <Select value={stateValue} onValueChange={handleStateChange}>
                  <SelectTrigger className="h-11 rounded-xl border-border/60">
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(STATES).map((st) => (
                      <SelectItem key={st} value={st}>
                        {st}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>City / District</Label>
                <Select value={cityValue} onValueChange={setCityValue} disabled={!stateValue}>
                  <SelectTrigger className="h-11 rounded-xl border-border/60">
                    <SelectValue placeholder={stateValue ? "Select city" : "Choose state"} />
                  </SelectTrigger>
                  <SelectContent>
                    {(STATES[stateValue] ?? []).map((ct) => (
                      <SelectItem key={ct} value={ct}>
                        {ct}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>Age</Label>
                <span className="text-sm font-bold text-primary">{age} years</span>
              </div>
              <div className="pt-2 px-1">
                <Slider
                  value={[age]}
                  min={0}
                  max={120}
                  step={1}
                  onValueChange={(v) => setAge(v[0])}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Gender / Sex</Label>
              <Select value={gender} onValueChange={setGender}>
                <SelectTrigger className="h-11 rounded-xl border-border/60">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  {GENDERS.map((g) => (
                    <SelectItem key={g.value} value={g.value}>
                      {g.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground/60" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email address"
                  className="pl-10 rounded-xl h-11 border-border/60 focus-visible:ring-primary"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>User Account Role</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger className="h-11 rounded-xl border-border/60">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* HEALTHCARE INFORMATION */}
          <div className="space-y-4 rounded-3xl border-2 border-border/40 bg-card p-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-secondary flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-secondary" /> Healthcare Information
            </h3>

            <div className="flex items-center justify-between rounded-xl border p-4 bg-muted/20">
              <div className="space-y-0.5 pr-2">
                <Label htmlFor="ayushman-toggle" className="text-base font-bold cursor-pointer">
                  Ayushman Bharat Card
                </Label>
                <p className="text-xs text-muted-foreground">
                  Tick this if you hold a PM-JAY Ayushman Card benefits.
                </p>
              </div>
              <Switch id="ayushman-toggle" checked={hasAyushman} onCheckedChange={setHasAyushman} />
            </div>

            {hasAyushman && (
              <div className="space-y-3 rounded-xl border border-dashed border-secondary/40 p-4 bg-secondary/5 animate-fade-in">
                <Label htmlFor="ayushman-card-number">Aayushman Card Number</Label>
                <div className="relative">
                  <Input
                    id="ayushman-card-number"
                    value={
                      showMaskedCard
                        ? formatCardNumberDisplay(cardNumber)
                        : cardNumber
                            .replace(/\s/g, "")
                            .replace(/(.{4})/g, "$1 ")
                            .trim()
                    }
                    onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, "").slice(0, 16))}
                    placeholder="0000 0000 0000 0000"
                    className="rounded-xl h-11 border-border/60 tracking-wider text-base font-bold pr-10 focus-visible:ring-secondary"
                  />
                  <button
                    type="button"
                    onClick={() => setShowMaskedCard(!showMaskedCard)}
                    className="absolute right-3 top-3 text-muted-foreground/60 hover:text-foreground"
                  >
                    {showMaskedCard ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* SECURITY SECTION */}
          <div className="space-y-4 rounded-3xl border-2 border-border/40 bg-card p-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-amber-500 flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-amber-500" /> Security & Session
            </h3>

            {/* Login Activity logs */}
            <div className="space-y-3 rounded-xl border border-border/60 p-4">
              <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground tracking-wider uppercase mb-1">
                <History className="h-3.5 w-3.5" /> Recent Login Activity
              </div>

              <div className="space-y-3 divide-y divide-border/40 text-sm">
                <div className="flex justify-between items-start pt-0">
                  <div>
                    <span className="font-bold block text-foreground">Android Device (Active)</span>
                    <span className="text-xs text-muted-foreground block">
                      App Login • New Delhi, India
                    </span>
                  </div>
                  <Badge
                    variant="outline"
                    className="text-[10px] text-emerald-600 bg-emerald-50 border-emerald-200"
                  >
                    This Device
                  </Badge>
                </div>

                <div className="flex justify-between items-start pt-3">
                  <div>
                    <span className="font-bold block text-muted-foreground">Chrome Browser</span>
                    <span className="text-xs text-muted-foreground block">
                      2 hours ago • Mumbai, India
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* DANGER ZONE */}
          <div className="space-y-4 rounded-3xl border-2 border-destructive/20 bg-destructive/5 p-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-destructive flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-destructive" /> Danger Zone
            </h3>

            <Button
              type="button"
              variant="destructive"
              onClick={() => setShowLogoutDialog(true)}
              className="w-full h-11 rounded-xl font-bold flex gap-2 active:scale-95 shadow-md shadow-destructive/10"
            >
              <LogOut className="h-4 w-4" /> Log Out Account
            </Button>
          </div>

          {/* FORM ACTIONS */}
          <div className="pt-2">
            <Button
              type="submit"
              disabled={saving}
              className="w-full h-14 rounded-2xl text-lg font-bold shadow-xl active:scale-[0.98] transition-all"
            >
              {saving ? (
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
              ) : (
                <Check className="h-5 w-5 mr-2" />
              )}
              Save Profile Changes
            </Button>
          </div>
        </form>

        {/* BOTTOM NAV BAR */}
        <BottomNav />
      </div>

      {/* CONFIRMATION LOGOUT DIALOG */}
      <Dialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <DialogContent className="max-w-xs rounded-2xl p-5">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-center">Confirm Log Out</DialogTitle>
            <DialogDescription className="text-center text-sm text-muted-foreground">
              Are you sure you want to log out of Healthbox? You will need to verify your OTP code
              to sign back in.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="grid grid-cols-2 gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setShowLogoutDialog(false)}
              className="rounded-xl h-11"
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleLogout} className="rounded-xl h-11">
              Log Out
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
