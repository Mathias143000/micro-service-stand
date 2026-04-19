import { getSavedSearches, getViewedListingIds, getListingArea, getListingPrice } from "./marketplaceExperience";
import { LISTING_IMAGE_CATEGORIES } from "./listingImages";

const SHORTLIST_NOTES_KEY = "romanestate-shortlist-notes";
const VIEWING_REQUESTS_KEY = "romanestate-viewing-requests";

export const DISTRICT_CATALOG = {
  Mumbai: [
    { value: "bandra-west", labels: { en: "Bandra West", ru: "Бандра Вест" } },
    { value: "powai", labels: { en: "Powai", ru: "Поваи" } },
    { value: "andheri-east", labels: { en: "Andheri East", ru: "Андхери Ист" } },
    { value: "lower-parel", labels: { en: "Lower Parel", ru: "Лоуэр Парел" } },
  ],
  Delhi: [
    { value: "vasant-kunj", labels: { en: "Vasant Kunj", ru: "Васант Кундж" } },
    { value: "dwarka", labels: { en: "Dwarka", ru: "Дварка" } },
    { value: "saket", labels: { en: "Saket", ru: "Сакет" } },
    { value: "rohini", labels: { en: "Rohini", ru: "Рохини" } },
  ],
  Bengaluru: [
    { value: "whitefield", labels: { en: "Whitefield", ru: "Уайтфилд" } },
    { value: "indiranagar", labels: { en: "Indiranagar", ru: "Индиранагар" } },
    { value: "sarjapur", labels: { en: "Sarjapur", ru: "Сарджапур" } },
    { value: "hebbal", labels: { en: "Hebbal", ru: "Хеббал" } },
  ],
  Pune: [
    { value: "baner", labels: { en: "Baner", ru: "Банер" } },
    { value: "hinjewadi", labels: { en: "Hinjewadi", ru: "Хинджевати" } },
    { value: "kharadi", labels: { en: "Kharadi", ru: "Харади" } },
    { value: "wakad", labels: { en: "Wakad", ru: "Вакад" } },
  ],
  Hyderabad: [
    { value: "gachibowli", labels: { en: "Gachibowli", ru: "Гачибоули" } },
    { value: "jubilee-hills", labels: { en: "Jubilee Hills", ru: "Джубили Хиллс" } },
    { value: "kondapur", labels: { en: "Kondapur", ru: "Кондапур" } },
    { value: "madhapur", labels: { en: "Madhapur", ru: "Мадхапур" } },
  ],
  Chennai: [
    { value: "adyar", labels: { en: "Adyar", ru: "Адьяр" } },
    { value: "omr", labels: { en: "OMR", ru: "ОМР" } },
    { value: "velachery", labels: { en: "Velachery", ru: "Велачери" } },
    { value: "anna-nagar", labels: { en: "Anna Nagar", ru: "Анна Нагар" } },
  ],
  Kolkata: [
    { value: "salt-lake", labels: { en: "Salt Lake", ru: "Солт Лейк" } },
    { value: "new-town", labels: { en: "New Town", ru: "Нью Таун" } },
    { value: "park-street", labels: { en: "Park Street", ru: "Парк Стрит" } },
    { value: "behala", labels: { en: "Behala", ru: "Бехала" } },
  ],
  Ahmedabad: [
    { value: "prahlad-nagar", labels: { en: "Prahlad Nagar", ru: "Прахлад Нагар" } },
    { value: "sg-highway", labels: { en: "SG Highway", ru: "СГ Хайвей" } },
    { value: "bopal", labels: { en: "Bopal", ru: "Бопал" } },
    { value: "science-city", labels: { en: "Science City", ru: "Сайенс Сити" } },
  ],
  Jaipur: [
    { value: "malviya-nagar", labels: { en: "Malviya Nagar", ru: "Малвия Нагар" } },
    { value: "vaishali-nagar", labels: { en: "Vaishali Nagar", ru: "Вайшали Нагар" } },
    { value: "jagatpura", labels: { en: "Jagatpura", ru: "Джагатпура" } },
    { value: "c-scheme", labels: { en: "C-Scheme", ru: "Си-Схем" } },
  ],
  Goa: [
    { value: "panjim", labels: { en: "Panjim", ru: "Панджим" } },
    { value: "candolim", labels: { en: "Candolim", ru: "Кандолим" } },
    { value: "dona-paula", labels: { en: "Dona Paula", ru: "Дона Паула" } },
    { value: "porvorim", labels: { en: "Porvorim", ru: "Порворим" } },
  ],
};

