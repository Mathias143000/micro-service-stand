package com.example.realestate.payment;

import com.example.realestate.deal.DealStatus;
import com.example.realestate.deal.DealType;
import java.math.BigDecimal;
import java.time.Instant;

public record PaymentResponse(
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
    PaymentStatus status,
    BigDecimal amount,
    Instant paymentDate,
    Instant createdAt,
    Instant updatedAt
) {
}
