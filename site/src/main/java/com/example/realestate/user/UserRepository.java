package com.example.realestate.user;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface UserRepository extends JpaRepository<User, Long>, JpaSpecificationExecutor<User> {
  Optional<User> findByEmail(String email);
  Optional<User> findByUsername(String username);
  Optional<User> findByEmailOrUsername(String email, String username);
  Optional<User> findByResetToken(String resetToken);
  boolean existsByEmail(String email);
  boolean existsByUsername(String username);
  boolean existsByRole(UserRole role);
  long countByRole(UserRole role);
  Optional<User> findFirstByRoleAndEnabledTrueOrderByIdAsc(UserRole role);
}
