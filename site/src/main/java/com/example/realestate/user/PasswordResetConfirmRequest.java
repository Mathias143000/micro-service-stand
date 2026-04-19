package com.example.realestate.user;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PasswordResetConfirmRequest {
  @NotBlank
  private String token;

  @NotBlank
  private String newPassword;
}
