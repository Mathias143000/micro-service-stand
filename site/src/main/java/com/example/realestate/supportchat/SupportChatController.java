package com.example.realestate.supportchat;

import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/support-chat")
public class SupportChatController {

  private final SupportChatService supportChatService;

  public SupportChatController(SupportChatService supportChatService) {
    this.supportChatService = supportChatService;
  }

  @GetMapping
  public SupportChatResponse currentConversation() {
    return supportChatService.getCurrentConversation();
  }

  @PostMapping("/messages")
  public SupportChatResponse sendMessage(@Valid @RequestBody SupportChatMessageRequest request) {
    return supportChatService.sendMessage(request);
  }
}
