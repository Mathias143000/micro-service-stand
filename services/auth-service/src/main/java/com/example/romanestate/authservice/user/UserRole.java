package com.example.romanestate.authservice.user;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

public enum UserRole {
  ROLE_MARKETPLACE_USER("ROLE_MARKETPLACE_USER"),
  ROLE_REALTOR("ROLE_REALTOR"),
  ROLE_BANK_EMPLOYEE("ROLE_BANK_EMPLOYEE"),
  ROLE_ADMIN("ROLE_ADMIN");

  private final String dbValue;

  UserRole(String dbValue) {
    this.dbValue = dbValue;
  }

  public String getDbValue() {
    return dbValue;
  }

  public static UserRole fromDbValue(String value) {
    if (value == null) {
      return null;
    }
    return switch (value) {
      case "MARKETPLACE_USER", "ROLE_MARKETPLACE_USER" -> ROLE_MARKETPLACE_USER;
      case "REALTOR", "ROLE_REALTOR" -> ROLE_REALTOR;
      case "BANK_EMPLOYEE", "ROLE_BANK_EMPLOYEE" -> ROLE_BANK_EMPLOYEE;
      case "ADMIN", "ROLE_ADMIN" -> ROLE_ADMIN;
      default -> throw new IllegalArgumentException("Unknown role: " + value);
    };
  }
}

@Converter(autoApply = false)
class UserRoleConverter implements AttributeConverter<UserRole, String> {
  @Override
  public String convertToDatabaseColumn(UserRole attribute) {
    return attribute == null ? null : attribute.getDbValue();
  }

  @Override
  public UserRole convertToEntityAttribute(String dbData) {
    return UserRole.fromDbValue(dbData);
  }
}
