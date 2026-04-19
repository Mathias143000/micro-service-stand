package com.example.realestate.contract;

import java.math.BigDecimal;
import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class ContractResponse {
  private Long id;
  private Long propertyId;
  private String propertyAddress;
  private Long sellerOrganizationId;
  private String sellerOrganizationName;
  private Long buyerOrganizationId;
  private String buyerOrganizationName;
  private ContractType type;
  private ContractStatus status;
  private BigDecimal price;
  private Instant createdAt;
  private Instant updatedAt;
}
