package com.example.realestate.dashboard;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/internal/dashboard")
public class InternalDashboardController {
  private final InternalDashboardService internalDashboardService;

  public InternalDashboardController(InternalDashboardService internalDashboardService) {
    this.internalDashboardService = internalDashboardService;
  }

  @GetMapping("/counters")
  public InternalNavCountersResponse counters() {
    return internalDashboardService.getNavCounters();
  }
}
