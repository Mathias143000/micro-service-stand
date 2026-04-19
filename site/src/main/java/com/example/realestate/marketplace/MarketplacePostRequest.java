package com.example.realestate.marketplace;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class MarketplacePostRequest {
  @Valid
  @NotNull
  private MarketplacePostDataRequest postData;

  @Valid
  @NotNull
  private MarketplacePostDetailRequest postDetail;
}
