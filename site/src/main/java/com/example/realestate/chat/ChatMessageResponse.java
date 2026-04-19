package com.example.realestate.chat;

import java.time.Instant;

public record ChatMessageResponse(
    Long id,
    String text,
    Instant sentAt,
    String roleLabel
) {}

