package com.example.realestate.supportchat;

import java.util.List;

public record SupportConversationDetailResponse(
    Long conversationId,
    SupportChatAgentResponse customer,
    SupportChatAgentResponse assignedRealtor,
    List<SupportChatMessageResponse> messages
) {
}
