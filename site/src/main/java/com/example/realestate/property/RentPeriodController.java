package com.example.realestate.property;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/rent-periods")
public class RentPeriodController {
  private final RentPeriodService rentPeriodService;

  public RentPeriodController(RentPeriodService rentPeriodService) {
    this.rentPeriodService = rentPeriodService;
  }

  @PostMapping
  public ResponseEntity<RentPeriod> create(@Valid @RequestBody RentPeriodRequest request) {
    return ResponseEntity.ok(rentPeriodService.create(request));
  }
}
