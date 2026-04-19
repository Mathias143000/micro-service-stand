package com.example.realestate.chat;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MessageRepository extends JpaRepository<Message, Long> {
  List<Message> findByChatIdOrderBySentAtAsc(Long chatId);
}
