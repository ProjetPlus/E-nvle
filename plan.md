# Plan de migration Supabase — E'nvlé One

> **Instructions** : exécute ce SQL manuellement dans le SQL Editor Supabase.
> Il est **idempotent** (utilise `IF NOT EXISTS`, `ON CONFLICT`, `DROP POLICY IF EXISTS`) et complète le schéma existant sans casser les données.

---

## 1. SQL complet à exécuter

```sql
-- =====================================================================
-- E'nvlé One — Migration complète (idempotente)
-- Couvre : colonnes manquantes, RLS, GRANTs, storage, realtime,
--          messages éphémères, verrouillage conversations, présence,
--          réactions, vues, commentaires, partages, stickers, devises.
-- =====================================================================

-- ---------- 0. Extensions ----------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ---------- 1. Rôles applicatifs ----------
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin','moderator','user');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'user',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id=_user_id AND role=_role);
$$;

DROP POLICY IF EXISTS "roles_self_read" ON public.user_roles;
CREATE POLICY "roles_self_read" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());

-- ---------- 2. Colonnes ajoutées ----------

-- Profiles : préférences, verrouillage app, langue, devise
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS username text UNIQUE,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'online',
  ADD COLUMN IF NOT EXISTS language text DEFAULT 'fr',
  ADD COLUMN IF NOT EXISTS currency text DEFAULT 'XOF',
  ADD COLUMN IF NOT EXISTS theme text DEFAULT 'dark',
  ADD COLUMN IF NOT EXISTS app_lock_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS app_lock_hash text,
  ADD COLUMN IF NOT EXISTS app_lock_method text DEFAULT 'password',
  ADD COLUMN IF NOT EXISTS notification_sound text DEFAULT 'default',
  ADD COLUMN IF NOT EXISTS ringtone text DEFAULT 'default',
  ADD COLUMN IF NOT EXISTS push_enabled boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS last_seen timestamptz DEFAULT now();

-- Conversations : éphémère, verrouillage, épinglé, silencieux
ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS ephemeral_ttl integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_locked boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS lock_hash text,
  ADD COLUMN IF NOT EXISTS lock_method text DEFAULT 'password',
  ADD COLUMN IF NOT EXISTS e2ee_enabled boolean DEFAULT false;

-- Conversation members : notifications, épinglage, statut lu
ALTER TABLE public.conversation_members
  ADD COLUMN IF NOT EXISTS muted boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS pinned boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_read_at timestamptz DEFAULT now();

-- Messages : édition, réactions, disparition, transfert
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS edited_at timestamptz,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS forwarded_from uuid REFERENCES public.messages(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reactions jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS delivered_to uuid[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS read_by uuid[] DEFAULT '{}';

-- Calls : contrôles participants
ALTER TABLE public.calls
  ADD COLUMN IF NOT EXISTS participants jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS is_group boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS quality_mode text DEFAULT 'auto',
  ADD COLUMN IF NOT EXISTS recording_url text;

-- Products : compteurs
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS views integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS likes integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS shares integer DEFAULT 0;

-- Stories : compteurs, réactions
ALTER TABLE public.stories
  ADD COLUMN IF NOT EXISTS views_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reactions jsonb DEFAULT '{}'::jsonb;

-- Jobs : compteurs candidatures
ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS views integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS applications_count integer DEFAULT 0;

-- Notifications : action, données
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS action_url text,
  ADD COLUMN IF NOT EXISTS data jsonb DEFAULT '{}'::jsonb;

-- ---------- 3. Nouvelles tables ----------

-- Commentaires (produits, stories, jobs, communautés)
CREATE TABLE IF NOT EXISTS public.comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,          -- 'product' | 'story' | 'job' | 'community' | 'call'
  entity_id uuid NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  parent_id uuid REFERENCES public.comments(id) ON DELETE CASCADE,
  reactions jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
GRANT SELECT ON public.comments TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.comments TO authenticated;
GRANT ALL ON public.comments TO service_role;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "comments_read_all" ON public.comments;
CREATE POLICY "comments_read_all" ON public.comments FOR SELECT USING (true);
DROP POLICY IF EXISTS "comments_insert_own" ON public.comments;
CREATE POLICY "comments_insert_own" ON public.comments FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "comments_modify_own" ON public.comments;
CREATE POLICY "comments_modify_own" ON public.comments FOR UPDATE TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS "comments_delete_own" ON public.comments;
CREATE POLICY "comments_delete_own" ON public.comments FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Réactions génériques
CREATE TABLE IF NOT EXISTS public.reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(entity_type, entity_id, user_id, emoji)
);
GRANT SELECT ON public.reactions TO anon;
GRANT SELECT, INSERT, DELETE ON public.reactions TO authenticated;
GRANT ALL ON public.reactions TO service_role;
ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "reactions_read" ON public.reactions;
CREATE POLICY "reactions_read" ON public.reactions FOR SELECT USING (true);
DROP POLICY IF EXISTS "reactions_own" ON public.reactions;
CREATE POLICY "reactions_own" ON public.reactions FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Partages
CREATE TABLE IF NOT EXISTS public.shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  channel text,
  created_at timestamptz DEFAULT now()
);
GRANT SELECT, INSERT ON public.shares TO authenticated;
GRANT ALL ON public.shares TO service_role;
ALTER TABLE public.shares ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "shares_insert" ON public.shares;
CREATE POLICY "shares_insert" ON public.shares FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "shares_read" ON public.shares;
CREATE POLICY "shares_read" ON public.shares FOR SELECT TO authenticated USING (true);

-- Contacts / amis
CREATE TABLE IF NOT EXISTS public.contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text DEFAULT 'accepted',
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, contact_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contacts TO authenticated;
GRANT ALL ON public.contacts TO service_role;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "contacts_own" ON public.contacts;
CREATE POLICY "contacts_own" ON public.contacts FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Devises (Afrique de l'Ouest + internationales)
CREATE TABLE IF NOT EXISTS public.currencies (
  code text PRIMARY KEY,
  name text NOT NULL,
  symbol text NOT NULL,
  country text,
  rate_to_xof numeric DEFAULT 1,
  is_active boolean DEFAULT true
);
GRANT SELECT ON public.currencies TO anon, authenticated;
GRANT ALL ON public.currencies TO service_role;
ALTER TABLE public.currencies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "currencies_read" ON public.currencies;
CREATE POLICY "currencies_read" ON public.currencies FOR SELECT USING (true);

INSERT INTO public.currencies(code,name,symbol,country,rate_to_xof) VALUES
  ('XOF','Franc CFA BCEAO','FCFA','UEMOA',1),
  ('XAF','Franc CFA BEAC','FCFA','CEMAC',1),
  ('NGN','Naira nigérian','₦','Nigeria',0.72),
  ('GHS','Cedi ghanéen','₵','Ghana',52),
  ('GMD','Dalasi','D','Gambie',8.7),
  ('GNF','Franc guinéen','FG','Guinée',0.068),
  ('LRD','Dollar libérien','L$','Libéria',3.2),
  ('SLL','Leone','Le','Sierra Leone',0.027),
  ('MRU','Ouguiya','UM','Mauritanie',15),
  ('CVE','Escudo','$','Cap-Vert',5.5),
  ('USD','Dollar US','$','International',608),
  ('EUR','Euro','€','International',655.957),
  ('GBP','Livre sterling','£','International',770),
  ('CNY','Yuan','¥','Chine',84),
  ('CAD','Dollar canadien','C$','Canada',445)
ON CONFLICT (code) DO NOTHING;

-- Push subscriptions
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint text NOT NULL UNIQUE,
  p256dh text,
  auth text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.push_subscriptions TO authenticated;
GRANT ALL ON public.push_subscriptions TO service_role;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "push_own" ON public.push_subscriptions;
CREATE POLICY "push_own" ON public.push_subscriptions FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ---------- 4. Fonction sécurisée d'appartenance ----------
CREATE OR REPLACE FUNCTION public.is_conversation_member(_conv uuid, _user uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS(SELECT 1 FROM public.conversation_members WHERE conversation_id=_conv AND user_id=_user);
$$;

-- ---------- 5. RLS complètes (remplace policies existantes) ----------

-- Profiles : lecture publique, écriture soi
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "profiles_read_all" ON public.profiles;
CREATE POLICY "profiles_read_all" ON public.profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "profiles_insert_self" ON public.profiles;
CREATE POLICY "profiles_insert_self" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
DROP POLICY IF EXISTS "profiles_update_self" ON public.profiles;
CREATE POLICY "profiles_update_self" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- Conversations : membre seulement
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "conv_member_read" ON public.conversations;
CREATE POLICY "conv_member_read" ON public.conversations FOR SELECT TO authenticated USING (public.is_conversation_member(id, auth.uid()));
DROP POLICY IF EXISTS "conv_create" ON public.conversations;
CREATE POLICY "conv_create" ON public.conversations FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());
DROP POLICY IF EXISTS "conv_update_creator" ON public.conversations;
CREATE POLICY "conv_update_creator" ON public.conversations FOR UPDATE TO authenticated USING (created_by = auth.uid());
DROP POLICY IF EXISTS "conv_delete_creator" ON public.conversations;
CREATE POLICY "conv_delete_creator" ON public.conversations FOR DELETE TO authenticated USING (created_by = auth.uid());

-- Conversation members
ALTER TABLE public.conversation_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cm_read" ON public.conversation_members;
CREATE POLICY "cm_read" ON public.conversation_members FOR SELECT TO authenticated USING (public.is_conversation_member(conversation_id, auth.uid()));
DROP POLICY IF EXISTS "cm_insert" ON public.conversation_members;
CREATE POLICY "cm_insert" ON public.conversation_members FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() OR public.is_conversation_member(conversation_id, auth.uid()));
DROP POLICY IF EXISTS "cm_update_self" ON public.conversation_members;
CREATE POLICY "cm_update_self" ON public.conversation_members FOR UPDATE TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS "cm_delete_self" ON public.conversation_members;
CREATE POLICY "cm_delete_self" ON public.conversation_members FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "msg_read" ON public.messages;
CREATE POLICY "msg_read" ON public.messages FOR SELECT TO authenticated USING (public.is_conversation_member(conversation_id, auth.uid()));
DROP POLICY IF EXISTS "msg_send" ON public.messages;
CREATE POLICY "msg_send" ON public.messages FOR INSERT TO authenticated WITH CHECK (sender_id = auth.uid() AND public.is_conversation_member(conversation_id, auth.uid()));
DROP POLICY IF EXISTS "msg_update_own" ON public.messages;
CREATE POLICY "msg_update_own" ON public.messages FOR UPDATE TO authenticated USING (sender_id = auth.uid());
DROP POLICY IF EXISTS "msg_delete_own" ON public.messages;
CREATE POLICY "msg_delete_own" ON public.messages FOR DELETE TO authenticated USING (sender_id = auth.uid());

-- Calls
ALTER TABLE public.calls ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "calls_participant" ON public.calls;
CREATE POLICY "calls_participant" ON public.calls FOR SELECT TO authenticated USING (caller_id = auth.uid() OR callee_id = auth.uid());
DROP POLICY IF EXISTS "calls_create" ON public.calls;
CREATE POLICY "calls_create" ON public.calls FOR INSERT TO authenticated WITH CHECK (caller_id = auth.uid());
DROP POLICY IF EXISTS "calls_update" ON public.calls;
CREATE POLICY "calls_update" ON public.calls FOR UPDATE TO authenticated USING (caller_id = auth.uid() OR callee_id = auth.uid());

-- Communities
ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "com_read" ON public.communities;
CREATE POLICY "com_read" ON public.communities FOR SELECT USING (is_public = true OR created_by = auth.uid());
DROP POLICY IF EXISTS "com_create" ON public.communities;
CREATE POLICY "com_create" ON public.communities FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());
DROP POLICY IF EXISTS "com_modify" ON public.communities;
CREATE POLICY "com_modify" ON public.communities FOR UPDATE TO authenticated USING (created_by = auth.uid());
DROP POLICY IF EXISTS "com_delete" ON public.communities;
CREATE POLICY "com_delete" ON public.communities FOR DELETE TO authenticated USING (created_by = auth.uid());

ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "com_mem_all" ON public.community_members;
CREATE POLICY "com_mem_all" ON public.community_members FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "com_mem_read" ON public.community_members;
CREATE POLICY "com_mem_read" ON public.community_members FOR SELECT USING (true);

-- Products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "prod_read" ON public.products;
CREATE POLICY "prod_read" ON public.products FOR SELECT USING (true);
DROP POLICY IF EXISTS "prod_create" ON public.products;
CREATE POLICY "prod_create" ON public.products FOR INSERT TO authenticated WITH CHECK (seller_id = auth.uid());
DROP POLICY IF EXISTS "prod_update" ON public.products;
CREATE POLICY "prod_update" ON public.products FOR UPDATE TO authenticated USING (seller_id = auth.uid());
DROP POLICY IF EXISTS "prod_delete" ON public.products;
CREATE POLICY "prod_delete" ON public.products FOR DELETE TO authenticated USING (seller_id = auth.uid());

-- Orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "orders_own" ON public.orders;
CREATE POLICY "orders_own" ON public.orders FOR ALL TO authenticated USING (buyer_id = auth.uid()) WITH CHECK (buyer_id = auth.uid());

-- Jobs
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "jobs_read" ON public.jobs;
CREATE POLICY "jobs_read" ON public.jobs FOR SELECT USING (true);
DROP POLICY IF EXISTS "jobs_create" ON public.jobs;
CREATE POLICY "jobs_create" ON public.jobs FOR INSERT TO authenticated WITH CHECK (posted_by = auth.uid());
DROP POLICY IF EXISTS "jobs_update" ON public.jobs;
CREATE POLICY "jobs_update" ON public.jobs FOR UPDATE TO authenticated USING (posted_by = auth.uid());
DROP POLICY IF EXISTS "jobs_delete" ON public.jobs;
CREATE POLICY "jobs_delete" ON public.jobs FOR DELETE TO authenticated USING (posted_by = auth.uid());

-- Stories
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "stories_read" ON public.stories;
CREATE POLICY "stories_read" ON public.stories FOR SELECT USING (true);
DROP POLICY IF EXISTS "stories_own" ON public.stories;
CREATE POLICY "stories_own" ON public.stories FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

ALTER TABLE public.story_views ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "sv_own" ON public.story_views;
CREATE POLICY "sv_own" ON public.story_views FOR ALL TO authenticated USING (viewer_id = auth.uid()) WITH CHECK (viewer_id = auth.uid());

-- Wallet
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "wallet_own" ON public.wallet_transactions;
CREATE POLICY "wallet_own" ON public.wallet_transactions FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "notif_own" ON public.notifications;
CREATE POLICY "notif_own" ON public.notifications FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- User devices
ALTER TABLE public.user_devices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "dev_own" ON public.user_devices;
CREATE POLICY "dev_own" ON public.user_devices FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ---------- 6. GRANTs de sécurité (redondants mais garantis) ----------
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.profiles TO anon, authenticated;
GRANT INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.conversations, public.conversation_members, public.messages, public.calls, public.communities, public.community_members, public.products, public.orders, public.jobs, public.stories, public.story_views, public.wallet_transactions, public.notifications, public.user_devices TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- ---------- 7. Storage buckets ----------
INSERT INTO storage.buckets (id, name, public) VALUES
  ('avatars','avatars',true),
  ('chat-files','chat-files',true),
  ('stories','stories',true),
  ('products','products',true),
  ('community','community',true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies (public read + authenticated upload/manage own)
DROP POLICY IF EXISTS "public_read_all_buckets" ON storage.objects;
CREATE POLICY "public_read_all_buckets" ON storage.objects FOR SELECT USING (bucket_id IN ('avatars','chat-files','stories','products','community'));

DROP POLICY IF EXISTS "auth_upload_all" ON storage.objects;
CREATE POLICY "auth_upload_all" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id IN ('avatars','chat-files','stories','products','community'));

DROP POLICY IF EXISTS "auth_update_own" ON storage.objects;
CREATE POLICY "auth_update_own" ON storage.objects FOR UPDATE TO authenticated USING (owner = auth.uid());

DROP POLICY IF EXISTS "auth_delete_own" ON storage.objects;
CREATE POLICY "auth_delete_own" ON storage.objects FOR DELETE TO authenticated USING (owner = auth.uid());

-- ---------- 8. Realtime ----------
DO $$ BEGIN
  PERFORM 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND tablename='messages';
  IF NOT FOUND THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.messages, public.conversations, public.conversation_members, public.calls, public.notifications, public.stories, public.comments, public.reactions';
  END IF;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.conversations REPLICA IDENTITY FULL;
ALTER TABLE public.calls REPLICA IDENTITY FULL;

-- ---------- 9. Triggers utilitaires ----------

-- Nettoyage messages éphémères
CREATE OR REPLACE FUNCTION public.cleanup_ephemeral_messages()
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  DELETE FROM public.messages WHERE expires_at IS NOT NULL AND expires_at < now();
$$;

-- Auto-set expires_at selon ephemeral_ttl de la conversation
CREATE OR REPLACE FUNCTION public.set_message_expiry()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_ttl int;
BEGIN
  SELECT ephemeral_ttl INTO v_ttl FROM public.conversations WHERE id = NEW.conversation_id;
  IF v_ttl > 0 THEN NEW.expires_at := now() + (v_ttl || ' seconds')::interval; END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_msg_expiry ON public.messages;
CREATE TRIGGER trg_msg_expiry BEFORE INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.set_message_expiry();

-- updated_at auto
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

DROP TRIGGER IF EXISTS trg_conv_touch ON public.conversations;
CREATE TRIGGER trg_conv_touch BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ---------- 10. Handle new user (garde-fou) ----------
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================================
-- FIN
-- =====================================================================
```

