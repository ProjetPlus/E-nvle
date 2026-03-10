# Memory: index.md
Updated: now

## E'nvlé App - Design & Architecture

### Design System
- Fonts: Playfair Display (display), Sora (body)
- Colors: envle-vert (primary green), envle-or (gold accent), envle-rouge, envle-bleu
- Dark/Light theme via CSS class `.light` on `<html>`
- All colors use HSL CSS variables
- Logo: src/assets/envle-logo.jpg (eye+Africa design)

### Architecture
- ThemeProvider in hooks/use-theme.tsx
- Modules: chat (default), calls, stories, shop, community, jobs, map
- Mobile: left sidebar slide-out (NOT bottom nav like WhatsApp)
- AnimatePresence transitions between modules
- File sharing: auto-compression, HD enhancement, original filename preservation
- No backend yet — user plans external Supabase later

### Preferences
- No Lovable Cloud — external Supabase planned
- French UI language
- Navigation must stay on the LEFT sidebar, not bottom bar
