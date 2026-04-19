package com.example.realestate.supportchat;

import com.example.realestate.marketplace.MarketplaceAgentResolver;
import com.example.realestate.security.StaffAccessService;
import com.example.realestate.user.User;
import com.example.realestate.user.UserRepository;
import com.example.realestate.user.UserRole;
import jakarta.transaction.Transactional;
import jakarta.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import static org.springframework.http.HttpStatus.FORBIDDEN;
import static org.springframework.http.HttpStatus.SERVICE_UNAVAILABLE;
import static org.springframework.http.HttpStatus.UNAUTHORIZED;

@Service
public class SupportChatService {

  private final SupportConversationRepository conversationRepository;
  private final SupportMessageRepository messageRepository;
  private final UserRepository userRepository;
  private final MarketplaceAgentResolver marketplaceAgentResolver;
  private final StaffAccessService staffAccessService;

  public SupportChatService(
      SupportConversationRepository conversationRepository,
      SupportMessageRepository messageRepository,
      UserRepository userRepository,
      MarketplaceAgentResolver marketplaceAgentResolver,
      StaffAccessService staffAccessService
  ) {
    this.conversationRepository = conversationRepository;
    this.messageRepository = messageRepository;
    this.userRepository = userRepository;
    this.marketplaceAgentResolver = marketplaceAgentResolver;
    this.staffAccessService = staffAccessService;
  }

  @Transactional
  public SupportChatResponse getCurrentConversation() {
    User currentUser = requireCurrentUser();
    SupportConversation conversation = conversationRepository.findByCustomerId(currentUser.getId())
        .orElseGet(() -> createConversation(currentUser));
    return toResponse(conversation, currentUser);
  }

  @Transactional
  public SupportChatResponse sendMessage(SupportChatMessageRequest request) {
    User currentUser = requireCurrentUser();
    SupportConversation conversation = conversationRepository.findByCustomerId(currentUser.getId())
        .orElseGet(() -> createConversation(currentUser));

    SupportMessage message = new SupportMessage();
    message.setConversation(conversation);
    message.setSender(currentUser);
    message.setText(request.text().trim());
    messageRepository.save(message);

    return toResponse(conversation, currentUser);
  }

  private SupportConversation createConversation(User currentUser) {
    User assignedRealtor = marketplaceAgentResolver.resolveAssignedRealtor();

    SupportConversation conversation = new SupportConversation();
    conversation.setCustomer(currentUser);
    conversation.setAssignedRealtor(assignedRealtor);
    SupportConversation savedConversation = conversationRepository.save(conversation);

    SupportMessage greeting = new SupportMessage();
    greeting.setConversation(savedConversation);
    greeting.setText("Здравствуйте! Напишите вопрос, и мы передадим его риелтору.");
    messageRepository.save(greeting);

    return savedConversation;
  }

  private SupportChatResponse toResponse(SupportConversation conversation, User currentUser) {
    SupportChatAgentResponse assignedRealtor = null;
    if (conversation.getAssignedRealtor() != null) {
      User realtor = conversation.getAssignedRealtor();
      assignedRealtor = new SupportChatAgentResponse(
          realtor.getId(),
          realtor.getUsername(),
          realtor.getEmail(),
          realtor.getAvatar()
      );
    }

    List<SupportChatMessageResponse> messages = messageRepository.findByConversationIdOrderByCreatedAtAsc(conversation.getId())
        .stream()
        .map(message -> new SupportChatMessageResponse(
            message.getId(),
            message.getText(),
            message.getCreatedAt(),
            resolveSenderLabel(message),
            message.getSender() != null && message.getSender().getId().equals(currentUser.getId())
        ))
        .toList();

    return new SupportChatResponse(conversation.getId(), assignedRealtor, messages);
  }

  @Transactional
  public List<SupportConversationSummaryResponse> listStaffConversations() {
    return listStaffConversations(Pageable.unpaged(), null).getContent();
  }

  @Transactional
  public Page<SupportConversationSummaryResponse> listStaffConversations(Pageable pageable, String query) {
    User currentUser = staffAccessService.requireCurrentStaffUser();
    staffAccessService.ensureAdminOrRealtor(currentUser);

    return conversationRepository
        .findAll(buildConversationSpecification(currentUser, query), pageable)
        .map(this::toSummaryResponse);
  }

  @Transactional
  public SupportConversationDetailResponse getConversationForStaff(Long conversationId) {
    User currentUser = staffAccessService.requireCurrentStaffUser();
    staffAccessService.ensureAdminOrRealtor(currentUser);

    SupportConversation conversation = requireConversationForStaff(currentUser, conversationId);
    return toStaffDetailResponse(conversation, currentUser);
  }

  @Transactional
  public SupportConversationDetailResponse sendStaffMessage(Long conversationId, SupportChatMessageRequest request) {
    User currentUser = staffAccessService.requireCurrentStaffUser();
    staffAccessService.ensureAdminOrRealtor(currentUser);

    SupportConversation conversation = requireConversationForStaff(currentUser, conversationId);

    SupportMessage message = new SupportMessage();
    message.setConversation(conversation);
    message.setSender(currentUser);
    message.setText(request.text().trim());
    messageRepository.save(message);

    return toStaffDetailResponse(conversation, currentUser);
  }