---

## 2. Patch SQL final — sessions, WebRTC, conversations, éphémère

> À exécuter manuellement après le SQL principal si ce n'est pas déjà fait. N'exécute aucun secret côté client.

```sql
-- E'nvlé One — patch final routage/session/conversations/appels
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Profils retrouvables durablement, avec email facultatif côté UI
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS cover_url text,
  ADD COLUMN IF NOT EXISTS profile_completed boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS searchable_phone text,
  ADD COLUMN IF NOT EXISTS notification_sound text DEFAULT 'default',
  ADD COLUMN IF NOT EXISTS ringtone text DEFAULT 'incoming',
  ADD COLUMN IF NOT EXISTS push_enabled boolean DEFAULT true;

GRANT SELECT ON public.profiles TO anon, authenticated;
GRANT INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

CREATE OR REPLACE FUNCTION public.set_profile_completion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  NEW.profile_completed := (
    coalesce(trim(NEW.full_name), '') <> ''
    AND coalesce(trim(NEW.phone), '') <> ''
    AND coalesce(trim(NEW.location), '') <> ''
    AND coalesce(trim(NEW.profession), '') <> ''
    AND coalesce(trim(NEW.avatar_url), '') <> ''
    AND coalesce(trim(NEW.cover_url), '') <> ''
  );
  NEW.searchable_phone := regexp_replace(coalesce(NEW.phone, ''), '[^+0-9]', '', 'g');
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_completion ON public.profiles;
CREATE TRIGGER trg_profiles_completion
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_profile_completion();

CREATE INDEX IF NOT EXISTS profiles_searchable_phone_idx ON public.profiles(searchable_phone);
CREATE INDEX IF NOT EXISTS profiles_name_phone_idx ON public.profiles(full_name, phone);

-- Appareils : 1 actif par défaut, ajout second appareil via QR côté UI
CREATE TABLE IF NOT EXISTS public.user_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_name text NOT NULL,
  device_type text DEFAULT 'desktop',
  is_current boolean DEFAULT false,
  last_active timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_devices TO authenticated;
GRANT ALL ON public.user_devices TO service_role;
ALTER TABLE public.user_devices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS dev_own ON public.user_devices;
CREATE POLICY dev_own ON public.user_devices FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE UNIQUE INDEX IF NOT EXISTS user_devices_one_current_idx ON public.user_devices(user_id) WHERE is_current = true;

-- Conversations/messages : CRUD réel + éphémère
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS ephemeral_ttl integer DEFAULT 0;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS expires_at timestamptz;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.conversations, public.conversation_members, public.messages, public.contacts TO authenticated;
GRANT ALL ON public.conversations, public.conversation_members, public.messages, public.contacts TO service_role;

CREATE OR REPLACE FUNCTION public.is_conversation_member(_conv uuid, _user uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS(SELECT 1 FROM public.conversation_members WHERE conversation_id = _conv AND user_id = _user);
$$;

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS conv_member_read ON public.conversations;
CREATE POLICY conv_member_read ON public.conversations FOR SELECT TO authenticated USING (public.is_conversation_member(id, auth.uid()));
DROP POLICY IF EXISTS conv_create ON public.conversations;
CREATE POLICY conv_create ON public.conversations FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());
DROP POLICY IF EXISTS conv_update_member ON public.conversations;
CREATE POLICY conv_update_member ON public.conversations FOR UPDATE TO authenticated USING (public.is_conversation_member(id, auth.uid())) WITH CHECK (public.is_conversation_member(id, auth.uid()));

DROP POLICY IF EXISTS cm_read ON public.conversation_members;
CREATE POLICY cm_read ON public.conversation_members FOR SELECT TO authenticated USING (public.is_conversation_member(conversation_id, auth.uid()));
DROP POLICY IF EXISTS cm_insert ON public.conversation_members;
CREATE POLICY cm_insert ON public.conversation_members FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() OR public.is_conversation_member(conversation_id, auth.uid()));
DROP POLICY IF EXISTS cm_update_self ON public.conversation_members;
CREATE POLICY cm_update_self ON public.conversation_members FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS msg_read ON public.messages;
CREATE POLICY msg_read ON public.messages FOR SELECT TO authenticated USING (public.is_conversation_member(conversation_id, auth.uid()) AND (expires_at IS NULL OR expires_at > now()) AND deleted_at IS NULL);
DROP POLICY IF EXISTS msg_send ON public.messages;
CREATE POLICY msg_send ON public.messages FOR INSERT TO authenticated WITH CHECK (sender_id = auth.uid() AND public.is_conversation_member(conversation_id, auth.uid()));
DROP POLICY IF EXISTS msg_update_member_read ON public.messages;
CREATE POLICY msg_update_member_read ON public.messages FOR UPDATE TO authenticated USING (public.is_conversation_member(conversation_id, auth.uid())) WITH CHECK (public.is_conversation_member(conversation_id, auth.uid()));

CREATE OR REPLACE FUNCTION public.set_message_expiry()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE v_ttl int;
BEGIN
  SELECT ephemeral_ttl INTO v_ttl FROM public.conversations WHERE id = NEW.conversation_id;
  IF v_ttl > 0 AND NEW.expires_at IS NULL THEN
    NEW.expires_at := now() + (v_ttl || ' seconds')::interval;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_message_expiry ON public.messages;
CREATE TRIGGER trg_message_expiry BEFORE INSERT ON public.messages FOR EACH ROW EXECUTE FUNCTION public.set_message_expiry();

CREATE OR REPLACE FUNCTION public.cleanup_ephemeral_messages()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  DELETE FROM public.messages WHERE expires_at IS NOT NULL AND expires_at < now();
$$;

-- WebRTC : appels + signalisation temps réel
CREATE TABLE IF NOT EXISTS public.call_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id uuid NOT NULL REFERENCES public.calls(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  recipient_id uuid NOT NULL,
  signal_type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.call_signals TO authenticated;
GRANT ALL ON public.call_signals TO service_role;
ALTER TABLE public.calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_signals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS calls_participant ON public.calls;
CREATE POLICY calls_participant ON public.calls FOR SELECT TO authenticated USING (caller_id = auth.uid() OR callee_id = auth.uid());
DROP POLICY IF EXISTS calls_create ON public.calls;
CREATE POLICY calls_create ON public.calls FOR INSERT TO authenticated WITH CHECK (caller_id = auth.uid());
DROP POLICY IF EXISTS calls_update ON public.calls;
CREATE POLICY calls_update ON public.calls FOR UPDATE TO authenticated USING (caller_id = auth.uid() OR callee_id = auth.uid()) WITH CHECK (caller_id = auth.uid() OR callee_id = auth.uid());

DROP POLICY IF EXISTS call_signals_read ON public.call_signals;
CREATE POLICY call_signals_read ON public.call_signals FOR SELECT TO authenticated USING (auth.uid() = sender_id OR auth.uid() = recipient_id);
DROP POLICY IF EXISTS call_signals_insert ON public.call_signals;
CREATE POLICY call_signals_insert ON public.call_signals FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id);

DO $$
BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.user_devices; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_members; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.messages; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.calls; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.call_signals; EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;
```

---

## 2. Après exécution

1. Regénère les types TS Supabase (automatique via Lovable dès qu'une migration Lovable est appliquée, ou manuel via CLI Supabase).
2. Vérifie dans **Storage** que les 5 buckets sont créés et publics.
3. Vérifie dans **Database → Publications** que `supabase_realtime` inclut les tables listées.
4. Va dans **Authentication → Providers** → active Email + (optionnel) Google.
5. Redéploie l'app.
