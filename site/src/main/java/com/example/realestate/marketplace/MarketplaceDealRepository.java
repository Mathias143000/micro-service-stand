package com.example.realestate.marketplace;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface MarketplaceDealRepository extends JpaRepository<MarketplaceDeal, Long>, JpaSpecificationExecutor<MarketplaceDeal> {

  @EntityGraph(attributePaths = {"customer", "property", "property.owner", "assignedRealtor"})
  Optional<MarketplaceDeal> findByCustomerIdAndPropertyId(Long customerId, Long propertyId);

  @EntityGraph(attributePaths = {"customer", "property", "property.owner", "assignedRealtor"})
  List<MarketplaceDeal> findByCustomerIdOrderByCreatedAtDesc(Long customerId);

  @EntityGraph(attributePaths = {"customer", "property", "property.owner", "assignedRealtor"})
  List<MarketplaceDeal> findByAssignedRealtorIdOrderByCreatedAtDesc(Long assignedRealtorId);

  @Override
  @EntityGraph(attributePaths = {"customer", "property", "property.owner", "assignedRealtor"})
  List<MarketplaceDeal> findAll(Sort sort);

  long countByStatusIn(Set<MarketplaceDealStatus> statuses);

  long countByAssignedRealtorIdAndStatusIn(Long assignedRealtorId, Set<MarketplaceDealStatus> statuses);
}
