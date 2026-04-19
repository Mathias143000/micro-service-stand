package com.example.realestate.property;

import com.example.realestate.common.BaseEntity;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "property_photos")
public class PropertyPhoto extends BaseEntity {
  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "property_id", nullable = false)
  @JsonIgnore
  private Property property;

  @Column(nullable = false)
  private String path;

  @Enumerated(EnumType.STRING)
  @Column(name = "category", nullable = false)
  private PropertyPhotoCategory category = PropertyPhotoCategory.EXTERIOR;
}
