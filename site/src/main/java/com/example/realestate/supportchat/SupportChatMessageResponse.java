package com.example.realestate.supportchat;

import java.time.Instant;

public record SupportChatMessageResponse(
    Long id,
    String text,
    Instant sentAt,
    String senderLabel,
    boolean mine
) {
}
