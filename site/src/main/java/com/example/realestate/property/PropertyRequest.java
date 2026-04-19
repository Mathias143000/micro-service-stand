package com.example.realestate.property;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public class PropertyRequest {

  @NotNull
  private Long organizationId;

  @NotNull
  private PropertyType type;

  private PropertyStatus status;

  @NotNull
  private String address;

  private String title;
  private String city;
  private Integer floor;
  private Integer bedroom;
  private Integer bathroom;
  private Double latitude;
  private Double longitude;

  @Positive
  private Double area;

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
  private Boolean published;

  private Long purchasePrice;
  private Long rentPrice;

  // ===== getters & setters =====

  public Long getOrganizationId() {
    return organizationId;
  }

  public void setOrganizationId(Long organizationId) {
    this.organizationId = organizationId;
  }

  public PropertyType getType() {
    return type;
  }

  public void setType(PropertyType type) {
    this.type = type;
  }

  public PropertyStatus getStatus() {
    return status;
  }

  public void setStatus(PropertyStatus status) {
    this.status = status;
  }

  public String getAddress() {
    return address;
  }

  public void setAddress(String address) {
    this.address = address;
  }

  public String getTitle() {
    return title;
  }

  public void setTitle(String title) {
    this.title = title;
  }

  public String getCity() {
    return city;
  }

  public void setCity(String city) {
    this.city = city;
  }

  public Integer getFloor() {
    return floor;
  }

  public void setFloor(Integer floor) {
    this.floor = floor;
  }

  public Integer getBedroom() {
    return bedroom;
  }

  public void setBedroom(Integer bedroom) {
    this.bedroom = bedroom;
  }

  public Integer getBathroom() {
    return bathroom;
  }

  public void setBathroom(Integer bathroom) {
    this.bathroom = bathroom;
  }

  public Double getLatitude() {
    return latitude;
  }

  public void setLatitude(Double latitude) {
    this.latitude = latitude;
  }

  public Double getLongitude() {
    return longitude;
  }

  public void setLongitude(Double longitude) {
    this.longitude = longitude;
  }

  public Double getArea() {
    return area;
  }

  public void setArea(Double area) {
    this.area = area;
  }

  public String getListingCategory() {
    return listingCategory;
  }

  public void setListingCategory(String listingCategory) {
    this.listingCategory = listingCategory;
  }

  public String getPurpose() {
    return purpose;
  }

  public void setPurpose(String purpose) {
    this.purpose = purpose;
  }

  public String getDescription() {
    return description;
  }

  public void setDescription(String description) {
    this.description = description;
  }

  public String getConditions() {
    return conditions;
  }

  public void setConditions(String conditions) {
    this.conditions = conditions;
  }

  public String getUtilities() {
    return utilities;
  }

  public void setUtilities(String utilities) {
    this.utilities = utilities;
  }

  public String getPetPolicy() {
    return petPolicy;
  }

  public void setPetPolicy(String petPolicy) {
    this.petPolicy = petPolicy;
  }

  public String getIncomePolicy() {
    return incomePolicy;
  }

  public void setIncomePolicy(String incomePolicy) {
    this.incomePolicy = incomePolicy;
  }

  public Integer getSchoolDistanceKm() {
    return schoolDistanceKm;
  }

  public void setSchoolDistanceKm(Integer schoolDistanceKm) {
    this.schoolDistanceKm = schoolDistanceKm;
  }

  public Integer getBusDistanceKm() {
    return busDistanceKm;
  }

  public void setBusDistanceKm(Integer busDistanceKm) {
    this.busDistanceKm = busDistanceKm;
  }

  public Integer getRestaurantDistanceKm() {
    return restaurantDistanceKm;
  }

  public void setRestaurantDistanceKm(Integer restaurantDistanceKm) {
    this.restaurantDistanceKm = restaurantDistanceKm;
  }

  public Boolean getPublished() {
    return published;
  }

  public void setPublished(Boolean published) {
    this.published = published;
  }

  public Long getPurchasePrice() {
    return purchasePrice;
  }

  public void setPurchasePrice(Long purchasePrice) {
    this.purchasePrice = purchasePrice;
  }

  public Long getRentPrice() {
    return rentPrice;
  }

  public void setRentPrice(Long rentPrice) {
    this.rentPrice = rentPrice;
  }
}
