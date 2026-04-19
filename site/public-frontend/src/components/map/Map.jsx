import { Circle, MapContainer, TileLayer, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useMemo } from "react";
import "./map.scss";
import Pin from "../pin/Pin";
import { useLanguage } from "../../context/LanguageContext";

L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

function isValidCoordinate(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function FitBounds({ items, activeItemId, searchArea }) {
  const map = useMap();

  useEffect(() => {
    if (searchArea?.center) {
      map.setView([searchArea.center.latitude, searchArea.center.longitude], 12, { animate: true });
      return;
    }

    const activeItem = (items || []).find((item) => item.id === activeItemId);
    if (activeItem) {
      map.flyTo([activeItem.latitude, activeItem.longitude], 12, { duration: 0.7 });
      return;
    }

    if ((items || []).length > 1) {
      const bounds = L.latLngBounds(items.map((item) => [item.latitude, item.longitude]));
      map.fitBounds(bounds.pad(0.18));
      return;
    }

    if ((items || []).length === 1) {
      map.setView([items[0].latitude, items[0].longitude], 12);
    }
  }, [activeItemId, items, map, searchArea]);

  return null;
}

function DraftAreaPicker({ drawingMode, draftArea, onDraftAreaChange }) {
  useMapEvents({
    click(event) {
      if (!drawingMode) {
        return;
      }

      onDraftAreaChange?.({
        center: {
          latitude: event.latlng.lat,
          longitude: event.latlng.lng,
        },
        radiusKm: draftArea?.radiusKm || 5,
      });
    },
  });

  return null;
}

function Map({
  items,
  activeItemId,
  onSelectItem,
  showSearchControls = false,
  searchArea,
  draftArea,
  isDrawingArea = false,
  onDraftAreaChange,
  onToggleDrawMode,
  onApplyArea,
  onResetArea,
}) {
  const { language, t } = useLanguage();
  const mapItems = useMemo(
    () =>
      (items || []).filter(
        (item) => isValidCoordinate(item.latitude) && isValidCoordinate(item.longitude)
      ),
    [items]
  );

  const center = useMemo(() => {
    if (mapItems.length === 1) {
      return [mapItems[0].latitude, mapItems[0].longitude];
    }
    return [18.5204, 73.8567];
  }, [mapItems]);

  if (!mapItems.length) {
    return (
      <div className="map mapFallback">
        <p>{language === "ru" ? "Для текущих объектов нет геолокации." : "No geolocation for current listings."}</p>
      </div>
    );
  }

  return (
    <div className="mapShell">
      {showSearchControls && (
        <div className="mapToolbar">
          <div className="toolbarCopy">
            <strong>{t("map.searchAreaTitle")}</strong>
            <span>{t("map.searchAreaHint")}</span>
          </div>
          <div className="toolbarActions">
            <button type="button" className={isDrawingArea ? "ghost active" : "ghost"} onClick={() => onToggleDrawMode?.()}>
              {isDrawingArea ? t("map.drawingOn") : t("map.drawArea")}
            </button>
            {draftArea?.center && (
              <div className="radiusGroup">
                {[3, 5, 8].map((radius) => (
                  <button
                    key={radius}
                    type="button"
                    className={draftArea?.radiusKm === radius ? "active" : ""}
                    onClick={() => onDraftAreaChange?.({ ...draftArea, radiusKm: radius })}
                  >
                    {t("map.radiusValue", { value: radius })}
                  </button>
                ))}
              </div>
            )}
            <button type="button" onClick={() => onApplyArea?.()}>{t("map.searchThisArea")}</button>
            <button type="button" className="ghost" onClick={() => onResetArea?.()}>{t("map.resetArea")}</button>
          </div>
        </div>
      )}

      <MapContainer center={center} zoom={7} scrollWheelZoom={false} className="map">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds items={mapItems} activeItemId={activeItemId} searchArea={searchArea} />
        <DraftAreaPicker drawingMode={isDrawingArea} draftArea={draftArea} onDraftAreaChange={onDraftAreaChange} />
        {draftArea?.center && (
          <Circle
            center={[draftArea.center.latitude, draftArea.center.longitude]}
            radius={Number(draftArea.radiusKm || 5) * 1000}
            pathOptions={{ color: "#8f5cf6", fillColor: "#8f5cf6", fillOpacity: 0.08 }}
          />
        )}
        {mapItems.map((item) => (
          <Pin
            item={item}
            key={item.id}
            isActive={activeItemId === item.id}
            onSelectItem={onSelectItem}
          />
        ))}
      </MapContainer>
    </div>
  );
}

export default Map;
