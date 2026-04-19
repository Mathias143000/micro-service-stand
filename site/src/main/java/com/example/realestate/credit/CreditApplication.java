package com.example.realestate.credit;

import com.example.realestate.common.BaseEntity;
import com.example.realestate.deal.Deal;
import com.example.realestate.org.Organization;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "credit_applications")
public class CreditApplication extends BaseEntity {
  @OneToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "deal_id", unique = true)
  @JsonIgnore
  private Deal deal;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "bank_organization_id")
  @JsonIgnore
  private Organization bankOrganization;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private CreditStatus status = CreditStatus.CREATED;

  @Column(nullable = false)
  private BigDecimal amount;

  private String bankComment;
}
