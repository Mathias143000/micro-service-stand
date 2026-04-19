package com.example.realestate.marketplace;

import jakarta.validation.Valid;
import java.time.Duration;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/users")
public class MarketplaceUserController {

  private final MarketplaceService marketplaceService;

  @Value("${app.jwt.expiration-minutes}")
  private long expirationMinutes;

  public MarketplaceUserController(MarketplaceService marketplaceService) {
    this.marketplaceService = marketplaceService;
  }

  @GetMapping("/profilePosts")
  public MarketplaceProfilePostsResponse profilePosts() {
    return marketplaceService.getProfilePosts();
  }

  @GetMapping("/{id}")
  public MarketplaceUserResponse getUser(@PathVariable("id") Long id) {
    return marketplaceService.getPublicUser(id);
  }

  @PutMapping("/{id}")
  public ResponseEntity<MarketplaceAuthResponse> updateUser(
      @PathVariable("id") Long id,
      @Valid @RequestBody MarketplaceUserUpdateRequest request
  ) {
    MarketplaceAuthResponse response = marketplaceService.updateCurrentUser(id, request);
    return ResponseEntity.ok()
        .header(HttpHeaders.SET_COOKIE, buildTokenCookie(response.token()).toString())
        .body(response);
  }

  @PostMapping("/save")
  public Map<String, String> savePost(@Valid @RequestBody MarketplaceSavePostRequest request) {
    return Map.of("message", marketplaceService.toggleSavedPost(request.getPostId()));
  }

  private ResponseCookie buildTokenCookie(String token) {
    return ResponseCookie.from("token", token)
        .httpOnly(true)
        .sameSite("Lax")
        .path("/")
        .maxAge(Duration.ofMinutes(expirationMinutes))
        .build();
  }
}
