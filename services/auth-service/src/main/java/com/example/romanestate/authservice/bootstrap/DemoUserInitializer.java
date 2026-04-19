package com.example.romanestate.authservice.bootstrap;

import com.example.romanestate.authservice.org.Organization;
import com.example.romanestate.authservice.org.OrganizationRepository;
import com.example.romanestate.authservice.user.User;
import com.example.romanestate.authservice.user.UserRepository;
import com.example.romanestate.authservice.user.UserRole;
import jakarta.transaction.Transactional;
import java.util.Locale;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DemoUserInitializer implements ApplicationRunner {

  private final UserRepository userRepository;
  private final OrganizationRepository organizationRepository;
  private final PasswordEncoder passwordEncoder;

  @Value("${app.demo-users.enabled:true}")
  private boolean demoUsersEnabled;

  public DemoUserInitializer(
      UserRepository userRepository,
      OrganizationRepository organizationRepository,
      PasswordEncoder passwordEncoder
  ) {
    this.userRepository = userRepository;
    this.organizationRepository = organizationRepository;
    this.passwordEncoder = passwordEncoder;
  }

  @Override
  @Transactional
  public void run(ApplicationArguments args) {
    if (!demoUsersEnabled) {
      return;
    }

    Organization realtyOrganization = ensureOrganization("Demo Realty");
    Organization bankOrganization = ensureOrganization("Demo Bank");

    upsertUser("marketuser@example.com", "marketuser", "Market User", "9000000001", UserRole.ROLE_MARKETPLACE_USER, null);
    upsertUser("admin@example.com", "admin", "Platform Admin", "9000000002", UserRole.ROLE_ADMIN, null);
    upsertUser("realtor@example.com", "realtor", "Demo Realtor", "9000000003", UserRole.ROLE_REALTOR, realtyOrganization);
    upsertUser("bank@example.com", "banker", "Demo Bank Employee", "9000000004", UserRole.ROLE_BANK_EMPLOYEE, bankOrganization);
  }

  private Organization ensureOrganization(String name) {
    return organizationRepository.findByName(name)
        .map(existing -> {
          if (existing.getTaxId() == null || existing.getTaxId().isBlank()) {
            existing.setTaxId(defaultTaxId(name));
            return organizationRepository.save(existing);
          }
          return existing;
        })
        .orElseGet(() -> {
          Organization organization = new Organization();
          organization.setName(name);
          organization.setTaxId(defaultTaxId(name));
          return organizationRepository.save(organization);
        });
  }

  private String defaultTaxId(String organizationName) {
    return organizationName.toLowerCase(Locale.ROOT).contains("bank") ? "BANK-DEMO-001" : "REALTY-DEMO-001";
  }

  private void upsertUser(
      String email,
      String username,
      String fullName,
      String phone,
      UserRole role,
      Organization organization
  ) {
    User user = userRepository.findByEmail(email.toLowerCase(Locale.ROOT)).orElseGet(User::new);
    user.setEmail(email.toLowerCase(Locale.ROOT));
    user.setUsername(username);
    user.setFullName(fullName);
    user.setPhone(phone);
    user.setRole(role);
    user.setEnabled(true);
    user.setOrganization(organization);
    user.setPasswordHash(passwordEncoder.encode("Password123!"));
    userRepository.save(user);
  }
}
