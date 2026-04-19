package com.example.realestate.marketplace;

import java.util.List;

public record MarketplaceProfilePostsResponse(
    List<MarketplacePostResponse> userPosts,
    List<MarketplacePostResponse> savedPosts,
    List<MarketplaceDealResponse> deals
) {
}
