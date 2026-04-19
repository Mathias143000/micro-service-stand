package com.example.realestate.marketplace;

public record MarketplaceUserResponse(
    Long id,
    String username,
    String email,
    String avatar,
    String mobile_number
) {
}
