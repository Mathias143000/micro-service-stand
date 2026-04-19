package com.example.realestate.payment;

import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
  @Override
  @EntityGraph(attributePaths = {"deal", "deal.property", "deal.buyerOrganization", "bankOrganization"})
  Optional<Payment> findById(Long id);

  @Override
  @EntityGraph(attributePaths = {"deal", "deal.property", "deal.buyerOrganization", "bankOrganization"})
  Page<Payment> findAll(Pageable pageable);

  @EntityGraph(attributePaths = {"deal", "deal.property", "deal.buyerOrganization", "bankOrganization"})
  Page<Payment> findByDealId(Long dealId, Pageable pageable);

  @EntityGraph(attributePaths = {"deal", "deal.property", "deal.buyerOrganization", "bankOrganization"})
  Page<Payment> findByBankOrganizationId(Long bankOrganizationId, Pageable pageable);

  @EntityGraph(attributePaths = {"deal", "deal.property", "deal.buyerOrganization", "bankOrganization"})
  Page<Payment> findByBankOrganizationIdAndDealId(Long bankOrganizationId, Long dealId, Pageable pageable);

  long countByStatus(PaymentStatus status);
}
