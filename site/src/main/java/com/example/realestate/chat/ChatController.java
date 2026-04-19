package com.example.realestate.chat;

import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/chats")
public class ChatController {
  private final ChatService chatService;

  public ChatController(ChatService chatService) {
    this.chatService = chatService;
  }

  @PostMapping("/deal/{dealId}")
  public Chat createForDeal(@PathVariable("dealId") Long dealId) {
    return chatService.createForDeal(dealId);
  }

  @GetMapping("/deal/{dealId}")
  public Chat getByDeal(@PathVariable("dealId") Long dealId) {
    return chatService.getByDeal(dealId);
  }

  @GetMapping("/{chatId}/messages")
  public List<ChatMessageResponse> listMessages(@PathVariable("chatId") Long chatId) {
    return chatService.listMessages(chatId);
  }

  @PostMapping("/messages")
  public ChatMessageResponse sendMessage(@Valid @RequestBody MessageRequest request) {
    return chatService.sendMessage(request);
  }
}
