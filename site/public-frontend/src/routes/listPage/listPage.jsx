import "./listPage.scss";
import Filter from "../../components/filter/Filter";
import List from "../../components/list/List";
import Map from "../../components/map/Map";
import Card from "../../components/card/Card";
import ComparePanel from "../../components/comparePanel/ComparePanel";
import { Await, useLoaderData, useSearchParams } from "react-router-dom";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useLanguage } from "../../context/LanguageContext";
import { getCityLabel } from "../../lib/siteCatalog";
import {
  clearCompareIds,
  computeMarketContext,
  findListingsByIds,
  formatCurrency,
  getCompareIds,
  getRecentlyViewedListings,
  matchesHighlight,
  summarizeRecentViewPriceWatch,
  toggleCompareId,
} from "../../lib/marketplaceExperience";
import {
  filterListingsByMapArea,
  matchesAdvancedFilters,
  parseSharedShortlist,
} from "../../lib/marketplaceIntelligence";

const PAGE_SIZE = 9;

function sortPosts(posts, sortKey) {
  const sorted = [...posts];

  switch (sortKey) {
    case "price-asc":
      sorted.sort((left, right) => (left.price || 0) - (right.price || 0));
      break;
    case "price-desc":
      sorted.sort((left, right) => (right.price || 0) - (left.price || 0));
      break;
    case "bedroom-desc":
      sorted.sort((left, right) => (right.bedroom || 0) - (left.bedroom || 0));
      break;
    case "city-asc":
      sorted.sort((left, right) => String(left.city || "").localeCompare(String(right.city || "")));
      break;
    case "newest":
    default:
      sorted.sort((left, right) => (right.id || 0) - (left.id || 0));
      break;
  }

  return sorted;
}

function buildFeaturedPosts(posts, marketContext) {
  if (!posts.length) {
    return [];
  }

  return [...posts]
    .map((post) => {
      let score = 0;
      const price = Number(post.price) || 0;

      if (post.type === "buy" || post.type === "sale") score += 2;
      if ((post.bedroom || 0) >= 2) score += 2;
      if ((post.bathroom || 0) >= 2) score += 1;
      if (price > 0 && marketContext.medianPrice > 0 && price <= marketContext.medianPrice * 0.95) {
        score += 2;
      }
      if ((post.city || "").trim()) score += 1;
      if ((post.postDetail?.size || 0) >= 1200) score += 1;

      return { post, score };
    })
    .sort((left, right) => right.score - left.score)
    .slice(0, 6)
    .map((item) => item.post);
}

function FeedSkeleton() {
  return (
    <>
      <section className="feedHero feedSkeletonBlock">
        <div className="skeletonLine wide" />
        <div className="skeletonLine" />
        <div className="skeletonLine short" />
      </section>
      <section className="resultsSection feedSkeletonBlock">
        <div className="skeletonCards">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={`skeleton-${index}`} className="skeletonCard" />
          ))}
        </div>
      </section>
    </>
  );
}

function ListingRail({
  title,
  eyebrow,
  posts,
  compareIds,
  onToggleCompare,
  marketContext,
  summaryItems = [],
  showRecentViewAlert = false,
  activeId,
  onHoverStart,
  onHoverEnd,
}) {
  if (!posts.length) {
    return null;
  }

  return (
    <section className="featuredRailSection">
      <div className="sectionTitle">
        <div>
          <span className="eyebrow">{eyebrow}</span>
          <h2>{title}</h2>
        </div>
        {summaryItems.length > 0 && (
          <div className="railSummary">
            {summaryItems.map((item) => (
              <article key={`${title}-${item.label}`} className="railSummaryItem">
                <strong>{item.value}</strong>
                <span>{item.label}</span>
              </article>
            ))}
          </div>
        )}
      </div>
      <div className="featuredRail">
        {posts.map((post) => (
          <div key={`rail-${post.id}`} className="featuredItem">
            <Card
              item={post}
              isCompared={compareIds.includes(post.id)}
              isActive={activeId === post.id}
              onToggleCompare={onToggleCompare}
              onHoverStart={onHoverStart}
              onHoverEnd={onHoverEnd}
              marketContext={marketContext}
              showRecentViewAlert={showRecentViewAlert}
            />
          </div>
        ))}
      </div>
    </section>
  );
}

