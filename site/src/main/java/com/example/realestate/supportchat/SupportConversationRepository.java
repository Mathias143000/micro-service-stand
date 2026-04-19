package com.example.realestate.supportchat;

import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface SupportConversationRepository extends JpaRepository<SupportConversation, Long>, JpaSpecificationExecutor<SupportConversation> {

  @EntityGraph(attributePaths = {"customer", "assignedRealtor"})
  Optional<SupportConversation> findByCustomerId(Long customerId);

  @EntityGraph(attributePaths = {"customer", "assignedRealtor"})
  List<SupportConversation> findByAssignedRealtorIdOrderByUpdatedAtDesc(Long assignedRealtorId);

  @Override
  @EntityGraph(attributePaths = {"customer", "assignedRealtor"})
  List<SupportConversation> findAll(Sort sort);

  long countByAssignedRealtorId(Long assignedRealtorId);
}
