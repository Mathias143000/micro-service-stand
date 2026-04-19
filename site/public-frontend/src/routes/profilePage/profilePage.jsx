import List from "../../components/list/List";
import ProfileDealList from "../../components/profileDealList/ProfileDealList";
import "./profilePage.scss";
import apiRequest from "../../lib/apiRequest";
import { Await, Link, useLoaderData, useNavigate, useSearchParams } from "react-router-dom";
import { Suspense, useContext, useEffect, useMemo, useState } from "react";
import { AuthContext } from "../../context/AuthContext";
import SafeImage from "../../components/safeImage/SafeImage";
import { useLanguage } from "../../context/LanguageContext";
import { formatCurrency } from "../../lib/marketplaceExperience";
import { getViewingRequests } from "../../lib/marketplaceIntelligence";

function ProfileSections({ initialProfileData, activeTab, t, language }) {
  const [profileData, setProfileData] = useState(initialProfileData);
  const [sectionError, setSectionError] = useState("");
  const [viewingRequests, setViewingRequests] = useState(() => getViewingRequests());

  useEffect(() => {
    setProfileData(initialProfileData);
  }, [initialProfileData]);

  useEffect(() => {
    const refresh = () => setViewingRequests(getViewingRequests());
    window.addEventListener("storage", refresh);
    return () => window.removeEventListener("storage", refresh);
  }, []);

  const listingsCount = profileData.userPosts?.length || 0;
  const savedCount = profileData.savedPosts?.length || 0;
  const dealsCount = profileData.deals?.length || 0;
  const watchedAlertsCount = profileData.savedPosts?.filter((post) => post.priceAlertEnabled).length || 0;
  const priceDropsCount = profileData.savedPosts?.filter((post) => post.priceDropDetected).length || 0;
  const savingsOpportunity = (profileData.savedPosts || []).reduce(
    (sum, post) => sum + (Number(post.priceDropAmount) || 0),
    0
  );

  const handleTogglePriceAlert = async (postId, enabled) => {
    const previousSavedPosts = profileData.savedPosts;
    setSectionError("");
    setProfileData((current) => ({
      ...current,
      savedPosts: current.savedPosts.map((post) =>
        post.id === postId ? { ...post, priceAlertEnabled: enabled } : post
      ),
    }));

    try {
      await apiRequest.post("/api/favorites/price-alert", { postId, enabled });
    } catch (error) {
      console.log(error);
      setProfileData((current) => ({
        ...current,
        savedPosts: previousSavedPosts,
      }));
      setSectionError(t("profile.alertToggleError"));
    }
  };

  const formatViewingDate = (request) => {
    if (!request?.preferredDate) {
      return t("profile.viewingPending");
    }

    try {
      return new Date(`${request.preferredDate}T${request.preferredTime || "10:00"}`).toLocaleString(
        language === "ru" ? "ru-RU" : "en-US",
        {
          day: "2-digit",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        }
      );
    } catch {
      return `${request.preferredDate} ${request.preferredTime || ""}`.trim();
    }
  };

  return (
    <>
      <section className="quickStats">
        <article>
          <strong>{listingsCount}</strong>
          <span>{t("profile.listings")}</span>
        </article>
        <article>
          <strong>{savedCount}</strong>
          <span>{t("profile.favorites")}</span>
        </article>
        <article>
          <strong>{dealsCount}</strong>
          <span>{t("profile.activeDeals")}</span>
        </article>
        <article>
          <strong>{viewingRequests.length}</strong>
          <span>{t("profile.viewingsCount")}</span>
        </article>
      </section>

      {activeTab === "listings" && (
        <section className="profileSection">
          <div className="title">
            <div>
              <span className="eyebrow">{t("profile.inventoryEyebrow")}</span>
              <h2>{t("profile.inventoryTitle")}</h2>
            </div>
            <Link to="/add" className="actionLink">
              {t("profile.createPost")}
            </Link>
          </div>
          <List
            posts={profileData.userPosts}
            emptyTitle={t("profile.emptyListingsTitle")}
            emptyDescription={t("profile.emptyListingsDescription")}
          />
        </section>
      )}

      {activeTab === "saved" && (
        <>
          {savedCount > 0 && (
            <section className="savedAlertSummary">
              <div className="title">
                <div>
                  <span className="eyebrow">{t("profile.savedAlertsEyebrow")}</span>
                  <h2>{t("profile.savedAlertsTitle")}</h2>
                  <p>{t("profile.savedAlertsDescription")}</p>
                </div>
              </div>
              <div className="savedAlertGrid">
                <article>
                  <strong>{watchedAlertsCount}</strong>
                  <span>{t("profile.alertsEnabledCount")}</span>
                </article>
                <article>
                  <strong>{priceDropsCount}</strong>
                  <span>{t("profile.priceDropsCount")}</span>
                </article>
                <article>
                  <strong>{savingsOpportunity > 0 ? formatCurrency(savingsOpportunity) : "—"}</strong>
                  <span>{t("profile.savingsOpportunity")}</span>
                </article>
              </div>
            </section>
          )}

          <section className="profileSection">
            <div className="title">
              <div>
                <span className="eyebrow">{t("profile.savedEyebrow")}</span>
                <h2>{t("profile.savedTitle")}</h2>
              </div>
            </div>
            {sectionError && <p className="sectionError">{sectionError}</p>}
            <List
              posts={profileData.savedPosts}
              emptyTitle={t("profile.emptySavedTitle")}
              emptyDescription={t("profile.emptySavedDescription")}
              showPriceAlertControls
              onTogglePriceAlert={handleTogglePriceAlert}
            />
          </section>
        </>
      )}

      {activeTab === "deals" && (
        <>
          <section className="profileSection viewingSection">
            <div className="title">
              <div>
                <span className="eyebrow">{t("profile.viewingsEyebrow")}</span>
                <h2>{t("profile.viewingsTitle")}</h2>
              </div>
            </div>
            {viewingRequests.length > 0 ? (
              <div className="viewingGrid">
                {viewingRequests.map((request) => (
                  <article key={request.id} className="viewingCard">
                    <strong>{request.postTitle}</strong>
                    <span>{formatViewingDate(request)}</span>
                    <p>{request.postAddress}</p>
                    <small>{request.message || t("profile.viewingNoMessage")}</small>
                  </article>
                ))}
              </div>
            ) : (
              <div className="dealListEmpty">
                <h3>{t("profile.viewingEmptyTitle")}</h3>
                <p>{t("profile.viewingEmptyDescription")}</p>
              </div>
            )}
          </section>

          <section className="profileSection">
            <div className="title">
              <div>
                <span className="eyebrow">{t("profile.dealsEyebrow")}</span>
                <h2>{t("profile.dealsTitle")}</h2>
              </div>
            </div>
            <ProfileDealList deals={profileData.deals} />
          </section>
        </>
      )}
    </>
  );
}

