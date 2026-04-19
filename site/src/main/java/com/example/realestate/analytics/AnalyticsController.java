package com.example.realestate.analytics;

import java.nio.charset.StandardCharsets;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {
  private final AnalyticsService analyticsService;

  public AnalyticsController(AnalyticsService analyticsService) {
    this.analyticsService = analyticsService;
  }

  @GetMapping("/realtor")
  public RealtorAnalyticsResponse realtor() {
    return analyticsService.getRealtorAnalytics();
  }

  @GetMapping("/organizations/dashboard")
  public OrganizationAnalyticsDashboardResponse organizationDashboard(
      @RequestParam(value = "organizationId", required = false) Long organizationId
  ) {
    return analyticsService.getOrganizationDashboard(organizationId);
  }

  @GetMapping(value = "/organizations/dashboard/export", produces = "text/csv")
  public ResponseEntity<byte[]> exportOrganizationDashboard(
      @RequestParam(value = "organizationId", required = false) Long organizationId,
      @RequestParam(value = "preset", defaultValue = "EXECUTIVE_SUMMARY") AnalyticsExportPreset preset
  ) {
    String csv = analyticsService.exportOrganizationDashboardCsv(organizationId, preset);
    String organizationScope = organizationId == null ? "scope" : String.valueOf(organizationId);
    String fileName = "organization-" + organizationScope + "-" + preset.name().toLowerCase() + ".csv";
    return ResponseEntity.ok()
        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"")
        .contentType(MediaType.parseMediaType("text/csv"))
        .body(csv.getBytes(StandardCharsets.UTF_8));
  }
}
