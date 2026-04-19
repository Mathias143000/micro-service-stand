package com.example.realestate.marketplace;

import com.example.realestate.common.BaseEntity;
import com.example.realestate.property.Property;
import com.example.realestate.user.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "marketplace_deals", uniqueConstraints = {
    @UniqueConstraint(name = "uq_marketplace_deal_customer_property", columnNames = {"customer_id", "property_id"})
})
public class MarketplaceDeal extends BaseEntity {

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "customer_id", nullable = false)
  private User customer;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "property_id", nullable = false)
  private Property property;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "assigned_realtor_id")
  private User assignedRealtor;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 32)
  private MarketplaceDealStatus status = MarketplaceDealStatus.REQUESTED;

  @Column(length = 1500)
  private String note;
}
