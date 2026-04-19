export const CITY_OPTIONS = [
  { value: "Mumbai", labels: { en: "Mumbai", ru: "Мумбаи" } },
  { value: "Delhi", labels: { en: "Delhi", ru: "Дели" } },
  { value: "Bengaluru", labels: { en: "Bengaluru", ru: "Бенгалуру" } },
  { value: "Pune", labels: { en: "Pune", ru: "Пуна" } },
  { value: "Hyderabad", labels: { en: "Hyderabad", ru: "Хайдарабад" } },
  { value: "Chennai", labels: { en: "Chennai", ru: "Ченнаи" } },
  { value: "Kolkata", labels: { en: "Kolkata", ru: "Колката" } },
  { value: "Ahmedabad", labels: { en: "Ahmedabad", ru: "Ахмедабад" } },
  { value: "Jaipur", labels: { en: "Jaipur", ru: "Джайпур" } },
  { value: "Goa", labels: { en: "Goa", ru: "Гоа" } },
];

export const POPULAR_CITY_VALUES = ["Mumbai", "Bengaluru", "Goa", "Pune"];

export const PROPERTY_OPTIONS = [
  { value: "apartment", labelKey: "catalog.property.apartment" },
  { value: "house", labelKey: "catalog.property.house" },
  { value: "condo", labelKey: "catalog.property.condo" },
  { value: "land", labelKey: "catalog.property.land" },
];

export const LISTING_TYPE_OPTIONS = [
  { value: "buy", labelKey: "catalog.listingType.buy" },
  { value: "rent", labelKey: "catalog.listingType.rent" },
];

export const BEDROOM_OPTIONS = [
  { value: "", labelKey: "catalog.anyBedrooms" },
  { value: "1", labelKey: "catalog.bedrooms.one" },
  { value: "2", labelKey: "catalog.bedrooms.two" },
  { value: "3", labelKey: "catalog.bedrooms.three" },
  { value: "4", labelKey: "catalog.bedrooms.four" },
  { value: "5", labelKey: "catalog.bedrooms.fivePlus" },
];

export function getCityLabel(value, language) {
  const option = CITY_OPTIONS.find((item) => item.value === value);
  return option?.labels?.[language] || value;
}
