package com.example.realestate.marketplace;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class MarketplaceRegisterRequest {
  @NotBlank
  private String username;

  @Email
  @NotBlank
  private String email;

  @NotBlank
  private String password;

  private String mobile_number;
}
