package com.example.realestate.marketplace;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.ArrayList;
import java.util.List;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class MarketplacePostDataRequest {
  @NotBlank
  private String title;

  @NotNull
  private Long price;

  @NotBlank
  private String address;

  @NotBlank
  private String city;

  private Integer bedroom;
  private Integer bathroom;

  @NotBlank
  private String type;

  @NotBlank
  private String property;

  @NotBlank
  private String latitude;

  @NotBlank
  private String longitude;

  private Boolean published;

  private List<String> images = new ArrayList<>();
  private List<MarketplaceImageReferenceRequest> imageGallery = new ArrayList<>();
}
