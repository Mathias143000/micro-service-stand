package com.example.realestate.marketplace;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class MarketplacePostDetailRequest {
  private String desc;
  private String utilities;
  private String pet;
  private String income;
  private Integer size;
  private Integer school;
  private Integer bus;
  private Integer restaurant;
}
