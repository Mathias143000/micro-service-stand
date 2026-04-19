import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import "./comparePanel.scss";
import { useLanguage } from "../../context/LanguageContext";
import {
  estimateMonthlyPayment,
  formatCurrency,
  getListingArea,
  getPricePerSqft,
} from "../../lib/marketplaceExperience";
import {
  buildSharedShortlistLink,
  getShortlistNotes,
  saveShortlistNote,
} from "../../lib/marketplaceIntelligence";
import { getCityLabel } from "../../lib/siteCatalog";
import { formatRoomCount } from "../../lib/formatRoomCount";

function ComparePanel({ items, onClear, onRemove }) {
  const { language, t } = useLanguage();
  const [notes, setNotes] = useState(() => getShortlistNotes());
  const [shareState, setShareState] = useState("");

  useEffect(() => {
    setNotes(getShortlistNotes());
  }, [items]);

  const shortlistUrl = useMemo(() => {
    const relative = buildSharedShortlistLink(items.map((item) => item.id));
    if (!relative || typeof window === "undefined") {
      return "";
    }

    return `${window.location.origin}${relative}`;
  }, [items]);

  if (!items?.length) {
    return null;
  }

  const handleNoteChange = (itemId, value) => {
    setNotes((current) => ({ ...current, [itemId]: value }));
    saveShortlistNote(itemId, value);
  };

  const handleShare = async () => {
    if (!shortlistUrl) {
      setShareState(t("listPage.shareUnavailable"));
      return;
    }

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(shortlistUrl);
      }
      setShareState(t("listPage.sharedShortlistReady"));
    } catch {
      setShareState(shortlistUrl);
    }
  };

  return (
    <section className="comparePanel">
      <div className="comparePanelHeader">
        <div>
          <span className="eyebrow">{t("listPage.compareEyebrow")}</span>
          <h2>{t("listPage.compareTitle")}</h2>
          <p>{t("listPage.compareDescription")}</p>
        </div>
        <div className="compareActions">
          <button type="button" className="compareSecondary" onClick={handleShare}>
            {t("listPage.shareShortlist")}
          </button>
          <button type="button" className="compareClear" onClick={onClear}>
            {t("listPage.clearCompare")}
          </button>
        </div>
      </div>
      {shareState && <p className="shareState">{shareState}</p>}
      <div className="compareGrid">
        {items.map((item) => {
          const monthlyEstimate = item.type === "rent" ? Number(item.price) || 0 : estimateMonthlyPayment(item.price);
          const area = getListingArea(item);
          const pricePerSqft = getPricePerSqft(item);
          const note = notes[item.id] || "";

          return (
            <article key={item.id} className="compareCard">
              <button type="button" className="removeButton" onClick={() => onRemove(item.id)} aria-label={t("listPage.removeCompare")}>
                ×
              </button>
              <div className="compareMeta">
                <span className="cityPill">
                  {item.city ? getCityLabel(item.city, language) : t("card.cityFallback")}
                </span>
                <span className="typePill">{item.type === "rent" ? t("card.forRent") : t("card.forSale")}</span>
              </div>
              <h3>{item.title}</h3>
              <p className="comparePrice">{formatCurrency(item.price)}</p>
              <ul>
                <li>
                  <span>{t("card.monthlyEstimate")}</span>
                  <strong>{monthlyEstimate ? formatCurrency(monthlyEstimate) : "—"}</strong>
                </li>
                <li>
                  <span>{t("card.size")}</span>
                  <strong>{area ? `${area} sqft` : "—"}</strong>
                </li>
                <li>
                  <span>{t("card.pricePerSqft")}</span>
                  <strong>{pricePerSqft ? formatCurrency(pricePerSqft) : "—"}</strong>
                </li>
                <li>
                  <span>{formatRoomCount("bedroom", item.bedroom || 0, language)}</span>
                  <strong>{formatRoomCount("bathroom", item.bathroom || 0, language)}</strong>
                </li>
              </ul>
              <label className="compareNotes">
                <span>{t("listPage.compareNotesLabel")}</span>
                <textarea
                  value={note}
                  onChange={(event) => handleNoteChange(item.id, event.target.value)}
                  placeholder={t("listPage.compareNotesPlaceholder")}
                  rows={3}
                />
              </label>
              <Link to={`/${item.id}`} className="compareLink">
                {t("card.viewDetails")}
              </Link>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export default ComparePanel;