function ListPage() {
  const data = useLoaderData();
  const [searchParams] = useSearchParams();
  const { language, t } = useLanguage();
  const sortKey = searchParams.get("sort") || "newest";
  const highlight = searchParams.get("highlight") || "";
  const sharedShortlist = useMemo(() => parseSharedShortlist(searchParams), [searchParams]);
  const advancedFilters = useMemo(
    () => ({
      district: searchParams.get("district") || "",
      transit: searchParams.get("transit") || "",
      buildingType: searchParams.get("buildingType") || "",
      renovation: searchParams.get("renovation") || "",
      amenities: searchParams.get("amenities") || "",
      newBuild: searchParams.get("newBuild") || "",
      priceSignal: searchParams.get("priceSignal") || "",
    }),
    [searchParams]
  );

  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [compareIds, setCompareIds] = useState(() => sharedShortlist.length ? sharedShortlist : getCompareIds());
  const [activeListingId, setActiveListingId] = useState(null);
  const [searchArea, setSearchArea] = useState(null);
  const [draftArea, setDraftArea] = useState(null);
  const [isDrawingArea, setIsDrawingArea] = useState(false);
  const searchSignature = searchParams.toString();

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [searchSignature, sortKey]);

  useEffect(() => {
    if (sharedShortlist.length > 0) {
      setCompareIds(sharedShortlist);
    }
  }, [sharedShortlist]);

  const resultsTitle = useMemo(() => {
    const city = searchParams.get("city");
    return city
      ? t("listPage.resultsTitleCity", { city: getCityLabel(city, language) })
      : t("listPage.resultsTitleDefault");
  }, [language, searchParams, t]);

  const sortLabel = useMemo(() => {
    const labels = {
      newest: t("filter.newest"),
      "price-desc": t("filter.priceHigh"),
      "price-asc": t("filter.priceLow"),
      "bedroom-desc": t("filter.bedroomHigh"),
      "city-asc": t("filter.cityAz"),
    };

    return labels[sortKey] || t("filter.newest");
  }, [sortKey, t]);

  const highlightLabel = useMemo(() => {
    const labels = {
      verified: t("filter.highlightVerified"),
      "best-value": t("filter.highlightBestValue"),
      "family-ready": t("filter.highlightFamily"),
      premium: t("filter.highlightPremium"),
    };

    return labels[highlight] || t("filter.highlightAll");
  }, [highlight, t]);

  const handleToggleCompare = (id) => {
    setCompareIds(toggleCompareId(id));
  };

  const handleClearCompare = () => {
    setCompareIds(clearCompareIds());
  };

  const handleApplyArea = () => {
    if (draftArea?.center) {
      setSearchArea(draftArea);
      setIsDrawingArea(false);
    }
  };

  const handleResetArea = () => {
    setSearchArea(null);
    setDraftArea(null);
    setIsDrawingArea(false);
  };

  return (
    <div className="listPage">
      <div className="listContainer">
        <div className="wrapper">
          <div className="filterStickyWrap">
            <Filter />
          </div>
          <Suspense fallback={<FeedSkeleton />}>
            <Await
              resolve={data.postResponse}
              errorElement={<p>{t("listPage.loadingError")}</p>}
            >
              {(postResponse) => {
                const sortedPosts = sortPosts(postResponse.data, sortKey);
                const baseMarketContext = computeMarketContext(sortedPosts);
                const highlightPosts = sortedPosts.filter((post) => matchesHighlight(post, highlight, baseMarketContext));
                const advancedPosts = highlightPosts.filter((post) => matchesAdvancedFilters(post, advancedFilters, baseMarketContext));
                const areaPosts = filterListingsByMapArea(advancedPosts, searchArea);
                const filteredPosts = areaPosts;
                const marketContext = computeMarketContext(filteredPosts.length ? filteredPosts : sortedPosts);
                const featuredPosts = buildFeaturedPosts(filteredPosts.length ? filteredPosts : sortedPosts, marketContext);
                const visiblePosts = filteredPosts.slice(0, visibleCount);
                const hasMore = visibleCount < filteredPosts.length;
                const comparePosts = findListingsByIds(sortedPosts, compareIds);
                const recentPosts = getRecentlyViewedListings(sortedPosts, { limit: 4 });
                const recentPriceWatch = summarizeRecentViewPriceWatch(recentPosts);
                const recentSummaryItems = [
                  {
                    value: recentPriceWatch.trackedCount,
                    label: t("listPage.recentTrackedCount"),
                  },
                  {
                    value: recentPriceWatch.priceDropsCount,
                    label: t("listPage.recentPriceDropsCount"),
                  },
                  {
                    value: recentPriceWatch.totalSavings ? formatCurrency(recentPriceWatch.totalSavings) : "—",
                    label: t("listPage.recentSavings"),
                  },
                ];

                return (
                  <>
                    <section className="feedHero">
                      <div>
                        <span className="eyebrow">{t("listPage.collection")}</span>
                        <h1>{resultsTitle}</h1>
                        <p>{t("listPage.heroDescription")}</p>
                        {searchArea?.center && (
                          <div className="areaSearchNotice">{t("map.activeAreaNotice", { value: searchArea.radiusKm })}</div>
                        )}
                      </div>
                      <div className="feedStats">
                        <article>
                          <strong>{filteredPosts.length}</strong>
                          <span>{t("listPage.listingsFound")}</span>
                        </article>
                        <article>
                          <strong>{marketContext.averagePrice ? formatCurrency(marketContext.averagePrice) : "—"}</strong>
                          <span>{t("listPage.averagePrice")}</span>
                        </article>
                        <article>
                          <strong>{marketContext.averageArea ? `${marketContext.averageArea} sqft` : "—"}</strong>
                          <span>{t("listPage.averageArea")}</span>
                        </article>
                        <article>
                          <strong>{comparePosts.length}</strong>
                          <span>{t("listPage.shortlistCount")}</span>
                        </article>
                        <article>
                          <strong>{sortLabel}</strong>
                          <span>{t("listPage.sortingMode")}</span>
                        </article>
                        <article>
                          <strong>{highlightLabel}</strong>
                          <span>{t("listPage.highlightMode")}</span>
                        </article>
                      </div>
                    </section>

                    <section className="mapSection">
                      <div className="mapContainer">
                        <Map
                          items={filteredPosts}
                          activeItemId={activeListingId}
                          onSelectItem={setActiveListingId}
                          showSearchControls
                          searchArea={searchArea}
                          draftArea={draftArea}
                          isDrawingArea={isDrawingArea}
                          onDraftAreaChange={setDraftArea}
                          onToggleDrawMode={() => setIsDrawingArea((current) => !current)}
                          onApplyArea={handleApplyArea}
                          onResetArea={handleResetArea}
                        />
                      </div>
                    </section>

                    <ComparePanel
                      items={comparePosts}
                      onClear={handleClearCompare}
                      onRemove={handleToggleCompare}
                    />

                    <ListingRail
                      eyebrow={t("listPage.recentlyViewedEyebrow")}
                      title={t("listPage.recentlyViewedTitle")}
                      posts={recentPosts}
                      compareIds={compareIds}
                      onToggleCompare={handleToggleCompare}
                      marketContext={marketContext}
                      summaryItems={recentSummaryItems}
                      showRecentViewAlert
                      activeId={activeListingId}
                      onHoverStart={setActiveListingId}
                      onHoverEnd={() => setActiveListingId(null)}
                    />

                    <ListingRail
                      eyebrow={t("listPage.featuredNow")}
                      title={t("listPage.featuredTitle")}
                      posts={featuredPosts}
                      compareIds={compareIds}
                      onToggleCompare={handleToggleCompare}
                      marketContext={marketContext}
                      activeId={activeListingId}
                      onHoverStart={setActiveListingId}
                      onHoverEnd={() => setActiveListingId(null)}
                    />

                    <section className="resultsSection">
                      <div className="sectionTitle">
                        <div>
                          <span className="eyebrow">{t("listPage.allResults")}</span>
                          <h2>{t("listPage.browseFeed")}</h2>
                        </div>
                      </div>
                      <List
                        posts={visiblePosts}
                        compareIds={compareIds}
                        activeId={activeListingId}
                        onToggleCompare={handleToggleCompare}
                        onCardHoverStart={setActiveListingId}
                        onCardHoverEnd={() => setActiveListingId(null)}
                        marketContext={marketContext}
                        emptyTitle={t("listPage.emptyTitle")}
                        emptyDescription={t("listPage.emptyDescription")}
                      />
                      {hasMore && (
                        <div className="loadMoreWrap">
                          <button
                            type="button"
                            className="loadMoreBtn"
                            onClick={() => setVisibleCount((previous) => previous + PAGE_SIZE)}
                          >
                            {t("listPage.loadMore")}
                          </button>
                        </div>
                      )}
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

export default ListPage;
