import { Await, Link, useLoaderData } from "react-router-dom";
import { Suspense } from "react";
import SearchBar from "../../components/searchBar/SearchBar";
import AssistantSearchPanel from "../../components/assistantSearchPanel/AssistantSearchPanel";
import OnboardingQuiz from "../../components/onboardingQuiz/OnboardingQuiz";
import SafeImage from "../../components/safeImage/SafeImage";
import "./homePage.scss";
import { useLanguage } from "../../context/LanguageContext";
import { POPULAR_CITY_VALUES, getCityLabel } from "../../lib/siteCatalog";
import { getPrimaryListingImage } from "../../lib/listingImages";
import {
  MORTGAGE_PARTNERS,
  getRecommendations,
  getSavedSearchDigests,
} from "../../lib/marketplaceIntelligence";
import {
  computeMarketContext,
  formatCurrency,
  getListingBadges,
} from "../../lib/marketplaceExperience";

function HomePage() {
  const data = useLoaderData();
  const { language, t } = useLanguage();
  const trustSignals = [t("home.trustOne"), t("home.trustTwo"), t("home.trustThree")];
  const renderShowcase = (posts) => {
    const spotlight = posts[0] || null;
    const railPosts = posts.slice(1, 3);
    const marketContext = computeMarketContext(posts);

    if (!spotlight) {
      return <div className="showcaseFallback" />;
    }

    return (
      <div className="showcaseShell">
        <Link to={`/${spotlight.id}`} className="showcaseSpotlight">
          <SafeImage
            src={getPrimaryListingImage(spotlight.imageGallery?.length ? spotlight.imageGallery : spotlight.images)}
            fallback="/bg.jpg"
            alt={spotlight.title}
          />
          <div className="showcaseOverlay">
            <div className="showcaseMeta">
              <span>{spotlight.type === "rent" ? t("card.forRent") : t("card.forSale")}</span>
              <span>{spotlight.city ? getCityLabel(spotlight.city, language) : t("card.cityFallback")}</span>
            </div>
            <h2>{spotlight.title}</h2>
            <p>{spotlight.address}</p>
            <div className="showcaseFooter">
              <strong>{formatCurrency(spotlight.price)}</strong>
              <span>{t("card.viewDetails")}</span>
            </div>
          </div>
        </Link>

        <div className="showcaseStats">
          <article>
            <strong>{posts.length}</strong>
            <span>{t("listPage.listingsFound")}</span>
          </article>
          <article>
            <strong>{marketContext.averagePrice ? formatCurrency(marketContext.averagePrice) : "—"}</strong>
            <span>{t("listPage.averagePrice")}</span>
          </article>
          <article>
            <strong>{spotlight.city ? getCityLabel(spotlight.city, language) : "—"}</strong>
            <span>{t("filter.location")}</span>
          </article>
        </div>

        <div className="showcaseRail">
          {railPosts.map((post) => {
            const badges = getListingBadges(post, marketContext);
            const firstBadge = badges[0];

            return (
              <Link key={post.id} to={`/${post.id}`} className="showcaseRailCard">
                <SafeImage
                  src={getPrimaryListingImage(post.imageGallery?.length ? post.imageGallery : post.images)}
                  fallback="/bg.jpg"
                  alt={post.title}
                />
                <div className="showcaseRailCopy">
                  <strong>{post.title}</strong>
                  <span>{formatCurrency(post.price)}</span>
                  <small>
                    {firstBadge
                      ? t(firstBadge.key)
                      : post.city
                        ? getCityLabel(post.city, language)
                        : t("card.cityFallback")}
                  </small>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="homePage">
      <div className="textContainer">
        <div className="wrapper">
          <div className="heroCopy">
            <span className="heroBadge">{t("home.searchBadge")}</span>
            <h1 className="title">{t("home.title")}</h1>
            <p>{t("home.description")}</p>
          </div>
          <div className="trustRow">
            {trustSignals.map((item) => (
              <span key={item} className="trustChip">{item}</span>
            ))}
          </div>
          <SearchBar />
          <div className="heroTools">
            <OnboardingQuiz />
            <Link to="/new-builds" className="heroToolLink">{t("home.newBuildHub")}</Link>
          </div>
          <div className="heroShowcase">
            <Suspense fallback={<div className="showcaseFallback" />}>
              <Await resolve={data.postResponse}>
                {(postResponse) => renderShowcase(postResponse.data || [])}
              </Await>
            </Suspense>
          </div>
          <div className="popularCities">
            <span>{t("home.popularCities")}</span>
            <div className="cityRail">
              {POPULAR_CITY_VALUES.map((city) => (
                <Link key={city} to={`/city/${city.toLowerCase()}`}>
                  {getCityLabel(city, language)}
                </Link>
              ))}
            </div>
          </div>
          <div className="boxes">
            <div className="box">
              <h1>16+</h1>
              <h2>{t("home.statsYears")}</h2>
            </div>
            <div className="box">
              <h1>200</h1>
              <h2>{t("home.statsAwards")}</h2>
            </div>
            <div className="box">
              <h1>2000+</h1>
              <h2>{t("home.statsReady")}</h2>
            </div>
          </div>

          <AssistantSearchPanel />

          <Suspense fallback={<div className="homeSkeleton" />}>
            <Await resolve={data.postResponse}>
              {(postResponse) => {
                const posts = postResponse.data || [];
                const recommendations = getRecommendations(posts);
                const digests = getSavedSearchDigests(posts);

                return (
                  <>
                    <section className="featureSection">
                      <div className="sectionHeader">
                        <div>
                          <span className="heroBadge">{t("home.digestEyebrow")}</span>
                          <h2>{t("home.digestTitle")}</h2>
                        </div>
                      </div>
                      <div className="digestGrid">
                        {digests.length > 0 ? digests.map((digest) => (
                          <article key={digest.signature} className="digestCard">
                            <strong>{digest.label}</strong>
                            <span>{t("home.digestMatches", { count: digest.matchingCount })}</span>
                            <Link to={`/list?${new URLSearchParams(digest.params || {}).toString()}`}>{t("filter.openSavedSearch")}</Link>
                          </article>
                        )) : (
                          <article className="digestCard empty">
                            <strong>{t("home.digestEmptyTitle")}</strong>
                            <span>{t("home.digestEmptyDescription")}</span>
                          </article>
                        )}
                      </div>
                    </section>

                    <section className="featureSection">
                      <div className="sectionHeader">
                        <div>
                          <span className="heroBadge">{t("home.recommendationEyebrow")}</span>
                          <h2>{t("home.recommendationTitle")}</h2>
                        </div>
                      </div>
                      <div className="digestGrid">
                        {recommendations.map((item) => (
                          <article key={item.id} className="digestCard">
                            <strong>{item.title}</strong>
                            <span>{formatCurrency(item.price)}</span>
                            <Link to={`/${item.id}`}>{t("card.viewDetails")}</Link>
                          </article>
                        ))}
                      </div>
                    </section>

                    <section className="featureSection">
                      <div className="sectionHeader">
                        <div>
                          <span className="heroBadge">{t("home.financeEyebrow")}</span>
                          <h2>{t("home.financeTitle")}</h2>
                        </div>
                      </div>
                      <div className="digestGrid">
                        {MORTGAGE_PARTNERS.map((partner) => (
                          <article key={partner.id} className="digestCard">
                            <strong>{partner.name}</strong>
                            <span>{partner.rate.toFixed(2)}%</span>
                            <small>{partner.feeLabel}</small>
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
      </div>
    </div>
  );
}

export default HomePage;
