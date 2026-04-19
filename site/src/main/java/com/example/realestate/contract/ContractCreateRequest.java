package com.example.realestate.contract;

import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ContractCreateRequest {
  @NotNull
  private Long propertyId;

  @NotNull
  private Long sellerOrganizationId;

  @NotNull
  private Long buyerOrganizationId;

  @NotNull
  private ContractType type;

  @NotNull
  private BigDecimal price;
}
