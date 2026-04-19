package com.example.realestate.org;

import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/organizations")
public class OrganizationController {
  private final OrganizationService organizationService;

  public OrganizationController(OrganizationService organizationService) {
    this.organizationService = organizationService;
  }

  @GetMapping
  public Page<Organization> list(@PageableDefault Pageable pageable) {
    return organizationService.list(pageable);
  }

  @GetMapping("/reference")
  public java.util.List<OrganizationReferenceResponse> referenceList() {
    return organizationService.referenceList();
  }

  @GetMapping("/{id}")
  public Organization get(@PathVariable("id") Long id) {
    return organizationService.get(id);
  }

  @PreAuthorize("hasRole('ADMIN')")
  @PostMapping
  public Organization create(@Valid @RequestBody OrganizationRequest request) {
    return organizationService.create(request);
  }

  @PreAuthorize("hasRole('ADMIN')")
  @PutMapping("/{id}")
  public Organization update(@PathVariable("id") Long id, @Valid @RequestBody OrganizationRequest request) {
    return organizationService.update(id, request);
  }

  @PreAuthorize("hasRole('ADMIN')")
  @DeleteMapping("/{id}")
  public ResponseEntity<Void> delete(@PathVariable("id") Long id) {
    organizationService.delete(id);
    return ResponseEntity.noContent().build();
  }
}
