// Auto-translation system for E'nvlé
// In production, this would call a real translation API (Google Translate, DeepL, etc.)
// For now, we simulate with a local dictionary + pattern matching

import { getAppLanguage } from "@/components/envle/SettingsModule";

const translations: Record<string, Record<string, string>> = {
  // French → English
  "fr-en": {
    "Salut": "Hi",
    "Bonjour": "Hello",
    "Merci": "Thank you",
    "Comment ça va": "How are you",
    "Oui": "Yes",
    "Non": "No",
    "S'il te plaît": "Please",
    "Au revoir": "Goodbye",
    "Je t'envoie": "I'm sending you",
    "Ok je regarde": "Ok I'll check",
    "Super": "Great",
    "Parfait": "Perfect",
    "D'accord": "Alright",
    "Bonne journée": "Have a good day",
  },
  // French → Spanish
  "fr-es": {
    "Salut": "Hola",
    "Bonjour": "Buenos días",
    "Merci": "Gracias",
    "Comment ça va": "Cómo estás",
    "Oui": "Sí",
    "Non": "No",
    "S'il te plaît": "Por favor",
    "Au revoir": "Adiós",
    "Super": "Genial",
    "Parfait": "Perfecto",
    "D'accord": "De acuerdo",
  },
  // French → German
  "fr-de": {
    "Salut": "Hallo",
    "Bonjour": "Guten Tag",
    "Merci": "Danke",
    "Comment ça va": "Wie geht's",
    "Oui": "Ja",
    "Non": "Nein",
    "S'il te plaît": "Bitte",
    "Au revoir": "Auf Wiedersehen",
    "Super": "Super",
    "Parfait": "Perfekt",
    "D'accord": "Einverstanden",
  },
};

export const translateMessage = (text: string, fromLang: string, toLang: string): string => {
  if (fromLang === toLang) return text;
  
  const dictKey = `${fromLang}-${toLang}`;
  const dict = translations[dictKey];
  if (!dict) return text; // No dictionary available

  let translated = text;
  Object.entries(dict).forEach(([src, dst]) => {
    translated = translated.replace(new RegExp(src, "gi"), dst);
  });

  return translated;
};

export const getTranslatedText = (text: string, senderLang: string = "fr"): string => {
  const appLang = getAppLanguage();
  const autoTranslate = localStorage.getItem("envle-auto-translate") !== "false";
  
  if (!autoTranslate || senderLang === appLang) return text;
  return translateMessage(text, senderLang, appLang);
};

export const shouldShowOriginal = (): boolean => {
  return localStorage.getItem("envle-auto-translate") !== "false";
};
