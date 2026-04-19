const VIEWED_KEY = "romanestate-viewed-listings";
const COMPARE_KEY = "romanestate-compare-listings";
const SAVED_SEARCHES_KEY = "romanestate-saved-searches";
const MAX_VIEWED = 8;
const MAX_COMPARE = 4;
const MAX_SAVED_SEARCHES = 6;

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readStorageList(key) {
  if (!canUseStorage()) {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeStorageList(key, value) {
  if (!canUseStorage()) {
    return value;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
  return value;
}

function uniqueIds(ids, limit) {
  const next = [];

  ids.forEach((value) => {
    const id = Number(value);
    if (Number.isFinite(id) && !next.includes(id)) {
      next.push(id);
    }
  });

  return next.slice(0, limit);
}

function normalizeViewedRecord(entry) {
  if (entry && typeof entry === "object") {
    const id = Number(entry.id);
    if (!Number.isFinite(id)) {
      return null;
    }

    return {
      id,
      viewedPrice: Number(entry.viewedPrice ?? entry.lastSeenPrice ?? entry.price ?? 0) || 0,
      viewedAt: typeof entry.viewedAt === "string" ? entry.viewedAt : null,
    };
  }

  const id = Number(entry);
  if (!Number.isFinite(id)) {
    return null;
  }

  return {
    id,
    viewedPrice: 0,
    viewedAt: null,
  };
}

function uniqueViewedRecords(records, limit) {
  const next = [];

  records.forEach((entry) => {
    const record = normalizeViewedRecord(entry);
    if (record && !next.some((item) => item.id === record.id)) {
      next.push(record);
    }
  });

  return next.slice(0, limit);
}

export function formatCurrency(value) {
  const amount = Number(value) || 0;
  return `Rs ${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(amount)}`;
}

export function getListingPrice(item) {
  return Number(item?.price ?? item?.purchasePrice ?? item?.rentPrice ?? 0) || 0;
}

export function getListingArea(item) {
  return Number(item?.postDetail?.size ?? item?.area ?? 0) || 0;
}

export function getPricePerSqft(item) {
  const area = getListingArea(item);
  if (!area) {
    return 0;
  }

  return Math.round(getListingPrice(item) / area);
}

export function estimateMonthlyPayment(value, options = {}) {
  const price = Number(value) || 0;
  if (!price) {
    return 0;
  }

  const downPaymentRatio = options.downPaymentRatio ?? 0.2;
  const annualRate = options.annualRate ?? 0.0925;
  const years = options.years ?? 20;

  const principal = price * (1 - downPaymentRatio);
  const monthlyRate = annualRate / 12;
  const totalPayments = years * 12;

  if (!principal || !monthlyRate || !totalPayments) {
    return 0;
  }

  const factor = Math.pow(1 + monthlyRate, totalPayments);
  return Math.round((principal * monthlyRate * factor) / (factor - 1));
}

export function computeMarketContext(posts) {
  const prices = (posts || [])
    .map((item) => getListingPrice(item))
    .filter((value) => value > 0)
    .sort((left, right) => left - right);

  const areas = (posts || [])
    .map((item) => getListingArea(item))
    .filter((value) => value > 0);

  if (!prices.length) {
    return {
      medianPrice: 0,
      averagePrice: 0,
      lowPriceThreshold: 0,
      highPriceThreshold: 0,
      averageArea: areas.length ? Math.round(areas.reduce((sum, value) => sum + value, 0) / areas.length) : 0,
    };
  }

  const middleIndex = Math.floor(prices.length / 2);
  const medianPrice =
    prices.length % 2 === 0 ? Math.round((prices[middleIndex - 1] + prices[middleIndex]) / 2) : prices[middleIndex];

  return {
    medianPrice,
    averagePrice: Math.round(prices.reduce((sum, value) => sum + value, 0) / prices.length),
    lowPriceThreshold: prices[Math.floor((prices.length - 1) * 0.35)] ?? medianPrice,
    highPriceThreshold: prices[Math.floor((prices.length - 1) * 0.75)] ?? medianPrice,
    averageArea: areas.length ? Math.round(areas.reduce((sum, value) => sum + value, 0) / areas.length) : 0,
  };
}

export function getListingBadges(item, marketContext = {}) {
  const badges = [];
  const price = getListingPrice(item);
  const area = getListingArea(item);

  if (item?.user?.username || item?.userId) {
    badges.push({ key: "card.badgeVerified", tone: "verified" });
  }

  if (marketContext.medianPrice && price > 0 && price <= marketContext.medianPrice * 0.9) {
    badges.push({ key: "card.badgeBestValue", tone: "value" });
  }

  if ((item?.bedroom || 0) >= 3 || ((item?.bedroom || 0) >= 2 && (item?.bathroom || 0) >= 2)) {
    badges.push({ key: "card.badgeFamily", tone: "family" });
  }

  if ((marketContext.highPriceThreshold && price >= marketContext.highPriceThreshold) || area >= 1400) {
    badges.push({ key: "card.badgePremium", tone: "premium" });
  }

  return badges.slice(0, 3);
}

export function matchesHighlight(item, highlight, marketContext = {}) {
  if (!highlight) {
    return true;
  }

  switch (highlight) {
    case "verified":
      return Boolean(item?.user?.username || item?.userId);
    case "best-value":
      return getListingPrice(item) > 0 && marketContext.medianPrice > 0 && getListingPrice(item) <= marketContext.medianPrice * 0.9;
    case "family-ready":
      return (item?.bedroom || 0) >= 3 || ((item?.bedroom || 0) >= 2 && (item?.bathroom || 0) >= 2);
    case "premium":
      return getListingArea(item) >= 1400 || getListingPrice(item) >= (marketContext.highPriceThreshold || Number.MAX_SAFE_INTEGER);
    default:
      return true;
  }
}

export function findListingsByIds(posts, ids) {
  const map = new Map((posts || []).map((post) => [Number(post.id), post]));
  return uniqueIds(ids, ids.length).map((id) => map.get(id)).filter(Boolean);
}

export function findSimilarListings(posts, currentPost) {
  return [...(posts || [])]
    .filter((item) => item.id !== currentPost.id)
    .map((item) => {
      let score = 0;

      if (item.city && item.city === currentPost.city) score += 4;
      if (item.type && item.type === currentPost.type) score += 3;
      if (item.property && item.property === currentPost.property) score += 2;
      score += Math.max(0, 2 - Math.abs((item.bedroom || 0) - (currentPost.bedroom || 0)));
      score += Math.max(0, 2 - Math.abs((item.bathroom || 0) - (currentPost.bathroom || 0)));

      const currentPrice = getListingPrice(currentPost);
      const itemPrice = getListingPrice(item);
      if (currentPrice > 0 && itemPrice > 0) {
        score += Math.max(0, 3 - Math.abs(currentPrice - itemPrice) / currentPrice);
      }

      return { item, score };
    })
    .sort((left, right) => right.score - left.score)
    .slice(0, 4)
    .map((entry) => entry.item);
}

export function getViewedListingRecords() {
  return uniqueViewedRecords(readStorageList(VIEWED_KEY), MAX_VIEWED);
}

export function getViewedListingIds() {
  return getViewedListingRecords().map((item) => item.id);
}

export function recordViewedListing(listingOrId) {
  const nextRecord =
    listingOrId && typeof listingOrId === "object"
      ? {
          id: Number(listingOrId.id),
          viewedPrice: getListingPrice(listingOrId),
          viewedAt: new Date().toISOString(),
        }
      : {
          id: Number(listingOrId),
          viewedPrice: 0,
          viewedAt: new Date().toISOString(),
        };

  const next = uniqueViewedRecords([nextRecord, ...getViewedListingRecords()], MAX_VIEWED);
  return writeStorageList(VIEWED_KEY, next);
}

export function getRecentlyViewedListings(posts, options = {}) {
  const { limit = 4 } = options;
  const postMap = new Map((posts || []).map((post) => [Number(post.id), post]));

  return getViewedListingRecords()
    .map((record) => {
      const post = postMap.get(record.id);
      if (!post) {
        return null;
      }

      const currentPrice = getListingPrice(post);
      const recentViewPrice = Number(record.viewedPrice) || 0;
      const recentViewPriceDropAmount =
        recentViewPrice > 0 && currentPrice > 0 && recentViewPrice > currentPrice ? recentViewPrice - currentPrice : 0;

      return {
        ...post,
        recentViewPrice,
        recentViewViewedAt: record.viewedAt,
        recentViewPriceDropAmount,
        recentViewPriceDropDetected: recentViewPriceDropAmount > 0,
      };
    })
    .filter(Boolean)
    .slice(0, limit);
}

export function summarizeRecentViewPriceWatch(posts) {
  const trackedPosts = (posts || []).filter((item) => Number(item.recentViewPrice) > 0);
  const droppedPosts = trackedPosts.filter(
    (item) => item.recentViewPriceDropDetected && Number(item.recentViewPriceDropAmount) > 0
  );

  return {
    trackedCount: trackedPosts.length,
    priceDropsCount: droppedPosts.length,
    totalSavings: droppedPosts.reduce((sum, item) => sum + (Number(item.recentViewPriceDropAmount) || 0), 0),
  };
}

export function getCompareIds() {
  return uniqueIds(readStorageList(COMPARE_KEY), MAX_COMPARE);
}

export function toggleCompareId(id) {
  const current = getCompareIds();
  const numericId = Number(id);
  const next = current.includes(numericId)
    ? current.filter((item) => item !== numericId)
    : uniqueIds([numericId, ...current], MAX_COMPARE);

  return writeStorageList(COMPARE_KEY, next);
}

export function clearCompareIds() {
  return writeStorageList(COMPARE_KEY, []);
}

export function getSavedSearches() {
  return readStorageList(SAVED_SEARCHES_KEY).filter(
    (item) => item && typeof item.signature === "string" && typeof item.label === "string"
  );
}

export function saveSearch(search) {
  const current = getSavedSearches().filter((item) => item.signature !== search.signature);
  const next = [{ ...search, savedAt: new Date().toISOString() }, ...current].slice(0, MAX_SAVED_SEARCHES);
  return writeStorageList(SAVED_SEARCHES_KEY, next);
}

export function removeSavedSearch(signature) {
  const next = getSavedSearches().filter((item) => item.signature !== signature);
  return writeStorageList(SAVED_SEARCHES_KEY, next);
}
