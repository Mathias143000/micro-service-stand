package com.example.realestate.contract;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ContractRequest {
  @NotNull
  private Long dealId;
  private String templateData;
}
