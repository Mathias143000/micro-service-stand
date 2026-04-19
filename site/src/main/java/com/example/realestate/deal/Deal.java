package com.example.realestate.deal;

import com.example.realestate.common.BaseEntity;
import com.example.realestate.credit.CreditApplication;
import com.example.realestate.org.Organization;
import com.example.realestate.property.Property;
import com.example.realestate.property.RentPeriod;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "deals")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Deal extends BaseEntity {
  @Enumerated(EnumType.STRING)
  private DealType type;

  @Enumerated(EnumType.STRING)
  private DealStatus status = DealStatus.DRAFT;

  @ManyToOne(fetch = FetchType.EAGER)
  @JoinColumn(name = "property_id", nullable = false)
  private Property property;

  @ManyToOne(fetch = FetchType.EAGER)
  @JoinColumn(name = "buyer_org_id", nullable = false)
  private Organization buyerOrganization;

  @OneToOne(fetch = FetchType.EAGER)
  @JoinColumn(name = "rent_period_id")
  private RentPeriod rentPeriod;

  @OneToOne(fetch = FetchType.EAGER, cascade = CascadeType.ALL, mappedBy = "deal")
  private CreditApplication creditApplication;
}
