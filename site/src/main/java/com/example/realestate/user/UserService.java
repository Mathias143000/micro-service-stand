package com.example.realestate.user;

import com.example.realestate.org.Organization;
import com.example.realestate.org.OrganizationRepository;
import com.example.realestate.security.StaffAccessService;
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
public class UserService {
  private final UserRepository userRepository;
  private final OrganizationRepository organizationRepository;
  private final StaffAccessService staffAccessService;

  public UserService(UserRepository userRepository,
                     OrganizationRepository organizationRepository,
                     StaffAccessService staffAccessService) {
    this.userRepository = userRepository;
    this.organizationRepository = organizationRepository;
    this.staffAccessService = staffAccessService;
  }

  public Page<UserResponse> list(Pageable pageable) {
    return list(pageable, null, null, null, null);
  }

  public Page<UserResponse> list(Pageable pageable,
                                 UserRole role,
                                 Boolean enabled,
                                 String query,
                                 Long organizationId) {
    currentAdmin();
    return userRepository.findAll(buildListSpecification(role, enabled, query, organizationId), pageable)
        .map(this::toResponse);
  }

  public UserResponse get(Long id) {
    return toResponse(getEntity(id));
  }

  @Transactional
  public UserResponse update(Long id, UserUpdateRequest request) {
    User target = getEntity(id);
    User currentAdmin = currentAdmin();

    target.setFullName(request.getFullName().trim());
    target.setPhone(blankToNull(request.getPhone()));
    target.setAvatar(blankToNull(request.getAvatar()));

    if (request.getUsername() != null) {
      String username = normalizeUsername(request.getUsername());
      if (username != null && !username.equals(target.getUsername()) && userRepository.existsByUsername(username)) {
        throw new ResponseStatusException(BAD_REQUEST, "Username already in use");
      }
      target.setUsername(username);
    }

    UserRole targetRole = request.getRole() == null ? target.getRole() : request.getRole();
    Organization organization = resolveOrganizationForRole(targetRole, request.getOrganizationId(), target.getOrganization());

    if (target.getRole() == UserRole.ROLE_ADMIN && targetRole != UserRole.ROLE_ADMIN && isLastAdmin(target)) {
      throw new ResponseStatusException(BAD_REQUEST, "At least one admin must remain enabled");
    }

    if (currentAdmin.getId().equals(target.getId()) && !request.isEnabled()) {
      throw new ResponseStatusException(FORBIDDEN, "You cannot disable your own account");
    }

    target.setRole(targetRole);
    target.setOrganization(organization);
    target.setEnabled(request.isEnabled());
    log.info("User updated: {}", target.getEmail());
    return toResponse(target);
  }

  @Transactional
  public void delete(Long id) {
    User target = getEntity(id);
    User currentAdmin = currentAdmin();

    if (currentAdmin.getId().equals(target.getId())) {
      throw new ResponseStatusException(FORBIDDEN, "You cannot delete your own account");
    }

    if (target.getRole() == UserRole.ROLE_ADMIN && isLastAdmin(target)) {
      throw new ResponseStatusException(BAD_REQUEST, "At least one admin must remain enabled");
    }

    userRepository.delete(target);
    log.info("User deleted: {}", target.getEmail());
  }

  private User currentAdmin() {
    User user = staffAccessService.requireCurrentStaffUser();
    if (!staffAccessService.isAdmin(user)) {
      throw new ResponseStatusException(FORBIDDEN, "Access denied");
    }
    return user;
  }

  private User getEntity(Long id) {
    return userRepository.findById(id)
        .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "User not found"));
  }

  private boolean isLastAdmin(User user) {
    return user.getRole() == UserRole.ROLE_ADMIN && userRepository.countByRole(UserRole.ROLE_ADMIN) <= 1;
  }

  private Organization resolveOrganizationForRole(UserRole role, Long requestedOrganizationId, Organization currentOrganization) {
    if (role == UserRole.ROLE_ADMIN || role == UserRole.ROLE_MARKETPLACE_USER) {
      if (requestedOrganizationId == null || requestedOrganizationId <= 0) {
        return null;
      }
      return organizationRepository.findById(requestedOrganizationId)
          .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Organization not found"));
    }

    Long organizationId = requestedOrganizationId;
    if ((organizationId == null || organizationId <= 0) && currentOrganization != null) {
      organizationId = currentOrganization.getId();
    }
    if (organizationId == null || organizationId <= 0) {
      throw new ResponseStatusException(BAD_REQUEST, "Organization is required for staff users");
    }

    return organizationRepository.findById(organizationId)
        .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Organization not found"));
  }

  private UserResponse toResponse(User user) {
    Organization organization = user.getOrganization();
    return new UserResponse(
        user.getId(),
        user.getUsername(),
        user.getEmail(),
        user.getFullName(),
        user.getPhone(),
        user.getAvatar(),
        user.getRole(),
        organization == null ? null : organization.getId(),
        organization == null ? null : organization.getName(),
        user.isEnabled(),
        user.getCreatedAt()
    );
  }

  private String normalizeUsername(String value) {
    return value == null || value.isBlank() ? null : value.trim();
  }

  private String blankToNull(String value) {
    return value == null || value.isBlank() ? null : value.trim();
  }

  private Specification<User> buildListSpecification(UserRole role,
                                                     Boolean enabled,
                                                     String query,
                                                     Long organizationId) {
    return (root, criteriaQuery, cb) -> {
      criteriaQuery.distinct(true);
      java.util.List<Predicate> predicates = new ArrayList<>();

      if (role != null) {
        predicates.add(cb.equal(root.get("role"), role));
      }

      if (enabled != null) {
        predicates.add(cb.equal(root.get("enabled"), enabled));
      }

      if (organizationId != null) {
        predicates.add(cb.equal(root.get("organization").get("id"), organizationId));
      }

      if (query != null && !query.isBlank()) {
        String normalizedQuery = "%" + query.trim().toLowerCase(Locale.ROOT) + "%";
        java.util.List<Predicate> searchPredicates = new ArrayList<>();
        searchPredicates.add(cb.like(cb.lower(root.get("fullName")), normalizedQuery));
        searchPredicates.add(cb.like(cb.lower(root.get("email")), normalizedQuery));
        searchPredicates.add(cb.like(cb.lower(root.get("username")), normalizedQuery));
        searchPredicates.add(cb.like(cb.lower(root.get("organization").get("name")), normalizedQuery));

        Long numericQuery = parseLongSafely(query);
        if (numericQuery != null) {
          searchPredicates.add(cb.equal(root.get("id"), numericQuery));
          searchPredicates.add(cb.equal(root.get("organization").get("id"), numericQuery));
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
