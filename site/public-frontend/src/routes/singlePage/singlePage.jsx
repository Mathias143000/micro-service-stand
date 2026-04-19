import "./singlePage.scss";
import Slider from "../../components/slider/Slider";
import Map from "../../components/map/Map";
import List from "../../components/list/List";
import { Link, useNavigate, useLoaderData } from "react-router-dom";
import DOMPurify from "dompurify";
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { AuthContext } from "../../context/AuthContext";
import apiRequest from "../../lib/apiRequest";
import SafeImage from "../../components/safeImage/SafeImage";
import { useLanguage } from "../../context/LanguageContext";
import { getCityLabel } from "../../lib/siteCatalog";
import {
  BUILDING_TYPE_OPTIONS,
  MORTGAGE_PARTNERS,
  RENOVATION_OPTIONS,
  TRANSIT_OPTIONS,
  getListingIntelligence,
  getLocalizedOptionLabel,
  saveViewingRequest,
} from "../../lib/marketplaceIntelligence";
import {
  computeMarketContext,
  estimateMonthlyPayment,
  findSimilarListings,
  formatCurrency,
  getCompareIds,
  getListingArea,
  getListingBadges,
  getPricePerSqft,
  recordViewedListing,
  toggleCompareId,
} from "../../lib/marketplaceExperience";

function getTomorrowDate() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toISOString().slice(0, 10);
}

