import { useEffect, useMemo, useState } from "react";
import "./slider.scss";
import SafeImage from "../safeImage/SafeImage";
import { useLanguage } from "../../context/LanguageContext";
import {
  buildListingGallerySections,
  getListingImageCategoryMeta,
  normalizeListingGalleryItems,
} from "../../lib/listingImages";

function Slider({ images, title }) {
  const { t } = useLanguage();
  const galleryItems = useMemo(() => normalizeListingGalleryItems(images), [images]);
  const gallerySections = useMemo(() => buildListingGallerySections(images), [images]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    setActiveIndex(0);
  }, [images]);

  useEffect(() => {
    if (!galleryItems.length) {
      return undefined;
    }

    if (!isFullscreen) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsFullscreen(false);
      }

      if (event.key === "ArrowLeft") {
        setActiveIndex((current) => (current === 0 ? galleryItems.length - 1 : current - 1));
      }

      if (event.key === "ArrowRight") {
        setActiveIndex((current) => (current === galleryItems.length - 1 ? 0 : current + 1));
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [galleryItems.length, isFullscreen]);

  const activeImage = galleryItems[activeIndex] || null;
  const activeMeta = getListingImageCategoryMeta(activeImage?.category);

  const moveSlide = (direction) => {
    if (!galleryItems.length) {
      return;
    }

    setActiveIndex((current) => {
      if (direction === "left") {
        return current === 0 ? galleryItems.length - 1 : current - 1;
      }

      return current === galleryItems.length - 1 ? 0 : current + 1;
    });
  };

  const jumpToCategory = (category) => {
    const nextIndex = galleryItems.findIndex((item) => item.category === category);
    if (nextIndex >= 0) {
      setActiveIndex(nextIndex);
    }
  };

  if (!galleryItems.length) {
    return (
      <section className="slider empty">
        <div className="emptyGallery">
          <div className="emptyPreview">
            <SafeImage src={null} fallback="/bg.jpg" alt={t("gallery.emptyTitle")} />
          </div>
          <div className="emptyCopy">
            <span className="eyebrow">{t("gallery.label")}</span>
            <h2>{t("gallery.emptyTitle")}</h2>
            <p>{t("gallery.emptyDescription")}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="slider">
      <div className="heroColumn">
        <button type="button" className="heroFrame" onClick={() => setIsFullscreen(true)}>
          <SafeImage src={activeImage.url} fallback="/bg.jpg" alt={title || t("gallery.label")} />
          <div className="heroOverlay">
            <div className="heroCopy">
              <span className="eyebrow">{t("gallery.label")}</span>
              <strong>{t(activeMeta.titleKey)}</strong>
              <small>{t("gallery.counter", { current: activeIndex + 1, total: galleryItems.length })}</small>
            </div>
            <span className="heroAction">{t("gallery.openFullscreen")}</span>
          </div>
        </button>

        <div className="gallerySummary">
          <div className="summaryCopy">
            <span className="eyebrow subtle">{t("gallery.sequenceLabel")}</span>
            <strong>{t("gallery.sequenceTitle")}</strong>
            <p>{t("gallery.sequenceDescription")}</p>
          </div>
          <div className="summaryChips">
            {gallerySections.map((section) => {
              const isActive = activeImage?.category === section.value;

              return (
                <button
                  key={section.value}
                  type="button"
                  className={`summaryChip${isActive ? " active" : ""}`}
                  onClick={() => jumpToCategory(section.value)}
                >
                  <span>{t(section.titleKey)}</span>
                  <strong>{section.items.length}</strong>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="thumbRail">
        {galleryItems.map((image, index) => {
          const imageMeta = getListingImageCategoryMeta(image.category);
          const isActive = index === activeIndex;

          return (
            <button
              key={image.id}
              type="button"
              className={`thumbCard${isActive ? " active" : ""}`}
              onClick={() => setActiveIndex(index)}
            >
              <SafeImage src={image.url} fallback="/bg.jpg" alt={t(imageMeta.titleKey)} />
              <div className="thumbCopy">
                <span>{t(imageMeta.titleKey)}</span>
                <small>{t("gallery.photoLabel", { count: index + 1 })}</small>
              </div>
            </button>
          );
        })}
      </div>

      {isFullscreen && (
        <div className="fullSlider" role="dialog" aria-modal="true" aria-label={t("gallery.label")}>
          <div className="lightboxShell">
            <div className="lightboxHeader">
              <div className="lightboxCopy">
                <span className="eyebrow">{t("gallery.fullscreenLabel")}</span>
                <h2>{title || t("gallery.label")}</h2>
                <p>{t("gallery.counter", { current: activeIndex + 1, total: galleryItems.length })}</p>
              </div>
              <button type="button" className="closeButton" onClick={() => setIsFullscreen(false)}>
                {t("gallery.close")}
              </button>
            </div>

            <div className="lightboxCategories">
              {gallerySections.map((section) => (
                <button
                  key={`fullscreen-${section.value}`}
                  type="button"
                  className={`lightboxCategory${activeImage?.category === section.value ? " active" : ""}`}
                  onClick={() => jumpToCategory(section.value)}
                >
                  {t(section.titleKey)}
                </button>
              ))}
            </div>

            <div className="lightboxBody">
              <button
                type="button"
                className="navArrow"
                onClick={() => moveSlide("left")}
                aria-label={t("gallery.previous")}
              >
                <img src="/arrow.png" alt="" />
              </button>
              <div className="lightboxImage">
                <SafeImage src={activeImage.url} fallback="/bg.jpg" alt={title || t(activeMeta.titleKey)} />
              </div>
              <button
                type="button"
                className="navArrow"
                onClick={() => moveSlide("right")}
                aria-label={t("gallery.next")}
              >
                <img src="/arrow.png" className="right" alt="" />
              </button>
            </div>

            <div className="filmstrip">
              {galleryItems.map((image, index) => {
                const imageMeta = getListingImageCategoryMeta(image.category);

                return (
                  <button
                    key={`film-${image.id}`}
                    type="button"
                    className={`filmThumb${index === activeIndex ? " active" : ""}`}
                    onClick={() => setActiveIndex(index)}
                  >
                    <SafeImage src={image.url} fallback="/bg.jpg" alt={t(imageMeta.titleKey)} />
                    <span>{t(imageMeta.titleKey)}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default Slider;
