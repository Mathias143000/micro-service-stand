package com.example.realestate.user;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RegisterRequest {
  @Email
  @NotBlank
  private String email;

  private String username;

  @NotBlank
  private String password;

  private String fullName;
  private String phone;
  private String avatar;
  private UserRole role;

  private Long organizationId;
}
