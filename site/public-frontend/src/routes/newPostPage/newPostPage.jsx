import { useState } from "react";
import "./newPostPage.scss";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import apiRequest from "../../lib/apiRequest";
import { useNavigate } from "react-router-dom";
import {
  buildImageGalleryPayload,
  createPendingImageItems,
  getMissingRequiredImageCategories,
  uploadListingImages,
} from "../../lib/listingImages";
import { useLanguage } from "../../context/LanguageContext";
import { CITY_OPTIONS, PROPERTY_OPTIONS } from "../../lib/siteCatalog";
import ListingImageManager from "../../components/listingImageManager/ListingImageManager";

function categoryLabelKey(category) {
  switch (category) {
    case "interior":
      return "forms.photoCategoryInterior";
    case "floorplan":
      return "forms.photoCategoryFloorPlan";
    default:
      return "forms.photoCategoryExterior";
  }
}

function buildPayload(inputs, description, imageGallery, published) {
  return {
    postData: {
      title: inputs.title,
      price: parseInt(inputs.price, 10),
      address: inputs.address,
      city: inputs.city,
      bedroom: parseInt(inputs.bedroom, 10),
      bathroom: parseInt(inputs.bathroom, 10),
      type: inputs.type,
      property: inputs.property,
      latitude: inputs.latitude,
      longitude: inputs.longitude,
      published,
      images: imageGallery.map((image) => image.url),
      imageGallery: buildImageGalleryPayload(imageGallery),
    },
    postDetail: {
      desc: description,
      utilities: inputs.utilities,
      pet: inputs.pet,
      income: inputs.income,
      size: parseInt(inputs.size, 10),
      school: parseInt(inputs.school, 10),
      bus: parseInt(inputs.bus, 10),
      restaurant: parseInt(inputs.restaurant, 10),
    },
  };
}

