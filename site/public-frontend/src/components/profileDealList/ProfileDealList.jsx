import "./profileDealList.scss";
import { useLanguage } from "../../context/LanguageContext";
import { getCityLabel } from "../../lib/siteCatalog";

const DEAL_STEPS = ["REQUESTED", "IN_REVIEW", "VIEWING", "NEGOTIATION", "APPROVED", "CLOSED"];

function getActiveStepIndex(status) {
  const normalized = String(status || "REQUESTED");
  if (normalized === "DECLINED") {
    return 1;
  }
  const index = DEAL_STEPS.indexOf(normalized);
  return index >= 0 ? index : 0;
}

function ProfileDealList({ deals }) {
  const { language, t } = useLanguage();

  const formatDate = (value) => {
    if (!value) {
      return t("deals.justNow");
    }

    try {
      return new Date(value).toLocaleString(language === "ru" ? "ru-RU" : "en-US");
    } catch {
      return value;
    }
  };

  const statusLabel = (status) => {
    const normalized = String(status || "REQUESTED");
    const labels = {
      REQUESTED: language === "ru" ? "Запрос" : "Requested",
      IN_REVIEW: language === "ru" ? "Проверка" : "In review",
      VIEWING: language === "ru" ? "Показ" : "Viewing",
      NEGOTIATION: language === "ru" ? "Переговоры" : "Negotiation",
      APPROVED: language === "ru" ? "Одобрено" : "Approved",
      CLOSED: language === "ru" ? "Закрыто" : "Closed",
      DECLINED: language === "ru" ? "Отклонено" : "Declined",
    };

    return labels[normalized] || normalized.replaceAll("_", " ");
  };

  if (!deals?.length) {
    return (
      <div className="dealListEmpty">
        <h3>{t("deals.emptyTitle")}</h3>
        <p>{t("deals.emptyDescription")}</p>
      </div>
    );
  }

  return (
    <div className="profileDealList">
      {deals.map((deal) => (
        <article key={deal.id} className="dealCard">
          <div className="dealTop">
            <div>
              <span className={`statusBadge status-${String(deal.status || "REQUESTED").toLowerCase()}`}>
                {statusLabel(deal.status)}
              </span>
              <h3>{deal.postTitle || t("deals.untitled")}</h3>
            </div>
            <div className="dealPrice">Rs {deal.price}</div>
          </div>

          <div className="dealMeta">
            <span>{deal.postAddress}</span>
            <span>{deal.city ? getCityLabel(deal.city, language) : t("deals.cityPending")}</span>
            <span>{deal.type === "rent" ? t("deals.rentDeal") : t("deals.buyDeal")}</span>
          </div>

          <div className="dealTimeline">
            {DEAL_STEPS.map((step, index) => {
              const activeIndex = getActiveStepIndex(deal.status);
              const isDone = index <= activeIndex && deal.status !== "DECLINED";
              const isCurrent = index === activeIndex;
              return (
                <div
                  key={`${deal.id}-${step}`}
                  className={`timelineStep${isDone ? " is-done" : ""}${isCurrent ? " is-current" : ""}`}
                >
                  <span className="dot" />
                  <small>{statusLabel(step)}</small>
                </div>
              );
            })}
            {deal.status === "DECLINED" && (
              <div className="timelineDeclined">{t("deals.declined")}</div>
            )}
          </div>

          <div className="dealBottom">
            <div>
              <strong>{t("deals.assignedRealtor")}</strong>
              <p>{deal.assignedRealtor?.username || t("deals.autoAssign")}</p>
            </div>
            <div>
              <strong>{t("deals.updated")}</strong>
              <p>{formatDate(deal.updatedAt || deal.createdAt)}</p>
            </div>
          </div>

          {deal.note && (
            <div className="dealNote">
              <strong>{t("deals.yourNote")}</strong>
              <p>{deal.note}</p>
            </div>
          )}
        </article>
      ))}
    </div>
  );
}

export default ProfileDealList;
