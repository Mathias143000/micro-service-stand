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
@RequestMapping("/posts")
public class MarketplacePostController {

  private final MarketplaceService marketplaceService;

  public MarketplacePostController(MarketplaceService marketplaceService) {
    this.marketplaceService = marketplaceService;
  }

  @GetMapping
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

  @GetMapping("/nearby")
  public List<MarketplacePostResponse> nearbyPosts(
      @RequestParam String latitude,
      @RequestParam String longitude,
      @RequestParam(required = false) String type
  ) {
    return marketplaceService.nearbyPosts(latitude, longitude, type);
  }

  @GetMapping("/{id}")
  public MarketplacePostResponse getPost(@PathVariable("id") Long id) {
    return marketplaceService.getPost(id);
  }

  @PostMapping
  public MarketplacePostResponse createPost(@Valid @RequestBody MarketplacePostRequest request) {
    return marketplaceService.createPost(request);
  }

  @PutMapping("/{id}")
  public MarketplacePostResponse updatePost(
      @PathVariable("id") Long id,
      @Valid @RequestBody MarketplacePostRequest request
  ) {
    return marketplaceService.updatePost(id, request);
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Map<String, String>> deletePost(@PathVariable("id") Long id) {
    marketplaceService.deletePost(id);
    return ResponseEntity.ok(Map.of("message", "Post deleted"));
  }
}
