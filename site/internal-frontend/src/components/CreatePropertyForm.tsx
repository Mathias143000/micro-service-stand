import { FormEvent, useState } from "react";
import { createProperty } from "../api/properties";
import { getErrorMessage } from "../api/error";
import type { Property } from "../types";
import ErrorMessage from "./ErrorMessage";
import Loader from "./Loader";

interface Props {
  onCreated: (property: Property) => void;
}

const propertyTypes = ["FOR_SALE", "FOR_RENT", "BOTH"] as const;

export default function CreatePropertyForm({ onCreated }: Props) {
  const [organizationId, setOrganizationId] = useState("");
  const [type, setType] = useState<(typeof propertyTypes)[number]>("FOR_SALE");
  const [address, setAddress] = useState("");
  const [area, setArea] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [rentPrice, setRentPrice] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setValidationError(null);

    if (!organizationId || Number(organizationId) <= 0) {
      setValidationError("Organization ID must be a positive number.");
      return;
    }
    if (!address.trim()) {
      setValidationError("Address is required.");
      return;
    }
    if (!area || Number(area) <= 0) {
      setValidationError("Area must be a positive number.");
      return;
    }

    try {
      setLoading(true);
      const created = await createProperty({
        organizationId: Number(organizationId),
        type,
        address,
        area: Number(area),
        purchasePrice: purchasePrice ? Number(purchasePrice) : undefined,
        rentPrice: rentPrice ? Number(rentPrice) : undefined
      });

      onCreated(created);
      setOrganizationId("");
      setType("FOR_SALE");
      setAddress("");
      setArea("");
      setPurchasePrice("");
      setRentPrice("");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="panel">
      <h2>Create Property</h2>
      <form className="form-grid" onSubmit={onSubmit}>
        <label>
          Organization ID
          <input value={organizationId} onChange={(e) => setOrganizationId(e.target.value)} type="number" min="1" required />
        </label>
        <label>
          Type
          <select value={type} onChange={(e) => setType(e.target.value as (typeof propertyTypes)[number])}>
            {propertyTypes.map((propertyType) => (
              <option key={propertyType} value={propertyType}>
                {propertyType}
              </option>
            ))}
          </select>
        </label>
        <label>
          Address
          <input value={address} onChange={(e) => setAddress(e.target.value)} type="text" required />
        </label>
        <label>
          Area
          <input value={area} onChange={(e) => setArea(e.target.value)} type="number" min="1" step="0.01" required />
        </label>
        <label>
          Purchase Price
          <input
            value={purchasePrice}
            onChange={(e) => setPurchasePrice(e.target.value)}
            type="number"
            min="0"
            step="1"
            placeholder="optional"
          />
        </label>
        <label>
          Rent Price
          <input
            value={rentPrice}
            onChange={(e) => setRentPrice(e.target.value)}
            type="number"
            min="0"
            step="1"
            placeholder="optional"
          />
        </label>
        <button type="submit" disabled={loading}>
          {loading ? "Creating..." : "Create"}
        </button>
      </form>
      <ErrorMessage message={validationError} />
      {loading && <Loader text="Creating property..." />}
      <ErrorMessage message={error} />
    </section>
  );
}
