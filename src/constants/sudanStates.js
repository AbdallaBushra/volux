export const SUDAN_STATES = [
  { en: "Khartoum", ar: "الخرطوم" },
  { en: "Al Jazirah", ar: "الجزيرة" },
  { en: "Blue Nile", ar: "النيل الأزرق" },
  { en: "Sennar", ar: "سنار" },
  { en: "White Nile", ar: "النيل الأبيض" },
  { en: "North Kordofan", ar: "شمال كردفان" },
  { en: "South Kordofan", ar: "جنوب كردفان" },
  { en: "West Kordofan", ar: "غرب كردفان" },
  { en: "North Darfur", ar: "شمال دارفور" },
  { en: "South Darfur", ar: "جنوب دارفور" },
  { en: "West Darfur", ar: "غرب دارفور" },
  { en: "Central Darfur", ar: "وسط دارفور" },
  { en: "East Darfur", ar: "شرق دارفور" },
  { en: "Kassala", ar: "كسلا" },
  { en: "Red Sea", ar: "البحر الأحمر" },
  { en: "Gedaref", ar: "القضارف" },
  { en: "River Nile", ar: "نهر النيل" },
  { en: "Northern", ar: "الشمالية" },
];

export const normalizeStateText = (value) =>
  String(value || "")
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/[^\p{L}\p{N}\s-]/gu, "");

export const getStateFromArabic = (stateAr) =>
  SUDAN_STATES.find((state) => normalizeStateText(state.ar) === normalizeStateText(stateAr)) || null;

export const getStateFromEnglish = (stateEn) =>
  SUDAN_STATES.find((state) => normalizeStateText(state.en) === normalizeStateText(stateEn)) || null;

export const getStateByAnyName = (value) =>
  SUDAN_STATES.find(
    (state) =>
      normalizeStateText(state.en) === normalizeStateText(value) ||
      normalizeStateText(state.ar) === normalizeStateText(value)
  ) || null;
