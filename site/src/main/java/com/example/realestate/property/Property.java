package com.example.realestate.property;

import com.example.realestate.common.BaseEntity;
import com.example.realestate.org.Organization;
import com.example.realestate.user.User;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "properties")
public class Property extends BaseEntity {
  @JsonIgnore
  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "organization_id")
  private Organization organization;

  @JsonIgnore
  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "owner_id")
  private User owner;

  @Column(length = 255)
  private String title;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private PropertyType type;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private PropertyStatus status = PropertyStatus.AVAILABLE;

  @Column(nullable = false, length = 500)
  private String address;

  @Column(length = 255)
  private String city;

  private Integer floor;
  private Integer bedroom;
  private Integer bathroom;

  @Column(precision = 10, scale = 7)
  private BigDecimal latitude;

  @Column(precision = 10, scale = 7)
  private BigDecimal longitude;

  @Column(nullable = false, precision = 10, scale = 2)
  private BigDecimal area;

  @Column(length = 50)
  private String listingCategory;

  @Column(length = 255)
  private String purpose;

  @Column(length = 2000)
  private String description;

  @Column(length = 1000)
  private String conditions;

  @Column(length = 1000)
  private String utilities;

  @Column(length = 100)
  private String petPolicy;

  @Column(length = 255)
  private String incomePolicy;

  private Integer schoolDistanceKm;
  private Integer busDistanceKm;
  private Integer restaurantDistanceKm;

  private BigDecimal purchasePrice;
  private BigDecimal rentPrice;

  @Column(nullable = false)
  private boolean published = true;

  @JsonIgnore
  @OneToMany(mappedBy = "property", cascade = CascadeType.ALL, orphanRemoval = true)
  private List<PropertyPhoto> photos = new ArrayList<>();
}
