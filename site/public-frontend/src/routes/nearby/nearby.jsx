import List from "../../components/list/List";
import { useLocation } from "react-router-dom";
import "./nearby.scss";
import { useLanguage } from "../../context/LanguageContext";

const Nearby = () => {
  const location = useLocation();
  const { t } = useLanguage();
  const nearbyPosts = location.state?.nearbyPosts;

  if (!nearbyPosts || !Array.isArray(nearbyPosts)) {
    return <p>{t("nearby.noData")}</p>;
  }

  if (nearbyPosts.length === 0) {
    return <p>{t("nearby.empty")}</p>;
  }

  return (
    <div className="nearbyContainer">
      <List posts={nearbyPosts} />
    </div>
  );
};

export default Nearby;
