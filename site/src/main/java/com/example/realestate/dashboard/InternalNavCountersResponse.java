package com.example.realestate.dashboard;

public record InternalNavCountersResponse(
    long openLeadCount,
    long supportConversationCount,
    long pendingCreditCount
) {
}
