import apiRequest from "./apiRequest";
import resolveAssetUrl from "./resolveAssetUrl";

export const LISTING_IMAGE_CATEGORIES = [
  {
    value: "exterior",
    titleKey: "forms.photoExteriorTitle",
    descriptionKey: "forms.photoExteriorDescription",
    buttonKey: "forms.addExteriorPhotos",
  },
  {
    value: "interior",
    titleKey: "forms.photoInteriorTitle",
    descriptionKey: "forms.photoInteriorDescription",
    buttonKey: "forms.addInteriorPhotos",
  },
  {
    value: "floorplan",
    titleKey: "forms.photoFloorPlanTitle",
    descriptionKey: "forms.photoFloorPlanDescription",
    buttonKey: "forms.addFloorPlanPhotos",
  },
];

const CATEGORY_SORT_ORDER = {
  exterior: 0,
  interior: 1,
  floorplan: 2,
};

export function getListingImageCategoryMeta(category) {
  return LISTING_IMAGE_CATEGORIES.find((item) => item.value === category) || LISTING_IMAGE_CATEGORIES[0];
}

export function normalizeListingGalleryItems(images) {
  return (images || [])
    .map((image, index) => {
      if (typeof image === "string") {
        return {
          id: `legacy-${index}`,
          url: resolveAssetUrl(image),
          category: "exterior",
        };
      }

      return {
        id: image.id ?? `gallery-${index}`,
        url: resolveAssetUrl(image.url || image.path || ""),
        category: image.category || "exterior",
      };
    })
    .filter((image) => Boolean(image.url))
    .sort((left, right) => {
      const leftOrder = CATEGORY_SORT_ORDER[left.category] ?? Number.MAX_SAFE_INTEGER;
      const rightOrder = CATEGORY_SORT_ORDER[right.category] ?? Number.MAX_SAFE_INTEGER;
      return leftOrder - rightOrder;
    });
}

export function buildListingGallerySections(images) {
  const gallery = normalizeListingGalleryItems(images);

  return LISTING_IMAGE_CATEGORIES.map((category) => ({
    ...category,
    items: gallery.filter((item) => item.category === category.value),
  })).filter((section) => section.items.length > 0);
}

export function getPrimaryListingImage(images) {
  return normalizeListingGalleryItems(images)[0]?.url || null;
}

export function createPendingImageItems(fileList, category) {
  return Array.from(fileList || []).map((file, index) => ({
    id: `${category}-${file.name}-${file.lastModified}-${index}`,
    file,
    category,
    previewUrl: URL.createObjectURL(file),
  }));
}

export function normalizeExistingImageItems(images) {
  return (images || []).map((image, index) => {
    if (typeof image === "string") {
      return {
        id: `legacy-${index}`,
        imageId: null,
        url: image,
        category: "exterior",
      };
    }

    return {
      id: image.id ?? `image-${index}`,
      imageId: image.id ?? null,
      url: image.url,
      category: image.category || "exterior",
    };
  });
}

export function countImagesByCategory(items) {
  return (items || []).reduce((accumulator, item) => {
    const category = item.category || "exterior";
    accumulator[category] = (accumulator[category] || 0) + 1;
    return accumulator;
  }, {});
}

export function getMissingRequiredImageCategories(existingImages = [], pendingImages = []) {
  const counts = countImagesByCategory([...existingImages, ...pendingImages]);
  return LISTING_IMAGE_CATEGORIES.filter((category) => !counts[category.value]).map((category) => category.value);
}

export async function uploadListingImages(listingId, items) {
  const uploadedImages = [];

  for (const item of items || []) {
    const formData = new FormData();
    formData.append("file", item.file);
    formData.append("category", item.category);

    const { data } = await apiRequest.post(`/api/properties/${listingId}/images`, formData);
    uploadedImages.push({
      id: data.id,
      imageId: data.id,
      url: data.url,
      category: data.category || item.category,
    });
  }

  return uploadedImages;
}

export function buildImageGalleryPayload(images) {
  return (images || []).map((image) => ({
    id: image.imageId ?? image.id ?? null,
    url: image.url,
    category: image.category,
  }));
}
