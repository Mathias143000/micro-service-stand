package com.example.realestate.marketplace;

import jakarta.validation.Valid;
import java.time.Duration;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth")
public class MarketplaceAuthController {

  private final MarketplaceService marketplaceService;

  @Value("${app.jwt.expiration-minutes}")
  private long expirationMinutes;

  public MarketplaceAuthController(MarketplaceService marketplaceService) {
    this.marketplaceService = marketplaceService;
  }

  @PostMapping("/register")
  public ResponseEntity<MarketplaceAuthResponse> register(@Valid @RequestBody MarketplaceRegisterRequest request) {
    MarketplaceAuthResponse response = marketplaceService.register(request);
    return ResponseEntity.status(201)
        .header(HttpHeaders.SET_COOKIE, buildTokenCookie(response.token()).toString())
        .body(response);
  }

  @PostMapping("/login")
  public ResponseEntity<MarketplaceAuthResponse> login(@Valid @RequestBody MarketplaceLoginRequest request) {
    MarketplaceAuthResponse response = marketplaceService.login(request);
    return ResponseEntity.ok()
        .header(HttpHeaders.SET_COOKIE, buildTokenCookie(response.token()).toString())
        .body(response);
  }

  @PostMapping("/logout")
  public ResponseEntity<Map<String, String>> logout() {
    return ResponseEntity.ok()
        .header(HttpHeaders.SET_COOKIE, clearTokenCookie().toString())
        .body(Map.of("message", "Logout Successful"));
  }

  private ResponseCookie buildTokenCookie(String token) {
    return ResponseCookie.from("token", token)
        .httpOnly(true)
        .sameSite("Lax")
        .path("/")
        .maxAge(Duration.ofMinutes(expirationMinutes))
        .build();
  }

  private ResponseCookie clearTokenCookie() {
    return ResponseCookie.from("token", "")
        .httpOnly(true)
        .sameSite("Lax")
        .path("/")
        .maxAge(Duration.ZERO)
        .build();
  }
}
