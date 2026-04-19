package com.example.realestate.analytics;

import java.math.BigDecimal;
import java.math.RoundingMode;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class RealtorAnalyticsResponse {
  private long totalDeals;
  private long buyDeals;
  private long rentDeals;
  private long activeDeals;
  private long totalProperties;
  private long availableProperties;
  private long totalContracts;
  private long signedContracts;
  private long totalCredits;
  private long issuedCredits;
  private long totalPayments;
  private long confirmedPayments;

  public BigDecimal getRentSharePercent() {
    return percentage(rentDeals);
  }

  public BigDecimal getBuySharePercent() {
    return percentage(buyDeals);
  }

  public BigDecimal getActiveDealSharePercent() {
    return percentage(activeDeals);
  }

  private BigDecimal percentage(long value) {
    if (totalDeals == 0) {
      return BigDecimal.ZERO;
    }
    return BigDecimal.valueOf(value * 100.0 / totalDeals).setScale(1, RoundingMode.HALF_UP);
  }
}
