Design system, architecture, and preferences for E'nvlé Super App

## Design System
- Fonts: Playfair Display (display), Sora (body)
- Colors: envle-vert (primary green), envle-or (gold accent), envle-rouge, envle-bleu
- Dark/Light theme via CSS class `.light` on `<html>`
- All colors use HSL CSS variables
- Logo: src/assets/envle-logo.png (transparent bg, eye+Africa design)
- Signature: "Connecter. Créer. Célébrer."

## Architecture
- ThemeProvider in hooks/use-theme.tsx
- Auth: Email OTP via Supabase RPC (generate_otp/verify_otp), 5min expiry, 3 attempts/24h
- Modules: chat, calls, stories, shop, community, jobs, map, wallet, settings
- Mobile: left sidebar slide-out (NOT bottom nav)
- AnimatePresence transitions between modules
- Presence: Supabase Realtime channels, StatusIndicator component
- Database: 16 tables with permissive RLS, realtime on messages/profiles/notifications/conversations
- Storage: avatars, media, files buckets (all public)

## Preferences
- No Lovable Cloud — external Supabase (E'nvlé DB)
- French UI language
- Navigation must stay on the LEFT sidebar, not bottom bar
- All test/mock data removed
