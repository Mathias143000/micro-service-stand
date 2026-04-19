package com.example.realestate.marketplace;

import java.util.List;

public record MarketplacePostResponse(
    Long id,
    String title,
    Long price,
    List<String> images,
    List<MarketplaceImageResponse> imageGallery,
    String address,
    String city,
    Integer bedroom,
    Integer bathroom,
    String latitude,
    String longitude,
    String type,
    String property,
    Long userId,
    MarketplaceUserResponse user,
    MarketplacePostDetailResponse postDetail,
    boolean isSaved,
    Long savedPrice,
    boolean priceAlertEnabled,
    Long priceDropAmount,
    boolean priceDropDetected
) {
}
