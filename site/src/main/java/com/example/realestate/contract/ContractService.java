package com.example.realestate.contract;

import com.example.realestate.org.Organization;
import com.example.realestate.org.OrganizationRepository;
import com.example.realestate.property.Property;
import com.example.realestate.property.PropertyRepository;
import com.example.realestate.security.StaffAccessService;
import com.example.realestate.user.User;
import jakarta.transaction.Transactional;
import jakarta.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.Locale;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.FORBIDDEN;
import static org.springframework.http.HttpStatus.NOT_FOUND;

@Slf4j
@Service
public class ContractService {
  private final ContractRepository contractRepository;
  private final PropertyRepository propertyRepository;
  private final OrganizationRepository organizationRepository;
  private final StaffAccessService staffAccessService;

  public ContractService(ContractRepository contractRepository,
                         PropertyRepository propertyRepository,
                         OrganizationRepository organizationRepository,
                         StaffAccessService staffAccessService) {
    this.contractRepository = contractRepository;
    this.propertyRepository = propertyRepository;
    this.organizationRepository = organizationRepository;
    this.staffAccessService = staffAccessService;
  }

  public Page<ContractResponse> list(Pageable pageable) {
    return list(pageable, null, null, null, null);
  }

  public Page<ContractResponse> list(Pageable pageable,
                                     ContractStatus status,
                                     ContractType type,
                                     String query,
                                     Long organizationId) {
    User user = currentStaff();
    return contractRepository
        .findAll(buildListSpecification(user, status, type, query, organizationId), pageable)
        .map(this::toResponse);
  }

  public ContractResponse get(Long id) {
    User user = currentStaff();
    Contract contract = findEntity(id);
    staffAccessService.ensureContractAccess(user, contract);
    return toResponse(contract);
  }

  @Transactional
  public ContractResponse create(ContractCreateRequest request) {
    User user = currentStaff();
    Property property = propertyRepository.findById(request.getPropertyId())
        .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Property not found"));
    Organization sellerOrganization = organizationRepository.findById(request.getSellerOrganizationId())
        .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Seller organization not found"));
    Organization buyerOrganization = organizationRepository.findById(request.getBuyerOrganizationId())
        .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Buyer organization not found"));

    if (property.getOrganization() == null
        || !property.getOrganization().getId().equals(sellerOrganization.getId())) {
      throw new ResponseStatusException(BAD_REQUEST, "Property does not belong to seller organization");
    }

    ensureCreateAccess(user, sellerOrganization.getId(), buyerOrganization.getId());

    Contract contract = new Contract();
    contract.setProperty(property);
    contract.setSellerOrganization(sellerOrganization);
    contract.setBuyerOrganization(buyerOrganization);
    contract.setType(request.getType());
    contract.setStatus(ContractStatus.DRAFT);
    contract.setPrice(request.getPrice());

    Contract saved = contractRepository.save(contract);
    log.info("Contract created: {}", saved.getId());
    return toResponse(saved);
  }

  @Transactional
  public ContractResponse updateStatus(Long id, ContractStatus status) {
    User user = currentStaff();
    Contract contract = findEntity(id);
    staffAccessService.ensureContractAccess(user, contract);
    contract.setStatus(status);
    log.info("Contract status updated: {} -> {}", id, status);
    return toResponse(contract);
  }

  private User currentStaff() {
    User user = staffAccessService.requireCurrentStaffUser();
    staffAccessService.ensureAdminOrRealtor(user);
    return user;
  }

  private Contract findEntity(Long id) {
    return contractRepository.findById(id)
        .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Contract not found"));
  }

  private void ensureCreateAccess(User user, Long sellerOrganizationId, Long buyerOrganizationId) {
    if (staffAccessService.isAdmin(user)) {
      return;
    }

    Long currentOrganizationId = staffAccessService.requireOrganizationId(user);
    if (!currentOrganizationId.equals(sellerOrganizationId) && !currentOrganizationId.equals(buyerOrganizationId)) {
      throw new ResponseStatusException(FORBIDDEN, "Access denied");
    }
  }

  private ContractResponse toResponse(Contract contract) {
    return new ContractResponse(
        contract.getId(),
        contract.getProperty().getId(),
        contract.getProperty().getAddress(),
        contract.getSellerOrganization().getId(),
        contract.getSellerOrganization().getName(),
        contract.getBuyerOrganization().getId(),
        contract.getBuyerOrganization().getName(),
        contract.getType(),
        contract.getStatus(),
        contract.getPrice(),
        contract.getCreatedAt(),
        contract.getUpdatedAt()
    );
  }

  private Specification<Contract> buildListSpecification(User user,
                                                         ContractStatus status,
                                                         ContractType type,
                                                         String query,
                                                         Long organizationId) {
    return (root, criteriaQuery, cb) -> {
      criteriaQuery.distinct(true);
      java.util.List<Predicate> predicates = new ArrayList<>();

      if (staffAccessService.isAdmin(user)) {
        if (organizationId != null) {
          predicates.add(
              cb.or(
                  cb.equal(root.get("sellerOrganization").get("id"), organizationId),
                  cb.equal(root.get("buyerOrganization").get("id"), organizationId)
              )
          );
        }
      } else {
        Long currentOrganizationId = staffAccessService.requireOrganizationId(user);
        predicates.add(
            cb.or(
                cb.equal(root.get("sellerOrganization").get("id"), currentOrganizationId),
                cb.equal(root.get("buyerOrganization").get("id"), currentOrganizationId)
            )
        );
      }

      if (status != null) {
        predicates.add(cb.equal(root.get("status"), status));
      }

      if (type != null) {
        predicates.add(cb.equal(root.get("type"), type));
      }

      if (hasText(query)) {
        String normalizedQuery = "%" + query.trim().toLowerCase(Locale.ROOT) + "%";
        java.util.List<Predicate> searchPredicates = new ArrayList<>();
        searchPredicates.add(cb.like(cb.lower(root.get("property").get("address")), normalizedQuery));
        searchPredicates.add(cb.like(cb.lower(root.get("sellerOrganization").get("name")), normalizedQuery));
        searchPredicates.add(cb.like(cb.lower(root.get("buyerOrganization").get("name")), normalizedQuery));

        Long numericQuery = parseLongSafely(query);
        if (numericQuery != null) {
          searchPredicates.add(cb.equal(root.get("id"), numericQuery));
          searchPredicates.add(cb.equal(root.get("property").get("id"), numericQuery));
          searchPredicates.add(cb.equal(root.get("sellerOrganization").get("id"), numericQuery));
          searchPredicates.add(cb.equal(root.get("buyerOrganization").get("id"), numericQuery));
        }

        predicates.add(cb.or(searchPredicates.toArray(Predicate[]::new)));
      }

      return cb.and(predicates.toArray(Predicate[]::new));
    };
  }

  private boolean hasText(String value) {
    return value != null && !value.isBlank();
  }

  private Long parseLongSafely(String value) {
    try {
      return value == null ? null : Long.valueOf(value.trim());
    } catch (NumberFormatException ignored) {
      return null;
    }
  }
}
