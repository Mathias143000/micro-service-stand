package com.example.realestate.credit;

import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreditApplicationRequest {
  @NotNull
  private BigDecimal amount;

  private Long bankOrganizationId;
}
