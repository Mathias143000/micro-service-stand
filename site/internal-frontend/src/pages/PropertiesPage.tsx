import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getErrorMessage } from "../api/error";
import { getOrganizationReferences } from "../api/organizations";
import { archiveProperty, createProperty, getProperties, updateProperty } from "../api/properties";
import ErrorMessage from "../components/ErrorMessage";
import Loader from "../components/Loader";
import PropertyImagesPanel from "../components/PropertyImagesPanel";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { formatMoney } from "../lib/format";
import type { CreatePropertyPayload, OrganizationReference, Property, PropertyStatus, PropertyType } from "../types";

function payloadFromProperty(property: Property): CreatePropertyPayload {
  return {
    organizationId: property.organizationId ?? 0,
    title: property.title ?? "",
    type: property.type,
    status: property.status,
    address: property.address,
    city: property.city ?? "",
    floor: property.floor ?? undefined,
    bedroom: property.bedroom ?? undefined,
    bathroom: property.bathroom ?? undefined,
    latitude: property.latitude ?? undefined,
    longitude: property.longitude ?? undefined,
    area: Number(property.area),
    listingCategory: property.listingCategory ?? "",
    purpose: property.purpose ?? "",
    description: property.description ?? "",
    conditions: property.conditions ?? "",
    utilities: property.utilities ?? "",
    petPolicy: property.petPolicy ?? "",
    incomePolicy: property.incomePolicy ?? "",
    schoolDistanceKm: property.schoolDistanceKm ?? undefined,
    busDistanceKm: property.busDistanceKm ?? undefined,
    restaurantDistanceKm: property.restaurantDistanceKm ?? undefined,
    purchasePrice: property.purchasePrice ?? undefined,
    rentPrice: property.rentPrice ?? undefined,
    published: property.published ?? true
  };
}

function emptyPropertyPayload(organizationId = 0): CreatePropertyPayload {
  return {
    organizationId,
    title: "",
    type: "FOR_SALE",
    status: "AVAILABLE",
    address: "",
    city: "",
    area: 0,
    listingCategory: "",
    purpose: "",
    description: "",
    conditions: "",
    utilities: "",
    petPolicy: "",
    incomePolicy: "",
    published: true
  };
}

