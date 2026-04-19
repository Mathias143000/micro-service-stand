package com.example.realestate.deal;

public record DealReferenceResponse(
    Long id,
    DealType type,
    DealStatus status,
    Long propertyId,
    String propertyAddress,
    Long buyerOrganizationId,
    String buyerOrganizationName,
    boolean hasCreditApplication
) {
}
