package com.example.realestate.marketplace;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class MarketplacePriceAlertRequest {
  @NotNull
  private Long postId;

  @NotNull
  private Boolean enabled;
}