  private SupportConversation requireConversationForStaff(User currentUser, Long conversationId) {
    SupportConversation conversation = conversationRepository.findById(conversationId)
        .orElseThrow(() -> new ResponseStatusException(UNAUTHORIZED, "Conversation not found"));

    if (staffAccessService.isAdmin(currentUser)) {
      return conversation;
    }

    if (conversation.getAssignedRealtor() == null || !conversation.getAssignedRealtor().getId().equals(currentUser.getId())) {
      throw new ResponseStatusException(FORBIDDEN, "Access denied");
    }

    return conversation;
  }

  private SupportConversationSummaryResponse toSummaryResponse(SupportConversation conversation) {
    List<SupportMessage> messages = messageRepository.findByConversationIdOrderByCreatedAtAsc(conversation.getId());
    SupportMessage lastMessage = messages.isEmpty() ? null : messages.get(messages.size() - 1);
    return new SupportConversationSummaryResponse(
        conversation.getId(),
        toParticipant(conversation.getCustomer()),
        toParticipant(conversation.getAssignedRealtor()),
        lastMessage == null ? null : lastMessage.getText(),
        conversation.getUpdatedAt()
    );
  }

  private SupportConversationDetailResponse toStaffDetailResponse(SupportConversation conversation, User currentUser) {
    List<SupportChatMessageResponse> messages = messageRepository.findByConversationIdOrderByCreatedAtAsc(conversation.getId())
        .stream()
        .map(message -> new SupportChatMessageResponse(
            message.getId(),
            message.getText(),
            message.getCreatedAt(),
            resolveStaffSenderLabel(message),
            message.getSender() != null && message.getSender().getId().equals(currentUser.getId())
        ))
        .toList();

    return new SupportConversationDetailResponse(
        conversation.getId(),
        toParticipant(conversation.getCustomer()),
        toParticipant(conversation.getAssignedRealtor()),
        messages
    );
  }

  private SupportChatAgentResponse toParticipant(User user) {
    if (user == null) {
      return null;
    }
    return new SupportChatAgentResponse(
        user.getId(),
        user.getUsername(),
        user.getEmail(),
        user.getAvatar()
    );
  }

  private String resolveSenderLabel(SupportMessage message) {
    if (message.getSender() == null || message.getSender().getRole() == null) {
      return "RomanEstate";
    }

    return switch (message.getSender().getRole()) {
      case ROLE_MARKETPLACE_USER -> "You";
      case ROLE_REALTOR -> "Realtor";
      case ROLE_BANK_EMPLOYEE -> "Bank employee";
      case ROLE_ADMIN -> "Admin";
    };
  }

  private String resolveStaffSenderLabel(SupportMessage message) {
    if (message.getSender() == null || message.getSender().getRole() == null) {
      return "RomanEstate";
    }

    return switch (message.getSender().getRole()) {
      case ROLE_MARKETPLACE_USER -> message.getSender().getUsername() == null || message.getSender().getUsername().isBlank()
          ? "Customer"
          : message.getSender().getUsername();
      case ROLE_REALTOR -> "Realtor";
      case ROLE_BANK_EMPLOYEE -> "Bank employee";
      case ROLE_ADMIN -> "Admin";
    };
  }

  private User requireCurrentUser() {
    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
    if (authentication == null || authentication.getName() == null || authentication.getName().isBlank()) {
      throw new ResponseStatusException(UNAUTHORIZED, "Not authenticated");
    }

    User currentUser = userRepository.findByEmail(authentication.getName())
        .orElseThrow(() -> new ResponseStatusException(UNAUTHORIZED, "User not found"));
    if (currentUser.getRole() != UserRole.ROLE_MARKETPLACE_USER) {
      throw new ResponseStatusException(UNAUTHORIZED, "Support chat is available only for marketplace users");
    }
    return currentUser;
  }

  private Specification<SupportConversation> buildConversationSpecification(User currentUser, String query) {
    return (root, criteriaQuery, cb) -> {
      criteriaQuery.distinct(true);
      java.util.List<Predicate> predicates = new ArrayList<>();

      if (!staffAccessService.isAdmin(currentUser)) {
        predicates.add(cb.equal(root.get("assignedRealtor").get("id"), currentUser.getId()));
      }

      if (query != null && !query.isBlank()) {
        String normalizedQuery = "%" + query.trim().toLowerCase(Locale.ROOT) + "%";
        java.util.List<Predicate> searchPredicates = new ArrayList<>();
        searchPredicates.add(cb.like(cb.lower(root.get("customer").get("username")), normalizedQuery));
        searchPredicates.add(cb.like(cb.lower(root.get("customer").get("email")), normalizedQuery));
        searchPredicates.add(cb.like(cb.lower(root.get("customer").get("fullName")), normalizedQuery));

        Long numericQuery = parseLongSafely(query);
        if (numericQuery != null) {
          searchPredicates.add(cb.equal(root.get("id"), numericQuery));
          searchPredicates.add(cb.equal(root.get("customer").get("id"), numericQuery));
        }

        predicates.add(cb.or(searchPredicates.toArray(Predicate[]::new)));
      }

      return cb.and(predicates.toArray(Predicate[]::new));
    };
  }

  private Long parseLongSafely(String value) {
    try {
      return value == null ? null : Long.valueOf(value.trim());
    } catch (NumberFormatException ignored) {
      return null;
    }
  }
}
