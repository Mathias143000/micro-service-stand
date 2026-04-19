package com.example.realestate.contract;

import com.example.realestate.common.BaseEntity;
import com.example.realestate.org.Organization;
import com.example.realestate.property.Property;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "contracts")
public class Contract extends BaseEntity {
  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "property_id", nullable = false)
  private Property property;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "seller_organization_id", nullable = false)
  private Organization sellerOrganization;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "buyer_organization_id", nullable = false)
  private Organization buyerOrganization;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private ContractType type;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private ContractStatus status = ContractStatus.DRAFT;

  @Column(nullable = false, precision = 15, scale = 2)
  private BigDecimal price;
}
