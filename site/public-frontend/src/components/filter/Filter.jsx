import { useEffect, useMemo, useState } from "react";
import "./filter.scss";
import { useSearchParams } from "react-router-dom";
import { useLanguage } from "../../context/LanguageContext";
import AssistantSearchPanel from "../assistantSearchPanel/AssistantSearchPanel";
import {
  BEDROOM_OPTIONS,
  CITY_OPTIONS,
  PROPERTY_OPTIONS,
  getCityLabel,
} from "../../lib/siteCatalog";
import {
  getSavedSearches,
  removeSavedSearch,
  saveSearch,
} from "../../lib/marketplaceExperience";
import {
  AMENITY_OPTIONS,
  BUILDING_TYPE_OPTIONS,
  RENOVATION_OPTIONS,
  TRANSIT_OPTIONS,
  getDistrictOptions,
  getLocalizedOptionLabel,
} from "../../lib/marketplaceIntelligence";

function createQueryState(searchParams) {
  return {
    type: searchParams.get("type") || "",
    city: searchParams.get("city") || "",
    property: searchParams.get("property") || "",
    minPrice: searchParams.get("minPrice") || "",
    maxPrice: searchParams.get("maxPrice") || "",
    bedroom: searchParams.get("bedroom") || "",
    sort: searchParams.get("sort") || "newest",
    highlight: searchParams.get("highlight") || "",
    district: searchParams.get("district") || "",
    transit: searchParams.get("transit") || "",
    buildingType: searchParams.get("buildingType") || "",
    renovation: searchParams.get("renovation") || "",
    amenities: searchParams.get("amenities") || "",
    newBuild: searchParams.get("newBuild") || "",
    priceSignal: searchParams.get("priceSignal") || "",
  };
}

