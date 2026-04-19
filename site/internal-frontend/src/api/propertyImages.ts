import apiClient from "./client";

export interface PropertyImage {
  id: number;
  url: string;
}

export async function listPropertyImages(propertyId: number): Promise<PropertyImage[]> {
  const { data } = await apiClient.get<PropertyImage[]>(`/properties/${propertyId}/images`);
  return data;
}

export async function uploadPropertyImage(propertyId: number, file: File): Promise<PropertyImage> {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await apiClient.post<PropertyImage>(`/properties/${propertyId}/images`, formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });
  return data;
}

export async function deletePropertyImage(imageId: number): Promise<void> {
  await apiClient.delete(`/properties/images/${imageId}`);
}