function ProfilePage() {
  const data = useLoaderData();
  const { updateUser, currentUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { language, t } = useLanguage();
  const activeTab = searchParams.get("tab") || "listings";

  const tabs = useMemo(
    () => [
      { id: "listings", label: t("profile.listings") },
      { id: "saved", label: t("profile.favorites") },
      { id: "deals", label: t("profile.activeDeals") },
    ],
    [t]
  );

  const handleLogout = async () => {
    try {
      await apiRequest.post("/auth/logout");
      updateUser(null);
      navigate("/");
    } catch (err) {
      console.log(err);
    }
  };

  const switchTab = (tabId) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("tab", tabId);
    setSearchParams(nextParams, { replace: true });
  };

  return (
    <div className="profilePage">
      <div className="details">
        <div className="wrapper">
          <section className="profileHero">
            <div className="profileIdentity">
              <SafeImage src={currentUser.avatar} fallback="/noavatar.jpg" alt={currentUser.username} />
              <div>
                <span className="eyebrow">{t("profile.eyebrow")}</span>
                <h1>{currentUser.username}</h1>
                {currentUser.email && <p>{currentUser.email}</p>}
                <p>{currentUser.mobile_number || t("profile.phoneMissing")}</p>
              </div>
            </div>
            <div className="profileActions">
              <Link to="/profile/update" className="actionLink">
                {t("profile.updateProfile")}
              </Link>
              <button onClick={handleLogout} className="secondaryAction">{t("profile.logout")}</button>
            </div>
          </section>

          <div className="tabsBar">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={activeTab === tab.id ? "tab active" : "tab"}
                onClick={() => switchTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <Suspense fallback={<div className="profileSkeleton" />}>
            <Await resolve={data.postResponse} errorElement={<p>{t("profile.loadError")}</p>}>
              {(postResponse) => (
                <ProfileSections
                  initialProfileData={postResponse.data}
                  activeTab={activeTab}
                  t={t}
                  language={language}
                />
              )}
            </Await>
          </Suspense>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
