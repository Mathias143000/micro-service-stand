package com.example.romanestate.authservice.user;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@AllArgsConstructor
class AuthResponse {
  private String token;
}

@Getter
@Setter
class LoginRequest {
  private String email;
  private String username;

  @NotBlank
  private String password;
}

@Getter
@Setter
class PasswordResetConfirmRequest {
  @NotBlank
  private String token;

  @NotBlank
  private String newPassword;
}

@Getter
@Setter
class PasswordResetRequest {
  @Email
  @NotBlank
  private String email;
}

@Getter
@Setter
class RegisterRequest {
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

@Getter
@AllArgsConstructor
class UserResponse {
  private Long id;
  private String username;
  private String email;
  private String fullName;
  private String phone;
  private String avatar;
  private UserRole role;
  private Long organizationId;
  private String organizationName;
  private boolean enabled;
  private Instant createdAt;
}
