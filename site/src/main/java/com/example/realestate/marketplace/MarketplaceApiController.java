package com.example.realestate.marketplace;

import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class MarketplaceApiController {

  private final MarketplaceService marketplaceService;

  public MarketplaceApiController(MarketplaceService marketplaceService) {
    this.marketplaceService = marketplaceService;
  }

  @GetMapping("/listings")
  public List<MarketplacePostResponse> listPosts(
      @RequestParam(required = false) String city,
      @RequestParam(required = false) String type,
      @RequestParam(required = false) String property,
      @RequestParam(required = false) Integer bedroom,
      @RequestParam(required = false) Long minPrice,
      @RequestParam(required = false) Long maxPrice
  ) {
    return marketplaceService.listPosts(city, type, property, bedroom, minPrice, maxPrice);
  }

  @GetMapping("/listings/nearby")
  public List<MarketplacePostResponse> nearbyPosts(
      @RequestParam String latitude,
      @RequestParam String longitude,
      @RequestParam(required = false) String type
  ) {
    return marketplaceService.nearbyPosts(latitude, longitude, type);
  }

  @GetMapping("/listings/{id}")
  public MarketplacePostResponse getPost(@PathVariable("id") Long id) {
    return marketplaceService.getPost(id);
  }

  @PostMapping("/listings")
  public MarketplacePostResponse createPost(@Valid @RequestBody MarketplacePostRequest request) {
    return marketplaceService.createPost(request);
  }

  @PutMapping("/listings/{id}")
  public MarketplacePostResponse updatePost(
      @PathVariable("id") Long id,
      @Valid @RequestBody MarketplacePostRequest request
  ) {
    return marketplaceService.updatePost(id, request);
  }

  @DeleteMapping("/listings/{id}")
  public ResponseEntity<Void> deletePost(@PathVariable("id") Long id) {
    marketplaceService.deletePost(id);
    return ResponseEntity.noContent().build();
  }

  @GetMapping("/profile/listings")
  public MarketplaceProfilePostsResponse profilePosts() {
    return marketplaceService.getProfilePosts();
  }

  @PostMapping("/favorites/toggle")
  public Map<String, String> toggleFavorite(@Valid @RequestBody MarketplaceSavePostRequest request) {
    return Map.of("message", marketplaceService.toggleSavedPost(request.getPostId()));
  }

  @PostMapping("/favorites/price-alert")
  public Map<String, Object> updatePriceAlert(@Valid @RequestBody MarketplacePriceAlertRequest request) {
    boolean enabled = marketplaceService.updatePriceAlert(request.getPostId(), request.getEnabled());
    return Map.of(
        "message", enabled ? "Price alert enabled" : "Price alert muted",
        "enabled", enabled
    );
  }
}
