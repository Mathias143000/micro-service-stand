import { useEffect, useState } from "react";
import type { Property } from "../types";
import { getErrorMessage } from "../api/error";
import { deletePropertyImage, listPropertyImages, uploadPropertyImage, type PropertyImage } from "../api/propertyImages";
import ErrorMessage from "./ErrorMessage";

interface Props {
  property: Property | null;
}

export default function PropertyImagesPanel({ property }: Props) {
  const [images, setImages] = useState<PropertyImage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    if (!property) return;
    setError(null);
    listPropertyImages(property.id)
      .then(setImages)
      .catch((err) => setError(getErrorMessage(err)));
  }, [property]);

  if (!property) return null;

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const img = await uploadPropertyImage(property.id, file);
      setImages((prev) => [...prev, img]);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const handleDeleteImage = async (imageId: number) => {
    try {
      setDeletingId(imageId);
      setError(null);
      await deletePropertyImage(imageId);
      setImages((previous) => previous.filter((image) => image.id !== imageId));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section className="panel">
      <h3>Property Images (ID #{property.id})</h3>
      <ErrorMessage message={error} />
      <label className="file-input">
        <span>{uploading ? "Uploading..." : "Upload image"}</span>
        <input type="file" accept="image/*" disabled={uploading} onChange={handleFileChange} />
      </label>
      {images.length === 0 ? (
        <p className="muted">No images yet.</p>
      ) : (
        <div className="image-grid">
          {images.map((img) => (
            <div key={img.id} className="image-item">
              <a href={img.url} target="_blank" rel="noreferrer">
                <img src={img.url} alt={`Property ${property.id} image ${img.id}`} style={{ maxWidth: 120, maxHeight: 120 }} />
              </a>
              <button
                type="button"
                className="ghost-btn danger-btn"
                disabled={deletingId === img.id}
                onClick={() => void handleDeleteImage(img.id)}
              >
                {deletingId === img.id ? "Deleting..." : "Delete"}
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
