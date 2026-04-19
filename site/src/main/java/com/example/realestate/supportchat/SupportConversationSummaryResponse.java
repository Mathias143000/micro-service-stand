package com.example.realestate.supportchat;

import java.time.Instant;

public record SupportConversationSummaryResponse(
    Long conversationId,
    SupportChatAgentResponse customer,
    SupportChatAgentResponse assignedRealtor,
    String lastMessagePreview,
    Instant updatedAt
) {
}
