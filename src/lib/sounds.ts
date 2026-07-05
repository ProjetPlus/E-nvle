export const notificationSounds = [
  { id: "default", label: "Classique", frequency: 880, pattern: [0.12, 0.08, 0.12] },
  { id: "soft", label: "Doux", frequency: 660, pattern: [0.18] },
  { id: "call", label: "Appel", frequency: 740, pattern: [0.18, 0.08, 0.18, 0.08, 0.24] },
  { id: "gold", label: "Or", frequency: 990, pattern: [0.08, 0.05, 0.08, 0.05, 0.2] },
] as const;

export type NotificationSoundId = (typeof notificationSounds)[number]["id"];

export const playNotificationSound = (soundId = "default") => {
  const AudioContextCtor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextCtor) return;
  const preset = notificationSounds.find((s) => s.id === soundId) ?? notificationSounds[0];
  const ctx = new AudioContextCtor();
  let cursor = ctx.currentTime;

  preset.pattern.forEach((duration, index) => {
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = preset.frequency + index * 35;
    gain.gain.setValueAtTime(0.0001, cursor);
    gain.gain.exponentialRampToValueAtTime(0.08, cursor + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, cursor + duration);
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start(cursor);
    oscillator.stop(cursor + duration + 0.02);
    cursor += duration + 0.08;
  });

  window.setTimeout(() => void ctx.close(), Math.ceil((cursor - ctx.currentTime + 0.4) * 1000));
};
