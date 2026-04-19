package com.example.realestate.analytics;

import java.math.BigDecimal;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class OrganizationAnalyticsDashboardResponse {
  private Long organizationId;
  private String organizationName;
  private long totalDeals;
  private long activeDeals;
  private long completedDeals;
  private long saleDeals;
  private long rentDeals;
  private long totalContracts;
  private long signedContracts;
  private long completedContracts;
  private long totalCredits;
  private long createdCredits;
  private long issuedCredits;
  private long totalPayments;
  private long confirmedPayments;
  private long failedPayments;
  private BigDecimal contractVolume;
  private BigDecimal issuedCreditVolume;
  private BigDecimal confirmedPaymentVolume;
}
