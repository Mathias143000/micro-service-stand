package com.example.romanestate.authservice.user;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Long> {
  Optional<User> findByEmail(String email);
  Optional<User> findByUsername(String username);
  Optional<User> findByEmailOrUsername(String email, String username);
  Optional<User> findByResetToken(String resetToken);
  boolean existsByEmail(String email);
  boolean existsByUsername(String username);
}
