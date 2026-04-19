package com.example.realestate.deal;

import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class DealRequest {
  @NotNull
  private DealType type;

  @NotNull
  private Long propertyId;

  @NotNull
  private Long buyerOrganizationId;

  private Long rentPeriodId;

  private boolean creditRequired;
  private BigDecimal creditAmount;
}
