package com.example.realestate.marketplace;

public record MarketplacePostDetailResponse(
    String desc,
    String utilities,
    String pet,
    String income,
    Integer size,
    Integer school,
    Integer bus,
    Integer restaurant
) {
}