function Filter() {
  const { language, t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(() => createQueryState(searchParams));
  const [savedSearches, setSavedSearches] = useState(() => getSavedSearches());

  useEffect(() => {
    setQuery(createQueryState(searchParams));
  }, [searchParams]);

  const highlightOptions = useMemo(
    () => [
      { value: "verified", label: t("filter.highlightVerified") },
      { value: "best-value", label: t("filter.highlightBestValue") },
      { value: "family-ready", label: t("filter.highlightFamily") },
      { value: "premium", label: t("filter.highlightPremium") },
    ],
    [t]
  );

  const districtOptions = useMemo(() => getDistrictOptions(query.city), [query.city]);
  const selectedAmenities = useMemo(
    () =>
      String(query.amenities || "")
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
    [query.amenities]
  );

  const city = searchParams.get("city");
  const hasCity = Boolean(city);
  const visibleCityLabel = hasCity ? getCityLabel(city, language) : "";

  const buildParams = (value) => {
    const nextParams = new URLSearchParams();

    Object.entries(value).forEach(([key, currentValue]) => {
      if (currentValue !== "") {
        nextParams.set(key, currentValue);
      }
    });

    return nextParams;
  };

  const buildSearchLabel = (source = query) => {
    const parts = [];

    if (source.city) {
      parts.push(getCityLabel(source.city, language));
    }

    if (source.district) {
      const districtPool = source.city === query.city ? districtOptions : getDistrictOptions(source.city);
      const selectedDistrict = districtPool.find((option) => option.value === source.district);
      if (selectedDistrict) {
        parts.push(getLocalizedOptionLabel(selectedDistrict, language));
      }
    }

    if (source.type) {
      parts.push(source.type === "rent" ? t("search.rent") : t("search.buy"));
    }

    if (source.property) {
      parts.push(t(`catalog.property.${source.property}`));
    }

    if (source.bedroom) {
      parts.push(t("filter.savedBedrooms", { count: source.bedroom }));
    }

    if (source.highlight) {
      const selectedHighlight = highlightOptions.find((item) => item.value === source.highlight);
      if (selectedHighlight) {
        parts.push(selectedHighlight.label);
      }
    }

    if (source.newBuild === "true") {
      parts.push(t("filter.newBuildOnly"));
    }

    return parts.join(" • ") || t("filter.savedFallback");
  };

  const applyQuery = (value) => {
    setSearchParams(buildParams(value));
  };

  const handleChange = (event) => {
    setQuery((previous) => ({
      ...previous,
      [event.target.name]: event.target.value,
      ...(event.target.name === "city" ? { district: "" } : {}),
    }));
  };

  const handleFilter = (event) => {
    event.preventDefault();
    applyQuery(query);
  };

  const handleHighlight = (value) => {
    const nextQuery = {
      ...query,
      highlight: query.highlight === value ? "" : value,
    };

    setQuery(nextQuery);
    applyQuery(nextQuery);
  };

  const handleAmenityToggle = (value) => {
    const nextAmenities = selectedAmenities.includes(value)
      ? selectedAmenities.filter((item) => item !== value)
      : [...selectedAmenities, value];

    setQuery((previous) => ({
      ...previous,
      amenities: nextAmenities.join(","),
    }));
  };

  const handleReset = () => {
    const nextQuery = createQueryState(new URLSearchParams());
    setQuery(nextQuery);
    setSearchParams(new URLSearchParams());
  };

  const handleSaveSearch = () => {
    const params = Object.fromEntries(buildParams(query).entries());
    const signature = buildParams(query).toString() || "all";
    const nextSavedSearches = saveSearch({
      signature,
      label: buildSearchLabel(),
      params,
    });

    setSavedSearches(nextSavedSearches);
  };

  const handleApplySavedSearch = (params) => {
    setSearchParams(new URLSearchParams(params || {}));
  };

  const handleRemoveSavedSearch = (signature) => {
    setSavedSearches(removeSavedSearch(signature));
  };

  return (
    <div className="filter">
      <h1>
        {hasCity ? t("filter.resultsFor", { city: visibleCityLabel }) : t("filter.resultsDefault")}
      </h1>
      <form className="filterPanel" onSubmit={handleFilter}>
        <div className="panelHeader">
          <div>
            <span className="panelEyebrow">{t("filter.quickFilters")}</span>
            <p>{t("filter.quickFiltersDescription")}</p>
          </div>
          <div className="quickHighlights">
            {highlightOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                className={query.highlight === option.value ? "chip active" : "chip"}
                onClick={() => handleHighlight(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="top">
          <div className="item wide">
            <label htmlFor="city">{t("filter.location")}</label>
            <select id="city" name="city" onChange={handleChange} value={query.city}>
              <option value="">{t("search.allCities")}</option>
              {CITY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {getCityLabel(option.value, language)}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="bottom">
          <div className="item">
            <label htmlFor="type">{t("filter.type")}</label>
            <select name="type" id="type" onChange={handleChange} value={query.type}>
              <option value="">{t("filter.any")}</option>
              <option value="buy">{t("search.buy")}</option>
              <option value="rent">{t("search.rent")}</option>
            </select>
          </div>
          <div className="item">
            <label htmlFor="property">{t("filter.property")}</label>
            <select name="property" id="property" onChange={handleChange} value={query.property}>
              <option value="">{t("filter.any")}</option>
              {PROPERTY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {t(option.labelKey)}
                </option>
              ))}
            </select>
          </div>
          <div className="item">
            <label htmlFor="minPrice">{t("filter.minPrice")}</label>
            <input
              type="number"
              id="minPrice"
              name="minPrice"
              placeholder={t("filter.any")}
              onChange={handleChange}
              value={query.minPrice}
            />
          </div>
          <div className="item">
            <label htmlFor="maxPrice">{t("filter.maxPrice")}</label>
            <input
              type="number"
              id="maxPrice"
              name="maxPrice"
              placeholder={t("filter.any")}
              onChange={handleChange}
              value={query.maxPrice}
            />
          </div>
          <div className="item">
            <label htmlFor="bedroom">{t("filter.bedroom")}</label>
            <select id="bedroom" name="bedroom" onChange={handleChange} value={query.bedroom}>
              {BEDROOM_OPTIONS.map((option) => (
                <option key={option.labelKey} value={option.value}>
                  {t(option.labelKey)}
                </option>
              ))}
            </select>
          </div>
          <div className="item">
            <label htmlFor="sort">{t("filter.sortBy")}</label>
            <select name="sort" id="sort" onChange={handleChange} value={query.sort}>
              <option value="newest">{t("filter.newest")}</option>
              <option value="price-desc">{t("filter.priceHigh")}</option>
              <option value="price-asc">{t("filter.priceLow")}</option>
              <option value="bedroom-desc">{t("filter.bedroomHigh")}</option>
              <option value="city-asc">{t("filter.cityAz")}</option>
            </select>
          </div>
        </div>

        <div className="advancedSection">
          <div className="advancedHeader">
            <div>
              <span className="panelEyebrow">{t("filter.advancedTitle")}</span>
              <p>{t("filter.advancedDescription")}</p>
            </div>
          </div>
          <div className="advancedGrid">
            <div className="item">
              <label htmlFor="district">{t("filter.district")}</label>
              <select id="district" name="district" onChange={handleChange} value={query.district} disabled={!query.city}>
                <option value="">{t("filter.any")}</option>
                {districtOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {getLocalizedOptionLabel(option, language)}
                  </option>
                ))}
              </select>
            </div>
            <div className="item">
              <label htmlFor="transit">{t("filter.transit")}</label>
              <select id="transit" name="transit" onChange={handleChange} value={query.transit}>
                <option value="">{t("filter.any")}</option>
                {TRANSIT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {getLocalizedOptionLabel(option, language)}
                  </option>
                ))}
              </select>
            </div>
            <div className="item">
              <label htmlFor="buildingType">{t("filter.buildingType")}</label>
              <select id="buildingType" name="buildingType" onChange={handleChange} value={query.buildingType}>
                <option value="">{t("filter.any")}</option>
                {BUILDING_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {getLocalizedOptionLabel(option, language)}
                  </option>
                ))}
              </select>
            </div>
            <div className="item">
              <label htmlFor="renovation">{t("filter.renovation")}</label>
              <select id="renovation" name="renovation" onChange={handleChange} value={query.renovation}>
                <option value="">{t("filter.any")}</option>
                {RENOVATION_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {getLocalizedOptionLabel(option, language)}
                  </option>
                ))}
              </select>
            </div>
            <div className="item">
              <label htmlFor="newBuild">{t("filter.newBuild")}</label>
              <select id="newBuild" name="newBuild" onChange={handleChange} value={query.newBuild}>
                <option value="">{t("filter.any")}</option>
                <option value="true">{t("filter.newBuildOnly")}</option>
              </select>
            </div>
            <div className="item">
              <label htmlFor="priceSignal">{t("filter.priceSignal")}</label>
              <select id="priceSignal" name="priceSignal" onChange={handleChange} value={query.priceSignal}>
                <option value="">{t("filter.any")}</option>
                <option value="drop">{t("filter.priceSignalDrop")}</option>
              </select>
            </div>
          </div>
          <div className="amenityRail">
            {AMENITY_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                className={selectedAmenities.includes(option.value) ? "chip active" : "chip"}
                onClick={() => handleAmenityToggle(option.value)}
              >
                {getLocalizedOptionLabel(option, language)}
              </button>
            ))}
          </div>
        </div>

        <div className="panelActions">
          <button type="submit" className="primaryButton">
            <img src="/search.png" alt="" />
            <span>{t("filter.apply")}</span>
          </button>
          <button type="button" className="secondaryButton" onClick={handleSaveSearch}>
            {t("filter.saveSearch")}
          </button>
          <button type="button" className="ghostButton" onClick={handleReset}>
            {t("filter.reset")}
          </button>
        </div>
      </form>

      <div className={`supportGrid${savedSearches.length > 0 ? "" : " noSavedSearches"}`}>
        {savedSearches.length > 0 && (
          <div className="savedSearches">
            <div className="savedSearchesHeader">
              <span className="panelEyebrow">{t("filter.savedSearches")}</span>
              <p>{t("filter.savedSearchesDescription")}</p>
            </div>
            <div className="savedSearchRail">
              {savedSearches.map((search) => (
                <article key={search.signature} className="savedSearchCard">
                  <button type="button" className="savedSearchButton" onClick={() => handleApplySavedSearch(search.params)}>
                    <strong>
                      {search.params && Object.keys(search.params).length > 0
                        ? buildSearchLabel(search.params)
                        : search.label}
                    </strong>
                    <span>{t("filter.openSavedSearch")}</span>
                  </button>
                  <button
                    type="button"
                    className="savedSearchRemove"
                    onClick={() => handleRemoveSavedSearch(search.signature)}
                    aria-label={t("filter.deleteSavedSearch")}
                  >
                    ×
                  </button>
                </article>
              ))}
            </div>
          </div>
        )}

        <AssistantSearchPanel compact />
      </div>
    </div>
  );
}

export default Filter;
