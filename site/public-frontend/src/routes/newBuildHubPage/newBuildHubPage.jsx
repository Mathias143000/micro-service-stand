import "./newBuildHubPage.scss";
import { Await, Link, useLoaderData } from "react-router-dom";
import { Suspense } from "react";
import { useLanguage } from "../../context/LanguageContext";
import {
  MORTGAGE_PARTNERS,
  getListingIntelligence,
  getLocalizedPromotionLabel,
} from "../../lib/marketplaceIntelligence";
import { formatCurrency } from "../../lib/marketplaceExperience";

function NewBuildHubPage() {
  const data = useLoaderData();
  const { language, t } = useLanguage();

  return (
    <div className="newBuildHubPage">
      <Suspense fallback={<p>{t("listPage.loading")}</p>}>
        <Await resolve={data.postResponse} errorElement={<p>{t("listPage.loadingError")}</p>}>
          {(postResponse) => {
            const posts = (postResponse.data || []).filter((item) => getListingIntelligence(item).isNewBuild);

            return (
              <>
                <section className="hubHero">
                  <span className="eyebrow">{t("newBuild.label")}</span>
                  <h1>{t("newBuild.title")}</h1>
                  <p>{t("newBuild.description")}</p>
                </section>

                <section className="hubGrid">
                  {posts.map((post) => {
                    const intelligence = getListingIntelligence(post);
                    return (
                      <article key={post.id} className="hubCard">
                        <span className="promotionBadge">{getLocalizedPromotionLabel(intelligence.developerPromotion, language)}</span>
                        <h3>{post.title}</h3>
                        <p>{formatCurrency(post.price)}</p>
                        <small>{intelligence.developerName}</small>
                        <Link to={`/${post.id}`}>{t("card.viewDetails")}</Link>
                      </article>
                    );
                  })}
                </section>

                <section className="partnerSection">
                  <div className="sectionTitle">
                    <div>
                      <span className="eyebrow">{t("newBuild.partnerEyebrow")}</span>
                      <h2>{t("newBuild.partnerTitle")}</h2>
                    </div>
                  </div>
                  <div className="partnerGrid">
                    {MORTGAGE_PARTNERS.map((partner) => (
                      <article key={partner.id} className="partnerCard">
                        <strong>{partner.name}</strong>
                        <span>{partner.rate.toFixed(2)}%</span>
                        <p>{partner.feeLabel}</p>
                      </article>
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

export default NewBuildHubPage;
