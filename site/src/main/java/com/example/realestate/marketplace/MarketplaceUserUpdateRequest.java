package com.example.realestate.marketplace;

import jakarta.validation.constraints.Email;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class MarketplaceUserUpdateRequest {
  private String username;

  @Email
  private String email;

  private String password;
  private String avatar;
  private String mobile_number;
}
