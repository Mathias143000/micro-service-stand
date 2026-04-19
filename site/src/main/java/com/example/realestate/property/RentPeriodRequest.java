package com.example.realestate.property;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RentPeriodRequest {
  @NotNull
  private Long propertyId;

  @NotNull
  private LocalDate startDate;

  @NotNull
  private LocalDate endDate;
}
