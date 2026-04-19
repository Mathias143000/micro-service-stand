package com.example.realestate.property;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PropertyPhotoRequest {
  @NotBlank
  private String path;
}
