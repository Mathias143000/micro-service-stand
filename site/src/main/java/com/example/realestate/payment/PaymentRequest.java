package com.example.realestate.payment;

import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PaymentRequest {
  @NotNull
  private Long dealId;

  @NotNull
  private BigDecimal amount;

  private Long bankOrganizationId;
}
