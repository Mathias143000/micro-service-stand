package com.example.realestate.marketplace;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class MarketplaceSavePostRequest {
  @NotNull
  private Long postId;
}
