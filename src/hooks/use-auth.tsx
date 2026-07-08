import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

export interface EnvleProfile {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  avatar_url: string | null;
  cover_url?: string | null;
  bio: string | null;
  location: string | null;
  profession: string | null;
  status: string | null;
  last_seen: string | null;
  profile_completed?: boolean | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: EnvleProfile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEVICE_ID_KEY = "envle-current-device-id";

const getDeviceId = () => {
  let id = window.localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    window.localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
};

const getDeviceLabel = () => {
  const ua = navigator.userAgent;
  const isMobile = /Android|iPhone|iPad|iPod/i.test(ua);
  const browser = /Edg/i.test(ua) ? "Edge" : /Chrome/i.test(ua) ? "Chrome" : /Safari/i.test(ua) ? "Safari" : /Firefox/i.test(ua) ? "Firefox" : "Navigateur";
  return `${browser} · ${isMobile ? "Mobile" : "Desktop"}`;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<EnvleProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (uid?: string) => {
    if (!uid) { setProfile(null); return; }
    const { data, error } = await supabase.from("profiles").select("*").eq("id", uid).maybeSingle();
    if (error) {
      setProfile(null);
      return;
    }
    setProfile((data as EnvleProfile | null) ?? null);
    if (data) {
      void supabase.from("profiles").update({ status: "online", last_seen: new Date().toISOString() }).eq("id", uid);
    }
  }, []);

  const registerCurrentDevice = useCallback((uid?: string) => {
    if (!uid) return;
    const now = new Date().toISOString();
    const deviceId = getDeviceId();
    void supabase.from("user_devices").update({ is_current: false }).eq("user_id", uid);
    void supabase.from("user_devices").upsert({
      id: deviceId,
      user_id: uid,
      device_name: getDeviceLabel(),
      device_type: /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ? "mobile" : "desktop",
      is_current: true,
      last_active: now,
    }, { onConflict: "id" });
  }, []);

  useEffect(() => {
    let mounted = true;

    const hydrate = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const { data: verified } = session ? await supabase.auth.getUser() : { data: { user: null } };
      if (!mounted) return;
      const activeUser = verified.user ?? null;
      setSession(session);
      setUser(activeUser);
      registerCurrentDevice(activeUser?.id);
      await loadProfile(activeUser?.id);
      if (mounted) setLoading(false);
    };

    void hydrate();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        const activeUser = session?.user ?? null;
        setUser(activeUser);
        registerCurrentDevice(activeUser?.id);
        setTimeout(() => void loadProfile(activeUser?.id), 0);
        setLoading(false);
      }
    );

    return () => { mounted = false; subscription.unsubscribe(); };
  }, [loadProfile, registerCurrentDevice]);

  useEffect(() => {
    if (!user?.id) return;
    const setOnline = () => {
      const now = new Date().toISOString();
      void supabase.from("profiles").update({ status: document.hidden ? "away" : "online", last_seen: now }).eq("id", user.id);
      void supabase.from("user_devices").update({ last_active: now, is_current: true }).eq("id", getDeviceId()).eq("user_id", user.id);
    };
    const setOffline = () => {
      void supabase.from("profiles").update({ status: "offline", last_seen: new Date().toISOString() }).eq("id", user.id);
      void supabase.from("user_devices").update({ is_current: false, last_active: new Date().toISOString() }).eq("id", getDeviceId()).eq("user_id", user.id);
    };
    void setOnline();
    const heartbeat = window.setInterval(setOnline, 45_000);
    document.addEventListener("visibilitychange", setOnline);
    window.addEventListener("beforeunload", setOffline);
    return () => {
      window.clearInterval(heartbeat);
      document.removeEventListener("visibilitychange", setOnline);
      window.removeEventListener("beforeunload", setOffline);
      void setOffline();
    };
  }, [user?.id]);

  const signOut = useCallback(async () => {
    if (user?.id) await supabase.from("profiles").update({ status: "offline", last_seen: new Date().toISOString() }).eq("id", user.id);
    if (user?.id) await supabase.from("user_devices").update({ is_current: false, last_active: new Date().toISOString() }).eq("id", getDeviceId()).eq("user_id", user.id);
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
  }, [user?.id]);

  const refreshProfile = useCallback(async () => {
    await loadProfile(user?.id);
  }, [loadProfile, user?.id]);

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, refreshProfile, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