function SinglePage() {
  const post = useLoaderData();
  const [saved, setSaved] = useState(post.isSaved);
  const [dealNote, setDealNote] = useState("");
  const [requestingDeal, setRequestingDeal] = useState(false);
  const [relatedPosts, setRelatedPosts] = useState([]);
  const [compareIds, setCompareIds] = useState(() => getCompareIds());
  const [shareState, setShareState] = useState("");
  const [viewingSuccess, setViewingSuccess] = useState("");
  const [monthlyBudget, setMonthlyBudget] = useState("85000");
  const [viewingForm, setViewingForm] = useState({
    preferredDate: getTomorrowDate(),
    preferredTime: "11:00",
    partySize: "2",
    message: "",
  });
  const { currentUser } = useContext(AuthContext);
  const { language, t } = useLanguage();
  const ownerMobile = post.user?.mobile_number || "";
  const navigate = useNavigate();
  const scheduleRef = useRef(null);
  const dealRef = useRef(null);

  useEffect(() => {
    recordViewedListing({ id: post.id, price: post.price });
  }, [post.id, post.price]);

  useEffect(() => {
    let active = true;

    const loadRelated = async () => {
      try {
        const response = await apiRequest.get("/posts", {
          params: post.city ? { city: post.city } : undefined,
        });

        if (active) {
          setRelatedPosts(findSimilarListings(response.data || [], post));
        }
      } catch (error) {
        console.error("Error loading similar posts:", error);
        if (active) {
          setRelatedPosts([]);
        }
      }
    };

    loadRelated();

    return () => {
      active = false;
    };
  }, [post.id, post.city, post.type, post.property]);

  const handleSave = async () => {
    if (!currentUser) {
      navigate("/login");
      return;
    }

    setSaved((prev) => !prev);
    try {
      await apiRequest.post("/users/save", { postId: post.id });
    } catch (err) {
      console.log(err);
      setSaved((prev) => !prev);
    }
  };

  const handleExploreNearby = async () => {
    try {
      const response = await apiRequest.get("/posts/nearby", {
        params: {
          latitude: post.latitude,
          longitude: post.longitude,
          type: post.type,
        },
      });
      navigate("/nearby", { state: { nearbyPosts: response.data } });
    } catch (error) {
      console.error("Error fetching nearby posts:", error);
    }
  };

  const handleCreateDeal = async () => {
    if (!currentUser) {
      navigate("/login");
      return;
    }

    try {
      setRequestingDeal(true);
      await apiRequest.post("/api/marketplace-deals", {
        postId: post.id,
        note: dealNote,
      });
      navigate("/profile?tab=deals");
    } catch (error) {
      console.error("Error creating deal request:", error);
    } finally {
      setRequestingDeal(false);
    }
  };

  const handleToggleCompare = (id) => {
    setCompareIds(toggleCompareId(id));
  };

  const handleShareListing = async () => {
    const targetUrl = typeof window !== "undefined" ? window.location.href : "";
    if (!targetUrl) {
      setShareState(t("single.shareUnavailable"));
      return;
    }

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(targetUrl);
      }
      setShareState(t("single.shareCopied"));
    } catch {
      setShareState(targetUrl);
    }
  };

  const handleViewingChange = (field, value) => {
    setViewingForm((current) => ({ ...current, [field]: value }));
  };

  const handleViewingRequest = (event) => {
    event.preventDefault();
    if (!currentUser) {
      navigate("/login");
      return;
    }

    const request = saveViewingRequest({
      postId: post.id,
      postTitle: post.title,
      postAddress: post.address,
      preferredDate: viewingForm.preferredDate,
      preferredTime: viewingForm.preferredTime,
      partySize: viewingForm.partySize,
      message: viewingForm.message,
      ownerLabel: post.user?.username || "",
      status: "REQUESTED",
    });

    if (request) {
      setViewingSuccess(t("single.viewingSuccess"));
      setViewingForm((current) => ({
        ...current,
        message: "",
      }));
    }
  };

  const handleContactOwner = () => {
    if (!currentUser) {
      navigate("/login");
      return;
    }

    if (!ownerMobile) {
      return;
    }

    window.location.href = `tel:${ownerMobile}`;
  };

  const utilitiesLabel =
    post.postDetail?.utilities === "owner"
      ? t("single.utilitiesOwner")
      : post.postDetail?.utilities === "shared"
        ? t("single.utilitiesShared")
        : t("single.utilitiesTenant");

  const petLabel =
    post.postDetail?.pet === "allowed" ? t("single.petAllowed") : t("single.petNotAllowed");

  const marketContext = useMemo(() => computeMarketContext([post, ...relatedPosts]), [post, relatedPosts]);
  const intelligence = useMemo(() => getListingIntelligence(post, marketContext), [marketContext, post]);
  const badges = useMemo(() => getListingBadges(post, marketContext), [marketContext, post]);
  const monthlyPayment = post.type === "rent" ? 0 : estimateMonthlyPayment(post.price);
  const downPayment = Math.round((Number(post.price) || 0) * 0.2);
  const area = getListingArea(post);
  const pricePerSqft = getPricePerSqft(post);
  const cityLabel = post.city ? getCityLabel(post.city, language) : t("card.cityFallback");
  const isCompared = compareIds.includes(post.id);
  const galleryItems = post.imageGallery?.length ? post.imageGallery : post.images;
  const buildingTypeLabel = getLocalizedOptionLabel(
    BUILDING_TYPE_OPTIONS.find((option) => option.value === intelligence.buildingType),
    language
  );
  const renovationLabel = getLocalizedOptionLabel(
    RENOVATION_OPTIONS.find((option) => option.value === intelligence.renovation),
    language
  );
  const transitLabel = getLocalizedOptionLabel(
    TRANSIT_OPTIONS.find((option) => option.value === intelligence.transit),
    language
  );

  const marketPosition = useMemo(() => {
    if (!marketContext.medianPrice || !post.price) {
      return t("single.marketValueBalanced");
    }

    if (post.price <= marketContext.medianPrice * 0.9) {
      return t("single.marketValueGood");
    }

    if (post.price >= marketContext.medianPrice * 1.1) {
      return t("single.marketValuePremium");
    }

    return t("single.marketValueBalanced");
  }, [marketContext.medianPrice, post.price, t]);

  const affordabilityBudget = useMemo(() => {
    const budget = Number(monthlyBudget) || 0;
    if (!monthlyPayment || !budget) {
      return 0;
    }

    return Math.round((budget / monthlyPayment) * (Number(post.price) || 0));
  }, [monthlyBudget, monthlyPayment, post.price]);

  const insightCards = [
    {
      label: t("single.estMonthly"),
      value: monthlyPayment ? formatCurrency(monthlyPayment) : t("single.notProvided"),
      hint: t("single.estMonthlyHint"),
    },
    {
      label: t("single.downPayment"),
      value: downPayment ? formatCurrency(downPayment) : t("single.notProvided"),
      hint: t("single.downPaymentHint"),
    },
    {
      label: t("single.marketPosition"),
      value: marketPosition,
      hint: t("single.marketPositionHint", { city: cityLabel }),
    },
  ];

  const factItems = [
    { label: t("single.factCity"), value: cityLabel },
    { label: t("single.factDistrict"), value: intelligence.districtOption ? intelligence.districtOption.labels?.[language] || intelligence.districtOption.labels?.en : t("single.notProvided") },
    { label: t("single.factType"), value: post.type === "rent" ? t("card.forRent") : t("card.forSale") },
    {
      label: t("single.factProperty"),
      value: post.property ? t(`catalog.property.${post.property}`) : t("single.notProvided"),
    },
    { label: t("single.factArea"), value: area ? `${area} sqft` : t("single.notProvided") },
    { label: t("single.factPricePerSqft"), value: pricePerSqft ? formatCurrency(pricePerSqft) : t("single.notProvided") },
    { label: t("single.factBuilding"), value: buildingTypeLabel || t("single.notProvided") },
    { label: t("single.factFinish"), value: renovationLabel || t("single.notProvided") },
    { label: t("single.factCondition"), value: t(`single.condition.${intelligence.condition}`) },
    { label: t("single.factOwnership"), value: t(`single.ownership.${intelligence.ownershipType}`) },
    { label: t("single.factDeveloper"), value: intelligence.developerName || t("single.notProvided") },
    { label: t("single.factTransit"), value: transitLabel || t("single.notProvided") },
  ];

  const priceHistoryItems = intelligence.priceHistory.map((point) => ({
    ...point,
    label:
      point.label === "Launch"
        ? t("single.historyLaunch")
        : point.label === "30d"
          ? t("single.history30d")
          : point.label === "14d"
            ? t("single.history14d")
            : t("single.historyNow"),
  }));

  const neighborhoodCards = [
    { label: t("single.neighborhoodSchools"), value: t("single.away", { distance: intelligence.nearby.schools }) },
    { label: t("single.neighborhoodTransit"), value: t("single.away", { distance: intelligence.nearby.transit }) },
    { label: t("single.neighborhoodParks"), value: t("single.away", { distance: intelligence.nearby.parks }) },
    { label: t("single.neighborhoodClinics"), value: t("single.away", { distance: intelligence.nearby.clinics }) },
    { label: t("single.neighborhoodDining"), value: t("single.away", { distance: intelligence.nearby.restaurants }) },
    { label: t("single.neighborhoodCommute"), value: t("single.minutes", { value: intelligence.nearby.commute }) },
  ];

  const verificationItems = [
    { label: t("single.verifyPhotos"), done: intelligence.verification.photos },
    { label: t("single.verifyOwnership"), done: intelligence.verification.owner },
    { label: t("single.verifyModeration"), done: intelligence.verification.moderation },
    { label: t("single.verifyDocuments"), done: intelligence.verification.documents },
  ];

  const mediaFeatures = [
    {
      title: t("single.mediaVideo"),
      value: intelligence.hasVideoTour ? t("single.mediaReady") : t("single.mediaPlaceholder"),
    },
    {
      title: t("single.media3d"),
      value: intelligence.has3DTour ? t("single.mediaReady") : t("single.mediaPlaceholder"),
    },
  ];

  return (
    <div className="singlePage">
      <div className="details">
        <div className="wrapper">
          <Slider images={galleryItems} title={post.title} />
          <div className="info">
            <div className="top">
              <div className="post">
                <div className="badgeRow">
                  <span className="cityBadge">{cityLabel}</span>
                  {intelligence.isNewBuild && <span className="statusBadge premium">{t("single.newBuild")}</span>}
                  {intelligence.priceReduced && <span className="statusBadge value">{t("single.priceReduced")}</span>}
                  {badges.map((badge) => (
                    <span key={`${post.id}-${badge.key}`} className={`statusBadge ${badge.tone}`}>
                      {t(badge.key)}
                    </span>
                  ))}
                </div>
                <h1>{post.title}</h1>
                <div className="address">
                  <img src="/pin.png" alt="" />
                  <span>{post.address}</span>
                </div>
                <div className="priceCluster">
                  <div className="price">{formatCurrency(post.price)}</div>
                  {monthlyPayment > 0 && (
                    <span className="priceHint">
                      {t("single.estMonthly")}: {formatCurrency(monthlyPayment)}
                    </span>
                  )}
                  {intelligence.priceReductionAmount > 0 && (
                    <span className="priceDelta">
                      {t("single.priceReducedBy", { amount: formatCurrency(intelligence.priceReductionAmount) })}
                    </span>
                  )}
                </div>
                <div className="ctaRail">
                  <button type="button" className="railPrimary" onClick={handleSave}>
                    {saved ? t("single.saved") : t("single.save")}
                  </button>
                  <button type="button" onClick={handleContactOwner}>
                    {t("single.contactButton")}
                  </button>
                  <button type="button" onClick={() => scheduleRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}>
                    {t("single.scheduleViewing")}
                  </button>
                  <button type="button" onClick={handleShareListing}>
                    {t("single.share")}
                  </button>
                  <button type="button" className="railAccent" onClick={() => dealRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}>
                    {t("single.dealButton")}
                  </button>
                </div>
                {shareState && <p className="shareState">{shareState}</p>}
                <button className="utilityButton" type="button" onClick={handleExploreNearby}>
                  {t("single.exploreNearby")}
                  <img src="/pin.png" alt="" />
                </button>
              </div>
              <div className="user">
                <SafeImage src={post.user?.avatar} fallback="/noavatar.jpg" alt={post.user?.username || t("single.owner")} />
                <span>{post.user?.username || t("single.unknownUser")}</span>
                <small>{t(`single.ownership.${intelligence.ownershipType}`)}</small>
              </div>
            </div>
            <div className="insightGrid">
              {insightCards.map((item) => (
                <article key={item.label} className="insightCard">
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                  <small>{item.hint}</small>
                </article>
              ))}
            </div>
            <section className="mediaPreviewSection">
              <div className="sectionCopy">
                <span className="accentLabel">{t("single.mediaLabel")}</span>
                <h2>{t("single.mediaTitle")}</h2>
              </div>
              <div className="mediaGrid">
                {mediaFeatures.map((item) => (
                  <article key={item.title} className="mediaCard">
                    <strong>{item.title}</strong>
                    <span>{item.value}</span>
                  </article>
                ))}
              </div>
            </section>
            <div
              className="bottom"
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(post.postDetail?.desc || ""),
              }}
            />
            {relatedPosts.length > 0 && (
              <section className="relatedSection">
                <div className="relatedHeader">
                  <div>
                    <span className="accentLabel">{t("single.similarEyebrow")}</span>
                    <h2>{t("single.similarTitle")}</h2>
                  </div>
                </div>
                <List
                  posts={relatedPosts}
                  compareIds={compareIds}
                  onToggleCompare={handleToggleCompare}
                  marketContext={marketContext}
                />
              </section>
            )}
          </div>
        </div>
      </div>

      <div className="features">
        <div className="wrapper">
          <section className="sectionCard">
            <p className="title">{t("single.factsTitle")}</p>
            <div className="factsGrid">
              {factItems.map((item) => (
                <div key={item.label} className="factCard">
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>
          </section>

          <section className="sectionCard">
            <p className="title">{t("single.priceHistoryTitle")}</p>
            <div className="priceHistoryCard">
              <div className="priceHistoryRow">
                {priceHistoryItems.map((item) => (
                  <article key={item.label} className="priceHistoryPoint">
                    <span>{item.label}</span>
                    <strong>{formatCurrency(item.value)}</strong>
                  </article>
                ))}
              </div>
              <div className="valuationBand">
                <article>
                  <span>{t("single.valuationRange")}</span>
                  <strong>
                    {formatCurrency(intelligence.valuationRange.low)} — {formatCurrency(intelligence.valuationRange.high)}
                  </strong>
                </article>
                <article>
                  <span>{t("single.marketPosition")}</span>
                  <strong>{marketPosition}</strong>
                </article>
              </div>
            </div>
          </section>

          <section className="sectionCard">
            <p className="title">{t("single.general")}</p>
            <div className="listVertical">
              <div className="feature">
                <img src="/utility.png" alt="" />
                <div className="featureText">
                  <span>{t("single.utilities")}</span>
                  <p>{utilitiesLabel}</p>
                </div>
              </div>
              <div className="feature">
                <img src="/pet.png" alt="" />
                <div className="featureText">
                  <span>{t("single.petPolicy")}</span>
                  <p>{petLabel}</p>
                </div>
              </div>
              <div className="feature">
                <img src="/fee.png" alt="" />
                <div className="featureText">
                  <span>{t("single.incomePolicy")}</span>
                  <p>{post.postDetail?.income || t("single.notProvided")}</p>
                </div>
              </div>
            </div>
          </section>

          <section className="sectionCard mortgageSection">
            <p className="title">{t("single.mortgageTitle")}</p>
            {post.type === "rent" ? (
              <p className="sectionMuted">{t("single.mortgageRentHint")}</p>
            ) : (
              <>
                <div className="mortgageStats">
                  <article>
                    <span>{t("single.estMonthly")}</span>
                    <strong>{formatCurrency(monthlyPayment)}</strong>
                  </article>
                  <article>
                    <span>{t("single.downPayment")}</span>
                    <strong>{formatCurrency(downPayment)}</strong>
                  </article>
                  <article>
                    <span>{t("single.affordabilityTitle")}</span>
                    <strong>{affordabilityBudget ? formatCurrency(affordabilityBudget) : "—"}</strong>
                  </article>
                </div>
                <label className="budgetField">
                  <span>{t("single.affordabilityInput")}</span>
                  <input
                    type="number"
                    value={monthlyBudget}
                    onChange={(event) => setMonthlyBudget(event.target.value)}
                    placeholder="85000"
                  />
                </label>
                <div className="partnerGrid">
                  {MORTGAGE_PARTNERS.map((partner) => (
                    <article key={partner.id} className="partnerCard">
                      <strong>{partner.name}</strong>
                      <span>{partner.rate.toFixed(2)}%</span>
                      <small>{partner.feeLabel}</small>
                    </article>
                  ))}
                </div>
              </>
            )}
          </section>

          <section className="sectionCard">
            <p className="title">{t("single.neighborhoodTitle")}</p>
            <div className="neighborhoodGrid">
              {neighborhoodCards.map((item) => (
                <article key={item.label} className="neighborhoodCard">
                  <strong>{item.label}</strong>
                  <span>{item.value}</span>
                </article>
              ))}
            </div>
          </section>

          <section className="sectionCard">
            <p className="title">{t("single.sizes")}</p>
            <div className="sizes">
              <div className="size">
                <img src="/size.png" alt="" />
                <span>{area ? `${area} sqft` : t("single.notProvided")}</span>
              </div>
              <div className="size">
                <img src="/bed.png" alt="" />
                <span>{t("single.beds", { count: post.bedroom })}</span>
              </div>
              <div className="size">
                <img src="/bath.png" alt="" />
                <span>{t("single.bathrooms", { count: post.bathroom })}</span>
              </div>
            </div>
          </section>

          <section className="sectionCard">
            <p className="title">{t("single.nearbyPlaces")}</p>
            <div className="listHorizontal">
              <div className="feature">
                <img src="/school.png" alt="" />
                <div className="featureText">
                  <span>{t("single.school")}</span>
                  <p>{t("single.away", { distance: post.postDetail?.school })}</p>
                </div>
              </div>
              <div className="feature">
                <img src="/pet.png" alt="" />
                <div className="featureText">
                  <span>{t("single.busStop")}</span>
                  <p>{t("single.away", { distance: post.postDetail?.bus })}</p>
                </div>
              </div>
              <div className="feature">
                <img src="/fee.png" alt="" />
                <div className="featureText">
                  <span>{t("single.restaurant")}</span>
                  <p>{t("single.away", { distance: post.postDetail?.restaurant })}</p>
                </div>
              </div>
            </div>
          </section>

          <section className="sectionCard trustSection">
            <p className="title">{t("single.trustTitle")}</p>
            <div className="verificationList">
              {verificationItems.map((item) => (
                <div key={item.label} className={`verificationItem${item.done ? " done" : ""}`}>
                  <span className="check">{item.done ? "✓" : "•"}</span>
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
            <p className="antiFraudNote">{t("single.antiFraudNote")}</p>
          </section>

          <section className="sectionCard">
            <p className="title">{t("single.location")}</p>
            <div className="mapContainer">
              <Map items={[post]} />
            </div>
          </section>

          <section className="sectionCard scheduleSection" ref={scheduleRef}>
            <p className="title">{t("single.scheduleViewingTitle")}</p>
            <form className="viewingForm" onSubmit={handleViewingRequest}>
              <div className="formGrid">
                <label>
                  <span>{t("single.viewingDate")}</span>
                  <input
                    type="date"
                    value={viewingForm.preferredDate}
                    onChange={(event) => handleViewingChange("preferredDate", event.target.value)}
                    required
                  />
                </label>
                <label>
                  <span>{t("single.viewingTime")}</span>
                  <input
                    type="time"
                    value={viewingForm.preferredTime}
                    onChange={(event) => handleViewingChange("preferredTime", event.target.value)}
                    required
                  />
                </label>
                <label>
                  <span>{t("single.viewingParty")}</span>
                  <select value={viewingForm.partySize} onChange={(event) => handleViewingChange("partySize", event.target.value)}>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4+</option>
                  </select>
                </label>
              </div>
              <textarea
                value={viewingForm.message}
                onChange={(event) => handleViewingChange("message", event.target.value)}
                placeholder={t("single.viewingMessage")}
                rows={4}
              />
              <div className="viewingActions">
                <button type="submit" className="railAccent">{t("single.scheduleViewing")}</button>
                <Link to="/profile?tab=deals" className="inlineLink">{t("single.openProfileDeals")}</Link>
              </div>
              {viewingSuccess && <p className="successNote">{viewingSuccess}</p>}
            </form>
          </section>

          {currentUser && currentUser.id !== post.userId && (
            <section className="sectionCard dealRequestPanel" ref={dealRef}>
              <div className="dealRequestHeader">
                <div>
                  <span className="accentLabel">{t("single.dealFlow")}</span>
                  <h3>{t("single.openDeal")}</h3>
                </div>
                <span className="dealHint">{t("single.dealHint")}</span>
              </div>
              <textarea
                value={dealNote}
                onChange={(event) => setDealNote(event.target.value)}
                placeholder={t("single.dealPlaceholder")}
                rows={4}
              />
              <button type="button" className="dealButton" onClick={handleCreateDeal} disabled={requestingDeal}>
                {requestingDeal ? t("single.dealOpening") : t("single.dealButton")}
              </button>
            </section>
          )}

          <section className="sectionCard ctaSummary">
            <button
              type="button"
              className={`saveButton${saved ? " saved" : ""}`}
              onClick={handleSave}
            >
              {saved ? t("single.saved") : t("single.save")}
            </button>
            <button
              type="button"
              className={`compareButton${isCompared ? " active" : ""}`}
              onClick={() => handleToggleCompare(post.id)}
            >
              {isCompared ? t("card.compared") : t("card.compare")}
            </button>
            <button type="button" className="contactButton" onClick={handleContactOwner}>
              {t("single.contact", { value: ownerMobile || t("single.notProvided") })}
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}

export default SinglePage;
