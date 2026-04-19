package com.example.realestate.payment;

import com.example.realestate.common.BaseEntity;
import com.example.realestate.deal.Deal;
import com.example.realestate.org.Organization;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "payments")
public class Payment extends BaseEntity {
  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "deal_id", nullable = false)
  private Deal deal;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "bank_organization_id")
  private Organization bankOrganization;

  @Column(nullable = false)
  private BigDecimal amount;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private PaymentStatus status = PaymentStatus.CREATED;

  @Column(nullable = false)
  private Instant paymentDate = Instant.now();
}
