package com.example.realestate.security;

import com.example.realestate.contract.Contract;
import com.example.realestate.deal.Deal;
import com.example.realestate.org.Organization;
import com.example.realestate.property.Property;
import com.example.realestate.user.User;
import com.example.realestate.user.UserRepository;
import com.example.realestate.user.UserRole;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import static org.springframework.http.HttpStatus.FORBIDDEN;

@Service
public class StaffAccessService {
  private final UserRepository userRepository;

  public StaffAccessService(UserRepository userRepository) {
    this.userRepository = userRepository;
  }

  public User requireCurrentStaffUser() {
    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
    if (authentication == null || authentication.getName() == null || authentication.getName().isBlank()) {
      throw new ResponseStatusException(FORBIDDEN, "Access denied");
    }

    User user = userRepository.findByEmail(authentication.getName())
        .orElseThrow(() -> new ResponseStatusException(FORBIDDEN, "Access denied"));
    if (user.getRole() == null || user.getRole() == UserRole.ROLE_MARKETPLACE_USER) {
      throw new ResponseStatusException(FORBIDDEN, "Access denied");
    }

    if (!isAdmin(user) && (user.getOrganization() == null || user.getOrganization().getId() == null)) {
      throw new ResponseStatusException(FORBIDDEN, "User organization is required");
    }

    return user;
  }

  public boolean isAdmin(User user) {
    return user.getRole() == UserRole.ROLE_ADMIN;
  }

  public boolean isRealtor(User user) {
    return user.getRole() == UserRole.ROLE_REALTOR;
  }

  public boolean isBankEmployee(User user) {
    return user.getRole() == UserRole.ROLE_BANK_EMPLOYEE;
  }

  public void ensureAdminOrRealtor(User user) {
    if (isAdmin(user) || isRealtor(user)) {
      return;
    }

    throw new ResponseStatusException(FORBIDDEN, "Access denied");
  }

  public void ensureAdminOrBank(User user) {
    if (isAdmin(user) || isBankEmployee(user)) {
      return;
    }

    throw new ResponseStatusException(FORBIDDEN, "Access denied");
  }

  public Long requireOrganizationId(User user) {
    if (user.getOrganization() == null || user.getOrganization().getId() == null) {
      throw new ResponseStatusException(FORBIDDEN, "User organization is required");
    }

    return user.getOrganization().getId();
  }

  public void ensureOrganizationAccess(User user, Long organizationId) {
    if (isAdmin(user)) {
      return;
    }

    Long currentOrganizationId = requireOrganizationId(user);
    if (organizationId == null || !organizationId.equals(currentOrganizationId)) {
      throw new ResponseStatusException(FORBIDDEN, "Access denied");
    }
  }

  public void ensurePropertyAccess(User user, Property property) {
    if (isAdmin(user)) {
      return;
    }

    ensureAdminOrRealtor(user);
    Long propertyOrganizationId = property.getOrganization() == null ? null : property.getOrganization().getId();
    ensureOrganizationAccess(user, propertyOrganizationId);
  }

  public void ensureDealAccess(User user, Deal deal) {
    if (isAdmin(user)) {
      return;
    }

    ensureAdminOrRealtor(user);

    Long currentOrganizationId = requireOrganizationId(user);
    Long buyerOrganizationId = deal.getBuyerOrganization() == null ? null : deal.getBuyerOrganization().getId();
    Long propertyOrganizationId = deal.getProperty() != null && deal.getProperty().getOrganization() != null
        ? deal.getProperty().getOrganization().getId()
        : null;

    if (!currentOrganizationId.equals(buyerOrganizationId) && !currentOrganizationId.equals(propertyOrganizationId)) {
      throw new ResponseStatusException(FORBIDDEN, "Access denied");
    }
  }

  public void ensureContractAccess(User user, Contract contract) {
    if (isAdmin(user)) {
      return;
    }

    ensureAdminOrRealtor(user);

    Long currentOrganizationId = requireOrganizationId(user);
    Long sellerOrganizationId = contract.getSellerOrganization() == null ? null : contract.getSellerOrganization().getId();
    Long buyerOrganizationId = contract.getBuyerOrganization() == null ? null : contract.getBuyerOrganization().getId();

    if (!currentOrganizationId.equals(sellerOrganizationId) && !currentOrganizationId.equals(buyerOrganizationId)) {
      throw new ResponseStatusException(FORBIDDEN, "Access denied");
    }
  }

  public void ensureBankOrganizationAccess(User user, Organization bankOrganization) {
    if (isAdmin(user)) {
      return;
    }

    ensureAdminOrBank(user);
    Long organizationId = bankOrganization == null ? null : bankOrganization.getId();
    ensureOrganizationAccess(user, organizationId);
  }
}
