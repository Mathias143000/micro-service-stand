package com.example.realestate.contract;

import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/contracts")
public class ContractController {
  private final ContractService contractService;

  public ContractController(ContractService contractService) {
    this.contractService = contractService;
  }

  @GetMapping
  public Page<ContractResponse> list(
      Pageable pageable,
      @RequestParam(value = "status", required = false) ContractStatus status,
      @RequestParam(value = "type", required = false) ContractType type,
      @RequestParam(value = "query", required = false) String query,
      @RequestParam(value = "organizationId", required = false) Long organizationId
  ) {
    return contractService.list(pageable, status, type, query, organizationId);
  }

  @GetMapping("/{id}")
  public ContractResponse get(@PathVariable("id") Long id) {
    return contractService.get(id);
  }

  @PostMapping
  public ContractResponse create(@Valid @RequestBody ContractCreateRequest request) {
    return contractService.create(request);
  }

  @PutMapping("/{id}/status")
  public ContractResponse updateStatus(@PathVariable("id") Long id, @RequestParam("status") ContractStatus status) {
    return contractService.updateStatus(id, status);
  }
}