function NewPostPage() {
  const [value, setValue] = useState("");
  const [pendingImages, setPendingImages] = useState([]);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { language, t } = useLanguage();
  const navigate = useNavigate();

  const handleFilesSelected = (category, event) => {
    const nextItems = createPendingImageItems(event.target.files, category);
    setPendingImages((prev) => [...prev, ...nextItems]);
    event.target.value = "";
  };

  const handleRemovePendingImage = (imageId) => {
    setPendingImages((prev) => prev.filter((item) => item.id !== imageId));
  };

  const handlePendingImageCategoryChange = (imageId, category) => {
    setPendingImages((prev) =>
      prev.map((item) => (item.id === imageId ? { ...item, category } : item))
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const missingCategories = getMissingRequiredImageCategories([], pendingImages);
    if (missingCategories.length > 0) {
      const missingLabels = missingCategories.map((category) => t(categoryLabelKey(category))).join(", ");
      setError(`${t("forms.photoCategoryMissing")}: ${missingLabels}`);
      return;
    }

    setIsSubmitting(true);

    const formData = new FormData(e.target);
    const inputs = Object.fromEntries(formData);

    try {
      const draftPayload = buildPayload(inputs, value, [], false);
      const draftResponse = await apiRequest.post("/posts", draftPayload);
      const listingId = draftResponse.data.id;
      const uploadedImages = await uploadListingImages(listingId, pendingImages);
      const publishPayload = buildPayload(inputs, value, uploadedImages, true);

      await apiRequest.put(`/posts/${listingId}`, publishPayload);
      navigate(`/${listingId}`);
    } catch (err) {
      console.log(err);
      setError(err.response?.data?.message || t("forms.createError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="newPostPage">
      <div className="formContainer">
        <h1>{t("forms.addPost")}</h1>
        <div className="wrapper">
          <form onSubmit={handleSubmit}>
            <div className="item">
              <label htmlFor="title">{t("forms.title")}</label>
              <input id="title" name="title" type="text" required />
            </div>
            <div className="item">
              <label htmlFor="price">{t("forms.price")}</label>
              <input id="price" name="price" type="number" min={0} required />
            </div>
            <div className="item">
              <label htmlFor="address">{t("forms.address")}</label>
              <input id="address" name="address" type="text" required />
            </div>
            <div className="item description">
              <label htmlFor="desc">{t("forms.description")}</label>
              <ReactQuill theme="snow" onChange={setValue} value={value} />
            </div>
            <div className="item">
              <label htmlFor="city">{t("forms.city")}</label>
              <select id="city" name="city" defaultValue="" required>
                <option value="" disabled>
                  {t("search.allCities")}
                </option>
                {CITY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.labels[language]}
                  </option>
                ))}
              </select>
            </div>
            <div className="item">
              <label htmlFor="bedroom">{t("forms.bedrooms")}</label>
              <input min={1} id="bedroom" name="bedroom" type="number" required />
            </div>
            <div className="item">
              <label htmlFor="bathroom">{t("forms.bathrooms")}</label>
              <input min={1} id="bathroom" name="bathroom" type="number" required />
            </div>
            <div className="item">
              <label htmlFor="latitude">{t("forms.latitude")}</label>
              <input id="latitude" name="latitude" type="text" required />
            </div>
            <div className="item">
              <label htmlFor="longitude">{t("forms.longitude")}</label>
              <input id="longitude" name="longitude" type="text" required />
            </div>
            <div className="item">
              <label htmlFor="type">{t("forms.type")}</label>
              <select name="type" defaultValue="rent">
                <option value="rent">{t("search.rent")}</option>
                <option value="buy">{t("search.buy")}</option>
              </select>
            </div>
            <div className="item">
              <label htmlFor="property">{t("forms.property")}</label>
              <select name="property" defaultValue="apartment">
                {PROPERTY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {t(option.labelKey)}
                  </option>
                ))}
              </select>
            </div>
            <div className="item">
              <label htmlFor="utilities">{t("forms.utilities")}</label>
              <select name="utilities" defaultValue="owner">
                <option value="owner">{t("forms.utilitiesOwner")}</option>
                <option value="tenant">{t("forms.utilitiesTenant")}</option>
                <option value="shared">{t("forms.utilitiesShared")}</option>
              </select>
            </div>
            <div className="item">
              <label htmlFor="pet">{t("forms.petPolicy")}</label>
              <select name="pet" defaultValue="allowed">
                <option value="allowed">{t("forms.petsAllowed")}</option>
                <option value="not-allowed">{t("forms.petsNotAllowed")}</option>
              </select>
            </div>
            <div className="item">
              <label htmlFor="income">{t("forms.incomePolicy")}</label>
              <input
                id="income"
                name="income"
                type="text"
                placeholder={t("forms.incomePlaceholder")}
              />
            </div>
            <div className="item">
              <label htmlFor="size">{t("forms.size")}</label>
              <input min={0} id="size" name="size" type="number" required />
            </div>
            <div className="item">
              <label htmlFor="school">{t("forms.school")}</label>
              <input min={0} id="school" name="school" type="number" required />
            </div>
            <div className="item">
              <label htmlFor="bus">{t("forms.bus")}</label>
              <input min={0} id="bus" name="bus" type="number" required />
            </div>
            <div className="item">
              <label htmlFor="restaurant">{t("forms.restaurant")}</label>
              <input min={0} id="restaurant" name="restaurant" type="number" required />
            </div>
            <button className="sendButton" disabled={isSubmitting}>
              {isSubmitting ? t("forms.saving") : t("forms.add")}
            </button>
            {error && <span className="formError">{error}</span>}
          </form>
        </div>
      </div>

      <ListingImageManager
        existingImages={[]}
        pendingImages={pendingImages}
        missingCategories={getMissingRequiredImageCategories([], pendingImages)}
        onFilesSelected={handleFilesSelected}
        onRemoveExistingImage={() => {}}
        onRemovePendingImage={handleRemovePendingImage}
        onExistingCategoryChange={() => {}}
        onPendingCategoryChange={handlePendingImageCategoryChange}
      />
    </div>
  );
}

export default NewPostPage;
