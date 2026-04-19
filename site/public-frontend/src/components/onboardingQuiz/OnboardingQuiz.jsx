import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../../context/LanguageContext";
import "./onboardingQuiz.scss";

const INITIAL_STATE = {
  city: "",
  maxPrice: "",
  type: "buy",
  property: "apartment",
  finance: "mortgage",
};

function OnboardingQuiz() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [state, setState] = useState(INITIAL_STATE);

  const updateField = (field, value) => {
    setState((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const params = new URLSearchParams({
      city: state.city,
      maxPrice: state.maxPrice,
      type: state.type,
      property: state.property,
    });

    if (state.finance === "cash") {
      params.set("highlight", "premium");
    }

    setIsOpen(false);
    navigate(`/list?${params.toString()}`);
  };

  return (
    <>
      <button type="button" className="quizLauncher" onClick={() => setIsOpen(true)}>
        {t("quiz.launch")}
      </button>
      {isOpen && (
        <div className="quizOverlay" role="dialog" aria-modal="true" aria-label={t("quiz.title")}>
          <div className="quizCard">
            <div className="quizHeader">
              <div>
                <span className="eyebrow">{t("quiz.label")}</span>
                <h3>{t("quiz.title")}</h3>
                <p>{t("quiz.description")}</p>
              </div>
              <button type="button" className="closeButton" onClick={() => setIsOpen(false)}>
                {t("quiz.close")}
              </button>
            </div>

            <form className="quizForm" onSubmit={handleSubmit}>
              <label>
                <span>{t("quiz.city")}</span>
                <input value={state.city} onChange={(event) => updateField("city", event.target.value)} placeholder={t("quiz.cityPlaceholder")} />
              </label>
              <label>
                <span>{t("quiz.budget")}</span>
                <input value={state.maxPrice} onChange={(event) => updateField("maxPrice", event.target.value)} placeholder="15000000" />
              </label>
              <label>
                <span>{t("quiz.type")}</span>
                <select value={state.type} onChange={(event) => updateField("type", event.target.value)}>
                  <option value="buy">{t("search.buy")}</option>
                  <option value="rent">{t("search.rent")}</option>
                </select>
              </label>
              <label>
                <span>{t("quiz.property")}</span>
                <select value={state.property} onChange={(event) => updateField("property", event.target.value)}>
                  <option value="apartment">{t("catalog.property.apartment")}</option>
                  <option value="house">{t("catalog.property.house")}</option>
                  <option value="condo">{t("catalog.property.condo")}</option>
                  <option value="land">{t("catalog.property.land")}</option>
                </select>
              </label>
              <label>
                <span>{t("quiz.finance")}</span>
                <select value={state.finance} onChange={(event) => updateField("finance", event.target.value)}>
                  <option value="mortgage">{t("quiz.mortgage")}</option>
                  <option value="cash">{t("quiz.cash")}</option>
                </select>
              </label>
              <button type="submit" className="quizSubmit">{t("quiz.submit")}</button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default OnboardingQuiz;
