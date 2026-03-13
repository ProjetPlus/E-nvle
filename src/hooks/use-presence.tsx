import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type UserStatus = "online" | "away" | "busy" | "offline";

interface PresenceState {
  user_id: string;
  status: UserStatus;
  last_seen: string;
}

export const usePresence = (userId: string | null) => {
  const [onlineUsers, setOnlineUsers] = useState<Record<string, PresenceState>>({});

  useEffect(() => {
    if (!userId) return;

    const channel = supabase.channel("presence-room", {
      config: { presence: { key: userId } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState<PresenceState>();
        const users: Record<string, PresenceState> = {};
        Object.entries(state).forEach(([key, presences]) => {
          if (presences && presences.length > 0) {
            users[key] = presences[0] as PresenceState;
          }
        });
        setOnlineUsers(users);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({
            user_id: userId,
            status: "online" as UserStatus,
            last_seen: new Date().toISOString(),
          });
        }
      });

    return () => {
      channel.unsubscribe();
    };
  }, [userId]);

  const setStatus = useCallback(
    async (status: UserStatus) => {
      if (!userId) return;
      await supabase
        .from("profiles")
        .update({ status, last_seen: new Date().toISOString() })
        .eq("id", userId);
    },
    [userId]
  );

  const getUserStatus = useCallback(
    (uid: string): UserStatus => {
      return onlineUsers[uid]?.status || "offline";
    },
    [onlineUsers]
  );

  return { onlineUsers, setStatus, getUserStatus };
};

export const StatusIndicator = ({ status, size = "sm" }: { status: UserStatus; size?: "sm" | "md" | "lg" }) => {
  const sizeClasses = {
    sm: "w-3 h-3",
    md: "w-3.5 h-3.5",
    lg: "w-4 h-4",
  };

  const colorMap: Record<UserStatus, string> = {
    online: "bg-green-500",
    away: "bg-yellow-500",
    busy: "bg-red-500",
    offline: "bg-gray-500",
  };

  if (status === "offline") return null;

  return (
    <span
      className={`absolute bottom-0 right-0 ${sizeClasses[size]} rounded-full ${colorMap[status]} border-2 border-envle-card`}
      style={
        status === "online"
          ? { animation: "pulse-status 2s ease-in-out infinite" }
          : undefined
      }
    />
  );
};
