package com.example.realestate.property;

import com.example.realestate.org.Organization;
import com.example.realestate.org.OrganizationRepository;
import com.example.realestate.security.StaffAccessService;
import com.example.realestate.user.User;
import jakarta.persistence.criteria.Predicate;
import jakarta.transaction.Transactional;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
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
public class PropertyService {

  private final PropertyRepository propertyRepository;
  private final OrganizationRepository organizationRepository;
  private final StaffAccessService staffAccessService;

  public PropertyService(PropertyRepository propertyRepository,
                         OrganizationRepository organizationRepository,
                         StaffAccessService staffAccessService) {
    this.propertyRepository = propertyRepository;
    this.organizationRepository = organizationRepository;
    this.staffAccessService = staffAccessService;
  }

  public Page<PropertyResponse> list(Pageable pageable) {
    User user = currentStaff();
    if (staffAccessService.isAdmin(user)) {
      return propertyRepository.findAll(pageable).map(this::toResponse);
    }

    Long organizationId = staffAccessService.requireOrganizationId(user);
    Specification<Property> specification = organizationSpecification(organizationId);
    return propertyRepository.findAll(specification, pageable).map(this::toResponse);
  }

  public Page<PropertyResponse> search(PropertyType type,
                                       PropertyStatus status,
                                       Long organizationId,
                                       BigDecimal minPrice,
                                       BigDecimal maxPrice,
                                       BigDecimal minArea,
                                       BigDecimal maxArea,
                                       Pageable pageable) {
    User user = currentStaff();
    Long forcedOrganizationId = null;
    if (!staffAccessService.isAdmin(user)) {
      forcedOrganizationId = staffAccessService.requireOrganizationId(user);
      if (organizationId != null && !organizationId.equals(forcedOrganizationId)) {
        throw new ResponseStatusException(FORBIDDEN, "Access denied");
      }
    }

    Long effectiveOrganizationId = forcedOrganizationId != null ? forcedOrganizationId : organizationId;
    Specification<Property> specification = (root, query, cb) -> {
      List<Predicate> predicates = new ArrayList<>();
      if (effectiveOrganizationId != null) {
        predicates.add(cb.equal(root.get("organization").get("id"), effectiveOrganizationId));
      }
      if (type != null) {
        predicates.add(cb.equal(root.get("type"), type));
      }
      if (status != null) {
        predicates.add(cb.equal(root.get("status"), status));
      }
      if (minArea != null) {
        predicates.add(cb.greaterThanOrEqualTo(root.get("area"), minArea));
      }
      if (maxArea != null) {
        predicates.add(cb.lessThanOrEqualTo(root.get("area"), maxArea));
      }
      if (minPrice != null) {
        predicates.add(cb.or(
            cb.greaterThanOrEqualTo(root.get("purchasePrice"), minPrice),
            cb.greaterThanOrEqualTo(root.get("rentPrice"), minPrice)
        ));
      }
      if (maxPrice != null) {
        predicates.add(cb.or(
            cb.lessThanOrEqualTo(root.get("purchasePrice"), maxPrice),
            cb.lessThanOrEqualTo(root.get("rentPrice"), maxPrice)
        ));
      }
      return cb.and(predicates.toArray(new Predicate[0]));
    };

    return propertyRepository.findAll(specification, pageable).map(this::toResponse);
  }

  public PropertyResponse get(Long id) {
    User user = currentStaff();
    Property property = findEntity(id);
    staffAccessService.ensurePropertyAccess(user, property);
    return toResponse(property);
  }

  @Transactional
  public PropertyResponse create(PropertyRequest request) {
    User user = currentStaff();
    Organization organization = resolveOrganization(user, request.getOrganizationId());

    Property property = new Property();
    property.setOrganization(organization);
    property.setOwner(user);
    applyRequest(property, request);

    Property saved = propertyRepository.save(property);
    log.info("Property created: {}, user={}", saved.getId(), user.getEmail());
    return toResponse(saved);
  }

  @Transactional
  public PropertyResponse update(Long id, PropertyRequest request) {
    User user = currentStaff();
    Property property = findEntity(id);
    staffAccessService.ensurePropertyAccess(user, property);
    Organization organization = resolveOrganization(user, request.getOrganizationId());

    property.setOrganization(organization);
    applyRequest(property, request);
    log.info("Property updated: {}", property.getId());
    return toResponse(property);
  }

