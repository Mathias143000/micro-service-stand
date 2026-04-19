import { useState } from "react";
import "./searchBar.scss";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../../context/LanguageContext";
import {
  BEDROOM_OPTIONS,
  CITY_OPTIONS,
  LISTING_TYPE_OPTIONS,
  POPULAR_CITY_VALUES,
  PROPERTY_OPTIONS,
  getCityLabel,
} from "../../lib/siteCatalog";

function SearchBar() {
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const [query, setQuery] = useState({
    type: "buy",
    city: "",
    property: "",
    bedroom: "",
    minPrice: "",
    maxPrice: "",
  });

  const switchType = (val) => {
    setQuery((prev) => ({ ...prev, type: val }));
  };

  const handleChange = (e) => {
    setQuery((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const buildSearchUrl = (nextQuery) => {
    const params = new URLSearchParams();
    Object.entries(nextQuery).forEach(([key, value]) => {
      if (value !== "" && value !== null && value !== undefined) {
        params.set(key, String(value));
      }
    });
    return `/list?${params.toString()}`;
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    navigate(buildSearchUrl(query));
  };

  const handlePopularCity = (city) => {
    const nextQuery = { ...query, city };
    setQuery(nextQuery);
    navigate(buildSearchUrl(nextQuery));
  };

  const handleReset = () => {
    const nextQuery = {
      type: "buy",
      city: "",
      property: "",
      bedroom: "",
      minPrice: "",
      maxPrice: "",
    };
    setQuery(nextQuery);
    navigate(buildSearchUrl(nextQuery));
  };

  return (
    <div className="searchBar">
      <div className="type">
        {LISTING_TYPE_OPTIONS.map((typeOption) => (
          <button
            key={typeOption.value}
            type="button"
            onClick={() => switchType(typeOption.value)}
            className={query.type === typeOption.value ? "active" : ""}
          >
            {typeOption.value === "buy" ? t("search.buy") : t("search.rent")}
          </button>
        ))}
      </div>
      <form onSubmit={handleSubmit}>
        <div className="field wide">
          <label htmlFor="search-city">{t("search.city")}</label>
          <select id="search-city" name="city" value={query.city} onChange={handleChange}>
            <option value="">{t("search.allCities")}</option>
            {CITY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {getCityLabel(option.value, language)}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="search-property">{t("search.property")}</label>
          <select id="search-property" name="property" value={query.property} onChange={handleChange}>
            <option value="">{t("filter.any")}</option>
            {PROPERTY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {t(option.labelKey)}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="search-bedroom">{t("search.bedrooms")}</label>
          <select id="search-bedroom" name="bedroom" value={query.bedroom} onChange={handleChange}>
            {BEDROOM_OPTIONS.map((option) => (
              <option key={option.labelKey} value={option.value}>
                {t(option.labelKey)}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="search-min-price">{t("search.minPrice")}</label>
          <input
            id="search-min-price"
            type="number"
            name="minPrice"
            min={0}
            max={10000000}
            placeholder={t("search.minPrice")}
            value={query.minPrice}
            onChange={handleChange}
          />
        </div>
        <div className="field">
          <label htmlFor="search-max-price">{t("search.maxPrice")}</label>
          <input
            id="search-max-price"
            type="number"
            name="maxPrice"
            min={0}
            max={10000000}
            placeholder={t("search.maxPrice")}
            value={query.maxPrice}
            onChange={handleChange}
          />
        </div>
        <button type="submit" className="searchButton">
          <img src="/search.png" alt="" />
          <span>{t("search.button")}</span>
        </button>
      </form>
      <div className="quickSearches">
        <span>{t("search.quickLabel")}</span>
        {POPULAR_CITY_VALUES.map((city) => (
          <button key={city} type="button" onClick={() => handlePopularCity(city)}>
            {getCityLabel(city, language)}
          </button>
        ))}
        <button type="button" className="resetChip" onClick={handleReset}>
          {t("search.reset")}
        </button>
      </div>
    </div>
  );
}

export default SearchBar;
