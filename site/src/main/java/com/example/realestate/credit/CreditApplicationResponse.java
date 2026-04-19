package com.example.realestate.credit;

import com.example.realestate.deal.DealStatus;
import com.example.realestate.deal.DealType;
import java.math.BigDecimal;
import java.time.Instant;

public record CreditApplicationResponse(
    Long id,
    Long dealId,
    Long propertyId,
    String propertyAddress,
    Long buyerOrganizationId,
    String buyerOrganizationName,
    Long bankOrganizationId,
    String bankOrganizationName,
    DealType dealType,
    DealStatus dealStatus,
    CreditStatus status,
    BigDecimal amount,
    String bankComment,
    Instant createdAt,
    Instant updatedAt
) {
}
