package com.example.realestate.supportchat;

import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/internal/support-chat")
public class SupportChatStaffController {

  private final SupportChatService supportChatService;

  public SupportChatStaffController(SupportChatService supportChatService) {
    this.supportChatService = supportChatService;
  }

  @GetMapping("/conversations")
  public Page<SupportConversationSummaryResponse> listConversations(
      @PageableDefault(size = 20) Pageable pageable,
      @RequestParam(value = "query", required = false) String query
  ) {
    return supportChatService.listStaffConversations(pageable, query);
  }

  @GetMapping("/conversations/{conversationId}")
  public SupportConversationDetailResponse getConversation(@PathVariable("conversationId") Long conversationId) {
    return supportChatService.getConversationForStaff(conversationId);
  }

  @PostMapping("/conversations/{conversationId}/messages")
  public SupportConversationDetailResponse sendMessage(
      @PathVariable("conversationId") Long conversationId,
      @Valid @RequestBody SupportChatMessageRequest request
  ) {
    return supportChatService.sendStaffMessage(conversationId, request);
  }
}
