import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface IncomingCall {
  id: string;
  caller_id: string;
  conversation_id: string | null;
  call_type: string | null;
  status: string | null;
}

const RINGING_STATES = ["ringing", "dialing"];

/**
 * Écoute les appels entrants en temps réel (Realtime) avec repli par sondage
 * pour garantir la sonnerie même si le canal Realtime est indisponible.
 */
export const useIncomingCalls = (userId: string | undefined, onIncoming: (call: IncomingCall) => void) => {
  const handlerRef = useRef(onIncoming);
  handlerRef.current = onIncoming;
  const seenRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    seenRef.current = new Set();

    const emit = (call: IncomingCall) => {
      if (cancelled) return;
      if (!call?.id || seenRef.current.has(call.id)) return;
      if (!RINGING_STATES.includes(call.status || "")) return;
      seenRef.current.add(call.id);
      handlerRef.current(call);
    };

    const channel = supabase
      .channel(`incoming-calls-${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "calls", filter: `callee_id=eq.${userId}` },
        (payload) => emit(payload.new as IncomingCall),
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "calls", filter: `callee_id=eq.${userId}` },
        (payload) => emit(payload.new as IncomingCall),
      )
      .subscribe();

    // Repli : sondage toutes les 3s des appels en sonnerie récents
    const poll = async () => {
      const since = new Date(Date.now() - 60_000).toISOString();
      const { data } = await supabase
        .from("calls")
        .select("id, caller_id, conversation_id, call_type, status, started_at")
        .eq("callee_id", userId)
        .in("status", RINGING_STATES)
        .gte("started_at", since)
        .order("started_at", { ascending: false })
        .limit(5);
      (data || []).forEach((call) => emit(call as IncomingCall));
    };
    void poll();
    const interval = window.setInterval(() => void poll(), 3000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      window.clearTimeout(interval);
      supabase.removeChannel(channel);
    };
  }, [userId]);
};
