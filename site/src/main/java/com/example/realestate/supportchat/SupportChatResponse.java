package com.example.realestate.supportchat;

import java.util.List;

public record SupportChatResponse(
    Long conversationId,
    SupportChatAgentResponse assignedRealtor,
    List<SupportChatMessageResponse> messages
) {
}
