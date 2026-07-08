# Finalisation E'nvlé One — Corrections & Modules Manquants

## Objectif
Livrer une build stable, sans erreurs TypeScript, avec tous les flux critiques opérationnels pour un déploiement production immédiat.

## 1. Corrections Build (priorité 1)
- Lancer `tsgo` pour lister toutes les erreurs restantes après la dernière migration.
- Corriger les typages `never` restants dans `ChatArea.tsx`, `ConversationPanel.tsx`, `BoutiqueModule.tsx`, `CallModal.tsx` en alignant avec `src/integrations/supabase/types.ts` régénéré.
- Vérifier imports cassés (`CallModal`, hooks, `webrtc.ts`).

## 2. Authentification & Session (WhatsApp-like)
- Garantir persistance session (localStorage Supabase) — pas de re-affichage du formulaire après reload.
- Redirection stricte : non-authentifié → AuthModal ; authentifié + `profile_completed=false` → page profil obligatoire ; sinon → app.
- Corriger `use-auth.tsx` pour attendre `getSession()` avant de rendre l'app (évite flash de login).

## 3. Profil complet
- Boutons upload visibles pour photo profil ET couverture.
- Email = champ vide par défaut (retirer email déterministe côté UI).
- Ville + Profession obligatoires ; Bio optionnel.
- Auto-traitement image (déjà `image-processing.ts`) : détection visage pour profil, recadrage couverture sans déformation, ajustement lumière.
- Sauvegarde brouillon locale (localStorage) tant que non validé.

## 4. CRUD & Realtime
- Vérifier que chaque module (conversations, messages, stories, produits, jobs, communities, wallet) utilise bien `supabase.from(...)` avec les types corrects.
- Brancher Realtime sur `messages`, `call_signals`, `stories`, `notifications`, `profiles` (présence).

## 5. Présence
- Hook `usePresence` : update `profiles.last_seen` + `is_online` via heartbeat + `onbeforeunload`.
- Afficher badge connecté / "vu à HH:MM" partout (Sidebar contacts, ChatArea header, ConversationPanel).

## 6. Appels (WebRTC réel)
- Vérifier signalisation via `call_signals` (offer/answer/ice).
- Sons distincts : sonnerie entrante (loop), tonalité sortante custom.
- États UI : "Ça sonne…", "En cours", "Injoignable" (timeout 30s sans réponse).
- Boutons mute audio / toggle vidéo fonctionnels sur tracks locales.
- Filtres vidéo temps réel (luminosité/contraste/netteté) via CSS filter sur `<video>`.
- Protection capture écran (`user-select:none` + détection visibilitychange).

## 7. Découverte contacts
- `ContactDiscoveryModal` : import répertoire (Contact Picker API) OU saisie manuelle.
- Normalisation E.164 → match sur `profiles.searchable_phone`.
- Badge logo E'nvlé miniature sur contacts inscrits.
- Recherche par nom/numéro dans le même champ.

## 8. Stories, Chaînes, Lives
- Stories 24h : upload + expiration auto (déjà table `stories`).
- Repartage avec/sans avis (table `shares` existante).
- Chaînes = réutiliser `communities` avec type `channel`.
- Lives = extension `stories` avec `is_live=true` + WebRTC broadcast + réactions temps réel (`reactions` table) + demande participation via `call_signals`.

## 9. Branding
- Retirer toutes mentions "WhatsApp", "comme X" dans l'UI publique.
- Corriger contraste texte logo E'nvlé selon thème (dark: or, light: vert foncé).
- Bouton profil header : avatar utilisateur si présent, sinon icône E'nvlé ; menu déroulant (Changer numéro, Paramètres, Déconnexion).

## 10. Vérification finale
- `tsgo` clean.
- Test E2E `tests/envle-critical-flows.spec.ts` : inscription → profil → conversation → appel.
- Smoke test Playwright sur preview localhost.

## Détails techniques
- Aucune nouvelle migration SQL nécessaire (schéma déjà en place).
- Aucun nouveau secret requis (TURN via env vars existantes).
- Modules IA avancés (auto-réponse pages pro) = REPORTÉ au prochain tour, tel que demandé précédemment.

## Hors scope de ce tour
- Réponse automatique IA pages pro (reporté explicitement par l'utilisateur).
- Nouveaux providers de paiement.