export const TRANSIT_OPTIONS = [
  { value: "metro", labels: { en: "Metro access", ru: "Метро рядом" } },
  { value: "walkable", labels: { en: "Walkable essentials", ru: "Пешая доступность" } },
  { value: "car", labels: { en: "Car-first", ru: "Нужна машина" } },
];

export const BUILDING_TYPE_OPTIONS = [
  { value: "tower", labels: { en: "Residential tower", ru: "Жилой небоскрёб" } },
  { value: "boutique", labels: { en: "Boutique building", ru: "Клубный дом" } },
  { value: "villa", labels: { en: "Villa community", ru: "Посёлок вилл" } },
  { value: "plot", labels: { en: "Plot / land", ru: "Участок" } },
  { value: "gated", labels: { en: "Gated condo", ru: "Закрытый кондо-комплекс" } },
];

export const RENOVATION_OPTIONS = [
  { value: "designer", labels: { en: "Designer finish", ru: "Дизайнерская отделка" } },
  { value: "move-in", labels: { en: "Move-in ready", ru: "Готово к заселению" } },
  { value: "core-shell", labels: { en: "Core & shell", ru: "Под отделку" } },
];

export const AMENITY_OPTIONS = [
  { value: "parking", labels: { en: "Parking", ru: "Паркинг" } },
  { value: "security", labels: { en: "24/7 security", ru: "Охрана 24/7" } },
  { value: "gym", labels: { en: "Gym", ru: "Фитнес" } },
  { value: "pool", labels: { en: "Pool", ru: "Бассейн" } },
  { value: "workspace", labels: { en: "Work lounge", ru: "Рабочая зона" } },
  { value: "garden", labels: { en: "Garden / park", ru: "Сад / парк" } },
];

export const MORTGAGE_PARTNERS = [
  { id: "hdfc", name: "HDFC Home Loans", rate: 8.35, feeLabel: "Комиссия 0.5%", tags: ["Быстрое одобрение", "Фиксированная + плавающая ставка"] },
  { id: "sbi", name: "SBI Realty Mortgage", rate: 8.1, feeLabel: "Комиссия 0.35%", tags: ["Удобно для первой покупки", "Широкая сеть отделений"] },
  { id: "icici", name: "ICICI Smart Mortgage", rate: 8.55, feeLabel: "Комиссия 0.4%", tags: ["Цифровое оформление", "Предварительное одобрение"] },
];

