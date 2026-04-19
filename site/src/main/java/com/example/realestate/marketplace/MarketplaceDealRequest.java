package com.example.realestate.marketplace;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class MarketplaceDealRequest {

  @NotNull
  private Long postId;

  private String note;
}
