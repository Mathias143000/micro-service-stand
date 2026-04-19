package com.example.romanestate.authservice.user;

import com.example.romanestate.authservice.org.Organization;
import com.example.romanestate.authservice.org.OrganizationRepository;
import com.example.romanestate.authservice.security.JwtTokenProvider;
import jakarta.transaction.Transactional;
import java.time.Instant;
import java.util.Locale;
import java.util.UUID;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.FORBIDDEN;
import static org.springframework.http.HttpStatus.NOT_FOUND;
import static org.springframework.http.HttpStatus.UNAUTHORIZED;

@Slf4j
@Service
public class AuthService {
  private final UserRepository userRepository;
  private final OrganizationRepository organizationRepository;
  private final PasswordEncoder passwordEncoder;
  private final AuthenticationManager authenticationManager;
  private final JwtTokenProvider tokenProvider;

  public AuthService(
      UserRepository userRepository,
      OrganizationRepository organizationRepository,
      PasswordEncoder passwordEncoder,
      AuthenticationManager authenticationManager,
      JwtTokenProvider tokenProvider
  ) {
    this.userRepository = userRepository;
    this.organizationRepository = organizationRepository;
    this.passwordEncoder = passwordEncoder;
    this.authenticationManager = authenticationManager;
    this.tokenProvider = tokenProvider;
  }

  @Transactional
  public String register(RegisterRequest request) {
    ensureCurrentUserIsAdmin();

    String email = normalizeEmail(request.getEmail());
    if (userRepository.existsByEmail(email)) {
      throw new ResponseStatusException(BAD_REQUEST, "Email already in use");
    }

    String username = normalizeUsername(request.getUsername());
    if (username != null && userRepository.existsByUsername(username)) {
      throw new ResponseStatusException(BAD_REQUEST, "Username already in use");
    }

    UserRole role = resolveRequestedInternalRole(request);
    Organization organization = resolveOrganizationForRole(role, request.getOrganizationId());

    User user = new User();
    user.setEmail(email);
    user.setUsername(username);
    user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
    user.setFullName(resolveFullName(request, email));
    user.setPhone(blankToNull(request.getPhone()));
    user.setAvatar(blankToNull(request.getAvatar()));
    user.setRole(role);
    user.setOrganization(organization);
    user.setEnabled(true);

    User saved = userRepository.save(user);
    log.info("Internal user registered: {}", saved.getEmail());
    return issueToken(saved);
  }

  public String login(LoginRequest request) {
    String identifier = resolveLoginIdentifier(request);
    User user = userRepository.findByEmailOrUsername(identifier, identifier)
        .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "User not found"));

    ensureInternalUser(user, "Use the public marketplace login");

    try {
      authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(identifier, request.getPassword()));
      log.info("Internal user logged in: {}", user.getEmail());
      return issueToken(user);
    } catch (AuthenticationException ex) {
      throw new ResponseStatusException(UNAUTHORIZED, "Invalid credentials");
    }
  }

  public UserResponse currentInternalUser() {
    User user = requireCurrentUser();
    ensureInternalUser(user, "Marketplace users do not have access to the internal panel");
    return toResponse(user);
  }

  @Transactional
  public String requestPasswordReset(PasswordResetRequest request) {
    User user = userRepository.findByEmail(normalizeEmail(request.getEmail()))
        .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "User not found"));
    String token = UUID.randomUUID().toString();
    user.setResetToken(token);
    user.setResetTokenExpiresAt(Instant.now().plusSeconds(30 * 60));
    log.info("Password reset requested for: {}", user.getEmail());
    return token;
  }

  @Transactional
  public void confirmPasswordReset(PasswordResetConfirmRequest request) {
    User user = userRepository.findByResetToken(request.getToken())
        .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Invalid reset token"));

    if (user.getResetTokenExpiresAt() == null || user.getResetTokenExpiresAt().isBefore(Instant.now())) {
      throw new ResponseStatusException(BAD_REQUEST, "Reset token expired");
    }

    user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
    user.setResetToken(null);
    user.setResetTokenExpiresAt(null);
    log.info("Password reset confirmed for: {}", user.getEmail());
  }

  private boolean isCurrentUserAdmin() {
    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
    if (authentication == null || !authentication.isAuthenticated()) {
      return false;
    }

    return authentication.getAuthorities().stream()
        .anyMatch(authority -> UserRole.ROLE_ADMIN.name().equals(authority.getAuthority()));
  }

  private void ensureCurrentUserIsAdmin() {
    if (!isCurrentUserAdmin()) {
      throw new ResponseStatusException(FORBIDDEN, "Only admin can create internal users");
    }
  }

  private UserRole resolveRequestedInternalRole(RegisterRequest request) {
    UserRole requestedRole = request.getRole();
    if (requestedRole == null || requestedRole == UserRole.ROLE_MARKETPLACE_USER) {
      throw new ResponseStatusException(BAD_REQUEST, "Internal registration requires a staff role");
    }
    return requestedRole;
  }

  private Organization resolveOrganizationForRole(UserRole role, Long organizationId) {
    if (role == UserRole.ROLE_ADMIN) {
      if (organizationId == null || organizationId <= 0) {
        return null;
      }
      return loadOrganization(organizationId);
    }

    if (organizationId == null || organizationId <= 0) {
      throw new ResponseStatusException(BAD_REQUEST, "Organization is required for staff users");
    }

    return loadOrganization(organizationId);
  }

  private Organization loadOrganization(Long organizationId) {
    return organizationRepository.findById(organizationId)
        .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Organization not found"));
  }

  private void ensureInternalUser(User user, String errorMessage) {
    if (user.getRole() == UserRole.ROLE_MARKETPLACE_USER) {
      throw new ResponseStatusException(FORBIDDEN, errorMessage);
    }
  }

  private String issueToken(User user) {
    return tokenProvider.generateToken(user.getEmail(), user.getRole().name());
  }

  private User requireCurrentUser() {
    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
    if (authentication == null || !authentication.isAuthenticated() || authentication.getName() == null) {
      throw new ResponseStatusException(UNAUTHORIZED, "Authentication required");
    }

    String identifier = normalizeEmail(authentication.getName());
    return userRepository.findByEmail(identifier)
        .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "User not found"));
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

  private String resolveLoginIdentifier(LoginRequest request) {
    String email = normalizeEmail(request.getEmail());
    if (email != null) {
      return email;
    }

    String username = normalizeUsername(request.getUsername());
    if (username != null) {
      return username;
    }

    throw new ResponseStatusException(BAD_REQUEST, "Email or username is required");
  }

  private String resolveFullName(RegisterRequest request, String email) {
    if (blankToNull(request.getFullName()) != null) {
      return request.getFullName().trim();
    }
    if (blankToNull(request.getUsername()) != null) {
      return request.getUsername().trim();
    }
    return email;
  }

  private String normalizeEmail(String value) {
    return value == null || value.isBlank() ? null : value.trim().toLowerCase(Locale.ROOT);
  }

  private String normalizeUsername(String value) {
    return value == null || value.isBlank() ? null : value.trim();
  }

  private String blankToNull(String value) {
    return value == null || value.isBlank() ? null : value.trim();
  }
}
