import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../../context/LanguageContext";
import { parseAssistantPrompt } from "../../lib/marketplaceIntelligence";
import "./assistantSearchPanel.scss";

function AssistantSearchPanel({ compact = false }) {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [prompt, setPrompt] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();
    const params = new URLSearchParams(parseAssistantPrompt(prompt));
    navigate(params.toString() ? `/list?${params.toString()}` : "/list");
  };

  return (
    <section className={`assistantSearchPanel${compact ? " compact" : ""}`}>
      <div className="assistantCopy">
        <span className="eyebrow">{t("assistant.label")}</span>
        <h3>{t("assistant.title")}</h3>
        <p>{t("assistant.description")}</p>
      </div>
      <form onSubmit={handleSubmit}>
        <textarea
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder={t("assistant.placeholder")}
          rows={compact ? 2 : 3}
        />
        <button type="submit">{t("assistant.submit")}</button>
      </form>
      <div className="assistantHints">
        {[
          t("assistant.exampleFamily"),
          t("assistant.exampleMetro"),
          t("assistant.exampleNewBuild"),
        ].map((hint) => (
          <button key={hint} type="button" onClick={() => setPrompt(hint)}>
            {hint}
          </button>
        ))}
      </div>
    </section>
  );
}

export default AssistantSearchPanel;
