package com.example.realestate.favorite;

import com.example.realestate.common.BaseEntity;
import com.example.realestate.property.Property;
import com.example.realestate.user.User;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.math.BigDecimal;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "favorites", uniqueConstraints = {
    @UniqueConstraint(name = "uq_favorite_user_property", columnNames = {"user_id", "property_id"})
})
public class Favorite extends BaseEntity {
  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "user_id", nullable = false)
  @JsonIgnore
  private User user;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "property_id", nullable = false)
  private Property property;

  @Column(name = "saved_price")
  private BigDecimal savedPrice;

  @Column(name = "price_alert_enabled", nullable = false)
  private boolean priceAlertEnabled = true;
}
