package com.example.realestate.marketplace;

import com.example.realestate.property.Property;
import com.example.realestate.property.PropertyRepository;
import com.example.realestate.property.PropertyStatus;
import com.example.realestate.property.PropertyType;
import com.example.realestate.security.StaffAccessService;
import com.example.realestate.supportchat.SupportChatAgentResponse;
import com.example.realestate.user.User;
import com.example.realestate.user.UserRepository;
import com.example.realestate.user.UserRole;
import jakarta.transaction.Transactional;
import jakarta.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Locale;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.FORBIDDEN;
import static org.springframework.http.HttpStatus.NOT_FOUND;
import static org.springframework.http.HttpStatus.UNAUTHORIZED;

@Service
public class MarketplaceDealService {

  private final MarketplaceDealRepository marketplaceDealRepository;
  private final PropertyRepository propertyRepository;
  private final UserRepository userRepository;
  private final MarketplaceAgentResolver marketplaceAgentResolver;
  private final StaffAccessService staffAccessService;

  public MarketplaceDealService(
      MarketplaceDealRepository marketplaceDealRepository,
      PropertyRepository propertyRepository,
      UserRepository userRepository,
      MarketplaceAgentResolver marketplaceAgentResolver,
      StaffAccessService staffAccessService
  ) {
    this.marketplaceDealRepository = marketplaceDealRepository;
    this.propertyRepository = propertyRepository;
    this.userRepository = userRepository;
    this.marketplaceAgentResolver = marketplaceAgentResolver;
    this.staffAccessService = staffAccessService;
  }

  @Transactional
  public MarketplaceDealResponse createCurrentUserDeal(MarketplaceDealRequest request) {
    User currentUser = requireMarketplaceUser();
    Property property = requireMarketplaceProperty(request.getPostId());

    if (property.getOwner() != null && currentUser.getId().equals(property.getOwner().getId())) {
      throw new ResponseStatusException(BAD_REQUEST, "You cannot open a deal for your own listing");
    }

    MarketplaceDeal existing = marketplaceDealRepository.findByCustomerIdAndPropertyId(currentUser.getId(), property.getId())
        .orElse(null);
    if (existing != null) {
      return toResponse(existing);
    }

    MarketplaceDeal deal = new MarketplaceDeal();
    deal.setCustomer(currentUser);
    deal.setProperty(property);
    deal.setAssignedRealtor(marketplaceAgentResolver.resolveAssignedRealtor());
    deal.setStatus(MarketplaceDealStatus.REQUESTED);
    deal.setNote(blankToNull(request.getNote()));
    return toResponse(marketplaceDealRepository.save(deal));
  }

  @Transactional
  public List<MarketplaceDealResponse> listCurrentUserDeals() {
    User currentUser = requireMarketplaceUser();
    return marketplaceDealRepository.findByCustomerIdOrderByCreatedAtDesc(currentUser.getId()).stream()
        .map(this::toResponse)
        .toList();
  }

  @Transactional
  public List<MarketplaceDealResponse> listStaffDeals() {
    return listStaffDeals(Pageable.unpaged(), null, null).getContent();
  }

  @Transactional
  public Page<MarketplaceDealResponse> listStaffDeals(Pageable pageable, MarketplaceDealStatus status, String query) {
    User currentUser = staffAccessService.requireCurrentStaffUser();
    staffAccessService.ensureAdminOrRealtor(currentUser);
    return marketplaceDealRepository
        .findAll(buildListSpecification(currentUser, status, query), pageable)
        .map(this::toResponse);
  }

  @Transactional
  public MarketplaceDealResponse updateStaffDealStatus(Long id, MarketplaceDealStatus status) {
    User currentUser = staffAccessService.requireCurrentStaffUser();
    staffAccessService.ensureAdminOrRealtor(currentUser);

    MarketplaceDeal deal = marketplaceDealRepository.findById(id)
        .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Marketplace deal not found"));

    ensureStaffDealAccess(currentUser, deal);
    deal.setStatus(status);
    return toResponse(deal);
  }

  public List<MarketplaceDealResponse> listCurrentUserDealsForProfile(User currentUser) {
    return marketplaceDealRepository.findByCustomerIdOrderByCreatedAtDesc(currentUser.getId()).stream()
        .map(this::toResponse)
        .toList();
  }

  private void ensureStaffDealAccess(User currentUser, MarketplaceDeal deal) {
    if (staffAccessService.isAdmin(currentUser)) {
      return;
    }

    if (deal.getAssignedRealtor() == null || !deal.getAssignedRealtor().getId().equals(currentUser.getId())) {
      throw new ResponseStatusException(FORBIDDEN, "Access denied");
    }
  }

  private Property requireMarketplaceProperty(Long id) {
    Property property = propertyRepository.findById(id)
        .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Post not found"));

    if (property.getOwner() == null || !property.isPublished() || property.getStatus() == PropertyStatus.ARCHIVED) {
      throw new ResponseStatusException(NOT_FOUND, "Post not found");
    }

    return property;
  }

