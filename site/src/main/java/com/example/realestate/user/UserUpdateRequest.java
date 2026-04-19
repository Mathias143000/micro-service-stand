package com.example.realestate.user;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UserUpdateRequest {
  @NotBlank
  private String fullName;
  private String username;
  private String phone;
  private String avatar;
  private UserRole role;
  private Long organizationId;
  private boolean enabled;
}
