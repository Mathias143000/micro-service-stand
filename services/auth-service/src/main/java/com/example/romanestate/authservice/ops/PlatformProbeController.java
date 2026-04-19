package com.example.romanestate.authservice.ops;

import java.util.Map;
import org.springframework.boot.actuate.health.HealthComponent;
import org.springframework.boot.actuate.health.HealthEndpoint;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class PlatformProbeController {

  private final HealthEndpoint healthEndpoint;

  public PlatformProbeController(HealthEndpoint healthEndpoint) {
    this.healthEndpoint = healthEndpoint;
  }

  @GetMapping("/health")
  public ResponseEntity<Map<String, String>> health() {
    return toResponse(healthEndpoint.health());
  }

  @GetMapping("/ready")
  public ResponseEntity<Map<String, String>> ready() {
    return toResponse(healthEndpoint.healthForPath("readiness"));
  }

  @GetMapping("/live")
  public ResponseEntity<Map<String, String>> live() {
    return toResponse(healthEndpoint.healthForPath("liveness"));
  }

  private ResponseEntity<Map<String, String>> toResponse(HealthComponent component) {
    String status = component.getStatus().getCode();
    HttpStatus httpStatus = "UP".equalsIgnoreCase(status) ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE;
    return ResponseEntity.status(httpStatus).body(Map.of("status", status));
  }
}
