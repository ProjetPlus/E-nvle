export const normalizePhone = (value: string) => value.replace(/[^+\d]/g, "").replace(/^00/, "+");

export const isValidPhone = (value: string) => /^\+?\d{8,15}$/.test(normalizePhone(value));

export const phoneToDisplayName = (value: string) => {
  const phone = normalizePhone(value);
  return phone ? `Utilisateur ${phone.slice(-4)}` : "Utilisateur";
};
