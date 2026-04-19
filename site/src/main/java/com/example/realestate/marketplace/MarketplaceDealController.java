package com.example.realestate.marketplace;

import jakarta.validation.Valid;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
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
public class MarketplaceDealController {

  private final MarketplaceDealService marketplaceDealService;

  public MarketplaceDealController(MarketplaceDealService marketplaceDealService) {
    this.marketplaceDealService = marketplaceDealService;
  }

  @GetMapping("/marketplace-deals")
  public List<MarketplaceDealResponse> listCurrentUserDeals() {
    return marketplaceDealService.listCurrentUserDeals();
  }

  @PostMapping("/marketplace-deals")
  public MarketplaceDealResponse createCurrentUserDeal(@Valid @RequestBody MarketplaceDealRequest request) {
    return marketplaceDealService.createCurrentUserDeal(request);
  }

  @GetMapping("/internal/marketplace-deals")
  public Page<MarketplaceDealResponse> listStaffDeals(
      @PageableDefault(size = 20) Pageable pageable,
      @RequestParam(value = "status", required = false) MarketplaceDealStatus status,
      @RequestParam(value = "query", required = false) String query
  ) {
    return marketplaceDealService.listStaffDeals(pageable, status, query);
  }

  @PutMapping("/internal/marketplace-deals/{id}/status")
  public MarketplaceDealResponse updateStaffDealStatus(
      @PathVariable("id") Long id,
      @Valid @RequestBody MarketplaceDealStatusUpdateRequest request
  ) {
    return marketplaceDealService.updateStaffDealStatus(id, request.getStatus());
  }
}
