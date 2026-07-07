const defaultIceServers: RTCIceServer[] = [
  { urls: ["stun:stun.l.google.com:19302", "stun:global.stun.twilio.com:3478"] },
];

export const getIceServers = (databaseConfig?: unknown): RTCIceServer[] => {
  const fromDb = databaseConfig && typeof databaseConfig === "object" && "iceServers" in databaseConfig
    ? (databaseConfig as { iceServers?: RTCIceServer[] }).iceServers
    : undefined;
  const servers = Array.isArray(fromDb) && fromDb.length ? [...fromDb] : [...defaultIceServers];
  const turnUrl = import.meta.env.VITE_TURN_URL as string | undefined;
  if (turnUrl) {
    servers.push({
      urls: turnUrl.split(",").map((url) => url.trim()).filter(Boolean),
      username: (import.meta.env.VITE_TURN_USERNAME as string | undefined) || undefined,
      credential: (import.meta.env.VITE_TURN_CREDENTIAL as string | undefined) || undefined,
    });
  }
  return servers;
};

export const safeRtcDescription = (description: RTCSessionDescriptionInit) => ({
  type: description.type,
  sdp: description.sdp,
});
