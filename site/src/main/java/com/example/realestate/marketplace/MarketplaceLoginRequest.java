package com.example.realestate.marketplace;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class MarketplaceLoginRequest {
  @NotBlank
  private String username;

  @NotBlank
  private String password;
}
