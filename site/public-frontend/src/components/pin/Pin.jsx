import { useEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "./pin.scss";
import SafeImage from "../safeImage/SafeImage";
import { useLanguage } from "../../context/LanguageContext";
import { getCityLabel } from "../../lib/siteCatalog";
import { getPrimaryListingImage } from "../../lib/listingImages";
import { formatRoomCount } from "../../lib/formatRoomCount";

function createMarkerIcon(isActive) {
  return L.divIcon({
    className: "marketMarkerWrap",
    html: `<span class="marketMarker${isActive ? " active" : ""}"></span>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

function Pin({ item, isActive = false, onSelectItem }) {
  const markerRef = useRef(null);
  const { language, t } = useLanguage();
  const coverImage = getPrimaryListingImage(item.imageGallery?.length ? item.imageGallery : item.images);
  const icon = useMemo(() => createMarkerIcon(isActive), [isActive]);

  useEffect(() => {
    if (isActive) {
      markerRef.current?.openPopup();
    } else {
      markerRef.current?.closePopup();
    }
  }, [isActive]);

  if (!Number.isFinite(item.latitude) || !Number.isFinite(item.longitude)) {
    return null;
  }

  return (
    <Marker
      ref={markerRef}
      position={[item.latitude, item.longitude]}
      icon={icon}
      eventHandlers={{
        click: () => onSelectItem?.(item.id),
        mouseover: () => onSelectItem?.(item.id),
      }}
    >
      <Popup>
        <div className="popupContainer">
          <SafeImage src={coverImage} fallback="/bg.jpg" alt={item.title} />
          <div className="textContainer">
            <Link to={`/${item.id}`}>{item.title}</Link>
            <span>{formatRoomCount("bedroom", item.bedroom, language)}</span>
            <span>{item.city ? getCityLabel(item.city, language) : t("card.cityFallback")}</span>
            <b>Rs {item.price}</b>
          </div>
        </div>
      </Popup>
    </Marker>
  );
}

export default Pin;
