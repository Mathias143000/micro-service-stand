package com.example.realestate.chat;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class MessageRequest {
  @NotNull
  private Long chatId;

  @NotBlank
  private String text;
}
