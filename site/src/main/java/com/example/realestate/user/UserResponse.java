package com.example.realestate.user;

import lombok.AllArgsConstructor;
import lombok.Getter;
import java.time.Instant;

@Getter
@AllArgsConstructor
public class UserResponse {
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
