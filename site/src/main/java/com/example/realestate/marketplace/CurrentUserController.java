package com.example.realestate.marketplace;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class CurrentUserController {

  private final MarketplaceService marketplaceService;

  public CurrentUserController(MarketplaceService marketplaceService) {
    this.marketplaceService = marketplaceService;
  }

  @GetMapping("/me")
  public MarketplaceUserResponse me() {
    return marketplaceService.getCurrentUserProfile();
  }
}
