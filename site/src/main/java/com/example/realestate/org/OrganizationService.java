package com.example.realestate.org;

import jakarta.transaction.Transactional;
import java.util.List;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import static org.springframework.http.HttpStatus.NOT_FOUND;

@Slf4j
@Service
public class OrganizationService {
  private final OrganizationRepository organizationRepository;

  public OrganizationService(OrganizationRepository organizationRepository) {
    this.organizationRepository = organizationRepository;
  }

  public Page<Organization> list(Pageable pageable) {
    return organizationRepository.findAll(pageable);
  }

  public Organization get(Long id) {
    return organizationRepository.findById(id)
        .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Organization not found"));
  }

  public List<OrganizationReferenceResponse> referenceList() {
    return organizationRepository.findAll(Sort.by(Sort.Direction.ASC, "name")).stream()
        .map(org -> new OrganizationReferenceResponse(
            org.getId(),
            org.getName(),
            org.getTaxId(),
            org.getAddress(),
            org.getPhone(),
            org.getEmail()
        ))
        .toList();
  }

  @Transactional
  public Organization create(OrganizationRequest request) {
    Organization org = new Organization();
    org.setName(request.getName());
    // фронт может не присылать taxId — подставим безопасное значение
    String taxId = request.getTaxId();
    if (taxId == null || taxId.isBlank()) {
      taxId = "UNKNOWN";
    }
    org.setTaxId(taxId);
    org.setAddress(request.getAddress());
    org.setPhone(request.getPhone());
    org.setEmail(request.getEmail());
    Organization saved = organizationRepository.save(org);
    log.info("Organization created: {}", saved.getName());
    return saved;
  }

  @Transactional
  public Organization update(Long id, OrganizationRequest request) {
    Organization org = get(id);
    org.setName(request.getName());
    // не затираем существующий taxId на null/пустое
    if (request.getTaxId() != null && !request.getTaxId().isBlank()) {
      org.setTaxId(request.getTaxId());
    }
    org.setAddress(request.getAddress());
    org.setPhone(request.getPhone());
    org.setEmail(request.getEmail());
    log.info("Organization updated: {}", org.getName());
    return org;
  }

  @Transactional
  public void delete(Long id) {
    organizationRepository.delete(get(id));
    log.info("Organization deleted: {}", id);
  }
}
