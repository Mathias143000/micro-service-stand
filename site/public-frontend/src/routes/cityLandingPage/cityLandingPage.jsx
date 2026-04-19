import "./cityLandingPage.scss";
import { Await, Link, useLoaderData, useParams } from "react-router-dom";
import { Suspense, useMemo } from "react";
import { useLanguage } from "../../context/LanguageContext";
import {
  buildCityLandingSummary,
  getDistrictOptions,
  getLocalizedOptionLabel,
  getLocalizedPromotionLabel,
} from "../../lib/marketplaceIntelligence";
import { formatCurrency } from "../../lib/marketplaceExperience";
import { getCityLabel } from "../../lib/siteCatalog";

function CityLandingPage() {
  const data = useLoaderData();
  const { city = "" } = useParams();
  const { language, t } = useLanguage();
  const normalizedCity = useMemo(
    () => city.charAt(0).toUpperCase() + city.slice(1).toLowerCase(),
    [city]
  );

  return (
    <div className="cityLandingPage">
      <Suspense fallback={<p>{t("listPage.loading")}</p>}>
        <Await resolve={data.postResponse} errorElement={<p>{t("listPage.loadingError")}</p>}>
          {(postResponse) => {
            const posts = postResponse.data || [];
            const summary = buildCityLandingSummary(posts, normalizedCity);
            const districtOptions = getDistrictOptions(normalizedCity);

            return (
              <>
                <section className="cityHero">
                  <span className="eyebrow">{t("citySpotlight.label")}</span>
                  <h1>{t("citySpotlight.title", { city: getCityLabel(normalizedCity, language) })}</h1>
                  <p>{t("citySpotlight.description")}</p>
                  <div className="cityStats">
                    <article>
                      <strong>{summary.count}</strong>
                      <span>{t("citySpotlight.liveListings")}</span>
                    </article>
                    <article>
                      <strong>{summary.medianPrice ? formatCurrency(summary.medianPrice) : "-"}</strong>
                      <span>{t("citySpotlight.medianPrice")}</span>
                    </article>
                    <article>
                      <strong>{summary.newBuilds.length}</strong>
                      <span>{t("citySpotlight.newBuilds")}</span>
                    </article>
                  </div>
                </section>

                <section className="districtSection">
                  <div className="sectionTitle">
                    <div>
                      <span className="eyebrow">{t("citySpotlight.districtsEyebrow")}</span>
                      <h2>{t("citySpotlight.districtsTitle")}</h2>
                    </div>
                  </div>
                  <div className="districtRail">
                    {districtOptions.map((district) => (
                      <Link
                        key={district.value}
                        to={`/list?city=${normalizedCity}&district=${district.value}`}
                        className="districtCard"
                      >
                        <strong>{getLocalizedOptionLabel(district, language)}</strong>
                        <span>{t("citySpotlight.exploreDistrict")}</span>
                      </Link>
                    ))}
                  </div>
                </section>

                <section className="promotionSection">
                  <div className="sectionTitle">
                    <div>
                      <span className="eyebrow">{t("citySpotlight.promotionsEyebrow")}</span>
                      <h2>{t("citySpotlight.promotionsTitle")}</h2>
                    </div>
                  </div>
                  <div className="promotionGrid">
                    {summary.promotions.map((promotion) => (
                      <Link key={promotion.id} to={`/${promotion.id}`} className="promotionCard">
                        <strong>{promotion.title}</strong>
                        <p>{getLocalizedPromotionLabel(promotion.promotion, language)}</p>
                      </Link>
                    ))}
                  </div>
                </section>
              </>
            );
          }}
        </Await>
      </Suspense>
    </div>
  );
}

export default CityLandingPage;
