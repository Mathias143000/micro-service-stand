package com.example.realestate.contract;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface ContractRepository extends JpaRepository<Contract, Long>, JpaSpecificationExecutor<Contract> {
  @EntityGraph(attributePaths = {"property", "sellerOrganization", "buyerOrganization"})
  Page<Contract> findBySellerOrganizationIdOrBuyerOrganizationId(
      Long sellerOrganizationId,
      Long buyerOrganizationId,
      Pageable pageable
  );

  @Override
  @EntityGraph(attributePaths = {"property", "sellerOrganization", "buyerOrganization"})
  Page<Contract> findAll(Pageable pageable);

  @Override
  @EntityGraph(attributePaths = {"property", "sellerOrganization", "buyerOrganization"})
  java.util.Optional<Contract> findById(Long id);

  long countByStatus(ContractStatus status);
}
