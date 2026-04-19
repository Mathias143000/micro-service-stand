package com.example.romanestate.authservice.user;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;

class UserRoleTest {

  @Test
  void resolvesLegacyAndRolePrefixedValues() {
    assertEquals(UserRole.ROLE_ADMIN, UserRole.fromDbValue("ADMIN"));
    assertEquals(UserRole.ROLE_ADMIN, UserRole.fromDbValue("ROLE_ADMIN"));
    assertEquals(UserRole.ROLE_REALTOR, UserRole.fromDbValue("REALTOR"));
  }
}
