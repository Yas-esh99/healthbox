## Goal

Build the entry layer (Language → Login) of the rural healthcare app using the design system from the blueprint. Mobile-first, large tap targets, icon-forward, no passwords.

## Design tokens (src/styles.css)

Add semantic tokens (oklch) mapped via `@theme inline`:

- `--primary` Deep Trust Blue `#1E3A8A`
- `--secondary` Healing Green `#10B981`
- `--destructive` Emergency Red `#EF4444`
- `--background` Off-white `#F8FAFC`
- `--foreground` near-black for high contrast
- Large radius token for chunky buttons (`--radius: 1rem`)
- Base font-size bumped (body text-lg) for low-literacy readability

## Routes (TanStack Start, file-based)

```
src/routes/
  index.tsx            -> redirects to /language (or shows language picker)
  language.tsx         -> Language selection
  login.tsx            -> Phone + Get OTP
```

- `index.tsx` uses `Navigate` to `/language` (entry flow).
- All routes set their own `head()` metadata.
- A simple `LanguageProvider` (React context + localStorage) stores the selected language code so future screens can read it. No i18n library yet — store the choice only; copy stays English for now with native-script labels on the picker.

## Screen 1 — Language Selection (`/language`)

- Full-height off-white background, centered content, safe-area padding.
- Small top label: "Select Language / भाषा चुनें".
- 2×2 grid of giant buttons (min-h ~ 7rem, rounded-2xl, border-2, shadow):
  - English — "English"
  - Hindi — "हिन्दी"
  - Gujarati — "ગુજરાતી"
  - Marathi — "मराठी"
- Each button: large native-script word (text-3xl) + smaller English label underneath + Languages icon accent.
- Selected state: filled `bg-primary text-primary-foreground`.
- Bottom sticky "Continue" button (`bg-primary`, h-14, text-xl) → navigates to `/login`. Disabled until a language is picked.

## Screen 2 — Login (`/login`)

- No header chrome. Just a back chevron top-left to `/language`.
- Hero: Phone icon (lucide `Smartphone`) in a blue circle, large.
- Title: "Enter your mobile number" (text-2xl, bold).
- Sub: "We will send a 6-digit OTP" (muted).
- Input row: fixed `+91` prefix chip + large numeric input (h-16, text-2xl tracking-wider, `inputMode="numeric"`, `maxLength={10}`, digits-only filter).
- Helper text shows count `X / 10`.
- "Get OTP" button — full-width, h-16, `bg-primary`, text-xl, disabled until exactly 10 digits. On click: toast "OTP sent" (sonner) — actual OTP flow deferred (no backend yet).
- Footer fine print: "By continuing you agree to Terms & Privacy".

## Components / libs

- Use existing shadcn `Button`, `Input`, `Toaster` (sonner).
- lucide icons: `Languages`, `Smartphone`, `ArrowRight`, `ChevronLeft`.
- No new packages.

## Out of scope (later prompts)

- OTP verification screen, Home hub, SOS button, AI triage, schemes, camps, chatbot, real i18n translation of body copy, backend/auth.

## Technical notes

- Semantic tokens only — no hardcoded hex in components.
- All interactive elements min 56px tall for one-handed use.
- `LanguageProvider` wraps `<Outlet />` in `__root.tsx` inside the QueryClientProvider.
