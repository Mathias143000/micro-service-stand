package com.example.realestate.property;

import jakarta.validation.Valid;
import java.math.BigDecimal;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/properties")
public class PropertyController {

  private final PropertyService propertyService;

  public PropertyController(PropertyService propertyService) {
    this.propertyService = propertyService;
  }

  @GetMapping
  public Page<PropertyResponse> list(Pageable pageable) {
    return propertyService.list(pageable);
  }

  @GetMapping("/search")
  public Page<PropertyResponse> search(
          @RequestParam(required = false) PropertyType type,
          @RequestParam(required = false) PropertyStatus status,
          @RequestParam(required = false) Long organizationId,
          @RequestParam(required = false) BigDecimal minPrice,
          @RequestParam(required = false) BigDecimal maxPrice,
          @RequestParam(required = false) BigDecimal minArea,
          @RequestParam(required = false) BigDecimal maxArea,
          Pageable pageable
  ) {
    return propertyService.search(
            type,
            status,
            organizationId,
            minPrice,
            maxPrice,
            minArea,
            maxArea,
            pageable
    );
  }

  @GetMapping("/{id}")
  public PropertyResponse get(@PathVariable("id") Long id) {
    return propertyService.get(id);
  }

  @PostMapping
  public PropertyResponse create(@Valid @RequestBody PropertyRequest request) {
    return propertyService.create(request);
  }

  @PutMapping("/{id}")
  public PropertyResponse update(
          @PathVariable("id") Long id,
          @Valid @RequestBody PropertyRequest request
  ) {
    return propertyService.update(id, request);
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> delete(@PathVariable("id") Long id) {
    propertyService.archive(id);
    return ResponseEntity.noContent().build();
  }
}
