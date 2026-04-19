package com.example.realestate.marketplace;

import com.example.realestate.supportchat.SupportChatAgentResponse;
import java.time.Instant;

public record MarketplaceDealResponse(
    Long id,
    MarketplaceDealStatus status,
    String note,
    Instant createdAt,
    Instant updatedAt,
    Long postId,
    String postTitle,
    String postAddress,
    String city,
    Long price,
    String type,
    MarketplaceUserResponse customer,
    SupportChatAgentResponse assignedRealtor
) {
}
