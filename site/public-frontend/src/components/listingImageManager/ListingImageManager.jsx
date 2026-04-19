import SafeImage from "../safeImage/SafeImage";
import { useLanguage } from "../../context/LanguageContext";
import { LISTING_IMAGE_CATEGORIES } from "../../lib/listingImages";

function ListingImageManager({
  existingImages = [],
  pendingImages = [],
  missingCategories = [],
  onFilesSelected,
  onRemoveExistingImage,
  onRemovePendingImage,
  onExistingCategoryChange,
  onPendingCategoryChange,
}) {
  const { t } = useLanguage();
  const missingSet = new Set(missingCategories);

  const renderPreviewCard = (image, isPending) => {
    const onCategoryChange = isPending ? onPendingCategoryChange : onExistingCategoryChange;
    const onRemove = isPending ? onRemovePendingImage : onRemoveExistingImage;

    return (
      <div key={image.id} className="previewCard">
        <SafeImage
          src={image.previewUrl || image.url}
          fallback="/bg.jpg"
          alt={t("forms.photoCategoryLabel")}
        />
        <label className="previewMeta">
          <span>{t("forms.photoCategoryLabel")}</span>
          <select value={image.category} onChange={(event) => onCategoryChange(image.id, event.target.value)}>
            {LISTING_IMAGE_CATEGORIES.map((option) => (
              <option key={option.value} value={option.value}>
                {t(option.titleKey)}
              </option>
            ))}
          </select>
        </label>
        <button type="button" onClick={() => onRemove(image.id)}>
          {t("forms.remove")}
        </button>
      </div>
    );
  };

  return (
    <div className="sideContainer">
      <div className="photoRequirements">
        <div className="photoRequirementsCopy">
          <span className="eyebrow">{t("forms.photoRequirementsTitle")}</span>
          <p>{t("forms.photoRequirementsDescription")}</p>
        </div>
        <span className="coverageHint">{t("forms.photoCoverageHint")}</span>
      </div>

      {LISTING_IMAGE_CATEGORIES.map((category) => {
        const categoryExistingImages = existingImages.filter((image) => image.category === category.value);
        const categoryPendingImages = pendingImages.filter((image) => image.category === category.value);
        const totalImages = categoryExistingImages.length + categoryPendingImages.length;

        return (
          <section
            key={category.value}
            className={`mediaSection ${missingSet.has(category.value) ? "isMissing" : ""}`}
          >
            <div className="mediaSectionHeader">
              <div>
                <h2>{t(category.titleKey)}</h2>
                <p>{t(category.descriptionKey)}</p>
              </div>
              <span className="mediaCount">{t("forms.photoCount", { count: totalImages })}</span>
            </div>

            <label className="uploadButton">
              {t(category.buttonKey)}
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(event) => onFilesSelected(category.value, event)}
              />
            </label>

            {totalImages === 0 ? (
              <div className="mediaEmpty">{t("forms.photoEmptyState")}</div>
            ) : (
              <div className="previewGrid">
                {categoryExistingImages.map((image) => renderPreviewCard(image, false))}
                {categoryPendingImages.map((image) => renderPreviewCard(image, true))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}

export default ListingImageManager;
