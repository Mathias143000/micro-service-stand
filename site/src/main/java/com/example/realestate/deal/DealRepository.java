package com.example.realestate.deal;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface DealRepository extends JpaRepository<Deal, Long>, JpaSpecificationExecutor<Deal> {
  Page<Deal> findDistinctByPropertyOrganizationIdOrBuyerOrganizationId(
      Long propertyOrganizationId,
      Long buyerOrganizationId,
      Pageable pageable
  );

  long countByType(DealType type);
  long countByStatus(DealStatus status);
}
