package com.example.realestate.org;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrganizationRepository extends JpaRepository<Organization, Long> {
  Optional<Organization> findByName(String name);
}
