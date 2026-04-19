package com.example.realestate.property;

import java.math.BigDecimal;
import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class PropertyResponse {
  private Long id;
  private Long organizationId;
  private String organizationName;
  private Long ownerId;
  private String ownerName;
  private String title;
  private PropertyType type;
  private PropertyStatus status;
  private String address;
  private String city;
  private Integer floor;
  private Integer bedroom;
  private Integer bathroom;
  private BigDecimal latitude;
  private BigDecimal longitude;
  private BigDecimal area;
  private String listingCategory;
  private String purpose;
  private String description;
  private String conditions;
  private String utilities;
  private String petPolicy;
  private String incomePolicy;
  private Integer schoolDistanceKm;
  private Integer busDistanceKm;
  private Integer restaurantDistanceKm;
  private BigDecimal purchasePrice;
  private BigDecimal rentPrice;
  private boolean published;
  private Instant createdAt;
  private Instant updatedAt;
}
