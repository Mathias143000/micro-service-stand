package com.example.realestate.marketplace;

public record MarketplaceAuthResponse(
    Long id,
    String username,
    String email,
    String avatar,
    String mobile_number,
    String token
) {
}
