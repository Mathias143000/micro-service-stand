package com.example.realestate.org;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Email;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class OrganizationRequest {
  @NotBlank
  private String name;

  private String taxId;

  private String address;
  private String phone;

  @Email
  private String email;
}
