import { FormEvent, useState } from "react";
import { createContract } from "../api/contracts";
import { getErrorMessage } from "../api/error";
import type { Contract } from "../types";
import ErrorMessage from "./ErrorMessage";
import Loader from "./Loader";

interface Props {
  onCreated: (contract: Contract) => void;
}

const contractTypes = ["SALE", "RENT"] as const;

export default function CreateContractForm({ onCreated }: Props) {
  const [propertyId, setPropertyId] = useState("");
  const [sellerOrganizationId, setSellerOrganizationId] = useState("");
  const [buyerOrganizationId, setBuyerOrganizationId] = useState("");
  const [type, setType] = useState<(typeof contractTypes)[number]>("SALE");
  const [price, setPrice] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    try {
      setLoading(true);
      const created = await createContract({
        propertyId: Number(propertyId),
        sellerOrganizationId: Number(sellerOrganizationId),
        buyerOrganizationId: Number(buyerOrganizationId),
        type,
        price: Number(price)
      });

      onCreated(created);
      setPropertyId("");
      setSellerOrganizationId("");
      setBuyerOrganizationId("");
      setType("SALE");
      setPrice("");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="panel">
      <h2>Create Contract</h2>
      <form className="form-grid" onSubmit={onSubmit}>
        <label>
          Property ID
          <input value={propertyId} onChange={(e) => setPropertyId(e.target.value)} type="number" min="1" required />
        </label>
        <label>
          Seller Organization ID
          <input
            value={sellerOrganizationId}
            onChange={(e) => setSellerOrganizationId(e.target.value)}
            type="number"
            min="1"
            required
          />
        </label>
        <label>
          Buyer Organization ID
          <input
            value={buyerOrganizationId}
            onChange={(e) => setBuyerOrganizationId(e.target.value)}
            type="number"
            min="1"
            required
          />
        </label>
        <label>
          Contract Type
          <select value={type} onChange={(e) => setType(e.target.value as (typeof contractTypes)[number])}>
            {contractTypes.map((contractType) => (
              <option key={contractType} value={contractType}>
                {contractType}
              </option>
            ))}
          </select>
        </label>
        <label>
          Price
          <input value={price} onChange={(e) => setPrice(e.target.value)} type="number" min="1" step="0.01" required />
        </label>
        <button type="submit" disabled={loading}>
          {loading ? "Creating..." : "Create"}
        </button>
      </form>
      {loading && <Loader text="Creating contract..." />}
      <ErrorMessage message={error} />
    </section>
  );
}
