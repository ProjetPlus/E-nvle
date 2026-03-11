Design system, architecture, and preferences for E'nvlé Super App

## Design System
- Fonts: Playfair Display (display), Sora (body)
- Colors: envle-vert (primary green), envle-or (gold accent), envle-rouge, envle-bleu
- Dark/Light theme via CSS class `.light` on `<html>`
- All colors use HSL CSS variables
- Logo: src/assets/envle-logo.jpg (eye+Africa design)

## Architecture
- ThemeProvider in hooks/use-theme.tsx
- Modules: chat, calls, stories, shop, community, jobs, map, wallet, settings
- Mobile: left sidebar slide-out (NOT bottom nav)
- AnimatePresence transitions between modules
- File sharing: auto-compression, HD enhancement, original filename preservation
- FileViewer: in-app preview for images, video, audio, PDF
- NotificationCenter: slide-in panel with badges on sidebar
- QRCodeDisplay: canvas-based QR code generator
- CreateBusinessModal: create business/job/product
- Translator: auto-translate messages between languages (fr/en/es/de/pt/ar/sw/wo)
- Settings: profile edit, language, devices (10 max), theme, QR code, privacy
- CallModal: real camera/mic via getUserMedia, screen share, conference (50 max)
- No backend yet — user plans external Supabase later

## Preferences
- No Lovable Cloud — external Supabase planned
- French UI language
- Navigation must stay on the LEFT sidebar, not bottom bar
