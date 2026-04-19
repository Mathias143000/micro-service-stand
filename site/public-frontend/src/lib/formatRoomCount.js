const ROOM_LABELS = {
  en: {
    bedroom: ["bedroom", "bedrooms"],
    bathroom: ["bathroom", "bathrooms"],
  },
  ru: {
    bedroom: ["спальня", "спальни", "спален"],
    bathroom: ["ванная", "ванные", "ванных"],
  },
};

function getRussianPlural(count, forms) {
  const mod10 = count % 10;
  const mod100 = count % 100;

  if (mod10 === 1 && mod100 !== 11) {
    return forms[0];
  }

  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return forms[1];
  }

  return forms[2];
}

export function formatRoomCount(type, count, language) {
  const safeCount = Number(count) || 0;

  if (language === "ru") {
    return `${safeCount} ${getRussianPlural(safeCount, ROOM_LABELS.ru[type])}`;
  }

  const forms = ROOM_LABELS.en[type];
  return `${safeCount} ${safeCount === 1 ? forms[0] : forms[1]}`;
}
