package com.example.realestate.property;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface PropertyRepository extends JpaRepository<Property, Long>, JpaSpecificationExecutor<Property> {
  List<Property> findByOwnerIdOrderByCreatedAtDesc(Long ownerId);
  Optional<Property> findByIdAndOwnerId(Long id, Long ownerId);
  long countByStatus(PropertyStatus status);
}
