import { useEffect } from "react";
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
  useEffect(() => {
    if (!userId) return;
    const sound = localStorage.getItem("envle-notification-sound") || "default";
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
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
        const message = payload.new as { id: string; sender_id?: string; content?: string; message_type?: string };
        if (message.sender_id === userId) return;
        const body = message.message_type === "audio" ? "Message vocal" : message.message_type === "image" ? "Image reçue" : message.content || "Nouveau message";
        addNotification({ id: `message-${message.id}`, type: "message", title: "Nouveau message", body, time: timeNow(), read: false, icon: "💬" });
        playNotificationSound(sound);
        showBrowserNotification("Nouveau message", body);
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

    return () => {
      supabase.removeChannel(channel);
    };
  }, [addNotification, userId]);
};
