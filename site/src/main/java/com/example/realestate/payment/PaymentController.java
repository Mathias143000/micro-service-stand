package com.example.realestate.payment;

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
@RequestMapping("/api/payments")
public class PaymentController {
  private final PaymentService paymentService;

  public PaymentController(PaymentService paymentService) {
    this.paymentService = paymentService;
  }

  @GetMapping
  public Page<PaymentResponse> list(
      @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable,
      @RequestParam(value = "dealId", required = false) Long dealId
  ) {
    return paymentService.list(pageable, dealId);
  }

  @GetMapping("/{id}")
  public PaymentResponse get(@PathVariable("id") Long id) {
    return paymentService.get(id);
  }

  @PostMapping
  public PaymentResponse create(@Valid @RequestBody PaymentRequest request) {
    return paymentService.create(request);
  }

  @PutMapping("/{id}/status")
  public PaymentResponse updateStatus(@PathVariable("id") Long id, @RequestParam("status") PaymentStatus status) {
    return paymentService.updateStatus(id, status);
  }
}
