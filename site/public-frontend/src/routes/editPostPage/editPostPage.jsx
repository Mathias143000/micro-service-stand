import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import apiRequest from "../../lib/apiRequest";
import "../newPostPage/newPostPage.scss";
import {
  buildImageGalleryPayload,
  createPendingImageItems,
  getMissingRequiredImageCategories,
  normalizeExistingImageItems,
  uploadListingImages,
} from "../../lib/listingImages";
import { useLanguage } from "../../context/LanguageContext";
import { CITY_OPTIONS, PROPERTY_OPTIONS } from "../../lib/siteCatalog";
import ListingImageManager from "../../components/listingImageManager/ListingImageManager";

function buildUpdatePayload(formData, description, imageGallery) {
  return {
    postData: {
      title: formData.title,
      price: parseInt(formData.price, 10),
      address: formData.address,
      city: formData.city,
      bedroom: parseInt(formData.bedroom, 10),
      bathroom: parseInt(formData.bathroom, 10),
      type: formData.type,
      property: formData.property,
      latitude: formData.latitude,
      longitude: formData.longitude,
      published: true,
      images: imageGallery.map((image) => image.url),
      imageGallery: buildImageGalleryPayload(imageGallery),
    },
    postDetail: {
      desc: description,
      utilities: formData.utilities,
      pet: formData.pet,
      income: formData.income,
      size: parseInt(formData.size, 10),
      school: parseInt(formData.school, 10),
      bus: parseInt(formData.bus, 10),
      restaurant: parseInt(formData.restaurant, 10),
    },
  };
}

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

function EditPostPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [value, setValue] = useState("");
  const [existingImages, setExistingImages] = useState([]);
  const [pendingImages, setPendingImages] = useState([]);
  const [formData, setFormData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { language, t } = useLanguage();

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const res = await apiRequest.get(`/posts/${id}`);
        const post = res.data;

        setFormData({
          title: post.title,
          price: post.price,
          address: post.address,
          city: post.city,
          bedroom: post.bedroom,
          bathroom: post.bathroom,
          type: post.type,
          property: post.property,
          latitude: post.latitude,
          longitude: post.longitude,
          utilities: post.postDetail.utilities,
          pet: post.postDetail.pet,
          income: post.postDetail.income,
          size: post.postDetail.size,
          school: post.postDetail.school,
          bus: post.postDetail.bus,
          restaurant: post.postDetail.restaurant,
        });

        setValue(post.postDetail.desc);
        setExistingImages(normalizeExistingImageItems(post.imageGallery?.length ? post.imageGallery : post.images));
      } catch (err) {
        setError(t("forms.loadError"));
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [id, t]);

  const missingCategories = useMemo(
    () => getMissingRequiredImageCategories(existingImages, pendingImages),
    [existingImages, pendingImages]
  );

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleFilesSelected = (category, event) => {
    const nextItems = createPendingImageItems(event.target.files, category);
    setPendingImages((prev) => [...prev, ...nextItems]);
    event.target.value = "";
  };

  const handleDeleteExistingImage = (imageId) => {
    setExistingImages((prev) => prev.filter((image) => image.id !== imageId));
  };

  const handleDeletePendingImage = (imageId) => {
    setPendingImages((prev) => prev.filter((item) => item.id !== imageId));
  };

  const handleExistingImageCategoryChange = (imageId, category) => {
    setExistingImages((prev) =>
      prev.map((image) => (image.id === imageId ? { ...image, category } : image))
    );
  };

  const handlePendingImageCategoryChange = (imageId, category) => {
    setPendingImages((prev) =>
      prev.map((image) => (image.id === imageId ? { ...image, category } : image))
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (missingCategories.length > 0) {
      const missingLabels = missingCategories.map((category) => t(categoryLabelKey(category))).join(", ");
      setError(`${t("forms.photoCategoryMissing")}: ${missingLabels}`);
      return;
    }

    setIsSubmitting(true);

    try {
      const uploadedImages = await uploadListingImages(id, pendingImages);
      const finalGallery = [...existingImages, ...uploadedImages];
      const payload = buildUpdatePayload(formData, value, finalGallery);

      await apiRequest.put(`/posts/${id}`, payload);
      navigate("/profile");
    } catch (err) {
      console.log(err);
      setError(err.response?.data?.message || t("forms.updateError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasCurrentCity =
    formData?.city && CITY_OPTIONS.some((option) => option.value === formData.city);

  if (loading) {
    return (
      <div className="newPostPage">
        <p>{t("forms.loading")}</p>
      </div>
    );
  }

  if (!formData) {
    return (
      <div className="newPostPage">
        <p>{t("forms.missingPost")}</p>
      </div>
    );
  }

  return (
    <div className="newPostPage">
      <div className="formContainer">
        <h1>{t("forms.editPost")}</h1>
        <div className="wrapper">
          <form onSubmit={handleSubmit}>
            <div className="item">
              <label htmlFor="title">{t("forms.title")}</label>
              <input id="title" name="title" type="text" value={formData.title} onChange={handleChange} />
            </div>
            <div className="item">
              <label htmlFor="price">{t("forms.price")}</label>
              <input id="price" name="price" type="number" value={formData.price} onChange={handleChange} />
            </div>
            <div className="item">
              <label htmlFor="address">{t("forms.address")}</label>
              <input id="address" name="address" type="text" value={formData.address} onChange={handleChange} />
            </div>
            <div className="item description">
              <label htmlFor="desc">{t("forms.description")}</label>
              <ReactQuill theme="snow" onChange={setValue} value={value} />
            </div>
            <div className="item">
              <label htmlFor="city">{t("forms.city")}</label>
              <select id="city" name="city" value={formData.city} onChange={handleChange}>
                {!hasCurrentCity && formData.city ? (
                  <option value={formData.city}>{formData.city}</option>
                ) : null}
                {CITY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.labels[language]}
                  </option>
                ))}
              </select>
            </div>
            <div className="item">
              <label htmlFor="bedroom">{t("forms.bedrooms")}</label>
              <input min={1} id="bedroom" name="bedroom" type="number" value={formData.bedroom} onChange={handleChange} />
            </div>
            <div className="item">
              <label htmlFor="bathroom">{t("forms.bathrooms")}</label>
              <input min={1} id="bathroom" name="bathroom" type="number" value={formData.bathroom} onChange={handleChange} />
            </div>
            <div className="item">
              <label htmlFor="latitude">{t("forms.latitude")}</label>
              <input id="latitude" name="latitude" type="text" value={formData.latitude} onChange={handleChange} />
            </div>
            <div className="item">
              <label htmlFor="longitude">{t("forms.longitude")}</label>
              <input id="longitude" name="longitude" type="text" value={formData.longitude} onChange={handleChange} />
            </div>
            <div className="item">
              <label htmlFor="type">{t("forms.type")}</label>
              <select name="type" value={formData.type} onChange={handleChange}>
                <option value="rent">{t("search.rent")}</option>
                <option value="buy">{t("search.buy")}</option>
              </select>
            </div>
            <div className="item">
              <label htmlFor="property">{t("forms.property")}</label>
              <select name="property" value={formData.property} onChange={handleChange}>
                {PROPERTY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {t(option.labelKey)}
                  </option>
                ))}
              </select>
            </div>
            <div className="item">
              <label htmlFor="utilities">{t("forms.utilities")}</label>
              <select name="utilities" value={formData.utilities} onChange={handleChange}>
                <option value="owner">{t("forms.utilitiesOwner")}</option>
                <option value="tenant">{t("forms.utilitiesTenant")}</option>
                <option value="shared">{t("forms.utilitiesShared")}</option>
              </select>
            </div>
            <div className="item">
              <label htmlFor="pet">{t("forms.petPolicy")}</label>
              <select name="pet" value={formData.pet} onChange={handleChange}>
                <option value="allowed">{t("forms.petsAllowed")}</option>
                <option value="not-allowed">{t("forms.petsNotAllowed")}</option>
              </select>
            </div>
            <div className="item">
              <label htmlFor="income">{t("forms.incomePolicy")}</label>
              <input id="income" name="income" type="text" value={formData.income} onChange={handleChange} />
            </div>
            <div className="item">
              <label htmlFor="size">{t("forms.size")}</label>
              <input min={0} id="size" name="size" type="number" value={formData.size} onChange={handleChange} />
            </div>
            <div className="item">
              <label htmlFor="school">{t("forms.school")}</label>
              <input min={0} id="school" name="school" type="number" value={formData.school} onChange={handleChange} />
            </div>
            <div className="item">
              <label htmlFor="bus">{t("forms.bus")}</label>
              <input min={0} id="bus" name="bus" type="number" value={formData.bus} onChange={handleChange} />
            </div>
            <div className="item">
              <label htmlFor="restaurant">{t("forms.restaurant")}</label>
              <input min={0} id="restaurant" name="restaurant" type="number" value={formData.restaurant} onChange={handleChange} />
            </div>
            <button className="sendButton" disabled={isSubmitting}>
              {isSubmitting ? t("forms.saving") : t("forms.update")}
            </button>
            {error && <span className="formError">{error}</span>}
          </form>
        </div>
      </div>

      <ListingImageManager
        existingImages={existingImages}
        pendingImages={pendingImages}
        missingCategories={missingCategories}
        onFilesSelected={handleFilesSelected}
        onRemoveExistingImage={handleDeleteExistingImage}
        onRemovePendingImage={handleDeletePendingImage}
        onExistingCategoryChange={handleExistingImageCategoryChange}
        onPendingCategoryChange={handlePendingImageCategoryChange}
      />
    </div>
  );
}

export default EditPostPage;