  private User requireMarketplaceUser() {
    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
    if (authentication == null || authentication.getName() == null || authentication.getName().isBlank()) {
      throw new ResponseStatusException(UNAUTHORIZED, "Not authenticated");
    }

    User currentUser = userRepository.findByEmail(authentication.getName())
        .orElseThrow(() -> new ResponseStatusException(UNAUTHORIZED, "User not found"));
    if (currentUser.getRole() != UserRole.ROLE_MARKETPLACE_USER) {
      throw new ResponseStatusException(FORBIDDEN, "Marketplace access is only available for public users");
    }
    return currentUser;
  }

  private MarketplaceDealResponse toResponse(MarketplaceDeal deal) {
    Property property = deal.getProperty();
    User customer = deal.getCustomer();
    User assignedRealtor = deal.getAssignedRealtor();

    SupportChatAgentResponse assignedRealtorResponse = assignedRealtor == null
        ? null
        : new SupportChatAgentResponse(
            assignedRealtor.getId(),
            assignedRealtor.getUsername(),
            assignedRealtor.getEmail(),
            assignedRealtor.getAvatar()
        );

    return new MarketplaceDealResponse(
        deal.getId(),
        deal.getStatus(),
        deal.getNote(),
        deal.getCreatedAt(),
        deal.getUpdatedAt(),
        property.getId(),
        property.getTitle(),
        property.getAddress(),
        property.getCity(),
        toResponsePrice(property),
        toFrontType(property.getType()),
        new MarketplaceUserResponse(
            customer.getId(),
            displayUsername(customer),
            customer.getEmail(),
            customer.getAvatar(),
            customer.getPhone()
        ),
        assignedRealtorResponse
    );
  }

  private Long toResponsePrice(Property property) {
    BigDecimal price = property.getType() == PropertyType.FOR_RENT ? property.getRentPrice() : property.getPurchasePrice();
    if (price == null) {
      price = property.getPurchasePrice() != null ? property.getPurchasePrice() : property.getRentPrice();
    }
    return price == null ? 0L : price.setScale(0, RoundingMode.HALF_UP).longValue();
  }

  private String toFrontType(PropertyType type) {
    if (type == null) {
      return "buy";
    }
    return switch (type) {
      case FOR_RENT -> "rent";
      case BOTH, FOR_SALE -> "buy";
    };
  }

  private String displayUsername(User user) {
    if (user.getUsername() != null && !user.getUsername().isBlank()) {
      return user.getUsername();
    }
    if (user.getFullName() != null && !user.getFullName().isBlank()) {
      return user.getFullName();
    }
    return user.getEmail();
  }

  private String blankToNull(String value) {
    return value == null || value.trim().isEmpty() ? null : value.trim();
  }

  private Specification<MarketplaceDeal> buildListSpecification(User currentUser,
                                                                 MarketplaceDealStatus status,
                                                                 String query) {
    return (root, criteriaQuery, cb) -> {
      criteriaQuery.distinct(true);
      java.util.List<Predicate> predicates = new ArrayList<>();

      if (!staffAccessService.isAdmin(currentUser)) {
        predicates.add(cb.equal(root.get("assignedRealtor").get("id"), currentUser.getId()));
      }

      if (status != null) {
        predicates.add(cb.equal(root.get("status"), status));
      }

      if (query != null && !query.isBlank()) {
        String normalizedQuery = "%" + query.trim().toLowerCase(Locale.ROOT) + "%";
        java.util.List<Predicate> searchPredicates = new ArrayList<>();
        searchPredicates.add(cb.like(cb.lower(root.get("customer").get("username")), normalizedQuery));
        searchPredicates.add(cb.like(cb.lower(root.get("customer").get("email")), normalizedQuery));
        searchPredicates.add(cb.like(cb.lower(root.get("customer").get("fullName")), normalizedQuery));
        searchPredicates.add(cb.like(cb.lower(root.get("property").get("title")), normalizedQuery));
        searchPredicates.add(cb.like(cb.lower(root.get("property").get("address")), normalizedQuery));
        searchPredicates.add(cb.like(cb.lower(root.get("property").get("city")), normalizedQuery));

        Long numericQuery = parseLongSafely(query);
        if (numericQuery != null) {
          searchPredicates.add(cb.equal(root.get("id"), numericQuery));
          searchPredicates.add(cb.equal(root.get("property").get("id"), numericQuery));
          searchPredicates.add(cb.equal(root.get("customer").get("id"), numericQuery));
        }

        predicates.add(cb.or(searchPredicates.toArray(Predicate[]::new)));
      }

      return cb.and(predicates.toArray(Predicate[]::new));
    };
  }

  private Long parseLongSafely(String value) {
    try {
      return value == null ? null : Long.valueOf(value.trim());
    } catch (NumberFormatException ignored) {
      return null;
    }
  }
}
