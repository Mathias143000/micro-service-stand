package com.example.realestate.user;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class LoginRequest {
  private String email;

  private String username;

  @NotBlank
  private String password;
}