export default function PropertiesPage() {
  const { user, hasRole } = useAuth();
  const { showSuccess } = useToast();
  const [properties, setProperties] = useState<Property[]>([]);
  const [organizations, setOrganizations] = useState<OrganizationReference[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(null);
  const [form, setForm] = useState<CreatePropertyPayload>(emptyPropertyPayload());
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const hasInitializedSelection = useRef(false);

  const selectedProperty = useMemo(
    () => properties.find((property) => property.id === selectedPropertyId) ?? null,
    [properties, selectedPropertyId]
  );

  const isAdmin = hasRole("ADMIN");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [propertiesPage, organizationRefs] = await Promise.all([
        getProperties(0, 200),
        getOrganizationReferences()
      ]);
      setProperties(propertiesPage.content);
      setOrganizations(organizationRefs);
      if (!hasInitializedSelection.current) {
        setSelectedPropertyId(propertiesPage.content[0]?.id ?? null);
        hasInitializedSelection.current = true;
      }
      if (!propertiesPage.content[0]) {
        setForm(emptyPropertyPayload(user?.organizationId ?? organizationRefs[0]?.id ?? 0));
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [user?.organizationId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (selectedProperty) {
      setForm(payloadFromProperty(selectedProperty));
      return;
    }

    setForm(emptyPropertyPayload(user?.organizationId ?? organizations[0]?.id ?? 0));
  }, [organizations, selectedProperty, user?.organizationId]);

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      if (selectedProperty) {
        const updated = await updateProperty(selectedProperty.id, form);
        setProperties((current) => current.map((property) => (property.id === updated.id ? updated : property)));
        setSelectedPropertyId(updated.id);
        showSuccess("Property updated");
      } else {
        const created = await createProperty(form);
        setProperties((current) => [created, ...current]);
        setSelectedPropertyId(created.id);
        showSuccess("Property created");
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleArchive = async () => {
    if (!selectedProperty) {
      return;
    }

    try {
      setSaving(true);
      setError(null);
      await archiveProperty(selectedProperty.id);
      setProperties((current) =>
        current.map((property) =>
          property.id === selectedProperty.id ? { ...property, status: "ARCHIVED", published: false } : property
        )
      );
      showSuccess("Property archived");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Loader text="Loading properties..." />;
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>Properties</h2>
          <p className="muted">Manage inventory, pricing and listing readiness inside the selected organization scope.</p>
        </div>
        <div className="table-actions">
          <button type="button" className="ghost-btn" onClick={() => void load()}>
            Refresh
          </button>
          <button type="button" className="ghost-btn" onClick={() => setSelectedPropertyId(null)}>
            New property
          </button>
        </div>
      </div>

      <ErrorMessage message={error} />

      <div className="page-grid wide-grid">
        <section className="panel">
          <div className="panel-title">
            <h3>{selectedProperty ? `Edit Property #${selectedProperty.id}` : "Create Property"}</h3>
          </div>
          <div className="form-grid compact-grid">
            <label>
              Organization
              <select
                value={form.organizationId}
                onChange={(e) => setForm((current) => ({ ...current, organizationId: Number(e.target.value) }))}
                disabled={!isAdmin}
              >
                {organizations.map((organization) => (
                  <option key={organization.id} value={organization.id}>
                    {organization.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Title
              <input value={form.title ?? ""} onChange={(e) => setForm((current) => ({ ...current, title: e.target.value }))} />
            </label>
            <label>
              Type
              <select value={form.type} onChange={(e) => setForm((current) => ({ ...current, type: e.target.value as PropertyType }))}>
                <option value="FOR_SALE">For sale</option>
                <option value="FOR_RENT">For rent</option>
                <option value="BOTH">Both</option>
              </select>
            </label>
            <label>
              Status
              <select value={form.status} onChange={(e) => setForm((current) => ({ ...current, status: e.target.value as PropertyStatus }))}>
                <option value="AVAILABLE">Available</option>
                <option value="RESERVED">Reserved</option>
                <option value="RENTED">Rented</option>
                <option value="SOLD">Sold</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </label>
            <label>
              Address
              <input value={form.address} onChange={(e) => setForm((current) => ({ ...current, address: e.target.value }))} required />
            </label>
            <label>
              City
              <input value={form.city ?? ""} onChange={(e) => setForm((current) => ({ ...current, city: e.target.value }))} />
            </label>
            <label>
              Area
              <input
                type="number"
                min="1"
                value={form.area || ""}
                onChange={(e) => setForm((current) => ({ ...current, area: Number(e.target.value) }))}
              />
            </label>
            <label>
              Floor
              <input
                type="number"
                value={form.floor ?? ""}
                onChange={(e) => setForm((current) => ({ ...current, floor: e.target.value ? Number(e.target.value) : undefined }))}
              />
            </label>
            <label>
              Bedrooms
              <input
                type="number"
                value={form.bedroom ?? ""}
                onChange={(e) => setForm((current) => ({ ...current, bedroom: e.target.value ? Number(e.target.value) : undefined }))}
              />
            </label>
            <label>
              Bathrooms
              <input
                type="number"
                value={form.bathroom ?? ""}
                onChange={(e) => setForm((current) => ({ ...current, bathroom: e.target.value ? Number(e.target.value) : undefined }))}
              />
            </label>
            <label>
              Purchase price
              <input
                type="number"
                value={form.purchasePrice ?? ""}
                onChange={(e) =>
                  setForm((current) => ({ ...current, purchasePrice: e.target.value ? Number(e.target.value) : undefined }))
                }
              />
            </label>
            <label>
              Rent price
              <input
                type="number"
                value={form.rentPrice ?? ""}
                onChange={(e) =>
                  setForm((current) => ({ ...current, rentPrice: e.target.value ? Number(e.target.value) : undefined }))
                }
              />
            </label>
            <label className="field-span-2">
              Purpose
              <input value={form.purpose ?? ""} onChange={(e) => setForm((current) => ({ ...current, purpose: e.target.value }))} />
            </label>
            <label className="field-span-2">
              Description
              <textarea value={form.description ?? ""} onChange={(e) => setForm((current) => ({ ...current, description: e.target.value }))} />
            </label>
            <label className="field-span-2">
              Conditions
              <textarea value={form.conditions ?? ""} onChange={(e) => setForm((current) => ({ ...current, conditions: e.target.value }))} />
            </label>
            <label className="field-span-2">
              Utilities
              <textarea value={form.utilities ?? ""} onChange={(e) => setForm((current) => ({ ...current, utilities: e.target.value }))} />
            </label>
            <label className="checkbox">
              <input
                type="checkbox"
                checked={form.published ?? true}
                onChange={(e) => setForm((current) => ({ ...current, published: e.target.checked }))}
              />
              Published
            </label>
            <div className="panel-actions">
              <button type="button" onClick={() => void handleSave()} disabled={saving || !form.organizationId || !form.address || !form.area}>
                {saving ? "Saving..." : selectedProperty ? "Update property" : "Create property"}
              </button>
              {selectedProperty && (
                <button type="button" className="ghost-btn danger-btn" onClick={() => void handleArchive()} disabled={saving}>
                  Archive
                </button>
              )}
            </div>
          </div>
        </section>

        <section className="panel">
          <div className="panel-title">
            <h3>Inventory</h3>
          </div>
          {properties.length === 0 ? (
            <p className="muted">No properties found.</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Organization</th>
                    <th>Address</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Area</th>
                    <th>Sale</th>
                    <th>Rent</th>
                  </tr>
                </thead>
                <tbody>
                  {properties.map((property) => (
                    <tr
                      key={property.id}
                      className={selectedPropertyId === property.id ? "is-selected-row" : undefined}
                      onClick={() => setSelectedPropertyId(property.id)}
                      style={{ cursor: "pointer" }}
                    >
                      <td>#{property.id}</td>
                      <td>{property.organizationName ?? "Unknown"}</td>
                      <td>
                        <strong>{property.address}</strong>
                        {property.city && <div className="muted">{property.city}</div>}
                      </td>
                      <td>{property.type}</td>
                      <td>{property.status}</td>
                      <td>{property.area}</td>
                      <td>{property.purchasePrice ? formatMoney(property.purchasePrice) : "-"}</td>
                      <td>{property.rentPrice ? formatMoney(property.rentPrice) : "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
      <PropertyImagesPanel property={selectedProperty} />
    </div>
  );
}
