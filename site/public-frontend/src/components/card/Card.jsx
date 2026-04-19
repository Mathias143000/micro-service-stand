import { Link } from "react-router-dom";
import "./card.scss";
import { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import apiRequest from "../../lib/apiRequest";
import SafeImage from "../safeImage/SafeImage";
import { useLanguage } from "../../context/LanguageContext";
import { getCityLabel } from "../../lib/siteCatalog";
import { getPrimaryListingImage } from "../../lib/listingImages";
import {
  estimateMonthlyPayment,
  formatCurrency,
  getListingArea,
  getListingBadges,
  getPricePerSqft,
} from "../../lib/marketplaceExperience";
import { getListingIntelligence } from "../../lib/marketplaceIntelligence";
import { formatRoomCount } from "../../lib/formatRoomCount";

function Card({
  item,
  isCompared = false,
  isActive = false,
  onToggleCompare,
  onHoverStart,
  onHoverEnd,
  marketContext,
  showPriceAlertControls = false,
  showRecentViewAlert = false,
  onTogglePriceAlert,
}) {
  const { currentUser } = useContext(AuthContext);
  const { language, t } = useLanguage();
  const ownerMobile = item.user?.mobile_number || "";
  const isRent = item.type === "rent";
  const cityLabel = item.city ? getCityLabel(item.city, language) : t("card.cityFallback");
  const badges = getListingBadges(item, marketContext);
  const intelligence = getListingIntelligence(item, marketContext);
  const monthlyEstimate = isRent ? getListingArea(item) : estimateMonthlyPayment(item.price);
  const area = getListingArea(item);
  const pricePerSqft = getPricePerSqft(item);
  const coverImage = getPrimaryListingImage(item.imageGallery?.length ? item.imageGallery : item.images);
  const savedPrice = Number(item.savedPrice) || 0;
  const priceAlertEnabled = Boolean(item.priceAlertEnabled);
  const hasPriceDrop = Boolean(item.priceDropDetected && item.priceDropAmount > 0);
  const recentViewPrice = Number(item.recentViewPrice) || 0;
  const hasRecentViewDrop = Boolean(item.recentViewPriceDropDetected && item.recentViewPriceDropAmount > 0);
  const shouldShowRecentViewPanel = showRecentViewAlert && recentViewPrice > 0;
  const ownershipHighlight =
    intelligence.ownershipType === "realtor"
      ? {
          id: "ownership-realtor",
          label: t("single.ownership.realtor"),
          tone: "verified",
        }
      : intelligence.ownershipType === "developer"
        ? {
            id: "ownership-developer",
            label: t("single.ownership.developer"),
            tone: "premium",
          }
        : null;
  const alertHighlight =
    (showPriceAlertControls && hasPriceDrop) || (showRecentViewAlert && hasRecentViewDrop)
      ? {
          id: "watch-price-drop",
          label: t("card.badgePriceDrop"),
          tone: "alert",
        }
      : intelligence.priceReduced
        ? {
            id: "price-reduced",
            label: t("single.priceReduced"),
            tone: "alert",
          }
        : null;
  const metaHighlights = [
    ...badges.slice(0, 2).map((badge) => ({
      id: badge.key,
      label: t(badge.key),
      tone: badge.tone,
    })),
    intelligence.isNewBuild
      ? {
          id: "new-build",
          label: t("single.newBuild"),
          tone: "premium",
        }
      : null,
    ownershipHighlight,
    alertHighlight,
  ]
    .filter(Boolean)
    .filter((item, index, collection) => collection.findIndex((entry) => entry.label === item.label) === index)
    .slice(0, 3);

  const handleDelete = async () => {
    try {
      const response = await apiRequest.delete(`/posts/${item.id}`);
      if (response.status === 200 || response.status === 204) {
        window.location.reload();
      }
    } catch (error) {
      console.error("Error deleting post:", error);
    }
  };

  return (
    <article
      className={`card${isActive ? " active" : ""}`}
      onMouseEnter={() => onHoverStart?.(item.id)}
      onMouseLeave={() => onHoverEnd?.()}
    >
      <Link to={`/${item.id}`} className="imageContainer">
        <SafeImage src={coverImage} fallback="/bg.jpg" alt={item.title} />
      </Link>
      <div className="textContainer">
        <div className="cardMeta">
          <span className={`pill ${isRent ? "rent" : "buy"}`}>{isRent ? t("card.forRent") : t("card.forSale")}</span>
          <span className="pill subtle">{cityLabel}</span>
          {metaHighlights.map((highlight) => (
            <span key={`${item.id}-${highlight.id}`} className={`pill badge ${highlight.tone}`}>
              {highlight.label}
            </span>
          ))}
        </div>
        <div className="titleRow">
          <h2 className="title">
            <Link className="titleLink" to={`/${item.id}`}>{item.title}</Link>
          </h2>
          <div className="icons">
            {onToggleCompare && (
              <button
                type="button"
                className={`icon compareIcon${isCompared ? " active" : ""}`}
                onClick={() => onToggleCompare(item.id)}
                aria-pressed={isCompared}
              >
                {isCompared ? t("card.compared") : t("card.compare")}
              </button>
            )}
            {currentUser && item.userId === currentUser.id && (
              <>
                <button type="button" className="icon" onClick={handleDelete} aria-label={t("card.deletePost")}>
                  <img src="/delete.png" alt={t("card.deletePost")} title={t("card.deletePost")} />
                </button>
                <Link className="icon" to={`/edit/${item.id}`} aria-label={t("card.editPost")}>
                  <img src="/edit.png" alt={t("card.editPost")} title={t("card.editPost")} />
                </Link>
              </>
            )}
          </div>
        </div>
        <p className="address">
          <img src="/pin.png" alt="" />
          <span>{item.address}</span>
        </p>
        <div className="priceBlock">
          <p className="price">{formatCurrency(item.price)}</p>
          {!isRent && monthlyEstimate > 0 && (
            <span className="priceHint">
              {t("card.monthlyEstimate")}: {formatCurrency(monthlyEstimate)}
            </span>
          )}
          {isRent && (
            <span className="priceHint">
              {t("card.size")}: {area ? `${area} sqft` : t("filter.any")}
            </span>
          )}
        </div>
        {showPriceAlertControls && savedPrice > 0 && (
          <div className={`priceAlertPanel${hasPriceDrop ? " drop" : priceAlertEnabled ? " active" : " muted"}`}>
            <div className="priceAlertCopy">
              <span className="priceAlertStatus">
                {priceAlertEnabled ? t("card.priceAlertOn") : t("card.priceAlertOff")}
              </span>
              <strong>
                {hasPriceDrop
                  ? t("card.priceDropDetected", { amount: formatCurrency(item.priceDropAmount) })
                  : t("card.savedPriceReference", { value: formatCurrency(savedPrice) })}
              </strong>
            </div>
            {onTogglePriceAlert && (
              <button
                type="button"
                className="priceAlertToggle"
                onClick={() => onTogglePriceAlert(item.id, !priceAlertEnabled)}
              >
                {priceAlertEnabled ? t("card.turnOffAlert") : t("card.turnOnAlert")}
              </button>
            )}
          </div>
        )}
        {shouldShowRecentViewPanel && (
          <div className={`priceAlertPanel recentView${hasRecentViewDrop ? " drop" : ""}`}>
            <div className="priceAlertCopy">
              <span className="priceAlertStatus">{t("card.recentViewStatus")}</span>
              <strong>
                {hasRecentViewDrop
                  ? t("card.recentViewPriceDrop", { amount: formatCurrency(item.recentViewPriceDropAmount) })
                  : t("card.recentViewPriceReference", { value: formatCurrency(recentViewPrice) })}
              </strong>
            </div>
            <span className="priceAlertMeta">{t("card.recentViewHint")}</span>
          </div>
        )}
        <div className="metricRow">
          <span className="metric">
            <strong>{area ? `${area} sqft` : "—"}</strong>
            <small>{t("card.size")}</small>
          </span>
          <span className="metric">
            <strong>{pricePerSqft ? formatCurrency(pricePerSqft) : "—"}</strong>
            <small>{t("card.pricePerSqft")}</small>
          </span>
        </div>
        <div className="bottom">
          <div className="features">
            <div className="feature">
              <img src="/bed.png" alt="" />
              <span>{formatRoomCount("bedroom", item.bedroom, language)}</span>
            </div>
            <div className="feature">
              <img src="/bath.png" alt="" />
              <span>{formatRoomCount("bathroom", item.bathroom, language)}</span>
            </div>
          </div>
          <span className="contactLabel">
            {t("card.contact", {
              value: currentUser ? ownerMobile || t("card.contactMissing") : t("card.contactLogin"),
            })}
          </span>
        </div>
        <div className="cardFooter">
          <span>{item.user?.username || t("card.verifiedOwner")}</span>
          <Link to={`/${item.id}`} className="viewLink">{t("card.viewDetails")}</Link>
        </div>
      </div>
    </article>
  );
}

export default Card;