  @Transactional
  public void archive(Long id) {
    User user = currentStaff();
    Property property = findEntity(id);
    staffAccessService.ensurePropertyAccess(user, property);
    property.setStatus(PropertyStatus.ARCHIVED);
    property.setPublished(false);
    log.info("Property archived: {}", property.getId());
  }

  private User currentStaff() {
    User user = staffAccessService.requireCurrentStaffUser();
    staffAccessService.ensureAdminOrRealtor(user);
    return user;
  }

  private Property findEntity(Long id) {
    return propertyRepository.findById(id)
        .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Property not found"));
  }

  private Organization resolveOrganization(User user, Long organizationId) {
    if (!staffAccessService.isAdmin(user)) {
      staffAccessService.ensureOrganizationAccess(user, organizationId);
    }

    return organizationRepository.findById(organizationId)
        .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Organization not found"));
  }

  private void applyRequest(Property property, PropertyRequest request) {
    property.setTitle(blankToNull(request.getTitle()));
    property.setType(request.getType());
    property.setStatus(request.getStatus() == null ? PropertyStatus.AVAILABLE : request.getStatus());
    property.setAddress(request.getAddress());
    property.setCity(blankToNull(request.getCity()));
    property.setFloor(request.getFloor());
    property.setBedroom(request.getBedroom());
    property.setBathroom(request.getBathroom());
    property.setLatitude(toBigDecimal(request.getLatitude()));
    property.setLongitude(toBigDecimal(request.getLongitude()));
    property.setArea(toBigDecimal(request.getArea(), "area"));
    property.setListingCategory(blankToNull(request.getListingCategory()));
    property.setPurpose(blankToNull(request.getPurpose()));
    property.setDescription(blankToNull(request.getDescription()));
    property.setConditions(blankToNull(request.getConditions()));
    property.setUtilities(blankToNull(request.getUtilities()));
    property.setPetPolicy(blankToNull(request.getPetPolicy()));
    property.setIncomePolicy(blankToNull(request.getIncomePolicy()));
    property.setSchoolDistanceKm(request.getSchoolDistanceKm());
    property.setBusDistanceKm(request.getBusDistanceKm());
    property.setRestaurantDistanceKm(request.getRestaurantDistanceKm());
    property.setPurchasePrice(toBigDecimal(request.getPurchasePrice()));
    property.setRentPrice(toBigDecimal(request.getRentPrice()));
    property.setPublished(request.getPublished() == null || request.getPublished());
  }

  private Specification<Property> organizationSpecification(Long organizationId) {
    return (root, query, cb) -> cb.equal(root.get("organization").get("id"), organizationId);
  }

  private PropertyResponse toResponse(Property property) {
    Organization organization = property.getOrganization();
    User owner = property.getOwner();
    return new PropertyResponse(
        property.getId(),
        organization == null ? null : organization.getId(),
        organization == null ? null : organization.getName(),
        owner == null ? null : owner.getId(),
        owner == null ? null : owner.getFullName(),
        property.getTitle(),
        property.getType(),
        property.getStatus(),
        property.getAddress(),
        property.getCity(),
        property.getFloor(),
        property.getBedroom(),
        property.getBathroom(),
        property.getLatitude(),
        property.getLongitude(),
        property.getArea(),
        property.getListingCategory(),
        property.getPurpose(),
        property.getDescription(),
        property.getConditions(),
        property.getUtilities(),
        property.getPetPolicy(),
        property.getIncomePolicy(),
        property.getSchoolDistanceKm(),
        property.getBusDistanceKm(),
        property.getRestaurantDistanceKm(),
        property.getPurchasePrice(),
        property.getRentPrice(),
        property.isPublished(),
        property.getCreatedAt(),
        property.getUpdatedAt()
    );
  }

  private BigDecimal toBigDecimal(Double value, String fieldName) {
    if (value == null) {
      throw new ResponseStatusException(BAD_REQUEST, fieldName + " is required");
    }
    return BigDecimal.valueOf(value);
  }

  private BigDecimal toBigDecimal(Double value) {
    return value == null ? null : BigDecimal.valueOf(value);
  }

  private BigDecimal toBigDecimal(Long value) {
    return value == null ? null : BigDecimal.valueOf(value);
  }

  private String blankToNull(String value) {
    return value == null || value.isBlank() ? null : value.trim();
  }
}
