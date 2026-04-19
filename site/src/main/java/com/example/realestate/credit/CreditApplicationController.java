package com.example.realestate.credit;

import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
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
@RequestMapping("/api/credits")
public class CreditApplicationController {
  private final CreditApplicationService creditApplicationService;

  public CreditApplicationController(CreditApplicationService creditApplicationService) {
    this.creditApplicationService = creditApplicationService;
  }

  @GetMapping
  public Page<CreditApplicationResponse> list(
      @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable,
      @RequestParam(value = "dealId", required = false) Long dealId
  ) {
    return creditApplicationService.list(pageable, dealId);
  }

  @GetMapping("/{id}")
  public CreditApplicationResponse get(@PathVariable("id") Long id) {
    return creditApplicationService.get(id);
  }

  @PostMapping("/deal/{dealId}")
  public CreditApplicationResponse createForDeal(@PathVariable("dealId") Long dealId,
                                                 @Valid @RequestBody CreditApplicationRequest request) {
    return creditApplicationService.createForDeal(dealId, request);
  }

  @PutMapping("/{id}/status")
  public CreditApplicationResponse updateStatus(@PathVariable("id") Long id,
                                                @RequestParam("status") CreditStatus status,
                                                @RequestParam(value = "comment", required = false) String comment) {
    return creditApplicationService.updateStatus(id, status, comment);
  }
}
