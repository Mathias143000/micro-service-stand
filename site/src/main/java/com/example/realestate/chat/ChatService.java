package com.example.realestate.chat;

import com.example.realestate.deal.Deal;
import com.example.realestate.deal.DealRepository;
import com.example.realestate.security.StaffAccessService;
import com.example.realestate.user.User;
import com.example.realestate.user.UserRole;
import jakarta.transaction.Transactional;
import java.util.List;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import static org.springframework.http.HttpStatus.NOT_FOUND;

@Slf4j
@Service
public class ChatService {
  private final ChatRepository chatRepository;
  private final MessageRepository messageRepository;
  private final DealRepository dealRepository;
  private final StaffAccessService staffAccessService;

  public ChatService(ChatRepository chatRepository,
                     MessageRepository messageRepository,
                     DealRepository dealRepository,
                     StaffAccessService staffAccessService) {
    this.chatRepository = chatRepository;
    this.messageRepository = messageRepository;
    this.dealRepository = dealRepository;
    this.staffAccessService = staffAccessService;
  }

  public Chat getByDeal(Long dealId) {
    User current = currentStaff();
    Chat chat = chatRepository.findByDealId(dealId)
        .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Chat not found"));
    staffAccessService.ensureDealAccess(current, chat.getDeal());
    return chat;
  }

  @Transactional
  public Chat createForDeal(Long dealId) {
    User current = currentStaff();
    Deal deal = dealRepository.findById(dealId)
        .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Deal not found"));
    staffAccessService.ensureDealAccess(current, deal);

    return chatRepository.findByDealId(dealId).orElseGet(() -> {
      Chat chat = new Chat();
      chat.setDeal(deal);
      Chat saved = chatRepository.save(chat);
      log.info("Chat created for deal: {}", dealId);
      return saved;
    });
  }

  public List<ChatMessageResponse> listMessages(Long chatId) {
    User current = currentStaff();
    Chat chat = chatRepository.findById(chatId)
        .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Chat not found"));
    staffAccessService.ensureDealAccess(current, chat.getDeal());
    return messageRepository.findByChatIdOrderBySentAtAsc(chatId).stream()
        .map(this::toResponse)
        .toList();
  }

  @Transactional
  public ChatMessageResponse sendMessage(MessageRequest request) {
    User current = currentStaff();
    Chat chat = chatRepository.findById(request.getChatId())
        .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Chat not found"));
    staffAccessService.ensureDealAccess(current, chat.getDeal());

    Message message = new Message();
    message.setChat(chat);
    message.setSender(current);
    message.setText(request.getText());
    Message saved = messageRepository.save(message);
    log.info("Message sent: chat={}, sender={}", chat.getId(), current.getId());
    return toResponse(saved);
  }

  private User currentStaff() {
    User user = staffAccessService.requireCurrentStaffUser();
    staffAccessService.ensureAdminOrRealtor(user);
    return user;
  }

  private ChatMessageResponse toResponse(Message message) {
    User sender = message.getSender();
    String label = "Client";
    if (sender != null && sender.getRole() != null) {
      label = switch (sender.getRole()) {
        case ROLE_MARKETPLACE_USER -> "Client";
        case ROLE_ADMIN -> "Admin";
        case ROLE_REALTOR -> "Realtor";
        case ROLE_BANK_EMPLOYEE -> "Bank employee";
      };
    }
    return new ChatMessageResponse(message.getId(), message.getText(), message.getSentAt(), label);
  }
}
