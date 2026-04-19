import "./list.scss";
import Card from "../card/Card";
import { useLanguage } from "../../context/LanguageContext";

function List({
  posts,
  emptyTitle,
  emptyDescription,
  compareIds = [],
  activeId,
  onToggleCompare,
  onCardHoverStart,
  onCardHoverEnd,
  marketContext,
  showPriceAlertControls = false,
  onTogglePriceAlert,
}) {
  const { language } = useLanguage();
  const resolvedTitle =
    emptyTitle || (language === "ru" ? "Подходящих объектов пока нет" : "No properties found");
  const resolvedDescription =
    emptyDescription ||
    (language === "ru"
      ? "Попробуйте изменить фильтры или создайте новое объявление."
      : "Try changing the filters or create a new listing.");

  if (!posts?.length) {
    return (
      <div className="listEmpty">
        <h3>{resolvedTitle}</h3>
        <p>{resolvedDescription}</p>
      </div>
    );
  }

  return (
    <div className="list">
      {posts.map((item) => (
        <Card
          key={item.id}
          item={item}
          isCompared={compareIds.includes(item.id)}
          isActive={activeId === item.id}
          onToggleCompare={onToggleCompare}
          onHoverStart={onCardHoverStart}
          onHoverEnd={onCardHoverEnd}
          marketContext={marketContext}
          showPriceAlertControls={showPriceAlertControls}
          onTogglePriceAlert={onTogglePriceAlert}
        />
      ))}
    </div>
  );
}

export default List;
