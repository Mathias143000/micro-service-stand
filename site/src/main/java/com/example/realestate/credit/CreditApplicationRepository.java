package com.example.realestate.credit;

import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CreditApplicationRepository extends JpaRepository<CreditApplication, Long> {
  boolean existsByDealId(Long dealId);

  @EntityGraph(attributePaths = {"deal", "deal.property", "deal.buyerOrganization"})
  Optional<CreditApplication> findByDealId(Long dealId);

  @EntityGraph(attributePaths = {"deal", "deal.property", "deal.buyerOrganization"})
  Page<CreditApplication> findByDealId(Long dealId, Pageable pageable);

  @EntityGraph(attributePaths = {"deal", "deal.property", "deal.buyerOrganization", "bankOrganization"})
  Page<CreditApplication> findByBankOrganizationId(Long bankOrganizationId, Pageable pageable);

  @EntityGraph(attributePaths = {"deal", "deal.property", "deal.buyerOrganization", "bankOrganization"})
  Page<CreditApplication> findByBankOrganizationIdAndDealId(Long bankOrganizationId, Long dealId, Pageable pageable);

  @EntityGraph(attributePaths = {"deal", "deal.property", "deal.buyerOrganization", "bankOrganization"})
  Page<CreditApplication> findByBankOrganizationIdOrBankOrganizationIsNull(Long bankOrganizationId, Pageable pageable);

  @EntityGraph(attributePaths = {"deal", "deal.property", "deal.buyerOrganization", "bankOrganization"})
  Page<CreditApplication> findByDealIdAndBankOrganizationIdOrDealIdAndBankOrganizationIsNull(
      Long dealId,
      Long bankOrganizationId,
      Long sameDealId,
      Pageable pageable
  );

  @Override
  @EntityGraph(attributePaths = {"deal", "deal.property", "deal.buyerOrganization", "bankOrganization"})
  Optional<CreditApplication> findById(Long id);

  @Override
  @EntityGraph(attributePaths = {"deal", "deal.property", "deal.buyerOrganization", "bankOrganization"})
  Page<CreditApplication> findAll(Pageable pageable);

  long countByStatus(CreditStatus status);

  long countByBankOrganizationIdAndStatus(Long bankOrganizationId, CreditStatus status);

  long countByBankOrganizationIsNullAndStatus(CreditStatus status);
}