const DEVELOPER_NAMES = ["Violet Habitat", "Aurora Living", "Purple Brick", "Skyline Homes"];
const PROMOTION_COPY = [
  {
    id: "launch-pricing",
    labels: {
      en: "Limited-time launch pricing",
      ru: "Стартовая цена на ограниченный срок",
    },
  },
  {
    id: "stamp-duty",
    labels: {
      en: "Builder-paid stamp duty",
      ru: "Пошлину оплачивает девелопер",
    },
  },
  {
    id: "kitchen-package",
    labels: {
      en: "Free modular kitchen package",
      ru: "Модульная кухня в подарок",
    },
  },
  {
    id: "corner-allocation",
    labels: {
      en: "Priority corner-unit allocation",
      ru: "Приоритет на угловые лоты",
    },
  },
];

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readStorageObject(key) {
  if (!canUseStorage()) {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeStorageObject(key, value) {
  if (!canUseStorage()) {
    return value;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
  return value;
}

function hashNumber(value) {
  const base = Number(value) || 0;
  return Math.abs((base * 2654435761) % 9973);
}

function pickFromList(list, seed) {
  if (!list?.length) {
    return null;
  }

  return list[seed % list.length];
}

function buildImageCategorySet(item) {
  if (item?.imageGallery?.length) {
    return new Set(item.imageGallery.map((image) => image.category || "exterior"));
  }

  if ((item?.images || []).length >= LISTING_IMAGE_CATEGORIES.length) {
    return new Set(LISTING_IMAGE_CATEGORIES.map((entry) => entry.value));
  }

  return new Set(["exterior"]);
}

export function getLocalizedOptionLabel(option, language) {
  return option?.labels?.[language] || option?.labels?.en || option?.value || "";
}

export function getLocalizedPromotionLabel(promotion, language) {
  return promotion?.labels?.[language] || promotion?.labels?.en || "";
}

export function getDistrictOptions(city) {
  return DISTRICT_CATALOG[city] || [];
}

export function distanceKm(from, to) {
  if (!from || !to) {
    return Number.POSITIVE_INFINITY;
  }

  const lat1 = Number(from.latitude);
  const lng1 = Number(from.longitude);
  const lat2 = Number(to.latitude);
  const lng2 = Number(to.longitude);

  if (![lat1, lng1, lat2, lng2].every(Number.isFinite)) {
    return Number.POSITIVE_INFINITY;
  }

  const toRad = (value) => (value * Math.PI) / 180;
  const earthRadius = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function getListingIntelligence(item, marketContext = {}) {
  const seed = hashNumber(item?.id);
  const area = getListingArea(item);
  const price = getListingPrice(item);
  const pricePerSqft = area > 0 ? Math.round(price / area) : 0;
  const districtOption = pickFromList(getDistrictOptions(item?.city), seed);
  const transit = (() => {
    const busDistance = Number(item?.postDetail?.bus ?? 2);
    if (busDistance <= 0.5) return "metro";
    if (busDistance <= 1.2) return "walkable";
    return "car";
  })();

  const buildingType =
    item?.property === "house"
      ? "villa"
      : item?.property === "condo"
        ? "gated"
        : item?.property === "land"
          ? "plot"
          : seed % 2 === 0
            ? "tower"
            : "boutique";

  const isNewBuild = Boolean(seed % 3 === 0 || (area >= 1500 && item?.type !== "rent"));
  const renovation =
    pricePerSqft >= (marketContext.averagePrice && marketContext.averageArea
      ? Math.round(marketContext.averagePrice / Math.max(marketContext.averageArea, 1))
      : 8000)
      ? "designer"
      : area >= 1400
        ? "move-in"
        : "core-shell";

  const amenities = [
    "parking",
    "security",
    ...(area > 1200 ? ["workspace"] : []),
    ...((item?.bathroom || 0) >= 2 ? ["gym"] : []),
    ...(isNewBuild ? ["pool"] : []),
    ...(item?.property === "house" ? ["garden"] : []),
  ].filter((value, index, array) => array.indexOf(value) === index);

  const ownershipType = isNewBuild ? "developer" : seed % 2 === 0 ? "realtor" : "owner";
  const developerName = isNewBuild ? pickFromList(DEVELOPER_NAMES, seed)?.toString() : "";
  const condition = item?.type === "rent" ? "managed" : isNewBuild ? "launch" : "resale";
  const finish = renovation === "designer" ? "designer" : renovation === "move-in" ? "move-in" : "shell";
  const photoCategories = buildImageCategorySet(item);
  const verification = {
    photos: LISTING_IMAGE_CATEGORIES.every((entry) => photoCategories.has(entry.value)),
    owner: Boolean(item?.user?.username || item?.userId),
    moderation: true,
    documents: Boolean(isNewBuild || price >= (marketContext.medianPrice || price)),
  };

  const historyBaseline = Math.round(price * (isNewBuild ? 1.08 : 1.06));
  const priceHistory = [
    { label: "Launch", value: historyBaseline },
    { label: "30d", value: Math.round(historyBaseline * 0.99) },
    { label: "14d", value: Math.round(historyBaseline * 0.97) },
    { label: "Now", value: price },
  ];

  const firstHistoryPrice = priceHistory[0]?.value || price;
  const priceReductionAmount = firstHistoryPrice > price ? firstHistoryPrice - price : 0;
  const priceReduced = priceReductionAmount > 0;

  const marketMid = marketContext.medianPrice || price;
  const valuationRange = {
    low: Math.round(Math.min(price, marketMid) * 0.95),
    high: Math.round(Math.max(price, marketMid) * 1.07),
  };

  const nearby = {
    schools: Number(item?.postDetail?.school ?? 1.2),
    transit: Number(item?.postDetail?.bus ?? 0.8),
    restaurants: Number(item?.postDetail?.restaurant ?? 1.1),
    clinics: Number((seed % 4) * 0.4 + 0.6).toFixed(1),
    parks: Number((seed % 5) * 0.35 + 0.5).toFixed(1),
    commute: seed % 2 === 0 ? 32 : 24,
  };

  return {
    district: districtOption?.value || "",
    districtOption,
    transit,
    buildingType,
    renovation,
    amenities,
    isNewBuild,
    ownershipType,
    developerName,
    developerPromotion: isNewBuild ? pickFromList(PROMOTION_COPY, seed) : "",
    hasVideoTour: Boolean(isNewBuild || area >= 1500),
    has3DTour: Boolean(isNewBuild || buildingType === "tower"),
    verification,
    condition,
    finish,
    priceHistory,
    priceReductionAmount,
    priceReduced,
    valuationRange,
    nearby,
  };
}

export function matchesAdvancedFilters(item, filters, marketContext = {}) {
  const intelligence = getListingIntelligence(item, marketContext);

  if (filters?.district && intelligence.district !== filters.district) {
    return false;
  }

  if (filters?.transit && intelligence.transit !== filters.transit) {
    return false;
  }

  if (filters?.buildingType && intelligence.buildingType !== filters.buildingType) {
    return false;
  }

  if (filters?.renovation && intelligence.renovation !== filters.renovation) {
    return false;
  }

  if (filters?.newBuild === "true" && !intelligence.isNewBuild) {
    return false;
  }

  if (filters?.priceSignal === "drop" && !intelligence.priceReduced) {
    return false;
  }

  const amenityValues = String(filters?.amenities || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  if (amenityValues.length > 0 && !amenityValues.every((value) => intelligence.amenities.includes(value))) {
    return false;
  }

  return true;
}

export function filterListingsByMapArea(posts, area) {
  if (!area?.center || !Number(area.radiusKm)) {
    return posts || [];
  }

  return (posts || []).filter((item) => distanceKm(item, area.center) <= area.radiusKm);
}

export function buildCityLandingSummary(posts, city) {
  const cityPosts = (posts || []).filter((item) => item.city === city);
  const districtCounts = new Map();

  cityPosts.forEach((item) => {
    const district = getListingIntelligence(item).district;
    if (district) {
      districtCounts.set(district, (districtCounts.get(district) || 0) + 1);
    }
  });

  const topDistricts = [...districtCounts.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, 3)
    .map(([district]) => district);

  const newBuilds = cityPosts.filter((item) => getListingIntelligence(item).isNewBuild);
  const medianPrice = cityPosts.length
    ? Math.round(
        cityPosts
          .map((item) => getListingPrice(item))
          .sort((left, right) => left - right)[Math.floor(cityPosts.length / 2)] || 0
      )
    : 0;

  return {
    count: cityPosts.length,
    topDistricts,
    newBuilds: newBuilds.slice(0, 4),
    medianPrice,
    promotions: newBuilds.slice(0, 3).map((item) => ({
      id: item.id,
      title: item.title,
      promotion: getListingIntelligence(item).developerPromotion,
    })),
  };
}

export function parseAssistantPrompt(input) {
  const prompt = String(input || "").toLowerCase();
  const nextQuery = {};

  Object.keys(DISTRICT_CATALOG).forEach((city) => {
    if (prompt.includes(city.toLowerCase())) {
      nextQuery.city = city;
    }
  });

  if (/\brent|lease|tenant|аренд/.test(prompt)) {
    nextQuery.type = "rent";
  } else if (/\bbuy|purchase|own|куп/.test(prompt)) {
    nextQuery.type = "buy";
  }

  if (/\bapartment|flat|кварт/.test(prompt)) {
    nextQuery.property = "apartment";
  }
  if (/\bhouse|villa|дом/.test(prompt)) {
    nextQuery.property = "house";
  }
  if (/\bcondo/.test(prompt)) {
    nextQuery.property = "condo";
  }
  if (/\bland|plot|участ/.test(prompt)) {
    nextQuery.property = "land";
  }

  const bedroomMatch = prompt.match(/(\d)\s*(bed|br|спаль)/);
  if (bedroomMatch) {
    nextQuery.bedroom = bedroomMatch[1];
  }

  const priceMatch = prompt.match(/(?:under|below|до|budget)\s*([0-9]+)/);
  if (priceMatch) {
    nextQuery.maxPrice = priceMatch[1];
  }

  if (/\bnew build|developer|новостр/.test(prompt)) {
    nextQuery.newBuild = "true";
  }

  if (/\bmetro|commute|транзит|метро/.test(prompt)) {
    nextQuery.transit = "metro";
  }

  if (/\bfamily|kids|сем/.test(prompt)) {
    nextQuery.highlight = "family-ready";
  }

  if (/\bprice drop|discount|скидк/.test(prompt)) {
    nextQuery.priceSignal = "drop";
  }

  return nextQuery;
}

export function getShortlistNotes() {
  return readStorageObject(SHORTLIST_NOTES_KEY);
}

export function saveShortlistNote(listingId, note) {
  const current = getShortlistNotes();
  if (note) {
    current[String(listingId)] = note;
  } else {
    delete current[String(listingId)];
  }
  return writeStorageObject(SHORTLIST_NOTES_KEY, current);
}

export function buildSharedShortlistLink(ids) {
  if (!ids?.length) {
    return "";
  }

  const params = new URLSearchParams();
  params.set("shortlist", ids.join(","));
  return `/list?${params.toString()}`;
}

export function parseSharedShortlist(searchParams) {
  const value = searchParams.get("shortlist");
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((item) => Number(item))
    .filter((item) => Number.isFinite(item));
}

export function getViewingRequests() {
  const values = Object.values(readStorageObject(VIEWING_REQUESTS_KEY));
  return values.sort((left, right) => String(right.createdAt).localeCompare(String(left.createdAt)));
}

export function saveViewingRequest(request) {
  const current = readStorageObject(VIEWING_REQUESTS_KEY);
  const id = request.id || `${request.postId}-${Date.now()}`;
  current[id] = { ...request, id, createdAt: request.createdAt || new Date().toISOString() };
  writeStorageObject(VIEWING_REQUESTS_KEY, current);
  return current[id];
}

export function getRecommendations(posts) {
  const viewedIds = new Set(getViewedListingIds());
  const savedSearches = getSavedSearches();
  const recommendations = [...(posts || [])]
    .filter((item) => !viewedIds.has(item.id))
    .map((item) => {
      const intelligence = getListingIntelligence(item);
      let score = 0;

      if (intelligence.isNewBuild) score += 2;
      if (intelligence.priceReduced) score += 2;
      if (savedSearches.some((search) => search.params?.city === item.city)) score += 2;
      if (savedSearches.some((search) => search.params?.property === item.property)) score += 1;
      score += Math.max(0, (item.bedroom || 0) - 1);

      return { item, score };
    })
    .sort((left, right) => right.score - left.score)
    .slice(0, 4)
    .map((entry) => entry.item);

  return recommendations;
}

export function getSavedSearchDigests(posts) {
  const searches = getSavedSearches();
  return searches.slice(0, 3).map((search) => {
    const matchingCount = (posts || []).filter((item) => {
      if (search.params?.city && item.city !== search.params.city) return false;
      if (search.params?.property && item.property !== search.params.property) return false;
      if (search.params?.type && item.type !== search.params.type) return false;
      return true;
    }).length;

    return {
      ...search,
      matchingCount,
    };
  });
}
