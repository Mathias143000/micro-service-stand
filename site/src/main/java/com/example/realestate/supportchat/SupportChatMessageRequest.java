package com.example.realestate.supportchat;

import jakarta.validation.constraints.NotBlank;

public record SupportChatMessageRequest(
    @NotBlank(message = "Text is required")
    String text
) {
}
