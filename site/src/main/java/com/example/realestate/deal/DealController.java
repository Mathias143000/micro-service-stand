package com.example.realestate.deal;

import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
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
@RequestMapping("/api/deals")
public class DealController {
  private final DealService dealService;

  public DealController(DealService dealService) {
    this.dealService = dealService;
  }

  @GetMapping
  public Page<Deal> list(
      @PageableDefault Pageable pageable,
      @RequestParam(value = "status", required = false) DealStatus status,
      @RequestParam(value = "type", required = false) DealType type,
      @RequestParam(value = "query", required = false) String query
  ) {
    return dealService.list(pageable, status, type, query);
  }

  @GetMapping("/reference")
  public java.util.List<DealReferenceResponse> referenceList() {
    return dealService.listReferences();
  }

  @GetMapping("/{id}")
  public Deal get(@PathVariable("id") Long id) {
    return dealService.get(id);
  }

  @PostMapping
  public Deal create(@Valid @RequestBody DealRequest request) {
    return dealService.create(request);
  }

  @PutMapping("/{id}/status")
  public DealStatusResponse updateStatus(@PathVariable("id") Long id, @RequestParam("status") DealStatus status) {
    Deal deal = dealService.updateStatus(id, status);
    return new DealStatusResponse(deal.getId(), deal.getStatus());
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> delete(@PathVariable("id") Long id) {
    dealService.delete(id);
    return ResponseEntity.noContent().build();
  }
}
