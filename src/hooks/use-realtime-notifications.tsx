import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { playNotificationSound } from "@/lib/sounds";
import type { Notification } from "@/components/envle/NotificationCenter";

type AddNotification = (notification: Notification) => void;

const timeNow = () => new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

const showBrowserNotification = (title: string, body: string) => {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  navigator.serviceWorker?.ready
    .then((registration) => registration.showNotification(title, { body, icon: "/logo-envle.png", badge: "/logo-envle.png" }))
    .catch(() => new Notification(title, { body, icon: "/logo-envle.png" }));
};

export const useRealtimeNotifications = (userId: string | undefined, addNotification: AddNotification) => {
  const addRef = useRef(addNotification);
  addRef.current = addNotification;
  useEffect(() => {
    if (!userId) return;
    const addNotification = (n: Notification) => addRef.current(n);
    const sound = localStorage.getItem("envle-notification-sound") || "default";

    const loadNotifications = async () => {
      const { data } = await supabase.from("notifications").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(50);
      (data || []).reverse().forEach((n) => addNotification({ id: n.id, type: (n.type as Notification["type"]) || "system", title: n.title, body: n.body || "", time: n.created_at ? new Date(n.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : timeNow(), read: !!n.is_read, icon: n.icon || "🔔" }));
    };
    void loadNotifications();
    const channel = supabase
      .channel(`envle-realtime-${userId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` }, (payload) => {
        const n = payload.new as { id: string; title?: string; body?: string; type?: string; icon?: string; created_at?: string; is_read?: boolean };
        const notification: Notification = {
          id: n.id,
          type: (n.type as Notification["type"]) || "system",
          title: n.title || "Notification",
          body: n.body || "",
          time: n.created_at ? new Date(n.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : timeNow(),
          read: !!n.is_read,
          icon: n.icon || "🔔",
        };
        addNotification(notification);
        playNotificationSound(sound);
        showBrowserNotification(notification.title, notification.body);
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "calls", filter: `callee_id=eq.${userId}` }, (payload) => {
        const call = payload.new as { id: string; call_type?: string; status?: string };
        const body = call.call_type === "video" ? "Appel vidéo entrant" : "Appel audio entrant";
        addNotification({ id: `call-${call.id}`, type: "call", title: "Appel entrant", body, time: timeNow(), read: false, icon: "📞" });
        playNotificationSound(localStorage.getItem("envle-ringtone") || "incoming");
        showBrowserNotification("Appel entrant", body);
        toast.info(`📞 ${body}`);
      })
      .subscribe();

    const refreshOnVisible = () => {
      if (document.visibilityState === "visible") void loadNotifications();
    };
    const fallbackPoll = window.setInterval(() => void loadNotifications(), 15_000);
    document.addEventListener("visibilitychange", refreshOnVisible);

    return () => {
      window.clearInterval(fallbackPoll);
      document.removeEventListener("visibilitychange", refreshOnVisible);
      supabase.removeChannel(channel);
    };
  }, [userId]);
};
