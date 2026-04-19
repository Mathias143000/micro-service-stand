package com.example.realestate.deal;

import com.example.realestate.credit.CreditApplication;
import com.example.realestate.credit.CreditStatus;
import com.example.realestate.org.Organization;
import com.example.realestate.org.OrganizationRepository;
import com.example.realestate.property.Property;
import com.example.realestate.property.PropertyRepository;
import com.example.realestate.property.RentPeriod;
import com.example.realestate.property.RentPeriodRepository;
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
public class DealService {
  private final DealRepository dealRepository;
  private final PropertyRepository propertyRepository;
  private final OrganizationRepository organizationRepository;
  private final RentPeriodRepository rentPeriodRepository;
  private final StaffAccessService staffAccessService;

  public DealService(DealRepository dealRepository,
                     PropertyRepository propertyRepository,
                     OrganizationRepository organizationRepository,
                     RentPeriodRepository rentPeriodRepository,
                     StaffAccessService staffAccessService) {
    this.dealRepository = dealRepository;
    this.propertyRepository = propertyRepository;
    this.organizationRepository = organizationRepository;
    this.rentPeriodRepository = rentPeriodRepository;
    this.staffAccessService = staffAccessService;
  }

  public Page<Deal> list(Pageable pageable) {
    return list(pageable, null, null, null);
  }

  public Page<Deal> list(Pageable pageable, DealStatus status, DealType type, String query) {
    User user = currentStaff();
    return dealRepository.findAll(buildListSpecification(user, status, type, query), pageable);
  }

  public java.util.List<DealReferenceResponse> listReferences() {
    User user = staffAccessService.requireCurrentStaffUser();
    java.util.List<Deal> deals;
    if (staffAccessService.isBankEmployee(user) || staffAccessService.isAdmin(user)) {
      deals = dealRepository.findAll(Pageable.unpaged()).getContent();
    } else {
      staffAccessService.ensureAdminOrRealtor(user);
      Long organizationId = staffAccessService.requireOrganizationId(user);
      deals = dealRepository.findDistinctByPropertyOrganizationIdOrBuyerOrganizationId(
          organizationId,
          organizationId,
          Pageable.unpaged()
      ).getContent();
    }

    return deals.stream()
        .map(deal -> new DealReferenceResponse(
            deal.getId(),
            deal.getType(),
            deal.getStatus(),
            deal.getProperty().getId(),
            deal.getProperty().getAddress(),
            deal.getBuyerOrganization().getId(),
            deal.getBuyerOrganization().getName(),
            deal.getCreditApplication() != null
        ))
        .toList();
  }

  public Deal get(Long id) {
    User user = currentStaff();
    Deal deal = findEntity(id);
    staffAccessService.ensureDealAccess(user, deal);
    return deal;
  }

  @Transactional
  public Deal create(DealRequest request) {
    User user = currentStaff();
    Property property = propertyRepository.findById(request.getPropertyId())
        .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Property not found"));
    Organization buyerOrganization = organizationRepository.findById(request.getBuyerOrganizationId())
        .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Buyer organization not found"));

    staffAccessService.ensurePropertyAccess(user, property);
    ensureCounterpartyAccess(user, property, buyerOrganization);

    Deal deal = new Deal();
    deal.setType(request.getType());
    deal.setStatus(DealStatus.CREATED);
    deal.setProperty(property);
    deal.setBuyerOrganization(buyerOrganization);

    if (request.getType() == DealType.RENT && request.getRentPeriodId() != null) {
      RentPeriod period = rentPeriodRepository.findById(request.getRentPeriodId())
          .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Rent period not found"));
      if (!period.getProperty().getId().equals(property.getId())) {
        throw new ResponseStatusException(BAD_REQUEST, "Rent period does not belong to property");
      }
      deal.setRentPeriod(period);
    }

    if (request.getType() == DealType.SALE && request.isCreditRequired()) {
      if (request.getCreditAmount() == null) {
        throw new ResponseStatusException(BAD_REQUEST, "Credit amount required");
      }
      CreditApplication creditApplication = new CreditApplication();
      creditApplication.setDeal(deal);
      creditApplication.setAmount(request.getCreditAmount());
      creditApplication.setStatus(CreditStatus.CREATED);
      deal.setCreditApplication(creditApplication);
    }

    Deal saved = dealRepository.save(deal);
    log.info("Deal created: {}", saved.getId());
    return saved;
  }

  @Transactional
  public Deal updateStatus(Long id, DealStatus status) {
    User user = currentStaff();
    Deal deal = findEntity(id);
    staffAccessService.ensureDealAccess(user, deal);
    deal.setStatus(status);
    log.info("Deal status updated: {} -> {}", id, status);
    return deal;
  }

  @Transactional
  public void delete(Long id) {
    User user = currentStaff();
    Deal deal = findEntity(id);
    staffAccessService.ensureDealAccess(user, deal);
    dealRepository.delete(deal);
    log.info("Deal deleted: {}", id);
  }

  private User currentStaff() {
    User user = staffAccessService.requireCurrentStaffUser();
    staffAccessService.ensureAdminOrRealtor(user);
    return user;
  }

  private Deal findEntity(Long id) {
    return dealRepository.findById(id)
        .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Deal not found"));
  }

  private void ensureCounterpartyAccess(User user, Property property, Organization buyerOrganization) {
    if (staffAccessService.isAdmin(user)) {
      return;
    }

    Long currentOrganizationId = staffAccessService.requireOrganizationId(user);
    Long propertyOrganizationId = property.getOrganization() == null ? null : property.getOrganization().getId();
    Long buyerOrganizationId = buyerOrganization.getId();

    if (!currentOrganizationId.equals(propertyOrganizationId) && !currentOrganizationId.equals(buyerOrganizationId)) {
      throw new ResponseStatusException(FORBIDDEN, "Access denied");
    }
  }

  private Specification<Deal> buildListSpecification(User user, DealStatus status, DealType type, String query) {
    return (root, criteriaQuery, cb) -> {
      criteriaQuery.distinct(true);
      java.util.List<Predicate> predicates = new ArrayList<>();

      if (!staffAccessService.isAdmin(user)) {
        Long organizationId = staffAccessService.requireOrganizationId(user);
        predicates.add(
            cb.or(
                cb.equal(root.get("property").get("organization").get("id"), organizationId),
                cb.equal(root.get("buyerOrganization").get("id"), organizationId)
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
        searchPredicates.add(cb.like(cb.lower(root.get("buyerOrganization").get("name")), normalizedQuery));
        searchPredicates.add(cb.like(cb.lower(root.get("property").get("organization").get("name")), normalizedQuery));

        Long numericQuery = parseLongSafely(query);
        if (numericQuery != null) {
          searchPredicates.add(cb.equal(root.get("id"), numericQuery));
          searchPredicates.add(cb.equal(root.get("property").get("id"), numericQuery));
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
